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
import { MainStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';
import { bibleStudyService, BibleStudy } from '@/services/api/bibleStudyService';
import { normalizeScriptureReferences, RawScriptureReference } from '@/utils/scripture';

/**
 * Bible Study Screen - AI-powered Bible study viewer
 */
const BibleStudyScreen: React.FC<MainStackScreenProps<'BibleStudy'>> = ({ 
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
      const studyData = await bibleStudyService.getBibleStudy(studyId);
      
      // Increment view count
      await bibleStudyService.incrementViewCount(studyId);
      
      setStudy(studyData);
    } catch (error) {
      console.error('Failed to fetch Bible study:', error);
      Alert.alert('Error', 'Failed to load Bible study');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStudy = async () => {
    if (!study || !profile?.id) return;
    
    try {
      if (study.is_saved) {
        await bibleStudyService.unsaveStudyForUser(study.id, profile.id);
        setStudy(prev => prev ? { ...prev, is_saved: false } : null);
      } else {
        await bibleStudyService.saveStudyForUser(study.id, profile.id);
        setStudy(prev => prev ? { ...prev, is_saved: true } : null);
      }
    } catch (error) {
      console.error('Failed to save/unsave study:', error);
      Alert.alert('Error', 'Failed to update saved status');
    }
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
              name={study?.is_saved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={study?.is_saved ? "#5B21B6" : "#6B7280"}
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
              <Text style={styles.metaText}>{study.view_count} views</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bookmark" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{study.save_count} saved</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="theme.colors.warning[700]" />
              <Text style={styles.metaText}>{study.quality_score}/5</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderScriptureReferences = () => {
    const references = normalizeScriptureReferences(
      study?.scripture_references as RawScriptureReference[] | undefined
    );

    if (references.length === 0) {
      return null;
    }

    return (
      <View style={styles.scriptureSection}>
        <Text style={styles.sectionTitle}>Scripture References</Text>
        {references.map(({ referenceLabel, referenceText }, index) => (
          <View key={index} style={styles.scriptureItem}>
            {referenceText ? (
              <Text style={styles.scriptureText}>{referenceText}</Text>
            ) : null}
            {referenceLabel ? (
              <Text style={styles.scriptureReference}>{referenceLabel}</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  };

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
          <Ionicons name="alert-circle" size={48} color="theme.colors.error[700]" />
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
  scriptureText: {
    fontSize: 15,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 8,
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
