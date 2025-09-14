import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/store/auth/authStore';
import { profileService } from '@/services/api/profileService';
import { imageUploadService, ImageUploadResult } from '@/services/api/imageUploadService';
import ImagePicker from '@/components/common/ImagePicker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
      });
      setAvatarUrl(profile.avatar_url || '');
      setLoading(false);
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelected = async (result: ImageUploadResult) => {
    setAvatarUrl(result.url);
  };

  const handleImageRemoved = () => {
    setAvatarUrl('');
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    try {
      setSaving(true);
      
      const updatedProfile = await profileService.updateProfile({
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        avatar_url: avatarUrl,
      });

      updateProfile(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#5B21B6" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <Text style={styles.sectionDescription}>
          Update your profile information and avatar
        </Text>

        {/* Avatar */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Profile Picture</Text>
          <ImagePicker
            onImageSelected={handleImageSelected}
            onImageRemoved={handleImageRemoved}
            currentImageUrl={avatarUrl}
            type="profile"
            disabled={saving}
          />
        </View>

        {/* Display Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Display Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your display name"
            value={formData.display_name}
            onChangeText={(value) => handleInputChange('display_name', value)}
            maxLength={50}
            editable={!saving}
          />
        </View>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChangeText={(value) => handleInputChange('bio', value)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
            editable={!saving}
          />
          <Text style={styles.characterCount}>
            {formData.bio.length}/500 characters
          </Text>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            placeholder="City, Country"
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            maxLength={100}
            editable={!saving}
          />
        </View>

        {/* Website */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Website</Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://yourwebsite.com"
            value={formData.website}
            onChangeText={(value) => handleInputChange('website', value)}
            maxLength={200}
            keyboardType="url"
            autoCapitalize="none"
            editable={!saving}
          />
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.helpText}>
            Your profile information is visible to other users. Keep it appropriate and respectful.
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#5B21B6',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  helpContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
});