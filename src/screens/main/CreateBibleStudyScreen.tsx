import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { supabase } from '@/config/supabase';

import aiService, { BibleStudy } from '@/services/aiService';
import { analyticsService } from '@/services/api/analyticsService';
import { extractStudySections, toStringSafe } from '@/utils/scripture';

type CreateMode = 'selection' | 'ai-input' | 'manual' | 'preview';

/**
 * Create Bible Study Screen - Redesigned with distinct AI and Manual workflows
 */
const CreateBibleStudyScreen: React.FC<MainStackScreenProps<'CreateBibleStudy'>> = ({ navigation, route }) => {
  const user = useAuthStore(state => state.user);

  const [mode, setMode] = useState<CreateMode>('selection');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Date/Time Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Form Data
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
    aiTopic: '', // For AI input
  });

  // Handle initial data from navigation (e.g. "Copy Study")
  useEffect(() => {
    if (route.params?.initialData) {
      const { title, content, scripture_references } = route.params.initialData;
      setFormData(prev => ({
        ...prev,
        title: title || '',
        description: content || '',
        scripture: Array.isArray(scripture_references)
          ? scripture_references.map((ref: any) => `${ref.book} ${ref.chapter}:${ref.verse_start}${ref.verse_end ? `-${ref.verse_end}` : ''}`).join('\n')
          : '',
      }));
      setMode('manual'); // Jump straight to manual editor if copying
    }
  }, [route.params?.initialData]);



  // Handle Back Navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (mode === 'selection') {
        // If we are in selection mode, let the default behavior happen (go back to previous screen)
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Go back to selection mode
      setMode('selection');
    });

    return unsubscribe;
  }, [navigation, mode]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const extractScriptureReferences = useCallback((text: string): string => {
    if (!text) return '';
    const referencePattern = /([1-3]?\s?[A-Za-z]+(?:\s[\w]+)*)\s\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?/g;
    const matches = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = referencePattern.exec(text)) !== null) {
      matches.add(match[0].trim());
    }
    return Array.from(matches).join('\n');
  }, []);

  const applyGeneratedStudy = useCallback((study: BibleStudy) => {
    const sectionedDescription = [
      study.reflection,
      study.questions?.length
        ? 'Discussion Questions:\n' + study.questions.map((question: string, index: number) => `${index + 1}. ${question}`).join('\n')
        : null,
      study.prayer_focus ? `Prayer Focus: ${study.prayer_focus}` : null,
      study.application ? `Application: ${study.application}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    setFormData(prev => ({
      ...prev,
      title: prev.title.trim().length > 0 ? prev.title : study.title,
      description: sectionedDescription.trim().length > 0 ? sectionedDescription : prev.description,
      scripture: extractScriptureReferences(study.scripture) || prev.scripture,
    }));
  }, [extractScriptureReferences]);

  const handleGenerateStudy = async () => {
    if (!formData.aiTopic.trim()) {
      Alert.alert('Topic Required', 'Please enter a topic, theme, or scripture to generate a study.');
      return;
    }

    if (!aiService.isConfigured()) {
      Alert.alert('AI Unavailable', 'Please configure your OpenAI API key in settings.');
      return;
    }

    setIsGenerating(true);
    try {
      // Call AI Service directly
      const result = await aiService.generateBibleStudy(
        formData.aiTopic, // Using topic as the primary input
        undefined,        // No secondary topic
        user?.id          // Pass user ID for analytics
      );

      if (result.success && result.data) {
        applyGeneratedStudy(result.data);
        setMode('preview');
      } else {
        throw new Error(result.error || 'Failed to generate study');
      }
    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert('Error', 'Failed to generate study. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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

  const parseScriptureString = (scripture: string) => {
    try {
      const lastSpaceIndex = scripture.lastIndexOf(' ');
      if (lastSpaceIndex === -1) return null;

      const book = scripture.substring(0, lastSpaceIndex).trim();
      const reference = scripture.substring(lastSpaceIndex + 1).trim();

      const [chapterStr, versesStr] = reference.split(':');
      if (!chapterStr || !versesStr) return null;

      const chapter = parseInt(chapterStr);
      let verse_start = 0;
      let verse_end = 0;

      if (versesStr.includes('-')) {
        const [start, end] = versesStr.split('-');
        verse_start = parseInt(start);
        verse_end = parseInt(end);
      } else {
        verse_start = parseInt(versesStr);
        verse_end = parseInt(versesStr);
      }

      return {
        reference: scripture,
        book,
        chapter,
        verse_start,
        verse_end
      };
    } catch (e) {
      return null;
    }
  };

  const handleCreateStudy = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to create a Bible study.');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Session Expired', 'Please sign in again.');
        setIsLoading(false);
        return;
      }

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

      // Parse scripture references
      const scriptureRefs = studyData.scripture
        .split('\n')
        .filter(s => s.trim())
        .map(s => {
          const parsed = parseScriptureString(s.trim());
          return parsed || {
            reference: s.trim(),
            book: s.trim().split(' ')[0] || 'Unknown',
            chapter: 1,
            verse_start: 1,
            verse_end: 1
          };
        });

      const { data, error } = await supabase
        .from('studies')
        .insert({
          user_id: user?.id,
          prayer_id: null,
          title: studyData.title,
          content_md: studyData.description,
          scripture_references: scriptureRefs,
          ai_model: mode === 'preview' ? 'gpt-4' : 'manual',
          ai_prompt_version: 'v1.0',
          quality_score: 3,
          is_featured: studyData.isPublic,
          view_count: 0,
          save_count: 0,
        } as any)
        .select()
        .single();

      if (error) throw error;

      analyticsService.trackEvent('create_bible_study', {
        source: mode === 'manual' ? 'manual' : 'ai_generated',
        study_id: (data as any).id,
      }, user.id);

      // Navigate to the Bible Studies list page
      navigation.navigate('BibleStudyList' as any);
    } catch (error) {
      console.error('Error creating Bible study:', error);
      Alert.alert('Error', 'Failed to create Bible study. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Methods ---

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scripture: '',
      studyType: 'group',
      isPublic: true,
      maxParticipants: 20,
      scheduledDate: '',
      scheduledTime: '',
      duration: 60,
      aiTopic: '',
    });
    setIsEditingContent(false);
    setSelectedDate(new Date());
    setSelectedTime(new Date());
  };

  const renderSelectionMode = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.selectionTitle}>How would you like to start?</Text>

      <TouchableOpacity
        style={styles.selectionCard}
        onPress={() => {
          resetForm();
          setMode('ai-input');
        }}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
          <Ionicons name="sparkles" size={32} color="#7C3AED" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Generate with AI</Text>
          <Text style={styles.cardDescription}>
            Enter a topic or verse, and let AI create a complete study outline and insights for you.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selectionCard}
        onPress={() => {
          resetForm();
          setMode('manual');
        }}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
          <Ionicons name="create" size={32} color="#4B5563" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Start from Scratch</Text>
          <Text style={styles.cardDescription}>
            Write your own study with your own content, questions, and verses.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
      </TouchableOpacity>
    </View>
  );

  const renderAIInputMode = () => (
    <View style={styles.aiInputContainer}>
      <Text style={styles.modeTitle}>What is this study about?</Text>
      <Text style={styles.modeSubtitle}>
        Enter a topic, theme, or scripture reference.
      </Text>

      <TextInput
        style={styles.topicInput}
        placeholder="e.g., Finding Peace in Anxiety, Psalm 23, Leadership..."
        placeholderTextColor="#9CA3AF"
        value={formData.aiTopic}
        onChangeText={(text) => handleInputChange('aiTopic', text)}
        multiline
        maxLength={200}
      />

      <TouchableOpacity
        style={[styles.primaryButton, isGenerating && styles.buttonDisabled]}
        onPress={handleGenerateStudy}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Generate Study Outline</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPreviewContent = () => {
    const contentSections = extractStudySections(formData.description);

    if (contentSections.length === 0) {
      return (
        <View style={styles.card}>
          <Text style={styles.emptyText}>No structured content found.</Text>
        </View>
      );
    }

    return (
      <View>
        {contentSections.map((section, index) => {
          const sectionBody = toStringSafe(section.body);
          if (!sectionBody) return null;

          // Determine style and icon based on section type
          let iconName: any = 'document-text';
          let iconColor = '#5B21B6';
          let titleStyle = styles.cardTitle;

          switch (section.type) {
            case 'reflection':
              iconName = 'book-outline';
              iconColor = '#4F46E5'; // Indigo
              break;
            case 'questions':
              iconName = 'help-circle-outline';
              iconColor = '#D97706'; // Amber
              break;
            case 'prayer':
              iconName = 'heart-outline';
              iconColor = '#DB2777'; // Pink
              break;
            case 'application':
              iconName = 'footsteps-outline';
              iconColor = '#059669'; // Emerald
              break;
          }

          return (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name={iconName} size={20} color={iconColor} />
                <Text style={[titleStyle, { color: iconColor }]}>{section.heading || 'Study Note'}</Text>
              </View>
              {section.type === 'questions' ? (
                <View style={styles.questionsContainer}>
                  {sectionBody.split('\n').map((line, i) => {
                    const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
                    if (!cleanLine) return null;
                    return (
                      <View key={i} style={styles.questionItem}>
                        <View style={styles.questionNumberBadge}>
                          <Text style={styles.questionNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.questionText}>{cleanLine}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.sectionContent}>{sectionBody}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderEditor = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.editorContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.modeTitle}>
            {mode === 'preview' ? 'Review & Edit' : 'What is this study about?'}
          </Text>
        </View>

        {mode === 'preview' && (
          <View style={styles.aiBanner}>
            <Ionicons name="sparkles" size={16} color="#7C3AED" />
            <Text style={styles.aiBannerText}>
              AI generated this outline. You can edit anything below.
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Study Title"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Scripture References</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Philippians 4:6-7"
            value={formData.scripture}
            onChangeText={(text) => handleInputChange('scripture', text)}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Content & Outline</Text>
            {mode === 'preview' && (
              <TouchableOpacity
                onPress={() => setIsEditingContent(!isEditingContent)}
                style={styles.editToggleButton}
              >
                <Ionicons
                  name={isEditingContent ? 'eye-outline' : 'create-outline'}
                  size={16}
                  color="#5B21B6"
                />
                <Text style={styles.editToggleText}>
                  {isEditingContent ? 'Show Preview' : 'Edit Text'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {mode === 'preview' && !isEditingContent ? (
            renderPreviewContent()
          ) : (
            <TextInput
              style={[styles.input, styles.contentArea]}
              placeholder="Write your study content..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Public Study</Text>
            <Switch
              value={formData.isPublic}
              onValueChange={(val) => handleInputChange('isPublic', val)}
              trackColor={{ false: '#E5E7EB', true: '#5B21B6' }}
            />
          </View>
        </View>

        {renderScheduleSection()}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );

  // Date/Time Pickers (reused logic)
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      handleInputChange('scheduledDate', format(date, 'MMM dd, yyyy'));
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && date) {
      setSelectedTime(date);
      handleInputChange('scheduledTime', format(date, 'h:mm a'));
    }
  };

  const renderScheduleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Schedule (Optional)</Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>
            {formData.scheduledDate || 'Select Date'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Time</Text>
        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>
            {formData.scheduledTime || 'Select Time'}
          </Text>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={formData.duration.toString()}
          onChangeText={(text) => handleInputChange('duration', parseInt(text) || 0)}
          keyboardType="numeric"
          placeholder="60"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {mode === 'selection' && renderSelectionMode()}
        {mode === 'ai-input' && renderAIInputMode()}
        {(mode === 'manual' || mode === 'preview') && (
          <>
            {renderEditor()}
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={[styles.floatingButton, isLoading && styles.buttonDisabled]}
                onPress={handleCreateStudy}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.floatingButtonText}>
                    {mode === 'preview' ? 'Publish Study' : 'Create Study'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  selectionContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 32,
    textAlign: 'center',
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // AI Input Mode
  aiInputContainer: {
    flex: 1,
    padding: 24,
  },

  modeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  modeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  topicInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Editor Mode
  scrollView: {
    flex: 1,
  },
  editorContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiBannerText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 8,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  contentArea: {
    minHeight: 250,
    textAlignVertical: 'top',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
    fontWeight: '500',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  floatingButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Preview Styles
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  editToggleText: {
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: '600',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    marginBottom: 12,
  },
  questionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  questionItem: {
    flexDirection: 'row',
    gap: 12,
  },
  questionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CreateBibleStudyScreen;
