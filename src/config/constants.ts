// Application constants and configuration

export const APP_CONFIG = {
  name: 'Amenity',
  version: '1.0.0',
  support_email: 'support@amenity.app',
  privacy_url: 'https://amenity.app/privacy',
  terms_url: 'https://amenity.app/terms',
};

export const API_CONFIG = {
  base_url: process.env.EXPO_PUBLIC_API_URL || 'https://api.amenity.app',
  timeout: 30000, // 30 seconds
  retry_attempts: 3,
};

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  prayer_images: 'prayer-images',
  group_avatars: 'group-avatars',
};

export const PAGINATION = {
  default_limit: 20,
  max_limit: 50,
};

export const PRAYER_CONFIG = {
  min_length: 10,
  max_length: 4000,
  max_images: 3,
  max_tags: 10,
  default_expiry_days: 30,
};

export const GROUP_CONFIG = {
  min_name_length: 3,
  max_name_length: 100,
  max_description_length: 1000,
  default_max_members: 100,
  max_rules_length: 2000,
};

export const COMMENT_CONFIG = {
  max_length: 1000,
  max_reply_depth: 3,
};

export const NOTIFICATION_TYPES = {
  PRAYER_PRAYED_FOR: 'prayer_prayed_for',
  PRAYER_COMMENTED: 'prayer_commented',
  PRAYER_ANSWERED: 'prayer_answered',
  GROUP_INVITE: 'group_invite',
  GROUP_JOINED: 'group_joined',
  GROUP_PRAYER_ADDED: 'group_prayer_added',
  STUDY_FEATURED: 'study_featured',
  TICKET_UPDATED: 'ticket_updated',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  MODERATION_ACTION: 'moderation_action',
} as const;

export const INTERACTION_TYPES = {
  PRAY: 'PRAY',
  LIKE: 'LIKE',
  SHARE: 'SHARE',
  SAVE: 'SAVE',
} as const;

export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  GROUPS: 'groups',
  PRIVATE: 'private',
} as const;

export const LOCATION_GRANULARITY = {
  HIDDEN: 'hidden',
  CITY: 'city',
  PRECISE: 'precise',
} as const;

export const PRAYER_STATUS = {
  OPEN: 'open',
  ANSWERED: 'answered',
  CLOSED: 'closed',
} as const;

export const GROUP_PRIVACY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  INVITE_ONLY: 'invite_only',
} as const;

export const MEMBER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
} as const;

export const REPORT_REASONS = {
  SPAM: 'spam',
  INAPPROPRIATE: 'inappropriate',
  HARASSMENT: 'harassment',
  FALSE_INFO: 'false_info',
  OTHER: 'other',
} as const;

export const TICKET_CATEGORIES = {
  BUG: 'bug',
  FEATURE: 'feature',
  ACCOUNT: 'account',
  CONTENT: 'content',
  OTHER: 'other',
} as const;

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const TICKET_STATUS = {
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export const AI_CONFIG = {
  model: 'gpt-4',
  max_suggestions: 3,
  suggestion_confidence_threshold: 0.7,
  cache_duration: 3600, // 1 hour in seconds
  rate_limit: {
    requests_per_minute: 10,
    requests_per_hour: 100,
  },
};

export const ANALYTICS_EVENTS = {
  // User lifecycle
  USER_SIGNED_UP: 'user_signed_up',
  USER_ONBOARDING_COMPLETED: 'user_onboarding_completed',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',

  // Prayer events
  PRAYER_CREATED: 'prayer_created',
  PRAYER_VIEWED: 'prayer_viewed',
  PRAYER_INTERACTION: 'prayer_interaction',
  PRAYER_SHARED: 'prayer_shared',
  PRAYER_DELETED: 'prayer_deleted',

  // Group events
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  GROUP_LEFT: 'group_left',
  GROUP_INVITED: 'group_invited',

  // AI events
  AI_STUDY_GENERATED: 'ai_study_generated',
  AI_STUDY_SAVED: 'ai_study_saved',
  AI_STUDY_SHARED: 'ai_study_shared',

  // Engagement events
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  FEED_SCROLLED: 'feed_scrolled',
  NOTIFICATION_OPENED: 'notification_opened',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  AUTH_ERROR: 'Authentication failed. Please sign in again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
} as const;

export const SUCCESS_MESSAGES = {
  PRAYER_CREATED: 'Your prayer has been shared with the community.',
  PRAYER_UPDATED: 'Your prayer has been updated.',
  PRAYER_DELETED: 'Your prayer has been deleted.',
  GROUP_CREATED: 'Group created successfully.',
  GROUP_JOINED: 'You have joined the group.',
  GROUP_LEFT: 'You have left the group.',
  PROFILE_UPDATED: 'Your profile has been updated.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const;