import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

/**
 * Notification Permission Screen - Request notification access
 * Based on welcome_onboarding mockups
 */
const NotificationPermissionScreen: React.FC<AuthStackScreenProps<'NotificationPermission'>> = ({ navigation }) => {
  const { updateProfile, completeOnboarding, isLoading } = useAuthStore();
  
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  const handleAllowNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionStatus('granted');
        await updateProfile({
          push_notifications: true,
        });
        
        // Continue to complete onboarding
        setTimeout(async () => {
          await completeOnboarding();
        }, 1000);
      } else {
        setPermissionStatus('denied');
        await updateProfile({
          push_notifications: false,
        });
        
        Alert.alert(
          'Notifications Disabled',
          'You can still use the app, but you won\'t receive prayer updates. You can change this in settings later.',
          [
            { text: 'Continue', onPress: async () => await completeOnboarding() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permission');
    }
  };

  const handleSkip = async () => {
    await updateProfile({
      push_notifications: false,
    });
    await completeOnboarding();
  };

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Ionicons name="checkmark-circle" size={64} color="#10B981" />;
      case 'denied':
        return <Ionicons name="close-circle" size={64} color="#EF4444" />;
      default:
        return <Ionicons name="notifications" size={64} color="#5B21B6" />;
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications enabled!';
      case 'denied':
        return 'Notifications disabled';
      default:
        return 'Stay Connected';
    }
  };

  const getStatusSubtext = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'You\'ll receive updates when people pray for you';
      case 'denied':
        return 'You can still use the app, but won\'t receive prayer updates';
      default:
        return 'Get notified when people pray for you and when your prayers are answered';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Stay Connected</Text>
          <Text style={styles.subtitle}>
            Get notified when your prayers are answered and when others pray for you
          </Text>
        </View>

        {/* Icon and Status */}
        <View style={styles.statusContainer}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>
          <Text style={styles.statusTitle}>{getStatusText()}</Text>
          <Text style={styles.statusSubtext}>{getStatusSubtext()}</Text>
        </View>

        {/* Benefits List */}
        {permissionStatus === 'idle' && (
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="heart" size={24} color="#5B21B6" />
              <Text style={styles.benefitText}>Know when someone prays for you</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color="#5B21B6" />
              <Text style={styles.benefitText}>Get updates on answered prayers</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="people" size={24} color="#5B21B6" />
              <Text style={styles.benefitText}>Stay connected with your community</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {permissionStatus === 'idle' && (
            <>
              <TouchableOpacity
                style={[styles.allowButton, isLoading && styles.allowButtonDisabled]}
                onPress={handleAllowNotifications}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.allowButtonText}>Enable Notifications</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={isLoading}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}

          {(permissionStatus === 'granted' || permissionStatus === 'denied') && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={async () => await completeOnboarding()}
            >
              <Text style={styles.continueButtonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyContainer}>
          <Ionicons name="settings" size={16} color="#6B7280" />
          <Text style={styles.privacyText}>
            You can customize notification preferences anytime in your settings.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  allowButton: {
    height: 56,
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  allowButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    height: 56,
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default NotificationPermissionScreen;
