/**
 * Notification Settings Screen - Manage notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useNotifications } from '@/hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import notificationService from '@/services/notifications/notificationService';
import { useAuthStore } from '@/store/auth/authStore';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface NotificationSettings {
  pushNotifications: boolean;
  prayerInteractions: boolean;
  prayerComments: boolean;
  prayerAnswered: boolean;
  prayerReminders: boolean;
  weeklySummary: boolean;
  groupInvites: boolean;
  groupUpdates: boolean;
  friendRequests: boolean;
  newFollowers: boolean;
  directMessages: boolean;
  systemUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushNotifications: true,
  prayerInteractions: true,
  prayerComments: true,
  prayerAnswered: true,
  prayerReminders: true,
  weeklySummary: true,
  groupInvites: true,
  groupUpdates: true,
  friendRequests: true,
  newFollowers: true,
  directMessages: true,
  systemUpdates: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

interface NotificationSettingsScreenProps extends MainStackScreenProps<'NotificationSettings'> { }

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const { updateSettings, hasPermission, requestPermissions, error, clearError } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await notificationService.getNotificationSettings(useAuthStore.getState().user?.id || '');
      // Ensure settings match the interface
      const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
      setLocalSettings(mergedSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      // Fallback to default settings
      setLocalSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (key: keyof NotificationSettings) => {
    if (!localSettings) return;

    try {
      const newSettings = {
        ...localSettings,
        [key]: !localSettings[key],
      };
      setLocalSettings(newSettings);
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Revert change
      setLocalSettings(localSettings);
    }
  };

  const handleQuietHoursToggle = async (value: boolean) => {
    if (!localSettings) return;

    try {
      const newSettings = {
        ...localSettings,
        quietHours: {
          ...localSettings.quietHours,
          enabled: value,
        },
      };
      setLocalSettings(newSettings);
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
      Alert.alert('Error', 'Failed to update quiet hours');
      setLocalSettings(localSettings);
    }
  };

  const handleTimeChange = async (type: 'start' | 'end', time: Date) => {
    if (!localSettings) return;

    try {
      const timeString = time.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const newSettings = {
        ...localSettings,
        quietHours: {
          ...localSettings.quietHours,
          [type]: timeString,
        },
      };
      setLocalSettings(newSettings);
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update time:', error);
      Alert.alert('Error', 'Failed to update time');
      setLocalSettings(localSettings);
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings to receive prayer updates and notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notifications</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderSettingItem = (
    label: string,
    description: string,
    key: keyof NotificationSettings,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.settingLabelContainer}>
          <Ionicons name={icon} size={20} color={theme.colors.primary[600]} style={styles.settingIcon} />
          <Text style={styles.settingLabel}>{label}</Text>
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={localSettings ? !!localSettings[key] : false}
        onValueChange={() => handleToggleSetting(key)}
        trackColor={{ false: '#E5E7EB', true: theme.colors.primary[600] }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const renderQuietHoursSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quiet Hours</Text>
      <View style={styles.card}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon-outline" size={20} color={theme.colors.primary[600]} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
            </View>
            <Text style={styles.settingDescription}>
              Mute notifications during specific times
            </Text>
          </View>
          <Switch
            value={localSettings?.quietHours.enabled || false}
            onValueChange={handleQuietHoursToggle}
            trackColor={{ false: '#E5E7EB', true: theme.colors.primary[600] }}
            thumbColor="#FFFFFF"
          />
        </View>

        {localSettings?.quietHours.enabled && (
          <>
            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <DateTimePicker
                value={new Date(`2000-01-01T${localSettings?.quietHours.start || '22:00'}:00`)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  if (date) handleTimeChange('start', date);
                }}
              />
            </View>

            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>End Time</Text>
              <DateTimePicker
                value={new Date(`2000-01-01T${localSettings?.quietHours.end || '08:00'}:00`)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  if (date) handleTimeChange('end', date);
                }}
              />
            </View>
          </>
        )}

        {localSettings?.quietHours.enabled && (
          <View style={styles.quietHoursInfo}>
            <Text style={styles.quietHoursText}>
              Quiet hours: {localSettings.quietHours.start} - {localSettings.quietHours.end}
            </Text>
            <Text style={styles.quietHoursNote}>
              Notifications received during this time will be silenced
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.permissionContainer}>
          <Ionicons name="notifications-off" size={64} color={theme.colors.text.secondary} />
          <Text style={styles.permissionTitle}>Notifications Disabled</Text>
          <Text style={styles.permissionText}>
            Enable notifications to receive updates about prayers, comments, and other activities.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermissions}
          >
            <Text style={styles.permissionButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color={theme.colors.error[500]} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Notifications</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'Prayer Reminders',
              'Get reminded to pray for your saved prayers',
              'prayerReminders',
              'alarm-outline'
            )}
            {renderSettingItem(
              'Prayer Interactions',
              'When someone prays for you',
              'prayerInteractions',
              'heart-outline'
            )}
            {renderSettingItem(
              'Prayer Comments',
              'When someone comments on your prayer',
              'prayerComments',
              'chatbubble-outline'
            )}
            {renderSettingItem(
              'Prayer Answered',
              'When a prayer you follow is answered',
              'prayerAnswered',
              'checkmark-circle-outline'
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'Group Invites',
              'When you are invited to a group',
              'groupInvites',
              'people-outline'
            )}
            {renderSettingItem(
              'Group Updates',
              'New posts and updates in your groups',
              'groupUpdates',
              'newspaper-outline'
            )}
            {renderSettingItem(
              'Friend Requests',
              'When someone sends you a friend request',
              'friendRequests',
              'person-add-outline'
            )}
            {renderSettingItem(
              'New Followers',
              'When someone starts following you',
              'newFollowers',
              'person-outline'
            )}
            {renderSettingItem(
              'Direct Messages',
              'When you receive a new message',
              'directMessages',
              'mail-outline'
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Updates</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'Weekly Summary',
              'Weekly digest of your prayer activity',
              'weeklySummary',
              'calendar-outline'
            )}
            {renderSettingItem(
              'System Updates',
              'Important updates about the app',
              'systemUpdates',
              'information-circle-outline'
            )}
          </View>
        </View>

        {renderQuietHoursSection()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Push notifications are sent to this device. You can also manage notification permissions in your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  backButton: {
    padding: theme.spacing[2],
  },
  headerTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[3],
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  permissionTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  permissionText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  permissionButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  permissionButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.error[50],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing[4],
    opacity: 1,
  },
  errorText: {
    ...theme.typography.body.small,
    color: theme.colors.error[600],
    flex: 1,
  },
  section: {
    marginTop: theme.spacing[6],
  },
  sectionTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing[4],
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  settingIcon: {
    marginRight: theme.spacing[2],
  },
  settingLabel: {
    ...theme.typography.body.large,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  settingDescription: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  quietHoursInfo: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.tertiary,
  },
  quietHoursText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  quietHoursNote: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    fontStyle: 'italic',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[4],
  },
  timeLabel: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
  },
  footer: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[8],
  },
  footerText: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});

export default NotificationSettingsScreen;