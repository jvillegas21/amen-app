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
import { PRAYER_CATEGORIES } from '@/constants/prayerCategories';

/**
 * Create Prayer Screen - Prayer creation with AI Bible study suggestions
 * Based on post_prayer and post_your_prayer mockups
 */
const CreatePrayerScreen: React.FC<RootStackScreenProps<'CreatePrayer'>> = ({ navigation, route }) => {
  const { createPrayer, isLoading } = usePrayerStore();
  const { profile } = useAuthStore();
  const { 
    suggestions, 
    isLoadingSuggestions, 
    generateSuggestions, 
    isGeneratingStudy, 
    generateFullStudy,
    isConfigured 
  } = useAIIntegration();
  
  const [prayerText, setPrayerText] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'groups' | 'private'>('public');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [images, setImages] = useState<ImageUploadResult[]>([]);
  const [location, setLocation] = useState<{ city?: string; lat?: number; lon?: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBibleStudyModal, setShowBibleStudyModal] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const groupId = route.params?.groupId;

  useEffect(() => {
    // Auto-generate Bible study suggestions when prayer text changes
    if (prayerText.length > 20 && isConfigured) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(async () => {
        await generateBibleStudySuggestions();
      }, 2000);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [prayerText, isConfigured]);

  const generateBibleStudySuggestions = async () => {
    if (prayerText.length < 20 || !isConfigured || !profile?.id) return;

    try {
      // Generate a temporary prayer ID for suggestions
      const tempPrayerId = `temp-${Date.now()}`;
      await generateSuggestions(prayerText, tempPrayerId);
    } catch (error) {
      console.log('Failed to generate Bible study suggestions:', error);
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
        const uploadResult = await imageUploadService.uploadPrayerImage(asset.uri, 'temp');
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
      await createPrayer({
        text: prayerText.trim(),
        privacy_level: privacyLevel,
        group_id: groupId,
        is_anonymous: isAnonymous,
        tags: selectedCategory ? [selectedCategory] : [], // Store category in tags array for discovery
        images: images.map(img => img.url),
        location: location ? {
          city: location.city,
          lat: location.lat,
          lon: location.lon,
          granularity: 'city' as const,
        } : undefined,
      });

      // Navigate to Feed tab to show the created prayer
      navigation.navigate('Main', { screen: 'Home' });
    } catch (error: any) {
      console.error('Prayer creation error:', error);
      
      // Show more detailed error message
      let errorMessage = 'Failed to create prayer request';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Database error (${error.code}): ${error.message || 'Unknown error'}`;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const renderBibleStudySuggestions = () => (
    <Modal
      visible={showBibleStudyModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Bible Study Suggestions</Text>
          <TouchableOpacity onPress={() => setShowBibleStudyModal(false)}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.suggestionsContainer}>
          {isLoadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B21B6" />
              <Text style={styles.loadingText}>Generating suggestions...</Text>
            </View>
          ) : (
            suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionCard}
                onPress={() => {
                  // Navigate to Bible study details screen
                  setShowBibleStudyModal(false);
                  navigation.navigate('BibleStudyDetails', {
                    studyId: suggestion.id,
                    prayerId: suggestion.prayerId,
                  });
                }}
              >
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionSnippet}>{suggestion.snippet}</Text>
                <View style={styles.suggestionFooter}>
                  <Text style={styles.suggestionConfidence}>
                    Confidence: {Math.round(suggestion.confidence * 100)}%
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#5B21B6" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

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
                        <Ionicons name="close-circle" size={20} color="theme.colors.error[700]" />
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
                <Text style={styles.actionButtonText}>Photo</Text>
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

              {suggestions.length > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowBibleStudyModal(true)}
                >
                  <Ionicons name="book" size={20} color="#5B21B6" />
                  <Text style={styles.actionButtonText}>Bible Study</Text>
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !prayerText.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Share Prayer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderBibleStudySuggestions()}
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
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#5B21B6',
    marginLeft: 6,
    fontWeight: '500',
  },
  categoryContainer: {
    marginBottom: 24,
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
    marginHorizontal: -4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginHorizontal: 4,
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
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#5B21B6',
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  suggestionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  suggestionSnippet: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionConfidence: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default CreatePrayerScreen;
