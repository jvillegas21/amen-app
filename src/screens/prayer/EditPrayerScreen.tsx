import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { useAuthStore } from '@/store/auth/authStore';
import { useAIIntegration } from '@/hooks/useAIIntegration';
import { imageUploadService, ImageUploadResult } from '@/services/api/imageUploadService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PrayerRepository } from '@/repositories/prayer.repository';
import { UpdatePrayerRequest } from '@/types/database.types';

/**
 * Edit Prayer Screen - Edit existing prayer with AI Bible study suggestions
 */
const EditPrayerScreen: React.FC<RootStackScreenProps<'EditPrayer'>> = ({ navigation, route }) => {
  const { prayerId } = route.params;
  const { updatePrayer, prayers } = usePrayerStore();
  const { profile } = useAuthStore();
  
  const [prayerText, setPrayerText] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'groups' | 'private'>('public');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<ImageUploadResult[]>([]);
  const [location, setLocation] = useState<{ city?: string; lat?: number; lon?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const prayerRepository = new PrayerRepository();

  // Get the prayer from the store
  const prayer = prayers.find(p => p.id === prayerId);

  useEffect(() => {
    if (prayer) {
      // Populate form with existing prayer data
      setPrayerText(prayer.text);
      setPrivacyLevel(prayer.privacy_level);
      setIsAnonymous(prayer.is_anonymous);
      
      // Set location if available
      if (prayer.location_city || prayer.location_lat) {
        setLocation({
          city: prayer.location_city,
          lat: prayer.location_lat,
          lon: prayer.location_lon,
        });
      }
      
      // Set images if available
      if (prayer.images && prayer.images.length > 0) {
        const imageResults = prayer.images.map(url => ({ 
          url, 
          path: '', 
          size: 0, 
          width: 0, 
          height: 0 
        }));
        setImages(imageResults);
      }
      
      setLoading(false);
    } else {
      // If prayer not found in store, try to fetch it
      fetchPrayer();
    }
  }, [prayerId, prayer]);

  const fetchPrayer = async () => {
    try {
      setLoading(true);
      const prayerData = await prayerRepository.getPrayerWithDetails(prayerId, profile?.id);
      
      if (!prayerData) {
        Alert.alert('Error', 'Prayer not found');
        navigation.goBack();
        return;
      }

      // Check if user owns this prayer
      if (prayerData.user_id !== profile?.id) {
        Alert.alert('Error', 'You can only edit your own prayers');
        navigation.goBack();
        return;
      }

      // Populate form with fetched prayer data
      setPrayerText(prayerData.text);
      setPrivacyLevel(prayerData.privacy_level);
      setIsAnonymous(prayerData.is_anonymous);
      
      if (prayerData.location_city || prayerData.location_lat) {
        setLocation({
          city: prayerData.location_city,
          lat: prayerData.location_lat,
          lon: prayerData.location_lon,
        });
      }
      
      if (prayerData.images && prayerData.images.length > 0) {
        const imageResults = prayerData.images.map(url => ({ 
          url, 
          path: '', 
          size: 0, 
          width: 0, 
          height: 0 
        }));
        setImages(imageResults);
      }
    } catch (error) {
      console.error('Error fetching prayer:', error);
      Alert.alert('Error', 'Failed to load prayer');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!prayerText.trim()) {
      Alert.alert('Error', 'Please enter your prayer request');
      return;
    }

    if (prayerText.length < 10) {
      Alert.alert('Error', 'Prayer request must be at least 10 characters long');
      return;
    }

    try {
      setSaving(true);
      
      const updateData: UpdatePrayerRequest = {
        text: prayerText.trim(),
        privacy_level: privacyLevel,
        is_anonymous: isAnonymous,
        images: images.map(img => img.url),
        location_city: location?.city,
        location_lat: location?.lat,
        location_lon: location?.lon,
        location_granularity: location ? 'city' as const : 'hidden' as const,
      };

      await updatePrayer(prayerId, updateData);
      navigation.goBack();
    } catch (error: any) {
      console.error('Prayer update error:', error);
      
      let errorMessage = 'Failed to update prayer request';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Database error (${error.code}): ${error.message || 'Unknown error'}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading prayer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Prayer Text Input */}
            <View style={styles.textInputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                value={prayerText}
                onChangeText={setPrayerText}
                placeholder="Share your prayer request..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                maxLength={4000}
                autoFocus
              />
              <Text style={styles.characterCount}>{prayerText.length}/4000</Text>
            </View>

            {/* Privacy Settings */}
            <View style={styles.privacyContainer}>
              <Text style={styles.privacyLabel}>Who can see this prayer?</Text>
              <View style={styles.privacyOptions}>
                {[
                  { key: 'public', label: 'Everyone', icon: 'globe' },
                  { key: 'friends', label: 'Friends', icon: 'people' },
                  { key: 'groups', label: 'Groups', icon: 'people-circle' },
                  { key: 'private', label: 'Only me', icon: 'lock-closed' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.privacyOption,
                      privacyLevel === option.key && styles.privacyOptionSelected,
                    ]}
                    onPress={() => setPrivacyLevel(option.key as any)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={privacyLevel === option.key ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.privacyOptionText,
                        privacyLevel === option.key && styles.privacyOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Anonymous Toggle */}
            <TouchableOpacity
              style={styles.anonymousContainer}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.anonymousText}>Post anonymously</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (saving || !prayerText.trim()) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving || !prayerText.trim()}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Update Prayer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  textInputContainer: {
    marginBottom: 16,
  },
  textInput: {
    minHeight: 120,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 8,
  },
  privacyContainer: {
    marginBottom: 20,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  privacyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  privacyOptionSelected: {
    backgroundColor: '#5B21B6',
    borderColor: '#5B21B6',
  },
  privacyOptionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  privacyOptionTextSelected: {
    color: '#FFFFFF',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5B21B6',
    borderColor: '#5B21B6',
  },
  anonymousText: {
    fontSize: 16,
    color: '#374151',
  },
  submitButton: {
    height: 56,
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
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
});

export default EditPrayerScreen;