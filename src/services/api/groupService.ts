import { supabase } from '@/config/supabase';
import { Group, CreateGroupRequest, GroupMember } from '@/types/database.types';

/**
 * Group Service - Manages group-related API operations
 */
class GroupService {
  /**
   * Fetch user's groups
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        group:groups!group_id(
          *,
          member_count:group_members(count),
          prayer_count:prayers(count)
        )
      `)
      .eq('user_id', userId)

    if (error) throw error;
    
    // Fix count aggregations and add user membership info
    return (data?.map((item: any) => ({
      ...item.group,
      member_count: typeof item.group.member_count === 'object' ? item.group.member_count?.count || 0 : item.group.member_count || 0,
      prayer_count: typeof item.group.prayer_count === 'object' ? item.group.prayer_count?.count || 0 : item.group.prayer_count || 0,
      isJoined: true, // User is a member since we fetched from group_members
      user_membership: {
        id: item.id,
        group_id: item.group_id,
        user_id: item.user_id,
        role: item.role,
        joined_at: item.joined_at,
        last_active: item.last_active,
        notifications_enabled: item.notifications_enabled,
      }
    })).filter(Boolean) || []) as Group[];
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
        member_count:group_members(count),
        prayer_count:prayers(count)
      `)
      .eq('id', groupId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Group not found');
    
    // Fix count aggregations - Supabase returns {count: number} objects
    return {
      ...data,
      member_count: typeof data.member_count === 'object' ? data.member_count?.count || 0 : data.member_count || 0,
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
        privacy: group.privacy_level,
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

    // Fix count aggregations - Supabase returns {count: number} objects
    return {
      ...data,
      member_count: typeof data.member_count === 'object' ? data.member_count?.count || 0 : data.member_count || 0,
      prayer_count: typeof data.prayer_count === 'object' ? data.prayer_count?.count || 0 : data.prayer_count || 0,
    };
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
        member_count:group_members(count),
        prayer_count:prayers(count)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update group');
    
    // Fix count aggregations - Supabase returns {count: number} objects
    return {
      ...data,
      member_count: typeof data.member_count === 'object' ? data.member_count?.count || 0 : data.member_count || 0,
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
    privacy_level?: 'public' | 'private';
    location?: string;
    tags?: string[];
  }): Promise<Group[]> {
    let supabaseQuery = supabase
      .from('groups')
      .select(`
        *,
        member_count:group_members(count),
        prayer_count:prayers(count),
        user_membership:group_members!left(
          id,
          user_id,
          role,
          joined_at
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (filters?.privacy_level) {
      supabaseQuery = supabaseQuery.eq('privacy', filters.privacy_level);
    }

    if (filters?.tags?.length) {
      supabaseQuery = supabaseQuery.contains('tags', filters.tags);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    
    // Fix count aggregations and add membership status
    return (data || []).map((group: any) => ({
      ...group,
      member_count: typeof group.member_count === 'object' ? group.member_count?.count || 0 : group.member_count || 0,
      prayer_count: typeof group.prayer_count === 'object' ? group.prayer_count?.count || 0 : group.prayer_count || 0,
      isJoined: userId ? group.user_membership?.some((member: any) => member.user_id === userId) : false,
      user_membership: userId ? group.user_membership?.find((member: any) => member.user_id === userId) : undefined,
    }));
  }

  /**
   * Get trending groups with user membership status
   */
  async getTrendingGroups(limit = 10, userId?: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        member_count:group_members(count),
        prayer_count:prayers(count),
        user_membership:group_members!left(
          id,
          user_id,
          role,
          joined_at
        )
      `)
      .eq('privacy', 'public')
      .order('member_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Fix count aggregations and add membership status
    return (data || []).map((group: any) => ({
      ...group,
      member_count: typeof group.member_count === 'object' ? group.member_count?.count || 0 : group.member_count || 0,
      prayer_count: typeof group.prayer_count === 'object' ? group.prayer_count?.count || 0 : group.prayer_count || 0,
      isJoined: userId ? group.user_membership?.some((member: any) => member.user_id === userId) : false,
      user_membership: userId ? group.user_membership?.find((member: any) => member.user_id === userId) : undefined,
    }));
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
        interaction_count:interactions(count),
        comment_count:comments(count)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    
    // Fix count aggregations - Supabase returns {count: number} objects
    return (data || []).map((prayer: any) => ({
      ...prayer,
      interaction_count: typeof prayer.interaction_count === 'object' ? prayer.interaction_count?.count || 0 : prayer.interaction_count || 0,
      comment_count: typeof prayer.comment_count === 'object' ? prayer.comment_count?.count || 0 : prayer.comment_count || 0,
    }));
  }
}

// Export singleton instance
export const groupService = new GroupService();