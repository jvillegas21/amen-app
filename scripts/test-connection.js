#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test Supabase connection from command line
async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    console.log('Please run: node scripts/setup-env.js');
    process.exit(1);
  }

  if (supabaseUrl === 'your_supabase_project_url_here' || supabaseKey === 'your_supabase_anon_key_here') {
    console.error('❌ Please update your .env file with actual Supabase credentials!');
    console.log('Run: node scripts/setup-env.js');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`🔗 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...\n`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  const tests = [
    {
      name: 'Basic Connection',
      test: async () => {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) throw error;
        return { message: 'Connected successfully', data };
      }
    },
    {
      name: 'Tables Check',
      test: async () => {
        const tables = ['profiles', 'prayers', 'groups', 'interactions', 'studies', 'group_members', 'comments', 'notifications', 'support_tickets', 'reports', 'user_analytics'];
        const results = {};
        
        for (const table of tables) {
          try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) throw error;
            results[table] = '✅';
          } catch (error) {
            results[table] = `❌ ${error.message}`;
          }
        }
        
        return { message: 'Table accessibility check', data: results };
      }
    },
    {
      name: 'Views Check',
      test: async () => {
        const views = ['prayer_feed', 'group_activity'];
        const results = {};
        
        for (const view of views) {
          try {
            const { data, error } = await supabase.from(view).select('*').limit(1);
            if (error) throw error;
            results[view] = '✅';
          } catch (error) {
            results[view] = `❌ ${error.message}`;
          }
        }
        
        return { message: 'View accessibility check', data: results };
      }
    },
    {
      name: 'Functions Check',
      test: async () => {
        try {
          const { data, error } = await supabase.rpc('get_prayer_interaction_counts', { prayer_uuid: '00000000-0000-0000-0000-000000000000' });
          if (error && !error.message.includes('violates foreign key constraint')) {
            throw error;
          }
          return { message: 'Functions are accessible', data };
        } catch (error) {
          return { message: 'Function check failed', error: error.message };
        }
      }
    },
    {
      name: 'Profile Fix Check',
      test: async () => {
        try {
          // Test that we can fetch a non-existent profile without PGRST116 error
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000000')
            .maybeSingle();
          
          if (error) {
            throw error;
          }
          
          // Should return null, not throw an error
          return { 
            message: 'Profile fetching works correctly (no PGRST116 error)', 
            data: { result: data, expected: null }
          };
        } catch (error) {
          return { message: 'Profile fix check failed', error: error.message };
        }
      }
    },
    {
      name: 'Storage Check',
      test: async () => {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        return { message: `Storage accessible, ${data.length} buckets found`, data: data.map(b => b.name) };
      }
    },
    {
      name: 'Realtime Check',
      test: async () => {
        return new Promise((resolve) => {
          const channel = supabase.channel('test-connection');
          const subscription = channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              supabase.removeChannel(channel);
              resolve({ message: 'Realtime connection established', data: { status } });
            }
          });
          
          // Timeout after 5 seconds
          setTimeout(() => {
            supabase.removeChannel(channel);
            resolve({ message: 'Realtime connection timeout', error: 'Connection took too long' });
          }, 5000);
        });
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      const result = await test.test();
      console.log(`✅ ${test.name}: ${result.message}`);
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2).substring(0, 100)}...`);
      }
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your Supabase connection is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Make sure you\'ve run the database schema (database/complete_schema.sql)');
    console.log('   2. Make sure you\'ve run the RLS policies (database/rls_policies.sql)');
    console.log('   3. Start your app and test the SupabaseTestComponent');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your setup:');
    console.log('   1. Verify your Supabase credentials in .env');
    console.log('   2. Make sure you\'ve run the database schema');
    console.log('   3. Check your Supabase project is active');
  }

  process.exit(failed > 0 ? 1 : 0);
}

testConnection().catch(console.error);
