import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { ProfileStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

interface UserStatistics {
  prayers_posted: number;
  prayers_received: number;
  total_interactions: number;
  groups_joined: number;
  followers_count: number;
  following_count: number;
  joined_date: string;
  streak_days: number;
  longest_streak: number;
  monthly_stats: {
    prayers_posted: number;
    prayers_received: number;
    interactions_given: number;
  };
  weekly_activity: Array<{
    day: string;
    prayers_posted: number;
    interactions: number;
  }>;
  top_categories: Array<{
    category: string;
    count: number;
  }>;
}

/**
 * Statistics Screen - User activity insights and analytics
 * Based on user_profile mockups
 */
const StatisticsScreen: React.FC<ProfileStackScreenProps<'Statistics'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement statistics fetch from API
      // For now, using mock data
      const mockStats: UserStatistics = {
        prayers_posted: 24,
        prayers_received: 156,
        total_interactions: 89,
        groups_joined: 5,
        followers_count: 89,
        following_count: 42,
        joined_date: '2023-01-15T00:00:00Z',
        streak_days: 7,
        longest_streak: 21,
        monthly_stats: {
          prayers_posted: 8,
          prayers_received: 45,
          interactions_given: 23,
        },
        weekly_activity: [
          { day: 'Mon', prayers_posted: 1, interactions: 3 },
          { day: 'Tue', prayers_posted: 0, interactions: 2 },
          { day: 'Wed', prayers_posted: 2, interactions: 5 },
          { day: 'Thu', prayers_posted: 1, interactions: 4 },
          { day: 'Fri', prayers_posted: 0, interactions: 1 },
          { day: 'Sat', prayers_posted: 1, interactions: 3 },
          { day: 'Sun', prayers_posted: 0, interactions: 2 },
        ],
        top_categories: [
          { category: 'Health', count: 8 },
          { category: 'Family', count: 6 },
          { category: 'Work', count: 4 },
          { category: 'Relationships', count: 3 },
          { category: 'Spiritual Growth', count: 3 },
        ],
      };
      setStatistics(mockStats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatistics();
    setIsRefreshing(false);
  };

  const renderOverviewCards = () => {
    if (!statistics) return null;

    const overviewData = [
      {
        title: 'Prayers Posted',
        value: statistics.prayers_posted,
        icon: 'heart-outline',
        color: '#EF4444',
      },
      {
        title: 'Prayers Received',
        value: statistics.prayers_received,
        icon: 'heart',
        color: '#10B981',
      },
      {
        title: 'Total Interactions',
        value: statistics.total_interactions,
        icon: 'hand-left-outline',
        color: '#5B21B6',
      },
      {
        title: 'Groups Joined',
        value: statistics.groups_joined,
        icon: 'people-outline',
        color: '#F59E0B',
      },
    ];

    return (
      <View style={styles.overviewContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.overviewGrid}>
          {overviewData.map((item, index) => (
            <View key={index} style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.overviewValue}>{item.value}</Text>
              <Text style={styles.overviewLabel}>{item.title}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStreakCard = () => {
    if (!statistics) return null;

    return (
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Ionicons name="flame" size={24} color="#F59E0B" />
          <Text style={styles.streakTitle}>Prayer Streak</Text>
        </View>
        <View style={styles.streakContent}>
          <Text style={styles.currentStreak}>{statistics.streak_days}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.longestStreak}>
            Best: {statistics.longest_streak} days
          </Text>
        </View>
      </View>
    );
  };

  const renderMonthlyStats = () => {
    if (!statistics) return null;

    return (
      <View style={styles.monthlyStatsCard}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.monthlyStatsGrid}>
          <View style={styles.monthlyStatItem}>
            <Text style={styles.monthlyStatValue}>{statistics.monthly_stats.prayers_posted}</Text>
            <Text style={styles.monthlyStatLabel}>Prayers Posted</Text>
          </View>
          <View style={styles.monthlyStatItem}>
            <Text style={styles.monthlyStatValue}>{statistics.monthly_stats.prayers_received}</Text>
            <Text style={styles.monthlyStatLabel}>Prayers Received</Text>
          </View>
          <View style={styles.monthlyStatItem}>
            <Text style={styles.monthlyStatValue}>{statistics.monthly_stats.interactions_given}</Text>
            <Text style={styles.monthlyStatLabel}>Interactions Given</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWeeklyActivity = () => {
    if (!statistics) return null;

    const maxActivity = Math.max(
      ...statistics.weekly_activity.map(day => day.prayers_posted + day.interactions)
    );

    return (
      <View style={styles.weeklyActivityCard}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <View style={styles.weeklyChart}>
          {statistics.weekly_activity.map((day, index) => {
            const totalActivity = day.prayers_posted + day.interactions;
            const height = maxActivity > 0 ? (totalActivity / maxActivity) * 100 : 0;
            
            return (
              <View key={index} style={styles.weeklyBar}>
                <View style={styles.weeklyBarContainer}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: `${height}%` }
                    ]}
                  />
                </View>
                <Text style={styles.weeklyBarLabel}>{day.day}</Text>
                <Text style={styles.weeklyBarValue}>{totalActivity}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTopCategories = () => {
    if (!statistics) return null;

    return (
      <View style={styles.categoriesCard}>
        <Text style={styles.sectionTitle}>Top Prayer Categories</Text>
        <View style={styles.categoriesList}>
          {statistics.top_categories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryCount}>{category.count} prayers</Text>
              </View>
              <View style={styles.categoryProgress}>
                <View
                  style={[
                    styles.categoryProgressBar,
                    {
                      width: `${(category.count / statistics.top_categories[0].count) * 100}%`
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAccountInfo = () => {
    if (!statistics) return null;

    return (
      <View style={styles.accountInfoCard}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.accountInfoList}>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountInfoLabel}>Member Since</Text>
            <Text style={styles.accountInfoValue}>
              {formatDistanceToNow(new Date(statistics.joined_date), { addSuffix: true })}
            </Text>
          </View>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountInfoLabel}>Followers</Text>
            <Text style={styles.accountInfoValue}>{statistics.followers_count}</Text>
          </View>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountInfoLabel}>Following</Text>
            <Text style={styles.accountInfoValue}>{statistics.following_count}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!statistics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="bar-chart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>No Data Available</Text>
          <Text style={styles.errorText}>Unable to load your statistics</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#5B21B6']}
            tintColor="#5B21B6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderOverviewCards()}
        {renderStreakCard()}
        {renderMonthlyStats()}
        {renderWeeklyActivity()}
        {renderTopCategories()}
        {renderAccountInfo()}
        
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
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
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overviewContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: (width - 72) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  streakContent: {
    alignItems: 'center',
  },
  currentStreak: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  longestStreak: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  monthlyStatsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  monthlyStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthlyStatItem: {
    alignItems: 'center',
  },
  monthlyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5B21B6',
    marginBottom: 4,
  },
  monthlyStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  weeklyActivityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  weeklyBar: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBarContainer: {
    height: 80,
    width: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  weeklyBarFill: {
    backgroundColor: '#5B21B6',
    borderRadius: 10,
    minHeight: 4,
  },
  weeklyBarLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  weeklyBarValue: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  categoriesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryProgress: {
    width: 60,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  categoryProgressBar: {
    height: 4,
    backgroundColor: '#5B21B6',
    borderRadius: 2,
  },
  accountInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  accountInfoList: {
    gap: 12,
  },
  accountInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  accountInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default StatisticsScreen;
