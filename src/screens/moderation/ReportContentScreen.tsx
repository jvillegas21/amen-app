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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { contentModerationService, ContentReport } from '@/services/api/contentModerationService';

export default function ReportContentScreen() {
  const router = useRouter();
  const { 
    type, 
    id, 
    userId, 
    prayerId, 
    commentId, 
    groupId 
  } = useLocalSearchParams<{
    type: 'user' | 'prayer' | 'comment' | 'group';
    id: string;
    userId?: string;
    prayerId?: string;
    commentId?: string;
    groupId?: string;
  }>();
  
  const [formData, setFormData] = useState({
    reason: 'spam' as ContentReport['reason'],
    description: '',
  });
  
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { id: 'spam', name: 'Spam', icon: 'warning-outline' },
    { id: 'harassment', name: 'Harassment', icon: 'person-remove-outline' },
    { id: 'inappropriate_content', name: 'Inappropriate Content', icon: 'eye-off-outline' },
    { id: 'fake_account', name: 'Fake Account', icon: 'person-outline' },
    { id: 'other', name: 'Other', icon: 'help-circle-outline' },
  ];

  const getContentType = () => {
    switch (type) {
      case 'user':
        return 'user';
      case 'prayer':
        return 'prayer';
      case 'comment':
        return 'comment';
      case 'group':
        return 'group';
      default:
        return 'content';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue');
      return;
    }

    try {
      setSubmitting(true);
      await contentModerationService.reportContent({
        reported_user_id: userId,
        reported_prayer_id: prayerId,
        reported_comment_id: commentId,
        reported_group_id: groupId,
        reason: formData.reason,
        description: formData.description.trim(),
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it and take appropriate action.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReasonOption = (reason: typeof reasons[0]) => (
    <TouchableOpacity
      key={reason.id}
      style={[
        styles.reasonOption,
        formData.reason === reason.id && styles.reasonOptionSelected,
      ]}
      onPress={() => handleInputChange('reason', reason.id)}
    >
      <Ionicons
        name={reason.icon as any}
        size={20}
        color={formData.reason === reason.id ? '#5B21B6' : '#666'}
      />
      <Text
        style={[
          styles.reasonText,
          formData.reason === reason.id && styles.reasonTextSelected,
        ]}
      >
        {reason.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report {getContentType()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Why are you reporting this {getContentType()}?</Text>
        <Text style={styles.sectionDescription}>
          Help us understand the issue so we can take appropriate action.
        </Text>

        {/* Reason Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reason for reporting *</Text>
          <View style={styles.reasonContainer}>
            {reasons.map(renderReasonOption)}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder={`Please describe what's wrong with this ${getContentType()}...`}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {formData.description.length}/500 characters
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
              <Ionicons name="flag" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.helpText}>
            Reports are reviewed by our moderation team. False reports may result in account restrictions.
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
  reasonContainer: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
  },
  reasonOptionSelected: {
    borderColor: '#5B21B6',
    backgroundColor: '#F3F4F6',
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  reasonTextSelected: {
    color: '#5B21B6',
    fontWeight: '500',
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