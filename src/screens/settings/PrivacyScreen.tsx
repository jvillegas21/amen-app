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

interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  show_location: boolean;
  allow_following: boolean;
  show_online_status: boolean;
  allow_messages: 'everyone' | 'friends' | 'none';
  show_prayer_history: boolean;
  allow_search: boolean;
  data_sharing: boolean;
}

/**
 * Privacy Settings Screen - Manage privacy and visibility settings
 * Based on settings mockups
 */
const PrivacyScreen: React.FC<RootStackScreenProps<'Privacy'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement privacy settings fetch from API
      // For now, using mock data
      const mockSettings: PrivacySettings = {
        profile_visibility: 'public',
        show_location: true,
        allow_following: true,
        show_online_status: false,
        allow_messages: 'friends',
        show_prayer_history: true,
        allow_search: true,
        data_sharing: false,
      };
      setPrivacySettings(mockSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (setting: keyof PrivacySettings, value: boolean | string) => {
    try {
      setIsSaving(true);
      // TODO: Implement privacy settings update API call
      setPrivacySettings(prev => prev ? {
        ...prev,
        [setting]: value,
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement save privacy settings API call
      Alert.alert('Success', 'Privacy settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save privacy settings');
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

  const renderSelectionSetting = (
    title: string,
    subtitle: string,
    icon: string,
    value: string,
    options: Array<{ label: string; value: string }>,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.selectionItem}>
      <View style={styles.selectionItemLeft}>
        <View style={styles.settingsIconContainer}>
          <Ionicons name={icon as any} size={24} color="#5B21B6" />
        </View>
        <View style={styles.selectionItemText}>
          <Text style={styles.selectionItemTitle}>{title}</Text>
          <Text style={styles.selectionItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => {
          Alert.alert(
            title,
            'Select an option:',
            options.map(option => ({
              text: option.label,
              onPress: () => onSelect(option.value),
            }))
          );
        }}
      >
        <Text style={styles.selectionButtonText}>
          {options.find(opt => opt.value === value)?.label || value}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  const renderProfileVisibilitySection = () => {
    if (!privacySettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Visibility</Text>
        <View style={styles.sectionContent}>
          {renderSelectionSetting(
            'Profile Visibility',
            'Who can see your profile',
            'eye-outline',
            privacySettings.profile_visibility,
            [
              { label: 'Public', value: 'public' },
              { label: 'Friends Only', value: 'friends' },
              { label: 'Private', value: 'private' },
            ],
            (value) => handleToggleSetting('profile_visibility', value)
          )}
          {renderToggleSetting(
            'Show Location',
            'Display your location on your profile',
            'location-outline',
            privacySettings.show_location,
            (value) => handleToggleSetting('show_location', value)
          )}
          {renderToggleSetting(
            'Allow Following',
            'Let others follow your prayers',
            'people-outline',
            privacySettings.allow_following,
            (value) => handleToggleSetting('allow_following', value)
          )}
          {renderToggleSetting(
            'Show Online Status',
            'Display when you\'re active',
            'radio-outline',
            privacySettings.show_online_status,
            (value) => handleToggleSetting('show_online_status', value)
          )}
        </View>
      </View>
    );
  };

  const renderCommunicationSection = () => {
    if (!privacySettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communication</Text>
        <View style={styles.sectionContent}>
          {renderSelectionSetting(
            'Allow Messages',
            'Who can send you messages',
            'chatbubble-outline',
            privacySettings.allow_messages,
            [
              { label: 'Everyone', value: 'everyone' },
              { label: 'Friends Only', value: 'friends' },
              { label: 'No One', value: 'none' },
            ],
            (value) => handleToggleSetting('allow_messages', value)
          )}
        </View>
      </View>
    );
  };

  const renderContentSection = () => {
    if (!privacySettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content & Data</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Show Prayer History',
            'Display your past prayers on your profile',
            'time-outline',
            privacySettings.show_prayer_history,
            (value) => handleToggleSetting('show_prayer_history', value)
          )}
          {renderToggleSetting(
            'Allow Search',
            'Let others find you through search',
            'search-outline',
            privacySettings.allow_search,
            (value) => handleToggleSetting('allow_search', value)
          )}
          {renderToggleSetting(
            'Data Sharing',
            'Share anonymous data to improve the app',
            'analytics-outline',
            privacySettings.data_sharing,
            (value) => handleToggleSetting('data_sharing', value)
          )}
        </View>
      </View>
    );
  };

  const renderPrivacyInfo = () => (
    <View style={styles.privacyInfo}>
      <View style={styles.privacyInfoContent}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <Text style={styles.privacyInfoTitle}>Your Privacy Matters</Text>
        <Text style={styles.privacyInfoText}>
          We respect your privacy and give you control over your data. 
          These settings help you manage who can see your information and how it's used.
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
          <Text style={styles.loadingText}>Loading privacy settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPrivacyInfo()}
        {renderProfileVisibilitySection()}
        {renderCommunicationSection()}
        {renderContentSection()}
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
  privacyInfo: {
    backgroundColor: '#F0FDF4',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyInfoContent: {
    alignItems: 'center',
  },
  privacyInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginTop: 8,
    marginBottom: 8,
  },
  privacyInfoText: {
    fontSize: 14,
    color: '#166534',
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
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionItemText: {
    flex: 1,
    marginLeft: 12,
  },
  selectionItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  selectionItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectionButtonText: {
    fontSize: 14,
    color: '#111827',
    marginRight: 4,
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

export default PrivacyScreen;
