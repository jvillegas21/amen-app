import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '@/theme';

interface CustomTabBarProps extends BottomTabBarProps {}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  // Calculate bottom safe area with edge-to-edge support
  const bottomSafeArea = Platform.OS === 'ios'
    ? insets.bottom
    : Math.max(insets.bottom, theme.layout.edgeToEdgeBottomPadding);

  const tabBarHeight = theme.layout.tabBarHeight + (bottomSafeArea > 0 ? bottomSafeArea : theme.spacing[2]);

  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'Discover':
        return focused ? 'compass' : 'compass-outline';
      case 'Groups':
        return focused ? 'people' : 'people-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  return (
    <View style={[styles.container, { height: tabBarHeight }]}>
      {/* Frosted Glass Tab Bar */}
      <View style={[styles.glassTabBar, {
          paddingBottom: bottomSafeArea,
          paddingTop: theme.spacing[2],
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
        }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string' ? options.tabBarLabel :
            typeof options.title === 'string' ? options.title :
            route.name;

          const isFocused = state.index === index;

          // Render the Create button as a special centered tab
          if (route.name === 'Create') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel="Create content"
                accessibilityHint="Create new prayer, event, or group"
                testID={options.tabBarTestID}
                onPress={() => navigation.navigate('Create')}
                style={styles.createTab}
                activeOpacity={0.8}
              >
                <View style={styles.createButton}>
                  <Ionicons
                    name="add"
                    size={24}
                    color={theme.colors.text.inverse}
                  />
                </View>
              </TouchableOpacity>
            );
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={24}
                color={isFocused ? theme.colors.primary[600] : theme.colors.neutral[500]}
              />
              <Text style={[
                styles.tabLabel,
                {
                  color: isFocused ? theme.colors.primary[600] : theme.colors.neutral[500],
                  marginBottom: Platform.OS === 'ios' && bottomSafeArea > 0 ? 0 : theme.spacing[1],
                }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glassTabBar: {
    flexDirection: 'row',
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
  },
  createTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: theme.spacing[1],
    textAlign: 'center',
  },
});

export default CustomTabBar;