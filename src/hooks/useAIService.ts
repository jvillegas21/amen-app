import { useState, useCallback } from 'react';
import aiService, { PrayerSuggestion, BibleStudy } from '@/services/aiService';

interface UseAIServiceReturn {
  // Prayer suggestions
  generatePrayerSuggestions: (
    prayerText: string,
    category?: string,
    context?: string
  ) => Promise<PrayerSuggestion[]>;
  isGeneratingSuggestions: boolean;
  suggestionsError: string | null;

  // Bible study
  generateBibleStudy: (
    prayerText: string,
    topic?: string
  ) => Promise<BibleStudy | null>;
  isGeneratingBibleStudy: boolean;
  bibleStudyError: string | null;

  // Encouragement
  generateEncouragement: (
    situation: string,
    mood?: string
  ) => Promise<string | null>;
  isGeneratingEncouragement: boolean;
  encouragementError: string | null;

  // Scripture verses
  generateScriptureVerses: (
    prayerText: string,
    count?: number
  ) => Promise<Array<{ verse: string; reference: string; relevance: string }> | null>;
  isGeneratingVerses: boolean;
  versesError: string | null;

  // Configuration
  isConfigured: boolean;
  configurationStatus: { configured: boolean; message: string };
}

/**
 * Custom hook for AI service integration
 * Provides easy-to-use functions for AI-powered features
 */
export const useAIService = (): UseAIServiceReturn => {
  // Prayer suggestions state
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Bible study state
  const [isGeneratingBibleStudy, setIsGeneratingBibleStudy] = useState(false);
  const [bibleStudyError, setBibleStudyError] = useState<string | null>(null);

  // Encouragement state
  const [isGeneratingEncouragement, setIsGeneratingEncouragement] = useState(false);
  const [encouragementError, setEncouragementError] = useState<string | null>(null);

  // Scripture verses state
  const [isGeneratingVerses, setIsGeneratingVerses] = useState(false);
  const [versesError, setVersesError] = useState<string | null>(null);

  // Generate prayer suggestions
  const generatePrayerSuggestions = useCallback(async (
    prayerText: string,
    category?: string,
    context?: string
  ): Promise<PrayerSuggestion[]> => {
    setIsGeneratingSuggestions(true);
    setSuggestionsError(null);

    try {
      const response = await aiService.generatePrayerSuggestions(prayerText, category, context);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setSuggestionsError(response.error || 'Failed to generate prayer suggestions');
        return [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSuggestionsError(errorMessage);
      return [];
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, []);

  // Generate Bible study
  const generateBibleStudy = useCallback(async (
    prayerText: string,
    topic?: string
  ): Promise<BibleStudy | null> => {
    setIsGeneratingBibleStudy(true);
    setBibleStudyError(null);

    try {
      const response = await aiService.generateBibleStudy(prayerText, topic);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setBibleStudyError(response.error || 'Failed to generate Bible study');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setBibleStudyError(errorMessage);
      return null;
    } finally {
      setIsGeneratingBibleStudy(false);
    }
  }, []);

  // Generate encouragement
  const generateEncouragement = useCallback(async (
    situation: string,
    mood?: string
  ): Promise<string | null> => {
    setIsGeneratingEncouragement(true);
    setEncouragementError(null);

    try {
      const response = await aiService.generatePrayerEncouragement(situation, mood);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setEncouragementError(response.error || 'Failed to generate encouragement');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setEncouragementError(errorMessage);
      return null;
    } finally {
      setIsGeneratingEncouragement(false);
    }
  }, []);

  // Generate scripture verses
  const generateScriptureVerses = useCallback(async (
    prayerText: string,
    count: number = 3
  ): Promise<Array<{ verse: string; reference: string; relevance: string }> | null> => {
    setIsGeneratingVerses(true);
    setVersesError(null);

    try {
      const response = await aiService.generateScriptureVerses(prayerText, count);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setVersesError(response.error || 'Failed to generate scripture verses');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setVersesError(errorMessage);
      return null;
    } finally {
      setIsGeneratingVerses(false);
    }
  }, []);

  return {
    // Prayer suggestions
    generatePrayerSuggestions,
    isGeneratingSuggestions,
    suggestionsError,

    // Bible study
    generateBibleStudy,
    isGeneratingBibleStudy,
    bibleStudyError,

    // Encouragement
    generateEncouragement,
    isGeneratingEncouragement,
    encouragementError,

    // Scripture verses
    generateScriptureVerses,
    isGeneratingVerses,
    versesError,

    // Configuration
    isConfigured: aiService.isConfigured(),
    configurationStatus: aiService.getConfigurationStatus(),
  };
};

export default useAIService;
