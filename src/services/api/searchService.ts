import { supabase } from '@/config/supabase';
import { Prayer, Group } from '@/types/database.types';

export interface SearchFilters {
  type?: 'prayers' | 'groups' | 'users' | 'all';
  tags?: string[];
  location?: string;
  status?: 'open' | 'answered' | 'closed';
  privacy_level?: 'public' | 'private';
  date_range?: {
    start: string;
    end: string;
  };
}

export interface SearchResult {
  prayers: Prayer[];
  groups: Group[];
  users: any[];
  total: number;
}

/**
 * Search Service - Manages search-related API operations
 */
class SearchService {
  /**
   * Search across all content types
   */
  async searchAll(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const results = await Promise.all([
      this.searchPrayers(query, filters),
      this.searchGroups(query, filters),
      this.searchUsers(query, filters),
    ]);

    return {
      prayers: results[0],
      groups: results[1],
      users: results[2],
      total: results[0].length + results[1].length + results[2].length,
    };
  }

  /**
   * Search prayers
   */
  async searchPrayers(query: string, filters?: SearchFilters): Promise<Prayer[]> {
    let supabaseQuery = supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        interaction_count:interactions(count),
        comment_count:comments(count)
      `)
      .textSearch('text', query, {
        type: 'websearch',
        config: 'english',
      });

    if (filters?.tags?.length) {
      supabaseQuery = supabaseQuery.contains('tags', filters.tags);
    }

    if (filters?.location) {
      supabaseQuery = supabaseQuery.ilike('location_city', `%${filters.location}%`);
    }

    if (filters?.status) {
      supabaseQuery = supabaseQuery.eq('status', filters.status);
    }

    if (filters?.date_range) {
      supabaseQuery = supabaseQuery
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data || [];
  }

  /**
   * Search groups
   */
  async searchGroups(query: string, filters?: SearchFilters): Promise<Group[]> {
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
   * Search users
   */
  async searchUsers(query: string, filters?: SearchFilters): Promise<any[]> {
    let supabaseQuery = supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`);

    if (filters?.location) {
      supabaseQuery = supabaseQuery.ilike('location_city', `%${filters.location}%`);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(limit = 10): Promise<string[]> {
    // Get most used tags from prayers
    const { data, error } = await supabase
      .from('prayers')
      .select('tags')
      .not('tags', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (error) throw error;

    // Count tag frequency
    const tagCounts: { [key: string]: number } = {};
    data?.forEach(prayer => {
      prayer.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by frequency and return top tags
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  /**
   * Get trending prayers
   */
  async getTrendingPrayers(limit = 10): Promise<Prayer[]> {
    const { data, error } = await supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        interaction_count:interactions(count),
        comment_count:comments(count)
      `)
      .eq('privacy_level', 'public')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('interaction_count', { ascending: false })
      .limit(limit);

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
   * Get search suggestions
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];

    const suggestions: string[] = [];

    // Get tag suggestions
    const { data: tagData } = await supabase
      .from('prayers')
      .select('tags')
      .not('tags', 'is', null)
      .ilike('tags', `%${query}%`)
      .limit(5);

    tagData?.forEach(prayer => {
      prayer.tags?.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase()) && !suggestions.includes(tag)) {
          suggestions.push(tag);
        }
      });
    });

    // Get location suggestions
    const { data: locationData } = await supabase
      .from('prayers')
      .select('location_city')
      .not('location_city', 'is', null)
      .ilike('location_city', `%${query}%`)
      .limit(5);

    locationData?.forEach(prayer => {
      if (prayer.location_city && !suggestions.includes(prayer.location_city)) {
        suggestions.push(prayer.location_city);
      }
    });

    return suggestions.slice(0, 10);
  }
}

// Export singleton instance
export const searchService = new SearchService();