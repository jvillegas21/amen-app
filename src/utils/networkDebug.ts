/**
 * Network debugging utility
 * Helps diagnose network request failures
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const checkNetworkConnectivity = async () => {
  console.log('🔍 Checking network connectivity...');

  try {
    const state = await NetInfo.fetch();
    console.log('📡 Network state:', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    });

    if (!state.isConnected) {
      console.error('❌ Device is not connected to any network');
      return false;
    }

    if (state.isInternetReachable === false) {
      console.error('❌ Network is connected but internet is not reachable');
      return false;
    }

    console.log('✓ Network connectivity OK');
    return true;
  } catch (error) {
    console.error('❌ Error checking network:', error);
    return false;
  }
};

export const testFetch = async (url: string) => {
  console.log('🧪 Testing fetch to:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('✓ Fetch successful:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    return true;
  } catch (error) {
    console.error('❌ Fetch failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      platform: Platform.OS,
    });
    return false;
  }
};

export const diagnoseNetworkIssue = async (supabaseUrl: string) => {
  console.log('\n🔧 === Network Diagnostics ===\n');

  // Step 1: Check connectivity
  const hasNetwork = await checkNetworkConnectivity();

  if (!hasNetwork) {
    console.error('\n⚠️  DIAGNOSIS: No network connection');
    console.error('   Solutions:');
    console.error('   - Check WiFi/cellular connection');
    console.error('   - Verify device is not in airplane mode');
    return;
  }

  // Step 2: Test basic fetch
  console.log('\n📡 Testing basic fetch to Google...');
  const googleWorks = await testFetch('https://www.google.com');

  if (!googleWorks) {
    console.error('\n⚠️  DIAGNOSIS: Fetch API is broken or blocked');
    console.error('   Solutions:');
    console.error('   - Restart the app completely');
    console.error('   - Clear Metro cache: npx expo start --clear');
    console.error('   - Check if fetch polyfill is loaded');
    return;
  }

  // Step 3: Test Supabase URL
  if (supabaseUrl) {
    console.log('\n📡 Testing fetch to Supabase...');
    const supabaseWorks = await testFetch(supabaseUrl);

    if (!supabaseWorks) {
      console.error('\n⚠️  DIAGNOSIS: Cannot reach Supabase URL');
      console.error('   URL:', supabaseUrl);
      console.error('   Solutions:');
      console.error('   - Verify the Supabase URL is correct');
      console.error('   - Check if the Supabase project exists');
      console.error('   - Try accessing the URL in a browser');
      console.error('   - Check if corporate firewall is blocking');
      return;
    }
  }

  console.log('\n✅ All network diagnostics passed!');
  console.log('   If you still see errors, check:');
  console.log('   - Supabase anon key is correct');
  console.log('   - Database permissions/RLS policies');
  console.log('   - Specific API endpoint errors\n');
};
