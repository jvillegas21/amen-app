import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';
import { bibleStudyService } from '@/services/api/bibleStudyService';
import { BibleStudy } from '@/types/database.types';
import { formatScriptureReference, RawScriptureReference } from '@/utils/scripture';
import { formatDistanceToNow } from 'date-fns';
import PersistentFooterNav from '@/components/navigation/PersistentFooterNav';
import { theme } from '@/theme';

/**
 * Bible Study List Screen - Browse and discover Bible studies
 */
const BibleStudyListScreen: React.FC<MainStackScreenProps<'BibleStudyList'>> = ({ 
  navigation 
}) => {
  const { profile } = useAuthStore();
  
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'recent' | 'my_studies'>('featured');

  useEffect(() => {
    fetchStudies();
  }, [activeTab]);

  const fetchStudies = async () => {
    try {
      setIsLoading(true);
      let studiesData: BibleStudy[] = [];

      switch (activeTab) {
        case 'featured':
          studiesData = await bibleStudyService.getFeaturedStudies(20);
          break;
        case 'recent':
          studiesData = await bibleStudyService.getRecentStudies(20);
          break;
        case 'my_studies':
          if (profile?.id) {
            studiesData = await bibleStudyService.getUserStudies(profile.id, 20);
          }
          break;
        default:
          studiesData = await bibleStudyService.getRecentStudies(20);
      }

      setStudies(studiesData);
    } catch (error) {
      console.error('Failed to fetch Bible studies:', error);
      Alert.alert('Error', 'Failed to load Bible studies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudies();
    setIsRefreshing(false);
  };

  const handleStudyPress = (study: BibleStudy) => {
    navigation.navigate('BibleStudy', { studyId: study.id });
  };

  const renderTabButton = (tab: 'featured' | 'recent' | 'my_studies', label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStudyCard = ({ item }: { item: BibleStudy }) => (
    <TouchableOpacity
      style={styles.studyCard}
      onPress={() => handleStudyPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.studyHeader}>
        <View style={styles.studyHeaderLeft}>
          <Text style={styles.studyTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.studyMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.view_count}</Text>
            </View>
            {item.quality_score && (
              <View style={styles.metaItem}>
                <Ionicons name="star-outline" size={14} color="#F59E0B" />
                <Text style={styles.metaText}>{item.quality_score}/5</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.studyHeaderRight}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={(e) => {
              e.stopPropagation();
              // TODO: Implement save functionality
            }}
          >
            <Ionicons
              name="bookmark-outline"
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.studyContent} numberOfLines={3}>
        {item.content_md}
      </Text>

      {item.scripture_references && item.scripture_references.length > 0 && (
        <View style={styles.scriptureContainer}>
          <Text style={styles.scriptureLabel}>Scripture:</Text>
          <Text style={styles.scriptureText}>
            {formatScriptureReference(
              item.scripture_references[0] as RawScriptureReference
            ) || 'Scripture reference'}
          </Text>
        </View>
      )}

      <View style={styles.studyFooter}>
        <Text style={styles.studyDate}>
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </Text>
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#D97706" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Bible Studies Found</Text>
      <Text style={styles.emptyText}>
        {activeTab === 'my_studies' 
          ? "You haven't created any Bible studies yet."
          : "No Bible studies available at the moment."
        }
      </Text>
      {activeTab === 'my_studies' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateBibleStudy', {})}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Your First Study</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.tabContainer}>
        {renderTabButton('featured', 'Featured')}
        {renderTabButton('recent', 'Recent')}
        {renderTabButton('my_studies', 'My Studies')}
      </View>
    </View>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Loading Bible studies...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={studies}
        renderItem={renderStudyCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#D97706']}
            tintColor="#D97706"
          />
        )}
        ListEmptyComponent={renderEmptyState}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {renderHeader()}
        {renderBody()}
      </View>
      <PersistentFooterNav activeTab="Discover" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#D97706',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#D97706',
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: theme.layout.tabBarHeight + theme.spacing[8],
  },
  studyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studyHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  studyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  studyMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  studyContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  scriptureContainer: {
    marginBottom: 12,
  },
  scriptureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  scriptureText: {
    fontSize: 14,
    color: '#374151',
  },
  studyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BibleStudyListScreen;
