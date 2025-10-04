#!/usr/bin/env node

/**
 * Verify PostgREST Schema Cache
 *
 * Checks which tables are accessible via the Supabase REST API
 * Helps diagnose "table not found in schema cache" errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Schema Cache Verification\n');
console.log('═'.repeat(60));

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials');
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
console.log(`\n📋 Project: ${projectRef}`);
console.log(`🔗 URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPECTED_TABLES = [
  'profiles',
  'prayers',
  'groups',
  'group_members',
  'interactions',
  'comments',
  'notifications',
  'studies',
  'support_tickets',
  'reports',
  'user_analytics',
];

const EXPECTED_VIEWS = [
  'prayer_feed',
  'group_activity',
];

async function checkTable(name, type = 'table') {
  try {
    const { error, count } = await supabase
      .from(name)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST205') {
        return { name, type, status: 'missing', message: 'Not in schema cache', error };
      } else if (error.code === 'PGRST301') {
        return { name, type, status: 'blocked', message: 'RLS blocking access', error };
      } else {
        return { name, type, status: 'error', message: error.message, error };
      }
    }

    return { name, type, status: 'ok', count: count ?? 0 };
  } catch (err) {
    return { name, type, status: 'error', message: err.message };
  }
}

async function main() {
  console.log('📊 Checking Tables...\n');

  const tableResults = [];
  for (const table of EXPECTED_TABLES) {
    const result = await checkTable(table, 'table');
    tableResults.push(result);

    const icon = result.status === 'ok' ? '✅' :
                 result.status === 'missing' ? '❌' :
                 result.status === 'blocked' ? '🔒' : '⚠️';

    if (result.status === 'ok') {
      console.log(`${icon} ${table.padEnd(20)} - ${result.count} rows`);
    } else {
      console.log(`${icon} ${table.padEnd(20)} - ${result.message}`);
    }
  }

  console.log('\n📊 Checking Views...\n');

  const viewResults = [];
  for (const view of EXPECTED_VIEWS) {
    const result = await checkTable(view, 'view');
    viewResults.push(result);

    const icon = result.status === 'ok' ? '✅' :
                 result.status === 'missing' ? '❌' :
                 result.status === 'blocked' ? '🔒' : '⚠️';

    if (result.status === 'ok') {
      console.log(`${icon} ${view.padEnd(20)} - Accessible`);
    } else {
      console.log(`${icon} ${view.padEnd(20)} - ${result.message}`);
    }
  }

  // Summary
  const allResults = [...tableResults, ...viewResults];
  const okCount = allResults.filter(r => r.status === 'ok').length;
  const missingCount = allResults.filter(r => r.status === 'missing').length;
  const blockedCount = allResults.filter(r => r.status === 'blocked').length;
  const errorCount = allResults.filter(r => r.status === 'error').length;

  console.log('\n' + '═'.repeat(60));
  console.log('\n📈 Summary:\n');
  console.log(`   ✅ Accessible:     ${okCount}/${allResults.length}`);
  console.log(`   ❌ Not in cache:   ${missingCount}`);
  console.log(`   🔒 RLS blocked:    ${blockedCount}`);
  console.log(`   ⚠️  Other errors:   ${errorCount}`);

  if (missingCount > 0) {
    console.log('\n❌ Schema Cache Issue Detected\n');
    console.log('Missing tables/views:');
    allResults
      .filter(r => r.status === 'missing')
      .forEach(r => console.log(`   - ${r.name}`));

    console.log('\n🔧 How to Fix:\n');
    console.log('1. Run the refresh script:');
    console.log('   \x1b[36mnode scripts/refresh-postgrest-cache.js\x1b[0m\n');
    console.log('2. OR go to Supabase SQL Editor and run:');
    console.log('   \x1b[36mNOTIFY pgrst, \'reload schema\';\x1b[0m\n');
    console.log('3. Wait 5-10 seconds, then run this script again\n');
    process.exit(1);
  }

  if (blockedCount > 0) {
    console.log('\n🔒 RLS Policy Issue Detected\n');
    console.log('Tables blocked by RLS:');
    allResults
      .filter(r => r.status === 'blocked')
      .forEach(r => console.log(`   - ${r.name}`));

    console.log('\n💡 These tables exist but RLS is blocking access');
    console.log('   This is normal if not authenticated\n');
  }

  if (okCount === allResults.length) {
    console.log('\n✅ All tables and views are accessible!');
    console.log('✅ Schema cache is working correctly\n');
    process.exit(0);
  }

  if (errorCount > 0) {
    console.log('\n⚠️  Some unexpected errors occurred');
    console.log('   Check the error messages above\n');
    process.exit(1);
  }

  process.exit(0);
}

main().catch(console.error);
