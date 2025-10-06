/**
 * AI Integration Service - Connects AI service with database and prayer system
 * Provides real-time Bible study suggestions during prayer creation
 */

import { supabase } from '@/config/supabase';
import { aiService } from '@/services/aiService';
import { Prayer, BibleStudy } from '@/types/database.types';

interface StudySuggestion {
  id: string;
  title: string;
  snippet: string;
  scriptureRefs: string[];
  confidence: number;
  prayerId: string;
}

interface GenerateStudyRequest {
  prayerId: string;
  suggestionId: string;
  customPrompt?: string;
}

interface GenerateStudyResponse {
  study: BibleStudy;
  qualityScore: number;
}

class AIIntegrationService {
  private suggestionCache = new Map<string, StudySuggestion[]>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate Bible study suggestions based on prayer text
   */
  async generateStudySuggestions(
    prayerText: string,
    prayerId: string,
    userId: string
  ): Promise<StudySuggestion[]> {
    try {
      // Check cache first
      const cacheKey = `${prayerId}-${this.hashText(prayerText)}`;
      const cached = this.suggestionCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate suggestions using AI service
      const aiResponse = await aiService.generateScriptureVerses(prayerText, 3);
      
      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'Failed to generate suggestions');
      }

      // Convert AI response to study suggestions
      const suggestions: StudySuggestion[] = aiResponse.data.map((verse, index) => ({
        id: `suggestion-${prayerId}-${index}`,
        title: this.generateSuggestionTitle(verse.relevance),
        snippet: verse.verse.substring(0, 100) + '...',
        scriptureRefs: [verse.reference],
        confidence: this.calculateConfidence(verse.relevance),
        prayerId,
      }));

      // Cache the suggestions
      this.suggestionCache.set(cacheKey, suggestions);

      // Save analytics
      await this.saveSuggestionAnalytics(userId, prayerId, suggestions.length);

