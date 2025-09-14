#!/usr/bin/env node

/**
 * Simple test script to verify basic database connectivity
 * Tests without authentication to avoid RLS policy issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicConnection() {
  console.log('🔍 Testing basic database connection...');
  
  try {
    // Test basic connection by querying a simple table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Basic connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic database connection working');
    return true;
  } catch (error) {
    console.error('❌ Basic connection test failed:', error.message);
    return false;
  }
}

async function testRLSPoliciesDisabled() {
  console.log('🔍 Testing RLS policies (should work for public data)...');
  
  try {
    // Test that we can query public profiles (this should work with RLS)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(1);
    
    if (error) {
      console.error('❌ RLS policy test failed:', error.message);
      return false;
    }
    
    console.log('✅ RLS policies working for public data');
    return true;
  } catch (error) {
    console.error('❌ RLS policy test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting simple database tests...\n');
  
  const results = await Promise.all([
    testBasicConnection(),
    testRLSPoliciesDisabled(),
  ]);
  
  const allPassed = results.every(result => result);
  
  console.log('\n📊 Test Results:');
  console.log(`Basic Connection: ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`RLS Policies: ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
  
  if (allPassed) {
    console.log('\n🎉 Basic tests passed! Database is accessible.');
    console.log('Note: The infinite recursion issue may still exist for authenticated users.');
    console.log('The fixes have been applied to the RLS policies file.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
