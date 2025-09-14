import { StudySuggestionRequest, StudySuggestionResponse, GenerateStudyRequest, GenerateStudyResponse } from '@/types/database.types';
import { supabase } from '@/config/supabase';

/**
 * OpenAI Service for Bible Study Generation
 * Implements Single Responsibility Principle: Only handles AI-related operations
 */
class OpenAIService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1';
  private readonly model = 'gpt-4-turbo-preview';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not configured');
    }
  }

  /**
   * Generate Bible study suggestions based on prayer text
   */
  async generateStudySuggestions(request: StudySuggestionRequest): Promise<StudySuggestionResponse> {
    try {
      const prompt = this.buildSuggestionPrompt(request.prayer_text, request.preferred_translation);
      
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const suggestions = JSON.parse(data.choices[0].message.content);

      // Save to database for analytics
      await this.saveGenerationMetrics(request.user_id, 'suggestions', suggestions);

      return {
        suggestions: suggestions.suggestions,
        generation_id: data.id,
      };
    } catch (error) {
      console.error('Failed to generate study suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate full Bible study content
   */
  async generateStudy(request: GenerateStudyRequest): Promise<GenerateStudyResponse> {
    try {
      // Fetch prayer details
      const { data: prayer, error } = await supabase
        .from('prayers')
        .select('text')
        .eq('id', request.prayer_id)
        .single();

      if (error || !prayer) {
        throw new Error('Prayer not found');
      }

      const prompt = this.buildStudyPrompt(prayer.text, request.custom_prompt);

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getStudySystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const studyContent = data.choices[0].message.content;

      // Parse and structure the study
      const study = this.parseStudyContent(studyContent);
      const qualityScore = await this.calculateQualityScore(study);

      // Save to database
      await this.saveStudy(request.prayer_id, study, qualityScore);

      return {
        study,
        quality_score: qualityScore,
      };
    } catch (error) {
      console.error('Failed to generate study:', error);
      throw error;
    }
  }

  /**
   * Build prompt for study suggestions
   */
  private buildSuggestionPrompt(prayerText: string, translation?: string): string {
    return `Based on this prayer request: "${prayerText}"
    
    Generate 3-5 Bible study suggestions that would provide comfort, guidance, or wisdom related to this prayer.
    Use the ${translation || 'NIV'} translation.
    
    Return a JSON object with this structure:
    {
      "suggestions": [
        {
          "title": "Study title",
          "snippet": "Brief 2-3 sentence description",
          "scripture_refs": ["Book Chapter:Verse"],
          "confidence": 0.0-1.0
        }
      ]
    }`;
  }

  /**
   * Build prompt for full study generation
   */
  private buildStudyPrompt(prayerText: string, customPrompt?: string): string {
    const basePrompt = `Create a comprehensive Bible study based on this prayer: "${prayerText}"`;
    
    if (customPrompt) {
      return `${basePrompt}\n\nAdditional guidance: ${customPrompt}`;
    }

    return `${basePrompt}
    
    Include:
    1. Opening reflection
    2. Key scripture passages with context
    3. Practical application
    4. Prayer points
    5. Questions for deeper reflection
    
    Make it personal, encouraging, and grounded in biblical truth.`;
  }

  /**
   * Get system prompt for suggestion generation
   */
  private getSystemPrompt(): string {
    return `You are a compassionate biblical counselor and theologian. 
    Your role is to suggest relevant Bible studies that provide comfort, wisdom, and guidance.
    Always be encouraging, theologically sound, and sensitive to people's struggles.
    Focus on God's love, grace, and faithfulness.`;
  }

  /**
   * Get system prompt for full study generation
   */
  private getStudySystemPrompt(): string {
    return `You are a gifted Bible teacher creating personalized devotional studies.
    Your studies should be:
    - Biblically accurate and theologically sound
    - Compassionate and encouraging
    - Practical and applicable to daily life
    - Rich in scripture but accessible to all believers
    - Focused on God's character and promises
    
    Format your response in clear sections with headers.`;
  }

  /**
   * Parse study content into structured format
   */
  private parseStudyContent(content: string): {
    title: string;
    content: string;
    scripture_refs: string[];
    estimated_read_time: number;
  } {
    // Extract title (first line or header)
    const lines = content.split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim();

    // Extract scripture references
    const scriptureRegex = /([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)/g;
    const scripture_refs = [];
    let match;
    while ((match = scriptureRegex.exec(content)) !== null) {
      scripture_refs.push(match[0]);
    }

    // Calculate read time (roughly 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const estimated_read_time = Math.ceil(wordCount / 200);

    return {
      title,
      content,
      scripture_refs: [...new Set(scripture_refs)], // Remove duplicates
      estimated_read_time,
    };
  }

  /**
   * Calculate quality score for generated study
   */
  private async calculateQualityScore(study: any): Promise<number> {
    let score = 0.5; // Base score

    // Check for scripture references
    if (study.scripture_refs.length > 0) score += 0.2;
    if (study.scripture_refs.length > 3) score += 0.1;

    // Check content length
    if (study.content.length > 500) score += 0.1;
    if (study.content.length > 1000) score += 0.1;

    // Check for section headers
    if (study.content.includes('##')) score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Save study to database
   */
  private async saveStudy(prayerId: string, study: any, qualityScore: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('studies').insert({
      prayer_id: prayerId,
      user_id: user.id,
      title: study.title,
      content_md: study.content,
      scripture_references: study.scripture_refs.map((ref: string) => ({
        book: ref.split(' ')[0],
        chapter: parseInt(ref.split(' ')[1]?.split(':')[0] || '1'),
        verse_start: parseInt(ref.split(':')[1]?.split('-')[0] || '1'),
      })),
      ai_model: this.model,
      ai_prompt_version: '1.0',
      quality_score: qualityScore,
      is_featured: false,
      view_count: 0,
      save_count: 0,
    });

    if (error) throw error;
  }

  /**
   * Save generation metrics for analytics
   */
  private async saveGenerationMetrics(userId: string, type: string, data: any): Promise<void> {
    try {
      await supabase.from('user_analytics').insert({
        user_id: userId,
        event_type: `ai_generation_${type}`,
        event_data: data,
      });
    } catch (error) {
      console.error('Failed to save generation metrics:', error);
      // Don't throw - this is non-critical
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();