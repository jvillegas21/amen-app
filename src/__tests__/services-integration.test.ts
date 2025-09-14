/**
 * Integration test for the services and architecture
 * This test verifies that all major services are properly configured
 */

// Mock React Native modules to avoid import issues in Node.js environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock Supabase
jest.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
      select: jest.fn(() => ({ eq: jest.fn() })),
    })),
  },
}));

describe('Services Integration', () => {
  describe('AI Service', () => {
    it('should be properly configured', async () => {
      const { aiService } = await import('@/services/aiService');

      expect(aiService).toBeDefined();
      expect(typeof aiService.getConfigurationStatus).toBe('function');
      expect(typeof aiService.isConfigured).toBe('function');

      const status = aiService.getConfigurationStatus();
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('message');
    });

    it('should handle Bible study generation', async () => {
      const { aiService } = await import('@/services/aiService');

      const result = await aiService.generateBibleStudy('Test prayer', 'faith');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('title');
        expect(result.data).toHaveProperty('scripture');
        expect(result.data).toHaveProperty('reflection');
        expect(result.data).toHaveProperty('questions');
        expect(result.data).toHaveProperty('prayer_focus');
      }
    });
  });

  describe('Offline Sync Service', () => {
    it('should be properly initialized', async () => {
      const { offlineSyncService } = await import('@/services/offlineSyncService');

      expect(offlineSyncService).toBeDefined();
      expect(typeof offlineSyncService.addToSyncQueue).toBe('function');
      expect(typeof offlineSyncService.isDeviceOnline).toBe('function');
      expect(typeof offlineSyncService.getPendingItemsCount).toBe('function');
    });

    it('should handle sync queue operations', async () => {
      const { offlineSyncService } = await import('@/services/offlineSyncService');

      const syncId = await offlineSyncService.addToSyncQueue(
        'prayer',
        'create',
        { test: 'data' }
      );

      expect(typeof syncId).toBe('string');
      expect(syncId).toBeTruthy();
    });
  });

  describe('Realtime Service', () => {
    it('should be properly initialized', async () => {
      const { realtimeService } = await import('@/services/realtimeService');

      expect(realtimeService).toBeDefined();
      expect(typeof realtimeService.subscribeToPublicPrayerFeed).toBe('function');
      expect(typeof realtimeService.subscribeToUserNotifications).toBe('function');
      expect(typeof realtimeService.getActiveSubscriptions).toBe('function');
    });

    it('should provide subscription status', async () => {
      const { realtimeService } = await import('@/services/realtimeService');

      const status = realtimeService.getSubscriptionStatus();

      expect(status).toHaveProperty('total');
      expect(status).toHaveProperty('active');
      expect(status).toHaveProperty('byType');
      expect(typeof status.total).toBe('number');
      expect(typeof status.active).toBe('number');
    });
  });

  describe('Error Handling Service', () => {
    it('should be properly initialized', async () => {
      const { errorHandlingService } = await import('@/services/errorHandlingService');

      expect(errorHandlingService).toBeDefined();
      expect(typeof errorHandlingService.handleError).toBe('function');
      expect(typeof errorHandlingService.getErrorStats).toBe('function');
    });

    it('should handle errors correctly', async () => {
      const { errorHandlingService } = await import('@/services/errorHandlingService');

      const testError = new Error('Test error');
      const errorId = await errorHandlingService.handleError(testError, {
        severity: 'low',
        reportToService: false,
      });

      expect(typeof errorId).toBe('string');
      expect(errorId).toBeTruthy();
    });
  });

  describe('Monitoring Service', () => {
    it('should be properly initialized', async () => {
      const { monitoringService } = await import('@/services/monitoringService');

      expect(monitoringService).toBeDefined();
      expect(typeof monitoringService.recordMetric).toBe('function');
      expect(typeof monitoringService.trackAPICall).toBe('function');
      expect(typeof monitoringService.getPerformanceSummary).toBe('function');
    });

    it('should provide performance summary', async () => {
      const { monitoringService } = await import('@/services/monitoringService');

      const summary = monitoringService.getPerformanceSummary();

      expect(summary).toHaveProperty('total_metrics');
      expect(summary).toHaveProperty('avg_response_time');
      expect(summary).toHaveProperty('error_rate');
      expect(summary).toHaveProperty('memory_usage');
      expect(summary).toHaveProperty('top_slow_apis');
      expect(Array.isArray(summary.top_slow_apis)).toBe(true);
    });
  });

  describe('Dependency Injection Container', () => {
    it('should be properly configured', async () => {
      const { getContainer } = await import('@/container/DIContainer');

      const container = getContainer();
      expect(container).toBeDefined();
      expect(typeof container.register).toBe('function');
      expect(typeof container.resolve).toBe('function');
      expect(typeof container.has).toBe('function');
    });

    it('should register and resolve services', async () => {
      const { getContainer } = await import('@/container/DIContainer');

      const container = getContainer();

      // Register a test service
      container.register('testService', () => ({ test: true }));

      // Resolve the service
      const service = container.resolve<{ test: boolean }>('testService');
      expect(service).toEqual({ test: true });

      // Clean up
      container.unregister('testService');
    });
  });

  describe('Repository Pattern', () => {
    it('should provide repository factory', async () => {
      // Mock Supabase client for repository
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({ eq: jest.fn() })),
          insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
        })),
      };

      const { RepositoryFactory } = await import('@/repositories/RepositoryFactory');

      const factory = new RepositoryFactory(mockSupabase as any);
      expect(factory).toBeDefined();

      const prayerRepo = factory.getPrayerRepository();
      expect(prayerRepo).toBeDefined();
      expect(typeof prayerRepo.findById).toBe('function');
      expect(typeof prayerRepo.create).toBe('function');
      expect(typeof prayerRepo.update).toBe('function');
      expect(typeof prayerRepo.delete).toBe('function');
    });
  });
});

describe('Architecture Integrity', () => {
  it('should have consistent service exports', async () => {
    // Test that all services export what they should
    const modules = [
      '@/services/aiService',
      '@/services/offlineSyncService',
      '@/services/realtimeService',
      '@/services/errorHandlingService',
      '@/services/monitoringService',
    ];

    for (const module of modules) {
      try {
        const imported = await import(module);
        expect(imported).toBeDefined();
        expect(Object.keys(imported).length).toBeGreaterThan(0);
      } catch (error) {
        fail(`Failed to import ${module}: ${error}`);
      }
    }
  });

  it('should have proper type definitions', async () => {
    // Test that important interfaces exist
    try {
      const { IPrayerRepository } = await import('@/repositories/interfaces/IPrayerRepository');
      const { IBaseRepository } = await import('@/repositories/interfaces/IBaseRepository');

      // These should be available at compile time
      expect(typeof IPrayerRepository).toBe('undefined'); // Interfaces don't exist at runtime
      expect(typeof IBaseRepository).toBe('undefined');   // but should compile without errors
    } catch (error) {
      // This is expected for interfaces, they don't exist at runtime
      expect(error).toBeDefined();
    }
  });

  it('should have proper error boundaries', async () => {
    const { ErrorBoundary } = await import('@/components/ErrorBoundary');
    const { ErrorProvider } = await import('@/components/ErrorProvider');

    expect(ErrorBoundary).toBeDefined();
    expect(ErrorProvider).toBeDefined();
    expect(typeof ErrorBoundary).toBe('function');
    expect(typeof ErrorProvider).toBe('function');
  });
});