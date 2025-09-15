import { supabase } from '@/config/supabase';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
  is_helpful?: boolean;
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  article_count: number;
}

/**
 * Help Service - Manages FAQ and help content
 */
class HelpService {
  /**
   * Get FAQ items
   */
  async getFAQItems(category?: string): Promise<FAQItem[]> {
    let query = supabase
      .from('faq_items')
      .select('*')
      .order('helpful_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch FAQ items:', error);
      // Return fallback FAQ items
      return this.getFallbackFAQItems();
    }

    return data || [];
  }

  /**
   * Mark FAQ item as helpful
   */
  async markFAQHelpful(faqId: string, userId: string): Promise<void> {
    try {
      // Check if user already marked this FAQ as helpful
      const { data: existing } = await supabase
        .from('faq_helpful_votes')
        .select('id')
        .eq('faq_id', faqId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // User already voted, remove the vote
        await supabase
          .from('faq_helpful_votes')
          .delete()
          .eq('faq_id', faqId)
          .eq('user_id', userId);

        // Decrement helpful count
        await supabase.rpc('decrement_faq_helpful_count', { faq_id: faqId });
      } else {
        // Add helpful vote
        await supabase
          .from('faq_helpful_votes')
          .insert({
            faq_id: faqId,
            user_id: userId,
          });

        // Increment helpful count
        await supabase.rpc('increment_faq_helpful_count', { faq_id: faqId });
      }
    } catch (error) {
      console.error('Failed to mark FAQ as helpful:', error);
      throw error;
    }
  }

  /**
   * Get help categories
   */
  async getHelpCategories(): Promise<HelpCategory[]> {
    const { data, error } = await supabase
      .from('help_categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Failed to fetch help categories:', error);
      return this.getFallbackHelpCategories();
    }

    return data || [];
  }

  /**
   * Search help content
   */
  async searchHelpContent(query: string): Promise<{
    faq_items: FAQItem[];
    articles: any[];
  }> {
    try {
      const [faqResult, articlesResult] = await Promise.all([
        supabase
          .from('faq_items')
          .select('*')
          .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
          .limit(10),
        supabase
          .from('help_articles')
          .select('*')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(10)
      ]);

      return {
        faq_items: faqResult.data || [],
        articles: articlesResult.data || [],
      };
    } catch (error) {
      console.error('Failed to search help content:', error);
      return { faq_items: [], articles: [] };
    }
  }

  /**
   * Submit feedback
   */
  async submitFeedback(
    userId: string,
    type: 'bug' | 'feature' | 'general',
    subject: string,
    message: string
  ): Promise<void> {
    const { error } = await supabase
      .from('help_feedback')
      .insert({
        user_id: userId,
        type,
        subject,
        message,
        status: 'open',
      });

    if (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Get user's helpful votes for FAQ items
   */
  async getUserFAQVotes(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('faq_helpful_votes')
      .select('faq_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch user FAQ votes:', error);
      return new Set();
    }

    return new Set(data?.map(vote => vote.faq_id) || []);
  }

  // Fallback data methods

  private getFallbackFAQItems(): FAQItem[] {
    return [
      {
        id: '1',
        question: 'How do I create a prayer request?',
        answer: 'To create a prayer request, tap the "+" button on the main screen, write your prayer, choose privacy settings, and tap "Post Prayer". You can also add tags and location if desired.',
        category: 'prayers',
        helpful_count: 45,
      },
      {
        id: '2',
        question: 'How do I join a group?',
        answer: 'Go to the Groups tab, browse available groups, and tap "Join" on any group you\'d like to be part of. Some groups may require approval from admins.',
        category: 'groups',
        helpful_count: 32,
      },
      {
        id: '3',
        question: 'Can I make my prayers private?',
        answer: 'Yes! When creating a prayer, you can choose from several privacy levels: Public (everyone can see), Friends (only your friends), Groups (only group members), or Private (only you).',
        category: 'privacy',
        helpful_count: 28,
      },
      {
        id: '4',
        question: 'How do I save prayers?',
        answer: 'To save a prayer, tap the bookmark icon on any prayer card. You can view all your saved prayers in your profile under "Saved Prayers".',
        category: 'prayers',
        helpful_count: 24,
      },
      {
        id: '5',
        question: 'What are Bible study suggestions?',
        answer: 'Bible study suggestions are AI-generated scripture recommendations based on your prayer content. They help you find relevant biblical guidance for your specific situation.',
        category: 'features',
        helpful_count: 19,
      },
    ];
  }

  private getFallbackHelpCategories(): HelpCategory[] {
    return [
      {
        id: 'getting_started',
        title: 'Getting Started',
        description: 'Learn the basics of using Amenity',
        icon: 'rocket-outline',
        article_count: 8,
      },
      {
        id: 'prayers',
        title: 'Prayers & Requests',
        description: 'How to create and manage prayers',
        icon: 'heart-outline',
        article_count: 12,
      },
      {
        id: 'groups',
        title: 'Groups & Community',
        description: 'Joining and managing prayer groups',
        icon: 'people-outline',
        article_count: 6,
      },
      {
        id: 'privacy',
        title: 'Privacy & Security',
        description: 'Understanding your privacy settings',
        icon: 'shield-outline',
        article_count: 4,
      },
      {
        id: 'features',
        title: 'Features & Tips',
        description: 'Advanced features and helpful tips',
        icon: 'bulb-outline',
        article_count: 10,
      },
    ];
  }
}

// Export singleton instance
export const helpService = new HelpService();
export default helpService;