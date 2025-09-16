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
  TextInput,
  Modal,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import ImagePicker from '@/components/common/ImagePicker';
import { imageUploadService, ImageUploadResult } from '@/services/api/imageUploadService';

interface SettingsData {
  notifications: {
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
  };
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private';
    show_location: boolean;
    allow_following: boolean;
    show_online_status: boolean;
    allow_direct_messages: boolean;
    show_prayer_history: boolean;
    location_granularity: 'hidden' | 'city' | 'precise';
    default_prayer_visibility: 'public' | 'friends' | 'groups' | 'private';
    allow_comments: 'everyone' | 'friends' | 'none';
    allow_sharing: boolean;
  };
  app: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    data_usage: 'wifi_only' | 'always' | 'never';
    auto_backup: boolean;
    haptic_feedback: boolean;
    sound_effects: boolean;
  };
  security: {
    two_factor_enabled: boolean;
    biometric_enabled: boolean;
    session_timeout: number;
    login_notifications: boolean;
    suspicious_activity_alerts: boolean;
  };
  data_sharing: {
    analytics: boolean;
    personalization: boolean;
    research_participation: boolean;
  };
}

interface ProfileData {
  display_name: string;
  bio: string;
  location_city: string;
  avatar_url: string;
}

/**
 * Settings Screen - Main settings hub with categories
 * Based on settings mockups
 */
