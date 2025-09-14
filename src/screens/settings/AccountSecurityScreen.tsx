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
import * as LocalAuthentication from 'expo-local-authentication';

interface SecuritySettings {
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  session_timeout: number; // in minutes
  login_notifications: boolean;
  suspicious_activity_alerts: boolean;
}

/**
 * Account Security Screen - Manage account security settings
 */
const AccountSecurityScreen: React.FC<RootStackScreenProps<'AccountSecurity'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    fetchSecuritySettings();
    checkBiometricAvailability();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement security settings fetch from API
      // For now, using mock data
      const mockSettings: SecuritySettings = {
        two_factor_enabled: false,
        biometric_enabled: false,
        session_timeout: 30,
        login_notifications: true,
        suspicious_activity_alerts: true,
      };
      setSecuritySettings(mockSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const handleToggleSetting = async (setting: keyof SecuritySettings, value: boolean | number) => {
    try {
      setIsSaving(true);
      // TODO: Implement security settings update API call
      setSecuritySettings(prev => prev ? {
        ...prev,
        [setting]: value,
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update security setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableBiometric = async () => {
    try {
      if (!biometricAvailable) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication for Amenity',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        await handleToggleSetting('biometric_enabled', true);
        Alert.alert('Success', 'Biometric authentication enabled');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Failed to enable biometric authentication');
    }
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Disable Biometric Authentication',
      'Are you sure you want to disable biometric authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => handleToggleSetting('biometric_enabled', false),
        },
      ]
    );
  };

  const handleEnableTwoFactor = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Two-factor authentication will be implemented in a future update. This will add an extra layer of security to your account.',
      [{ text: 'OK' }]
    );
  };

  const renderToggleSetting = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    disabled?: boolean
  ) => (
    <View style={styles.toggleItem}>
      <View style={styles.toggleItemLeft}>
        <View style={styles.settingsIconContainer}>
          <Ionicons name={icon as any} size={24} color="#5B21B6" />
        </View>
        <View style={styles.toggleItemText}>
          <Text style={[styles.toggleItemTitle, disabled && styles.disabledText]}>{title}</Text>
          <Text style={[styles.toggleItemSubtitle, disabled && styles.disabledText]}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#5B21B6' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        disabled={disabled}
      />
    </View>
  );

  const renderBiometricSetting = () => {
    if (!securitySettings) return null;

    return (
      <View style={styles.toggleItem}>
        <View style={styles.toggleItemLeft}>
          <View style={styles.settingsIconContainer}>
            <Ionicons name="finger-print" size={24} color="#5B21B6" />
          </View>
          <View style={styles.toggleItemText}>
            <Text style={styles.toggleItemTitle}>Biometric Authentication</Text>
            <Text style={styles.toggleItemSubtitle}>
              {biometricAvailable 
                ? 'Use fingerprint or face recognition to sign in'
                : 'Not available on this device'
              }
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.biometricButton,
            securitySettings.biometric_enabled ? styles.biometricButtonEnabled : styles.biometricButtonDisabled
          ]}
          onPress={securitySettings.biometric_enabled ? handleDisableBiometric : handleEnableBiometric}
          disabled={!biometricAvailable}
        >
          <Text style={[
            styles.biometricButtonText,
            securitySettings.biometric_enabled ? styles.biometricButtonTextEnabled : styles.biometricButtonTextDisabled
          ]}>
            {securitySettings.biometric_enabled ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSecurityInfo = () => (
    <View style={styles.securityInfo}>
      <View style={styles.securityInfoContent}>
        <Ionicons name="shield-checkmark" size={24} color="theme.colors.success[700]" />
        <Text style={styles.securityInfoTitle}>Secure Your Account</Text>
        <Text style={styles.securityInfoText}>
          These security features help protect your account from unauthorized access. 
          We recommend enabling multiple security layers for maximum protection.
        </Text>
      </View>
    </View>
  );

  const renderAuthenticationSection = () => {
    if (!securitySettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        <View style={styles.sectionContent}>
          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <View style={styles.settingsIconContainer}>
                <Ionicons name="shield-outline" size={24} color="#5B21B6" />
              </View>
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Two-Factor Authentication</Text>
                <Text style={styles.toggleItemSubtitle}>Add an extra layer of security</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.twoFactorButton}
              onPress={handleEnableTwoFactor}
            >
              <Text style={styles.twoFactorButtonText}>Setup</Text>
            </TouchableOpacity>
          </View>
          {renderBiometricSetting()}
        </View>
      </View>
    );
  };

  const renderSessionSection = () => {
    if (!securitySettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Management</Text>
        <View style={styles.sectionContent}>
          {renderToggleSetting(
            'Login Notifications',
            'Get notified when someone signs into your account',
            'notifications-outline',
            securitySettings.login_notifications,
            (value) => handleToggleSetting('login_notifications', value)
          )}
          {renderToggleSetting(
            'Suspicious Activity Alerts',
            'Get alerts for unusual account activity',
            'warning-outline',
            securitySettings.suspicious_activity_alerts,
            (value) => handleToggleSetting('suspicious_activity_alerts', value)
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading security settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSecurityInfo()}
        {renderAuthenticationSection()}
        {renderSessionSection()}
        
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
  securityInfo: {
    backgroundColor: '#F0FDF4',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityInfoContent: {
    alignItems: 'center',
  },
  securityInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginTop: 8,
    marginBottom: 8,
  },
  securityInfoText: {
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
  disabledText: {
    color: '#9CA3AF',
  },
  biometricButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  biometricButtonEnabled: {
    backgroundColor: '#FEF2F2',
  },
  biometricButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  biometricButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  biometricButtonTextEnabled: {
    color: 'theme.colors.error[700]',
  },
  biometricButtonTextDisabled: {
    color: '#5B21B6',
  },
  twoFactorButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  twoFactorButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AccountSecurityScreen;