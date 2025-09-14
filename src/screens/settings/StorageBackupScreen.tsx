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
import { useThemeStore } from '@/store/theme/themeStore';

interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  includeImages: boolean;
  lastBackup: Date | null;
  backupSize: number;
}

export default function StorageBackupScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: 'weekly',
    includeImages: true,
    lastBackup: new Date(),
    backupSize: 0,
  });
  
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadBackupSettings();
  }, []);

  const loadBackupSettings = async () => {
    // TODO: Load settings from storage
    setSettings(prev => ({
      ...prev,
      backupSize: 45, // MB
    }));
  };

  const handleSettingChange = (key: keyof BackupSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      // TODO: Implement backup functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate backup
      
      setSettings(prev => ({
        ...prev,
        lastBackup: new Date(),
        backupSize: 45,
      }));
      
      Alert.alert('Success', 'Backup completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = () => {
    Alert.alert(
      'Restore Backup',
      'This will restore your data from the last backup. Current data will be replaced. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              // TODO: Implement restore functionality
              await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate restore
              Alert.alert('Success', 'Backup restored successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to restore backup');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const formatBackupSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatLastBackup = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const frequencyOptions = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Storage & Backup</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Manage your data backup
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Keep your prayers and data safe with automatic backups
        </Text>

        {/* Backup Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            Backup Status
          </Text>
          
          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusContent}>
              <Ionicons name="cloud-done-outline" size={24} color={colors.success} />
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  Last Backup
                </Text>
                <Text style={[styles.statusValue, { color: colors.textSecondary }]}>
                  {formatLastBackup(settings.lastBackup)}
                </Text>
              </View>
            </View>
            <Text style={[styles.backupSize, { color: colors.textSecondary }]}>
              {formatBackupSize(settings.backupSize)}
            </Text>
          </View>
        </View>

        {/* Backup Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            Backup Settings
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: colors.text }]}>
                    Automatic Backup
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Automatically backup your data
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.autoBackup}
                onValueChange={(value) => handleSettingChange('autoBackup', value)}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={settings.autoBackup ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: colors.text }]}>
                    Backup Frequency
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    How often to backup your data
                  </Text>
                </View>
              </View>
              <View style={styles.frequencySelector}>
                {frequencyOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.frequencyOption,
                      {
                        backgroundColor: settings.backupFrequency === option.id 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => handleSettingChange('backupFrequency', option.id)}
                  >
                    <Text style={[
                      styles.frequencyText,
                      {
                        color: settings.backupFrequency === option.id 
                          ? '#FFFFFF' 
                          : colors.text,
                      }
                    ]}>
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Ionicons name="image-outline" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingName, { color: colors.text }]}>
                    Include Images
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Include images in backup (increases size)
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.includeImages}
                onValueChange={(value) => handleSettingChange('includeImages', value)}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={settings.includeImages ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Backup Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            Backup Actions
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleBackupNow}
            disabled={isBackingUp}
          >
            {isBackingUp ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>
              {isBackingUp ? 'Backing Up...' : 'Backup Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={handleRestoreBackup}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>
              {isRestoring ? 'Restoring...' : 'Restore Backup'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Backups are stored securely in the cloud and can be restored on any device. Your data is encrypted and private.
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
  statusCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
  },
  backupSize: {
    fontSize: 12,
    textAlign: 'right',
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
  frequencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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