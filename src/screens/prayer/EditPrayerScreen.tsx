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
import { CommonActions } from '@react-navigation/native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { useAuthStore } from '@/store/auth/authStore';
import { useAIIntegration } from '@/hooks/useAIIntegration';
import { imageUploadService, ImageUploadResult } from '@/services/api/imageUploadService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PrayerRepository } from '@/repositories/prayer.repository';
import { UpdatePrayerRequest } from '@/types/database.types';
import { PRAYER_CATEGORIES } from '@/constants/prayerCategories';

/**
 * Edit Prayer Screen - Edit existing prayer with AI Bible study suggestions
 */
const EditPrayerScreen: React.FC<MainStackScreenProps<'EditPrayer'>> = ({ navigation, route }) => {
  const { prayerId } = route.params;
  const { updatePrayer, deletePrayerOptimistic, prayers } = usePrayerStore();
  const { profile } = useAuthStore();
  
  const [prayerText, setPrayerText] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'groups' | 'private'>('public');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [images, setImages] = useState<ImageUploadResult[]>([]);
  const [location, setLocation] = useState<{ city?: string; lat?: number; lon?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      // Set category from tags if available
      if (prayer.tags && prayer.tags.length > 0) {
        setSelectedCategory(prayer.tags[0]);
      }

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
    } else if (!isDeleting) {
      // Only fetch if prayer not found AND not currently deleting
      // This prevents re-fetch after optimistic deletion
      fetchPrayer();
    }
  }, [prayerId, prayer, isDeleting]);

  const fetchPrayer = async () => {
    try {
      setLoading(true);
      const prayerData = await prayerRepository.getPrayerWithDetails(prayerId, profile?.id);
      
      if (!prayerData) {
        Alert.alert('Error', 'Prayer not found');
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Home' } }],
          }));
        }
        return;
      }

      // Check if user owns this prayer
      if (prayerData.user_id !== profile?.id) {
        Alert.alert('Error', 'You can only edit your own prayers');
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Home' } }],
          }));
        }
        return;
      }

      // Populate form with fetched prayer data
      setPrayerText(prayerData.text);
      setPrivacyLevel(prayerData.privacy_level);
      setIsAnonymous(prayerData.is_anonymous);

      // Set category from tags if available
      if (prayerData.tags && prayerData.tags.length > 0) {
        setSelectedCategory(prayerData.tags[0]);
      }

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
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Home' } }],
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 images per prayer');
      return;
    }

    try {
      const result = await imageUploadService.pickImageFromLibrary(
        imageUploadService.getImagePickerOptions('prayer')
      );

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        // Upload the image
        const uploadResult = await imageUploadService.uploadPrayerImage(asset.uri, prayerId);
        setImages(prev => [...prev, uploadResult]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationRequest = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const locationData = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        });

        const city = reverseGeocode[0]?.city || reverseGeocode[0]?.subregion;

        setLocation({
          city,
          lat: locationData.coords.latitude,
          lon: locationData.coords.longitude,
        });
      } else {
        Alert.alert('Permission Denied', 'Location access is required to add location to your prayer');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const removeLocation = () => {
    setLocation(null);
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
        tags: selectedCategory ? [selectedCategory] : [],
        images: images.map(img => img.url),
        location_city: location?.city,
        location_lat: location?.lat,
        location_lon: location?.lon,
        location_granularity: location ? 'city' as const : 'hidden' as const,
      };

      await updatePrayer(prayerId, updateData);

      // Show success feedback
      Alert.alert('Success', 'Prayer updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.dispatch(CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main', params: { screen: 'Home' } }],
              }));
            }
          },
        },
      ]);
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

            {/* Images */}
            {images.length > 0 && (
              <View style={styles.imagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: image.url }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleImagePicker}
                disabled={images.length >= 3}
              >
                <Ionicons name="camera" size={20} color="#5B21B6" />
                <Text style={styles.actionButtonText}>
                  {images.length > 0 ? `Photo (${images.length}/3)` : 'Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLocationRequest}
              >
                <Ionicons name="location" size={20} color="#5B21B6" />
                <Text style={styles.actionButtonText}>
                  {location ? location.city : 'Location'}
                </Text>
              </TouchableOpacity>

              {location && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={removeLocation}
                >
                  <Ionicons name="close" size={20} color="#DC2626" />
                  <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
                    Remove Location
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category Selection */}
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Category (optional)</Text>
              <Text style={styles.categoryHint}>Help others discover your prayer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {PRAYER_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  >
                    <View style={[styles.categoryChipIcon, { backgroundColor: category.color }]}>
                      <Ionicons
                        name={category.icon}
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category.id && styles.categoryChipTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, (saving || !prayerText.trim()) && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={saving || !prayerText.trim()}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Update Prayer</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Delete prayer?',
                    'This will permanently remove the prayer and its activity. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            // Mark as deleting to prevent useEffect from re-fetching
                            setIsDeleting(true);

                            // Step 1: Optimistically remove from store (INSTANT)
                            await deletePrayerOptimistic(prayerId);

                            // Step 2: Navigate immediately (no waiting)
                            navigation.dispatch(
                              CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Main', params: { screen: 'Home' } }],
                              })
                            );

                            // Step 3: Show success feedback (after navigation completes)
                            setTimeout(() => {
                              Alert.alert('Success', 'Prayer deleted');
                            }, 500);

                          } catch (error) {
                            // Rollback already happened in store
                            setIsDeleting(false);
                            console.error('Prayer delete error:', error);
                            Alert.alert('Error', 'Failed to delete prayer. Please try again.');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.deleteButtonText}>Delete Prayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay - Shows during save (NOT deletion - optimistic deletion doesn't need loading) */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#5B21B6" />
            <Text style={styles.loadingOverlayText}>Saving changes...</Text>
          </View>
        </View>
      )}
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
  imagesContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  categoryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#5B21B6',
  },
  categoryChipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: '#5B21B6',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    height: 56,
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
});

export default EditPrayerScreen;
