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
        group:groups!group_id(
          *,
          member_count:group_members(count),
          prayer_count:prayers(count)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    return data?.map(item => item.group).filter(Boolean) as Group[] || [];
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
    return data;
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
        privacy_level: group.privacy_level,
        location_city: group.location?.city,
        location_lat: group.location?.lat,
        location_lon: group.location?.lon,
        location_granularity: group.location?.granularity || 'hidden',
        tags: group.tags || [],
        avatar_url: group.avatar_url,
        created_by: user.id,
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

    return data;
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
    return data;
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
        status: 'active',
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
      .update({ status: 'inactive' })
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
        status: 'active',
      });

    if (error) throw error;
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .update({ status: 'inactive' })
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
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Search groups
   */
  async searchGroups(query: string, filters?: {
    privacy_level?: 'public' | 'private';
    location?: string;
    tags?: string[];
  }): Promise<Group[]> {
    let supabaseQuery = supabase
      .from('groups')
      .select(`
        *,
        member_count:group_members(count),
        prayer_count:prayers(count)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (filters?.privacy_level) {
      supabaseQuery = supabaseQuery.eq('privacy_level', filters.privacy_level);
    }

    if (filters?.location) {
      supabaseQuery = supabaseQuery.ilike('location_city', `%${filters.location}%`);
    }

    if (filters?.tags?.length) {
      supabaseQuery = supabaseQuery.contains('tags', filters.tags);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get trending groups
   */
  async getTrendingGroups(limit = 10): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        member_count:group_members(count),
        prayer_count:prayers(count)
      `)
      .eq('privacy_level', 'public')
      .order('member_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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
    return data || [];
  }
}

// Export singleton instance
export const groupService = new GroupService();