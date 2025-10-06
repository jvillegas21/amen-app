/**
 * Bible Study Details Screen - Displays full AI-generated Bible studies
 */

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAIIntegration } from '@/hooks/useAIIntegration';
import { BibleStudy } from '@/types/database.types';
import { bibleStudyService } from '@/services/api/bibleStudyService';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createHeaderStyle } from '@/navigation/headerUtils';
import {
  normalizeScriptureReferences,
  summarizeScriptureReferences,
  toStringSafe,
  RawScriptureReference,
  extractStudySections,
} from '@/utils/scripture';

interface BibleStudyDetailsScreenProps extends MainStackScreenProps<'BibleStudyDetails'> {}

const BibleStudyDetailsScreen: React.FC<BibleStudyDetailsScreenProps> = ({
  navigation,
  route
}) => {
  const { studyId, prayerId, study: passedStudy } = route.params;
  const insets = useSafeAreaInsets();
  const {
    generateFullStudy,
    isGeneratingStudy,
    incrementStudyViews,
    saveStudy,
    removeSavedStudy,
    savedStudies
  } = useAIIntegration();

  const [study, setStudy] = useState<BibleStudy | null>(passedStudy || null);
  const [isLoading, setIsLoading] = useState(!passedStudy);
  const [isSaved, setIsSaved] = useState(false);

  const scriptureSummary = useMemo(() => {
    return summarizeScriptureReferences(study?.scripture_references as RawScriptureReference[] | undefined);
  }, [study?.scripture_references]);

  useEffect(() => {
    loadStudy();
  }, [studyId]);

  useEffect(() => {
    if (study) {
      const alreadySaved = savedStudies?.some(saved => saved.id === study.id);
      setIsSaved(alreadySaved);
    }
  }, [savedStudies, study]);

  const loadStudy = async () => {
    try {
      // If study was passed via navigation params, skip loading
      if (passedStudy) {
        setStudy(passedStudy);
        setIsLoading(false);
        // Still increment view count for the passed study
        if (passedStudy.id) {
          await incrementStudyViews(passedStudy.id);
        }
        return;
      }

      setIsLoading(true);

      if (studyId && prayerId) {
        // Generate full study from suggestion
        const generatedStudy = await generateFullStudy({
          prayerId,
          suggestionId: studyId,
        });

        if (generatedStudy) {
          setStudy(generatedStudy);
          await incrementStudyViews(generatedStudy.id);
        }
      } else if (studyId) {
        const existingStudy = await bibleStudyService.getBibleStudy(studyId);

        if (existingStudy) {
          setStudy(existingStudy as unknown as BibleStudy);
          await incrementStudyViews(existingStudy.id);
        }
      }
    } catch (error) {
      console.error('Error loading study:', error);
      Alert.alert('Error', 'Failed to load Bible study');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStudy = useCallback(async () => {
    if (!study) return;

    try {
      if (isSaved) {
        await removeSavedStudy(study.id);
        setIsSaved(false);
      } else {
        await saveStudy(study.id);
        setIsSaved(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update saved studies');
    }
  }, [isSaved, removeSavedStudy, saveStudy, study]);

  const handleShareStudy = useCallback(async () => {
    if (!study) return;

    try {
      const previewContent = typeof study.content_md === 'string'
        ? study.content_md.replace(/\s+/g, ' ').trim().slice(0, 200)
        : '';

      const message = previewContent
        ? `Check out this Bible study: ${study.title}\n\n${previewContent}...`
        : `Check out this Bible study: ${study.title}`;

      await Share.share({
        message,
        title: study.title,
      });
    } catch (error) {
      console.error('Error sharing study:', error);
    }
  }, [study]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: createHeaderStyle(insets, '#D97706'),
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        color: '#FFFFFF',
      },
      headerRight: study
        ? () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleSaveStudy}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove saved Bible study' : 'Save Bible study'}
                accessibilityHint={isSaved ? 'Remove this study from your saved list' : 'Save this study for later'}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleShareStudy}
                accessibilityRole="button"
                accessibilityLabel="Share Bible study"
                accessibilityHint="Share this study using your device options"
              >
                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )
        : undefined,
    });
  }, [navigation, study, isSaved, handleSaveStudy, handleShareStudy, insets]);

  const renderScriptureReferences = () => {
    if (!study?.scripture_references || study.scripture_references.length === 0) {
      return null;
    }

    const references = normalizeScriptureReferences(study?.scripture_references as RawScriptureReference[] | undefined);

    if (references.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scripture References</Text>
        {references.map(({ referenceLabel, referenceText }, index) => (
          <View key={index} style={styles.scriptureRef}>
            {referenceText ? (
              <Text style={styles.scriptureText}>{referenceText}</Text>
            ) : null}
            {referenceLabel ? (
              <Text style={styles.scriptureReference}>{referenceLabel}</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  };

  const renderStudyContent = () => {
    if (!study) return null;

    const contentSections = extractStudySections(study.content_md)
      .map(section => section.body);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Study Title */}
        <View style={styles.studyTitleContainer}>
          <Text style={styles.studyTitleText}>{study.title}</Text>
        </View>

        {/* Study Metadata */}
        <View style={styles.studyMetadata}>
          {typeof study.view_count === 'number' && (
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{study.view_count} views</Text>
            </View>
          )}
          {typeof study.save_count === 'number' && study.save_count > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="bookmark-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{study.save_count} saved</Text>
            </View>
          )}
          {study.quality_score && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metaText}>{study.quality_score}/5</Text>
            </View>
          )}
        </View>

        {/* Scripture References */}
        {renderScriptureReferences()}

        {/* Study Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Content</Text>
          {contentSections.map((section, index) => {
            const sectionBody = toStringSafe(section);

            if (!sectionBody) {
              return null;
            }

            return (
              <Text key={index} style={styles.sectionContent}>{sectionBody}</Text>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This Bible study was generated using AI to provide personalized spiritual guidance.
          </Text>
        </View>
      </ScrollView>
    );
  };

  if (isLoading || isGeneratingStudy) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>
            {isGeneratingStudy ? 'Generating Bible study...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!study) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="book-outline" size={64} color={theme.colors.neutral[400]} />
          <Text style={styles.errorTitle}>Study Not Found</Text>
          <Text style={styles.errorText}>
            The Bible study you're looking for could not be found.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadStudy}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderStudyContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: theme.spacing[2],
    marginLeft: theme.spacing[2],
  },
  secondaryAppBar: {
    backgroundColor: '#D97706',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
  },
  secondaryTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  secondarySubtitle: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    marginTop: theme.spacing[1],
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
  },
  studyTitleContainer: {
    marginBottom: theme.spacing[3],
  },
  studyTitleText: {
    ...theme.typography.heading.h1,
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  studyMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: theme.spacing[4],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
    fontSize: 18,
    fontWeight: '600',
  },
  sectionContent: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing[3],
  },
  scriptureRef: {
    marginBottom: theme.spacing[3],
  },
  scriptureText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    marginBottom: theme.spacing[2],
  },
  scriptureReference: {
    ...theme.typography.caption.medium,
    color: '#D97706',
    fontWeight: '600',
  },
  footer: {
    paddingVertical: theme.spacing[6],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
    marginTop: theme.spacing[4],
  },
  footerText: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[3],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  errorTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  errorText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  retryButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },
});

export default BibleStudyDetailsScreen;