const SettingsScreen: React.FC<RootStackScreenProps<'Settings'>> = ({ navigation }) => {
  const { profile, signOut, updateProfile } = useAuthStore();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    location_city: '',
    avatar_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (profile) {
      setProfileData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location_city: profile.location_city || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      if (!profile?.id) return;

      // For now, use default settings to avoid service dependency issues
      const defaultSettings: SettingsData = {
        notifications: {
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
        },
        privacy: {
          profile_visibility: 'public',
          show_location: true,
          allow_following: true,
          show_online_status: false,
          allow_direct_messages: true,
          show_prayer_history: true,
          location_granularity: profile?.location_granularity || 'city',
          default_prayer_visibility: 'public',
          allow_comments: 'everyone',
          allow_sharing: true,
        },
        app: {
          theme: 'system',
          language: 'English',
          data_usage: 'wifi_only',
          auto_backup: true,
          haptic_feedback: true,
          sound_effects: true,
        },
        security: {
          two_factor_enabled: false,
          biometric_enabled: false,
          session_timeout: 30,
          login_notifications: true,
          suspicious_activity_alerts: true,
        },
        data_sharing: {
          analytics: true,
          personalization: true,
          research_participation: false,
        },
      };
      
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (category: keyof SettingsData, setting: string, value: boolean) => {
    try {
      if (!profile?.id) return;

      // For now, just update local state
      // TODO: Implement actual API calls to save settings
      setSettings(prev => prev ? {
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: value,
        },
      } : null);
    } catch (error) {
      console.error('Failed to update setting:', error);
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

  const handleProfileInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelected = async (result: ImageUploadResult) => {
    setProfileData(prev => ({
      ...prev,
      avatar_url: result.url,
    }));
  };

  const handleImageRemoved = () => {
    setProfileData(prev => ({
      ...prev,
      avatar_url: '',
    }));
  };

  const handleSaveProfile = async () => {
    if (!profileData.display_name.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    try {
      setSaving(true);
      
      await updateProfile({
        display_name: profileData.display_name.trim(),
        bio: profileData.bio.trim(),
        location_city: profileData.location_city.trim(),
        avatar_url: profileData.avatar_url,
      });

      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
        {renderSettingsSection('Edit Profile', 'person-outline', () => setShowEditProfile(true))}
        {renderSettingsSection('Privacy Settings', 'shield-outline', () => navigation.navigate('Privacy'))}
        {renderSettingsSection('Change Password', 'key-outline', () => navigation.navigate('ChangePassword'))}
        {renderSettingsSection('Account Security', 'lock-closed-outline', () => navigation.navigate('AccountSecurity'))}
        {renderSettingsSection('Data Export', 'download-outline', () => {
          Alert.alert('Coming Soon', 'Data export feature will be available soon');
        })}
        {renderSettingsSection('Delete Account', 'trash-outline', () => {
          Alert.alert('Delete Account', 'This action cannot be undone. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {
              Alert.alert('Coming Soon', 'Account deletion will be available soon');
            }}
          ]);
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
            'Prayer Responses',
            'When someone prays for your requests',
            'chatbubble-outline',
            settings.notifications.prayer_responses,
            (value) => handleToggleSetting('notifications', 'prayer_responses', value)
          )}
          {renderToggleSetting(
            'Group Updates',
            'Updates from your prayer groups',
            'people-outline',
            settings.notifications.group_updates,
            (value) => handleToggleSetting('notifications', 'group_updates', value)
          )}
          {renderToggleSetting(
            'New Followers',
            'When someone follows you',
            'person-add-outline',
            settings.notifications.new_followers,
            (value) => handleToggleSetting('notifications', 'new_followers', value)
          )}
          {renderToggleSetting(
            'Direct Messages',
            'Private messages from other users',
            'mail-outline',
            settings.notifications.direct_messages,
            (value) => handleToggleSetting('notifications', 'direct_messages', value)
          )}
          {renderToggleSetting(
            'Weekly Summary',
            'Weekly prayer activity summary',
            'bar-chart-outline',
            settings.notifications.weekly_summary,
            (value) => handleToggleSetting('notifications', 'weekly_summary', value)
          )}
          {renderToggleSetting(
            'System Updates',
            'App updates and announcements',
            'information-circle-outline',
            settings.notifications.system_updates,
            (value) => handleToggleSetting('notifications', 'system_updates', value)
          )}
          {renderSettingsSection('Notification Settings', 'settings-outline', () => navigation.navigate('NotificationSettings'))}
        </View>
      </View>
    );
  };

  const renderAppSection = () => {
    if (!settings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.sectionContent}>
          {renderSettingsSection('Theme', 'color-palette-outline', () => navigation.navigate('Theme'))}
          {renderSettingsSection('Language', 'language-outline', () => navigation.navigate('Language'))}
          {renderToggleSetting(
            'Haptic Feedback',
            'Vibration feedback for interactions',
            'phone-portrait-outline',
            settings.app.haptic_feedback,
            (value) => handleToggleSetting('app', 'haptic_feedback', value)
          )}
          {renderToggleSetting(
            'Sound Effects',
            'Audio feedback for actions',
            'volume-high-outline',
            settings.app.sound_effects,
            (value) => handleToggleSetting('app', 'sound_effects', value)
          )}
          {renderSettingsSection('Data Usage', 'cellular-outline', () => navigation.navigate('DataUsage'))}
          {renderSettingsSection('Storage & Backup', 'cloud-outline', () => navigation.navigate('StorageBackup'))}
          {renderSettingsSection('Location Settings', 'location-outline', () => navigation.navigate('LocationSettings'))}
        </View>
      </View>
    );
  };

  const renderSecuritySection = () => {
    if (!settings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Two-Factor Authentication',
            'Add extra security to your account',
            'shield-checkmark-outline',
            settings.security.two_factor_enabled,
            (value) => handleToggleSetting('security', 'two_factor_enabled', value)
          )}
          {renderToggleSetting(
            'Biometric Authentication',
            'Use fingerprint or face recognition',
            'finger-print-outline',
            settings.security.biometric_enabled,
            (value) => handleToggleSetting('security', 'biometric_enabled', value)
          )}
          {renderToggleSetting(
            'Login Notifications',
            'Get notified of new sign-ins',
            'notifications-outline',
            settings.security.login_notifications,
            (value) => handleToggleSetting('security', 'login_notifications', value)
          )}
          {renderToggleSetting(
            'Suspicious Activity Alerts',
            'Alerts for unusual account activity',
            'warning-outline',
            settings.security.suspicious_activity_alerts,
            (value) => handleToggleSetting('security', 'suspicious_activity_alerts', value)
          )}
          {renderSettingsSection('Active Sessions', 'desktop-outline', () => {
            Alert.alert('Coming Soon', 'Session management will be available soon');
          })}
        </View>
      </View>
    );
  };

  const renderDataSharingSection = () => {
    if (!settings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Analytics',
            'Help improve the app with usage data',
            'analytics-outline',
            settings.data_sharing.analytics,
            (value) => handleToggleSetting('data_sharing', 'analytics', value)
          )}
          {renderToggleSetting(
            'Personalization',
            'Personalized content and recommendations',
            'person-circle-outline',
            settings.data_sharing.personalization,
            (value) => handleToggleSetting('data_sharing', 'personalization', value)
          )}
          {renderToggleSetting(
            'Research Participation',
            'Help with faith community research',
            'school-outline',
            settings.data_sharing.research_participation,
            (value) => handleToggleSetting('data_sharing', 'research_participation', value)
          )}
          {renderSettingsSection('Data Export', 'download-outline', () => {
            Alert.alert('Coming Soon', 'Data export will be available soon');
          })}
        </View>
      </View>
    );
  };

  const renderSupportSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Support</Text>
      <View style={styles.sectionContent}>
        {renderSettingsSection('Help & FAQ', 'help-circle-outline', () => navigation.navigate('Help'))}
        {renderSettingsSection('Contact Support', 'mail-outline', () => navigation.navigate('SupportTickets'))}
        {renderSettingsSection('Report a Problem', 'bug-outline', () => navigation.navigate('ReportContent'))}
        {renderSettingsSection('Blocked Users', 'person-remove-outline', () => navigation.navigate('BlockedUsers'))}
        {renderSettingsSection('Content Filters', 'filter-outline', () => navigation.navigate('ContentFilters'))}
        {renderSettingsSection('Analytics', 'bar-chart-outline', () => navigation.navigate('AnalyticsDashboard'))}
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
      <Ionicons name="log-out-outline" size={20} color="#DC2626" />
      <Text style={styles.signOutButtonText}>Sign Out</Text>
    </TouchableOpacity>
  );

  const renderEditProfileModal = () => (
    <Modal
      visible={showEditProfile}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEditProfile(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={saving}
            style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#5B21B6" />
            ) : (
              <Text style={styles.modalSaveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalSectionTitle}>Profile Information</Text>
          <Text style={styles.modalSectionDescription}>
            Update your profile information and avatar
          </Text>

          {/* Avatar */}
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalInputLabel}>Profile Picture</Text>
            <ImagePicker
              onImageSelected={handleImageSelected}
              onImageRemoved={handleImageRemoved}
              currentImageUrl={profileData.avatar_url}
              type="profile"
              disabled={saving}
            />
          </View>

          {/* Display Name */}
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalInputLabel}>Display Name *</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter your display name"
              value={profileData.display_name}
              onChangeText={(value) => handleProfileInputChange('display_name', value)}
              maxLength={50}
              editable={!saving}
            />
          </View>

          {/* Bio */}
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalInputLabel}>Bio</Text>
            <TextInput
              style={[styles.modalTextInput, styles.modalTextArea]}
              placeholder="Tell us about yourself..."
              value={profileData.bio}
              onChangeText={(value) => handleProfileInputChange('bio', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              editable={!saving}
            />
            <Text style={styles.modalCharacterCount}>
              {profileData.bio.length}/500 characters
            </Text>
          </View>

          {/* Location */}
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalInputLabel}>Location</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="City, Country"
              value={profileData.location_city}
              onChangeText={(value) => handleProfileInputChange('location_city', value)}
              maxLength={100}
              editable={!saving}
            />
          </View>

          {/* Help Text */}
          <View style={styles.modalHelpContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.modalHelpText}>
              Your profile information is visible to other users. Keep it appropriate and respectful.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
        {renderSecuritySection()}
        {renderDataSharingSection()}
        {renderSupportSection()}
        {renderLegalSection()}
        {renderSignOutButton()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      {renderEditProfileModal()}
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
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#5B21B6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#5B21B6',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalSectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  modalTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalCharacterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  modalHelpContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8,
  },
  modalHelpText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default SettingsScreen;
