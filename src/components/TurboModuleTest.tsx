/**
 * Test component to verify TurboModule polyfill is working
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { turboModuleManager } from '@/utils/turboModulePolyfill';

export function TurboModuleTest() {
  const [platformConstants, setPlatformConstants] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [managerStatus, setManagerStatus] = useState<any>(null);

  useEffect(() => {
    const testPlatformConstants = () => {
      try {
        // Get manager status
        setManagerStatus(turboModuleManager.getStatus());

        // Try to access PlatformConstants through multiple methods
        let PlatformConstants = null;
        let constants = null;

        // Method 1: Try global TurboModuleRegistry
        if (global.TurboModuleRegistry && global.TurboModuleRegistry.getEnforcing) {
          PlatformConstants = global.TurboModuleRegistry.getEnforcing('PlatformConstants');
        }
        // Method 2: Try direct global access
        else if (global.PlatformConstants) {
          PlatformConstants = global.PlatformConstants;
        }
        // Method 3: Try require (fallback)
        else {
          try {
            const { TurboModuleRegistry } = require('react-native/Libraries/TurboModule/TurboModuleRegistry');
            if (TurboModuleRegistry && TurboModuleRegistry.getEnforcing) {
              PlatformConstants = TurboModuleRegistry.getEnforcing('PlatformConstants');
            }
          } catch (requireError) {
            // Ignore require errors, we'll use polyfill
          }
        }

        if (PlatformConstants && PlatformConstants.getConstants) {
          constants = PlatformConstants.getConstants();
          setPlatformConstants(constants);
          setError(null);
        } else {
          setError('PlatformConstants not available through any method');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testPlatformConstants();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TurboModule Test</Text>

      {/* Manager Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manager Status:</Text>
        <Text style={styles.info}>
          {managerStatus?.installed ? '✅ Installed' : '❌ Not Installed'}
        </Text>
        <Text style={styles.info}>
          Polyfills: {managerStatus?.polyfillCount || 0} ({managerStatus?.polyfills?.join(', ')})
        </Text>
      </View>

      {/* Platform Constants Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PlatformConstants Test:</Text>
        {error ? (
          <Text style={styles.error}>Error: {error}</Text>
        ) : (
          <View>
            <Text style={styles.success}>✅ PlatformConstants loaded successfully!</Text>
            <Text style={styles.info}>OS: {platformConstants?.systemName}</Text>
            <Text style={styles.info}>Version: {platformConstants?.osVersion}</Text>
            <Text style={styles.info}>Timezone: {platformConstants?.timezone}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  success: {
    color: 'green',
    fontSize: 16,
    marginBottom: 5,
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
  info: {
    fontSize: 14,
    marginBottom: 2,
  },
});
