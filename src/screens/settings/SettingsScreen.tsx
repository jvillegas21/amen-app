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
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';

interface SettingsData {
  notifications: {
    push_notifications: boolean;
    prayer_reminders: boolean;
    group_updates: boolean;
    weekly_summary: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private';
    show_location: boolean;
    allow_following: boolean;
    show_online_status: boolean;
  };
  app: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    data_usage: 'wifi_only' | 'always' | 'never';
    auto_backup: boolean;
  };
}

/**
 * Settings Screen - Main settings hub with categories
 * Based on settings mockups
 */
const SettingsScreen: React.FC<RootStackScreenProps<'Settings'>> = ({ navigation }) => {
  const { profile, signOut } = useAuthStore();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement settings fetch from API
      // For now, using mock data
      const mockSettings: SettingsData = {
        notifications: {
          push_notifications: true,
          prayer_reminders: true,
          group_updates: false,
          weekly_summary: true,
        },
        privacy: {
          profile_visibility: 'public',
          show_location: true,
          allow_following: true,
          show_online_status: false,
        },
        app: {
          theme: 'system',
          language: 'English',
          data_usage: 'wifi_only',
          auto_backup: true,
        },
      };
      setSettings(mockSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (category: keyof SettingsData, setting: string, value: boolean) => {
    try {
      // TODO: Implement settings update API call
      setSettings(prev => prev ? {
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: value,
        },
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const renderSettingsSection = (
    title: string,
    icon: string,
    onPress: () => void,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsIconContainer}>
          <Ionicons name={icon as any} size={24} color="#5B21B6" />
        </View>
        <Text style={styles.settingsItemTitle}>{title}</Text>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

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

  const renderAccountSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.sectionContent}>
        {renderSettingsSection('Edit Profile', 'person-outline', () => navigation.navigate('EditProfile'))}
        {renderSettingsSection('Privacy Settings', 'shield-outline', () => navigation.navigate('Privacy'))}
        {renderSettingsSection('Change Password', 'key-outline', () => {
          Alert.alert('Coming Soon', 'Change password feature will be available soon');
        })}
        {renderSettingsSection('Account Security', 'lock-closed-outline', () => {
          Alert.alert('Coming Soon', 'Account security features will be available soon');
        })}
      </View>
    </View>
  );

  const renderNotificationsSection = () => {
    if (!settings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Push Notifications',
            'Receive notifications on your device',
            'notifications-outline',
            settings.notifications.push_notifications,
            (value) => handleToggleSetting('notifications', 'push_notifications', value)
          )}
          {renderToggleSetting(
            'Prayer Reminders',
            'Daily reminders to pray',
            'heart-outline',
            settings.notifications.prayer_reminders,
            (value) => handleToggleSetting('notifications', 'prayer_reminders', value)
          )}
          {renderToggleSetting(
            'Group Updates',
            'Updates from your prayer groups',
            'people-outline',
            settings.notifications.group_updates,
            (value) => handleToggleSetting('notifications', 'group_updates', value)
          )}
          {renderToggleSetting(
            'Weekly Summary',
            'Weekly prayer activity summary',
            'bar-chart-outline',
            settings.notifications.weekly_summary,
            (value) => handleToggleSetting('notifications', 'weekly_summary', value)
          )}
        </View>
      </View>
    );
  };

  const renderAppSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>App Settings</Text>
      <View style={styles.sectionContent}>
        {renderSettingsSection('Theme', 'color-palette-outline', () => {
          Alert.alert('Coming Soon', 'Theme selection will be available soon');
        })}
        {renderSettingsSection('Language', 'language-outline', () => {
          Alert.alert('Coming Soon', 'Language selection will be available soon');
        })}
        {renderSettingsSection('Data Usage', 'cellular-outline', () => {
          Alert.alert('Coming Soon', 'Data usage settings will be available soon');
        })}
        {renderSettingsSection('Storage & Backup', 'cloud-outline', () => {
          Alert.alert('Coming Soon', 'Storage settings will be available soon');
        })}
      </View>
    </View>
  );

  const renderSupportSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Support</Text>
      <View style={styles.sectionContent}>
        {renderSettingsSection('Help & FAQ', 'help-circle-outline', () => navigation.navigate('Help'))}
        {renderSettingsSection('Contact Support', 'mail-outline', () => navigation.navigate('Support'))}
        {renderSettingsSection('Report a Problem', 'bug-outline', () => {
          Alert.alert('Coming Soon', 'Problem reporting will be available soon');
        })}
        {renderSettingsSection('Rate the App', 'star-outline', () => {
          Alert.alert('Coming Soon', 'App rating will be available soon');
        })}
      </View>
    </View>
  );

  const renderLegalSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={styles.sectionContent}>
        {renderSettingsSection('Terms of Service', 'document-text-outline', () => navigation.navigate('TermsOfService'))}
        {renderSettingsSection('Privacy Policy', 'shield-checkmark-outline', () => navigation.navigate('PrivacyPolicy'))}
        {renderSettingsSection('Open Source Licenses', 'code-outline', () => {
          Alert.alert('Coming Soon', 'Open source licenses will be available soon');
        })}
      </View>
    </View>
  );

  const renderAccountInfo = () => (
    <View style={styles.accountInfo}>
      <View style={styles.accountInfoContent}>
        <Text style={styles.accountInfoTitle}>Signed in as</Text>
        <Text style={styles.accountInfoEmail}>{profile?.email}</Text>
        <Text style={styles.accountInfoName}>{profile?.display_name}</Text>
      </View>
    </View>
  );

  const renderSignOutButton = () => (
    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
      <Ionicons name="log-out-outline" size={20} color="#EF4444" />
      <Text style={styles.signOutButtonText}>Sign Out</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderAccountInfo()}
        {renderAccountSection()}
        {renderNotificationsSection()}
        {renderAppSection()}
        {renderSupportSection()}
        {renderLegalSection()}
        {renderSignOutButton()}
        
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
  accountInfo: {
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
  accountInfoContent: {
    alignItems: 'center',
  },
  accountInfoTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  accountInfoEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  accountInfoName: {
    fontSize: 14,
    color: '#6B7280',
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemLeft: {
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
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
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
  toggleItemText: {
    flex: 1,
    marginLeft: 12,
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SettingsScreen;
