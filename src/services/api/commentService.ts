import { supabase } from '@/config/supabase';
import { Comment } from '@/types/database.types';

/**
 * Comment Service - Manages comment-related API operations
 */
class CommentService {
  /**
   * Get comments for a prayer
   */
  async getPrayerComments(prayerId: string, page = 1, limit = 20): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .eq('prayer_id', prayerId)
      .order('created_at', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new comment
   */
  async createComment(comment: {
    prayer_id: string;
    text: string;
    parent_id?: string;
  }): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        prayer_id: comment.prayer_id,
        user_id: user.id,
        text: comment.text,
        parent_id: comment.parent_id,
      })
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create comment');
    return data;
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, text: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({
        text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update comment');
    return data;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already liked
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Like
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });
      if (error) throw error;
    }
  }

  /**
   * Get comment likes count
   */
  async getCommentLikesCount(commentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Check if user liked a comment
   */
  async hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  /**
   * Subscribe to real-time comments
   */
  subscribeToComments(prayerId: string, callback: (comment: Comment) => void) {
    return supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `prayer_id=eq.${prayerId}`,
        },
        async (payload) => {
          // Fetch the full comment with user data
          const { data } = await supabase
            .from('comments')
            .select(`
              *,
              user:profiles!user_id(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from comments
   */
  unsubscribeFromComments(subscription: any) {
    supabase.removeChannel(subscription);
  }
}

// Export singleton instance
export const commentService = new CommentService();