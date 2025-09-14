import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supportService, SupportTicket } from '@/services/api/supportService';

export default function CreateSupportTicketScreen() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'other' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority'],
  });
  
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'bug', name: 'Bug Report', icon: 'bug-outline' },
    { id: 'feature_request', name: 'Feature Request', icon: 'bulb-outline' },
    { id: 'account', name: 'Account Issue', icon: 'person-outline' },
    { id: 'billing', name: 'Billing', icon: 'card-outline' },
    { id: 'other', name: 'Other', icon: 'help-circle-outline' },
  ];

  const priorities = [
    { id: 'low', name: 'Low', color: '#10B981' },
    { id: 'medium', name: 'Medium', color: '#3B82F6' },
    { id: 'high', name: 'High', color: '#F59E0B' },
    { id: 'urgent', name: 'Urgent', color: '#EF4444' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const ticket = await supportService.createTicket({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
      });

      Alert.alert(
        'Ticket Created',
        'Your support ticket has been created successfully. We\'ll get back to you soon!',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/support/ticket/${ticket.id}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating support ticket:', error);
      Alert.alert('Error', 'Failed to create support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategoryOption = (category: typeof categories[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        formData.category === category.id && styles.categoryOptionSelected,
      ]}
      onPress={() => handleInputChange('category', category.id)}
    >
      <Ionicons
        name={category.icon as any}
        size={20}
        color={formData.category === category.id ? '#5B21B6' : '#666'}
      />
      <Text
        style={[
          styles.categoryText,
          formData.category === category.id && styles.categoryTextSelected,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPriorityOption = (priority: typeof priorities[0]) => (
    <TouchableOpacity
      key={priority.id}
      style={[
        styles.priorityOption,
        { borderColor: priority.color },
        formData.priority === priority.id && { backgroundColor: priority.color },
      ]}
      onPress={() => handleInputChange('priority', priority.id)}
    >
      <Text
        style={[
          styles.priorityText,
          { color: formData.priority === priority.id ? '#FFFFFF' : priority.color },
        ]}
      >
        {priority.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Support Ticket</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>What can we help you with?</Text>
        <Text style={styles.sectionDescription}>
          Please provide as much detail as possible so we can assist you better.
        </Text>

        {/* Subject */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Brief description of your issue"
            value={formData.subject}
            onChangeText={(value) => handleInputChange('subject', value)}
            maxLength={100}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category *</Text>
          <View style={styles.categoryContainer}>
            {categories.map(renderCategoryOption)}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Priority *</Text>
          <View style={styles.priorityContainer}>
            {priorities.map(renderPriorityOption)}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Please describe your issue in detail..."
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>
            {formData.description.length}/1000 characters
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Create Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.helpText}>
            We typically respond within 24 hours. For urgent issues, please select "Urgent" priority.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
  },
  categoryOptionSelected: {
    borderColor: '#5B21B6',
    backgroundColor: '#F3F4F6',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  categoryTextSelected: {
    color: '#5B21B6',
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
});