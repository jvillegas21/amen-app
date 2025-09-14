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
import { useThemeStore } from '@/store/theme/themeStore';

export default function LanguageScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();

  const handleLanguageSelect = (language: string) => {
    Alert.alert(
      'Language Updated',
      `App language has been changed to ${language}.`,
      [{ text: 'OK' }]
    );
  };

  const languageOptions = [
    {
      id: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    },
    {
      id: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
    },
    {
      id: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
    },
    {
      id: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
    },
    {
      id: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      flag: '🇵🇹',
    },
    {
      id: 'it',
      name: 'Italian',
      nativeName: 'Italiano',
      flag: '🇮🇹',
    },
    {
      id: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      flag: '🇷🇺',
    },
    {
      id: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
    },
    {
      id: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
    },
    {
      id: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      flag: '🇰🇷',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Language</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Choose your preferred language
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          The language will be applied throughout the app
        </Text>

        <View style={styles.optionsContainer}>
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => handleLanguageSelect(option.name)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <Text style={styles.flag}>{option.flag}</Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionName, { color: colors.text }]}>
                      {option.name}
                    </Text>
                    <Text style={[styles.optionNativeName, { color: colors.textSecondary }]}>
                      {option.nativeName}
                    </Text>
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Language changes will be applied after restarting the app.
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
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
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
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionNativeName: {
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