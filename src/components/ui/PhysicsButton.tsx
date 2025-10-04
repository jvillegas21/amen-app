import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { theme } from '@/theme';
import * as Haptics from 'expo-haptics';

export interface PhysicsButtonProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animationType?: 'scale' | 'scale-opacity' | 'subtle';
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  springConfig?: 'gentle' | 'snappy' | 'bouncy';
  testID?: string;
}

/**
 * PhysicsButton - iOS 26 enhanced touchable with physics-based animations
 * Provides realistic spring animations and haptic feedback
 */
const PhysicsButton: React.FC<PhysicsButtonProps> = ({
  children,
  style,
  animationType = 'scale',
  hapticFeedback = 'light',
  springConfig = 'snappy',
  testID,
  onPressIn,
  onPressOut,
  onPress,
  ...pressableProps
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Get animation values based on type
  const getAnimationValues = () => {
    const defaultScale = theme.motionDesign?.transforms?.press?.scale || 0.96;
    const defaultOpacity = theme.motionDesign?.transforms?.press?.opacity || 0.8;

    switch (animationType) {
      case 'scale':
        return {
          pressScale: defaultScale,
          pressOpacity: 1,
        };
      case 'scale-opacity':
        return {
          pressScale: defaultScale,
          pressOpacity: defaultOpacity,
        };
      case 'subtle':
        return {
          pressScale: 0.98,
          pressOpacity: 0.9,
        };
      default:
        return {
          pressScale: defaultScale,
          pressOpacity: defaultOpacity,
        };
    }
  };

  // Get spring configuration
  const getSpringConfig = () => {
    const defaultConfigs = {
      gentle: { tension: 120, friction: 14, useNativeDriver: true },
      snappy: { tension: 200, friction: 10, useNativeDriver: true },
      bouncy: { tension: 180, friction: 6, useNativeDriver: true },
    };
    return theme.motionDesign?.springs?.[springConfig] || defaultConfigs[springConfig];
  };

  // Get haptic feedback style
  const getHapticStyle = () => {
    switch (hapticFeedback) {
      case 'light':
        return Haptics.ImpactFeedbackStyle.Light;
      case 'medium':
        return Haptics.ImpactFeedbackStyle.Medium;
      case 'heavy':
        return Haptics.ImpactFeedbackStyle.Heavy;
      default:
        return Haptics.ImpactFeedbackStyle.Light;
    }
  };

  const handlePressIn = useCallback(
    (event: any) => {
      const { pressScale, pressOpacity } = getAnimationValues();
      const springConfig = getSpringConfig();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: pressScale,
          ...springConfig,
        }),
        Animated.timing(opacityAnim, {
          toValue: pressOpacity,
          ...(theme.motionDesign?.timings?.quick || { duration: 200, useNativeDriver: true }),
        }),
      ]).start();

      onPressIn?.(event);
    },
    [scaleAnim, opacityAnim, animationType, springConfig, onPressIn]
  );

  const handlePressOut = useCallback(
    (event: any) => {
      const springConfig = getSpringConfig();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...springConfig,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          ...(theme.motionDesign?.timings?.smooth || { duration: 300, useNativeDriver: true }),
        }),
      ]).start();

      onPressOut?.(event);
    },
    [scaleAnim, opacityAnim, springConfig, onPressOut]
  );

  const handlePress = useCallback(
    async (event: any) => {
      // Trigger haptic feedback
      if (hapticFeedback !== 'none') {
        await Haptics.impactAsync(getHapticStyle());
      }

      onPress?.(event);
    },
    [hapticFeedback, onPress]
  );

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
      testID={testID}
    >
      <Pressable
        style={styles.pressable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...pressableProps}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
});

export default PhysicsButton;