import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ExpoLocation from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { theme } from '@/theme';
import ImagePicker from '@/components/common/ImagePicker';
import { ImageUploadResult } from '@/services/api/imageUploadService';

interface ProfileData {
  display_name: string;
  bio: string;
  location_city: string;
  avatar_url: string;
}

const EditProfileScreen: React.FC<MainStackScreenProps<'EditProfile'>> = ({ navigation }) => {
  const { profile, updateProfile } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    location_city: '',
    avatar_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location_city: profile.location_city || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Back',
      headerTitle: 'Edit Profile',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={saving}
          style={styles.headerSaveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          ) : (
            <Text style={styles.headerSaveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, profileData, saving]);

  const handleProfileInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelected = async (result: ImageUploadResult) => {
    setProfileData(prev => ({
      ...prev,
      avatar_url: result.url,
    }));
  };

  const handleImageRemoved = () => {
    setProfileData(prev => ({
      ...prev,
      avatar_url: '',
    }));
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({});
      const [address] = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const city = address.city || address.subregion;
        const country = address.country;
        const locationString = [city, country].filter(Boolean).join(', ');

        handleProfileInputChange('location_city', locationString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.display_name.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    try {
      setSaving(true);

      await updateProfile({
        display_name: profileData.display_name.trim(),
        bio: profileData.bio.trim(),
        location_city: profileData.location_city.trim(),
        avatar_url: profileData.avatar_url,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionDescription}>
            Update your profile information and avatar
          </Text>

          {/* Avatar */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Profile Picture</Text>
            <ImagePicker
              onImageSelected={handleImageSelected}
              onImageRemoved={handleImageRemoved}
              currentImageUrl={profileData.avatar_url}
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
              value={profileData.display_name}
              onChangeText={(value) => handleProfileInputChange('display_name', value)}
              maxLength={50}
              editable={!saving}
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tell us about yourself..."
              value={profileData.bio}
              onChangeText={(value) => handleProfileInputChange('bio', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              editable={!saving}
              placeholderTextColor={theme.colors.text.tertiary}
            />
            <Text style={styles.characterCount}>
              {profileData.bio.length}/500 characters
            </Text>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={saving}
                style={styles.useLocationButton}
              >
                <Ionicons name="location" size={12} color={theme.colors.primary[700]} />
                <Text style={styles.useLocationButtonText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="City, Country"
              value={profileData.location_city}
              onChangeText={(value) => handleProfileInputChange('location_city', value)}
              maxLength={100}
              editable={!saving}
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.info[500]} />
            <Text style={styles.helpText}>
              Your profile information is visible to other users. Keep it appropriate and respectful.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  headerSaveButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  headerSaveButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.primary[600],
  },
  content: {
    flex: 1,
    padding: theme.spacing[4],
  },
  sectionDescription: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
  },
  inputGroup: {
    marginBottom: theme.spacing[6],
  },
  inputLabel: {
    ...theme.typography.label.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    fontWeight: '600',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1.5],
    borderRadius: theme.borderRadius.full,
  },
  useLocationButtonText: {
    ...theme.typography.caption.medium,
    color: theme.colors.primary[700],
    fontWeight: '600',
    marginLeft: theme.spacing[1.5],
  },
  textInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.tertiary,
    textAlign: 'right',
    marginTop: theme.spacing[1],
  },
  helpContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info[50] + '10', // 10% opacity
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    alignItems: 'flex-start',
    marginBottom: theme.spacing[8],
  },
  helpText: {
    ...theme.typography.body.small,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[3],
    flex: 1,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  saveButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },
});

export default EditProfileScreen;