import React, { useState, useEffect } from 'react';
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
import { GroupsStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { groupService } from '@/services/api/groupService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Group } from '@/types/database.types';
import GroupAvatar from '@/components/common/GroupAvatar';

/**
 * Edit Group Screen - Edit group settings and properties
 */
const EditGroupScreen: React.FC<GroupsStackScreenProps<'EditGroup'>> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { profile } = useAuthStore();
  
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

    if (formData.maxMembers < 2 || formData.maxMembers > 1000) {
      Alert.alert('Error', 'Maximum members must be between 2 and 1000');
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

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.deleteGroup(groupId);
              Alert.alert(
                'Group Deleted',
                'The group has been deleted successfully.',
                [
                  { 
                    text: 'OK', 
                    onPress: () => navigation.navigate('GroupsList')
                  }
                ]
              );
            } catch (error) {
              console.error('Failed to delete group:', error);
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Edit Group</Text>
        <Text style={styles.headerSubtitle}>Update group settings</Text>
      </View>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveChanges}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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

  const renderAdvancedSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Advanced Settings</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Maximum Members</Text>
        <TextInput
          style={styles.textInput}
          value={formData.maxMembers.toString()}
          onChangeText={(value) => handleInputChange('maxMembers', parseInt(value) || 100)}
          placeholder="100"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
        <Text style={styles.inputHelp}>
          Set the maximum number of members allowed in this group
        </Text>
      </View>
    </View>
  );

  const renderDangerSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Danger Zone</Text>
      
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteGroup}>
        <Ionicons name="trash" size={20} color="#DC2626" />
        <Text style={styles.deleteButtonText}>Delete Group</Text>
      </TouchableOpacity>
      <Text style={styles.deleteWarning}>
        This will permanently delete the group and all its data. This action cannot be undone.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {renderAvatarSection()}
          {renderBasicInfoSection()}
          {renderPrivacySection()}
          {renderAdvancedSection()}
          {renderDangerSection()}
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
    backgroundColor: '#5B21B6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  inputHelp: {
    fontSize: 12,
    color: '#6B7280',
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    marginLeft: 8,
    color: '#DC2626',
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
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
});

export default EditGroupScreen;
