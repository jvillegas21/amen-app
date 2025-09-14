/**
 * Bible Study Details Screen - Displays full AI-generated Bible studies
 */

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
  Share,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAIIntegration } from '@/hooks/useAIIntegration';
import { BibleStudy } from '@/types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

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

  useEffect(() => {
    loadStudy();
  }, [studyId]);

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
      }
    } catch (error) {
      console.error('Error loading study:', error);
      Alert.alert('Error', 'Failed to load Bible study');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStudy = async () => {
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
  };

  const handleShareStudy = async () => {
    if (!study) return;
    
    try {
      await Share.share({
        message: `Check out this Bible study: ${study.title}\n\n${study.content_md.substring(0, 200)}...`,
        title: study.title,
      });
    } catch (error) {
      console.error('Error sharing study:', error);
    }
  };

  const renderScriptureReferences = () => {
    if (!study?.scripture_references || study.scripture_references.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scripture References</Text>
        {study.scripture_references.map((ref, index) => (
          <View key={index} style={styles.scriptureRef}>
            <Text style={styles.scriptureText}>{ref.text}</Text>
            <Text style={styles.scriptureReference}>{ref.reference}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStudyContent = () => {
    if (!study) return null;

    // Parse markdown content
    const sections = study.content_md.split('\n## ');
    const title = sections[0].replace('# ', '');
    const content = sections.slice(1);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.qualityScore}>
              Quality Score: {study.quality_score}/5
            </Text>
            <Text style={styles.viewCount}>
              {study.view_count} views
            </Text>
          </View>
        </View>

        {content.map((section, index) => {
          const [sectionTitle, ...sectionContent] = section.split('\n');
          const content = sectionContent.join('\n').trim();
          
          return (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              <Text style={styles.sectionContent}>{content}</Text>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSaveStudy}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isSaved ? theme.colors.primary[600] : theme.colors.text.secondary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareStudy}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {renderStudyContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  backButton: {
    padding: theme.spacing[2],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: theme.spacing[2],
    marginLeft: theme.spacing[2],
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  title: {
    ...theme.typography.heading.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  qualityScore: {
    ...theme.typography.caption.medium,
    color: theme.colors.primary[600],
    marginRight: theme.spacing[4],
  },
  viewCount: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
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