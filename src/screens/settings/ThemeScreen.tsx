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
import { useThemeStore, Theme } from '@/store/theme/themeStore';

export default function ThemeScreen() {
  const router = useRouter();
  const { theme, setTheme, colors } = useThemeStore();

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    Alert.alert(
      'Theme Updated',
      `App theme has been changed to ${selectedTheme === 'system' ? 'System Default' : selectedTheme}.`,
      [{ text: 'OK' }]
    );
  };

  const themeOptions = [
    {
      id: 'light' as Theme,
      name: 'Light',
      description: 'Always use light theme',
      icon: 'sunny-outline',
    },
    {
      id: 'dark' as Theme,
      name: 'Dark',
      description: 'Always use dark theme',
      icon: 'moon-outline',
    },
    {
      id: 'system' as Theme,
      name: 'System',
      description: 'Follow system theme',
      icon: 'phone-portrait-outline',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Choose your preferred theme
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          The theme will be applied throughout the app
        </Text>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: theme === option.id ? 2 : 1,
                }
              ]}
              onPress={() => handleThemeSelect(option.id)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionName, { color: colors.text }]}>
                      {option.name}
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                
                {theme === option.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
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