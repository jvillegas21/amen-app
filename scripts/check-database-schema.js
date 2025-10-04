#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check what tables exist
  console.log('📊 Checking existing tables...\n');

  // Query pg_tables to see what exists
  const { data: tables, error: tablesError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    })
    .single();

  if (tablesError) {
    console.log('⚠️  Cannot query information_schema (RLS may be blocking)');
    console.log('   Error:', tablesError.message);
    console.log('\n📋 Let\'s try direct table access instead...\n');

    // Try to access each expected table directly
    const expectedTables = [
      'profiles', 'prayers', 'groups', 'group_members',
      'interactions', 'comments', 'notifications',
      'studies', 'support_tickets', 'reports', 'user_analytics'
    ];

    for (const table of expectedTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.message.includes('schema cache')) {
            console.log(`❌ ${table}: Does not exist (not in schema cache)`);
          } else if (error.message.includes('permission denied')) {
            console.log(`⚠️  ${table}: Exists but RLS is blocking access`);
          } else {
            console.log(`❌ ${table}: ${error.message}`);
          }
        } else {
          console.log(`✅ ${table}: Exists (${count ?? 0} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Check views
    console.log('\n📊 Checking views...\n');
    const expectedViews = ['prayer_feed', 'group_activity'];

    for (const view of expectedViews) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('*', { head: true });

        if (error) {
          if (error.message.includes('schema cache')) {
            console.log(`❌ ${view}: Does not exist`);
          } else {
            console.log(`⚠️  ${view}: ${error.message}`);
          }
        } else {
          console.log(`✅ ${view}: Exists`);
        }
      } catch (err) {
        console.log(`❌ ${view}: ${err.message}`);
      }
    }

    // Check storage buckets
    console.log('\n🗂️  Checking storage buckets...\n');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log(`❌ Storage: ${bucketsError.message}`);
    } else {
      console.log(`✅ Storage accessible`);
      if (buckets.length === 0) {
        console.log(`   ⚠️  No buckets found - you may need to create them`);
      } else {
        buckets.forEach(b => console.log(`   - ${b.name} (${b.public ? 'public' : 'private'})`));
      }
    }

    // Try to check RLS policies
    console.log('\n🔒 Checking RLS policies...\n');
    const { data: authUser } = await supabase.auth.getUser();

    if (authUser.user) {
      console.log(`✅ Authenticated as: ${authUser.user.email}`);
    } else {
      console.log(`⚠️  Not authenticated - RLS may block access to tables`);
      console.log('   Some tables might exist but be hidden by Row Level Security');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Summary:\n');
    console.log('Your database exists but may be missing some tables or views.');
    console.log('This could be because:');
    console.log('  1. Database schema was not fully migrated');
    console.log('  2. RLS policies are blocking anonymous access');
    console.log('  3. Tables are in a different schema (not public)');
    console.log('\n💡 Next steps:');
    console.log('  1. Go to Supabase Dashboard → SQL Editor');
    console.log('  2. Check which tables exist');
    console.log('  3. Run your schema migrations if needed');
    console.log('  4. Check RLS policies allow access\n');

  } else {
    console.log('✅ Successfully queried information_schema\n');
    console.log('Tables found:', tables);
  }
}

checkDatabaseSchema().catch(console.error);
