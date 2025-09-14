import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeMode, ThemeMode, useTheme } from '@/theme/ThemeContext';

export default function ThemeScreen() {
  const router = useRouter();
  const { themeMode, colorScheme, setThemeMode } = useThemeMode();
  const { theme } = useTheme();

  const handleThemeSelect = (selectedTheme: ThemeMode) => {
    setThemeMode(selectedTheme);
    Alert.alert(
      'Theme Updated',
      `App theme has been changed to ${selectedTheme === 'system' ? 'System Default' : selectedTheme}.`,
      [{ text: 'OK' }]
    );
  };

  const themeOptions = [
    {
      id: 'light' as ThemeMode,
      name: 'Light',
      description: 'Always use light theme',
      icon: 'sunny-outline',
    },
    {
      id: 'dark' as ThemeMode,
      name: 'Dark',
      description: 'Always use dark theme',
      icon: 'moon-outline',
    },
    {
      id: 'system' as ThemeMode,
      name: 'System',
      description: 'Follow system theme',
      icon: 'phone-portrait-outline',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[600]} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Theme</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Choose your preferred theme
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
          The theme will be applied throughout the app
        </Text>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                { 
                  backgroundColor: theme.colors.surface.primary,
                  borderColor: theme.colors.border.primary,
                  borderWidth: themeMode === option.id ? 2 : 1,
                }
              ]}
              onPress={() => handleThemeSelect(option.id)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary[600] + '20' }]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={theme.colors.primary[600]} 
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionName, { color: theme.colors.text.primary }]}>
                      {option.name}
                    </Text>
                    <Text style={[styles.optionDescription, { color: theme.colors.text.secondary }]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                
                {themeMode === option.id && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[600]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.primary }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.info[500]} />
          <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
            System theme will automatically switch between light and dark based on your device settings.
          </Text>
        </View>
      </View>
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
  optionsContainer: {
    marginBottom: 24,
  },
  optionItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
});