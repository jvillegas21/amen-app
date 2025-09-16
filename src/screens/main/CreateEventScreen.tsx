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

/**
 * Create Event Screen - Create a new prayer event
 */
const CreateEventScreen: React.FC<RootStackScreenProps<'CreateEvent'>> = ({ navigation, route }) => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'prayer', // 'prayer', 'worship', 'fellowship', 'study'
    isPublic: true,
    maxParticipants: 50,
    scheduledDate: '',
    scheduledTime: '',
    duration: 90, // minutes
    location: '',
    isVirtual: false,
    meetingLink: '',
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
      Alert.alert('Validation Error', 'Please enter an event title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter an event description');
      return false;
    }
    if (!formData.scheduledDate) {
      Alert.alert('Validation Error', 'Please select a date and time');
      return false;
    }
    if (!formData.isVirtual && !formData.location.trim()) {
      Alert.alert('Validation Error', 'Please enter a location or select virtual event');
      return false;
    }
    if (formData.isVirtual && !formData.meetingLink.trim()) {
      Alert.alert('Validation Error', 'Please enter a meeting link for virtual events');
      return false;
    }
    return true;
  };

  const isFormValid = () => {
    const hasBasicInfo = formData.title.trim().length > 0 && 
                        formData.description.trim().length > 0;
    const hasSchedule = formData.scheduledDate.length > 0 && 
                       formData.scheduledTime.length > 0;
    const hasLocation = formData.isVirtual ? 
                       formData.meetingLink.trim().length > 0 : 
                       formData.location.trim().length > 0;
    
    return hasBasicInfo && hasSchedule && hasLocation;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual event creation
      // This would call a service to create the event
      console.log('Creating event:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Event created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSubtitle = () => (
    <View style={styles.subtitleContainer}>
      <Text style={styles.subtitleText}>Schedule a group prayer session</Text>
    </View>
  );

  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Event Title *</Text>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
          placeholder="Enter event title..."
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
          placeholder="Describe what this event will include..."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>{formData.description.length}/500</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Event Type</Text>
        <View style={styles.typeButtons}>
          {[
            { key: 'prayer', label: 'Prayer', icon: 'heart' },
            { key: 'worship', label: 'Worship', icon: 'musical-notes' },
            { key: 'fellowship', label: 'Fellowship', icon: 'people' },
            { key: 'study', label: 'Study', icon: 'book' },
          ].map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                formData.eventType === type.key && styles.typeButtonActive
              ]}
              onPress={() => handleInputChange('eventType', type.key)}
            >
              <Ionicons 
                name={type.icon as any} 
                size={20} 
                color={formData.eventType === type.key ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                styles.typeButtonText,
                formData.eventType === type.key && styles.typeButtonTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEventSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Event Settings</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Public Event</Text>
          <Text style={styles.settingDescription}>Allow others to discover and join</Text>
        </View>
        <Switch
          value={formData.isPublic}
          onValueChange={(value) => handleInputChange('isPublic', value)}
          trackColor={{ false: '#E5E7EB', true: '#5B21B6' }}
          thumbColor={formData.isPublic ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Maximum Participants</Text>
        <TextInput
          style={styles.textInput}
          value={formData.maxParticipants.toString()}
          onChangeText={(value) => handleInputChange('maxParticipants', parseInt(value) || 50)}
          placeholder="50"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={3}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Virtual Event</Text>
          <Text style={styles.settingDescription}>Host this event online</Text>
        </View>
        <Switch
          value={formData.isVirtual}
          onValueChange={(value) => handleInputChange('isVirtual', value)}
          trackColor={{ false: '#E5E7EB', true: '#5B21B6' }}
          thumbColor={formData.isVirtual ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>
    </View>
  );

  const renderScheduleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Schedule & Location</Text>
      
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeField}>
          <Text style={styles.inputLabel}>Date *</Text>
          <TouchableOpacity style={styles.dateTimeButton} onPress={handleDateButtonPress}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.dateTimeButtonText}>
              {formData.scheduledDate || 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeField}>
          <Text style={styles.inputLabel}>Time *</Text>
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
          onChangeText={(value) => handleInputChange('duration', parseInt(value) || 90)}
          placeholder="90"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={3}
        />
      </View>

      {!formData.isVirtual ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Location *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="Enter event location..."
            placeholderTextColor="#9CA3AF"
            maxLength={200}
          />
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Meeting Link *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.meetingLink}
            onChangeText={(value) => handleInputChange('meetingLink', value)}
            placeholder="https://zoom.us/j/..."
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>
      )}
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
            {renderEventSettingsSection()}
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
            onPress={handleCreateEvent}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.floatingButtonText,
                (!isFormValid() || isLoading) && styles.floatingButtonTextDisabled
              ]}>
                Create Event
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
    backgroundColor: '#DC2626',
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
    flexWrap: 'wrap',
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
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
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
    color: '#DC2626',
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
    backgroundColor: '#DC2626',
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

export default CreateEventScreen;
