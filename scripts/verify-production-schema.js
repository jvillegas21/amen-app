#!/usr/bin/env node

/**
 * Production Schema Verification
 * Comprehensive test of all database objects
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 PRODUCTION SCHEMA VERIFICATION\n');
console.log('═'.repeat(70));

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPECTED_TABLES = [
  'profiles', 'groups', 'prayers', 'interactions', 'studies',
  'saved_studies', 'prayer_reminders', 'group_members', 'comments',
  'notifications', 'support_tickets', 'support_messages', 'reports',
  'content_reports', 'user_analytics', 'prayer_analytics', 'app_analytics',
  'help_categories', 'faq_items', 'faq_helpful_votes', 'help_articles',
  'help_feedback', 'notification_settings', 'content_filters', 'follows',
  'blocked_users', 'direct_messages'
];

const EXPECTED_VIEWS = ['prayer_feed', 'group_activity'];

const EXPECTED_FUNCTIONS = [
  'get_prayer_interaction_counts',
  'get_user_prayer_stats',
  'cleanup_expired_notifications',
  'generate_invite_code',
  'update_updated_at_column',
  'update_group_member_count',
  'update_last_active',
  'set_group_invite_code',
  'refresh_postgrest_cache'
];

async function checkTable(name) {
  try {
    const { error, count } = await supabase
      .from(name)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST205') {
        return { name, status: 'missing', error: 'Not in schema cache' };
      }
      return { name, status: 'error', error: error.message };
    }

    return { name, status: 'ok', count: count ?? 0 };
  } catch (err) {
    return { name, status: 'error', error: err.message };
  }
}

async function checkView(name) {
  try {
    const { error } = await supabase
      .from(name)
      .select('*', { head: true });

    if (error) {
      if (error.code === 'PGRST205') {
        return { name, status: 'missing', error: 'Not in schema cache' };
      }
      return { name, status: 'error', error: error.message };
    }

    return { name, status: 'ok' };
  } catch (err) {
    return { name, status: 'error', error: err.message };
  }
}

async function checkFunction(name) {
  try {
    // Test functions based on their signatures
    let result;

    switch(name) {
      case 'get_prayer_interaction_counts':
        result = await supabase.rpc(name, { prayer_uuid: '00000000-0000-0000-0000-000000000000' });
        break;
      case 'get_user_prayer_stats':
        result = await supabase.rpc(name, { user_uuid: '00000000-0000-0000-0000-000000000000' });
        break;
      case 'cleanup_expired_notifications':
      case 'refresh_postgrest_cache':
        result = await supabase.rpc(name);
        break;
      case 'generate_invite_code':
        result = await supabase.rpc(name);
        break;
      default:
        return { name, status: 'skip', error: 'Cannot test trigger function' };
    }

    const { error } = result;

    if (error && error.code !== 'PGRST116') {
      return { name, status: 'error', error: error.message };
    }

    return { name, status: 'ok' };
  } catch (err) {
    return { name, status: 'error', error: err.message };
  }
}

async function main() {
  let allPassed = true;

  // Check Tables
  console.log('\n📊 TABLES (27 expected)\n');
  const tableResults = [];
  for (const table of EXPECTED_TABLES) {
    const result = await checkTable(table);
    tableResults.push(result);

    const icon = result.status === 'ok' ? '✅' :
                 result.status === 'missing' ? '❌' : '⚠️';

    if (result.status === 'ok') {
      console.log(`${icon} ${table.padEnd(25)} - ${result.count} rows`);
    } else {
      console.log(`${icon} ${table.padEnd(25)} - ${result.error}`);
      allPassed = false;
    }
  }

  // Check Views
  console.log('\n📊 VIEWS (2 expected)\n');
  const viewResults = [];
  for (const view of EXPECTED_VIEWS) {
    const result = await checkView(view);
    viewResults.push(result);

    const icon = result.status === 'ok' ? '✅' :
                 result.status === 'missing' ? '❌' : '⚠️';

    if (result.status === 'ok') {
      console.log(`${icon} ${view.padEnd(25)} - Accessible`);
    } else {
      console.log(`${icon} ${view.padEnd(25)} - ${result.error}`);
      allPassed = false;
    }
  }

  // Check Functions
  console.log('\n⚙️  FUNCTIONS (9 expected)\n');
  const functionResults = [];
  for (const func of EXPECTED_FUNCTIONS) {
    const result = await checkFunction(func);
    functionResults.push(result);

    const icon = result.status === 'ok' ? '✅' :
                 result.status === 'skip' ? '⏭️' :
                 result.status === 'missing' ? '❌' : '⚠️';

    const message = result.status === 'ok' ? 'Working' :
                    result.status === 'skip' ? 'Skipped (trigger)' :
                    result.error;

    console.log(`${icon} ${func.padEnd(35)} - ${message}`);

    if (result.status === 'error' || result.status === 'missing') {
      allPassed = false;
    }
  }

  // Summary
  const allResults = [...tableResults, ...viewResults, ...functionResults];
  const okCount = allResults.filter(r => r.status === 'ok').length;
  const missingCount = allResults.filter(r => r.status === 'missing').length;
  const errorCount = allResults.filter(r => r.status === 'error').length;
  const skipCount = allResults.filter(r => r.status === 'skip').length;

  console.log('\n' + '═'.repeat(70));
  console.log('\n📈 SUMMARY\n');
  console.log(`   ✅ Working:     ${okCount}`);
  console.log(`   ⏭️  Skipped:     ${skipCount}`);
  console.log(`   ❌ Missing:     ${missingCount}`);
  console.log(`   ⚠️  Errors:      ${errorCount}`);

  if (allPassed) {
    console.log('\n' + '═'.repeat(70));
    console.log('🎉 ALL CHECKS PASSED! Production schema is ready!');
    console.log('═'.repeat(70));
    console.log('\n✅ Next steps:');
    console.log('   1. Your database is fully configured');
    console.log('   2. Restart your app: npx expo start --clear');
    console.log('   3. Test login and app functionality\n');
    process.exit(0);
  } else {
    console.log('\n' + '═'.repeat(70));
    console.log('❌ VERIFICATION FAILED');
    console.log('═'.repeat(70));
    console.log('\n📝 Issues found:');

    if (missingCount > 0) {
      console.log('\n   Missing objects:');
      allResults
        .filter(r => r.status === 'missing')
        .forEach(r => console.log(`   - ${r.name}`));
      console.log('\n   💡 Solution: Re-run the production schema SQL');
    }

    if (errorCount > 0) {
      console.log('\n   Errors:');
      allResults
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }

    console.log('\n   🔧 Fix: Run database/production_schema.sql again\n');
    process.exit(1);
  }
}

main().catch(console.error);
