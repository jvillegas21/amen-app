import { supabase } from '@/config/supabase';
import { Follow, Profile } from '@/types/database.types';
import { BaseRepositoryImpl } from './base.repository';

/**
 * Follow Repository
 * Handles all follow-related database operations
 */
export class FollowRepository extends BaseRepositoryImpl<Follow> {
  constructor() {
    super('follows');
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Already following this user');
      }
      this.handleError(error, 'followUser');
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      this.handleError(error, 'unfollowUser');
    }
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .limit(1);

    if (error) {
      this.handleError(error, 'isFollowing');
    }

    return !!data?.length;
  }

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(userId: string): Promise<{
    followers_count: number;
    following_count: number;
  }> {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followersError) {
      this.handleError(followersError, 'getFollowStats (followers)');
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (followingError) {
      this.handleError(followingError, 'getFollowStats (following)');
    }

    return {
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
    };
  }

  /**
   * Get user's followers with profile information
   */
  async getFollowers(userId: string, page = 1, limit = 20): Promise<Profile[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('follows')
      .select(`
        created_at,
        follower:profiles!follower_id(
          id,
          display_name,
          avatar_url,
          bio,
          location_city,
          created_at
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleError(error, 'getFollowers');
    }

    return data?.map(item => item.follower).filter(Boolean) || [];
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, page = 1, limit = 20): Promise<Profile[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('follows')
      .select(`
        created_at,
        following:profiles!following_id(
          id,
          display_name,
          avatar_url,
          bio,
          location_city,
          created_at
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleError(error, 'getFollowing');
    }

    return data?.map(item => item.following).filter(Boolean) || [];
  }

  /**
   * Get suggested users to follow (users not already followed)
   */
  async getSuggestedUsers(userId: string, limit = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .not('id', 'in', `(
        SELECT following_id 
        FROM follows 
        WHERE follower_id = '${userId}'
      )`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.handleError(error, 'getSuggestedUsers');
    }

    return data || [];
  }

  /**
   * Toggle follow status
   */
  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    const isFollowing = await this.isFollowing(followerId, followingId);
    
    if (isFollowing) {
      await this.unfollowUser(followerId, followingId);
      return false;
    } else {
      await this.followUser(followerId, followingId);
      return true;
    }
  }

  /**
   * Get mutual follows between two users
   */
  async getMutualFollows(userId1: string, userId2: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:profiles!following_id(
          id,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('follower_id', userId1)
      .in('following_id', `(
        SELECT following_id 
        FROM follows 
        WHERE follower_id = '${userId2}'
      )`)
      .limit(10);

    if (error) {
      this.handleError(error, 'getMutualFollows');
    }

    return data?.map(item => item.following).filter(Boolean) || [];
  }
}