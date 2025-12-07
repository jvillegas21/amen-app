import React, { useState, useEffect, useLayoutEffect } from 'react';
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
  Modal,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { groupService } from '@/services/api/groupService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Group } from '@/types/database.types';
import GroupAvatar from '@/components/common/GroupAvatar';

/**
 * Edit Group Screen - Edit group settings and properties
 */
const EditGroupScreen: React.FC<MainStackScreenProps<'EditGroup'>> = ({ navigation, route }) => {
  const { groupId } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private' | 'invite_only',
    maxMembers: 100,
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Group Settings',
      headerBackTitle: 'Back',
      headerStyle: {
        backgroundColor: '#5B21B6',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      const groupData = await groupService.getGroup(groupId);
      setGroup(groupData);

      // Populate form with existing data
      setFormData({
        name: groupData.name,
        description: groupData.description || '',
        privacy: groupData.privacy,
        maxMembers: groupData.max_members,
      });

      if (groupData.avatar_url) {
        setAvatar(groupData.avatar_url);
      }
    } catch (error) {
      console.error('Failed to fetch group details:', error);
      Alert.alert('Error', 'Failed to load group details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        privacy: formData.privacy,
        max_members: formData.maxMembers,
        avatar_url: avatar || undefined,
        // Keep existing tags for now - could add tag editing later
        tags: group?.tags || [],
      };

      console.log('Updating group with data:', updateData);
      const updatedGroup = await groupService.updateGroup(groupId, updateData);
      console.log('Group updated successfully:', updatedGroup);

      Alert.alert(
        'Group Updated!',
        'Your group settings have been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back and trigger a refresh
              navigation.navigate('GroupDetails', { groupId, refresh: Date.now() });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to update group:', error);
      Alert.alert('Error', 'Failed to update group settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAvatarSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Group Avatar</Text>
      <View style={styles.avatarContainer}>
        <GroupAvatar
          avatarUrl={avatar}
          size={100}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.changeAvatarButton} onPress={handleImagePicker}>
          <Ionicons name="camera" size={20} color="#5B21B6" />
          <Text style={styles.changeAvatarText}>Change</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Group Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholder="Enter group name"
          placeholderTextColor="#9CA3AF"
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Describe your group (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        <Text style={styles.characterCount}>
          {formData.description.length}/1000
        </Text>
      </View>
    </View>
  );

  const renderPrivacySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy Settings</Text>

      <View style={styles.privacyOptions}>
        {[
          { value: 'public', label: 'Public', description: 'Anyone can find and join', icon: 'globe' },
          { value: 'private', label: 'Private', description: 'Only invited members can join', icon: 'lock-closed' },
          { value: 'invite_only', label: 'Invite Only', description: 'Members can invite others', icon: 'mail' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.privacyOption,
              formData.privacy === option.value && styles.privacyOptionSelected
            ]}
            onPress={() => handleInputChange('privacy', option.value)}
          >
            <View style={styles.privacyOptionContent}>
              <Ionicons
                name={option.icon as any}
                size={20}
                color={formData.privacy === option.value ? '#5B21B6' : '#6B7280'}
              />
              <View style={styles.privacyOptionText}>
                <Text style={[
                  styles.privacyOptionLabel,
                  formData.privacy === option.value && styles.privacyOptionLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.privacyOptionDescription}>
                  {option.description}
                </Text>
              </View>
            </View>
            {formData.privacy === option.value && (
              <Ionicons name="checkmark-circle" size={20} color="#5B21B6" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleDeleteGroup = async () => {
    if (deleteConfirmationText !== 'DELETE GROUP') {
      Alert.alert('Error', 'Please type "DELETE GROUP" to confirm.');
      return;
    }

    try {
      await groupService.deleteGroup(groupId);
      setShowDeleteModal(false);
      Alert.alert(
        'Group Deleted',
        'The group has been deleted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Groups tab first, then to GroupsList
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('MainTabs', {
                  screen: 'Groups',
                  params: {
                    screen: 'GroupsList',
                  }
                });
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to delete group:', error);
      Alert.alert('Error', 'Failed to delete group');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderAvatarSection()}
          {renderBasicInfoSection()}
          {renderPrivacySection()}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setDeleteConfirmationText('');
              setShowDeleteModal(true);
            }}
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Delete Group</Text>
          </TouchableOpacity>
          <Text style={styles.deleteWarning}>
            This will permanently delete the group and all its data. This action cannot be undone.
          </Text>
        </ScrollView>

        <View style={[styles.floatingButtonContainer, { paddingBottom: 0 }]}>
          <TouchableOpacity
            style={styles.saveButtonBottom}
            onPress={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Group</Text>
            <Text style={styles.modalText}>
              To confirm deletion, type "DELETE GROUP" below.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              placeholder="DELETE GROUP"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDeleteButton,
                  deleteConfirmationText !== 'DELETE GROUP' && styles.modalDeleteButtonDisabled
                ]}
                onPress={handleDeleteGroup}
                disabled={deleteConfirmationText !== 'DELETE GROUP'}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Header styles removed as navigation header is now used
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    // Add extra padding for sticky button
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  changeAvatarText: {
    marginLeft: 8,
    color: '#5B21B6',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  privacyOptions: {
    gap: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  privacyOptionSelected: {
    borderColor: '#5B21B6',
    backgroundColor: '#F3F4F6',
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  privacyOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  privacyOptionLabelSelected: {
    color: '#5B21B6',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
  saveButtonBottom: {
    backgroundColor: '#5B21B6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    marginLeft: 8,
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteWarning: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalDeleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  modalDeleteButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  modalDeleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default EditGroupScreen;
