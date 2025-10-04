import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { supabase } from '@/config/supabase';
import { layout } from '@/theme/spacing';
import aiService, { BibleStudy, AIScriptureVerse } from '@/services/aiService';
import { analyticsService } from '@/services/api/analyticsService';

/**
 * Create Bible Study Screen - Create a new Bible study with AI insights
 */
const CreateBibleStudyScreen: React.FC<RootStackScreenProps<'CreateBibleStudy'>> = ({ navigation }) => {
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scripture: '',
    studyType: 'group', // 'group' or 'individual'
    isPublic: true,
    maxParticipants: 20,
    scheduledDate: '',
    scheduledTime: '',
    duration: 60, // minutes
  });

  const textInputRef = useRef<TextInput>(null);

  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMode, setAIMode] = useState<'fullStudy' | 'scriptureSuggestions'>('fullStudy');
  const [aiTopic, setAITopic] = useState('');
  const [aiContext, setAIContext] = useState('');
  const [aiGeneratedStudy, setAIGeneratedStudy] = useState<BibleStudy | null>(null);
  const [aiScriptureSuggestions, setAIScriptureSuggestions] = useState<AIScriptureVerse[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const generationStartRef = useRef<number | null>(null);
  const lastResultTypeRef = useRef<'none' | 'fullStudy' | 'scriptureSuggestions'>('none');

  const trackAIEvent = useCallback((eventType: string, eventData: Record<string, any> = {}) => {
    if (!user?.id) {
      return;
    }

    analyticsService.trackEvent(eventType, {
      source: 'create_bible_study',
      ...eventData,
    }, user.id);
  }, [user?.id]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenAIAssistant = () => {
    if (!aiService.isConfigured()) {
      trackAIEvent('ai_assistant_open_blocked', { reason: 'missing_api_key' });
      Alert.alert(
        'AI Assistant Unavailable',
        'Add your OpenAI API key to enable AI generated studies.'
      );
      return;
    }

    trackAIEvent('ai_assistant_opened', {
      mode: aiMode,
      has_topic: aiTopic.trim().length > 0,
      has_context: aiContext.trim().length > 0,
    });

    lastResultTypeRef.current = 'none';
    generationStartRef.current = null;
    setAIError(null);
    setShowAIAssistant(true);
  };

  const handleCloseAIAssistant = (
    reason: 'dismissed' | 'applied_outline' | 'applied_verses' | 'error' = 'dismissed'
  ) => {
    trackAIEvent('ai_assistant_closed', {
      reason,
      result_type: lastResultTypeRef.current,
    });

    setShowAIAssistant(false);
    setIsGeneratingAI(false);
    setAITopic('');
    setAIContext('');
    setAIGeneratedStudy(null);
    setAIScriptureSuggestions([]);
    setAIError(null);
  };

  const handleAIModeChange = (mode: 'fullStudy' | 'scriptureSuggestions') => {
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
  };

  const handleGenerateWithAI = async () => {
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
    setAIGeneratedStudy(null);
    setAIScriptureSuggestions([]);

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
  };

  const applyAIGeneratedStudy = () => {
    if (!aiGeneratedStudy) return;

    const sectionedDescription = [
      aiGeneratedStudy.reflection,
      aiGeneratedStudy.questions?.length
        ? 'Discussion Questions:\n' + aiGeneratedStudy.questions.map((question: string, index: number) => `${index + 1}. ${question}`).join('\n')
        : null,
      aiGeneratedStudy.prayer_focus
        ? `Prayer Focus: ${aiGeneratedStudy.prayer_focus}`
        : null,
      aiGeneratedStudy.application
        ? `Application: ${aiGeneratedStudy.application}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    setFormData(prev => ({
      ...prev,
      title: prev.title.trim().length > 0 ? prev.title : aiGeneratedStudy.title,
      description: sectionedDescription.trim().length > 0 ? sectionedDescription : prev.description,
      scripture: aiGeneratedStudy.scripture || prev.scripture,
    }));

    trackAIEvent('ai_generation_apply_outline', {
      mode: 'fullStudy',
      question_count: aiGeneratedStudy.questions?.length || 0,
      included_prayer_focus: !!aiGeneratedStudy.prayer_focus,
      included_application: !!aiGeneratedStudy.application,
    });

    Alert.alert('AI Outline Applied', 'We filled in your study details. Review and edit before publishing.');
    handleCloseAIAssistant('applied_outline');
  };

  const applyAIScriptureSuggestions = () => {
    if (aiScriptureSuggestions.length === 0) return;

    const scriptureValue = aiScriptureSuggestions
      .map(suggestion => suggestion.reference)
      .join(', ');

    setFormData(prev => ({
      ...prev,
      scripture: scriptureValue,
      description: prev.description,
    }));

    trackAIEvent('ai_generation_apply_verses', {
      mode: 'scriptureSuggestions',
      verse_count: aiScriptureSuggestions.length,
    });

    Alert.alert('Verses Added', 'We added AI-recommended verses to your study.');
    handleCloseAIAssistant('applied_verses');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      setSelectedDate(selectedDate);
      setFormData(prev => ({
        ...prev,
        scheduledDate: format(selectedDate, 'MMM dd, yyyy'),
      }));
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (event.type === 'set' && selectedTime) {
      setSelectedTime(selectedTime);
      setFormData(prev => ({
        ...prev,
        scheduledTime: format(selectedTime, 'h:mm a'),
      }));
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const handleDateButtonPress = () => {
    setShowDatePicker(true);
  };

  const handleTimeButtonPress = () => {
    setShowTimePicker(true);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a study title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a study description');
      return false;
    }
    if (!formData.scripture.trim()) {
      Alert.alert('Validation Error', 'Please enter the scripture reference');
      return false;
    }
    return true;
  };

  const isFormValid = () => {
    return formData.title.trim().length > 0 && 
           formData.description.trim().length > 0 && 
           formData.scripture.trim().length > 0;
  };

  const handleCreateStudy = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create Bible study data
      const studyData = {
        title: formData.title,
        description: formData.description,
        scripture: formData.scripture,
        studyType: formData.studyType,
        isPublic: formData.isPublic,
        maxParticipants: formData.maxParticipants,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        duration: formData.duration,
      };

      // Save to database using the studies table
      const { data, error } = await supabase
        .from('studies')
        .insert({
          title: studyData.title,
          content_md: studyData.description,
          scripture_references: [{
            reference: studyData.scripture,
            book: studyData.scripture.split(' ')[0] || 'Unknown',
            chapter: 1,
            verse_start: 1,
            verse_end: 1
          }],
          ai_model: 'manual',
          ai_prompt_version: 'v1.0',
          quality_score: 3,
          is_featured: studyData.isPublic,
          view_count: 0,
          save_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to save Bible study to database');
      }

      console.log('Bible study created successfully:', data);

      // Navigate to the created Bible study details
      navigation.replace('BibleStudyDetails', { studyId: data.id });
    } catch (error) {
      console.error('Error creating Bible study:', error);
      Alert.alert('Error', 'Failed to create Bible study. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSubtitle = () => (
    <View style={styles.subtitleContainer}>
      <Text style={styles.subtitleText}>Start a new study with AI insights</Text>
    </View>
  );

  const renderAISupportSection = () => {
    const aiAvailable = aiService.isConfigured();

    return (
      <View style={[styles.section, styles.aiSection]}>
        <View style={styles.aiHeaderRow}>
          <View style={styles.aiHeaderText}>
            <Text style={styles.sectionTitle}>AI Study Assistant</Text>
            <Text style={styles.aiSectionSubtitle}>
              Generate outlines or add scripture references instantly. Free while in beta.
            </Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles-outline" size={16} color="#5B21B6" />
            <Text style={styles.aiBadgeText}>Beta</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.aiActionButton, !aiAvailable && styles.aiActionButtonDisabled]}
          onPress={handleOpenAIAssistant}
          accessibilityRole="button"
          accessibilityLabel="Open AI assistant"
          accessibilityHint="Generate Bible study content or verse suggestions"
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" style={styles.aiActionIcon} />
          <Text style={styles.aiActionButtonText}>
            {aiAvailable ? 'Generate with AI' : 'Connect OpenAI to enable AI'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.aiDisclaimerText}>
          You can still edit everything manually. We’ll eventually offer this as a premium feature—capture usage analytics now to plan pricing later.
        </Text>
      </View>
    );
  };

  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Study Title *</Text>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
          placeholder="Enter study title..."
          placeholderTextColor="#9CA3AF"
          maxLength={100}
        />
        <Text style={styles.characterCount}>{formData.title.length}/100</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Describe what this study will cover..."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>{formData.description.length}/500</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Scripture Reference *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.scripture}
          onChangeText={(value) => handleInputChange('scripture', value)}
          placeholder="e.g., John 3:16, Romans 8:28-30"
          placeholderTextColor="#9CA3AF"
          maxLength={100}
        />
      </View>
    </View>
  );

  const renderStudySettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Study Settings</Text>
      
      <View style={styles.settingColumn}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Study Type</Text>
          <Text style={styles.settingDescription}>Choose how participants will study</Text>
        </View>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.studyType === 'group' && styles.typeButtonActive
            ]}
            onPress={() => handleInputChange('studyType', 'group')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={formData.studyType === 'group' ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[
              styles.typeButtonText,
              formData.studyType === 'group' && styles.typeButtonTextActive
            ]}>
              Group
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.studyType === 'individual' && styles.typeButtonActive
            ]}
            onPress={() => handleInputChange('studyType', 'individual')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={formData.studyType === 'individual' ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[
              styles.typeButtonText,
              formData.studyType === 'individual' && styles.typeButtonTextActive
            ]}>
              Individual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Public Study</Text>
          <Text style={styles.settingDescription}>Allow others to discover and join</Text>
        </View>
        <Switch
          value={formData.isPublic}
          onValueChange={(value) => handleInputChange('isPublic', value)}
          trackColor={{ false: '#E5E7EB', true: '#5B21B6' }}
          thumbColor={formData.isPublic ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>

      {formData.studyType === 'group' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Maximum Participants</Text>
          <TextInput
            style={styles.textInput}
            value={formData.maxParticipants.toString()}
            onChangeText={(value) => handleInputChange('maxParticipants', parseInt(value) || 20)}
            placeholder="20"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
      )}
    </View>
  );

  const renderScheduleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Schedule (Optional)</Text>
      
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeField}>
          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity style={styles.dateTimeButton} onPress={handleDateButtonPress}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.dateTimeButtonText}>
              {formData.scheduledDate || 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeField}>
          <Text style={styles.inputLabel}>Time</Text>
          <TouchableOpacity style={styles.dateTimeButton} onPress={handleTimeButtonPress}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.dateTimeButtonText}>
              {formData.scheduledTime || 'Select time'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Duration (minutes)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.duration.toString()}
          onChangeText={(value) => handleInputChange('duration', parseInt(value) || 60)}
          placeholder="60"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderSubtitle()}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {renderAISupportSection()}
            {renderBasicInfoSection()}
            {renderStudySettingsSection()}
            {renderScheduleSection()}
            
          </View>
        </ScrollView>

        <Modal
          visible={showAIAssistant}
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => handleCloseAIAssistant('dismissed')}
        >
          <View style={styles.aiModalOverlay}>
            <View style={[styles.aiModalContainer, { paddingBottom: Math.max(insets.bottom, layout.drawerBottomPadding) }]}>
              <View style={styles.aiModalHeader}>
                <View style={styles.aiModalHeaderText}>
                  <Text style={styles.aiModalTitle}>AI Study Assistant</Text>
                  <Text style={styles.aiModalSubtitle}>
                    {aiMode === 'fullStudy'
                      ? 'We will generate an outline, reflection, questions, and prayer focus.'
                      : 'We will suggest verses that align with your theme.'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCloseAIAssistant('dismissed')}
                  accessibilityRole="button"
                  accessibilityLabel="Close AI assistant"
                >
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              <View style={styles.aiModeToggle}>
                <TouchableOpacity
                  style={[styles.aiModeButton, aiMode === 'fullStudy' && styles.aiModeButtonActive]}
                  onPress={() => handleAIModeChange('fullStudy')}
                >
                  <Text style={[styles.aiModeButtonText, aiMode === 'fullStudy' && styles.aiModeButtonTextActive]}>
                    Generate Outline
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.aiModeButton, aiMode === 'scriptureSuggestions' && styles.aiModeButtonActive]}
                  onPress={() => handleAIModeChange('scriptureSuggestions')}
                >
                  <Text style={[styles.aiModeButtonText, aiMode === 'scriptureSuggestions' && styles.aiModeButtonTextActive]}>
                    Suggest Verses
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
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

              <View style={styles.inputContainer}>
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

              <Text style={styles.aiHintText}>
                Tip: The more context you provide, the better the AI can tailor the study.
              </Text>

              {aiError && <Text style={styles.aiErrorText}>{aiError}</Text>}

              <TouchableOpacity
                style={[styles.aiGenerateButton, isGeneratingAI && styles.aiGenerateButtonDisabled]}
                onPress={handleGenerateWithAI}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" style={styles.aiActionIcon} />
                    <Text style={styles.aiGenerateButtonText}>
                      {aiMode === 'fullStudy' ? 'Generate Study Outline' : 'Find Supporting Verses'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {aiGeneratedStudy && (
                <ScrollView style={styles.aiResultScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.aiResultContainer}>
                    <Text style={styles.aiResultTitle}>{aiGeneratedStudy.title}</Text>
                    {aiGeneratedStudy.scripture ? (
                      <View style={styles.aiResultBlock}>
                        <Text style={styles.aiResultLabel}>Primary Scripture</Text>
                        <Text style={styles.aiResultText}>{aiGeneratedStudy.scripture}</Text>
                      </View>
                    ) : null}
                    {aiGeneratedStudy.reflection ? (
                      <View style={styles.aiResultBlock}>
                        <Text style={styles.aiResultLabel}>Reflection</Text>
                        <Text style={styles.aiResultText}>{aiGeneratedStudy.reflection}</Text>
                      </View>
                    ) : null}
                    {aiGeneratedStudy.questions?.length ? (
                      <View style={styles.aiResultBlock}>
                        <Text style={styles.aiResultLabel}>Discussion Questions</Text>
                        {aiGeneratedStudy.questions.map((question, index) => (
                          <Text key={index} style={styles.aiResultListItem}>
                            {index + 1}. {question}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    {aiGeneratedStudy.prayer_focus ? (
                      <View style={styles.aiResultBlock}>
                        <Text style={styles.aiResultLabel}>Prayer Focus</Text>
                        <Text style={styles.aiResultText}>{aiGeneratedStudy.prayer_focus}</Text>
                      </View>
                    ) : null}
                    {aiGeneratedStudy.application ? (
                      <View style={styles.aiResultBlock}>
                        <Text style={styles.aiResultLabel}>Application</Text>
                        <Text style={styles.aiResultText}>{aiGeneratedStudy.application}</Text>
                      </View>
                    ) : null}
                  </View>
                </ScrollView>
              )}

              {aiScriptureSuggestions.length > 0 && (
                <ScrollView style={styles.aiResultScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.aiResultContainer}>
                    <Text style={styles.aiResultLabel}>Suggested Verses</Text>
                    {aiScriptureSuggestions.map((verse, index) => (
                      <View key={index} style={styles.aiScriptureItem}>
                        <Text style={styles.aiResultText}>{verse.reference}</Text>
                        <Text style={styles.aiResultText}>{verse.verse}</Text>
                        <Text style={styles.aiResultHint}>{verse.relevance}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {aiGeneratedStudy && (
                <TouchableOpacity style={styles.aiUseButton} onPress={applyAIGeneratedStudy}>
                  <Text style={styles.aiUseButtonText}>Use This Outline</Text>
                </TouchableOpacity>
              )}

              {aiScriptureSuggestions.length > 0 && (
                <TouchableOpacity style={styles.aiUseButton} onPress={applyAIScriptureSuggestions}>
                  <Text style={styles.aiUseButtonText}>Add Verses to Study</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.pickerModal}>
            <View style={[styles.pickerContainer, { paddingBottom: Math.max(insets.bottom, layout.drawerBottomPadding) }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
            </View>
          </View>
        )}
        
        {/* Time Picker Modal */}
        {showTimePicker && (
          <View style={styles.pickerModal}>
            <View style={[styles.pickerContainer, { paddingBottom: Math.max(insets.bottom, layout.drawerBottomPadding) }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.picker}
              />
            </View>
          </View>
        )}
        
        {/* Floating Create Button */}
        <View style={[styles.floatingButtonContainer, { paddingBottom: 0 }]}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              (!isFormValid() || isLoading) && styles.floatingButtonDisabled
            ]}
            onPress={handleCreateStudy}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.floatingButtonText,
                (!isFormValid() || isLoading) && styles.floatingButtonTextDisabled
              ]}>
                Create Study
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  subtitleContainer: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitleText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  aiSection: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiSectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiBadgeText: {
    color: '#5B21B6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  aiActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  aiActionButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  aiActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  aiActionIcon: {
    marginRight: 8,
  },
  aiDisclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
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
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingColumn: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    paddingBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#5B21B6',
    borderColor: '#5B21B6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    justifyContent: 'flex-end',
  },
  aiModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aiModalHeaderText: {
    flex: 1,
    paddingRight: 16,
  },
  aiModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  aiModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  aiModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  aiModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiModeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiModeButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  aiModeButtonTextActive: {
    color: '#5B21B6',
    fontWeight: '600',
  },
  aiHintText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  aiErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 12,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  aiGenerateButtonDisabled: {
    opacity: 0.7,
  },
  aiGenerateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  aiResultScroll: {
    marginTop: 16,
    maxHeight: 280,
  },
  aiResultContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aiResultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  aiResultBlock: {
    marginBottom: 12,
  },
  aiResultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  aiResultText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  aiResultListItem: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
    paddingLeft: 4,
  },
  aiResultHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  aiScriptureItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  aiUseButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  aiUseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: layout.drawerBottomPadding,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  pickerDoneText: {
    fontSize: 16,
    color: '#5B21B6',
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButton: {
    backgroundColor: '#D97706',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  floatingButtonTextDisabled: {
    color: '#FFFFFF',
  },
});

export default CreateBibleStudyScreen;
