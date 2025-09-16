import { supabase } from '@/config/supabase';
import { Group, CreateGroupRequest, GroupMember } from '@/types/database.types';
import { BaseRepositoryImpl } from './base.repository';

/**
 * Group Repository
 * Handles all group-related database operations
 */
export class GroupRepository extends BaseRepositoryImpl<Group> {
  constructor() {
    super('groups');
  }

  /**
   * Get user's groups with member and prayer counts in a single query
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        group:groups!group_id(
          *,
          members:group_members(
            *
          ),
          prayer_count:prayers(count)
        )
      `)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'getUserGroups');
    }

    return (data?.map(item => {
      // Get actual member count by counting the members array
      const memberCount = item.group.members ? item.group.members.length : 0;
      
      return {
        ...item.group,
        member_count: memberCount,
        prayer_count: typeof item.group.prayer_count === 'object' 
          ? item.group.prayer_count?.count || 0 
          : item.group.prayer_count || 0,
        user_membership: {
          id: item.id,
          group_id: item.group_id,
          user_id: item.user_id,
          role: item.role,
          joined_at: item.joined_at,
          last_active: item.last_active,
          notifications_enabled: item.notifications_enabled,
        }
      };
    }).filter(Boolean) || []) as Group[];
  }

  /**
   * Get group with all related data in one query
   */
  async getGroupWithDetails(groupId: string, userId?: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        creator:profiles!creator_id(
          id,
          display_name,
          avatar_url
        ),
        members:group_members(
          *,
          user:profiles!user_id(*)
        ),
        prayer_count:prayers(count),
        user_membership:group_members!user_membership(
          *
        )
      `)
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      this.handleError(error, `getGroupWithDetails(${groupId})`);
    }

    if (!data) return null;

    // Get actual member count by counting the members array
    const memberCount = data.members ? data.members.length : 0;

    return {
      ...data,
      member_count: memberCount,
      prayer_count: typeof data.prayer_count === 'object' 
        ? data.prayer_count?.count || 0 
        : data.prayer_count || 0,
      creator: data.creator,
      user_membership: data.user_membership,
    };
  }

  /**
   * Create group with proper validation
   */
  async createGroup(groupData: CreateGroupRequest, userId: string): Promise<Group> {
    const group = {
      name: groupData.name,
      description: groupData.description,
      privacy: groupData.privacy,
      tags: groupData.tags || [],
      avatar_url: groupData.avatar_url,
      creator_id: userId,
    };

    const { data, error } = await supabase
      .from('groups')
      .insert(group)
      .select(`
        *,
        member_count:group_members(count),
        prayer_count:prayers(count)
      `)
      .single();

    if (error) {
      this.handleError(error, 'createGroup');
    }

    if (!data) {
      throw new Error('Failed to create group');
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: data.id,
        user_id: userId,
        role: 'admin',
      });

    if (memberError) {
      this.handleError(memberError, 'createGroup (add creator)');
    }

    // Fetch the group again to get the updated member count
    const { data: updatedGroup, error: fetchError } = await supabase
      .from('groups')
      .select(`
        *,
        member_count:group_members(count),
        prayer_count:prayers(count)
      `)
      .eq('id', data.id)
      .single();

    if (fetchError) {
      this.handleError(fetchError, 'createGroup (fetch updated)');
    }

    return {
      ...updatedGroup,
      member_count: typeof updatedGroup.member_count === 'object' 
        ? updatedGroup.member_count?.count || 0 
        : updatedGroup.member_count || 0,
      prayer_count: typeof updatedGroup.prayer_count === 'object' 
        ? updatedGroup.prayer_count?.count || 0 
        : updatedGroup.prayer_count || 0,
    };
  }

  /**
   * Join group
   */
  async joinGroup(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Already a member of this group');
      }
      this.handleError(error, 'joinGroup');
    }
  }

  /**
   * Leave group
   */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'leaveGroup');
    }
  }

  /**
   * Get group members with user details
   */
  async getGroupMembers(groupId: string, page = 1, limit = 50): Promise<GroupMember[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:profiles!user_id(
          id,
          display_name,
          avatar_url,
          last_active
        )
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleError(error, 'getGroupMembers');
    }

    return data || [];
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    groupId: string, 
    userId: string, 
    role: 'admin' | 'moderator' | 'member'
  ): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'updateMemberRole');
    }
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

    if (error) {
      this.handleError(error, 'removeMember');
    }
  }

  /**
   * Search groups with filters
   */
  async searchGroups(query: string, filters?: {
    privacy?: 'public' | 'private';
    tags?: string[];
  }): Promise<Group[]> {
    let supabaseQuery = supabase
      .from('groups')
      .select(`
        *,
        members:group_members(
          *
        ),
        prayer_count:prayers(count)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (filters?.privacy) {
      supabaseQuery = supabaseQuery.eq('privacy', filters.privacy);
    }

    if (filters?.tags?.length) {
      supabaseQuery = supabaseQuery.contains('tags', filters.tags);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      this.handleError(error, 'searchGroups');
    }

    return (data || []).map(group => {
      // Get actual member count by counting the members array
      const memberCount = group.members ? group.members.length : 0;
      
      return {
        ...group,
        member_count: memberCount,
        prayer_count: typeof group.prayer_count === 'object' 
          ? group.prayer_count?.count || 0 
          : group.prayer_count || 0,
      };
    });
  }

