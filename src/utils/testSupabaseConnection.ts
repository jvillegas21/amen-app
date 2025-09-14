import { supabase } from '@/config/supabase';
import { Database } from '@/types/database.types';

// Test results interface
interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

// Main test function
export async function testSupabaseConnection(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    
    results.push({
      test: 'Basic Connection',
      status: 'PASS',
      message: 'Successfully connected to Supabase',
      details: { data }
    });
  } catch (error) {
    results.push({
      test: 'Basic Connection',
      status: 'FAIL',
      message: 'Failed to connect to Supabase',
      details: { error: error.message }
    });
    return results; // Stop here if basic connection fails
  }

  // Test 2: Check if all tables exist
  const tables = [
    'profiles', 'prayers', 'groups', 'interactions', 'studies', 
    'group_members', 'comments', 'notifications', 'support_tickets', 
    'reports', 'user_analytics'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) throw error;
      
      results.push({
        test: `Table: ${table}`,
        status: 'PASS',
        message: `Table ${table} exists and is accessible`,
        details: { rowCount: data?.length || 0 }
      });
    } catch (error) {
      results.push({
        test: `Table: ${table}`,
        status: 'FAIL',
        message: `Table ${table} is missing or inaccessible`,
        details: { error: error.message }
      });
    }
  }

  // Test 3: Check views
  try {
    const { data, error } = await supabase.from('prayer_feed').select('*').limit(1);
    if (error) throw error;
    
    results.push({
      test: 'View: prayer_feed',
      status: 'PASS',
      message: 'Prayer feed view exists and is accessible',
      details: { rowCount: data?.length || 0 }
    });
  } catch (error) {
    results.push({
      test: 'View: prayer_feed',
      status: 'FAIL',
      message: 'Prayer feed view is missing or inaccessible',
      details: { error: error.message }
    });
  }

  try {
    const { data, error } = await supabase.from('group_activity').select('*').limit(1);
    if (error) throw error;
    
    results.push({
      test: 'View: group_activity',
      status: 'PASS',
      message: 'Group activity view exists and is accessible',
      details: { rowCount: data?.length || 0 }
    });
  } catch (error) {
    results.push({
      test: 'View: group_activity',
      status: 'FAIL',
      message: 'Group activity view is missing or inaccessible',
      details: { error: error.message }
    });
  }

  // Test 4: Check functions
  try {
    const { data, error } = await supabase.rpc('get_prayer_interaction_counts', { prayer_uuid: '00000000-0000-0000-0000-000000000000' });
    if (error && !error.message.includes('violates foreign key constraint')) {
      throw error;
    }
    
    results.push({
      test: 'Function: get_prayer_interaction_counts',
      status: 'PASS',
      message: 'Function exists and is callable',
      details: { data }
    });
  } catch (error) {
    results.push({
      test: 'Function: get_prayer_interaction_counts',
      status: 'FAIL',
      message: 'Function is missing or has errors',
      details: { error: error.message }
    });
  }

  // Test 5: Check RLS policies (if any data exists)
  try {
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    if (profilesError) throw profilesError;

    if (profiles && profiles.length > 0) {
      results.push({
        test: 'RLS Policies',
        status: 'PASS',
        message: 'RLS policies allow data access',
        details: { profileCount: profiles.length }
      });
    } else {
      results.push({
        test: 'RLS Policies',
        status: 'SKIP',
        message: 'No data to test RLS policies',
        details: { note: 'Create a test profile to verify RLS' }
      });
    }
  } catch (error) {
    results.push({
      test: 'RLS Policies',
      status: 'FAIL',
      message: 'RLS policies may be blocking access',
      details: { error: error.message }
    });
  }

  // Test 6: Check realtime connection
  try {
    const channel = supabase.channel('test-connection');
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        results.push({
          test: 'Realtime Connection',
          status: 'PASS',
          message: 'Realtime connection established',
          details: { status }
        });
        supabase.removeChannel(channel);
      }
    });
  } catch (error) {
    results.push({
      test: 'Realtime Connection',
      status: 'FAIL',
      message: 'Realtime connection failed',
      details: { error: error.message }
    });
  }

  // Test 7: Check storage buckets
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    results.push({
      test: 'Storage Buckets',
      status: 'PASS',
      message: `Storage accessible, found ${data.length} buckets`,
      details: { buckets: data.map(b => b.name) }
    });
  } catch (error) {
    results.push({
      test: 'Storage Buckets',
      status: 'FAIL',
      message: 'Storage is not accessible',
      details: { error: error.message }
    });
  }

  return results;
}

