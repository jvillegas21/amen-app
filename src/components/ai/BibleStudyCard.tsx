import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAIService } from '@/hooks/useAIService';
import { BibleStudy } from '@/services/aiService';

interface BibleStudyCardProps {
  prayerText: string;
  topic?: string;
  onStudyComplete?: () => void;
}

/**
 * AI-powered Bible Study Card component
 * Generates relevant Bible study content based on prayer text
 */
const BibleStudyCard: React.FC<BibleStudyCardProps> = ({
  prayerText,
  topic,
  onStudyComplete,
}) => {
  const {
    generateBibleStudy,
    isGeneratingBibleStudy,
    bibleStudyError,
    isConfigured,
  } = useAIService();

  const [bibleStudy, setBibleStudy] = useState<BibleStudy | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (prayerText.trim()) {
      loadBibleStudy();
    }
  }, [prayerText, topic]);

  const loadBibleStudy = async () => {
    try {
      const study = await generateBibleStudy(prayerText, topic);
      if (study) {
        setBibleStudy(study);
      }
    } catch (error) {
      console.error('Failed to load Bible study:', error);
    }
  };

  const handleRetry = () => {
    loadBibleStudy();
  };

  const handleQuestionNext = () => {
    if (bibleStudy && currentQuestionIndex < bibleStudy.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuestionPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleStudyComplete = () => {
    setCurrentQuestionIndex(0);
    setIsExpanded(false);
    onStudyComplete?.();
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#5B21B6" />
      <Text style={styles.loadingText}>Generating Bible study...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={24} color="theme.colors.error[700]" />
      <Text style={styles.errorText}>
        {bibleStudyError || 'Failed to generate Bible study'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBibleStudy = () => {
    if (!bibleStudy) return null;

    return (
      <View style={styles.studyContent}>
        <View style={styles.studyHeader}>
          <Ionicons name="book" size={20} color="#5B21B6" />
          <Text style={styles.studyTitle}>{bibleStudy.title}</Text>
        </View>

        <View style={styles.scriptureSection}>
          <Text style={styles.scriptureLabel}>Scripture</Text>
          <Text style={styles.scriptureText}>"{bibleStudy.scripture}"</Text>
        </View>

        <View style={styles.reflectionSection}>
          <Text style={styles.reflectionLabel}>Reflection</Text>
          <Text style={styles.reflectionText}>{bibleStudy.reflection}</Text>
        </View>

        {isExpanded && (
          <View style={styles.questionsSection}>
            <Text style={styles.questionsLabel}>Reflection Questions</Text>
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                {bibleStudy.questions[currentQuestionIndex]}
              </Text>
              <View style={styles.questionNavigation}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentQuestionIndex === 0 && styles.navButtonDisabled
                  ]}
                  onPress={handleQuestionPrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <Ionicons name="chevron-back" size={16} color="#5B21B6" />
                </TouchableOpacity>
                <Text style={styles.questionCounter}>
                  {currentQuestionIndex + 1} of {bibleStudy.questions.length}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentQuestionIndex === bibleStudy.questions.length - 1 && styles.navButtonDisabled
                  ]}
                  onPress={handleQuestionNext}
                  disabled={currentQuestionIndex === bibleStudy.questions.length - 1}
                >
                  <Ionicons name="chevron-forward" size={16} color="#5B21B6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.prayerFocusSection}>
          <Text style={styles.prayerFocusLabel}>Prayer Focus</Text>
          <Text style={styles.prayerFocusText}>{bibleStudy.prayer_focus}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Show Less' : 'View Questions'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#5B21B6"
            />
          </TouchableOpacity>

          {isExpanded && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleStudyComplete}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Complete Study</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderNotConfiguredState = () => (
    <View style={styles.notConfiguredContainer}>
      <Ionicons name="information-circle" size={24} color="#6B7280" />
      <Text style={styles.notConfiguredText}>
        AI Bible study generation is not configured. Using sample content.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Load Sample</Text>
      </TouchableOpacity>
    </View>
  );

  if (isGeneratingBibleStudy) {
    return (
      <View style={styles.container}>
        {renderLoadingState()}
      </View>
    );
  }

  if (bibleStudyError && !isConfigured) {
    return (
      <View style={styles.container}>
        {renderNotConfiguredState()}
      </View>
    );
  }

  if (bibleStudyError) {
    return (
      <View style={styles.container}>
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderBibleStudy()}
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
  studyContent: {
    padding: 16,
  },
  studyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  scriptureSection: {
    marginBottom: 16,
  },
  scriptureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },
  scriptureText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  reflectionSection: {
    marginBottom: 16,
  },
  reflectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },
  reflectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  questionsSection: {
    marginBottom: 16,
  },
  questionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 12,
  },
  questionContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  questionText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    marginBottom: 12,
  },
  questionNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  questionCounter: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  prayerFocusSection: {
    marginBottom: 16,
  },
  prayerFocusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },
  prayerFocusText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5B21B6',
    marginRight: 4,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'theme.colors.success[700]',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default BibleStudyCard;
