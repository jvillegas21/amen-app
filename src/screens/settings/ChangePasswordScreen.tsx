import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { authService } from '@/services/auth/authService';
import { Ionicons } from '@expo/vector-icons';

/**
 * Change Password Screen - Update user password
 */
const ChangePasswordScreen: React.FC<RootStackScreenProps<'ChangePassword'>> = ({ navigation }) => {
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // First verify current password by attempting to sign in
      await authService.signIn(user?.email || '', formData.currentPassword);
      
      // If successful, update to new password
      await authService.updatePassword(formData.newPassword);
      
      Alert.alert(
        'Success', 
        'Password updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Password change error:', error);
      if (error instanceof Error && error.message.includes('Invalid credentials')) {
        Alert.alert('Error', 'Current password is incorrect');
      } else {
        Alert.alert('Error', 'Failed to update password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    onToggleShow: () => void,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggleShow}
          disabled={isLoading}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Update your password to keep your account secure
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {renderPasswordInput(
              'Current Password',
              formData.currentPassword,
              (text) => handleInputChange('currentPassword', text),
              showCurrentPassword,
              () => setShowCurrentPassword(!showCurrentPassword),
              'Enter your current password'
            )}

            {renderPasswordInput(
              'New Password',
              formData.newPassword,
              (text) => handleInputChange('newPassword', text),
              showNewPassword,
              () => setShowNewPassword(!showNewPassword),
              'Enter your new password'
            )}

            {renderPasswordInput(
              'Confirm New Password',
              formData.confirmPassword,
              (text) => handleInputChange('confirmPassword', text),
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword),
              'Confirm your new password'
            )}

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={styles.requirementText}>• At least 8 characters long</Text>
              <Text style={styles.requirementText}>• Different from your current password</Text>
            </View>

            {/* Change Password Button */}
            <TouchableOpacity
              style={[styles.changeButton, isLoading && styles.changeButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.changeButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.securityInfoText}>
              Your password is encrypted and stored securely. We never store your password in plain text.
            </Text>
          </View>
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
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  changeButton: {
    height: 56,
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  changeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityInfoText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default ChangePasswordScreen;