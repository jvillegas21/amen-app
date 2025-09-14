import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { useAuthStore } from '@/store/auth/authStore';
import { openAIService } from '@/services/ai/openaiService';
import { Ionicons } from '@expo/vector-icons';
import { Prayer, Comment } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';

/**
 * Prayer Details Screen - Full prayer view with comments and Bible study
 * Based on prayer_request_details mockups
 */
const PrayerDetailsScreen: React.FC<RootStackScreenProps<'PrayerDetails'>> = ({ navigation, route }) => {
  const { prayerId } = route.params;
  const { profile } = useAuthStore();
  const { interactWithPrayer, isLoading } = usePrayerStore();
  
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showBibleStudy, setShowBibleStudy] = useState(false);
  const [bibleStudy, setBibleStudy] = useState<any>(null);
  const [isGeneratingStudy, setIsGeneratingStudy] = useState(false);
  const [showComments, setShowComments] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchPrayerDetails();
    fetchComments();
  }, [prayerId]);

  const fetchPrayerDetails = async () => {
    try {
      // TODO: Implement prayer details fetch from API
      // For now, using mock data
      const mockPrayer: Prayer = {
        id: prayerId,
        user_id: 'user1',
        text: 'Please pray for my family during this difficult time. We are facing financial struggles and need God\'s guidance and provision.',
        location_city: 'New York, NY',
        privacy_level: 'public',
        status: 'open',
        is_anonymous: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_display_name: 'John Doe',
        user_avatar_url: 'https://via.placeholder.com/40',
        interaction_count: 12,
        comment_count: 5,
        user_interaction: null,
      };
      setPrayer(mockPrayer);
    } catch (error) {
      Alert.alert('Error', 'Failed to load prayer details');
    }
  };

  const fetchComments = async () => {
    try {
      // TODO: Implement comments fetch from API
      // For now, using mock data
      const mockComments: Comment[] = [
        {
          id: '1',
          prayer_id: prayerId,
          user_id: 'user2',
          text: 'Praying for you and your family. God will provide!',
          is_edited: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          user_display_name: 'Sarah Johnson',
          user_avatar_url: 'https://via.placeholder.com/40',
        },
        {
          id: '2',
          prayer_id: prayerId,
          user_id: 'user3',
          text: 'I\'ve been through similar struggles. Trust in His plan. Sending prayers your way!',
          is_edited: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          user_display_name: 'Mike Wilson',
          user_avatar_url: 'https://via.placeholder.com/40',
        },
      ];
      setComments(mockComments);
    } catch (error) {
      Alert.alert('Error', 'Failed to load comments');
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      // TODO: Implement comment submission to API
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        prayer_id: prayerId,
        user_id: profile?.id || '',
        text: newComment.trim(),
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_display_name: profile?.display_name || 'You',
        user_avatar_url: profile?.avatar_url || null,
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      
      // Scroll to top of comments
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handlePrayerInteraction = async (type: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE') => {
    try {
      await interactWithPrayer(prayerId, type);
      // Update local prayer state
      if (prayer) {
        setPrayer(prev => prev ? {
          ...prev,
          user_interaction: { type, created_at: new Date().toISOString() },
          interaction_count: (prev.interaction_count || 0) + 1,
        } : null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to interact with prayer');
    }
  };

  const generateBibleStudy = async () => {
    if (!prayer) return;

    setIsGeneratingStudy(true);
    try {
      const study = await openAIService.generateStudy({
        prayer_text: prayer.text,
        user_id: profile?.id || '',
      });
      setBibleStudy(study);
      setShowBibleStudy(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate Bible study');
    } finally {
      setIsGeneratingStudy(false);
    }
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderPrayerHeader = () => {
    if (!prayer) return null;

    return (
      <View style={styles.prayerContainer}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <TouchableOpacity
            style={styles.userDetails}
            onPress={() => handleUserPress(prayer.user_id)}
          >
            <Image
              source={{ uri: prayer.user_avatar_url || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
            <View style={styles.userText}>
              <Text style={styles.userName}>
                {prayer.is_anonymous ? 'Anonymous' : prayer.user_display_name}
              </Text>
              <View style={styles.metaInfo}>
                <Text style={styles.timeText}>
                  {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
                </Text>
                {prayer.location_city && (
                  <>
                    <Text style={styles.separator}>•</Text>
                    <View style={styles.locationContainer}>
                      <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.locationText}>{prayer.location_city}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Prayer Text */}
        <Text style={styles.prayerText}>{prayer.text}</Text>

        {/* Status Badge */}
        {prayer.status === 'answered' && (
          <View style={styles.answeredBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.answeredText}>Prayer Answered</Text>
          </View>
        )}

        {/* Interaction Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {prayer.interaction_count || 0} people are praying
          </Text>
          <Text style={styles.statsText}>
            {prayer.comment_count || 0} comments
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrayerInteraction('PRAY')}
          >
            <Ionicons
              name={prayer.user_interaction?.type === 'PRAY' ? 'heart' : 'heart-outline'}
              size={24}
              color={prayer.user_interaction?.type === 'PRAY' ? '#EF4444' : '#6B7280'}
            />
            <Text style={[
              styles.actionButtonText,
              prayer.user_interaction?.type === 'PRAY' && styles.actionButtonTextActive
            ]}>
              Pray
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
            <Text style={styles.actionButtonText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrayerInteraction('SHARE')}
          >
            <Ionicons name="share-outline" size={24} color="#6B7280" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrayerInteraction('SAVE')}
          >
            <Ionicons
              name={prayer.user_interaction?.type === 'SAVE' ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={prayer.user_interaction?.type === 'SAVE' ? '#5B21B6' : '#6B7280'}
            />
            <Text style={[
              styles.actionButtonText,
              prayer.user_interaction?.type === 'SAVE' && styles.actionButtonTextActive
            ]}>
              Save
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={generateBibleStudy}
            disabled={isGeneratingStudy}
          >
            {isGeneratingStudy ? (
              <ActivityIndicator size="small" color="#5B21B6" />
            ) : (
              <Ionicons name="book-outline" size={24} color="#5B21B6" />
            )}
            <Text style={[styles.actionButtonText, { color: '#5B21B6' }]}>
              Bible Study
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.commentContainer}>
      <TouchableOpacity
        style={styles.commentUserInfo}
        onPress={() => handleUserPress(comment.user_id)}
      >
        <Image
          source={{ uri: comment.user_avatar_url || 'https://via.placeholder.com/32' }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentUserDetails}>
          <Text style={styles.commentUserName}>{comment.user_display_name}</Text>
          <Text style={styles.commentTime}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Text>
        </View>
      </TouchableOpacity>
      
      <Text style={styles.commentText}>{comment.text}</Text>
      
      {comment.is_edited && (
        <Text style={styles.editedText}>(edited)</Text>
      )}
    </View>
  );

  const renderBibleStudyModal = () => (
    <Modal
      visible={showBibleStudy}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowBibleStudy(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Bible Study</Text>
          <TouchableOpacity onPress={() => setShowBibleStudy(false)}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {bibleStudy && (
            <>
              <Text style={styles.studyTitle}>{bibleStudy.title}</Text>
              <Text style={styles.studyContent}>{bibleStudy.content}</Text>
              
              {bibleStudy.scripture_references && bibleStudy.scripture_references.length > 0 && (
                <View style={styles.scriptureContainer}>
                  <Text style={styles.scriptureTitle}>Scripture References:</Text>
                  {bibleStudy.scripture_references.map((ref: any, index: number) => (
                    <Text key={index} style={styles.scriptureText}>
                      {ref.book} {ref.chapter}:{ref.verse}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (!prayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading prayer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderPrayerHeader()}
          
          {showComments && (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>
                Comments ({comments.length})
              </Text>
              
              {comments.map(renderComment)}
              
              {comments.length === 0 && (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to share encouragement</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Share encouragement..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!newComment.trim() || isSubmittingComment) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmittingComment}
          >
            {isSubmittingComment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {renderBibleStudyModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  prayerContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userDetails: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  separator: {
    marginHorizontal: 6,
    color: '#9CA3AF',
    fontSize: 12,
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
  moreButton: {
    padding: 4,
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  answeredText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#5B21B6',
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  commentContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  editedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
    marginRight: 12,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  studyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  studyContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  scriptureContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  scriptureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  scriptureText: {
    fontSize: 14,
    color: '#5B21B6',
    marginBottom: 4,
  },
});

export default PrayerDetailsScreen;
