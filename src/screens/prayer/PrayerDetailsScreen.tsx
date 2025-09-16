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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { RootStackScreenProps } from '@/types/navigation.types';
import { prayerService } from '@/services/api/prayerService';
import { commentService } from '@/services/api/commentService';
import { Comment } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';

type PrayerDetailsScreenProps = RootStackScreenProps<'PrayerDetails'>;

export default function PrayerDetailsScreen() {
  const route = useRoute<PrayerDetailsScreenProps['route']>();
  const navigation = useNavigation<PrayerDetailsScreenProps['navigation']>();
  const { prayerId, createReminder } = route.params;
  const { profile } = useAuthStore();
  const { interactWithPrayer, prayers } = usePrayerStore();
  
  // Get the prayer from the store instead of local state
  const prayer = prayers.find(p => p.id === prayerId) || null;
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

  useEffect(() => {
    if (prayerId) {
      fetchPrayerDetails();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions
      if (commentSubscriptionRef.current) {
        commentService.unsubscribeFromComments(commentSubscriptionRef.current);
      }
      if (interactionSubscriptionRef.current) {
        prayerService.unsubscribeFromPrayerInteractions(interactionSubscriptionRef.current);
      }
    };
  }, [prayerId]);

  // Set navigation options
  useLayoutEffect(() => {
    const isOwner = prayer && profile && prayer.user_id === profile.id;
    
    navigation.setOptions({
      title: 'Prayer Details',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isOwner && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('EditPrayer', { prayerId: prayerId });
              }}
              style={{ marginRight: 16 }}
              accessibilityLabel="Edit prayer"
              accessibilityRole="button"
              accessibilityHint="Edit this prayer"
            >
              <Ionicons
                name="create-outline"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              navigation.setParams({ createReminder: true });
            }}
            style={{ marginRight: 16 }}
            accessibilityLabel="Create reminder"
            accessibilityRole="button"
            accessibilityHint="Set a reminder for this prayer"
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
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
      const [commentsData, interactionsData] = await Promise.all([
        commentService.getPrayerComments(prayerId!),
        prayerService.getPrayerInteractionCounts(prayerId!),
      ]);

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
      setInteracting(false);
    }
  };


  const handleSave = async () => {
    if (!prayerId || interacting) return;

    try {
      setInteracting(true);
      await prayerService.savePrayer(prayerId);
      // Real-time subscription will update the UI
    } catch (error) {
      console.error('Error saving prayer:', error);
      Alert.alert('Error', 'Failed to save prayer');
    } finally {
      setInteracting(false);
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
        { text: 'Set Reminder', onPress: () => {
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
        }},
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

  if (!prayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Prayer not found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.prayerContent}>{prayer.text}</Text>
          
          <View style={styles.prayerMeta}>
            <Text style={styles.prayerAuthor}>by {prayer.user?.display_name || 'Anonymous'}</Text>
            <Text style={styles.prayerDate}>
              {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>

        {/* Interaction Buttons */}
        <View style={styles.interactionContainer}>
          <TouchableOpacity
            style={[styles.interactionButton, prayer?.user_interaction?.type === 'PRAY' && styles.interactionButtonActive]}
            onPress={handlePray}
            disabled={interacting}
          >
            <Ionicons
              name={prayer?.user_interaction?.type === 'PRAY' ? "heart" : "heart-outline"}
              size={20}
              color={prayer?.user_interaction?.type === 'PRAY' ? "#FF3B30" : "#666"}
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
            style={[styles.interactionButton, interactions.isSaved && styles.interactionButtonActive]}
            onPress={handleSave}
            disabled={interacting}
          >
            <Ionicons
              name={interactions.isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={interactions.isSaved ? "#007AFF" : "#666"}
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
    paddingTop: 0,
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
});