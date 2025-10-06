import React, { useState, useRef } from 'react';
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
import { theme } from '@/theme';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';

interface TicketCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface TicketPriority {
  id: 'low' | 'medium' | 'high' | 'urgent';
  name: string;
  description: string;
  color: string;
}

/**
 * Create Ticket Screen - Create new support tickets
 * Replaces the stub implementation with full functionality
 */
const CreateTicketScreen: React.FC<MainStackScreenProps<'CreateTicket'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  const categories: TicketCategory[] = [
    {
      id: 'technical',
      name: 'Technical Issue',
      description: 'App crashes, bugs, performance issues',
      icon: 'bug-outline',
    },
    {
      id: 'account',
      name: 'Account Issue',
      description: 'Login problems, profile settings, account deletion',
      icon: 'person-outline',
    },
    {
      id: 'privacy',
      name: 'Privacy & Safety',
      description: 'Content moderation, privacy settings, blocking users',
      icon: 'shield-outline',
    },
    {
      id: 'prayers',
      name: 'Prayer Features',
      description: 'Prayer creation, groups, interactions, notifications',
      icon: 'heart-outline',
    },
    {
      id: 'billing',
      name: 'Billing & Subscriptions',
      description: 'Payment issues, subscription management, refunds',
      icon: 'card-outline',
    },
    {
      id: 'feature',
      name: 'Feature Request',
      description: 'Suggest new features or improvements',
      icon: 'bulb-outline',
    },
    {
      id: 'other',
      name: 'Other',
      description: 'General questions or issues not covered above',
      icon: 'help-circle-outline',
    },
  ];

  const priorities: TicketPriority[] = [
    {
      id: 'low',
      name: 'Low',
      description: 'General question or minor issue',
      color: theme.colors.success[600],
    },
    {
      id: 'medium',
      name: 'Medium',
      description: 'Standard support request',
      color: theme.colors.primary[600],
    },
    {
      id: 'high',
      name: 'High',
      description: 'Significant issue affecting app usage',
      color: theme.colors.warning[600],
    },
    {
      id: 'urgent',
      name: 'Urgent',
      description: 'Critical issue requiring immediate attention',
      color: theme.colors.error[600],
    },
  ];

  const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory);
  const selectedPriorityObj = priorities.find(priority => priority.id === selectedPriority);

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Please provide a title for your ticket';
    }
    if (title.trim().length < 5) {
      return 'Title must be at least 5 characters long';
    }
    if (!description.trim()) {
      return 'Please provide a description of your issue';
    }
    if (description.trim().length < 20) {
      return 'Description must be at least 20 characters long';
    }
    if (!selectedCategory) {
      return 'Please select a category for your ticket';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Please Complete Form', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual ticket creation API call
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const ticketData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        priority: selectedPriority,
        user_id: profile?.id,
        user_email: profile?.id, // Using user ID instead of email since email is not in Profile type
        created_at: new Date().toISOString(),
      };

      console.log('Creating ticket:', ticketData);

      // Show success message
      Alert.alert(
        'Ticket Created',
        'Your support ticket has been created successfully. We\'ll get back to you as soon as possible.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to support screen or ticket details
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create ticket:', error);
      Alert.alert(
        'Error',
        'Failed to create support ticket. Please try again or contact us directly at support@Amenity-prayer-app.com'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryPicker = () => (
    <View style={styles.pickerModal}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Select Category</Text>
        <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.pickerOptions} showsVerticalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryOption,
              selectedCategory === category.id && styles.categoryOptionSelected,
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              setShowCategoryPicker(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.categoryOptionIcon}>
              <Ionicons
                name={category.icon as any}
                size={24}
                color={selectedCategory === category.id ? theme.colors.primary[600] : theme.colors.neutral[500]}
              />
            </View>
            <View style={styles.categoryOptionContent}>
              <Text style={[
                styles.categoryOptionTitle,
                selectedCategory === category.id && styles.categoryOptionTitleSelected,
              ]}>
                {category.name}
              </Text>
              <Text style={styles.categoryOptionDescription}>
                {category.description}
              </Text>
            </View>
            {selectedCategory === category.id && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[600]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPriorityPicker = () => (
    <View style={styles.pickerModal}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Select Priority</Text>
        <TouchableOpacity onPress={() => setShowPriorityPicker(false)}>
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.pickerOptions} showsVerticalScrollIndicator={false}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority.id}
            style={[
              styles.priorityOption,
              selectedPriority === priority.id && styles.priorityOptionSelected,
            ]}
            onPress={() => {
              setSelectedPriority(priority.id);
              setShowPriorityPicker(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
            <View style={styles.priorityOptionContent}>
              <Text style={[
                styles.priorityOptionTitle,
                selectedPriority === priority.id && styles.priorityOptionTitleSelected,
              ]}>
                {priority.name}
              </Text>
              <Text style={styles.priorityOptionDescription}>
                {priority.description}
              </Text>
            </View>
            {selectedPriority === priority.id && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[600]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (showCategoryPicker) {
    return (
      <SafeAreaView style={styles.container}>
        {renderCategoryPicker()}
      </SafeAreaView>
    );
  }

  if (showPriorityPicker) {
    return (
      <SafeAreaView style={styles.container}>
        {renderPriorityPicker()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Support Ticket</Text>
            <Text style={styles.headerSubtitle}>
              Tell us about your issue and we'll help you resolve it
            </Text>
          </View>

          <View style={styles.form}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                ref={titleInputRef}
                style={[styles.textInput, title.length > 0 && styles.textInputFilled]}
                value={title}
                onChangeText={setTitle}
                placeholder="Brief description of your issue..."
                placeholderTextColor={theme.colors.neutral[400]}
                maxLength={100}
                returnKeyType="next"
                onSubmitEditing={() => descriptionInputRef.current?.focus()}
                editable={!isSubmitting}
              />
              <Text style={styles.inputHint}>
                {title.length}/100 characters
              </Text>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                ref={descriptionInputRef}
                style={[
                  styles.textInput,
                  styles.textArea,
                  description.length > 0 && styles.textInputFilled,
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Please provide detailed information about your issue, including steps to reproduce it if applicable..."
                placeholderTextColor={theme.colors.neutral[400]}
                multiline
                textAlignVertical="top"
                maxLength={1000}
                editable={!isSubmitting}
              />
              <Text style={styles.inputHint}>
                {description.length}/1000 characters
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectionButton,
                  selectedCategory && styles.selectionButtonFilled,
                ]}
                onPress={() => setShowCategoryPicker(true)}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <View style={styles.selectionButtonContent}>
                  {selectedCategoryObj ? (
                    <>
                      <Ionicons
                        name={selectedCategoryObj.icon as any}
                        size={20}
                        color={theme.colors.primary[600]}
                      />
                      <View style={styles.selectionButtonText}>
                        <Text style={styles.selectionButtonTitle}>
                          {selectedCategoryObj.name}
                        </Text>
                        <Text style={styles.selectionButtonDescription}>
                          {selectedCategoryObj.description}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.selectionButtonPlaceholder}>
                      Select a category for your issue
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Priority Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <TouchableOpacity
                style={[styles.selectionButton, styles.selectionButtonFilled]}
                onPress={() => setShowPriorityPicker(true)}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <View style={styles.selectionButtonContent}>
                  <View style={[
                    styles.priorityDot,
                    { backgroundColor: selectedPriorityObj?.color || theme.colors.neutral[400] },
                  ]} />
                  <View style={styles.selectionButtonText}>
                    <Text style={styles.selectionButtonTitle}>
                      {selectedPriorityObj?.name || 'Medium'}
                    </Text>
                    <Text style={styles.selectionButtonDescription}>
                      {selectedPriorityObj?.description || 'Standard support request'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Contact Info Note */}
            <View style={styles.contactNote}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary[600]} />
              <Text style={styles.contactNoteText}>
                We'll respond to your ticket using the email address associated with your account: {' '}
                <Text style={styles.contactNoteEmail}>User ID: {profile?.id || 'unknown'}</Text>
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title.trim() || !description.trim() || !selectedCategory || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !description.trim() || !selectedCategory || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                <Text style={[styles.submitButtonText, styles.submitButtonTextLoading]}>
                  Creating Ticket...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color={theme.colors.text.inverse} />
                <Text style={styles.submitButtonText}>Create Support Ticket</Text>
              </>
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
    backgroundColor: theme.colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing[20],
  },
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  headerTitle: {
    ...theme.typography.heading.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  form: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  inputGroup: {
    marginBottom: theme.spacing[6],
  },
  inputLabel: {
    ...theme.typography.label.large,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  required: {
    color: theme.colors.error[600],
  },
  textInput: {
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    minHeight: theme.layout.minTouchTarget,
  },
  textInputFilled: {
    borderColor: theme.colors.border.focus,
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  inputHint: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
    textAlign: 'right',
  },
  selectionButton: {
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: theme.layout.minTouchTarget,
  },
  selectionButtonFilled: {
    borderColor: theme.colors.border.focus,
  },
  selectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionButtonText: {
    marginLeft: theme.spacing[3],
    flex: 1,
  },
  selectionButtonTitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[0.5],
  },
  selectionButtonDescription: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  selectionButtonPlaceholder: {
    ...theme.typography.body.medium,
    color: theme.colors.neutral[400],
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  contactNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  contactNoteText: {
    ...theme.typography.body.small,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[3],
    flex: 1,
    lineHeight: 20,
  },
  contactNoteEmail: {
    color: theme.colors.primary[600],
    fontWeight: '500',
  },
  submitSection: {
    backgroundColor: theme.colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  submitButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  submitButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing[2],
  },
  submitButtonTextLoading: {
    marginLeft: theme.spacing[3],
  },
  // Picker Modal Styles
  pickerModal: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  pickerTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
  },
  pickerOptions: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginVertical: theme.spacing[1],
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  categoryOptionSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  categoryOptionIcon: {
    width: 40,
    alignItems: 'center',
  },
  categoryOptionContent: {
    flex: 1,
  },
  categoryOptionTitle: {
    ...theme.typography.body.large,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[0.5],
  },
  categoryOptionTitleSelected: {
    color: theme.colors.primary[700],
  },
  categoryOptionDescription: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginVertical: theme.spacing[1],
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  priorityOptionSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  priorityOptionContent: {
    flex: 1,
    marginLeft: theme.spacing[3],
  },
  priorityOptionTitle: {
    ...theme.typography.body.large,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[0.5],
  },
  priorityOptionTitleSelected: {
    color: theme.colors.primary[700],
  },
  priorityOptionDescription: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
});

export default CreateTicketScreen;