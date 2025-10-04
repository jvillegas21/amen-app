require('dotenv').config();

module.exports = {
  expo: {
    name: 'Amen - Prayer Community',
    slug: 'amen-prayer-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    entryPoint: './index.js',
    description:
      'A community-driven prayer app where users can share prayer requests, support each other, and build meaningful connections through faith. Join groups, share prayers, and discover the power of collective prayer.',
    primaryColor: '#6366F1',
    scheme: 'amen-prayer-app',
    privacy: 'public',
    experiments: {
      typedRoutes: false,
    },
    sdkVersion: '54.0.0',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      newArchEnabled: false,
      jsEngine: 'hermes',
      bundleIdentifier: 'com.amen.prayer.app',
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app uses your location to connect you with nearby prayer groups and community members.',
        NSCameraUsageDescription:
          'This app uses the camera to allow you to upload photos to your prayer requests and profile.',
        NSPhotoLibraryUsageDescription:
          'This app accesses your photo library to let you share images with your prayers and update your profile picture.',
        NSMicrophoneUsageDescription:
          'This app uses the microphone for voice messages in group chats and prayer recordings.',
        NSUserNotificationsUsageDescription:
          'This app sends notifications about prayer updates, group activities, and reminders to keep you connected with your prayer community.',
        NSFaceIDUsageDescription:
          'This app uses Face ID for secure authentication to protect your account.',
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSExceptionDomains: {
            'supabase.co': {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSIncludesSubdomains: true,
              NSExceptionRequiresForwardSecrecy: true,
              NSExceptionMinimumTLSVersion: 'TLSv1.2',
            },
            localhost: {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: true,
            },
          },
        },
      },
      associatedDomains: ['applinks:amen-prayer-app.com'],
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      newArchEnabled: false,
      jsEngine: 'hermes',
      package: 'com.amen.prayer.app',
      versionCode: 1,
      usesCleartextTraffic: true,
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_NETWORK_STATE',
        'INTERNET',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          category: ['BROWSABLE', 'DEFAULT'],
          data: {
            scheme: 'https',
            host: 'amen-prayer-app.com',
          },
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            newArchEnabled: false,
          },
          android: {
            newArchEnabled: false,
          },
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'This app uses your location to connect you with nearby prayer groups and community members.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'This app uses the camera to allow you to upload photos to your prayer requests and profile.',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission:
            'This app accesses your photo library to let you share images with your prayers and update your profile picture.',
          savePhotosPermission:
            "This app saves photos you share to your device's photo library.",
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#6366F1',
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission:
            'Allow $(PRODUCT_NAME) to use Face ID for secure authentication.',
        },
      ],
    ],
    hooks: {
      postPublish: [],
    },
    extra: {
      privacyPolicyUrl: 'https://amen-prayer-app.com/privacy',
      termsOfServiceUrl: 'https://amen-prayer-app.com/terms',
      supportUrl: 'https://amen-prayer-app.com/support',
      eas: {
        projectId: 'your-eas-project-id-here',
      },
      // Expose environment variables to the app
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      appUrl: process.env.EXPO_PUBLIC_APP_URL,
      appName: process.env.EXPO_PUBLIC_APP_NAME,
    },
  },
};
