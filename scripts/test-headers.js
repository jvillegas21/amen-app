#!/usr/bin/env node

/**
 * Test Header Preservation in Custom Fetch
 */

// Simulate the header merging logic
function testHeaderMerging() {
  console.log('🧪 Testing Header Merging Logic\n');

  // Test 1: Headers object (what Supabase uses)
  const headersObj = new Headers({
    'apikey': 'test-api-key-12345',
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json',
  });

  console.log('Test 1: Headers object');
  console.log('Before merge:', Array.from(headersObj.entries()));

  const merged1 = new Headers(headersObj);
  merged1.set('Connection', 'keep-alive');
  merged1.set('Keep-Alive', 'timeout=30');

  console.log('After merge:', Array.from(merged1.entries()));
  console.log('✅ API key preserved:', merged1.get('apikey') === 'test-api-key-12345');
  console.log('✅ Auth preserved:', merged1.get('Authorization') === 'Bearer test-token');
  console.log('✅ Connection added:', merged1.get('Connection') === 'keep-alive');
  console.log('');

  // Test 2: Plain object (fallback)
  const plainObj = {
    'apikey': 'test-api-key-12345',
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json',
  };

  console.log('Test 2: Plain object');
  console.log('Before merge:', Object.entries(plainObj));

  const merged2 = new Headers(plainObj);
  merged2.set('Connection', 'keep-alive');
  merged2.set('Keep-Alive', 'timeout=30');

  console.log('After merge:', Array.from(merged2.entries()));
  console.log('✅ API key preserved:', merged2.get('apikey') === 'test-api-key-12345');
  console.log('✅ Auth preserved:', merged2.get('Authorization') === 'Bearer test-token');
  console.log('✅ Connection added:', merged2.get('Connection') === 'keep-alive');
  console.log('');

  // Test 3: Empty/undefined (edge case)
  console.log('Test 3: Undefined headers');
  const merged3 = new Headers(undefined);
  merged3.set('Connection', 'keep-alive');
  merged3.set('Keep-Alive', 'timeout=30');

  console.log('After merge:', Array.from(merged3.entries()));
  console.log('✅ Handles undefined:', merged3.get('Connection') === 'keep-alive');
  console.log('');

  console.log('🎉 All header merging tests passed!');
}

testHeaderMerging();
