/**
 * AI Integration Hook - Provides AI-powered features for prayers and Bible studies
 */

import { useState, useCallback, useEffect } from 'react';
import { aiIntegrationService } from '@/services/ai/aiIntegrationService';
import { BibleStudy } from '@/types/database.types';

interface StudySuggestion {
  id: string;
  title: string;
  snippet: string;
  scriptureRefs: string[];
  confidence: number;
  prayerId: string;
}

interface UseAIIntegrationReturn {
  // Study suggestions
  suggestions: StudySuggestion[];
  isLoadingSuggestions: boolean;
  generateSuggestions: (prayerText: string, prayerId: string) => Promise<void>;
  
  // Full study generation
  isGeneratingStudy: boolean;
  generateFullStudy: (request: { prayerId: string; suggestionId: string; customPrompt?: string }) => Promise<BibleStudy | null>;
  
  // Saved studies
  savedStudies: BibleStudy[];
  isLoadingSavedStudies: boolean;
  loadSavedStudies: (page?: number) => Promise<void>;
  
  // Featured studies
  featuredStudies: BibleStudy[];
  isLoadingFeaturedStudies: boolean;
  loadFeaturedStudies: () => Promise<void>;
  
  // Study interactions
  incrementStudyViews: (studyId: string) => Promise<void>;
  saveStudy: (studyId: string) => Promise<void>;
  removeSavedStudy: (studyId: string) => Promise<void>;
  
  // Configuration
  isConfigured: boolean;
  configurationStatus: { configured: boolean; message: string };
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useAIIntegration = (): UseAIIntegrationReturn => {
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeneratingStudy, setIsGeneratingStudy] = useState(false);
  const [savedStudies, setSavedStudies] = useState<BibleStudy[]>([]);
  const [isLoadingSavedStudies, setIsLoadingSavedStudies] = useState(false);
  const [featuredStudies, setFeaturedStudies] = useState<BibleStudy[]>([]);
  const [isLoadingFeaturedStudies, setIsLoadingFeaturedStudies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configurationStatus = aiIntegrationService.getConfigurationStatus();
  const isConfigured = configurationStatus.configured;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateSuggestions = useCallback(async (prayerText: string, prayerId: string) => {
    if (!isConfigured) {
      setError('AI service is not configured. Please check your OpenAI API key.');
      return;
    }

    setIsLoadingSuggestions(true);
    setError(null);

    try {
      const { data: { user } } = await import('@/config/supabase').then(m => m.supabase.auth.getUser());
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newSuggestions = await aiIntegrationService.generateStudySuggestions(
        prayerText,
        prayerId,
        user.id
      );
      
      setSuggestions(newSuggestions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(errorMessage);
      console.error('Error generating suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [isConfigured]);

  const generateFullStudy = useCallback(async (request: { prayerId: string; suggestionId: string; customPrompt?: string }) => {
    if (!isConfigured) {
      setError('AI service is not configured. Please check your OpenAI API key.');
      return null;
    }

    setIsGeneratingStudy(true);
    setError(null);

    try {
      const response = await aiIntegrationService.generateFullStudy(request);
      return response.study;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate Bible study';
      setError(errorMessage);
      console.error('Error generating full study:', err);
      return null;
    } finally {
      setIsGeneratingStudy(false);
    }
  }, [isConfigured]);

  const loadSavedStudies = useCallback(async (page = 1) => {
    setIsLoadingSavedStudies(true);
    setError(null);

    try {
      const { data: { user } } = await import('@/config/supabase').then(m => m.supabase.auth.getUser());
      if (!user) {
        throw new Error('User not authenticated');
      }

      const studies = await aiIntegrationService.getSavedStudies(user.id, page);
      
      if (page === 1) {
        setSavedStudies(studies);
      } else {
        setSavedStudies(prev => [...prev, ...studies]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load saved studies';
      setError(errorMessage);
      console.error('Error loading saved studies:', err);
    } finally {
      setIsLoadingSavedStudies(false);
    }
  }, []);

  const loadFeaturedStudies = useCallback(async () => {
    setIsLoadingFeaturedStudies(true);
    setError(null);

    try {
      const studies = await aiIntegrationService.getFeaturedStudies();
      setFeaturedStudies(studies);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load featured studies';
      setError(errorMessage);
      console.error('Error loading featured studies:', err);
    } finally {
      setIsLoadingFeaturedStudies(false);
    }
  }, []);

  const incrementStudyViews = useCallback(async (studyId: string) => {
    try {
      await aiIntegrationService.incrementStudyViews(studyId);
    } catch (err) {
      console.error('Error incrementing study views:', err);
    }
  }, []);

  const saveStudy = useCallback(async (studyId: string) => {
    try {
      const { data: { user } } = await import('@/config/supabase').then(m => m.supabase.auth.getUser());
      if (!user) {
        throw new Error('User not authenticated');
      }

      await aiIntegrationService.saveStudyToUser(studyId, user.id);
      
      // Update local state
      setSavedStudies(prev => {
        const study = featuredStudies.find(s => s.id === studyId) || 
                     savedStudies.find(s => s.id === studyId);
        if (study && !prev.find(s => s.id === studyId)) {
          return [...prev, study];
        }
        return prev;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save study';
      setError(errorMessage);
      console.error('Error saving study:', err);
    }
  }, [featuredStudies, savedStudies]);

  const removeSavedStudy = useCallback(async (studyId: string) => {
    try {
      const { data: { user } } = await import('@/config/supabase').then(m => m.supabase.auth.getUser());
      if (!user) {
        throw new Error('User not authenticated');
      }

      await aiIntegrationService.removeSavedStudy(studyId, user.id);
      
      // Update local state
      setSavedStudies(prev => prev.filter(study => study.id !== studyId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove saved study';
      setError(errorMessage);
      console.error('Error removing saved study:', err);
    }
  }, []);

  // Load featured studies on mount
  useEffect(() => {
    loadFeaturedStudies();
  }, [loadFeaturedStudies]);

  return {
    suggestions,
    isLoadingSuggestions,
    generateSuggestions,
    isGeneratingStudy,
    generateFullStudy,
    savedStudies,
    isLoadingSavedStudies,
    loadSavedStudies,
    featuredStudies,
    isLoadingFeaturedStudies,
    loadFeaturedStudies,
    incrementStudyViews,
    saveStudy,
    removeSavedStudy,
    isConfigured,
    configurationStatus,
    error,
    clearError,
  };
};