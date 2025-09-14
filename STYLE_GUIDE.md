# Amen - Prayer Community App Style Guide

## Overview
This style guide defines the design system and visual standards for the Amen prayer community app. It ensures consistency across all platforms and provides guidelines for app store submission compliance.

## Design Principles

### 1. Accessibility First
- All color combinations meet WCAG AA standards (4.5:1 contrast ratio)
- Minimum touch target size of 44px for all interactive elements
- Support for system font scaling and screen readers
- High contrast mode support

### 2. Spiritual & Welcoming
- Warm, inclusive color palette that reflects spiritual values
- Gentle, rounded corners and soft shadows
- Calming typography that's easy to read during prayer
- Respectful use of religious iconography

### 3. Modern & Clean
- Minimalist design with purposeful white space
- Consistent spacing using 4px base unit
- Subtle animations and micro-interactions
- Platform-appropriate design patterns

## Color System

### Primary Brand Colors
```typescript
primary: {
  50: '#F8FAFC',   // Lightest tint
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#5B21B6',  // Main brand purple
  700: '#4C1D95',
  800: '#3730A3',
  900: '#1E1B4B',  // Darkest shade
}
```

### Semantic Colors
```typescript
success: '#10B981'    // Answered prayers
warning: '#F59E0B'    // Pending prayers
error: '#EF4444'      // Urgent prayers
info: '#3B82F6'       // Information
```

### Prayer-Specific Colors
```typescript
prayer: {
  answered: '#10B981',  // Green - prayers that have been answered
  pending: '#F59E0B',   // Amber - prayers awaiting response
  private: '#6B7280',   // Gray - private prayers
  public: '#5B21B6',    // Purple - public prayers
  urgent: '#EF4444',    // Red - urgent prayer requests
}
```

### Light Theme Colors
```typescript
light: {
  background: {
    primary: '#FFFFFF',    // Main background
    secondary: '#F9FAFB',  // Secondary background
    tertiary: '#F3F4F6',   // Tertiary background
  },
  surface: {
    primary: '#FFFFFF',    // Cards, modals
    secondary: '#F9FAFB',  // Input backgrounds
    card: '#FFFFFF',       // Prayer cards
  },
  text: {
    primary: '#111827',    // Main text
    secondary: '#6B7280',  // Secondary text
    tertiary: '#9CA3AF',   // Tertiary text
    inverse: '#FFFFFF',    // Text on dark backgrounds
  },
  border: {
    primary: '#E5E7EB',    // Main borders
    secondary: '#D1D5DB',  // Secondary borders
    focus: '#5B21B6',      // Focus states
  }
}
```

### Dark Theme Colors
```typescript
dark: {
  background: {
    primary: '#111827',    // Main background
    secondary: '#1F2937',  // Secondary background
    tertiary: '#374151',   // Tertiary background
  },
  surface: {
    primary: '#1F2937',    // Cards, modals
    secondary: '#374151',  // Input backgrounds
    card: '#1F2937',       // Prayer cards
  },
  text: {
    primary: '#F9FAFB',    // Main text
    secondary: '#D1D5DB',  // Secondary text
    tertiary: '#9CA3AF',   // Tertiary text
    inverse: '#111827',    // Text on light backgrounds
  },
  border: {
    primary: '#374151',    // Main borders
    secondary: '#4B5563',  // Secondary borders
    focus: '#A855F7',      // Focus states
  }
}
```

## Typography

### Font Scale
```typescript
fontSizes: {
  xs: 12,    // Captions, labels
  sm: 14,    // Small text
  base: 16,  // Body text
  lg: 18,    // Large body
  xl: 20,    // Small headings
  '2xl': 24, // Medium headings
  '3xl': 30, // Large headings
  '4xl': 36, // Display text
  '5xl': 48, // Hero text
  '6xl': 60, // Large display
}
```

### Typography Styles

#### Display Text
- **Large Display**: 48px, Bold, -0.5 letter spacing
- **Medium Display**: 36px, Bold, -0.25 letter spacing
- **Small Display**: 30px, Semibold, -0.25 letter spacing

