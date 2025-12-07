import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/auth/authStore';

export default function DataUsageScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuthStore();

  // ... existing state ...
  const [isExporting, setIsExporting] = useState(false);

  // ... existing useEffect and loadDataUsageSettings ...

  const handleExportData = async () => {
    try {
      setIsExporting(true);

      // Create a JSON object with user data
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          ...profile
        },
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0', // TODO: Get actual version
        // Add more data here as needed (prayers, groups, etc.)
      };

      const fileUri = FileSystem.documentDirectory + 'amen_data_export.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Data'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // ... existing handleSettingChange, handleClearCache, formatCacheSize ...

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Data Usage</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* ... existing sections ... */}

        {/* Data Export Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
            Data Export
          </Text>

          <View style={[styles.settingItem, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.primary }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="download-outline" size={24} color={theme.colors.primary[600]} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: theme.colors.text.primary }]}>
                    Export My Data
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                    Download a copy of your personal data
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: theme.colors.primary[600] }]}
                onPress={handleExportData}
                disabled={isExporting}
              >
                <Text style={styles.clearButtonText}>
                  {isExporting ? 'Exporting...' : 'Export'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ... existing info container ... */}
      </ScrollView>
    </SafeAreaView>
  );
}

// ... existing styles ...

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