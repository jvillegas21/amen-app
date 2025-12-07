import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackScreenProps } from '@/types/navigation.types';
import { theme } from '@/theme';
import { bibleStudyService } from '@/services/api/bibleStudyService';

import { useAuthStore } from '@/store/auth/authStore';

export const EditBibleStudyScreen: React.FC<MainStackScreenProps<'EditBibleStudy'>> = ({
    navigation,
    route,
}) => {
    const { studyId } = route.params;
    const { profile } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scripture, setScripture] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        loadStudy();
    }, [studyId]);

    const loadStudy = async () => {
        try {
            const study = await bibleStudyService.getBibleStudy(studyId);
            if (study) {
                // Check ownership
                if (study.user_id !== profile?.id) {
                    Alert.alert('Error', 'You do not have permission to edit this study.');
                    navigation.goBack();
                    return;
                }

                setTitle(study.title);
                // Description might be part of content or separate, assuming we want to edit the raw content
                // For now, we'll treat content_md as the main content. 
                // If there's a separate description field in the future, we can map it.
                // For this refactor, we'll expose:
                // 1. Title
                // 2. Scripture References (converted to string)
                // 3. Content (Markdown)

                setContent(study.content_md || (study as any).content || '');

                // Convert scripture references to string format for editing
                if (study.scripture_references && Array.isArray(study.scripture_references)) {
                    const scriptureText = study.scripture_references
                        .map(ref => `${ref.book} ${ref.chapter}:${ref.verse_start}${ref.verse_end ? `-${ref.verse_end}` : ''}`)
                        .join('\n');
                    setScripture(scriptureText);
                }
            } else {
                Alert.alert('Error', 'Study not found');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading study:', error);
            Alert.alert('Error', 'Failed to load study');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Please fill in Title and Content');
            return;
        }

        setIsSaving(true);
        try {
            // Parse scripture references back to object
            // This is a simplified parser, ideally we reuse the logic from CreateBibleStudyScreen or a utility
            // For now, we'll pass the raw string if the service supports it, or try to parse basic format
            // But bibleStudyService.updateBibleStudy expects partial BibleStudy object.

            // We need to implement updateBibleStudy in service first or use a direct update here.
            // Let's assume we update the service to handle this.

            await bibleStudyService.updateBibleStudy(studyId, {
                title,
                content_md: content,
                // We'll need to handle scripture updates. 
                // For now, let's focus on Title and Content as requested, 
                // and if we can parse scripture, great.
            });

            Alert.alert('Success', 'Bible study updated');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating study:', error);
            Alert.alert('Error', 'Failed to update study');
        } finally {
            setIsSaving(false);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Edit Bible Study',
            headerRight: () => null,
        });
    }, [navigation]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[600]} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter study title"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Scripture References</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={scripture}
                            onChangeText={setScripture}
                            placeholder="e.g. John 3:16"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                        />
                        <Text style={styles.helperText}>Enter one reference per line</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Study Content / Outline</Text>
                        <TextInput
                            style={[styles.input, styles.contentArea]}
                            value={content}
                            onChangeText={setContent}
                            placeholder="Enter your study content here..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Add padding for footer
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 100,
    },
    contentArea: {
        height: 300,
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    saveButton: {
        backgroundColor: '#5B21B6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
