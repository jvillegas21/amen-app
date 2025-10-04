import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/theme';

export interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'subtle' | 'medium' | 'strong' | 'intense';
  tint?: 'light' | 'dark' | 'default' | 'purple';
  blurType?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  shadow?: 'light' | 'medium' | 'heavy' | 'none';
  depth?: keyof typeof theme.glassmorphism.depth;
  opacity?: keyof typeof theme.glassmorphism.opacity;
  testID?: string;
}

/**
 * GlassView - iOS 26 Liquid Glass component for translucent containers
 * Implements glassmorphism design patterns with backdrop blur and depth
 */
const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 'medium',
  tint = 'light',
  blurType = 'light',
  borderRadius = theme.borderRadius.xl,
  shadow = 'medium',
  depth = 'surface',
  opacity = 'translucent',
  testID,
}) => {
  // Get blur intensity from theme with fallback
  const blurIntensity = theme.glassmorphism?.blur?.[intensity] || 20;

  // Get glass background color based on tint
  const getGlassBackground = () => {
    if (!theme.glassmorphism?.glass) {
      return 'rgba(255, 255, 255, 0.95)'; // more opaque fallback
    }

    switch (tint) {
      case 'purple':
        return theme.glassmorphism.glass.purple || 'rgba(91, 33, 182, 0.25)';
      case 'dark':
        return theme.glassmorphism.glass.dark?.primary || 'rgba(31, 41, 55, 0.95)';
      case 'light':
      case 'default':
      default:
        return theme.glassmorphism.glass.primary || 'rgba(255, 255, 255, 0.95)';
    }
  };

  // Get shadow style
  const getShadowStyle = () => {
    if (shadow === 'none') return theme.shadows.none;
    // Safely access glass shadows with fallback
    if (theme.shadows.glass && theme.shadows.glass[shadow]) {
      return theme.shadows.glass[shadow];
    }
    // Fallback to regular shadows if glass shadows aren't available
    return theme.shadows[shadow] || theme.shadows.md;
  };

  // Get border style
  const getBorderStyle = () => {
    return theme.glassmorphism?.borders?.medium || {
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    };
  };

  // Base container style
  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    zIndex: theme.glassmorphism?.depth?.[depth] || 1,
    ...getShadowStyle(),
    ...style,
  };

  // Glass background style
  const glassStyle: ViewStyle = {
    backgroundColor: getGlassBackground(),
    opacity: theme.glassmorphism?.opacity?.[opacity] || 0.95,
    ...getBorderStyle(),
  };

  // iOS uses BlurView for native blur effect, Android uses translucent background
  if (Platform.OS === 'ios') {
    return (
      <View style={containerStyle} testID={testID}>
        <BlurView
          intensity={blurIntensity}
          tint={blurType}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[StyleSheet.absoluteFillObject, glassStyle]} />
        <View style={styles.contentContainer}>
          {children}
        </View>
      </View>
    );
  }

  // Android fallback with translucent background
  return (
    <View
      style={[
        containerStyle,
        glassStyle,
        styles.contentContainer,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
});

export default GlassView;