import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { locationService } from '@/services/api/locationService';

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [settings, setSettings] = useState({
    shareLocation: false,
    granularity: 'city' as 'exact' | 'city' | 'region' | 'country' | 'hidden',
    allowNearbyDiscovery: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationAvailable, setLocationAvailable] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadSettings();
    }
  }, [profile?.id]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Check if location services are available
      const isAvailable = await locationService.isLocationAvailable();
      setLocationAvailable(isAvailable);
      
      // Load user's location preferences
      const preferences = await locationService.getLocationPreference(profile!.id);
      if (preferences) {
        setSettings({
          shareLocation: preferences.shareLocation,
          granularity: preferences.granularity,
          allowNearbyDiscovery: preferences.allowNearbyDiscovery,
        });
      }
    } catch (error) {
      console.error('Error loading location settings:', error);
      Alert.alert('Error', 'Failed to load location settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      await locationService.updateLocationPreference(profile.id, {
        shareLocation: newSettings.shareLocation,
        granularity: newSettings.granularity,
        allowNearbyDiscovery: newSettings.allowNearbyDiscovery,
      });
    } catch (error) {
      console.error('Error updating location settings:', error);
      Alert.alert('Error', 'Failed to update location settings');
      // Revert the change
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestLocationPermission = async () => {
    try {
      const hasPermission = await locationService.requestLocationPermissions();
      if (hasPermission) {
        setLocationAvailable(true);
        Alert.alert('Success', 'Location access granted');
      } else {
        Alert.alert(
          'Permission Denied',
          'Location access is required for location-based features. You can enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // TODO: Open app settings
            }},
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const getGranularityDescription = (granularity: string) => {
    switch (granularity) {
      case 'exact':
        return 'Share your exact location';
      case 'city':
        return 'Share your city only';
      case 'region':
        return 'Share your region/state only';
      case 'country':
        return 'Share your country only';
      case 'hidden':
        return 'Hide your location completely';
      default:
        return '';
    }
  };

  const granularityOptions = [
    { id: 'exact', name: 'Exact Location', icon: 'location' },
    { id: 'city', name: 'City', icon: 'business' },
    { id: 'region', name: 'Region', icon: 'map' },
    { id: 'country', name: 'Country', icon: 'globe' },
    { id: 'hidden', name: 'Hidden', icon: 'eye-off' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Location Settings</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading location settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Location Privacy</Text>
        <Text style={styles.sectionDescription}>
          Control how your location is shared and used in the app
        </Text>

        {/* Location Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Location Access</Text>
          
          <View style={[styles.settingItem, { backgroundColor: locationAvailable ? '#F0FDF4' : '#FEF2F2' }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={locationAvailable ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={locationAvailable ? "theme.colors.success[700]" : "theme.colors.error[700]"} 
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>
                    {locationAvailable ? 'Location Access Granted' : 'Location Access Required'}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {locationAvailable 
                      ? 'Location services are enabled' 
                      : 'Enable location access to use location-based features'
                    }
                  </Text>
                </View>
              </View>
              {!locationAvailable && (
                <TouchableOpacity
                  style={styles.enableButton}
                  onPress={handleRequestLocationPermission}
                >
                  <Text style={styles.enableButtonText}>Enable</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Location Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Location Sharing</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="location-outline" size={24} color="#5B21B6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>Share Location</Text>
                  <Text style={styles.settingDescription}>
                    Allow your location to be included with prayers
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.shareLocation}
                onValueChange={(value) => handleSettingChange('shareLocation', value)}
                trackColor={{ false: '#E5E5E7', true: '#5B21B6' }}
                thumbColor={settings.shareLocation ? '#FFFFFF' : '#FFFFFF'}
                disabled={!locationAvailable || saving}
              />
            </View>
          </View>
        </View>

        {/* Location Granularity */}
        {settings.shareLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Location Detail Level</Text>
            <Text style={styles.sectionDescription}>
              Choose how much location detail to share
            </Text>
            
            {granularityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.granularityOption,
                  settings.granularity === option.id && styles.granularityOptionSelected,
                ]}
                onPress={() => handleSettingChange('granularity', option.id)}
                disabled={saving}
              >
                <View style={styles.granularityContent}>
                  <View style={styles.granularityLeft}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={settings.granularity === option.id ? '#5B21B6' : '#666'} 
                    />
                    <View style={styles.granularityText}>
                      <Text style={[
                        styles.granularityName,
                        settings.granularity === option.id && styles.granularityNameSelected,
                      ]}>
                        {option.name}
                      </Text>
                      <Text style={styles.granularityDescription}>
                        {getGranularityDescription(option.id)}
                      </Text>
                    </View>
                  </View>
                  
                  {settings.granularity === option.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#5B21B6" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Nearby Discovery */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Discovery</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="people-outline" size={24} color="#5B21B6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>Allow Nearby Discovery</Text>
                  <Text style={styles.settingDescription}>
                    Let others find your prayers based on location
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.allowNearbyDiscovery}
                onValueChange={(value) => handleSettingChange('allowNearbyDiscovery', value)}
                trackColor={{ false: '#E5E5E7', true: '#5B21B6' }}
                thumbColor={settings.allowNearbyDiscovery ? '#FFFFFF' : '#FFFFFF'}
                disabled={!locationAvailable || saving}
              />
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Your location data is encrypted and stored securely. You can change these settings at any time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  settingItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#5B21B6',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  granularityOption: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
  },
  granularityOptionSelected: {
    borderColor: '#5B21B6',
    backgroundColor: '#F3F4F6',
  },
  granularityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  granularityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  granularityText: {
    marginLeft: 16,
    flex: 1,
  },
  granularityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  granularityNameSelected: {
    color: '#5B21B6',
  },
  granularityDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
});