#### Headings
- **H1**: 24px, Bold, -0.25 letter spacing
- **H2**: 20px, Semibold, -0.25 letter spacing
- **H3**: 18px, Semibold
- **H4**: 16px, Semibold
- **H5**: 14px, Semibold
- **H6**: 12px, Semibold, Uppercase, 0.5 letter spacing

#### Body Text
- **Large Body**: 18px, Normal weight
- **Medium Body**: 16px, Normal weight
- **Small Body**: 14px, Normal weight

#### Labels
- **Large Label**: 16px, Medium weight
- **Medium Label**: 14px, Medium weight
- **Small Label**: 12px, Medium weight

#### Buttons
- **Large Button**: 16px, Semibold
- **Medium Button**: 14px, Semibold
- **Small Button**: 12px, Semibold

## Spacing System

### Base Unit: 4px
All spacing values are multiples of 4px for visual consistency.

```typescript
spacing: {
  0: 0,      // No spacing
  px: 1,     // 1px
  0.5: 2,    // 2px
  1: 4,      // 4px
  1.5: 6,    // 6px
  2: 8,      // 8px
  2.5: 10,   // 10px
  3: 12,     // 12px
  3.5: 14,   // 14px
  4: 16,     // 16px
  5: 20,     // 20px
  6: 24,     // 24px
  8: 32,     // 32px
  10: 40,    // 40px
  12: 48,    // 48px
  16: 64,    // 64px
  20: 80,    // 80px
  24: 96,    // 96px
}
```

### Semantic Spacing
```typescript
layout: {
  containerPadding: 16,    // Screen padding
  cardPadding: 16,         // Card internal padding
  cardMargin: 12,          // Space between cards
  inputPadding: 12,        // Input field padding
  buttonPadding: 16,       // Button padding
  minTouchTarget: 44,      // Minimum touch target
}
```

## Border Radius

```typescript
borderRadius: {
  none: 0,     // No radius
  sm: 2,       // Small radius
  base: 4,     // Base radius
  md: 6,       // Medium radius
  lg: 8,       // Large radius
  xl: 12,      // Extra large radius
  '2xl': 16,   // 2x large radius
  '3xl': 24,   // 3x large radius
  full: 9999,  // Fully rounded
}
```

## Shadows & Elevation

```typescript
shadows: {
  none: { elevation: 0, shadowOpacity: 0 },
  sm: { elevation: 1, shadowOpacity: 0.18 },
  base: { elevation: 5, shadowOpacity: 0.2 },
  md: { elevation: 8, shadowOpacity: 0.22 },
  lg: { elevation: 12, shadowOpacity: 0.25 },
  xl: { elevation: 20, shadowOpacity: 0.29 },
  '2xl': { elevation: 30, shadowOpacity: 0.35 },
}
```

## Component Guidelines

### Buttons

#### Primary Button
- Background: `primary[600]`
- Text: `text.inverse`
- Border radius: `lg` (8px)
- Padding: `buttonPadding` (16px)
- Shadow: `sm`
- Minimum height: `minTouchTarget` (44px)

#### Secondary Button
- Background: `interactive.secondary`
- Text: `text.primary`
- Border radius: `lg` (8px)
- Padding: `buttonPadding` (16px)
- No shadow

#### Outline Button
- Background: Transparent
- Border: `border.primary`
- Text: `primary[600]`
- Border radius: `lg` (8px)

### Cards

#### Prayer Card
- Background: `surface.card`
- Border radius: `xl` (12px)
- Padding: `cardPadding` (16px)
- Margin: `cardMargin` (12px)
- Shadow: `sm`
- Border: `border.primary`

#### Action Card
- Background: `surface.primary`
- Border radius: `xl` (12px)
- Border: `border.primary`
- No shadow

### Input Fields

#### Default Input
- Background: `background.secondary`
- Border: `border.primary`
- Border radius: `lg` (8px)
- Padding: `inputPadding` (12px)
- Focus border: `border.focus`
- Minimum height: `minTouchTarget` (44px)

### Navigation

#### Tab Bar
- Background: `background.primary`
- Active color: `primary[600]`
- Inactive color: `neutral[500]`
- Height: `tabBarHeight` (60px)
- Border: `border.primary`

