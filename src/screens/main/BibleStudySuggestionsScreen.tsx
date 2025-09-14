import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';
import { bibleStudyService, BibleStudySuggestion } from '@/services/api/bibleStudyService';

/**
 * Bible Study Suggestions Screen - AI-generated Bible study suggestions
 */
const BibleStudySuggestionsScreen: React.FC<RootStackScreenProps<'BibleStudySuggestions'>> = ({ 
  navigation 
}) => {
  const { profile } = useAuthStore();
  
  const [suggestions, setSuggestions] = useState<BibleStudySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BibleStudySuggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const studySuggestions = await bibleStudyService.generateSuggestions({
        topics: ['spiritual growth', 'prayer', 'faith', 'healing', 'relationships'],
        difficulty: 'intermediate',
        duration: 30,
      });
      setSuggestions(studySuggestions);
    } catch (error) {
      console.error('Failed to fetch Bible study suggestions:', error);
      Alert.alert('Error', 'Failed to load Bible study suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStudy = async (suggestion: BibleStudySuggestion) => {
    try {
      setIsGenerating(true);
      setSelectedSuggestion(suggestion);
      
      const study = await bibleStudyService.generateBibleStudy(suggestion);
      
      // Navigate to the generated study
      navigation.navigate('BibleStudy', { studyId: study.id });
    } catch (error) {
      console.error('Failed to generate Bible study:', error);
      Alert.alert('Error', 'Failed to generate Bible study. Please try again.');
    } finally {
      setIsGenerating(false);
      setSelectedSuggestion(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'theme.colors.success[700]';
      case 'intermediate': return 'theme.colors.warning[700]';
      case 'advanced': return 'theme.colors.error[700]';
      default: return '#6B7280';
    }
  };

  const renderSuggestion = (suggestion: BibleStudySuggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionCard}
      onPress={() => handleGenerateStudy(suggestion)}
      disabled={isGenerating}
    >
      <View style={styles.suggestionHeader}>
        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        <View style={styles.suggestionMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(suggestion.difficulty_level) }]}>
            <Text style={styles.difficultyText}>{suggestion.difficulty_level}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.durationText}>{suggestion.estimated_duration} min</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
      
      <View style={styles.scriptureReferences}>
        <Text style={styles.scriptureLabel}>Scripture References:</Text>
        <View style={styles.scriptureList}>
          {suggestion.scripture_references.map((reference, index) => (
            <View key={index} style={styles.scriptureTag}>
              <Text style={styles.scriptureText}>{reference}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Topics:</Text>
        <View style={styles.topicsList}>
          {suggestion.topics.map((topic, index) => (
            <View key={index} style={styles.topicTag}>
              <Text style={styles.topicText}>{topic}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.generateButton}>
        <Ionicons name="create-outline" size={20} color="#5B21B6" />
        <Text style={styles.generateButtonText}>Generate Study</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLoadingOverlay = () => {
    if (!isGenerating || !selectedSuggestion) return null;
    
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingTitle}>Generating Bible Study</Text>
          <Text style={styles.loadingSubtitle}>{selectedSuggestion.title}</Text>
          <Text style={styles.loadingText}>This may take a few moments...</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Generating Bible study suggestions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bible Study Suggestions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>AI-Powered Bible Studies</Text>
          <Text style={styles.introText}>
            Choose from these personalized Bible study suggestions. Each study is generated 
            using AI to provide deep, meaningful insights into God's Word.
          </Text>
        </View>

        <View style={styles.suggestionsContainer}>
          {suggestions.map(renderSuggestion)}
        </View>
      </ScrollView>

      {renderLoadingOverlay()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  scriptureReferences: {
    marginBottom: 16,
  },
  scriptureLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  scriptureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scriptureTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  scriptureText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
  },
  topicsContainer: {
    marginBottom: 16,
  },
  topicsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  topicText: {
    fontSize: 12,
    color: '#166534',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#5B21B6',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default BibleStudySuggestionsScreen;