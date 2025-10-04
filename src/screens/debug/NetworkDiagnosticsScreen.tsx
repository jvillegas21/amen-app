import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string;
  details?: any;
}

export default function NetworkDiagnosticsScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setResults(prev => {
      const index = prev.findIndex(r => r.name === name);
      const newResult = { name, status, message, details };
      if (index >= 0) {
        const newResults = [...prev];
        newResults[index] = newResult;
        return newResults;
      }
      return [...prev, newResult];
    });
  };

  const testNetInfo = async () => {
    updateResult('NetInfo', 'running', 'Checking network state...', undefined);
    try {
      const state = await NetInfo.fetch();
      updateResult('NetInfo', 'success', `Connected: ${state.isConnected}`, {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
      return state.isConnected;
    } catch (error) {
      updateResult('NetInfo', 'failed', error instanceof Error ? error.message : 'Failed', undefined);
      return false;
    }
  };

  const testFetch = async (name: string, url: string, options?: RequestInit) => {
    updateResult(name, 'running', `Fetching ${url}...`, undefined);
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      const duration = Date.now() - startTime;

      const text = await response.text();

      updateResult(name, 'success', `${response.status} ${response.statusText}`, {
        status: response.status,
        duration: `${duration}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        bodyPreview: text.substring(0, 200),
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      updateResult(name, 'failed', errorMsg, {
        error: errorMsg,
        name: error instanceof Error ? error.name : 'Unknown',
      });
      return false;
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: NetInfo
    await testNetInfo();

    // Test 2: Google (plain HTTPS)
    await testFetch('Google', 'https://www.google.com');

    // Test 3: Example API
    await testFetch('JSONPlaceholder', 'https://jsonplaceholder.typicode.com/posts/1');

    // Test 4: Supabase URL
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
    if (supabaseUrl) {
      await testFetch('Supabase (base)', supabaseUrl);

      // Test 5: Supabase API
      const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey;
      if (supabaseKey) {
        await testFetch('Supabase API', `${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });
      }
    } else {
      updateResult('Supabase', 'failed', 'No Supabase URL in config', undefined);
    }

    setTesting(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'failed': return '#ef4444';
      case 'running': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Diagnostics</Text>

      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Configuration:</Text>
        <Text style={styles.configText}>
          Supabase URL: {Constants.expoConfig?.extra?.supabaseUrl || 'NOT SET'}
        </Text>
        <Text style={styles.configText}>
          Anon Key: {Constants.expoConfig?.extra?.supabaseAnonKey ? '✓ Set' : '✗ Missing'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={runAllTests}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Tests</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={styles.resultName}>{result.name}</Text>
            </View>
            <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
              {result.message}
            </Text>
            {result.details && (
              <View style={styles.details}>
                <Text style={styles.detailsText}>
                  {JSON.stringify(result.details, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  configSection: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  configText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  details: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  detailsText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#374151',
  },
});
