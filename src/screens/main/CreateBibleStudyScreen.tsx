import React, { useState, useRef } from 'react';
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
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { supabase } from '@/config/supabase';

/**
 * Create Bible Study Screen - Create a new Bible study with AI insights
 */
const CreateBibleStudyScreen: React.FC<RootStackScreenProps<'CreateBibleStudy'>> = ({ navigation, route }) => {
  const { profile } = useAuthStore();
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

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
      
      Alert.alert(
        'Success',
        'Bible study created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
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
      
      <View style={styles.settingRow}>
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
            {renderBasicInfoSection()}
            {renderStudySettingsSection()}
            {renderScheduleSection()}
            
            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
        
        {/* Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.pickerModal}>
            <View style={styles.pickerContainer}>
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
            <View style={styles.pickerContainer}>
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
        <View style={styles.floatingButtonContainer}>
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
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  settingInfo: {
    flex: 1,
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
  bottomSpacing: {
    height: 20,
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
    paddingBottom: 34, // Safe area for home indicator
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
    paddingVertical: 20,
    paddingBottom: 34, // Safe area for home indicator
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
