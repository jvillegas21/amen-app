import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';

interface BibleStudy {
  id: string;
  title: string;
  content: string;
  scriptureReferences: string[];
  qualityScore: number;
  viewCount: number;
  saveCount: number;
  isSaved?: boolean;
}

/**
 * Bible Study Screen - AI-powered Bible study viewer
 */
const BibleStudyScreen: React.FC<RootStackScreenProps<'BibleStudy'>> = ({ 
  navigation, 
  route 
}) => {
  const { studyId } = route.params;
  const { profile } = useAuthStore();
  
  const [study, setStudy] = useState<BibleStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBibleStudy();
  }, [studyId]);

  const fetchBibleStudy = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API call
      const mockStudy: BibleStudy = {
        id: studyId,
        title: 'Finding Peace in Times of Anxiety',
        content: `# Finding Peace in Times of Anxiety

In our fast-paced world, anxiety has become a common struggle for many believers. This study explores biblical principles for finding peace and comfort in God's presence.

## Understanding Anxiety from a Biblical Perspective

Anxiety is not a sin, but rather a human emotion that God understands. The Bible acknowledges our struggles and provides hope through His promises.

### Key Biblical Principles:

1. **Trust in God's Sovereignty**
   - God is in control of all circumstances
   - His plans are perfect, even when we don't understand them
   - We can rest in His wisdom and timing

2. **Prayer and Supplication**
   - Bring your concerns to God in prayer
   - Be specific about your worries and fears
   - Thank God for His past faithfulness

3. **Meditation on Scripture**
   - Focus on God's promises and character
   - Memorize verses that bring comfort
   - Let God's Word renew your mind

## Practical Steps for Peace

Remember that God's peace surpasses all understanding. When we trust in Him and follow His guidance, we can find rest even in the midst of life's storms.`,
        scriptureReferences: [
          'Philippians 4:6-7',
          'Matthew 6:25-34',
          'Isaiah 26:3',
          '1 Peter 5:7',
          'Psalm 23:1-6'
        ],
        qualityScore: 4.8,
        viewCount: 156,
        saveCount: 23,
        isSaved: false,
      };

      setStudy(mockStudy);
    } catch (error) {
      console.error('Failed to fetch Bible study:', error);
      Alert.alert('Error', 'Failed to load Bible study');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStudy = async () => {
    if (!study) return;
    // TODO: Implement save study API call
    setStudy(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSaveStudy}>
            <Ionicons
              name={study?.isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={study?.isSaved ? "#5B21B6" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {study && (
        <View style={styles.studyInfo}>
          <Text style={styles.studyTitle}>{study.title}</Text>
          <View style={styles.studyMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="eye" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{study.viewCount} views</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bookmark" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{study.saveCount} saved</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metaText}>{study.qualityScore}/5</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderScriptureReferences = () => (
    <View style={styles.scriptureSection}>
      <Text style={styles.sectionTitle}>Scripture References</Text>
      {study?.scriptureReferences.map((reference, index) => (
        <View key={index} style={styles.scriptureItem}>
          <Text style={styles.scriptureReference}>{reference}</Text>
        </View>
      ))}
    </View>
  );

  const renderStudyContent = () => (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>Study Content</Text>
      <Text style={styles.studyContent}>{study?.content}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading Bible study...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!study) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Study Not Found</Text>
          <Text style={styles.errorText}>
            The Bible study you're looking for could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderScriptureReferences()}
        {renderStudyContent()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  studyInfo: {
    marginTop: 8,
  },
  studyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  studyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scriptureSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  scriptureItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#5B21B6',
  },
  scriptureReference: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  studyContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default BibleStudyScreen;