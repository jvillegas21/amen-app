import { supabase } from '@/config/supabase';
import { Profile } from '@/types/database.types';

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export interface FollowingUser extends Profile {
  followed_at: string;
}

/**
 * Following Service - Manages user following relationships
 */
class FollowingService {
  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (user.id === userId) {
      throw new Error('Cannot follow yourself');
    }

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: userId,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Already following this user');
      }
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) throw error;
  }

  /**
   * Get follow status for a user
   */
  async getFollowStatus(userId: string): Promise<FollowStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Check if current user is following this user
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .limit(1);

    return {
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_following: !!followData?.length,
    };
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, page = 1, limit = 20): Promise<FollowingUser[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        created_at,
        follower:profiles!follower_id(*)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return data?.map(item => ({
      ...item.follower,
      followed_at: item.created_at,
    })) || [];
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, page = 1, limit = 20): Promise<FollowingUser[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        created_at,
        following:profiles!following_id(*)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return data?.map(item => ({
      ...item.following,
      followed_at: item.created_at,
    })) || [];
  }

  /**
   * Get suggested users to follow
   */
  async getSuggestedUsers(limit = 10): Promise<Profile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get users that the current user is not already following
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .not('id', 'in', `(
        SELECT following_id 
        FROM follows 
        WHERE follower_id = '${user.id}'
      )`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Toggle follow status
   */
  async toggleFollow(userId: string): Promise<boolean> {
    const stats = await this.getFollowStatus(userId);
    
    if (stats.is_following) {
      await this.unfollowUser(userId);
      return false;
    } else {
      await this.followUser(userId);
      return true;
    }
  }
}

export const followingService = new FollowingService();
