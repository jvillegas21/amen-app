/**
 * Report Content Screen - Allows users to report inappropriate content
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { contentModerationService, ContentReport } from '@/services/api/contentModerationService';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface ReportContentScreenProps extends MainStackScreenProps<'ReportContent'> {}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', icon: 'ban' },
  { value: 'harassment', label: 'Harassment', icon: 'warning' },
  { value: 'inappropriate_content', label: 'Inappropriate Content', icon: 'eye-off' },
  { value: 'fake_account', label: 'Fake Account', icon: 'person-remove' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
] as const;

const ReportContentScreen: React.FC<ReportContentScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { type, id } = route.params;
  const [selectedReason, setSelectedReason] = useState<ContentReport['reason'] | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: any = {
        reason: selectedReason,
        description: description.trim(),
      };

      // Set the appropriate ID based on content type
      switch (type) {
        case 'prayer':
          reportData.reported_prayer_id = id;
          break;
        case 'comment':
          reportData.reported_comment_id = id;
          break;
        case 'user':
          reportData.reported_user_id = id;
          break;
        case 'group':
          reportData.reported_group_id = id;
          break;
      }

      await contentModerationService.reportContent(reportData);

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it and take appropriate action.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Error',
        'Failed to submit report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeLabel = () => {
    switch (type) {
      case 'prayer':
        return 'prayer request';
      case 'comment':
        return 'comment';
      case 'user':
        return 'user';
      case 'group':
        return 'group';
      default:
        return 'content';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report {getContentTypeLabel()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why are you reporting this {getContentTypeLabel()}?</Text>
          <Text style={styles.sectionDescription}>
            Help us understand the issue so we can take appropriate action.
          </Text>

          <View style={styles.reasonsList}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.value && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View style={styles.reasonContent}>
                  <Ionicons
                    name={reason.icon as any}
                    size={20}
                    color={
                      selectedReason === reason.value
                        ? theme.colors.primary[600]
                        : theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.value && styles.reasonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </View>
                {selectedReason === reason.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.primary[600]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <Text style={styles.sectionDescription}>
            Please provide any additional information that might help us understand the issue.
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Describe the issue in detail..."
            placeholderTextColor={theme.colors.text.secondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {description.length}/500 characters
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary[600]} />
            <Text style={styles.infoText}>
              Reports are reviewed by our moderation team. We take all reports seriously and will take appropriate action to maintain a safe and respectful community.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!selectedReason || !description.trim() || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedReason || !description.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={theme.colors.text.inverse} />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  backButton: {
    padding: theme.spacing[2],
  },
  headerTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  section: {
    marginTop: theme.spacing[6],
  },
  sectionTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  sectionDescription: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[4],
  },
  reasonsList: {
    gap: theme.spacing[2],
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  reasonItemSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reasonText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[3],
  },
  reasonTextSelected: {
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  textInput: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    padding: theme.spacing[4],
    minHeight: 120,
  },
  characterCount: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing[2],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  infoText: {
    ...theme.typography.body.small,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[3],
    flex: 1,
  },
  footer: {
    padding: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing[2],
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  submitButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },
});

export default ReportContentScreen;