  /**
   * Get public groups for discovery
   */
  async getPublicGroups(page = 1, limit = 20): Promise<Group[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        creator:profiles!creator_id(
          id,
          display_name,
          avatar_url
        ),
        members:group_members(
          *
        ),
        prayer_count:prayers(count)
      `)
      .eq('privacy', 'public')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleError(error, 'getPublicGroups');
    }

    return (data || []).map(group => {
      // Get actual member count by counting the members array
      const memberCount = group.members ? group.members.length : 0;
      
      return {
        ...group,
        member_count: memberCount,
        prayer_count: typeof group.prayer_count === 'object'
          ? group.prayer_count?.count || 0
          : group.prayer_count || 0,
        creator: group.creator,
      };
    });
  }

  /**
   * Get trending groups with user membership status
   */
  async getTrendingGroups(limit = 10, userId?: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        members:group_members(
          *
        ),
        prayer_count:prayers(count)
      `)
      .eq('privacy', 'public')
      .limit(limit);

    if (error) {
      this.handleError(error, 'getTrendingGroups');
    }

    // Calculate member counts and sort by member count
    const groupsWithCounts = (data || []).map(group => {
      const memberCount = group.members ? group.members.length : 0;
      return {
        ...group,
        member_count: memberCount,
        prayer_count: typeof group.prayer_count === 'object' 
          ? group.prayer_count?.count || 0 
          : group.prayer_count || 0,
      };
    }).sort((a, b) => b.member_count - a.member_count);

    return await this.addMembershipStatusToGroups(groupsWithCounts, userId);
  }

  /**
   * Search groups with user membership status
   */
  async searchGroupsWithMembership(query: string, userId?: string, filters?: {
    privacy?: 'public' | 'private';
    tags?: string[];
  }): Promise<Group[]> {
    let supabaseQuery = supabase
      .from('groups')
      .select(`
        *,
        members:group_members(
          *
        ),
        prayer_count:prayers(count)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (filters?.privacy) {
      supabaseQuery = supabaseQuery.eq('privacy', filters.privacy);
    }

    if (filters?.tags?.length) {
      supabaseQuery = supabaseQuery.contains('tags', filters.tags);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      this.handleError(error, 'searchGroupsWithMembership');
    }

    // Calculate member counts
    const groupsWithCounts = (data || []).map(group => {
      const memberCount = group.members ? group.members.length : 0;
      return {
        ...group,
        member_count: memberCount,
        prayer_count: typeof group.prayer_count === 'object' 
          ? group.prayer_count?.count || 0 
          : group.prayer_count || 0,
      };
    });

    return await this.addMembershipStatusToGroups(groupsWithCounts, userId);
  }

  /**
   * Helper method to add membership status to groups
   */
  private async addMembershipStatusToGroups(groups: any[], userId?: string): Promise<Group[]> {
    const groupsWithMembership = groups.map(group => ({
      ...group,
      // Keep the member_count as is since it's already calculated correctly
      prayer_count: typeof group.prayer_count === 'object'
        ? group.prayer_count?.count || 0
        : group.prayer_count || 0,
    }));

    if (userId) {
      const groupIds = groupsWithMembership.map(g => g.id);
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, id, role, joined_at')
        .in('group_id', groupIds)
        .eq('user_id', userId);

      const membershipMap = (memberships || []).reduce((acc, m) => {
        acc[m.group_id] = m;
        return acc;
      }, {} as Record<string, any>);

      return groupsWithMembership.map(group => ({
        ...group,
        isJoined: Boolean(membershipMap[group.id]),
        user_membership: membershipMap[group.id] || undefined,
      }));
    } else {
      return groupsWithMembership.map(group => ({
        ...group,
        isJoined: false,
        user_membership: undefined,
      }));
    }
  }
}