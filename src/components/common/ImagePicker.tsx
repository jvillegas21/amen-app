import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { imageUploadService, ImageUploadResult } from '@/services/api/imageUploadService';

interface ImagePickerProps {
  onImageSelected: (result: ImageUploadResult) => void;
  onImageRemoved?: () => void;
  currentImageUrl?: string;
  type: 'profile' | 'group' | 'prayer' | 'comment';
  disabled?: boolean;
  style?: any;
}

export default function ImagePicker({
  onImageSelected,
  onImageRemoved,
  currentImageUrl,
  type,
  disabled = false,
  style,
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  const handleImagePicker = async (source: 'camera' | 'library') => {
    if (disabled || uploading) return;

    try {
      setUploading(true);
      
      let result;
      if (source === 'camera') {
        result = await imageUploadService.pickImageFromCamera(
          imageUploadService.getImagePickerOptions(type)
        );
      } else {
        result = await imageUploadService.pickImageFromLibrary(
          imageUploadService.getImagePickerOptions(type)
        );
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Upload the image
        let uploadResult: ImageUploadResult;
        switch (type) {
          case 'profile':
            uploadResult = await imageUploadService.uploadProfilePicture(asset.uri);
            break;
          case 'group':
            uploadResult = await imageUploadService.uploadGroupAvatar(asset.uri, 'temp');
            break;
          case 'prayer':
            uploadResult = await imageUploadService.uploadPrayerImage(asset.uri, 'temp');
            break;
          case 'comment':
            uploadResult = await imageUploadService.uploadCommentImage(asset.uri, 'temp');
            break;
          default:
            throw new Error('Invalid image type');
        }

        onImageSelected(uploadResult);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (disabled || uploading) return;
    
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onImageRemoved?.();
          },
        },
      ]
    );
  };

  const showImageSourcePicker = () => {
    if (disabled || uploading) return;

    Alert.alert(
      'Select Image Source',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => handleImagePicker('camera') },
        { text: 'Photo Library', onPress: () => handleImagePicker('library') },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {currentImageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentImageUrl }} style={styles.image} />
          {!disabled && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveImage}
              disabled={uploading}
            >
              <Ionicons name="close-circle" size={24} color="theme.colors.error[700]" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.placeholder, disabled && styles.placeholderDisabled]}
          onPress={showImageSourcePicker}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#5B21B6" />
          ) : (
            <>
              <Ionicons name="camera" size={32} color={disabled ? '#9CA3AF' : '#5B21B6'} />
              <Text style={[styles.placeholderText, disabled && styles.placeholderTextDisabled]}>
                Add Image
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderStyle: 'dashed',
  },
  placeholderDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E5E7',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: '500',
  },
  placeholderTextDisabled: {
    color: '#9CA3AF',
  },
});