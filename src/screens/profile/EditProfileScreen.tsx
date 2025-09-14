import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ProfileStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ProfileFormData {
  display_name: string;
  bio: string;
  location: string;
  avatar_url?: string;
}

/**
 * Edit Profile Screen - Edit user profile information
 * Based on user_profile mockups
 */
const EditProfileScreen: React.FC<ProfileStackScreenProps<'EditProfile'>> = ({ navigation }) => {
  const { profile, updateProfile } = useAuthStore();
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    bio: '',
    location: '',
    avatar_url: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        avatar_url: profile.avatar_url,
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, avatar_url: result.assets[0].uri }));
        setHasChanges(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        avatar_url: formData.avatar_url,
      });
      
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Edit Profile</Text>
      
      <TouchableOpacity
        onPress={handleSave}
        style={[styles.saveButton, (!hasChanges || isLoading) && styles.saveButtonDisabled]}
        disabled={!hasChanges || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderAvatarSection = () => (
    <View style={styles.avatarSection}>
      <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer}>
        <Image
          source={{ uri: formData.avatar_url || 'https://via.placeholder.com/120' }}
          style={styles.avatar}
        />
        <View style={styles.avatarOverlay}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <Text style={styles.avatarLabel}>Tap to change photo</Text>
    </View>
  );

  const renderFormFields = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Display Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.display_name}
          onChangeText={(value) => handleInputChange('display_name', value)}
          placeholder="Enter your display name"
          placeholderTextColor="#9CA3AF"
          maxLength={50}
        />
        <Text style={styles.characterCount}>
          {formData.display_name.length}/50
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={[styles.textInput, styles.bioInput]}
          value={formData.bio}
          onChangeText={(value) => handleInputChange('bio', value)}
          placeholder="Tell us about yourself..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          maxLength={160}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {formData.bio.length}/160
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location</Text>
        <TextInput
          style={styles.textInput}
          value={formData.location}
          onChangeText={(value) => handleInputChange('location', value)}
          placeholder="City, State/Country"
          placeholderTextColor="#9CA3AF"
          maxLength={100}
        />
        <Text style={styles.characterCount}>
          {formData.location.length}/100
        </Text>
      </View>
    </View>
  );

  const renderPrivacyNote = () => (
    <View style={styles.privacyNote}>
      <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
      <Text style={styles.privacyNoteText}>
        Your profile information is visible to other users. Keep personal details private.
      </Text>
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
          {renderAvatarSection()}
          {renderFormFields()}
          {renderPrivacyNote()}
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
  saveButton: {
    backgroundColor: '#5B21B6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5B21B6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 8,
  },
});

export default EditProfileScreen;