/**
 * Quick network test script
 * Run with: node test-network.js
 */

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not loaded!');
  process.exit(1);
}

// Test basic HTTPS connection
const https = require('https');
const url = new URL(supabaseUrl);

const options = {
  hostname: url.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

console.log('\n🌐 Testing HTTPS connection to:', url.hostname);

const req = https.request(options, (res) => {
  console.log('✓ Connection successful!');
  console.log('  Status code:', res.statusCode);
  console.log('  Headers:', JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n✅ Network connection test PASSED');
    console.log('Your Supabase instance is reachable!\n');
  });
});

req.on('error', (error) => {
  console.error('❌ Connection failed:', error.message);
  console.error('\nPossible causes:');
  console.error('  - Invalid Supabase URL');
  console.error('  - Network/firewall blocking the request');
  console.error('  - Supabase service is down');
  process.exit(1);
});

req.end();
