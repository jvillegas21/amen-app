import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { groupService } from '@/services/api/groupService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { layout } from '@/theme/spacing';

/**
 * Create Group Screen - Group creation with privacy settings
 * Based on create_group_prayer mockups
 */
const CreateGroupScreen: React.FC<RootStackScreenProps<'CreateGroup'>> = ({ navigation }) => {
  useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private' | 'invite_only',
    maxMembers: 100,
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return false;
    }

    if (formData.name.length < 3) {
      Alert.alert('Error', 'Group name must be at least 3 characters long');
      return false;
    }

    if (formData.description.length > 1000) {
      Alert.alert('Error', 'Description must be less than 1000 characters');
      return false;
    }

    return true;
  };

  const isFormValid = () => {
    return formData.name.trim().length >= 3 && 
           formData.description.length <= 1000;
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        privacy_level: formData.privacy,
        avatar_url: avatar || undefined,
        tags: [], // TODO: Add tag selection
      };

      const createdGroup = await groupService.createGroup(groupData);
      
      Alert.alert(
        'Group Created!',
        'Your prayer group has been created successfully.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.replace('GroupDetails', { groupId: createdGroup.id })
          }
        ]
      );
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPrivacyOption = (value: string, label: string, description: string, icon: string) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.privacyOption,
        formData.privacy === value && styles.privacyOptionSelected,
      ]}
      onPress={() => handleInputChange('privacy', value)}
    >
      <View style={styles.privacyOptionHeader}>
        <Ionicons
          name={icon as any}
          size={24}
          color={formData.privacy === value ? '#5B21B6' : '#6B7280'}
        />
        <View style={styles.privacyOptionText}>
          <Text style={[
            styles.privacyOptionLabel,
            formData.privacy === value && styles.privacyOptionLabelSelected,
          ]}>
            {label}
          </Text>
          <Text style={styles.privacyOptionDescription}>{description}</Text>
        </View>
        <View style={[
          styles.radioButton,
          formData.privacy === value && styles.radioButtonSelected,
        ]}>
          {formData.privacy === value && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSubtitle = () => (
    <View style={styles.subtitleContainer}>
      <Text style={styles.subtitleText}>Create a community for shared prayers</Text>
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

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handleImagePicker}
                disabled={isLoading}
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="people" size={48} color="#6B7280" />
                  </View>
                )}
                <View style={styles.avatarEditButton}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Add a group photo</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Group Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Group Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter group name"
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                  editable={!isLoading}
                />
                <Text style={styles.characterCount}>{formData.name.length}/100</Text>
              </View>

              {/* Description */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Tell others about this group..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  editable={!isLoading}
                />
                <Text style={styles.characterCount}>{formData.description.length}/1000</Text>
              </View>

              {/* Max Members */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Maximum Members</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxMembers.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value) || 100;
                    if (num >= 2 && num <= 1000) {
                      handleInputChange('maxMembers', num);
                    }
                  }}
                  placeholder="100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                <Text style={styles.inputHint}>Between 2 and 1000 members</Text>
              </View>

              {/* Privacy Settings */}
              <View style={styles.privacyContainer}>
                <Text style={styles.privacyLabel}>Privacy Settings</Text>
                <Text style={styles.privacySubtext}>
                  Choose who can see and join your group
                </Text>
                
                {renderPrivacyOption(
                  'public',
                  'Public',
                  'Anyone can find and join this group',
                  'globe-outline'
                )}
                
                {renderPrivacyOption(
                  'private',
                  'Private',
                  'Only members can see this group',
                  'lock-closed-outline'
                )}
                
                {renderPrivacyOption(
                  'invite_only',
                  'Invite Only',
                  'Only people with invite links can join',
                  'people-outline'
                )}
              </View>
            </View>

          </View>
        </ScrollView>
        
        {/* Floating Create Button */}
        <View style={[styles.floatingButtonContainer, { paddingBottom: 0 }]}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              (!isFormValid() || isLoading) && styles.floatingButtonDisabled
            ]}
            onPress={handleCreateGroup}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.floatingButtonText,
                (!isFormValid() || isLoading) && styles.floatingButtonTextDisabled
              ]}>
                Create Group
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
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  subtitleContainer: {
    backgroundColor: '#059669',
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 50,
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
    backgroundColor: '#059669',
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  privacyContainer: {
    marginBottom: 24,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  privacySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  privacyOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  privacyOptionSelected: {
    borderColor: '#5B21B6',
    backgroundColor: '#F3F4F6',
  },
  privacyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  privacyOptionLabelSelected: {
    color: '#5B21B6',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#5B21B6',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B21B6',
  },
});

export default CreateGroupScreen;
