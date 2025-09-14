import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { runAllTests, TestResult } from '@/utils/testSupabaseConnection';

interface TestResults {
  connectionTests: TestResult[];
  dataTests: TestResult[];
  cleanupTests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

export function SupabaseTestComponent() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await runAllTests();
      setResults(testResults);
    } catch (error) {
      Alert.alert('Test Error', `Failed to run tests: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'theme.colors.success[700]';
      case 'FAIL': return 'theme.colors.error[700]';
      case 'SKIP': return 'theme.colors.warning[700]';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'SKIP': return '⏭️';
      default: return '❓';
    }
  };

  const renderTestResults = (tests: TestResult[], title: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {tests.map((test, index) => (
        <View key={index} style={styles.testItem}>
          <View style={styles.testHeader}>
            <Text style={styles.testIcon}>{getStatusIcon(test.status)}</Text>
            <Text style={[styles.testStatus, { color: getStatusColor(test.status) }]}>
              {test.status}
            </Text>
            <Text style={styles.testName}>{test.test}</Text>
          </View>
          <Text style={styles.testMessage}>{test.message}</Text>
          {test.details && (
            <Text style={styles.testDetails}>
              {JSON.stringify(test.details, null, 2)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Connection Test</Text>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Text>
        </TouchableOpacity>
      </View>

      {results && (
        <View style={styles.results}>
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Test Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: 'theme.colors.success[700]' }]}>
                  {results.summary.passed}
                </Text>
                <Text style={styles.statLabel}>Passed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: 'theme.colors.error[700]' }]}>
                  {results.summary.failed}
                </Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: 'theme.colors.warning[700]' }]}>
                  {results.summary.skipped}
                </Text>
                <Text style={styles.statLabel}>Skipped</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#6B7280' }]}>
                  {results.summary.total}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>

          {renderTestResults(results.connectionTests, 'Connection Tests')}
          {renderTestResults(results.dataTests, 'Data Tests')}
          {renderTestResults(results.cleanupTests, 'Cleanup Tests')}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  results: {
    marginTop: 16,
  },
  summary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  testItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testIcon: {
    marginRight: 8,
  },
  testStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 50,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  testMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  testDetails: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
});
