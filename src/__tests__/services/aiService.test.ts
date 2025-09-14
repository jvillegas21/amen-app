import aiService from '@/services/aiService';

// Mock fetch
global.fetch = jest.fn();

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset API key
    process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  });

  describe('generatePrayerSuggestions', () => {
    it('should return error when API key is not configured', async () => {
      delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      
      const result = await aiService.generatePrayerSuggestions('test prayer');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenAI API key not configured');
    });

    it('should generate prayer suggestions successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              suggestions: [
                {
                  title: 'Prayer for Strength',
                  content: 'Lord, grant me strength...',
                  category: 'Strength',
                  scripture_reference: 'Philippians 4:13',
                  tags: ['strength', 'courage'],
                },
              ],
            }),
          },
        }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await aiService.generatePrayerSuggestions('test prayer');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe('Prayer for Strength');
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await aiService.generatePrayerSuggestions('test prayer');

      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAI API error');
    });
  });

  describe('generateBibleStudy', () => {
    it('should generate Bible study successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Finding Peace',
              scripture: 'Peace I leave with you...',
              reflection: 'In times of uncertainty...',
              questions: ['What does peace mean to you?'],
              prayer_focus: 'Pray for peace in your heart.',
            }),
          },
        }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await aiService.generateBibleStudy('test prayer');

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Finding Peace');
      expect(result.data?.questions).toHaveLength(1);
    });
  });

  describe('generatePrayerEncouragement', () => {
    it('should generate encouragement successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'You are not alone in this journey. God is with you every step of the way.',
          },
        }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await aiService.generatePrayerEncouragement('difficult situation');

      expect(result.success).toBe(true);
      expect(result.data).toContain('You are not alone');
    });
  });

  describe('generateScriptureVerses', () => {
    it('should generate scripture verses successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              verses: [
                {
                  verse: 'For I know the plans I have for you...',
                  reference: 'Jeremiah 29:11',
                  relevance: 'A reminder of God\'s good plans',
                },
              ],
            }),
          },
        }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await aiService.generateScriptureVerses('test prayer', 1);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].reference).toBe('Jeremiah 29:11');
    });
  });

  describe('isConfigured', () => {
    it('should return true when API key is configured', () => {
      process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';
      expect(aiService.isConfigured()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      expect(aiService.isConfigured()).toBe(false);
    });
  });

  describe('getConfigurationStatus', () => {
    it('should return configured status when API key is present', () => {
      process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';
      const status = aiService.getConfigurationStatus();
      
      expect(status.configured).toBe(true);
      expect(status.message).toContain('properly configured');
    });

    it('should return not configured status when API key is missing', () => {
      delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      const status = aiService.getConfigurationStatus();
      
      expect(status.configured).toBe(false);
      expect(status.message).toContain('not configured');
    });
  });
});
