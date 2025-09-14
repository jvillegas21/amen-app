import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';

interface TicketFormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const CATEGORIES = [
  'Technical Issue',
  'Account Problem',
  'Payment Issue',
  'Feature Request',
  'Bug Report',
  'General Question',
  'Privacy Concern',
  'Other',
];

const PRIORITIES = [
  { label: 'Low', value: 'low', description: 'General questions or minor issues' },
  { label: 'Medium', value: 'medium', description: 'Standard support requests' },
  { label: 'High', value: 'high', description: 'Important issues affecting usage' },
  { label: 'Urgent', value: 'urgent', description: 'Critical issues requiring immediate attention' },
];

/**
 * Create Ticket Screen - Submit new support ticket
 * Based on submit_support_ticket mockups
 */
const CreateTicketScreen: React.FC<RootStackScreenProps<'CreateTicket'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = () => {
    Alert.alert(
      'Select Category',
      'Choose the category that best describes your issue:',
      CATEGORIES.map(category => ({
        text: category,
        onPress: () => handleInputChange('category', category),
      }))
    );
  };

  const handlePrioritySelect = () => {
    Alert.alert(
      'Select Priority',
      'Choose the priority level for your request:',
      PRIORITIES.map(priority => ({
        text: `${priority.label} - ${priority.description}`,
        onPress: () => handleInputChange('priority', priority.value as any),
      }))
    );
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your ticket');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please provide a description of your issue');
      return;
    }

    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement create ticket API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      Alert.alert(
        'Ticket Created',
        'Your support ticket has been submitted successfully. We\'ll get back to you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Create Support Ticket</Text>
      
      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.submitButton, (!formData.title.trim() || !formData.description.trim() || !formData.category || isSubmitting) && styles.submitButtonDisabled]}
        disabled={!formData.title.trim() || !formData.description.trim() || !formData.category || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFormField = (
    label: string,
    required: boolean = false,
    children: React.ReactNode
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      {children}
    </View>
  );

  const renderTitleField = () => renderFormField(
    'Title',
    true,
    <TextInput
      style={styles.textInput}
      value={formData.title}
      onChangeText={(value) => handleInputChange('title', value)}
      placeholder="Brief description of your issue"
      placeholderTextColor="#9CA3AF"
      maxLength={100}
    />
  );

  const renderCategoryField = () => renderFormField(
    'Category',
    true,
    <TouchableOpacity style={styles.selectButton} onPress={handleCategorySelect}>
      <Text style={[styles.selectButtonText, !formData.category && styles.placeholderText]}>
        {formData.category || 'Select a category'}
      </Text>
      <Ionicons name="chevron-down" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  const renderPriorityField = () => renderFormField(
    'Priority',
    false,
    <TouchableOpacity style={styles.selectButton} onPress={handlePrioritySelect}>
      <View style={styles.priorityContent}>
        <Text style={styles.selectButtonText}>
          {PRIORITIES.find(p => p.value === formData.priority)?.label || 'Medium'}
        </Text>
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(formData.priority) }]} />
      </View>
      <Ionicons name="chevron-down" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  const renderDescriptionField = () => renderFormField(
    'Description',
    true,
    <TextInput
      style={[styles.textInput, styles.descriptionInput]}
      value={formData.description}
      onChangeText={(value) => handleInputChange('description', value)}
      placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
      placeholderTextColor="#9CA3AF"
      multiline
      numberOfLines={6}
      textAlignVertical="top"
      maxLength={1000}
    />
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderHelpfulTips = () => (
    <View style={styles.helpfulTips}>
      <View style={styles.tipsHeader}>
        <Ionicons name="bulb" size={20} color="#F59E0B" />
        <Text style={styles.tipsTitle}>Helpful Tips</Text>
      </View>
      <View style={styles.tipsList}>
        <Text style={styles.tipItem}>• Be specific about the issue you're experiencing</Text>
        <Text style={styles.tipItem}>• Include steps to reproduce the problem</Text>
        <Text style={styles.tipItem}>• Mention your device type and app version</Text>
        <Text style={styles.tipItem}>• Attach screenshots if relevant</Text>
      </View>
    </View>
  );

  const renderResponseTime = () => (
    <View style={styles.responseTime}>
      <View style={styles.responseTimeContent}>
        <Ionicons name="time" size={20} color="#10B981" />
        <Text style={styles.responseTimeTitle}>Response Time</Text>
        <Text style={styles.responseTimeText}>
          We typically respond to support tickets within 24 hours. 
          Urgent issues are prioritized and may receive faster responses.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTitleField()}
          {renderCategoryField()}
          {renderPriorityField()}
          {renderDescriptionField()}
          {renderHelpfulTips()}
          {renderResponseTime()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#5B21B6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  priorityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  helpfulTips: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  responseTime: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  responseTimeContent: {
    alignItems: 'center',
  },
  responseTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginTop: 8,
    marginBottom: 8,
  },
  responseTimeText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CreateTicketScreen;
