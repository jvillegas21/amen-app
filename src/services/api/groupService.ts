import { supabase } from '@/config/supabase';
import { Group, CreateGroupRequest, GroupMember } from '@/types/database.types';
import { GroupRepository } from '@/repositories/group.repository';
import { InteractionRepository } from '@/repositories/interaction.repository';
import { ErrorTransformationService } from '@/services/errorTransformationService';
import { RepositoryFactory } from '@/repositories/base.repository';

/**
 * Group Service - Manages group-related API operations
 * Uses repository pattern for database operations and proper error handling
 */
class GroupService {
  private groupRepository: GroupRepository;
  private interactionRepository: InteractionRepository;

  constructor() {
    this.groupRepository = RepositoryFactory.getRepository(GroupRepository);
    this.interactionRepository = RepositoryFactory.getRepository(InteractionRepository);
  }
  /**
   * Fetch user's groups
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const groups = await this.groupRepository.getUserGroups(userId);
      return groups.map(group => ({
        ...group,
        isJoined: true, // User is a member since we fetched from group_members
      }));
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getUserGroups'));
    }
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        members:group_members(
          *,
          user:profiles!user_id(*)
        ),
        prayer_count:prayers(count)
      `)
      .eq('id', groupId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Group not found');

    // Get actual member count by counting the members array
    const memberCount = data.members ? data.members.length : 0;

    // Fix count aggregations - Supabase returns {count: number} objects
    return {
      ...data,
      member_count: memberCount,
      prayer_count: typeof data.prayer_count === 'object' ? data.prayer_count?.count || 0 : data.prayer_count || 0,
    };
  }

  /**
   * Create new group
   */
  async createGroup(group: CreateGroupRequest): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: group.name,
        description: group.description,
        privacy: group.privacy,
        tags: group.tags || [],
        avatar_url: group.avatar_url,
        creator_id: user.id,
      })
      .select(`
        *,
        member_count:group_members(count),
        prayer_count:prayers(count)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create group');

    // Add creator as admin member
    await this.addMember(data.id, user.id, 'admin');

    // Fetch the group again to get the updated member count
    const updatedGroup = await this.getGroup(data.id);

    return updatedGroup;
  }

  /**
   * Update group
   */
  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select(`
        *,
        members:group_members(
          *
        ),
        prayer_count:prayers(count)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update group');

    // Get actual member count by counting the members array
    const memberCount = data.members ? data.members.length : 0;

    // Fix count aggregations - Supabase returns {count: number} objects
    return {
      ...data,
      member_count: memberCount,
      prayer_count: typeof data.prayer_count === 'object' ? data.prayer_count?.count || 0 : data.prayer_count || 0,
    };
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  }

  /**
   * Join group
   */
  async joinGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      });

    if (error) throw error;
  }

  /**
   * Join group by invite code
   */
  async joinGroupByCode(inviteCode: string): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Find group by invite code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (groupError || !group) {
      throw new Error('Invalid invite code');
    }

    // 2. Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      throw new Error('You are already a member of this group');
    }

    // 3. Join group
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      });

    if (joinError) throw joinError;

    return group;
  }

  /**
   * Leave group
   */
  async leaveGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Add member to group
   */
  async addMember(groupId: string, userId: string, role: 'admin' | 'moderator' | 'member' = 'member'): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role,
      });

    if (error) throw error;
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Update member role
   */
  async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'moderator' | 'member'): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Search groups with user membership status
   */
  async searchGroups(query: string, userId?: string, filters?: {
    privacy?: 'public' | 'private';
    location?: string;
    tags?: string[];
  }): Promise<Group[]> {
    try {
      return await this.groupRepository.searchGroupsWithMembership(query, userId, filters);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'searchGroups'));
    }
  }

  /**
   * Get trending groups with user membership status
   */
  async getTrendingGroups(limit = 10, userId?: string): Promise<Group[]> {
    try {
      return await this.groupRepository.getTrendingGroups(limit, userId);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getTrendingGroups'));
    }
  }

  /**
   * Get group prayers
   */
  async getGroupPrayers(groupId: string, page = 1, limit = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        comment_count:comments(count)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Get interaction counts for all prayers using the interaction repository
    const prayerIds = (data || []).map(prayer => prayer.id);
    const { InteractionRepository } = await import('@/repositories/interaction.repository');
    const { RepositoryFactory } = await import('@/repositories/base.repository');
    const interactionRepo = RepositoryFactory.getRepository(InteractionRepository);
    const interactionCounts = await interactionRepo.getInteractionCountsForPrayers(prayerIds);

    // Fix count aggregations and merge interaction counts
    return (data || []).map((prayer: any) => ({
      ...prayer,
      comment_count: typeof prayer.comment_count === 'object' ? prayer.comment_count?.count || 0 : prayer.comment_count || 0,
      ...interactionCounts[prayer.id], // This adds pray_count, like_count, etc.
    }));
  }
}

// Export singleton instance
export const groupService = new GroupService();