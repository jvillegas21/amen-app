import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { MainTabScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';

/**
 * Create Screen - Main creation hub for prayers, groups, and other content
 * Implements Single Responsibility Principle: Focused on creation actions
 */
const CreateScreen: React.FC<MainTabScreenProps<'Create'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePrayer = () => {
    navigation.navigate('CreatePrayer', {});
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup', {});
  };

  const handleCreateBibleStudy = () => {
    navigation.navigate('CreateBibleStudy', {});
  };

  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent', {});
  };

  const handleCreatePoll = () => {
    // TODO: Implement prayer poll creation
    Alert.alert('Coming Soon', 'Prayer poll creation will be available soon');
  };

  const handleCreateTestimony = () => {
    // TODO: Implement testimony sharing
    Alert.alert('Coming Soon', 'Testimony sharing will be available soon');
  };

  const renderCreateOption = (
    title: string,
    subtitle: string,
    icon: keyof typeof Ionicons.glyphMap,
    color: string,
    onPress: () => void,
    isAvailable: boolean = true
  ) => (
    <TouchableOpacity
      style={[styles.createOption, !isAvailable && styles.disabledOption]}
      onPress={onPress}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={32} color="#FFFFFF" />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, !isAvailable && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.optionSubtitle, !isAvailable && styles.disabledText]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isAvailable ? "#9CA3AF" : "#D1D5DB"}
      />
    </TouchableOpacity>
  );


  const renderCreateOptions = () => (
    <View style={styles.createOptionsSection}>
      
      {renderCreateOption(
        'Prayer Request',
        'Share a prayer request with the community',
        'heart-outline',
        '#5B21B6',
        handleCreatePrayer
      )}

      {renderCreateOption(
        'Prayer Group',
        'Create a group for focused prayer',
        'people-outline',
        '#059669',
        handleCreateGroup
      )}

      {renderCreateOption(
        'Bible Study',
        'Create a Bible study with AI insights',
        'library-outline',
        '#D97706',
        handleCreateBibleStudy
      )}

      {renderCreateOption(
        'Prayer Event',
        'Schedule a group prayer session',
        'calendar-outline',
        '#DC2626',
        handleCreateEvent
      )}

      {renderCreateOption(
        'Prayer Poll',
        'Create a poll for group decisions',
        'bar-chart-outline',
        '#8B5CF6',
        handleCreatePoll,
        false
      )}

      {renderCreateOption(
        'Share Testimony',
        'Share how God has answered prayers',
        'megaphone-outline',
        '#06B6D4',
        handleCreateTestimony,
        false
      )}
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.recentActivitySection}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.recentActivityCard}>
        <View style={styles.recentActivityIcon}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
        </View>
        <View style={styles.recentActivityContent}>
          <Text style={styles.recentActivityTitle}>No recent activity</Text>
          <Text style={styles.recentActivitySubtitle}>
            Start creating content to see your activity here
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create</Text>
          <Text style={styles.headerSubtitle}>
            Share prayers, create groups, and build community
          </Text>
        </View>

        {/* Create Options */}
        {renderCreateOptions()}

        {/* Recent Activity */}
        {renderRecentActivity()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  headerTitle: {
    ...theme.typography.display.small,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  createOptionsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledOption: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  recentActivitySection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  recentActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recentActivityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentActivityContent: {
    flex: 1,
  },
  recentActivityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  recentActivitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default CreateScreen;