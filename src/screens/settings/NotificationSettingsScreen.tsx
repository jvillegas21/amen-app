/**
 * Notification Settings Screen - Manage notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSettings } from '@/services/notifications/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface NotificationSettingsScreenProps extends RootStackScreenProps<'NotificationSettings'> {}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const {
    isInitialized,
    hasPermission,
    settings,
    isLoadingSettings,
    requestPermissions,
    updateSettings,
    sendTestNotification,
    error,
    clearError,
  } = useNotifications();

  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    if (!localSettings) return;

    if (key === 'quietHours') {
      // Toggle quiet hours enabled
      setLocalSettings({
        ...localSettings,
        quietHours: {
          ...localSettings.quietHours,
          enabled: !localSettings.quietHours.enabled,
        },
      });
    } else {
      // Toggle boolean setting
      setLocalSettings({
        ...localSettings,
        [key]: !localSettings[key],
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      Alert.alert('Success', 'Notification settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsSaving(false);
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

  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert('Test Sent', 'A test notification has been sent');
  };

  if (isLoadingSettings) {
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.permissionContainer}>
          <Ionicons name="notifications-off" size={64} color={theme.colors.neutral[400]} />
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestNotification}
        >
          <Ionicons name="notifications" size={24} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      </View>

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
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="heart" size={20} color={theme.colors.primary[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Prayer Interactions</Text>
                <Text style={styles.settingDescription}>
                  When someone prays for your requests
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings?.prayerInteractions ?? false}
              onValueChange={() => handleToggleSetting('prayerInteractions')}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[200] }}
              thumbColor={localSettings?.prayerInteractions ? theme.colors.primary[600] : theme.colors.neutral[500]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="chatbubble" size={20} color={theme.colors.primary[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Prayer Comments</Text>
                <Text style={styles.settingDescription}>
                  When someone comments on your prayers
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings?.prayerComments ?? false}
              onValueChange={() => handleToggleSetting('prayerComments')}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[200] }}
              thumbColor={localSettings?.prayerComments ? theme.colors.primary[600] : theme.colors.neutral[500]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Prayer Answered</Text>
                <Text style={styles.settingDescription}>
                  When your prayers are marked as answered
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings?.prayerAnswered ?? false}
              onValueChange={() => handleToggleSetting('prayerAnswered')}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[200] }}
              thumbColor={localSettings?.prayerAnswered ? theme.colors.primary[600] : theme.colors.neutral[500]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="people" size={20} color={theme.colors.primary[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Group Invites</Text>
                <Text style={styles.settingDescription}>
                  When you're invited to prayer groups
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings?.groupInvites ?? false}
              onValueChange={() => handleToggleSetting('groupInvites')}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[200] }}
              thumbColor={localSettings?.groupInvites ? theme.colors.primary[600] : theme.colors.neutral[500]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="person-add" size={20} color={theme.colors.primary[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Friend Requests</Text>
                <Text style={styles.settingDescription}>
                  When someone sends you a friend request
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings?.friendRequests ?? false}
              onValueChange={() => handleToggleSetting('friendRequests')}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[200] }}
              thumbColor={localSettings?.friendRequests ? theme.colors.primary[600] : theme.colors.neutral[500]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="settings" size={20} color={theme.colors.primary[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>System Updates</Text>
                <Text style={styles.settingDescription}>
                  App updates and important announcements
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings?.systemUpdates ?? false}
              onValueChange={() => handleToggleSetting('systemUpdates')}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[200] }}
              thumbColor={localSettings?.systemUpdates ? theme.colors.primary[600] : theme.colors.neutral[500]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="moon" size={20} color={theme.colors.primary[600]} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  Pause notifications during specified hours
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings?.quietHours.enabled ?? false}
              onValueChange={() => handleToggleSetting('quietHours')}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[200] }}
              thumbColor={localSettings?.quietHours.enabled ? theme.colors.primary[600] : theme.colors.neutral[500]}
            />
          </View>

          {localSettings?.quietHours.enabled && (
            <View style={styles.quietHoursInfo}>
              <Text style={styles.quietHoursText}>
                Quiet hours: {localSettings.quietHours.start} - {localSettings.quietHours.end}
              </Text>
              <Text style={styles.quietHoursNote}>
                You can customize quiet hours in your device settings
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
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
  testButton: {
    padding: theme.spacing[2],
  },
  placeholder: {
    width: 40,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: theme.spacing[3],
    flex: 1,
  },
  settingLabel: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  settingDescription: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  quietHoursInfo: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing[2],
  },
  quietHoursText: {
    ...theme.typography.body.small,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  quietHoursNote: {
    ...theme.typography.caption.small,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  footer: {
    padding: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  saveButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },
});

export default NotificationSettingsScreen;