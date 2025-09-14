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
import * as Location from 'expo-location';

/**
 * Location Permission Screen - Request location access for local prayers
 * Based on welcome_onboarding mockups
 */
const LocationPermissionScreen: React.FC<AuthStackScreenProps<'LocationPermission'>> = ({ navigation }) => {
  const { updateProfile, isLoading } = useAuthStore();
  
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  const handleAllowLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionStatus('granted');
        
        // Get current location
        try {
          const location = await Location.getCurrentPositionAsync({});
          await updateProfile({
            location_lat: location.coords.latitude,
            location_lon: location.coords.longitude,
            location_granularity: 'city',
          });
        } catch (locationError) {
          // Location fetch failed, but permission was granted
          console.log('Failed to get current location:', locationError);
        }
        
        // Continue to next screen
        setTimeout(() => {
          navigation.navigate('NotificationPermission');
        }, 1000);
      } else {
        setPermissionStatus('denied');
        Alert.alert(
          'Location Permission Denied',
          'You can still use the app, but you won\'t see local prayers. You can change this in settings later.',
          [
            { text: 'Continue', onPress: () => navigation.navigate('NotificationPermission') }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const handleSkip = () => {
    navigation.navigate('NotificationPermission');
  };

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Ionicons name="checkmark-circle" size={64} color="#10B981" />;
      case 'denied':
        return <Ionicons name="close-circle" size={64} color="#EF4444" />;
      default:
        return <Ionicons name="location" size={64} color="#5B21B6" />;
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Location access granted!';
      case 'denied':
        return 'Location access denied';
      default:
        return 'Enable Location Access';
    }
  };

  const getStatusSubtext = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'You can now see prayers from people in your area';
      case 'denied':
        return 'You can still use the app, but won\'t see local prayers';
      default:
        return 'Find prayers from people in your area and connect with your local community';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Location Access</Text>
          <Text style={styles.subtitle}>
            Help us connect you with your local prayer community
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
              <Ionicons name="people" size={24} color="#5B21B6" />
              <Text style={styles.benefitText}>Connect with local believers</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="location" size={24} color="#5B21B6" />
              <Text style={styles.benefitText}>See prayers from your area</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={24} color="#5B21B6" />
              <Text style={styles.benefitText}>Your exact location is never shared</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {permissionStatus === 'idle' && (
            <>
              <TouchableOpacity
                style={[styles.allowButton, isLoading && styles.allowButtonDisabled]}
                onPress={handleAllowLocation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.allowButtonText}>Allow Location Access</Text>
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
              onPress={() => navigation.navigate('NotificationPermission')}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyContainer}>
          <Ionicons name="lock-closed" size={16} color="#6B7280" />
          <Text style={styles.privacyText}>
            Your location data is encrypted and only used to show you relevant local prayers. 
            You can change this setting anytime.
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

export default LocationPermissionScreen;