      return suggestions;
    } catch (error) {
      console.error('Error generating study suggestions:', error);
      // Return fallback suggestions
      return this.getFallbackSuggestions(prayerId);
    }
  }

  /**
   * Generate full Bible study from suggestion
   */
  async generateFullStudy(request: GenerateStudyRequest): Promise<GenerateStudyResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the prayer
      const { data: prayer, error: prayerError } = await supabase
        .from('prayers')
        .select('*')
        .eq('id', request.prayerId)
        .single();

      if (prayerError || !prayer) {
        throw new Error('Prayer not found');
      }

      // Generate Bible study using AI
      const aiResponse = await aiService.generateBibleStudy(
        prayer.text,
        request.customPrompt || 'general guidance'
      );

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'Failed to generate Bible study');
      }

      // Convert AI response to database format
      const studyData = {
        prayer_id: request.prayerId,
        user_id: user.id,
        title: aiResponse.data.title,
        content_md: this.formatStudyAsMarkdown(aiResponse.data),
        scripture_references: this.extractScriptureReferences(aiResponse.data.scripture),
        ai_model: 'gpt-4-turbo-preview',
        ai_prompt_version: 'v1.0',
        quality_score: this.calculateQualityScore(aiResponse.data),
        is_featured: false,
        view_count: 0,
        save_count: 0,
      };

      // Save to database
      const { data: savedStudy, error: saveError } = await supabase
        .from('studies')
        .insert(studyData)
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save Bible study');
      }

      // Save analytics
      await this.saveGenerationAnalytics(user.id, 'full_study', {
        prayer_id: request.prayerId,
        suggestion_id: request.suggestionId,
        study_id: savedStudy.id,
        quality_score: studyData.quality_score,
      });

      return {
        study: savedStudy,
        qualityScore: studyData.quality_score,
      };
    } catch (error) {
      console.error('Error generating full study:', error);
      throw error;
    }
  }

  /**
   * Get Bible study suggestions for a prayer (cached)
   */
  async getStudySuggestions(prayerId: string): Promise<StudySuggestion[]> {
    const cacheKey = prayerId;
    const cached = this.suggestionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // If not cached, generate new suggestions
    const { data: prayer } = await supabase
      .from('prayers')
      .select('text, user_id')
      .eq('id', prayerId)
      .single();

    if (!prayer) {
      return [];
    }

    return this.generateStudySuggestions(prayer.text, prayerId, prayer.user_id);
  }

  /**
   * Get saved Bible studies for a user
   */
  async getSavedStudies(userId: string, page = 1, limit = 20): Promise<BibleStudy[]> {
    const { data, error } = await supabase
      .from('saved_studies')
      .select(`
        study:studies(
          *,
          prayer:prayers!prayer_id(
            id,
            text,
            user:profiles!user_id(display_name, avatar_url)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data?.map(item => item.study) || [];
  }

  /**
   * Get featured Bible studies
   */
  async getFeaturedStudies(limit = 10): Promise<BibleStudy[]> {
    const { data, error } = await supabase
      .from('studies')
      .select(`
        *,
        prayer:prayers!prayer_id(
          id,
          text,
          user:profiles!user_id(display_name, avatar_url)
        )
      `)
      .eq('is_featured', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Increment study view count
  */
  async incrementStudyViews(studyId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_study_views', {
      study_id: studyId,
    });

    if (error) {
      console.warn('Failed to increment study views via RPC:', error);
      await this.incrementStudyViewsFallback(studyId);
    }
  }

  private async incrementStudyViewsFallback(studyId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('studies')
        .select('view_count')
        .eq('id', studyId)
        .single();

      if (error || !data) {
        console.warn('Fallback study view lookup failed:', error);
        return;
      }

      const { error: updateError } = await supabase
        .from('studies')
        .update({
          view_count: (data.view_count ?? 0) + 1,
        })
        .eq('id', studyId);

      if (updateError) {
        console.warn('Fallback study view increment failed:', updateError);
      }
    } catch (fallbackError) {
      console.warn('Fallback study view increment threw an error:', fallbackError);
    }
  }

  /**
   * Save study to user's saved studies
   */
  async saveStudyToUser(studyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_studies')
      .insert({
        study_id: studyId,
        user_id: userId,
      });

    if (error) {
      // If already saved, ignore the error
      if (error.code !== '23505') {
        throw error;
      }
    }
  }

  /**
   * Remove study from user's saved studies
   */
  async removeSavedStudy(studyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_studies')
      .delete()
      .eq('study_id', studyId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get AI service configuration status
   */
  getConfigurationStatus() {
    return aiService.getConfigurationStatus();
  }

  // Private helper methods

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private generateSuggestionTitle(relevance: string): string {
    // Extract key themes from relevance text
    const words = relevance.toLowerCase().split(' ');
    const keyWords = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said'].includes(word)
    );
    
    if (keyWords.length > 0) {
      return `Finding ${keyWords[0].charAt(0).toUpperCase() + keyWords[0].slice(1)} in Scripture`;
    }
    
    return 'Biblical Guidance for Your Prayer';
  }

  private calculateConfidence(relevance: string): number {
    // Simple confidence calculation based on relevance text length and keywords
    const length = relevance.length;
    const hasKeywords = /(comfort|guidance|encouragement|strength|peace|hope|love|faith)/i.test(relevance);
    
    let confidence = Math.min(0.9, length / 100);
    if (hasKeywords) confidence += 0.1;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private getFallbackSuggestions(prayerId: string): StudySuggestion[] {
    return [
      {
        id: `fallback-${prayerId}-1`,
        title: 'Finding Peace in Difficult Times',
        snippet: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives...',
        scriptureRefs: ['John 14:27'],
        confidence: 0.8,
        prayerId,
      },
      {
        id: `fallback-${prayerId}-2`,
        title: 'Trusting in God\'s Plan',
        snippet: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you...',
        scriptureRefs: ['Jeremiah 29:11'],
        confidence: 0.8,
        prayerId,
      },
      {
        id: `fallback-${prayerId}-3`,
        title: 'Strength Through Faith',
        snippet: 'I can do all things through Christ who strengthens me...',
        scriptureRefs: ['Philippians 4:13'],
        confidence: 0.8,
        prayerId,
      },
    ];
  }

  private formatStudyAsMarkdown(study: any): string {
    return `# ${study.title}

## Scripture
${study.scripture}

## Reflection
${study.reflection}

## Discussion Questions
${study.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

## Prayer Focus
${study.prayer_focus}

## Application
${study.application || 'Reflect on how this scripture applies to your current situation and prayer request.'}`;
  }

  private extractScriptureReferences(scripture: string): any[] {
    // Extract scripture references from the text
    const references = scripture.match(/\b[A-Za-z]+\s+\d+:\d+(?:-\d+)?/g) || [];
    return references.map(ref => ({
      reference: ref,
      text: scripture,
      translation: 'NIV'
    }));
  }

  private calculateQualityScore(study: any): number {
    let score = 0.5; // Base score
    
    // Increase score based on content quality
    if (study.title && study.title.length > 10) score += 0.1;
    if (study.scripture && study.scripture.length > 50) score += 0.1;
    if (study.reflection && study.reflection.length > 100) score += 0.1;
    if (study.questions && study.questions.length >= 4) score += 0.1;
    if (study.prayer_focus && study.prayer_focus.length > 20) score += 0.1;
    
    return Math.min(5, Math.max(1, Math.round(score * 5)));
  }

  private async saveSuggestionAnalytics(userId: string, prayerId: string, suggestionCount: number): Promise<void> {
    try {
      await supabase.from('user_analytics').insert({
        user_id: userId,
        event_type: 'ai_suggestions_generated',
        event_data: {
          prayer_id: prayerId,
          suggestion_count: suggestionCount,
        },
      });
    } catch (error) {
      console.error('Failed to save suggestion analytics:', error);
    }
  }

  private async saveGenerationAnalytics(userId: string, type: string, data: any): Promise<void> {
    try {
      await supabase.from('user_analytics').insert({
        user_id: userId,
        event_type: `ai_${type}_generated`,
        event_data: data,
      });
    } catch (error) {
      console.error('Failed to save generation analytics:', error);
    }
  }
}

// Export singleton instance
export const aiIntegrationService = new AIIntegrationService();
export default aiIntegrationService;
