import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Create a stub screen component for development
 */
export const createStubScreen = (name: string) => {
  const StubScreen: React.FC = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
      </View>
    );
  };

  StubScreen.displayName = name;
  return StubScreen;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});