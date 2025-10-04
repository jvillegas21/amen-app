#!/usr/bin/env node

/**
 * Refresh PostgREST Schema Cache
 *
 * This script forces Supabase's PostgREST API to reload its schema cache.
 * Run this when you get "table not found in schema cache" errors.
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔄 PostgREST Schema Cache Refresh Tool\n');
console.log('═'.repeat(60));

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
console.log(`\n📋 Project: ${projectRef}`);
console.log(`🔗 URL: ${supabaseUrl}`);

async function refreshViaSQL() {
  console.log('\n📍 Method 1: SQL NOTIFY Command');
  console.log('─'.repeat(60));

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try to execute NOTIFY command via RPC if function exists
    const { data, error } = await supabase.rpc('refresh_postgrest_cache');

    if (error) {
      console.log('⚠️  RPC function not available (expected)');
      console.log('   You need to run the SQL command manually');
      return false;
    }

    console.log('✅ Cache refresh triggered via RPC');
    return true;
  } catch (err) {
    console.log('⚠️  Cannot trigger via RPC');
    return false;
  }
}

async function refreshViaAPI() {
  console.log('\n📍 Method 2: Direct API Request');
  console.log('─'.repeat(60));

  return new Promise((resolve) => {
    const url = new URL(supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseKey,
        'Prefer': 'schema-reload=true'
      },
      timeout: 10000,
    };

    console.log('📡 Sending schema reload request...');

    const req = https.request(options, (res) => {
      console.log(`✅ Response: ${res.statusCode} ${res.statusMessage}`);

      if (res.statusCode === 200 || res.statusCode === 204) {
        console.log('✅ Schema reload header sent successfully');
        resolve(true);
      } else {
        console.log('⚠️  Unexpected status code');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`❌ Request failed: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Request timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function verifyCache() {
  console.log('\n📍 Verification: Checking Table Access');
  console.log('─'.repeat(60));

  const supabase = createClient(supabaseUrl, supabaseKey);

  const tables = ['profiles', 'prayers', 'groups', 'notifications'];
  let successCount = 0;

  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST205') {
          console.log(`❌ ${table}: Still not in cache`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: Accessible (${count ?? 0} rows)`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  return successCount === tables.length;
}

async function waitForCacheRefresh(seconds = 5) {
  console.log(`\n⏳ Waiting ${seconds} seconds for cache to refresh...`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function main() {
  console.log('\n🚀 Starting cache refresh process...\n');

  // Try Method 1: SQL
  const sqlSuccess = await refreshViaSQL();

  // Try Method 2: API
  const apiSuccess = await refreshViaAPI();

  if (!sqlSuccess && !apiSuccess) {
    console.log('\n❌ Automatic refresh methods failed');
    console.log('\n📝 Manual Steps Required:');
    console.log('─'.repeat(60));
    console.log('\n1. Go to Supabase Dashboard SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\n2. Run this command:');
    console.log('   \x1b[36mNOTIFY pgrst, \'reload schema\';\x1b[0m');
    console.log('\n3. Wait 5-10 seconds');
    console.log('\n4. Test your app again\n');
    process.exit(1);
  }

  // Wait for cache to refresh
  await waitForCacheRefresh(5);

  // Verify
  const verified = await verifyCache();

  console.log('\n' + '═'.repeat(60));

  if (verified) {
    console.log('\n✅ SUCCESS! Schema cache has been refreshed');
    console.log('✅ All tables are now accessible\n');
    console.log('🎉 You can now restart your app:');
    console.log('   npx expo start --clear\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Cache may still be refreshing...');
    console.log('\n📝 If tables still show errors:');
    console.log('   1. Wait another 10 seconds');
    console.log('   2. Run: node scripts/verify-schema-cache.js');
    console.log('   3. Or manually run: NOTIFY pgrst, \'reload schema\';\n');
    process.exit(1);
  }
}

main().catch(console.error);