#### Header
- Background: `primary[600]`
- Text: `text.inverse`
- Height: `headerHeight` (56px)
- Title style: `navigation.title`

## Accessibility Standards

### Color Contrast
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text**: 3:1 minimum contrast ratio
- **Interactive elements**: 3:1 minimum contrast ratio

### Touch Targets
- **Minimum size**: 44px × 44px
- **Recommended size**: 48px × 48px
- **Spacing**: 8px minimum between touch targets

### Typography
- **Minimum font size**: 12px
- **Recommended font size**: 16px
- **Line height**: 1.5x font size minimum
- **Support for Dynamic Type** (iOS) and **Font Scaling** (Android)

## Platform-Specific Guidelines

### iOS
- Follow Human Interface Guidelines
- Use SF Pro font family
- Support Dark Mode with system appearance
- Use native iOS navigation patterns

### Android
- Follow Material Design principles
- Use Roboto font family
- Support Dark Theme with system settings
- Use Material Design navigation patterns

## Animation Guidelines

### Duration
- **Micro-interactions**: 150-200ms
- **Page transitions**: 300-400ms
- **Loading states**: 500-1000ms

### Easing
- **Ease-out**: For entering animations
- **Ease-in**: For exiting animations
- **Spring**: For interactive feedback

### Principles
- **Purposeful**: Every animation should have a clear purpose
- **Subtle**: Avoid distracting or excessive motion
- **Consistent**: Use the same timing and easing across similar interactions
- **Accessible**: Respect `prefers-reduced-motion` settings

## Iconography

### Icon Library
- **Primary**: Ionicons (Expo Vector Icons)
- **Style**: Outlined icons for inactive states, filled for active states
- **Size**: 20px, 24px, 28px, 32px, 64px
- **Color**: Follow semantic color guidelines

### Prayer-Specific Icons
- **Prayer**: `heart` / `heart-outline`
- **Answered**: `checkmark-circle` / `checkmark-circle-outline`
- **Pending**: `time` / `time-outline`
- **Urgent**: `warning` / `warning-outline`
- **Private**: `lock-closed` / `lock-closed-outline`
- **Public**: `globe` / `globe-outline`

## Implementation Guidelines

### Theme Usage
```typescript
// ✅ Correct - Use theme context
import { useTheme } from '@/theme/ThemeContext';

const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background.primary }}>
      <Text style={{ color: theme.colors.text.primary }}>
        Hello World
      </Text>
    </View>
  );
};

// ❌ Incorrect - Hardcoded colors
const MyComponent = () => {
  return (
    <View style={{ backgroundColor: '#FFFFFF' }}>
      <Text style={{ color: '#000000' }}>
        Hello World
      </Text>
    </View>
  );
};
```

### StyleSheet Creation
```typescript
// ✅ Correct - Theme-based styles
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing[4],
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.body.medium.fontSize,
  },
});

// ❌ Incorrect - Static styles with hardcoded values
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  text: {
    color: '#000000',
    fontSize: 16,
  },
});
```

## Quality Assurance Checklist

### Pre-Submission Checklist
- [ ] All colors use theme system (no hardcoded hex values)
- [ ] Typography follows defined scale
- [ ] Spacing uses 4px base unit
- [ ] Touch targets meet 44px minimum
- [ ] Color contrast meets WCAG AA standards
- [ ] Dark mode support implemented
- [ ] Accessibility labels provided
- [ ] Animations respect reduced motion preferences
- [ ] Icons follow semantic guidelines
- [ ] Platform-specific patterns followed

### Testing Requirements
- [ ] Test on multiple device sizes
- [ ] Test in both light and dark modes
- [ ] Test with accessibility features enabled
- [ ] Test with different font sizes
- [ ] Test with reduced motion enabled
- [ ] Test on both iOS and Android

## Version History

- **v1.0.0** - Initial style guide creation
- **v1.1.0** - Added accessibility guidelines
- **v1.2.0** - Consolidated theme systems
- **v1.3.0** - Added platform-specific guidelines

---

*This style guide is a living document and should be updated as the design system evolves. All team members should follow these guidelines to ensure consistency and quality across the Amen prayer community app.*