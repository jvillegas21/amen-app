import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import aiService, { BibleStudy, AIScriptureVerse } from '@/services/aiService';
import { analyticsService } from '@/services/api/analyticsService';

/**
 * Dedicated AI Study Assistant screen for generating Bible study content
 */
const AIStudyAssistantScreen: React.FC<MainStackScreenProps<'AIStudyAssistant'>> = ({ navigation, route }) => {
  const initialMode: 'fullStudy' | 'scriptureSuggestions' = route.params?.mode ?? 'fullStudy';
  const initialTopic = route.params?.topic ?? '';
  const initialContext = route.params?.context ?? '';

  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();

  const [aiMode, setAIMode] = useState<'fullStudy' | 'scriptureSuggestions'>(initialMode);
  const [aiTopic, setAITopic] = useState(initialTopic);
  const [aiContext, setAIContext] = useState(initialContext);
  const [aiGeneratedStudy, setAIGeneratedStudy] = useState<BibleStudy | null>(null);
  const [aiScriptureSuggestions, setAIScriptureSuggestions] = useState<AIScriptureVerse[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  const generationStartRef = useRef<number | null>(null);
  const lastResultTypeRef = useRef<'none' | 'fullStudy' | 'scriptureSuggestions'>('none');
  const closingRef = useRef(false);

  const hasGeneratedStudy = !!aiGeneratedStudy;
  const hasScriptureResults = aiScriptureSuggestions.length > 0;
  const generateButtonLabel = aiMode === 'fullStudy'
    ? (hasGeneratedStudy ? 'Regenerate' : 'Generate Study Outline')
    : (hasScriptureResults ? 'Find New Verses' : 'Find Supporting Verses');

  const trackAIEvent = useCallback((eventType: string, eventData: Record<string, any> = {}) => {
    if (!user?.id) {
      return;
    }

    analyticsService.trackEvent(eventType, {
      source: 'create_bible_study',
      ...eventData,
    }, user.id);
  }, [user?.id]);

  useEffect(() => {
    trackAIEvent('ai_assistant_opened', {
      mode: initialMode,
      has_topic: initialTopic.trim().length > 0,
      has_context: initialContext.trim().length > 0,
    });
  }, [initialContext, initialMode, initialTopic, trackAIEvent]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (closingRef.current) {
        closingRef.current = false;
        return;
      }

      trackAIEvent('ai_assistant_closed', {
        reason: 'dismissed',
        result_type: lastResultTypeRef.current,
      });
    });

    return unsubscribe;
  }, [navigation, trackAIEvent]);

  const closeAssistant = useCallback((reason: 'dismissed' | 'applied_outline' | 'applied_verses' | 'error', result?: {
    type: 'fullStudy' | 'scriptureSuggestions';
    study?: BibleStudy;
    verses?: AIScriptureVerse[];
  }) => {
    closingRef.current = true;

    trackAIEvent('ai_assistant_closed', {
      reason,
      result_type: lastResultTypeRef.current,
    });

    if (result) {
      const state = navigation.getState();
      const previousRoute = state.routes[state.routes.length - 2];

      if (previousRoute) {
        navigation.dispatch(
          CommonActions.setParams({
            params: {
              ...(previousRoute.params || {}),
              aiResult: result,
            },
            source: previousRoute.key,
          })
        );
      }

      navigation.goBack();
      return;
    }

    navigation.goBack();
  }, [navigation, trackAIEvent]);

  const handleAIModeChange = useCallback((mode: 'fullStudy' | 'scriptureSuggestions') => {
    if (mode === aiMode) {
      return;
    }

    trackAIEvent('ai_assistant_mode_change', {
      previous_mode: aiMode,
      next_mode: mode,
    });

    setAIMode(mode);
    setAIGeneratedStudy(null);
    setAIScriptureSuggestions([]);
    setAIError(null);
  }, [aiMode, trackAIEvent]);

  const handleGenerateWithAI = useCallback(async () => {
    if (!aiTopic.trim() && !aiContext.trim()) {
      setAIError('Provide a topic or a short description so we know what to generate.');
      return;
    }

    generationStartRef.current = Date.now();
    lastResultTypeRef.current = 'none';
    trackAIEvent('ai_generation_start', {
      mode: aiMode,
      topic_length: aiTopic.trim().length,
      context_length: aiContext.trim().length,
    });

    setIsGeneratingAI(true);
    setAIError(null);
    // Keep existing results visible during regeneration

    try {
      if (aiMode === 'fullStudy') {
        const response = await aiService.generateBibleStudy(
          aiContext.trim() || aiTopic.trim(),
          aiTopic.trim() || undefined,
          user?.id
        );

        if (!response.success || !response.data) {
          const latencyMs = generationStartRef.current ? Date.now() - generationStartRef.current : null;
          trackAIEvent('ai_generation_error', {
            mode: 'fullStudy',
            latency_ms: latencyMs,
            error: response.error || 'unknown_error',
          });
          generationStartRef.current = null;
          lastResultTypeRef.current = 'none';
          setAIError(response.error || 'Unable to generate a study right now.');
          return;
        }

        setAIGeneratedStudy(response.data);
        setAIScriptureSuggestions([]); // Clear scripture suggestions when switching to study
        lastResultTypeRef.current = 'fullStudy';

        const latencyMs = generationStartRef.current ? Date.now() - generationStartRef.current : null;
        const usage = response.metadata?.usage || {};
        trackAIEvent('ai_generation_success', {
          mode: 'fullStudy',
          latency_ms: latencyMs,
          prompt_tokens: usage.prompt_tokens ?? null,
          completion_tokens: usage.completion_tokens ?? null,
          total_tokens: usage.total_tokens ?? null,
        });
        generationStartRef.current = null;
      } else {
        const response = await aiService.generateScriptureVerses(
          aiContext.trim() || aiTopic.trim(),
          3
        );

        if (!response.success || !response.data) {
          const latencyMs = generationStartRef.current ? Date.now() - generationStartRef.current : null;
          trackAIEvent('ai_generation_error', {
            mode: 'scriptureSuggestions',
            latency_ms: latencyMs,
            error: response.error || 'unknown_error',
          });
          generationStartRef.current = null;
          lastResultTypeRef.current = 'none';
          setAIError(response.error || 'Unable to find matching verses. Try refining your topic.');
          return;
        }

        setAIScriptureSuggestions(response.data);
        setAIGeneratedStudy(null); // Clear study when switching to verses
        lastResultTypeRef.current = 'scriptureSuggestions';

        const latencyMs = generationStartRef.current ? Date.now() - generationStartRef.current : null;
        const usage = response.metadata?.usage || {};
        trackAIEvent('ai_generation_success', {
          mode: 'scriptureSuggestions',
          latency_ms: latencyMs,
          prompt_tokens: usage.prompt_tokens ?? null,
          completion_tokens: usage.completion_tokens ?? null,
          total_tokens: usage.total_tokens ?? null,
          verse_count: response.data.length,
        });
        generationStartRef.current = null;
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setAIError('Something went wrong while talking with the AI service. Please try again.');
      const latencyMs = generationStartRef.current ? Date.now() - generationStartRef.current : null;
      trackAIEvent('ai_generation_error', {
        mode: aiMode,
        latency_ms: latencyMs,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      generationStartRef.current = null;
      lastResultTypeRef.current = 'none';
    } finally {
      setIsGeneratingAI(false);
    }
  }, [aiMode, aiTopic, aiContext, trackAIEvent, user?.id]);

  const handleApplyOutline = useCallback(() => {
    if (!aiGeneratedStudy) {
      return;
    }

    closeAssistant('applied_outline', {
      type: 'fullStudy',
      study: aiGeneratedStudy,
    });
  }, [aiGeneratedStudy, closeAssistant]);

  const handleApplyScriptureSuggestions = useCallback(() => {
    if (!aiScriptureSuggestions.length) {
      return;
    }

    closeAssistant('applied_verses', {
      type: 'scriptureSuggestions',
      verses: aiScriptureSuggestions,
    });
  }, [aiScriptureSuggestions, closeAssistant]);

  if (!aiService.isConfigured()) {
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#6B7280" />
        <Text style={styles.emptyStateTitle}>AI Assistant Disabled</Text>
        <Text style={styles.emptyStateDescription}>
          Add your OpenAI API key in the app settings to generate Bible study content with AI.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[styles.modeButton, aiMode === 'fullStudy' && styles.modeButtonActive]}
                onPress={() => handleAIModeChange('fullStudy')}
              >
                <Text style={[styles.modeButtonText, aiMode === 'fullStudy' && styles.modeButtonTextActive]}>
                  Generate Outline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, aiMode === 'scriptureSuggestions' && styles.modeButtonActive]}
                onPress={() => handleAIModeChange('scriptureSuggestions')}
              >
                <Text style={[styles.modeButtonText, aiMode === 'scriptureSuggestions' && styles.modeButtonTextActive]}>
                  Suggest Verses
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Topic or theme</Text>
              <TextInput
                style={styles.textInput}
                value={aiTopic}
                onChangeText={setAITopic}
                placeholder="e.g., Forgiveness, Hope, James 1"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="sentences"
                returnKeyType="done"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {aiMode === 'fullStudy' ? 'What should we focus on?' : 'Additional context (optional)'}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={aiContext}
                onChangeText={setAIContext}
                placeholder={aiMode === 'fullStudy' ? 'Share goals, audience, or key points to emphasize.' : 'Add any details we should consider.'}
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.hintText}>
              Tip: The more context you provide, the better the AI can tailor the study.
            </Text>

            {aiError && <Text style={styles.errorText}>{aiError}</Text>}
          </View>

          {aiGeneratedStudy && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>{aiGeneratedStudy.title}</Text>

              {aiGeneratedStudy.scripture ? (
                <View style={styles.resultBlock}>
                  <Text style={styles.resultLabel}>Primary Scripture</Text>
                  <Text style={styles.resultText}>{aiGeneratedStudy.scripture}</Text>
                </View>
              ) : null}

              {aiGeneratedStudy.reflection ? (
                <View style={styles.resultBlock}>
                  <Text style={styles.resultLabel}>Reflection</Text>
                  <Text style={styles.resultText}>{aiGeneratedStudy.reflection}</Text>
                </View>
              ) : null}

              {aiGeneratedStudy.questions?.length ? (
                <View style={styles.resultBlock}>
                  <Text style={styles.resultLabel}>Discussion Questions</Text>
                  {aiGeneratedStudy.questions.map((question, index) => (
                    <Text key={index} style={styles.resultListItem}>
                      {index + 1}. {question}
                    </Text>
                  ))}
                </View>
              ) : null}

              {aiGeneratedStudy.prayer_focus ? (
                <View style={styles.resultBlock}>
                  <Text style={styles.resultLabel}>Prayer Focus</Text>
                  <Text style={styles.resultText}>{aiGeneratedStudy.prayer_focus}</Text>
                </View>
              ) : null}

              {aiGeneratedStudy.application ? (
                <View style={styles.resultBlock}>
                  <Text style={styles.resultLabel}>Application</Text>
                  <Text style={styles.resultText}>{aiGeneratedStudy.application}</Text>
                </View>
              ) : null}
            </View>
          )}

          {aiScriptureSuggestions.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>Suggested Verses</Text>
              {aiScriptureSuggestions.map((verse, index) => (
                <View key={index} style={styles.verseBlock}>
                  <Text style={styles.resultText}>{verse.reference}</Text>
                  <Text style={styles.resultText}>{verse.verse}</Text>
                  <Text style={styles.resultHint}>{verse.relevance}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {aiMode === 'fullStudy' && hasGeneratedStudy ? (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.footerButton, isGeneratingAI && styles.primaryButtonDisabled]}
                onPress={handleGenerateWithAI}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.primaryButtonText}>{generateButtonLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.footerButton, isGeneratingAI && styles.secondaryButtonDisabled]}
                onPress={handleApplyOutline}
                disabled={isGeneratingAI}
              >
                <Text style={styles.secondaryButtonText}>Save Outline</Text>
              </TouchableOpacity>
            </View>
          ) : aiMode === 'scriptureSuggestions' && hasScriptureResults ? (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.footerButton, isGeneratingAI && styles.primaryButtonDisabled]}
                onPress={handleGenerateWithAI}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.primaryButtonText}>{generateButtonLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.footerButton, isGeneratingAI && styles.secondaryButtonDisabled]}
                onPress={handleApplyScriptureSuggestions}
                disabled={isGeneratingAI}
              >
                <Text style={styles.secondaryButtonText}>Add Verses to Study</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isGeneratingAI && styles.primaryButtonDisabled]}
              onPress={handleGenerateWithAI}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>{generateButtonLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#5B21B6',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    color: '#DC2626',
  },
  resultSection: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  resultBlock: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  resultText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  resultListItem: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
    paddingLeft: 4,
  },
  resultHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  verseBlock: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  footer: {
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptyStateDescription: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AIStudyAssistantScreen;
