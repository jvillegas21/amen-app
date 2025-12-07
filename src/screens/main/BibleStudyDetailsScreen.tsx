/**
 * Bible Study Details Screen - Displays full AI-generated Bible studies
 */

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAIIntegration } from '@/hooks/useAIIntegration';
import { useAuthStore } from '@/store/auth/authStore';
import { BibleStudy } from '@/types/database.types';
import { bibleStudyService } from '@/services/api/bibleStudyService';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createHeaderStyle } from '@/navigation/headerUtils';
import {
  normalizeScriptureReferences,
  toStringSafe,
  RawScriptureReference,
  extractStudySections,
} from '@/utils/scripture';

interface BibleStudyDetailsScreenProps extends MainStackScreenProps<'BibleStudyDetails'> { }

const BibleStudyDetailsScreen: React.FC<BibleStudyDetailsScreenProps> = ({
  navigation,
  route
}) => {
  const { studyId, prayerId, study: passedStudy } = route.params;
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const {
    generateFullStudy,
    isGeneratingStudy,
    incrementStudyViews,
    saveStudy,
    removeSavedStudy,
    savedStudies
  } = useAIIntegration();

  const [study, setStudy] = useState<BibleStudy | null>((passedStudy as unknown as BibleStudy) || null);
  const [isLoading, setIsLoading] = useState(!passedStudy);
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const viewIncrementedRef = useRef(false);

  // Force isOwner check to be safe - ensure profile is loaded
  const isOwner = study?.user_id && profile?.id && study.user_id === profile.id;

  useFocusEffect(
    useCallback(() => {
      loadStudy();
    }, [studyId])
  );

  useEffect(() => {
    if (study) {
      const alreadySaved = savedStudies?.some(saved => saved.id === study.id);
      setIsSaved(alreadySaved);
      if (study.quality_score) {
        setUserRating(Math.round(study.quality_score));
      }
    }
  }, [savedStudies, study]);

  const loadStudy = async () => {
    try {
      if (passedStudy && !study) {
        setStudy(passedStudy as unknown as BibleStudy);
        setIsLoading(false);
        if ((passedStudy as any).id && !viewIncrementedRef.current) {
          await incrementStudyViews((passedStudy as any).id);
          viewIncrementedRef.current = true;
        }
        // Continue to fetch fresh data to ensure we have the latest edits
      }

      // If we already have a study loaded, just refresh it silently (don't show full loading state if possible, or do?)
      // Actually, for edit refresh, we want to see the new data.
      // But we don't want to flash loading screen if we already have data.
      const isRefreshing = !!study;
      if (!isRefreshing) setIsLoading(true);

      if (studyId && prayerId && !study) {
        // This path is for generating new study from suggestion, likely not the edit case
        const generatedStudy = await generateFullStudy({
          prayerId,
          suggestionId: studyId,
        });

        if (generatedStudy) {
          setStudy(generatedStudy);
          if (!viewIncrementedRef.current) {
            await incrementStudyViews(generatedStudy.id);
            viewIncrementedRef.current = true;
          }
        }
      } else if (studyId) {
        const existingStudy = await bibleStudyService.getBibleStudy(studyId);

        if (existingStudy) {
          // Only increment view count if not already done
          if (!viewIncrementedRef.current) {
            const updatedStudy = {
              ...existingStudy,
              view_count: (existingStudy.view_count || 0) + 1
            };
            setStudy(updatedStudy as unknown as BibleStudy);
            await incrementStudyViews(existingStudy.id);
            viewIncrementedRef.current = true;
          } else {
            setStudy(existingStudy as unknown as BibleStudy);
          }
        }
      }
    } catch (error) {
      console.error('Error loading study:', error);
      Alert.alert('Error', 'Failed to load Bible study');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudy = useCallback(() => {
    Alert.alert(
      'Delete Bible Study',
      'Are you sure you want to delete this Bible study? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!study?.id) return;
            try {
              await bibleStudyService.deleteBibleStudy(study.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete Bible study');
            }
          },
        },
      ]
    );
  }, [study, navigation]);

  const handleEditStudy = useCallback(() => {
    if (study?.id) {
      navigation.navigate('EditBibleStudy', { studyId: study.id });
    }
  }, [study, navigation]);

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
  }, [study, isSaved, removeSavedStudy, saveStudy]);

  const [userRating, setUserRating] = useState<number>(0);

  const handleRateStudy = useCallback(async (rating: number) => {
    if (!study?.id) return;
    try {
      setUserRating(rating);
      await bibleStudyService.rateStudy(study.id, rating);
      Alert.alert('Thank you', 'Your rating has been saved.');
    } catch (error) {
      console.error('Error rating study:', error);
      Alert.alert('Error', 'Failed to save rating');
    }
  }, [study]);

  const handleShareStudy = useCallback(async () => {
    if (!study) return;
    try {
      const previewContent = typeof study.content_md === 'string'
        ? study.content_md.replace(/\s+/g, ' ').trim().slice(0, 200)
        : '';
      const message = previewContent
        ? `Check out this Bible study: ${study.title}\n\n${previewContent}...`
        : `Check out this Bible study: ${study.title}`;
      await Share.share({ message, title: study.title });
    } catch (error) {
      console.error('Error sharing study:', error);
    }
  }, [study]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: createHeaderStyle(insets, '#5B21B6'),
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { color: '#FFFFFF', fontWeight: 'bold' },
      headerTitle: 'Bible Study',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.headerBackText}>Back</Text>
        </TouchableOpacity>
      ),
      headerRight: study
        ? () => (
          <View style={styles.headerActions}>
            {isOwner ? (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setShowMenu(true)}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
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
            )}
          </View>
        )
        : undefined,
    });
  }, [navigation, study, isSaved, handleSaveStudy, handleShareStudy, insets, isOwner, handleEditStudy, handleDeleteStudy, showMenu]);

  const renderMenuModal = () => (
    <Modal
      visible={showMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              handleEditStudy();
            }}
          >
            <Ionicons name="create-outline" size={24} color="#111827" />
            <Text style={styles.menuText}>Edit Bible Study</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('CreateBibleStudy', {
                initialData: {
                  title: study?.title,
                  content: study?.content_md,
                  scripture_references: study?.scripture_references
                }
              });
            }}
          >
            <Ionicons name="copy-outline" size={24} color="#111827" />
            <Text style={styles.menuText}>Copy Study</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDestructive]}
            onPress={() => {
              setShowMenu(false);
              // Small delay to allow modal to close before alert
              setTimeout(() => handleDeleteStudy(), 100);
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#DC2626" />
            <Text style={[styles.menuText, styles.menuTextDestructive]}>Delete Bible Study</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderScriptureReferences = () => {
    if (!study?.scripture_references || study.scripture_references.length === 0) return null;
    const references = normalizeScriptureReferences(study?.scripture_references as RawScriptureReference[] | undefined);
    if (references.length === 0) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="book" size={20} color="#5B21B6" />
          <Text style={styles.cardTitle}>Scripture References</Text>
        </View>
        {references.map(({ referenceLabel, referenceText, explanation }, index) => (
          <View key={index} style={styles.scriptureItem}>
            <View style={styles.scriptureHeader}>
              <Text style={styles.scriptureRefText}>{referenceLabel}</Text>
            </View>
            {referenceText ? (
              <Text style={styles.scriptureBodyText}>{referenceText}</Text>
            ) : null}
            {explanation ? (
              <View style={styles.explanationContainer}>
                <Text style={styles.explanationLabel}>Why this verse?</Text>
                <Text style={styles.explanationText}>{explanation}</Text>
              </View>
            ) : null}
            {index < references.length - 1 && <View style={styles.scriptureDivider} />}
          </View>
        ))}
      </View>
    );
  };

  const renderStudyContent = () => {
    if (!study) return null;
    const contentText = study.content_md || (study as any).content || '';
    const contentSections = extractStudySections(contentText);

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.studyTitleText}>{study.title}</Text>
          <View style={styles.studyMetadata}>
            {typeof study.view_count === 'number' && (
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{study.view_count} views</Text>
              </View>
            )}
            {typeof study.save_count === 'number' && study.save_count > 0 && (
              <>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="bookmark-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{study.save_count} saves</Text>
                </View>
              </>
            )}
            {study.quality_score && (
              <>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.metaText}>{study.quality_score}/5</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rate this study:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRateStudy(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={24}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {renderScriptureReferences()}

        {contentSections.length > 0 ? (
          contentSections.map((section, index) => {
            const sectionBody = toStringSafe(section.body);
            if (!sectionBody) return null;

            // Determine style and icon based on section type
            let iconName: any = 'document-text';
            let iconColor = '#5B21B6';
            let cardStyle = styles.card;
            let titleStyle = styles.cardTitle;

            switch (section.type) {
              case 'reflection':
                iconName = 'book-outline';
                iconColor = '#4F46E5'; // Indigo
                break;
              case 'questions':
                iconName = 'help-circle-outline';
                iconColor = '#D97706'; // Amber
                break;
              case 'prayer':
                iconName = 'heart-outline';
                iconColor = '#DB2777'; // Pink
                break;
              case 'application':
                iconName = 'footsteps-outline';
                iconColor = '#059669'; // Emerald
                break;
            }

            return (
              <View key={index} style={cardStyle}>
                <View style={styles.cardHeader}>
                  <Ionicons name={iconName} size={20} color={iconColor} />
                  <Text style={[titleStyle, { color: iconColor }]}>{section.heading || 'Study Note'}</Text>
                </View>
                {section.type === 'questions' ? (
                  <View style={styles.questionsContainer}>
                    {sectionBody.split('\n').map((line, i) => {
                      const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
                      if (!cleanLine) return null;
                      return (
                        <View key={i} style={styles.questionItem}>
                          <View style={styles.questionNumberBadge}>
                            <Text style={styles.questionNumberText}>{i + 1}</Text>
                          </View>
                          <Text style={styles.questionText}>{cleanLine}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.sectionContent}>{sectionBody}</Text>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No content available.</Text>
          </View>
        )}
      </ScrollView >
    );
  };

  if (isLoading || isGeneratingStudy) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>{isGeneratingStudy ? 'Generating Bible study...' : 'Loading...'}</Text>
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
          <Text style={styles.errorText}>The Bible study you're looking for could not be found.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStudy}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderStudyContent()}
      {renderMenuModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background for better card contrast
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerBackText: {
    color: '#FFFFFF',
    fontSize: 17,
    marginLeft: 4,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  studyTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  studyMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  scriptureItem: {
    marginBottom: 16,
  },
  scriptureHeader: {
    marginBottom: 8,
  },
  scriptureRefText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scriptureBodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  explanationContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  scriptureDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  sectionContent: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#5B21B6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemDestructive: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    fontWeight: '500',
  },
  questionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  questionItem: {
    flexDirection: 'row',
    gap: 12,
  },
  questionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  menuTextDestructive: {
    color: '#DC2626',
  },
  ratingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  customizeButton: {
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customizeButtonText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default BibleStudyDetailsScreen;
// End of file
