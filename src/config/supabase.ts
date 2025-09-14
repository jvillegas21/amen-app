import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client with AsyncStorage for React Native
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 50,
    },
  },
});

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get the current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Storage helpers
export const storage = {
  // Upload an image to Supabase Storage
  uploadImage: async (bucket: string, path: string, file: Blob | File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  },

  // Get public URL for a stored file
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Delete a file from storage
  deleteFile: async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },
};

// Realtime subscriptions helper
export const realtime = {
  // Subscribe to prayer feed updates
  subscribeToPrayerFeed: (callback: (payload: any) => void) => {
    return supabase
      .channel('prayer-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'prayers',
        filter: 'privacy_level=eq.public',
      }, callback)
      .subscribe();
  },

  // Subscribe to group updates
  subscribeToGroup: (groupId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prayers',
        filter: `group_id=eq.${groupId}`,
      }, callback)
      .subscribe();
  },

  // Subscribe to user notifications
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();
  },

  // Unsubscribe from a channel
  unsubscribe: async (subscription: any) => {
    await supabase.removeChannel(subscription);
  },
};

export default supabase;