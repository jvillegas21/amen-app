import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { MainStackScreenProps } from '@/types/navigation.types';
import { prayerService } from '@/services/api/prayerService';
import { commentService } from '@/services/api/commentService';
import { Comment } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';

type PrayerDetailsScreenProps = MainStackScreenProps<'PrayerDetails'>;

export default function PrayerDetailsScreen() {
  const route = useRoute<PrayerDetailsScreenProps['route']>();
  const navigation = useNavigation<PrayerDetailsScreenProps['navigation']>();
  const { prayerId, createReminder } = route.params;
  const { profile } = useAuthStore();
  const { interactWithPrayer, prayers, deletingPrayerIds } = usePrayerStore();

  // Get the prayer from the store instead of local state
  const prayer = prayers.find(p => p.id === prayerId) || null;
  const isDeleting = deletingPrayerIds.has(prayerId);
  const [isUnmounting, setIsUnmounting] = useState(false);
  const [wasDeleted, setWasDeleted] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [interactions, setInteractions] = useState({
    prayers: 0,
    comments: 0,
    isPrayed: false,
    isSaved: false,
  });
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [interacting, setInteracting] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);
  const commentSubscriptionRef = useRef<any>(null);
  const interactionSubscriptionRef = useRef<any>(null);

  // Detect when prayer disappears from store (optimistic deletion)
  useEffect(() => {
    if (!prayer && !loading && !isDeleting) {
      // Prayer disappeared but we're not in a loading or deleting state
      // This likely means optimistic deletion happened
      setWasDeleted(true);
    }
  }, [prayer, loading, isDeleting]);

  useEffect(() => {
    if (prayerId) {
      fetchPrayerDetails();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Mark component as unmounting to prevent error flash
      setIsUnmounting(true);

      // Cleanup subscriptions
      if (commentSubscriptionRef.current) {
        commentService.unsubscribeFromComments(commentSubscriptionRef.current);
      }
      if (interactionSubscriptionRef.current) {
        prayerService.unsubscribeFromPrayerInteractions(interactionSubscriptionRef.current);
      }
    };
  }, [prayerId]);

  // Set navigation options with proper header centering and actions
  useLayoutEffect(() => {
    const isOwner = prayer && profile && prayer.user_id === profile.id;

    const actions: { onPress: () => void; iconName: any; accessibilityLabel: string; accessibilityHint: string }[] = [];

    // Add edit action if user owns the prayer
    if (isOwner) {
      actions.push({
        onPress: () => navigation.navigate('EditPrayer', { prayerId: prayerId }),
        iconName: 'create-outline',
        accessibilityLabel: 'Edit prayer',
        accessibilityHint: 'Edit this prayer'
      });
    }

    // Add reminder action for all users
    actions.push({
      onPress: () => navigation.setParams({ createReminder: true }),
      iconName: 'notifications-outline',
      accessibilityLabel: 'Create reminder',
      accessibilityHint: 'Set a reminder for this prayer'
    });

    navigation.setOptions({
      title: 'Prayer Details',
      headerTitleAlign: 'center', // Ensure title is centered
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={{
                padding: 8,
                marginLeft: index > 0 ? 8 : 0,
              }}
              accessibilityLabel={action.accessibilityLabel}
              accessibilityRole="button"
              accessibilityHint={action.accessibilityHint}
            >
              <Ionicons
                name={action.iconName}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ))}
        </View>
      ),
    });
  }, [navigation, prayer, profile, prayerId]);

  // Handle reminder creation from navigation params
  useEffect(() => {
    if (createReminder) {
      handleCreateReminder();
      // Clear the parameter to prevent repeated triggers
      navigation.setParams({ createReminder: undefined });
    }
  }, [createReminder]);

  const fetchPrayerDetails = async () => {
    try {
      setLoading(true);
      // Fetch full prayer details (including images) and interactions in parallel
      const [prayerData, commentsData, interactionsData] = await Promise.all([
        prayerService.getPrayer(prayerId!),
        commentService.getPrayerComments(prayerId!),
        prayerService.getPrayerInteractionCounts(prayerId!),
      ]);

      // Update store with full prayer details (fixes missing images)
      if (prayerData) {
        // We use updatePrayerFromRealtime as a generic "update/upsert" action
        // Use type assertion to access the method if it's not in the interface but exists in implementation
        // or just use the method if it's available.
        // Checking store definition: updatePrayerFromRealtime is available.
        const { updatePrayerFromRealtime } = usePrayerStore.getState();
        updatePrayerFromRealtime(prayerData);
      }

      setComments(commentsData);
      setInteractions(interactionsData);
    } catch (error) {
      console.error('Error fetching prayer details:', error);
      Alert.alert('Error', 'Failed to load prayer details');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new comments
    commentSubscriptionRef.current = commentService.subscribeToComments(prayerId!, (newComment) => {
      setComments(prev => [...prev, newComment]);
      setInteractions(prev => ({ ...prev, comments: prev.comments + 1 }));
    });

    // Subscribe to interaction changes
    interactionSubscriptionRef.current = prayerService.subscribeToPrayerInteractions(prayerId!, (newInteractions) => {
      setInteractions(newInteractions);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrayerDetails();
    setRefreshing(false);
  };

  const handlePray = async () => {
    if (!prayerId || interacting) return;

    try {
      setInteracting(true);
      // Use the same optimistic update approach as the prayer card
      await interactWithPrayer(prayerId, 'PRAY');
    } catch (error) {
      console.error('Error praying for prayer:', error);
      Alert.alert('Error', 'Failed to pray for this request');
    } finally {
      // Clear interacting state after a short delay to prevent visual flickering
      setTimeout(() => {
        setInteracting(false);
      }, 200);
    }
  };


  const handleSave = async () => {
    if (!prayerId || interacting) return;

    // Store previous state for rollback
    const previousState = { ...interactions };
    const wasSaved = prayer?.user_interactions?.isSaved || interactions.isSaved;

    try {
      setInteracting(true);

      // Optimistic update
      setInteractions(prev => ({
        ...prev,
        isSaved: !wasSaved,
        // Update save count if needed (though usually hidden in details)
      }));

      // Use the same interaction method as prayer cards for consistency
      await interactWithPrayer(prayerId, 'SAVE');
    } catch (error) {
      console.error('Error saving prayer:', error);
      // Rollback on error
      setInteractions(previousState);
      Alert.alert('Error', 'Failed to save prayer');
    } finally {
      // Clear interacting state after a short delay to prevent visual flickering
      setTimeout(() => {
        setInteracting(false);
      }, 200);
    }
  };

  const handleShare = async () => {
    if (!prayer) return;

    try {
      const shareOptions = {
        message: `Check out this prayer: "${prayer.text}"`,
        title: 'Prayer Request',
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        // Record the share
        await prayerService.sharePrayer(prayerId!, 'copy');
      }
    } catch (error) {
      console.error('Error sharing prayer:', error);
      Alert.alert('Error', 'Failed to share prayer');
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !prayerId || submittingComment) return;

    try {
      setSubmittingComment(true);
      const comment = await commentService.createComment({
        prayer_id: prayerId,
        text: newComment.trim(),
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setInteractions(prev => ({ ...prev, comments: prev.comments + 1 }));

      // Scroll to bottom to show new comment
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateReminder = () => {
    if (!prayer) return;

    Alert.alert(
      'Create Reminder',
      'Set a reminder to pray for this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Reminder', onPress: () => {
            // For now, set a reminder for 1 hour from now
            const reminderTime = new Date();
            reminderTime.setHours(reminderTime.getHours() + 1);

            prayerService.createPrayerReminder(prayerId!, reminderTime)
              .then(() => {
                Alert.alert('Success', 'Reminder set for 1 hour from now');
              })
              .catch((error) => {
                console.error('Error creating reminder:', error);
                Alert.alert('Error', 'Failed to create reminder');
              });
          }
        },
      ]
    );
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

  // Show loading state if prayer is being deleted
  if (isDeleting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Deleting prayer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't show error if:
  // - Unmounting (navigation in progress)
  // - Prayer was optimistically deleted (wasDeleted flag)
  if (!prayer && !isUnmounting && !wasDeleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Prayer not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main', params: { screen: 'Home' } }],
              })
            )}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If unmounting, deleted, or prayer missing, show nothing (navigation will handle this)
  if (!prayer) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Updated Prayer Details Screen */}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Prayer Content */}
        <View style={styles.prayerContainer}>
          {/* Header: Avatar, Name, Time, Location */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              {prayer.is_anonymous ? (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                </View>
              ) : prayer.user?.avatar_url ? (
                <Image source={{ uri: prayer.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={20} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {prayer.is_anonymous ? 'Anonymous' : prayer.user?.display_name || 'User'}
                </Text>
                <View style={styles.metaInfo}>
                  <Text style={styles.timeText}>
                    {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
                  </Text>
                  {prayer.location_city && prayer.location_granularity !== 'hidden' && (
                    <>
                      <Text style={styles.separator}>•</Text>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                          {prayer.location_city}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Privacy Badge */}
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
                  color="#6B7280"
                />
              </View>
            )}
          </View>

          {/* Prayer Text */}
          <Text style={styles.prayerContent}>{prayer.text}</Text>

          {/* Prayer Images */}
          {prayer.images && prayer.images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesContainer}
              contentContainerStyle={styles.imagesContentContainer}
            >
              {prayer.images.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => {
                    // TODO: Implement full screen image viewer
                  }}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.prayerImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Interaction Buttons */}
        <View style={styles.interactionContainer}>
          <TouchableOpacity
            style={[styles.interactionButton, prayer?.user_interaction?.type === 'PRAY' && styles.interactionButtonActive]}
            onPress={handlePray}
            accessibilityRole="button"
            accessibilityState={{ disabled: interacting }}
            accessibilityLabel={`${prayer?.user_interaction?.type === 'PRAY' ? 'Remove prayer' : 'Pray for this request'}`}
            accessibilityHint={`Double tap to ${prayer?.user_interaction?.type === 'PRAY' ? 'remove your prayer' : 'add your prayer'}`}
          >
            <Ionicons
              name={(prayer?.user_interactions?.isPrayed || prayer?.user_interaction?.type === 'PRAY') ? "heart" : "heart-outline"}
              size={20}
              color={(prayer?.user_interactions?.isPrayed || prayer?.user_interaction?.type === 'PRAY') ? "#FF3B30" : "#666"}
            />
            <Text style={[styles.interactionText, prayer?.user_interaction?.type === 'PRAY' && styles.interactionTextActive]}>
              {prayer?.pray_count || 0}
            </Text>
          </TouchableOpacity>


          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.interactionText}>{interactions.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.interactionButton, (prayer?.user_interactions?.isSaved || interactions.isSaved) && styles.interactionButtonActive]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: interacting }}
            accessibilityLabel={`${prayer?.user_interactions?.isSaved || interactions.isSaved ? 'Remove from saved prayers' : 'Save prayer for later'}`}
            accessibilityHint={`Double tap to ${prayer?.user_interactions?.isSaved || interactions.isSaved ? 'remove from' : 'add to'} your saved prayers`}
          >
            <Ionicons
              name={(prayer?.user_interactions?.isSaved || interactions.isSaved) ? "bookmark" : "bookmark-outline"}
              size={20}
              color={(prayer?.user_interactions?.isSaved || interactions.isSaved) ? "#007AFF" : "#666"}
            />
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>
                  {comment.user?.display_name || 'Anonymous'}
                </Text>
                <Text style={styles.commentDate}>
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}

          {comments.length === 0 && (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          ref={commentInputRef}
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!newComment.trim() || submittingComment) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : !newComment.trim() ? (
            <Ionicons
              name="send-outline"
              size={20}
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  prayerContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  prayerContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  prayerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerAuthor: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  prayerDate: {
    fontSize: 14,
    color: '#666',
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  interactionButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  interactionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  interactionTextActive: {
    color: '#007AFF',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    backgroundColor: '#F9F9F9',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  separator: {
    marginHorizontal: 6,
    color: '#6B7280',
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 2,
    flex: 1,
    minWidth: 0,
  },
  privacyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imagesContentContainer: {
    paddingRight: 16,
  },
  prayerImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
});
