import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackScreenProps } from '@/types/navigation.types';
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
const CreateBibleStudyScreen: React.FC<MainStackScreenProps<'CreateBibleStudy'>> = ({ navigation, route }) => {
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

  const extractScriptureReferences = useCallback((text: string): string => {
    if (!text) {
      return '';
    }

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

    trackAIEvent('ai_generation_apply_outline', {
      mode: 'fullStudy',
      question_count: study.questions?.length || 0,
      included_prayer_focus: !!study.prayer_focus,
      included_application: !!study.application,
    });

    Alert.alert('AI Outline Applied', 'We filled in your study details. Review and edit before publishing.');
  }, [extractScriptureReferences, trackAIEvent]);

  const applyScriptureVerses = useCallback((verses: AIScriptureVerse[]) => {
    if (!verses.length) {
      return;
    }

    const scriptureValue = verses
      .map(suggestion => suggestion.reference)
      .filter(Boolean)
      .join('\n');

    setFormData(prev => ({
      ...prev,
      scripture: scriptureValue,
      description: prev.description,
    }));

    trackAIEvent('ai_generation_apply_verses', {
      mode: 'scriptureSuggestions',
      verse_count: verses.length,
    });

    Alert.alert('Verses Added', 'We added AI-recommended verses to your study.');
  }, [trackAIEvent]);

  useEffect(() => {
    const aiResult = route.params?.aiResult;
    
    if (!aiResult) {
      return;
    }

    if (aiResult.type === 'fullStudy' && aiResult.study) {
      applyGeneratedStudy(aiResult.study);
    } else if (aiResult.type === 'scriptureSuggestions' && aiResult.verses?.length) {
      applyScriptureVerses(aiResult.verses);
    }

    navigation.setParams({ aiResult: undefined });
  }, [route.params?.aiResult, applyGeneratedStudy, applyScriptureVerses, navigation]);

  const handleOpenAIAssistant = useCallback(() => {
    if (!aiService.isConfigured()) {
      trackAIEvent('ai_assistant_open_blocked', { reason: 'missing_api_key' });
      Alert.alert(
        'AI Assistant Unavailable',
        'Add your OpenAI API key to enable AI generated studies.'
      );
      return;
    }

    trackAIEvent('ai_assistant_opened', {
      source_context: 'create_bible_study',
      has_title: formData.title.trim().length > 0,
      has_description: formData.description.trim().length > 0,
      has_scripture: formData.scripture.trim().length > 0,
    });

    navigation.navigate('AIStudyAssistant', {
      mode: 'fullStudy',
      topic: formData.title,
      context: formData.description,
    });
  }, [formData.description, formData.scripture, formData.title, navigation, trackAIEvent]);

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

    // Validate user is authenticated
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to create a Bible study.');
      return;
    }

    console.log('📝 Creating Bible study for user:', user.id);

    setIsLoading(true);
    try {
      // Verify Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Session Expired', 'Please sign in again.');
        setIsLoading(false);
        return;
      }

      console.log('📋 Session check:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        storeUserId: user?.id,
        match: session?.user?.id === user?.id,
      });

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

      console.log('📝 Insert payload:', {
        user_id: user?.id,
        title: studyData.title,
      });

      // Save to database using the studies table
      const { data, error } = await supabase
        .from('studies')
        .insert({
          user_id: user?.id,
          prayer_id: null,
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
        console.error('❌ Database error:', error);
        console.error('📊 Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        console.error('👤 User context:', {
          userId: user?.id,
          hasSession: !!session,
          sessionUserId: session?.user?.id,
        });

        // Check if it's an RLS error
        if (error.code === '42501') {
          Alert.alert(
            'Permission Denied',
            'You do not have permission to create Bible studies. This may be a configuration issue. Please contact support.'
          );
        } else {
          Alert.alert('Error', 'Failed to create Bible study. Please try again.');
        }
        throw new Error('Failed to save Bible study to database');
      }

      console.log('✅ Bible study created successfully:', data);

      // Navigate to the created Bible study details with the study data
      // This avoids a refetch and ensures the study is immediately available
      navigation.replace('BibleStudyDetails', {
        studyId: data.id,
        study: data
      });
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
