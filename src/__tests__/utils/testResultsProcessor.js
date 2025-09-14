/**
 * Test Results Processor
 * 
 * Processes test results to provide better error reporting and insights.
 */

class TestResultsProcessor {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      testSuites: [],
      errors: [],
      warnings: [],
      coverage: null,
    };
  }

  process(results) {
    this.results.totalTests = results.numTotalTests;
    this.results.passedTests = results.numPassedTests;
    this.results.failedTests = results.numFailedTests;
    this.results.skippedTests = results.numPendingTests;

    // Process test suites
    results.testResults.forEach(suite => {
      const suiteResult = {
        name: suite.testFilePath,
        status: suite.status,
        duration: suite.perfStats.end - suite.perfStats.start,
        tests: suite.testResults.map(test => ({
          name: test.title,
          status: test.status,
          duration: test.duration,
          failureMessages: test.failureMessages,
          location: test.location,
        })),
        console: suite.console,
        coverage: suite.coverageMap,
      };

      this.results.testSuites.push(suiteResult);

      // Collect errors and warnings
      if (suite.status === 'failed') {
        suite.testResults.forEach(test => {
          if (test.status === 'failed') {
            this.results.errors.push({
              suite: suite.testFilePath,
              test: test.title,
              message: test.failureMessages.join('\n'),
            });
          }
        });
      }

      // Check for console warnings
      if (suite.console && suite.console.length > 0) {
        suite.console.forEach(log => {
          if (log.type === 'warn') {
            this.results.warnings.push({
              suite: suite.testFilePath,
              message: log.message,
            });
          }
        });
      }
    });

    // Process coverage if available
    if (results.coverageMap) {
      this.results.coverage = this.processCoverage(results.coverageMap);
    }

    return this.generateReport();
  }

  processCoverage(coverageMap) {
    const coverage = {
      global: {
        statements: { total: 0, covered: 0, percentage: 0 },
        branches: { total: 0, covered: 0, percentage: 0 },
        functions: { total: 0, covered: 0, percentage: 0 },
        lines: { total: 0, covered: 0, percentage: 0 },
      },
      files: {},
    };

    coverageMap.files().forEach(file => {
      const fileCoverage = coverageMap.fileCoverageFor(file);
      const summary = fileCoverage.getCoverageSummary();

      coverage.files[file] = {
        statements: summary.statements,
        branches: summary.branches,
        functions: summary.functions,
        lines: summary.lines,
      };

      // Add to global totals
      coverage.global.statements.total += summary.statements.total;
      coverage.global.statements.covered += summary.statements.covered;
      coverage.global.branches.total += summary.branches.total;
      coverage.global.branches.covered += summary.branches.covered;
      coverage.global.functions.total += summary.functions.total;
      coverage.global.functions.covered += summary.functions.covered;
      coverage.global.lines.total += summary.lines.total;
      coverage.global.lines.covered += summary.lines.covered;
    });

    // Calculate percentages
    Object.keys(coverage.global).forEach(key => {
      const metric = coverage.global[key];
      metric.percentage = metric.total > 0 ? (metric.covered / metric.total) * 100 : 0;
    });

    return coverage;
  }

  generateReport() {
    const report = {
      summary: this.generateSummary(),
      testSuites: this.generateTestSuiteReport(),
      errors: this.generateErrorReport(),
      warnings: this.generateWarningReport(),
      coverage: this.generateCoverageReport(),
      recommendations: this.generateRecommendations(),
    };

    // Log summary to console
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`Passed: ${this.results.passedTests} (${this.getPercentage(this.results.passedTests, this.results.totalTests)}%)`);
    console.log(`Failed: ${this.results.failedTests} (${this.getPercentage(this.results.failedTests, this.results.totalTests)}%)`);
    console.log(`Skipped: ${this.results.skippedTests} (${this.getPercentage(this.results.skippedTests, this.results.totalTests)}%)`);

    if (this.results.coverage) {
      console.log('\nCOVERAGE SUMMARY:');
      console.log(`Statements: ${this.results.coverage.global.statements.percentage.toFixed(2)}%`);
      console.log(`Branches: ${this.results.coverage.global.branches.percentage.toFixed(2)}%`);
      console.log(`Functions: ${this.results.coverage.global.functions.percentage.toFixed(2)}%`);
      console.log(`Lines: ${this.results.coverage.global.lines.percentage.toFixed(2)}%`);
    }

    if (this.results.errors.length > 0) {
      console.log('\nFAILED TESTS:');
      this.results.errors.forEach(error => {
        console.log(`  ❌ ${error.suite}: ${error.test}`);
        console.log(`     ${error.message.split('\n')[0]}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log('\nWARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning.suite}: ${warning.message}`);
      });
    }

    console.log('='.repeat(80) + '\n');

    return report;
  }

  generateSummary() {
    return {
      total: this.results.totalTests,
      passed: this.results.passedTests,
      failed: this.results.failedTests,
      skipped: this.results.skippedTests,
      passRate: this.getPercentage(this.results.passedTests, this.results.totalTests),
      duration: this.results.testSuites.reduce((total, suite) => total + suite.duration, 0),
    };
  }

  generateTestSuiteReport() {
    return this.results.testSuites.map(suite => ({
      name: suite.name,
      status: suite.status,
      duration: suite.duration,
      testCount: suite.tests.length,
      passCount: suite.tests.filter(t => t.status === 'passed').length,
      failCount: suite.tests.filter(t => t.status === 'failed').length,
      skipCount: suite.tests.filter(t => t.status === 'pending').length,
    }));
  }

  generateErrorReport() {
    return this.results.errors.map(error => ({
      suite: error.suite,
      test: error.test,
      message: error.message,
      type: this.categorizeError(error.message),
    }));
  }

  generateWarningReport() {
    return this.results.warnings.map(warning => ({
      suite: warning.suite,
      message: warning.message,
      type: this.categorizeWarning(warning.message),
    }));
  }

  generateCoverageReport() {
    if (!this.results.coverage) return null;

    return {
      global: this.results.coverage.global,
      lowCoverageFiles: Object.entries(this.results.coverage.files)
        .filter(([file, coverage]) => coverage.lines.percentage < 80)
        .map(([file, coverage]) => ({
          file,
          coverage: coverage.lines.percentage,
        })),
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.failedTests > 0) {
      recommendations.push({
        type: 'error',
        message: `${this.results.failedTests} tests failed. Review error messages and fix issues.`,
      });
    }

    if (this.results.coverage && this.results.coverage.global.lines.percentage < 80) {
      recommendations.push({
        type: 'coverage',
        message: `Coverage is below 80%. Consider adding more tests.`,
      });
    }

    if (this.results.warnings.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${this.results.warnings.length} warnings found. Review and address warnings.`,
      });
    }

    const slowSuites = this.results.testSuites.filter(suite => suite.duration > 5000);
    if (slowSuites.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `${slowSuites.length} test suites are slow (>5s). Consider optimizing tests.`,
      });
    }

    return recommendations;
  }

  categorizeError(message) {
    if (message.includes('PGRST205') || message.includes('table not found')) {
      return 'database_schema';
    }
    if (message.includes('PGRST202') || message.includes('column not found')) {
      return 'database_column';
    }
    if (message.includes('PGRST204') || message.includes('function not found')) {
      return 'database_function';
    }
    if (message.includes('authentication') || message.includes('not authenticated')) {
      return 'authentication';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'network';
    }
    return 'general';
  }

  categorizeWarning(message) {
    if (message.includes('deprecated')) {
      return 'deprecation';
    }
    if (message.includes('memory') || message.includes('leak')) {
      return 'memory';
    }
    if (message.includes('performance') || message.includes('slow')) {
      return 'performance';
    }
    return 'general';
  }

  getPercentage(value, total) {
    return total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
  }
}

module.exports = new TestResultsProcessor();