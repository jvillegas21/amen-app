import { supabase } from '@/config/supabase';

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  session_id: string;
  timestamp: string;
  platform: 'ios' | 'android' | 'web';
  app_version: string;
}

export interface UserAnalytics {
  user_id: string;
  total_sessions: number;
  total_prayers: number;
  total_comments: number;
  total_shares: number;
  total_likes: number;
  total_groups_joined: number;
  total_bible_studies_viewed: number;
  average_session_duration: number;
  last_active: string;
  created_at: string;
}

export interface PrayerAnalytics {
  prayer_id: string;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  average_engagement_time: number;
  created_at: string;
}

export interface AppAnalytics {
  total_users: number;
  total_prayers: number;
  total_groups: number;
  total_bible_studies: number;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  average_session_duration: number;
  retention_rate_7d: number;
  retention_rate_30d: number;
}

/**
 * Analytics Service - Tracks user behavior and app metrics
 */
class AnalyticsService {
  private sessionId: string;
  private platform: 'ios' | 'android' | 'web';
  private appVersion: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.platform = this.getPlatform();
    this.appVersion = '1.0.0'; // TODO: Get from app config
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getPlatform(): 'ios' | 'android' | 'web' {
    // TODO: Detect actual platform
    return 'ios';
  }

  /**
   * Track a custom event
   */
  async trackEvent(
    eventType: string,
    eventData: any = {},
    userId?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        console.warn('Analytics: No user ID available for event tracking');
        return;
      }

      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        user_id: currentUserId,
        event_type: eventType,
        event_data: eventData,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        platform: this.platform,
        app_version: this.appVersion,
      };

      const { error } = await supabase
        .from('analytics_events')
        .insert(event);

      if (error) {
        console.error('Analytics: Failed to track event:', error);
      }
    } catch (error) {
      console.error('Analytics: Error tracking event:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, userId?: string): Promise<void> {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
    }, userId);
  }

  /**
   * Track prayer creation
   */
  async trackPrayerCreated(prayerId: string, prayerData: any, userId?: string): Promise<void> {
    await this.trackEvent('prayer_created', {
      prayer_id: prayerId,
      prayer_type: prayerData.privacy_level,
      is_anonymous: prayerData.is_anonymous,
      has_images: prayerData.images?.length > 0,
      has_location: !!prayerData.location,
      text_length: prayerData.text?.length || 0,
    }, userId);
  }

  /**
   * Track prayer interaction
   */
  async trackPrayerInteraction(
    prayerId: string,
    interactionType: 'like' | 'comment' | 'share' | 'save' | 'view',
    userId?: string
  ): Promise<void> {
    await this.trackEvent('prayer_interaction', {
      prayer_id: prayerId,
      interaction_type: interactionType,
    }, userId);
  }

  /**
   * Track group activity
   */
  async trackGroupActivity(
    groupId: string,
    activityType: 'join' | 'leave' | 'create' | 'view',
    userId?: string
  ): Promise<void> {
    await this.trackEvent('group_activity', {
      group_id: groupId,
      activity_type: activityType,
    }, userId);
  }

  /**
   * Track Bible study engagement
   */
  async trackBibleStudyEngagement(
    studyId: string,
    engagementType: 'view' | 'save' | 'share' | 'complete',
    userId?: string
  ): Promise<void> {
    await this.trackEvent('bible_study_engagement', {
      study_id: studyId,
      engagement_type: engagementType,
    }, userId);
  }

  /**
   * Track search activity
   */
  async trackSearch(
    query: string,
    resultsCount: number,
    searchType: 'prayers' | 'groups' | 'users' | 'all',
    userId?: string
  ): Promise<void> {
    await this.trackEvent('search', {
      query,
      results_count: resultsCount,
      search_type: searchType,
    }, userId);
  }

  /**
   * Track user session
   */
  async trackSession(
    sessionData: {
      duration: number;
      screens_viewed: string[];
      actions_performed: string[];
    },
    userId?: string
  ): Promise<void> {
    await this.trackEvent('session_end', {
      session_duration: sessionData.duration,
      screens_viewed: sessionData.screens_viewed,
      actions_performed: sessionData.actions_performed,
    }, userId);
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }

  /**
   * Get prayer analytics
   */
  async getPrayerAnalytics(prayerId: string): Promise<PrayerAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('prayer_analytics')
        .select('*')
        .eq('prayer_id', prayerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting prayer analytics:', error);
      return null;
    }
  }

  /**
   * Get app-wide analytics
   */
  async getAppAnalytics(): Promise<AppAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('app_analytics')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting app analytics:', error);
      return null;
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(userId: string): Promise<{
    daily_prayers: number;
    weekly_prayers: number;
    monthly_prayers: number;
    total_interactions: number;
    average_session_duration: number;
    most_active_hour: number;
    favorite_categories: string[];
  } | null> {
    try {
      // Get events for the user
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;

      // Calculate metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const dailyPrayers = events?.filter(e => 
        e.event_type === 'prayer_created' && 
        new Date(e.timestamp) > oneDayAgo
      ).length || 0;

      const weeklyPrayers = events?.filter(e => 
        e.event_type === 'prayer_created' && 
        new Date(e.timestamp) > oneWeekAgo
      ).length || 0;

      const monthlyPrayers = events?.filter(e => 
        e.event_type === 'prayer_created' && 
        new Date(e.timestamp) > oneMonthAgo
      ).length || 0;

      const totalInteractions = events?.filter(e => 
        e.event_type === 'prayer_interaction'
      ).length || 0;

      const sessionEvents = events?.filter(e => e.event_type === 'session_end') || [];
      const averageSessionDuration = sessionEvents.length > 0 
        ? sessionEvents.reduce((sum, e) => sum + (e.event_data.session_duration || 0), 0) / sessionEvents.length
        : 0;

      // Calculate most active hour
      const hourCounts: { [key: number]: number } = {};
      events?.forEach(e => {
        const hour = new Date(e.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const mostActiveHour = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 12;

      return {
        daily_prayers: dailyPrayers,
        weekly_prayers: weeklyPrayers,
        monthly_prayers: monthlyPrayers,
        total_interactions: totalInteractions,
        average_session_duration: averageSessionDuration,
        most_active_hour: parseInt(mostActiveHour),
        favorite_categories: [], // TODO: Implement category tracking
      };
    } catch (error) {
      console.error('Error getting user engagement metrics:', error);
      return null;
    }
  }

  /**
   * Get trending content
   */
  async getTrendingContent(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    trending_prayers: any[];
    trending_groups: any[];
    trending_topics: string[];
  }> {
    try {
      const timeAgo = new Date();
      switch (timeframe) {
        case 'day':
          timeAgo.setDate(timeAgo.getDate() - 1);
          break;
        case 'week':
          timeAgo.setDate(timeAgo.getDate() - 7);
          break;
        case 'month':
          timeAgo.setDate(timeAgo.getDate() - 30);
          break;
      }

      // Get trending prayers
      const { data: prayerEvents, error: prayerError } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'prayer_interaction')
        .gte('timestamp', timeAgo.toISOString());

      if (prayerError) throw prayerError;

      // Count prayer interactions
      const prayerCounts: { [key: string]: number } = {};
      prayerEvents?.forEach(e => {
        const prayerId = e.event_data.prayer_id;
        if (prayerId) {
          prayerCounts[prayerId] = (prayerCounts[prayerId] || 0) + 1;
        }
      });

      const trendingPrayers = Object.entries(prayerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([prayerId, count]) => ({ prayer_id: prayerId, interaction_count: count }));

      return {
        trending_prayers: trendingPrayers,
        trending_groups: [], // TODO: Implement group trending
        trending_topics: [], // TODO: Implement topic trending
      };
    } catch (error) {
      console.error('Error getting trending content:', error);
      return {
        trending_prayers: [],
        trending_groups: [],
        trending_topics: [],
      };
    }
  }

  /**
   * Update user analytics
   */
  async updateUserAnalytics(userId: string, updates: Partial<UserAnalytics>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_analytics')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user analytics:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();