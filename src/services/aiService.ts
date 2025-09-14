/**
 * AI Service - OpenAI integration for prayer suggestions and Bible study generation
 * Provides AI-powered features for the Amenity app
 */

interface PrayerSuggestion {
  title: string;
  content: string;
  category: string;
  scripture_reference?: string;
  tags: string[];
}

interface BibleStudy {
  title: string;
  scripture: string;
  reflection: string;
  questions: string[];
  prayer_focus: string;
}

interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class AIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor() {
    // TODO: Get API key from environment variables
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
  }

  /**
   * Generate prayer suggestions based on user input
   */
  async generatePrayerSuggestions(
    prayerText: string,
    category?: string,
    context?: string
  ): Promise<AIResponse<PrayerSuggestion[]>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured',
        };
      }

      const prompt = this.buildPrayerSuggestionPrompt(prayerText, category, context);
      const response = await this.callOpenAI(prompt, 0.7, 1000);

      if (!response.success || !response.data) {
        return response;
      }

      // Parse the AI response into structured prayer suggestions
      const suggestions = this.parsePrayerSuggestions(response.data);
      
      return {
        success: true,
        data: suggestions,
      };
    } catch (error) {
      console.error('Error generating prayer suggestions:', error);
      return {
        success: false,
        error: 'Failed to generate prayer suggestions',
      };
    }
  }

  /**
   * Generate Bible study content based on prayer request
   */
  async generateBibleStudy(
    prayerText: string,
    topic?: string
  ): Promise<AIResponse<BibleStudy>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured',
        };
      }

      const prompt = this.buildBibleStudyPrompt(prayerText, topic);
      const response = await this.callOpenAI(prompt, 0.8, 1500);

      if (!response.success || !response.data) {
        return response;
      }

      // Parse the AI response into structured Bible study
      const bibleStudy = this.parseBibleStudy(response.data);
      
      return {
        success: true,
        data: bibleStudy,
      };
    } catch (error) {
      console.error('Error generating Bible study:', error);
      return {
        success: false,
        error: 'Failed to generate Bible study',
      };
    }
  }

  /**
   * Generate prayer encouragement based on user's situation
   */
  async generatePrayerEncouragement(
    situation: string,
    mood?: string
  ): Promise<AIResponse<string>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured',
        };
      }

      const prompt = this.buildEncouragementPrompt(situation, mood);
      const response = await this.callOpenAI(prompt, 0.6, 500);

      return response;
    } catch (error) {
      console.error('Error generating encouragement:', error);
      return {
        success: false,
        error: 'Failed to generate encouragement',
      };
    }
  }

  /**
   * Generate relevant scripture verses for a prayer request
   */
  async generateScriptureVerses(
    prayerText: string,
    count: number = 3
  ): Promise<AIResponse<Array<{ verse: string; reference: string; relevance: string }>>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured',
        };
      }

      const prompt = this.buildScripturePrompt(prayerText, count);
      const response = await this.callOpenAI(prompt, 0.7, 800);

      if (!response.success || !response.data) {
        return response;
      }

      // Parse the AI response into structured scripture verses
      const verses = this.parseScriptureVerses(response.data);
      
      return {
        success: true,
        data: verses,
      };
    } catch (error) {
      console.error('Error generating scripture verses:', error);
      return {
        success: false,
        error: 'Failed to generate scripture verses',
      };
    }
  }

  /**
   * Make API call to OpenAI
   */
  private async callOpenAI(
    prompt: string,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<AIResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for a Christian prayer app. Provide thoughtful, encouraging, and biblically-based responses.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Build prompt for prayer suggestions
   */
  private buildPrayerSuggestionPrompt(
    prayerText: string,
    category?: string,
    context?: string
  ): string {
    return `Based on this prayer request: "${prayerText}"${category ? ` in the category: ${category}` : ''}${context ? ` with context: ${context}` : ''}, generate 3 prayer suggestions that would be helpful and encouraging. 

For each suggestion, provide:
- A meaningful title
- The prayer content (2-3 sentences)
- A relevant category
- An appropriate scripture reference (if applicable)
- 2-3 relevant tags

Format the response as JSON with this structure:
{
  "suggestions": [
    {
      "title": "Prayer title",
      "content": "Prayer content",
      "category": "Category name",
      "scripture_reference": "Book Chapter:Verse",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;
  }

  /**
   * Build prompt for Bible study generation
   */
  private buildBibleStudyPrompt(prayerText: string, topic?: string): string {
    return `Based on this prayer request: "${prayerText}"${topic ? ` focusing on: ${topic}` : ''}, create a Bible study that would provide spiritual guidance and encouragement.

Include:
- A relevant scripture passage (2-3 verses)
- A thoughtful reflection on how this scripture relates to the prayer request
- 3-4 discussion questions for personal reflection
- A prayer focus that ties everything together

Format the response as JSON with this structure:
{
  "title": "Bible Study Title",
  "scripture": "Scripture passage text",
  "reflection": "Thoughtful reflection",
  "questions": ["Question 1", "Question 2", "Question 3"],
  "prayer_focus": "Prayer focus statement"
}`;
  }

  /**
   * Build prompt for encouragement generation
   */
  private buildEncouragementPrompt(situation: string, mood?: string): string {
    return `Provide a brief, encouraging message (2-3 sentences) for someone who is ${situation}${mood ? ` and feeling ${mood}` : ''}. Make it uplifting, hopeful, and include a gentle reminder of God's love and presence. Keep it warm and personal.`;
  }

  /**
   * Build prompt for scripture verse generation
   */
  private buildScripturePrompt(prayerText: string, count: number): string {
    return `Based on this prayer request: "${prayerText}", suggest ${count} relevant Bible verses that would provide comfort, guidance, or encouragement.

For each verse, provide:
- The verse text
- The reference (Book Chapter:Verse)
- A brief explanation of why this verse is relevant

Format the response as JSON with this structure:
{
  "verses": [
    {
      "verse": "Verse text",
      "reference": "Book Chapter:Verse",
      "relevance": "Why this verse is relevant"
    }
  ]
}`;
  }

  /**
   * Parse prayer suggestions from AI response
   */
  private parsePrayerSuggestions(response: string): PrayerSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.suggestions || [];
    } catch (error) {
      console.error('Error parsing prayer suggestions:', error);
      // Fallback: return mock suggestions
      return [
        {
          title: 'Prayer for Strength',
          content: 'Lord, grant me the strength to face this challenge with faith and courage.',
          category: 'Strength',
          scripture_reference: 'Philippians 4:13',
          tags: ['strength', 'courage', 'faith'],
        },
      ];
    }
  }

  /**
   * Parse Bible study from AI response
   */
  private parseBibleStudy(response: string): BibleStudy {
    try {
      const parsed = JSON.parse(response);
      return {
        title: parsed.title || 'Bible Study',
        scripture: parsed.scripture || '',
        reflection: parsed.reflection || '',
        questions: parsed.questions || [],
        prayer_focus: parsed.prayer_focus || '',
      };
    } catch (error) {
      console.error('Error parsing Bible study:', error);
      // Fallback: return mock Bible study
      return {
        title: 'Finding Peace in Difficult Times',
        scripture: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid. - John 14:27',
        reflection: 'In times of uncertainty, Jesus offers us a peace that transcends our circumstances.',
        questions: [
          'What does it mean to have peace that is different from the world\'s peace?',
          'How can we practice not letting our hearts be troubled?',
          'What situations in your life need this kind of peace?',
        ],
        prayer_focus: 'Pray for the peace of Christ to fill your heart and mind.',
      };
    }
  }

  /**
   * Parse scripture verses from AI response
   */
  private parseScriptureVerses(response: string): Array<{ verse: string; reference: string; relevance: string }> {
    try {
      const parsed = JSON.parse(response);
      return parsed.verses || [];
    } catch (error) {
      console.error('Error parsing scripture verses:', error);
      // Fallback: return mock verses
      return [
        {
          verse: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.',
          reference: 'Jeremiah 29:11',
          relevance: 'A reminder of God\'s good plans for your life',
        },
      ];
    }
  }

  /**
   * Check if AI service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus(): { configured: boolean; message: string } {
    if (!this.apiKey) {
      return {
        configured: false,
        message: 'OpenAI API key not configured. AI features will use fallback content.',
      };
    }

    return {
      configured: true,
      message: 'AI service is properly configured and ready to use.',
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
