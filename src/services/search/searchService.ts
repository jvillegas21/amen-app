/**
 * Search Service - Advanced search and filtering for prayers, users, and groups
 */

import { supabase } from '@/config/supabase';
import { Prayer, Profile, Group } from '@/types/database.types';

export interface SearchFilters {
  // Prayer filters
  prayerStatus?: 'open' | 'answered' | 'expired';
  prayerPrivacy?: 'public' | 'friends' | 'groups' | 'private';
  prayerCategory?: string;
  prayerTags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: {
    city?: string;
    radius?: number; // in km
    lat?: number;
    lon?: number;
  };
  
  // User filters
  userVerified?: boolean;
  userLocation?: string;
  
  // Group filters
  groupPrivacy?: 'public' | 'private';
  groupCategory?: string;
  groupSize?: {
    min?: number;
    max?: number;
  };
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'date' | 'interactions' | 'comments';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeBlocked?: boolean;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchSuggestion {
  id: string;
  type: 'prayer' | 'user' | 'group' | 'tag' | 'category';
  title: string;
  subtitle?: string;
  relevance: number;
}

class SearchService {
  /**
   * Search prayers with advanced filtering
   */
  async searchPrayers(options: SearchOptions = {}): Promise<SearchResult<Prayer>> {
    const {
      query,
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      includeBlocked = false,
    } = options;

    let queryBuilder = supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        interaction_count:interactions(count),
        comment_count:comments(count),
        user_interaction:interactions!left(
          *
        )
      `, { count: 'exact' });

    // Apply text search
    if (query) {
      queryBuilder = queryBuilder.textSearch('text', query, {
        type: 'websearch',
        config: 'english',
      });
    }

    // Apply filters
    if (filters.prayerStatus) {
      queryBuilder = queryBuilder.eq('status', filters.prayerStatus);
    }

    if (filters.prayerPrivacy) {
      queryBuilder = queryBuilder.eq('privacy_level', filters.prayerPrivacy);
    }

    if (filters.prayerCategory) {
      queryBuilder = queryBuilder.eq('category', filters.prayerCategory);
    }

    if (filters.prayerTags && filters.prayerTags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', filters.prayerTags);
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateRange.end);
      }
    }

    if (filters.location) {
      if (filters.location.city) {
        queryBuilder = queryBuilder.eq('location_city', filters.location.city);
      }
      
      if (filters.location.lat && filters.location.lon && filters.location.radius) {
        // Use PostGIS for location-based search
        queryBuilder = queryBuilder.rpc('search_prayers_by_location', {
          lat: filters.location.lat,
          lon: filters.location.lon,
          radius_km: filters.location.radius,
        });
      }
    }

    // Exclude blocked users if not including them
    if (!includeBlocked) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        queryBuilder = queryBuilder.not('user_id', 'in', `(SELECT blocked_user_id FROM blocked_users WHERE blocker_id = '${user.id}')`);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' });
        break;
      case 'interactions':
        queryBuilder = queryBuilder.order('interaction_count', { ascending: sortOrder === 'asc' });
        break;
      case 'comments':
        queryBuilder = queryBuilder.order('comment_count', { ascending: sortOrder === 'asc' });
        break;
      case 'relevance':
      default:
        if (query) {
          // For text search, order by relevance (PostgreSQL full-text search ranking)
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
        } else {
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
        }
        break;
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    };
  }

  /**
   * Search users
   */
  async searchUsers(options: SearchOptions = {}): Promise<SearchResult<Profile>> {
    const {
      query,
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options;

    let queryBuilder = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply text search
    if (query) {
      queryBuilder = queryBuilder.or(`display_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`);
    }

    // Apply filters
    if (filters.userVerified !== undefined) {
      queryBuilder = queryBuilder.eq('is_verified', filters.userVerified);
    }

    if (filters.userLocation) {
      queryBuilder = queryBuilder.eq('location', filters.userLocation);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' });
        break;
      case 'relevance':
      default:
        queryBuilder = queryBuilder.order('display_name', { ascending: sortOrder === 'asc' });
        break;
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    };
  }

  /**
   * Search groups
   */
  async searchGroups(options: SearchOptions = {}): Promise<SearchResult<Group>> {
    const {
      query,
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options;

    let queryBuilder = supabase
      .from('groups')
      .select(`
        *,
        member_count:group_members(count),
        owner:profiles!owner_id(*)
      `, { count: 'exact' });

    // Apply text search
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Apply filters
    if (filters.groupPrivacy) {
      queryBuilder = queryBuilder.eq('privacy_level', filters.groupPrivacy);
    }

    if (filters.groupCategory) {
      queryBuilder = queryBuilder.eq('category', filters.groupCategory);
    }

    if (filters.groupSize) {
      if (filters.groupSize.min) {
        queryBuilder = queryBuilder.gte('member_count', filters.groupSize.min);
      }
      if (filters.groupSize.max) {
        queryBuilder = queryBuilder.lte('member_count', filters.groupSize.max);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' });
        break;
      case 'interactions':
        queryBuilder = queryBuilder.order('member_count', { ascending: sortOrder === 'asc' });
        break;
      case 'relevance':
      default:
        queryBuilder = queryBuilder.order('name', { ascending: sortOrder === 'asc' });
        break;
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    };
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, limit = 10): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];

    try {
      // Search prayers
      const { data: prayers } = await supabase
        .from('prayers')
        .select('id, text, tags')
        .textSearch('text', query, { type: 'websearch' })
        .limit(3);

      prayers?.forEach(prayer => {
        suggestions.push({
          id: prayer.id,
          type: 'prayer',
          title: prayer.text.substring(0, 50) + '...',
          subtitle: 'Prayer Request',
          relevance: 0.9,
        });
      });

      // Search users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(3);

      users?.forEach(user => {
        suggestions.push({
          id: user.id,
          type: 'user',
          title: user.display_name,
          subtitle: `@${user.username}`,
          relevance: 0.8,
        });
      });

      // Search groups
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name, description')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(3);

      groups?.forEach(group => {
        suggestions.push({
          id: group.id,
          type: 'group',
          title: group.name,
          subtitle: group.description?.substring(0, 30) + '...',
          relevance: 0.7,
        });
      });

      // Search tags
      const { data: tags } = await supabase
        .from('prayers')
        .select('tags')
        .not('tags', 'is', null)
        .limit(100);

      const tagCounts = new Map<string, number>();
      tags?.forEach(prayer => {
        prayer.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      });

      const sortedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      sortedTags.forEach(([tag, count]) => {
        suggestions.push({
          id: `tag-${tag}`,
          type: 'tag',
          title: `#${tag}`,
          subtitle: `${count} prayers`,
          relevance: 0.6,
        });
      });

      // Sort by relevance and return top results
      return suggestions
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit = 10): Promise<string[]> {
    try {
      // This would typically come from analytics data
      // For now, return popular tags
      const { data } = await supabase
        .from('prayers')
        .select('tags')
        .not('tags', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      const tagCounts = new Map<string, number>();
      data?.forEach(prayer => {
        prayer.tags?.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);

    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  }

  /**
   * Get search filters metadata
   */
  async getSearchFilters(): Promise<{
    categories: string[];
    tags: string[];
    locations: string[];
  }> {
    try {
      const [categories, tags, locations] = await Promise.all([
        // Get categories
        supabase
          .from('prayers')
          .select('category')
          .not('category', 'is', null)
          .limit(100),
        
        // Get popular tags
        supabase
          .from('prayers')
          .select('tags')
          .not('tags', 'is', null)
          .limit(1000),
        
        // Get locations
        supabase
          .from('prayers')
          .select('location_city')
          .not('location_city', 'is', null)
          .limit(100),
      ]);

      const categorySet = new Set<string>();
      categories.data?.forEach(prayer => {
        if (prayer.category) categorySet.add(prayer.category);
      });

      const tagSet = new Set<string>();
      tags.data?.forEach(prayer => {
        prayer.tags?.forEach((tag: string) => tagSet.add(tag));
      });

      const locationSet = new Set<string>();
      locations.data?.forEach(prayer => {
        if (prayer.location_city) locationSet.add(prayer.location_city);
      });

      return {
        categories: Array.from(categorySet).sort(),
        tags: Array.from(tagSet).sort(),
        locations: Array.from(locationSet).sort(),
      };

    } catch (error) {
      console.error('Error getting search filters:', error);
      return {
        categories: [],
        tags: [],
        locations: [],
      };
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;