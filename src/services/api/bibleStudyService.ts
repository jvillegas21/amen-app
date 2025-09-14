import { supabase } from '@/config/supabase';
import { aiService } from '@/services/aiService';

export interface BibleStudy {
  id: string;
  title: string;
  content: string;
  scripture_references: string[];
  quality_score: number;
  view_count: number;
  save_count: number;
  is_saved?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BibleStudySuggestion {
  id: string;
  title: string;
  description: string;
  scripture_references: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // in minutes
  topics: string[];
}

/**
 * Bible Study Service - Manages AI-powered Bible study operations
 */
class BibleStudyService {
  /**
   * Generate Bible study suggestions based on user preferences
   */
  async generateSuggestions(preferences?: {
    topics?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
    scripture_focus?: string[];
  }): Promise<BibleStudySuggestion[]> {
    try {
      const prompt = `Generate 5 Bible study suggestions based on these preferences:
Topics: ${preferences?.topics?.join(', ') || 'general spiritual growth'}
Difficulty: ${preferences?.difficulty || 'intermediate'}
Duration: ${preferences?.duration || 30} minutes
Scripture Focus: ${preferences?.scripture_focus?.join(', ') || 'various books'}

For each suggestion, provide:
1. A compelling title
2. A brief description (2-3 sentences)
3. 3-5 relevant scripture references
4. Difficulty level
5. Estimated duration in minutes
6. Key topics covered

Format as JSON array with fields: title, description, scripture_references, difficulty_level, estimated_duration, topics`;

      const response = await aiService.generateText(prompt);
      
      // Parse the JSON response
      const suggestions = JSON.parse(response);
      
      // Add IDs to suggestions
      return suggestions.map((suggestion: any, index: number) => ({
        id: `suggestion-${Date.now()}-${index}`,
        ...suggestion,
      }));
    } catch (error) {
      console.error('Failed to generate Bible study suggestions:', error);
      throw new Error('Failed to generate Bible study suggestions');
    }
  }

  /**
   * Generate a full Bible study from a suggestion
   */
  async generateBibleStudy(suggestion: BibleStudySuggestion): Promise<BibleStudy> {
    try {
      const prompt = `Create a comprehensive Bible study based on this suggestion:

Title: ${suggestion.title}
Description: ${suggestion.description}
Scripture References: ${suggestion.scripture_references.join(', ')}
Difficulty: ${suggestion.difficulty_level}
Duration: ${suggestion.estimated_duration} minutes
Topics: ${suggestion.topics.join(', ')}

Create a detailed study that includes:
1. Introduction and context
2. Main teaching points (3-5 points)
3. Scripture analysis for each reference
4. Practical applications
5. Discussion questions
6. Prayer points
7. Conclusion

Format as Markdown with proper headings and structure. Make it engaging and spiritually enriching.`;

      const studyResult = await aiService.generateBibleStudy(
        `${suggestion.title}: ${suggestion.description}`,
        suggestion.topics.join(', ')
      );

      if (!studyResult.success || !studyResult.data) {
        throw new Error(studyResult.error || 'Failed to generate Bible study');
      }

      const bibleStudyData = studyResult.data;
      const content = `# ${bibleStudyData.title}\n\n## Scripture\n${bibleStudyData.scripture}\n\n## Reflection\n${bibleStudyData.reflection}\n\n## Questions for Reflection\n${bibleStudyData.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n## Prayer Focus\n${bibleStudyData.prayer_focus}${bibleStudyData.application ? `\n\n## Practical Application\n${bibleStudyData.application}` : ''}`;
      
      const study: BibleStudy = {
        id: `study-${Date.now()}`,
        title: suggestion.title,
        content,
        scripture_references: suggestion.scripture_references,
        quality_score: 4.5, // Default quality score
        view_count: 0,
        save_count: 0,
        is_saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to database
      await this.saveBibleStudy(study);
      
      return study;
    } catch (error) {
      console.error('Failed to generate Bible study:', error);
      throw new Error('Failed to generate Bible study');
    }
  }

  /**
   * Save Bible study to database
   */
  async saveBibleStudy(study: BibleStudy): Promise<void> {
    const { error } = await supabase
      .from('bible_studies')
      .insert({
        id: study.id,
        title: study.title,
        content: study.content,
        scripture_references: study.scripture_references,
        quality_score: study.quality_score,
        view_count: study.view_count,
        save_count: study.save_count,
      });

    if (error) throw error;
  }

  /**
   * Get Bible study by ID
   */
  async getBibleStudy(studyId: string): Promise<BibleStudy> {
    const { data, error } = await supabase
      .from('bible_studies')
      .select('*')
      .eq('id', studyId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Bible study not found');
    
    return data;
  }

  /**
   * Update Bible study view count
   */
  async incrementViewCount(studyId: string): Promise<void> {
    const { error } = await supabase
      .from('bible_studies')
      .update({ 
        view_count: supabase.raw('view_count + 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', studyId);

    if (error) throw error;
  }

  /**
   * Save Bible study for user
   */
  async saveStudyForUser(studyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_bible_studies')
      .insert({
        study_id: studyId,
        user_id: userId,
      });

    if (error) throw error;

    // Increment save count
    await supabase
      .from('bible_studies')
      .update({ 
        save_count: supabase.raw('save_count + 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', studyId);
  }

  /**
   * Remove saved Bible study for user
   */
  async unsaveStudyForUser(studyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_bible_studies')
      .delete()
      .eq('study_id', studyId)
      .eq('user_id', userId);

    if (error) throw error;

    // Decrement save count
    await supabase
      .from('bible_studies')
      .update({ 
        save_count: supabase.raw('save_count - 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', studyId);
  }

  /**
   * Get user's saved Bible studies
   */
  async getSavedStudies(userId: string): Promise<BibleStudy[]> {
    const { data, error } = await supabase
      .from('saved_bible_studies')
      .select(`
        study:bible_studies(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data?.map(item => ({
      ...item.study,
      is_saved: true,
    })) || [];
  }

  /**
   * Get popular Bible studies
   */
  async getPopularStudies(limit = 10): Promise<BibleStudy[]> {
    const { data, error } = await supabase
      .from('bible_studies')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Search Bible studies
   */
  async searchStudies(query: string): Promise<BibleStudy[]> {
    const { data, error } = await supabase
      .from('bible_studies')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('view_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Export singleton instance
export const bibleStudyService = new BibleStudyService();