import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SupabaseTestComponent } from '@/components/common/SupabaseTestComponent';

export default function SupabaseTestScreen() {
  return (
    <View style={styles.container}>
      <SupabaseTestComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
