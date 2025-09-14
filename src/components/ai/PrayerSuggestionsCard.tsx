import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAIService } from '@/hooks/useAIService';
import { PrayerSuggestion } from '@/services/aiService';

interface PrayerSuggestionsCardProps {
  prayerText: string;
  category?: string;
  context?: string;
  onSuggestionSelect?: (suggestion: PrayerSuggestion) => void;
}

/**
 * AI-powered Prayer Suggestions Card component
 * Generates relevant prayer suggestions based on user input
 */
const PrayerSuggestionsCard: React.FC<PrayerSuggestionsCardProps> = ({
  prayerText,
  category,
  context,
  onSuggestionSelect,
}) => {
  const {
    generatePrayerSuggestions,
    isGeneratingSuggestions,
    suggestionsError,
    isConfigured,
  } = useAIService();

  const [suggestions, setSuggestions] = useState<PrayerSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PrayerSuggestion | null>(null);

  useEffect(() => {
    if (prayerText.trim()) {
      loadSuggestions();
    }
  }, [prayerText, category, context]);

  const loadSuggestions = async () => {
    try {
      const newSuggestions = await generatePrayerSuggestions(prayerText, category, context);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to load prayer suggestions:', error);
    }
  };

  const handleRetry = () => {
    loadSuggestions();
  };

  const handleSuggestionSelect = (suggestion: PrayerSuggestion) => {
    setSelectedSuggestion(suggestion);
    onSuggestionSelect?.(suggestion);
  };

  const handleUseSuggestion = () => {
    if (selectedSuggestion) {
      Alert.alert(
        'Use Suggestion',
        'Would you like to use this prayer suggestion as your prayer text?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Use Suggestion',
            onPress: () => {
              onSuggestionSelect?.(selectedSuggestion);
            },
          },
        ]
      );
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#5B21B6" />
      <Text style={styles.loadingText}>Generating prayer suggestions...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={24} color="theme.colors.error[700]" />
      <Text style={styles.errorText}>
        {suggestionsError || 'Failed to generate prayer suggestions'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNotConfiguredState = () => (
    <View style={styles.notConfiguredContainer}>
      <Ionicons name="information-circle" size={24} color="#6B7280" />
      <Text style={styles.notConfiguredText}>
        AI prayer suggestions are not configured. Using sample suggestions.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Load Sample</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuggestionItem = (suggestion: PrayerSuggestion, index: number) => {
    const isSelected = selectedSuggestion?.title === suggestion.title;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.suggestionItem,
          isSelected && styles.selectedSuggestionItem
        ]}
        onPress={() => handleSuggestionSelect(suggestion)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionHeader}>
          <View style={styles.suggestionTitleContainer}>
            <Text style={[
              styles.suggestionTitle,
              isSelected && styles.selectedSuggestionTitle
            ]}>
              {suggestion.title}
            </Text>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: `${getCategoryColor(suggestion.category)}15` }
            ]}>
              <Text style={[
                styles.categoryText,
                { color: getCategoryColor(suggestion.category) }
              ]}>
                {suggestion.category}
              </Text>
            </View>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color="theme.colors.success[700]" />
          )}
        </View>

        <Text style={[
          styles.suggestionContent,
          isSelected && styles.selectedSuggestionContent
        ]}>
          {suggestion.content}
        </Text>

        {suggestion.scripture_reference && (
          <View style={styles.scriptureContainer}>
            <Ionicons name="book" size={14} color="#6B7280" />
            <Text style={styles.scriptureReference}>
              {suggestion.scripture_reference}
            </Text>
          </View>
        )}

        {suggestion.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {suggestion.tags.map((tag, tagIndex) => (
              <View key={tagIndex} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bulb-outline" size={32} color="#D1D5DB" />
          <Text style={styles.emptyText}>No suggestions available</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsScrollContent}
      >
        {suggestions.map((suggestion, index) => renderSuggestionItem(suggestion, index))}
      </ScrollView>
    );
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Healing': 'theme.colors.success[700]',
      'Strength': 'theme.colors.warning[700]',
      'Peace': '#3B82F6',
      'Guidance': '#8B5CF6',
      'Gratitude': 'theme.colors.error[700]',
      'Protection': '#6B7280',
      'Wisdom': '#5B21B6',
      'Comfort': '#F97316',
    };
    return colors[category] || '#6B7280';
  };

  if (isGeneratingSuggestions) {
    return (
      <View style={styles.container}>
        {renderLoadingState()}
      </View>
    );
  }

  if (suggestionsError && !isConfigured) {
    return (
      <View style={styles.container}>
        {renderNotConfiguredState()}
      </View>
    );
  }

  if (suggestionsError) {
    return (
      <View style={styles.container}>
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="bulb" size={20} color="#5B21B6" />
          <Text style={styles.headerTitle}>AI Prayer Suggestions</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={16} color="#5B21B6" />
        </TouchableOpacity>
      </View>

      {renderSuggestions()}

      {selectedSuggestion && (
        <View style={styles.selectedActions}>
          <TouchableOpacity
            style={styles.useButton}
            onPress={handleUseSuggestion}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.useButtonText}>Use This Suggestion</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: 'theme.colors.error[700]',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  notConfiguredContainer: {
    alignItems: 'center',
    padding: 20,
  },
  notConfiguredText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 4,
  },
  suggestionsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  suggestionItem: {
    width: 280,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSuggestionItem: {
    backgroundColor: '#F0F9FF',
    borderColor: '#5B21B6',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionTitleContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedSuggestionTitle: {
    color: '#5B21B6',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  suggestionContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  selectedSuggestionContent: {
    color: '#1E40AF',
  },
  scriptureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scriptureReference: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 10,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  selectedActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  useButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default PrayerSuggestionsCard;
