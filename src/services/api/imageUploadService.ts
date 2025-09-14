import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/config/supabase';

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  width: number;
  height: number;
}

export interface ImageUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

/**
 * Image Upload Service - Manages image uploads to Supabase Storage
 */
class ImageUploadService {
  /**
   * Request camera and media library permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraStatus === 'granted' && mediaLibraryStatus === 'granted';
  }

  /**
   * Pick image from camera
   */
  async pickImageFromCamera(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Camera and media library permissions are required');
    }

    return await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.8,
      exif: false,
    });
  }

  /**
   * Pick image from media library
   */
  async pickImageFromLibrary(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission is required');
    }

    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.8,
      exif: false,
    });
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(
    imageUri: string,
    bucket: string,
    path: string,
    options: {
      contentType?: string;
      upsert?: boolean;
    } = {}
  ): Promise<ImageUploadResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = imageUri.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;

    // Convert image to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, blob, {
        contentType: options.contentType || 'image/jpeg',
        upsert: options.upsert || false,
      });

    if (error) throw error;
    if (!data) throw new Error('Failed to upload image');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    if (!urlData?.publicUrl) throw new Error('Failed to get image URL');

    // Get image dimensions
    const dimensions = await this.getImageDimensions(imageUri);

    return {
      url: urlData.publicUrl,
      path: fullPath,
      size: blob.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = imageUri;
    });
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(imageUri: string): Promise<ImageUploadResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return this.uploadImage(imageUri, 'avatars', user.id, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  }

  /**
   * Upload group avatar
   */
  async uploadGroupAvatar(imageUri: string, groupId: string): Promise<ImageUploadResult> {
    return this.uploadImage(imageUri, 'group-avatars', groupId, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  }

  /**
   * Upload prayer image
   */
  async uploadPrayerImage(imageUri: string, prayerId: string): Promise<ImageUploadResult> {
    return this.uploadImage(imageUri, 'prayer-images', prayerId, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  }

  /**
   * Upload comment image
   */
  async uploadCommentImage(imageUri: string, commentId: string): Promise<ImageUploadResult> {
    return this.uploadImage(imageUri, 'comment-images', commentId, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  }

  /**
   * Resize image to fit within specified dimensions
   */
  async resizeImage(
    imageUri: string,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<string> {
    // This is a simplified implementation
    // In a real app, you might want to use a library like expo-image-manipulator
    return imageUri;
  }

  /**
   * Compress image
   */
  async compressImage(imageUri: string, quality: number = 0.8): Promise<string> {
    // This is a simplified implementation
    // In a real app, you might want to use a library like expo-image-manipulator
    return imageUri;
  }

  /**
   * Get image picker options for different use cases
   */
  getImagePickerOptions(type: 'profile' | 'group' | 'prayer' | 'comment'): ImageUploadOptions {
    switch (type) {
      case 'profile':
        return {
          quality: 0.8,
          maxWidth: 400,
          maxHeight: 400,
          allowsEditing: true,
          aspect: [1, 1],
        };
      case 'group':
        return {
          quality: 0.8,
          maxWidth: 400,
          maxHeight: 400,
          allowsEditing: true,
          aspect: [1, 1],
        };
      case 'prayer':
        return {
          quality: 0.7,
          maxWidth: 800,
          maxHeight: 600,
          allowsEditing: true,
          aspect: [4, 3],
        };
      case 'comment':
        return {
          quality: 0.7,
          maxWidth: 600,
          maxHeight: 400,
          allowsEditing: true,
          aspect: [3, 2],
        };
      default:
        return {
          quality: 0.8,
          allowsEditing: true,
        };
    }
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService();