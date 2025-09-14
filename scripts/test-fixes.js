#!/usr/bin/env node

/**
 * Test script to verify the database fixes
 * Tests both the RLS policy fixes and profile creation fixes
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPolicies() {
  console.log('🔍 Testing RLS policies...');
  
  try {
    // Test that we can query group_members without infinite recursion
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ RLS policy test failed:', error.message);
      return false;
    }
    
    console.log('✅ RLS policies working correctly');
    return true;
  } catch (error) {
    console.error('❌ RLS policy test failed:', error.message);
    return false;
  }
}

async function testProfileCreation() {
  console.log('🔍 Testing profile creation...');
  
  try {
    // Test profile creation with a test user ID (proper UUID format)
    const testUserId = uuidv4();
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        display_name: 'Test User',
        location_granularity: 'city',
        onboarding_completed: false,
        email_notifications: true,
        push_notifications: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Profile creation test failed:', error.message);
      return false;
    }
    
    console.log('✅ Profile creation working correctly');
    
    // Clean up test profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
    
    return true;
  } catch (error) {
    console.error('❌ Profile creation test failed:', error.message);
    return false;
  }
}

async function testPrayerCreation() {
  console.log('🔍 Testing prayer creation...');
  
  try {
    // First create a test profile (proper UUID format)
    const testUserId = uuidv4();
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        display_name: 'Test Prayer User',
        location_granularity: 'city',
        onboarding_completed: false,
        email_notifications: true,
        push_notifications: true,
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Test profile creation failed:', profileError.message);
      return false;
    }
    
    // Now test prayer creation
    const { data: prayer, error: prayerError } = await supabase
      .from('prayers')
      .insert({
        user_id: testUserId,
        text: 'This is a test prayer to verify the fixes work correctly.',
        privacy_level: 'public',
        location_granularity: 'city',
        location_city: 'Test City',
        status: 'open',
        is_anonymous: false,
      })
      .select()
      .single();
    
    if (prayerError) {
      console.error('❌ Prayer creation test failed:', prayerError.message);
      return false;
    }
    
    console.log('✅ Prayer creation working correctly');
    
    // Clean up test data
    await supabase
      .from('prayers')
      .delete()
      .eq('id', prayer.id);
    
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
    
    return true;
  } catch (error) {
    console.error('❌ Prayer creation test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting database fix tests...\n');
  
  const results = await Promise.all([
    testRLSPolicies(),
    testProfileCreation(),
    testPrayerCreation(),
  ]);
  
  const allPassed = results.every(result => result);
  
  console.log('\n📊 Test Results:');
  console.log(`RLS Policies: ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Profile Creation: ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Prayer Creation: ${results[2] ? '✅ PASS' : '❌ FAIL'}`);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! The fixes are working correctly.');
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
