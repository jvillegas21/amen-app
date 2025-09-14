import React, { useState, useEffect, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { prayerService } from '@/services/api/prayerService';
import { commentService } from '@/services/api/commentService';
import { prayerInteractionService } from '@/services/api/prayerInteractionService';
import { Prayer, Comment } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';

export default function PrayerDetailsScreen() {
  const { prayerId } = useLocalSearchParams<{ prayerId: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [interactions, setInteractions] = useState({
    likes: 0,
    comments: 0,
    shares: 0,
    isLiked: false,
    isSaved: false,
  });
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [interacting, setInteracting] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (prayerId) {
      fetchPrayerDetails();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions
      if (prayerId) {
        commentService.unsubscribeFromComments(commentSubscription);
        prayerInteractionService.unsubscribeFromPrayerInteractions(interactionSubscription);
      }
    };
  }, [prayerId]);

  const fetchPrayerDetails = async () => {
    try {
      setLoading(true);
      const [prayerData, commentsData, interactionsData] = await Promise.all([
        prayerService.getPrayer(prayerId!),
        commentService.getPrayerComments(prayerId!),
        prayerInteractionService.getPrayerInteractionCounts(prayerId!),
      ]);

      setPrayer(prayerData);
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
    commentService.subscribeToComments(prayerId!, (newComment) => {
      setComments(prev => [...prev, newComment]);
      setInteractions(prev => ({ ...prev, comments: prev.comments + 1 }));
    });

    // Subscribe to interaction changes
    prayerInteractionService.subscribeToPrayerInteractions(prayerId!, (newInteractions) => {
      setInteractions(newInteractions);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrayerDetails();
    setRefreshing(false);
  };

  const handleLike = async () => {
    if (!prayerId || interacting) return;

    try {
      setInteracting(true);
      await prayerInteractionService.likePrayer(prayerId);
      // Real-time subscription will update the UI
    } catch (error) {
      console.error('Error liking prayer:', error);
      Alert.alert('Error', 'Failed to like prayer');
    } finally {
      setInteracting(false);
    }
  };

  const handleSave = async () => {
    if (!prayerId || interacting) return;

    try {
      setInteracting(true);
      await prayerInteractionService.savePrayer(prayerId);
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
        message: `Check out this prayer: "${prayer.title}"\n\n${prayer.content}`,
        title: prayer.title,
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        // Record the share
        await prayerInteractionService.sharePrayer(prayerId!, 'copy');
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
          
          prayerInteractionService.createPrayerReminder(prayerId!, reminderTime)
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Details</Text>
        <TouchableOpacity onPress={handleCreateReminder} style={styles.reminderButton}>
          <Ionicons name="alarm-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Prayer Content */}
        <View style={styles.prayerContainer}>
          <Text style={styles.prayerTitle}>{prayer.title}</Text>
          <Text style={styles.prayerContent}>{prayer.content}</Text>
          
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
            style={[styles.interactionButton, interactions.isLiked && styles.interactionButtonActive]}
            onPress={handleLike}
            disabled={interacting}
          >
            <Ionicons
              name={interactions.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={interactions.isLiked ? "#FF3B30" : "#666"}
            />
            <Text style={[styles.interactionText, interactions.isLiked && styles.interactionTextActive]}>
              {interactions.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.interactionText}>{interactions.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#666" />
            <Text style={styles.interactionText}>{interactions.shares}</Text>
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
          style={[styles.submitButton, (!newComment.trim() || submittingComment) && styles.submitButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="send" size={20} color="#007AFF" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  reminderButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  prayerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  prayerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
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
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
});