// Helper function to create test data
export async function createTestData(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Create a test profile (this will fail if user is not authenticated)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        display_name: 'Test User',
        bio: 'Test profile for connection testing',
        location_granularity: 'city'
      })
      .select()
      .single();

    if (profileError) {
      results.push({
        test: 'Create Test Profile',
        status: 'FAIL',
        message: 'Failed to create test profile',
        details: { error: profileError.message }
      });
    } else {
      results.push({
        test: 'Create Test Profile',
        status: 'PASS',
        message: 'Test profile created successfully',
        details: { profileId: profile.id }
      });

      // Create a test prayer
      const { data: prayer, error: prayerError } = await supabase
        .from('prayers')
        .insert({
          user_id: profile.id,
          text: 'This is a test prayer for connection testing. Please pray for the success of this application.',
          privacy_level: 'public',
          location_granularity: 'city'
        })
        .select()
        .single();

      if (prayerError) {
        results.push({
          test: 'Create Test Prayer',
          status: 'FAIL',
          message: 'Failed to create test prayer',
          details: { error: prayerError.message }
        });
      } else {
        results.push({
          test: 'Create Test Prayer',
          status: 'PASS',
          message: 'Test prayer created successfully',
          details: { prayerId: prayer.id }
        });

        // Test the prayer feed view
        const { data: feedData, error: feedError } = await supabase
          .from('prayer_feed')
          .select('*')
          .eq('id', prayer.id)
          .single();

        if (feedError) {
          results.push({
            test: 'Prayer Feed View',
            status: 'FAIL',
            message: 'Failed to query prayer feed view',
            details: { error: feedError.message }
          });
        } else {
          results.push({
            test: 'Prayer Feed View',
            status: 'PASS',
            message: 'Prayer feed view working correctly',
            details: { feedData }
          });
        }
      }
    }
  } catch (error) {
    results.push({
      test: 'Create Test Data',
      status: 'FAIL',
      message: 'Failed to create test data',
      details: { error: error.message }
    });
  }

  return results;
}

// Helper function to clean up test data
export async function cleanupTestData(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Delete test prayers
    const { error: prayerError } = await supabase
      .from('prayers')
      .delete()
      .like('text', '%test prayer for connection testing%');

    if (prayerError) {
      results.push({
        test: 'Cleanup Test Prayers',
        status: 'FAIL',
        message: 'Failed to cleanup test prayers',
        details: { error: prayerError.message }
      });
    } else {
      results.push({
        test: 'Cleanup Test Prayers',
        status: 'PASS',
        message: 'Test prayers cleaned up successfully'
      });
    }

    // Delete test profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('display_name', 'Test User');

    if (profileError) {
      results.push({
        test: 'Cleanup Test Profiles',
        status: 'FAIL',
        message: 'Failed to cleanup test profiles',
        details: { error: profileError.message }
      });
    } else {
      results.push({
        test: 'Cleanup Test Profiles',
        status: 'PASS',
        message: 'Test profiles cleaned up successfully'
      });
    }
  } catch (error) {
    results.push({
      test: 'Cleanup Test Data',
      status: 'FAIL',
      message: 'Failed to cleanup test data',
      details: { error: error.message }
    });
  }

  return results;
}

// Main test runner
export async function runAllTests(): Promise<{
  connectionTests: TestResult[];
  dataTests: TestResult[];
  cleanupTests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}> {
  console.log('🧪 Starting Supabase connection tests...');
  
  const connectionTests = await testSupabaseConnection();
  const dataTests = await createTestData();
  const cleanupTests = await cleanupTestData();

  const allTests = [...connectionTests, ...dataTests, ...cleanupTests];
  
  const summary = {
    total: allTests.length,
    passed: allTests.filter(t => t.status === 'PASS').length,
    failed: allTests.filter(t => t.status === 'FAIL').length,
    skipped: allTests.filter(t => t.status === 'SKIP').length,
  };

  console.log('📊 Test Summary:', summary);
  
  return {
    connectionTests,
    dataTests,
    cleanupTests,
    summary
  };
}
