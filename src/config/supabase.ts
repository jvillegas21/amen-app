import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from '@/types/database.types';
import { withRetry } from '@/utils/networkRetry';
import { queueRequest, queueHighPriority } from '@/utils/networkQueue';

// Get Supabase configuration from Expo Constants (loaded from .env via app.config.js)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ Supabase credentials not configured properly!');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
  console.error('\n📝 Make sure your .env file exists with:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.error('\n🔄 After updating .env, restart with: npx expo start --clear');
  throw new Error('Supabase credentials are required. Please check your .env file.');
}

console.log('✓ Supabase client initializing...');
console.log('  URL:', supabaseUrl);
console.log('  Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Enhanced fetch with retry logic and request queueing
const createRobustFetch = () => {
  return async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url.toString();

    // Determine priority based on URL
    const isAuthRequest = urlString.includes('/auth/');
    const isUserRequest = urlString.includes('/profiles') || urlString.includes('/user');
    const priority = isAuthRequest || isUserRequest;

    const queueFn = priority ? queueHighPriority : queueRequest;

    return queueFn(async () => {
      return withRetry(
        async () => {
          console.log('🌐 Network request:', urlString);

          // Properly merge headers (handles both Headers object and plain object)
          const headers = new Headers(options.headers);
          headers.set('Connection', 'keep-alive');
          headers.set('Keep-Alive', 'timeout=30');

          const enhancedOptions: RequestInit = {
            ...options,
            headers,
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          try {
            const response = await fetch(url, {
              ...enhancedOptions,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('✓ Response status:', response.status, urlString);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          onRetry: (error, attempt) => {
            console.warn(`⚠️ Retry ${attempt} for:`, urlString);
            console.warn(`   Error:`, error instanceof Error ? error.message : String(error));
          },
        }
      );
    });
  };
};

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
  global: {
    fetch: createRobustFetch(),
    headers: {
      'Connection': 'keep-alive',
      'X-Client-Info': 'amen-app-mobile',
    },
  },
});

console.log('✓ Supabase client created successfully');

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