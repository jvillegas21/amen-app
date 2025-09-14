/**
 * Input Component - Reusable input field with consistent styling and accessibility
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

export type InputVariant = 'default' | 'outlined' | 'filled';
export type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  variant?: InputVariant;
  size?: InputSize;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  variant = 'default',
  size = 'medium',
  error,
  helperText,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  containerStyle,
  testID,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    textInputProps.onBlur?.(e);
  };

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  const getContainerStyle = () => [
    styles.container,
    styles[variant],
    styles[size],
    isFocused && styles.focused,
    isFocused && styles[`${variant}Focused`],
    error && styles.error,
    error && styles[`${variant}Error`],
    disabled && styles.disabled,
    disabled && styles[`${variant}Disabled`],
    style,
  ];

  const getInputStyle = () => [
    styles.input,
    styles[`${size}Input`],
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    disabled && styles.inputDisabled,
    inputStyle,
  ];

  return (
    <View style={[styles.wrapper, containerStyle]} testID={testID}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={getContainerStyle()}
        onPress={handleContainerPress}
        disabled={disabled}
        activeOpacity={1}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={getIconColor()}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          ref={inputRef}
          style={getInputStyle()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          accessibilityLabel={label || placeholder}
          accessibilityHint={helperText || error}
          accessibilityState={{
            disabled,
            selected: isFocused,
          }}
          {...textInputProps}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            accessibilityRole="button"
            accessibilityLabel={`${rightIcon} button`}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={getIconColor()}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );

  function getIconColor(): string {
    if (disabled) return theme.colors.text.disabled;
    if (error) return theme.colors.error[500];
    if (isFocused) return theme.colors.primary[600];
    return theme.colors.text.secondary;
  }
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing[4],
  },
  labelContainer: {
    marginBottom: theme.spacing[2],
  },
  label: {
    ...theme.typography.label.medium,
    color: theme.colors.text.primary,
  },
  required: {
    color: theme.colors.error[500],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    backgroundColor: theme.colors.background.secondary,
  },
  input: {
    flex: 1,
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
  },
  leftIcon: {
    marginLeft: theme.spacing[3],
    marginRight: theme.spacing[2],
  },
  rightIconContainer: {
    padding: theme.spacing[2],
    marginRight: theme.spacing[1],
  },
  inputWithLeftIcon: {
    marginLeft: 0,
  },
  inputWithRightIcon: {
    marginRight: 0,
  },
  helperText: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
    marginLeft: theme.spacing[1],
  },
  errorText: {
    color: theme.colors.error[500],
  },

  // Variants
  default: {
    backgroundColor: theme.colors.background.secondary,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
  filled: {
    backgroundColor: theme.colors.surface.secondary,
    borderColor: 'transparent',
  },

  // Sizes
  small: {
    minHeight: 36,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
  },
  medium: {
    minHeight: theme.layout.minTouchTarget,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2.5],
  },
  large: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },

  // Size-specific input styles
  smallInput: {
    fontSize: theme.typography.body.small.fontSize,
  },
  mediumInput: {
    fontSize: theme.typography.body.medium.fontSize,
  },
  largeInput: {
    fontSize: theme.typography.body.large.fontSize,
  },

  // States
  focused: {
    borderColor: theme.colors.border.focus,
    borderWidth: 2,
  },
  defaultFocused: {
    backgroundColor: theme.colors.background.primary,
  },
  outlinedFocused: {
    backgroundColor: theme.colors.background.primary,
  },
  filledFocused: {},

  error: {
    borderColor: theme.colors.error[500],
  },
  defaultError: {},
  outlinedError: {},
  filledError: {},

  disabled: {
    opacity: 0.6,
  },
  defaultDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
  outlinedDisabled: {
    backgroundColor: theme.colors.neutral[50],
  },
  filledDisabled: {},
  inputDisabled: {
    color: theme.colors.text.disabled,
  },
});

export default Input;