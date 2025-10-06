import React, { useCallback, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';
import { MainStackParamList, MainTabParamList } from '@/types/navigation.types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type MainStackNavigation = StackNavigationProp<MainStackParamList>;
type TabNavigation = BottomTabNavigationProp<MainTabParamList>;

interface PersistentFooterNavProps {
  /**
   * Active root tab to highlight in the footer.
   */
  activeTab: keyof MainTabParamList;
  /**
   * Navigation reference used to switch back to the primary tab navigator.
   */
  navigation: CompositeNavigationProp<MainStackNavigation, TabNavigation>;
}

/**
 * PersistentFooterNav renders the bottom navigation bar for stack screens that sit
 * outside the primary TabNavigator. When a user drills into a detail screen we still
 * show the tab controls so they can jump across the main areas without having to backtrack.
 */
const PersistentFooterNav: React.FC<PersistentFooterNavProps> = ({ activeTab, navigation }) => {
  const insets = useSafeAreaInsets();

  const tabs = useMemo(() => ([
    { key: 'Home' as const, label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { key: 'Discover' as const, label: 'Discover', activeIcon: 'compass', inactiveIcon: 'compass-outline' },
    { key: 'Create' as const, label: 'Create', isCreate: true },
    { key: 'Groups' as const, label: 'Groups', activeIcon: 'people', inactiveIcon: 'people-outline' },
    { key: 'Profile' as const, label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ]), []);

  const handleNavigate = useCallback((targetTab: keyof MainTabParamList) => {
    if (targetTab === activeTab) {
      // Ensure we are back on the root tab stack before exiting early.
      navigation.navigate('MainTabs', { screen: targetTab });
      return;
    }

    navigation.navigate('MainTabs', { screen: targetTab });
  }, [activeTab, navigation]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing[2]) }]}>
      <View style={styles.glassTabBar}>
        {tabs.map(tab => {
          if (tab.isCreate) {
            return (
              <TouchableOpacity
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel="Create content"
                accessibilityHint="Create a new prayer, event, or group"
                style={styles.createTab}
                onPress={() => handleNavigate('Create')}
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

          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={isActive ? { selected: true } : {}}
              accessibilityLabel={`${tab.label}, navigation tab`}
              onPress={() => handleNavigate(tab.key)}
              style={styles.tab}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={24}
                color={isActive ? theme.colors.primary[600] : theme.colors.neutral[500]}
              />
              <Text style={[
                styles.tabLabel,
                { color: isActive ? theme.colors.primary[600] : theme.colors.neutral[500] },
              ]}>
                {tab.label}
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  glassTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[2],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: theme.spacing[1],
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
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
});

export default PersistentFooterNav;
