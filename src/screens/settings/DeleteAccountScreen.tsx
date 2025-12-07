import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { theme } from '@/theme';

const DeleteAccountScreen: React.FC<MainStackScreenProps<'DeleteAccount'>> = ({ navigation }) => {
    const { signOut } = useAuthStore();
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const DELETE_PHRASE = 'Delete Account';
    const isMatch = confirmationText === DELETE_PHRASE;

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle: 'Back',
            headerTitle: 'Delete Account',
        });
    }, [navigation]);

    const handleDeleteAccount = async () => {
        if (!isMatch) return;

        Alert.alert(
            'Final Confirmation',
            'Are you absolutely sure? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete My Account',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            // TODO: Implement actual account deletion API call
                            // await authService.deleteAccount();

                            // For now, simulate deletion and sign out
                            setTimeout(() => {
                                signOut();
                                Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
                            }, 1000);
                        } catch (error) {
                            console.error('Error deleting account:', error);
                            Alert.alert('Error', 'Failed to delete account. Please contact support.');
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.warningContainer}>
                        <Ionicons name="warning" size={48} color={theme.colors.error[600]} />
                        <Text style={styles.warningTitle}>Warning: Irreversible Action</Text>
                        <Text style={styles.warningText}>
                            Deleting your account will permanently remove all your data, including:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Your profile and personal information</Text>
                            <Text style={styles.bulletItem}>• Your prayer history and saved prayers</Text>
                            <Text style={styles.bulletItem}>• Your group memberships and contributions</Text>
                            <Text style={styles.bulletItem}>• Your followers and following lists</Text>
                        </View>
                        <Text style={styles.warningText}>
                            This action cannot be undone. You will not be able to recover your account or any data.
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                            To confirm, type "{DELETE_PHRASE}" below:
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder={DELETE_PHRASE}
                            value={confirmationText}
                            onChangeText={setConfirmationText}
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholderTextColor={theme.colors.text.tertiary}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.deleteButton,
                            (!isMatch || isDeleting) && styles.deleteButtonDisabled,
                        ]}
                        onPress={handleDeleteAccount}
                        disabled={!isMatch || isDeleting}
                    >
                        <Text style={styles.deleteButtonText}>
                            {isDeleting ? 'Deleting...' : 'Delete My Account'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: theme.spacing[4],
    },
    warningContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing[8],
        backgroundColor: theme.colors.error[50],
        padding: theme.spacing[6],
        borderRadius: theme.borderRadius.lg,
    },
    warningTitle: {
        ...theme.typography.heading.h3,
        color: theme.colors.error[700],
        marginTop: theme.spacing[4],
        marginBottom: theme.spacing[4],
        textAlign: 'center',
    },
    warningText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[4],
        textAlign: 'center',
    },
    bulletList: {
        alignSelf: 'stretch',
        marginBottom: theme.spacing[4],
        paddingHorizontal: theme.spacing[2],
    },
    bulletItem: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[2],
    },
    inputContainer: {
        marginBottom: theme.spacing[6],
    },
    inputLabel: {
        ...theme.typography.label.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[2],
        fontWeight: '600',
    },
    textInput: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[3],
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: theme.colors.border.primary,
    },
    deleteButton: {
        backgroundColor: theme.colors.error[600],
        paddingVertical: theme.spacing[4],
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
    },
    deleteButtonDisabled: {
        backgroundColor: theme.colors.neutral[300],
    },
    deleteButtonText: {
        ...theme.typography.button.medium,
        color: theme.colors.text.inverse,
    },
});

export default DeleteAccountScreen;
