#!/usr/bin/env node

/**
 * Comprehensive Network Diagnostic Script
 * Tests DNS, HTTPS, and Supabase connectivity
 */

const dns = require('dns').promises;
const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔬 === COMPREHENSIVE NETWORK DIAGNOSTICS ===\n');

async function testDNS(hostname) {
  console.log(`\n🌐 DNS Resolution Test for: ${hostname}`);
  console.log('─'.repeat(60));

  // Test with system DNS
  try {
    console.log('📡 Testing with system DNS...');
    const addresses = await dns.resolve4(hostname);
    console.log(`✅ System DNS: Resolved to ${addresses.join(', ')}`);
    return true;
  } catch (error) {
    console.log(`❌ System DNS: ${error.code || error.message}`);
  }

  // Test with Google DNS
  try {
    console.log('📡 Testing with Google DNS (8.8.8.8)...');
    const resolver = new dns.Resolver();
    resolver.setServers(['8.8.8.8']);
    const addresses = await resolver.resolve4(hostname);
    console.log(`✅ Google DNS: Resolved to ${addresses.join(', ')}`);
    return true;
  } catch (error) {
    console.log(`❌ Google DNS: ${error.code || error.message}`);
  }

  // Test with Cloudflare DNS
  try {
    console.log('📡 Testing with Cloudflare DNS (1.1.1.1)...');
    const resolver = new dns.Resolver();
    resolver.setServers(['1.1.1.1']);
    const addresses = await resolver.resolve4(hostname);
    console.log(`✅ Cloudflare DNS: Resolved to ${addresses.join(', ')}`);
    return true;
  } catch (error) {
    console.log(`❌ Cloudflare DNS: ${error.code || error.message}`);
  }

  return false;
}

async function testHTTPS(url) {
  console.log(`\n🔒 HTTPS Connection Test`);
  console.log('─'.repeat(60));

  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000,
    };

    console.log(`📡 Connecting to https://${urlObj.hostname}...`);

    const req = https.request(options, (res) => {
      console.log(`✅ HTTPS Connection successful!`);
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   TLS Version: ${res.socket.getProtocol()}`);
      console.log(`   Cipher: ${res.socket.getCipher().name}`);
      console.log(`   Headers:`, JSON.stringify(res.headers, null, 2).substring(0, 200) + '...');
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ HTTPS Connection failed: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      if (error.code === 'ENOTFOUND') {
        console.log(`   ⚠️  DNS resolution failed - hostname doesn't exist`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ⚠️  Connection refused - server not responding`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ⚠️  Connection timeout - firewall or network issue`);
      }
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ Connection timeout after 10s`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testSupabaseAPI(url, key) {
  console.log(`\n🗄️  Supabase API Test`);
  console.log('─'.repeat(60));

  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    console.log(`📡 Testing Supabase REST API...`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`✅ Supabase API responded!`);
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Response: ${data.substring(0, 200)}...`);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Supabase API test failed: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ API request timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testPublicAPIs() {
  console.log(`\n🌍 Public API Connectivity Test`);
  console.log('─'.repeat(60));

  const testUrls = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'Cloudflare', url: 'https://1.1.1.1' },
    { name: 'GitHub', url: 'https://api.github.com' },
  ];

  for (const { name, url } of testUrls) {
    const result = await testHTTPS(url);
    if (!result) {
      console.log(`\n⚠️  Cannot reach ${name} - your network may be blocking HTTPS`);
      return false;
    }
  }

  console.log(`\n✅ All public APIs reachable - network is working`);
  return true;
}

async function diagnoseIssue() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file!');
    process.exit(1);
  }

  const urlObj = new URL(supabaseUrl);
  const hostname = urlObj.hostname;

  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Hostname: ${hostname}`);
  console.log(`Key: ${supabaseKey.substring(0, 20)}...\n`);

  // Step 1: Test public internet connectivity
  console.log('📍 STEP 1: Testing general internet connectivity...');
  const internetWorks = await testPublicAPIs();

  if (!internetWorks) {
    console.log('\n❌ DIAGNOSIS: No internet connection or HTTPS is blocked');
    console.log('\n💡 Solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Check if a firewall/VPN is blocking connections');
    console.log('   3. Try disabling antivirus/firewall temporarily');
    process.exit(1);
  }

  // Step 2: Test DNS resolution for Supabase
  console.log('\n📍 STEP 2: Testing DNS resolution for Supabase...');
  const dnsWorks = await testDNS(hostname);

  if (!dnsWorks) {
    console.log('\n❌ DIAGNOSIS: Supabase URL cannot be resolved');
    console.log('\n💡 This means one of:');
    console.log('   1. ❌ The Supabase project was DELETED');
    console.log('   2. ❌ The project URL is INCORRECT');
    console.log('   3. ❌ The project is PAUSED (free tier inactive)');
    console.log('\n🔧 Solutions:');
    console.log('   1. Log in to https://app.supabase.com');
    console.log('   2. Check if your project exists and is active');
    console.log('   3. Get the correct URL from Settings → API');
    console.log('   4. Update your .env file with the correct URL');
    process.exit(1);
  }

  // Step 3: Test HTTPS connection to Supabase
  console.log('\n📍 STEP 3: Testing HTTPS connection to Supabase...');
  const httpsWorks = await testHTTPS(supabaseUrl);

  if (!httpsWorks) {
    console.log('\n❌ DIAGNOSIS: Cannot establish HTTPS connection');
    console.log('\n💡 Solutions:');
    console.log('   1. Check if Supabase project is active');
    console.log('   2. Verify the project isn\'t paused');
    console.log('   3. Check Supabase status page');
    process.exit(1);
  }

  // Step 4: Test Supabase API
  console.log('\n📍 STEP 4: Testing Supabase API...');
  const apiWorks = await testSupabaseAPI(supabaseUrl, supabaseKey);

  if (!apiWorks) {
    console.log('\n❌ DIAGNOSIS: Cannot access Supabase API');
    console.log('\n💡 Solutions:');
    console.log('   1. Verify the anon key is correct');
    console.log('   2. Check if API is enabled in project settings');
    console.log('   3. Review Supabase logs for errors');
    process.exit(1);
  }

  // All tests passed!
  console.log('\n\n✅ ═══════════════════════════════════════════════════');
  console.log('✅  ALL TESTS PASSED!');
  console.log('✅ ═══════════════════════════════════════════════════\n');
  console.log('🎉 Your Supabase connection is working from Node.js!\n');
  console.log('📱 Next step: Test from the React Native simulator');
  console.log('   The issue is likely in the simulator/app configuration\n');
}

diagnoseIssue().catch(console.error);
