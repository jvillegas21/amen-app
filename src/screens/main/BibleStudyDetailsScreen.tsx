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
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAIIntegration } from '@/hooks/useAIIntegration';
import { BibleStudy } from '@/types/database.types';
import { bibleStudyService } from '@/services/api/bibleStudyService';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import {
  normalizeScriptureReferences,
  summarizeScriptureReferences,
  formatScriptureReference,
  extractScriptureText,
  RawScriptureReference,
} from '@/utils/scripture';

interface BibleStudyDetailsScreenProps extends RootStackScreenProps<'BibleStudyDetails'> {}

const BibleStudyDetailsScreen: React.FC<BibleStudyDetailsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { studyId, prayerId } = route.params;
  const { 
    generateFullStudy, 
    isGeneratingStudy, 
    incrementStudyViews, 
    saveStudy, 
    removeSavedStudy,
    savedStudies 
  } = useAIIntegration();
  
  const [study, setStudy] = useState<BibleStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const scriptureSummary = useMemo(() => {
    if (!study?.scripture_references || study.scripture_references.length === 0) {
      return '';
    }

    return study.scripture_references
      .map(reference => formatScriptureReference(reference as ScriptureReferenceValue))
      .filter(Boolean)
      .join(' • ');
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
                  color={theme.colors.text.inverse}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleShareStudy}
                accessibilityRole="button"
                accessibilityLabel="Share Bible study"
                accessibilityHint="Share this study using your device options"
              >
                <Ionicons name="share-outline" size={22} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            </View>
          )
        : undefined,
    });
  }, [navigation, study, isSaved, handleSaveStudy, handleShareStudy]);

  const renderScriptureReferences = () => {
    if (!study?.scripture_references || study.scripture_references.length === 0) {
      return null;
    }

    const references = study.scripture_references
      .map(reference => {
        const referenceLabel = formatScriptureReference(reference as ScriptureReferenceValue);
        const referenceText = extractScriptureText(reference as ScriptureReferenceValue);

        if (!referenceLabel && !referenceText) {
          return null;
        }

        return { referenceLabel, referenceText };
      })
      .filter((item): item is { referenceLabel: string; referenceText: string | null } => Boolean(item));

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

    const rawContent = typeof study.content_md === 'string' ? study.content_md : '';
    const normalizedContent = rawContent.replace(/\r\n/g, '\n');
    const rawSections = normalizedContent ? normalizedContent.split('\n## ') : [];
    const [, ...sectionChunks] = rawSections;

    const fallbackContent = normalizedContent
      ? normalizedContent.replace(/^#\s+.*$/m, '').trim()
      : '';

    const contentSections = sectionChunks.length > 0
      ? sectionChunks
      : (fallbackContent ? [fallbackContent] : []);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(typeof study.quality_score === 'number' || typeof study.view_count === 'number') && (
          <View style={styles.metaRow}>
            {typeof study.quality_score === 'number' ? (
              <Text style={styles.metaValue}>Quality Score: {study.quality_score}/5</Text>
            ) : null}
            {typeof study.view_count === 'number' ? (
              <Text style={styles.metaValue}>{study.view_count} views</Text>
            ) : null}
          </View>
        )}

        {contentSections.map((section, index) => {
          const lines = section.split('\n');
          let [rawHeading, ...rawBodyLines] = lines;

          let sectionHeading = toStringSafe(rawHeading).replace(/^#+\s*/, '').trim();
          let bodyLines = rawBodyLines;

          if (!bodyLines.length) {
            bodyLines = sectionHeading ? [sectionHeading] : [];
            sectionHeading = sectionHeading || (index === 0 ? 'Study Overview' : `Study Insight ${index + 1}`);
          }

          const sectionBody = bodyLines
            .map(line => toStringSafe(line))
            .join('\n')
            .trim()
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s*[-*+]\s+/gm, '• ');

          if (!sectionHeading && !sectionBody) {
            return null;
          }

          return (
            <View key={index} style={styles.section}>
              {sectionHeading ? (
                <Text style={styles.sectionTitle}>{sectionHeading}</Text>
              ) : null}
              {sectionBody ? (
                <Text style={styles.sectionContent}>{sectionBody}</Text>
              ) : null}
            </View>
          );
        })}

        {renderScriptureReferences()}

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
      {study ? (
        <View style={styles.secondaryAppBar}>
          <Text style={styles.secondaryTitle} numberOfLines={2}>
            {study.title}
          </Text>
          {scriptureSummary ? (
            <Text style={styles.secondarySubtitle} numberOfLines={2}>
              {scriptureSummary}
            </Text>
          ) : null}
        </View>
      ) : null}

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
    backgroundColor: theme.colors.warning[700],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
    gap: theme.spacing[2],
  },
  secondaryTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.inverse,
    letterSpacing: 0.2,
  },
  secondarySubtitle: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.inverse,
    opacity: 0.85,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[5],
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  metaValue: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing[4],
    marginBottom: theme.spacing[1],
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  sectionContent: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  scriptureRef: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
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
    color: theme.colors.primary[600],
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
