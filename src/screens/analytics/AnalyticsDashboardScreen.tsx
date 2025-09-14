import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { analyticsService, UserAnalytics } from '@/services/api/analyticsService';

export default function AnalyticsDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchAnalytics();
    }
  }, [profile?.id]);

  const fetchAnalytics = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const [userAnalytics, engagementData] = await Promise.all([
        analyticsService.getUserAnalytics(profile.id),
        analyticsService.getUserEngagementMetrics(profile.id),
      ]);

      setAnalytics(userAnalytics);
      setEngagementMetrics(engagementData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const renderEngagementChart = () => {
    if (!engagementMetrics) return null;

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Prayer Activity</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartBar}>
            <View style={[styles.chartBarFill, { height: `${(engagementMetrics.daily_prayers / 10) * 100}%` }]} />
            <Text style={styles.chartBarLabel}>Daily</Text>
            <Text style={styles.chartBarValue}>{engagementMetrics.daily_prayers}</Text>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.chartBarFill, { height: `${(engagementMetrics.weekly_prayers / 20) * 100}%` }]} />
            <Text style={styles.chartBarLabel}>Weekly</Text>
            <Text style={styles.chartBarValue}>{engagementMetrics.weekly_prayers}</Text>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.chartBarFill, { height: `${(engagementMetrics.monthly_prayers / 50) * 100}%` }]} />
            <Text style={styles.chartBarLabel}>Monthly</Text>
            <Text style={styles.chartBarValue}>{engagementMetrics.monthly_prayers}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActivityInsights = () => {
    if (!engagementMetrics) return null;

    const insights = [];
    
    if (engagementMetrics.most_active_hour >= 6 && engagementMetrics.most_active_hour < 12) {
      insights.push('You\'re most active in the morning');
    } else if (engagementMetrics.most_active_hour >= 12 && engagementMetrics.most_active_hour < 18) {
      insights.push('You\'re most active in the afternoon');
    } else if (engagementMetrics.most_active_hour >= 18 && engagementMetrics.most_active_hour < 22) {
      insights.push('You\'re most active in the evening');
    } else {
      insights.push('You\'re most active at night');
    }

    if (engagementMetrics.daily_prayers > 0) {
      insights.push('You\'ve been consistent with daily prayers');
    }

    if (engagementMetrics.total_interactions > 50) {
      insights.push('You\'re very engaged with the community');
    }

    return (
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>Activity Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Ionicons name="bulb" size={16} color="theme.colors.warning[700]" />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#5B21B6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Your Activity Overview</Text>
        <Text style={styles.sectionDescription}>
          Track your prayer journey and community engagement
        </Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Prayers',
            analytics?.total_prayers || 0,
            'heart',
            'theme.colors.error[700]'
          )}
          {renderStatCard(
            'Total Comments',
            analytics?.total_comments || 0,
            'chatbubble',
            '#3B82F6'
          )}
          {renderStatCard(
            'Total Shares',
            analytics?.total_shares || 0,
            'share',
            'theme.colors.success[700]'
          )}
          {renderStatCard(
            'Groups Joined',
            analytics?.total_groups_joined || 0,
            'people',
            '#8B5CF6'
          )}
        </View>

        {/* Engagement Chart */}
        {renderEngagementChart()}

        {/* Activity Insights */}
        {renderActivityInsights()}

        {/* Additional Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Additional Metrics</Text>
          <View style={styles.metricsList}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Average Session Duration</Text>
              <Text style={styles.metricValue}>
                {engagementMetrics?.average_session_duration 
                  ? `${Math.round(engagementMetrics.average_session_duration / 60)} min`
                  : '0 min'
                }
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Interactions</Text>
              <Text style={styles.metricValue}>{engagementMetrics?.total_interactions || 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Bible Studies Viewed</Text>
              <Text style={styles.metricValue}>{analytics?.total_bible_studies_viewed || 0}</Text>
            </View>
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.helpText}>
            Analytics help you understand your prayer journey and community engagement. Data is updated in real-time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
  placeholder: {
    width: 40,
  },
  refreshButton: {
    padding: 8,
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarFill: {
    width: 30,
    backgroundColor: '#5B21B6',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chartBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  metricsList: {
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  helpContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
});