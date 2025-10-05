/**
 * Prayer Categories - Shared constants for prayer classification
 * Used in CreatePrayerScreen, EditPrayerScreen, and DiscoverScreen
 */

/**
 * Type-safe prayer category IDs
 * These IDs are stored in the database `tags` array field
 */
export type PrayerCategoryId =
  | 'health_healing'
  | 'family_relationships'
  | 'spiritual_growth'
  | 'work_career'
  | 'peace_comfort'
  | 'community_world'
  | 'financial_provision'
  | 'guidance_decisions';

export interface PrayerCategory {
  id: PrayerCategoryId;
  name: string;
  icon: 'medical' | 'people' | 'book' | 'briefcase' | 'heart' | 'globe' | 'cash' | 'compass';
  color: string;
}

export const PRAYER_CATEGORIES: PrayerCategory[] = [
  { id: 'health_healing', name: 'Health & Healing', icon: 'medical', color: '#DC2626' },
  { id: 'family_relationships', name: 'Family & Relationships', icon: 'people', color: '#059669' },
  { id: 'spiritual_growth', name: 'Spiritual Growth', icon: 'book', color: '#5B21B6' },
  { id: 'work_career', name: 'Work & Career', icon: 'briefcase', color: '#D97706' },
  { id: 'peace_comfort', name: 'Peace & Comfort', icon: 'heart', color: '#06B6D4' },
  { id: 'community_world', name: 'Community & World', icon: 'globe', color: '#8B5CF6' },
  { id: 'financial_provision', name: 'Financial Provision', icon: 'cash', color: '#10B981' },
  { id: 'guidance_decisions', name: 'Guidance & Decisions', icon: 'compass', color: '#F59E0B' },
];

/**
 * Get category by ID
 * @param id - Category ID to look up
 * @returns Category object or undefined if not found
 */
export function getCategoryById(id: string): PrayerCategory | undefined {
  return PRAYER_CATEGORIES.find(c => c.id === id);
}

/**
 * Validate if a string is a valid category ID
 * @param id - String to validate
 * @returns True if valid category ID
 */
export function isValidCategoryId(id: string): id is PrayerCategoryId {
  return PRAYER_CATEGORIES.some(c => c.id === id);
}
