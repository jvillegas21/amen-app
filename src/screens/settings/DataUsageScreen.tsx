import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';

interface DataUsageSettings {
  autoDownloadImages: boolean;
  useWiFiOnly: boolean;
  reduceDataUsage: boolean;
  cacheSize: number;
  clearCache: boolean;
}

export default function DataUsageScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState<DataUsageSettings>({
    autoDownloadImages: true,
    useWiFiOnly: false,
    reduceDataUsage: false,
    cacheSize: 0,
    clearCache: false,
  });

  useEffect(() => {
    // TODO: Load settings from storage
    loadDataUsageSettings();
  }, []);

  const loadDataUsageSettings = async () => {
    // TODO: Implement loading from AsyncStorage
    setSettings(prev => ({
      ...prev,
      cacheSize: 125, // MB
    }));
  };

  const handleSettingChange = (key: keyof DataUsageSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data including images and offline content. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            setSettings(prev => ({
              ...prev,
              cacheSize: 0,
            }));
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const formatCacheSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Data Usage</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Manage your data usage
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
          Control how the app uses your data and storage
        </Text>

        {/* Data Usage Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
            Data Usage
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: theme.colors.text }]}>
                    Auto-download Images
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Automatically download images in prayers and groups
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.autoDownloadImages}
                onValueChange={(value) => handleSettingChange('autoDownloadImages', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.autoDownloadImages ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="wifi-outline" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: theme.colors.text }]}>
                    Wi-Fi Only Downloads
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Only download content when connected to Wi-Fi
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.useWiFiOnly}
                onValueChange={(value) => handleSettingChange('useWiFiOnly', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.useWiFiOnly ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="speedometer-outline" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: theme.colors.text }]}>
                    Reduce Data Usage
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Compress images and reduce data usage
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.reduceDataUsage}
                onValueChange={(value) => handleSettingChange('reduceDataUsage', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.reduceDataUsage ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Storage Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
            Storage
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="folder-outline" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: theme.colors.text }]}>
                    Cache Size
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Currently using {formatCacheSize(settings.cacheSize)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: theme.colors.error }]}
                onPress={handleClearCache}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Data Usage Info */}
        <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            These settings help you control how much data the app uses. Reducing data usage may affect image quality and loading speed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
});