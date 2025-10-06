import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';

interface NotificationSettings {
  push_notifications: boolean;
  prayer_reminders: boolean;
  group_updates: boolean;
  weekly_summary: boolean;
  prayer_responses: boolean;
  new_followers: boolean;
  direct_messages: boolean;
  system_updates: boolean;
  reminder_time: string;
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

/**
 * Notifications Screen - Manage notification preferences
 * Based on notifications mockups
 */
const NotificationsScreen: React.FC<MainStackScreenProps<'Notifications'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement notification settings fetch from API
      // For now, using mock data
      const mockSettings: NotificationSettings = {
        push_notifications: true,
        prayer_reminders: true,
        group_updates: false,
        weekly_summary: true,
        prayer_responses: true,
        new_followers: true,
        direct_messages: true,
        system_updates: false,
        reminder_time: '09:00',
        quiet_hours: {
          enabled: true,
          start_time: '22:00',
          end_time: '08:00',
        },
      };
      setNotificationSettings(mockSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (setting: keyof NotificationSettings, value: boolean | string | any) => {
    try {
      setIsSaving(true);
      // TODO: Implement notification settings update API call
      setNotificationSettings(prev => prev ? {
        ...prev,
        [setting]: value,
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement save notification settings API call
      Alert.alert('Success', 'Notification settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderToggleSetting = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onToggle: (value: boolean) => void
  ) => (
    <View style={styles.toggleItem}>
      <View style={styles.toggleItemLeft}>
        <View style={styles.settingsIconContainer}>
          <Ionicons name={icon as any} size={24} color="#5B21B6" />
        </View>
        <View style={styles.toggleItemText}>
          <Text style={styles.toggleItemTitle}>{title}</Text>
          <Text style={styles.toggleItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#5B21B6' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  const renderPrayerNotificationsSection = () => {
    if (!notificationSettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prayer Notifications</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Prayer Reminders',
            'Daily reminders to pray and share',
            'heart-outline',
            notificationSettings.prayer_reminders,
            (value) => handleToggleSetting('prayer_reminders', value)
          )}
          {renderToggleSetting(
            'Prayer Responses',
            'When someone prays for your requests',
            'hand-left-outline',
            notificationSettings.prayer_responses,
            (value) => handleToggleSetting('prayer_responses', value)
          )}
          {renderToggleSetting(
            'Weekly Summary',
            'Weekly prayer activity summary',
            'bar-chart-outline',
            notificationSettings.weekly_summary,
            (value) => handleToggleSetting('weekly_summary', value)
          )}
        </View>
      </View>
    );
  };

  const renderSocialNotificationsSection = () => {
    if (!notificationSettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Notifications</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'New Followers',
            'When someone follows you',
            'person-add-outline',
            notificationSettings.new_followers,
            (value) => handleToggleSetting('new_followers', value)
          )}
          {renderToggleSetting(
            'Direct Messages',
            'When you receive a message',
            'chatbubble-outline',
            notificationSettings.direct_messages,
            (value) => handleToggleSetting('direct_messages', value)
          )}
          {renderToggleSetting(
            'Group Updates',
            'Updates from your prayer groups',
            'people-outline',
            notificationSettings.group_updates,
            (value) => handleToggleSetting('group_updates', value)
          )}
        </View>
      </View>
    );
  };

  const renderSystemNotificationsSection = () => {
    if (!notificationSettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Notifications</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Push Notifications',
            'Enable all push notifications',
            'notifications-outline',
            notificationSettings.push_notifications,
            (value) => handleToggleSetting('push_notifications', value)
          )}
          {renderToggleSetting(
            'System Updates',
            'App updates and maintenance',
            'construct-outline',
            notificationSettings.system_updates,
            (value) => handleToggleSetting('system_updates', value)
          )}
        </View>
      </View>
    );
  };

  const renderQuietHoursSection = () => {
    if (!notificationSettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Enable Quiet Hours',
            'Pause notifications during set hours',
            'moon-outline',
            notificationSettings.quiet_hours.enabled,
            (value) => handleToggleSetting('quiet_hours', { ...notificationSettings.quiet_hours, enabled: value })
          )}
          {notificationSettings.quiet_hours.enabled && (
            <>
              <TouchableOpacity
                style={styles.timeItem}
                onPress={() => {
                  Alert.alert(
                    'Start Time',
                    'Select quiet hours start time:',
                    [
                      { text: '10:00 PM', onPress: () => handleToggleSetting('quiet_hours', { ...notificationSettings.quiet_hours, start_time: '22:00' }) },
                      { text: '11:00 PM', onPress: () => handleToggleSetting('quiet_hours', { ...notificationSettings.quiet_hours, start_time: '23:00' }) },
                      { text: '12:00 AM', onPress: () => handleToggleSetting('quiet_hours', { ...notificationSettings.quiet_hours, start_time: '00:00' }) },
                    ]
                  );
                }}
              >
                <View style={styles.timeItemLeft}>
                  <Ionicons name="moon" size={24} color="#5B21B6" />
                  <Text style={styles.timeItemTitle}>Start Time</Text>
                </View>
                <Text style={styles.timeItemValue}>{notificationSettings.quiet_hours.start_time}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeItem}
                onPress={() => {
                  Alert.alert(
                    'End Time',
                    'Select quiet hours end time:',
                    [
                      { text: '6:00 AM', onPress: () => handleToggleSetting('quiet_hours', { ...notificationSettings.quiet_hours, end_time: '06:00' }) },
                      { text: '7:00 AM', onPress: () => handleToggleSetting('quiet_hours', { ...notificationSettings.quiet_hours, end_time: '07:00' }) },
                      { text: '8:00 AM', onPress: () => handleToggleSetting('quiet_hours', { ...notificationSettings.quiet_hours, end_time: '08:00' }) },
                    ]
                  );
                }}
              >
                <View style={styles.timeItemLeft}>
                  <Ionicons name="sunny" size={24} color="#5B21B6" />
                  <Text style={styles.timeItemTitle}>End Time</Text>
                </View>
                <Text style={styles.timeItemValue}>{notificationSettings.quiet_hours.end_time}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderNotificationInfo = () => (
    <View style={styles.notificationInfo}>
      <View style={styles.notificationInfoContent}>
        <Ionicons name="notifications" size={24} color="#5B21B6" />
        <Text style={styles.notificationInfoTitle}>Stay Connected</Text>
        <Text style={styles.notificationInfoText}>
          Manage your notification preferences to stay updated with prayer requests, 
          responses, and community activity while maintaining your peace.
        </Text>
      </View>
    </View>
  );

  const renderSaveButton = () => (
    <TouchableOpacity
      style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
      onPress={handleSaveSettings}
      disabled={isSaving}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderNotificationInfo()}
        {renderPrayerNotificationsSection()}
        {renderSocialNotificationsSection()}
        {renderSystemNotificationsSection()}
        {renderQuietHoursSection()}
        {renderSaveButton()}
        
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
  notificationInfo: {
    backgroundColor: '#F0F9FF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  notificationInfoContent: {
    alignItems: 'center',
  },
  notificationInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginTop: 8,
    marginBottom: 8,
  },
  notificationInfoText: {
    fontSize: 14,
    color: '#0369A1',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleItemText: {
    flex: 1,
  },
  toggleItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  toggleItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  timeItemValue: {
    fontSize: 16,
    color: '#5B21B6',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default NotificationsScreen;
