import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Prayer } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/theme/ThemeContext';
import * as Haptics from 'expo-haptics';

interface PrayerCardProps {
  prayer: Prayer;
  onPress: () => void;
  onPrayPress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  onSavePress?: () => void;
  isSaved?: boolean;
  isPraying?: boolean;
  isSharing?: boolean;
  isSaving?: boolean;
  onReportPress?: () => void;
  onBlockUserPress?: () => void;
}

/**
 * Prayer Card Component
 * Implements Single Responsibility: Only displays prayer information
 */
const PrayerCard: React.FC<PrayerCardProps> = (
  { prayer, onPress, onPrayPress, onCommentPress, onSharePress, onSavePress, isSaved, isPraying, isSharing, isSaving, onReportPress, onBlockUserPress }: PrayerCardProps
) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const timeAgo = formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true });
  const isAnonymous = prayer.is_anonymous;
  const displayName = isAnonymous ? 'Anonymous' : prayer.user?.display_name || 'User';
  const avatarUrl = isAnonymous ? null : prayer.user?.avatar_url;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const handleActionPress = useCallback(async (action: () => void) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const styles = createStyles(theme);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        style={styles.container}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Prayer by ${displayName}, ${timeAgo}. ${prayer.text}`}
        accessibilityHint="Double tap to view prayer details"
        accessibilityState={{
          selected: prayer.user_interaction?.type === 'PRAY'
        }}
      >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons
                name={isAnonymous ? 'person-outline' : 'person'}
                size={20}
                color={theme.colors.neutral[400]}
              />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.timeText}>{timeAgo}</Text>
              {prayer.location_city && prayer.location_granularity !== 'hidden' && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color={theme.colors.neutral[400]} />
                    <Text style={styles.locationText}>{prayer.location_city}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          {prayer.privacy_level !== 'public' && (
            <View style={styles.privacyBadge}>
              <Ionicons
                name={
                  prayer.privacy_level === 'private'
                    ? 'lock-closed-outline'
                    : prayer.privacy_level === 'friends'
                    ? 'people-outline'
                    : 'people-circle-outline'
                }
                size={12}
                color={theme.colors.text.secondary}
              />
            </View>
          )}
          {onSavePress && (
            <Pressable
              style={[styles.saveButton, isSaving && styles.actionButtonDisabled]}
              onPress={() => handleActionPress(onSavePress)}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={`${isSaved ? 'Remove from saved prayers' : 'Save prayer'}`}
              accessibilityHint={`Double tap to ${isSaved ? 'remove from' : 'add to'} your saved prayers`}
              accessibilityState={{ pressed: isSaved, disabled: isSaving }}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isSaved ? theme.colors.primary[600] : theme.colors.text.secondary}
              />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.prayerText} numberOfLines={4}>
          {prayer.text}
        </Text>

        {prayer.tags && prayer.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {prayer.tags.slice(0, 3).map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, isPraying && styles.actionButtonDisabled]}
          onPress={() => handleActionPress(onPrayPress)}
          disabled={isPraying}
          accessibilityRole="button"
          accessibilityLabel={`${prayer.user_interaction?.type === 'PRAY' ? 'Remove prayer' : 'Pray for this'}`}
          accessibilityHint={`Double tap to ${prayer.user_interaction?.type === 'PRAY' ? 'remove your prayer' : 'add your prayer'}`}
          accessibilityState={{ pressed: prayer.user_interaction?.type === 'PRAY', disabled: isPraying }}
        >
          <Ionicons
            name={prayer.user_interaction?.type === 'PRAY' ? 'heart' : 'heart-outline'}
            size={20}
            color={prayer.user_interaction?.type === 'PRAY' ? theme.colors.error[500] : theme.colors.text.secondary}
          />
          <Text style={[
            styles.actionText,
            prayer.user_interaction?.type === 'PRAY' && { color: theme.colors.error[500] },
            isPraying && { opacity: 0.6 }
          ]}>
            {prayer.pray_count && prayer.pray_count > 0 ? prayer.pray_count : 'Pray'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => handleActionPress(onCommentPress)}
          accessibilityRole="button"
          accessibilityLabel={`Comment on prayer${prayer.comment_count ? `, ${prayer.comment_count} comments` : ''}`}
          accessibilityHint="Double tap to view and add comments"
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.actionText}>
            {prayer.comment_count && prayer.comment_count > 0 ? prayer.comment_count : 'Comment'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, isSharing && styles.actionButtonDisabled]}
          onPress={() => handleActionPress(onSharePress)}
          disabled={isSharing}
          accessibilityRole="button"
          accessibilityLabel="Share prayer"
          accessibilityHint="Double tap to share this prayer with others"
          accessibilityState={{ disabled: isSharing }}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={[styles.actionText, isSharing && { opacity: 0.6 }]}>Share</Text>
        </Pressable>

      </View>

        {prayer.status === 'answered' && (
          <View style={styles.answeredBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success[500]} />
            <Text style={styles.answeredText}>Answered</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

PrayerCard.displayName = 'PrayerCard';

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.card,
    marginHorizontal: theme.spacing[4],
    marginVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    ...theme.shadows.sm,
    shadowColor: theme.colors.neutral[1000],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: theme.spacing[10],
    height: theme.spacing[10],
    borderRadius: theme.spacing[5],
    marginRight: theme.spacing[3],
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...theme.typography.label.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[0.5],
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.tertiary,
  },
  separator: {
    marginHorizontal: theme.spacing[1.5],
    color: theme.colors.text.tertiary,
    ...theme.typography.caption.medium,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  menuButton: {
    padding: 4,
  },
  saveButton: {
    padding: 8,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.tertiary,
  },
  content: {
    marginBottom: 12,
  },
  prayerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionTextActive: {
    color: 'theme.colors.error[700]',
  },
  actionCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  answeredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  answeredText: {
    marginLeft: 4,
    fontSize: 12,
    color: 'theme.colors.success[700]',
    fontWeight: '600',
  },
});

export default PrayerCard;