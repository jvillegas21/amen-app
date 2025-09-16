import { supabase } from '@/config/supabase';
import { Profile } from '@/types/database.types';

export interface ContentReport {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_prayer_id?: string;
  reported_comment_id?: string;
  reported_group_id?: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  reason?: string;
  blocked_user?: Profile;
}

export interface ContentFilter {
  id: string;
  user_id: string;
  filter_type: 'keyword' | 'user' | 'category';
  filter_value: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Content Moderation Service - Manages content reporting, blocking, and filtering
 */
class ContentModerationService {
  /**
   * Report content or user
   */
  async reportContent(report: {
    reported_user_id?: string;
    reported_prayer_id?: string;
    reported_comment_id?: string;
    reported_group_id?: string;
    reason: ContentReport['reason'];
    description: string;
  }): Promise<ContentReport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: report.reported_user_id,
        reported_prayer_id: report.reported_prayer_id,
        reported_comment_id: report.reported_comment_id,
        reported_group_id: report.reported_group_id,
        reason: report.reason,
        description: report.description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create report');
    return data;
  }

  /**
   * Block a user
   */
  async blockUser(blockedUserId: string, reason?: string): Promise<BlockedUser> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already blocked
    const { data: existing } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId)
      .maybeSingle();

    if (existing) {
      throw new Error('User is already blocked');
    }

    const { data, error } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
        reason,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to block user');
    return data;
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockedUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId);

    if (error) throw error;
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        *,
        blocked_user:profiles!blocked_id(*)
      `)
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  /**
   * Create content filter
   */
  async createContentFilter(filter: {
    filter_type: ContentFilter['filter_type'];
    filter_value: string;
  }): Promise<ContentFilter> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('content_filters')
      .insert({
        user_id: user.id,
        filter_type: filter.filter_type,
        filter_value: filter.filter_value,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create content filter');
    return data;
  }

  /**
   * Get user's content filters
   */
  async getContentFilters(userId: string): Promise<ContentFilter[]> {
    const { data, error } = await supabase
      .from('content_filters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update content filter
   */
  async updateContentFilter(filterId: string, updates: Partial<ContentFilter>): Promise<ContentFilter> {
    const { data, error } = await supabase
      .from('content_filters')
      .update(updates)
      .eq('id', filterId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update content filter');
    return data;
  }

  /**
   * Delete content filter
   */
  async deleteContentFilter(filterId: string): Promise<void> {
    const { error } = await supabase
      .from('content_filters')
      .delete()
      .eq('id', filterId);

    if (error) throw error;
  }

  /**
   * Get user's reports
   */
  async getUserReports(userId: string): Promise<ContentReport[]> {
    const { data, error } = await supabase
      .from('content_reports')
      .select(`
        *,
        reported_user:profiles!reported_user_id(*),
        reported_prayer:prayers!reported_prayer_id(*),
        reported_comment:comments!reported_comment_id(*),
        reported_group:groups!reported_group_id(*)
      `)
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(userId: string): Promise<{
    totalReports: number;
    pendingReports: number;
    blockedUsers: number;
    activeFilters: number;
  }> {
    const [reports, blockedUsers, filters] = await Promise.all([
      supabase
        .from('content_reports')
        .select('status')
        .eq('reporter_id', userId),
      supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', userId),
      supabase
        .from('content_filters')
        .select('is_active')
        .eq('user_id', userId)
        .eq('is_active', true),
    ]);

    if (reports.error) throw reports.error;
    if (blockedUsers.error) throw blockedUsers.error;
    if (filters.error) throw filters.error;

    const totalReports = reports.data?.length || 0;
    const pendingReports = reports.data?.filter(r => r.status === 'pending').length || 0;
    const blockedUsersCount = blockedUsers.data?.length || 0;
    const activeFilters = filters.data?.length || 0;

    return {
      totalReports,
      pendingReports,
      blockedUsers: blockedUsersCount,
      activeFilters,
    };
  }

  /**
   * Check if content should be filtered
   */
  async shouldFilterContent(userId: string, content: string, contentType: 'prayer' | 'comment' | 'group'): Promise<boolean> {
    const filters = await this.getContentFilters(userId);
    const activeFilters = filters.filter(f => f.is_active);

    for (const filter of activeFilters) {
      if (filter.filter_type === 'keyword') {
        if (content.toLowerCase().includes(filter.filter_value.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get filtered content for user
   */
  async getFilteredContent(userId: string, content: any[]): Promise<any[]> {
    const filters = await this.getContentFilters(userId);
    const activeFilters = filters.filter(f => f.is_active);

    return content.filter(item => {
      // Check keyword filters
      const keywordFilters = activeFilters.filter(f => f.filter_type === 'keyword');
      for (const filter of keywordFilters) {
        if (item.text?.toLowerCase().includes(filter.filter_value.toLowerCase()) ||
            item.content?.toLowerCase().includes(filter.filter_value.toLowerCase()) ||
            item.title?.toLowerCase().includes(filter.filter_value.toLowerCase())) {
          return false;
        }
      }

      // Check user filters
      const userFilters = activeFilters.filter(f => f.filter_type === 'user');
      for (const filter of userFilters) {
        if (item.user_id === filter.filter_value || item.user?.id === filter.filter_value) {
          return false;
        }
      }

      return true;
    });
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();