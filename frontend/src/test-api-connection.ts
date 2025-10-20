/**
 * API Connection Test Script
 * 
 * Run this to verify connection to Notaku API Server
 * 
 * Usage:
 * 1. Make sure .env.development is created with VITE_API_URL
 * 2. Run: npm run dev
 * 3. Import this file in your App.tsx or run in browser console
 */

import ApiClient from '@/lib/api-client';

interface TestResult {
  test: string;
  status: 'success' | 'failed';
  data?: any;
  error?: any;
  duration?: number;
}

export async function testApiConnection(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('🚀 Starting API Connection Tests...');
  console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('---');

  // Test 1: Health Check
  try {
    const start = Date.now();
    const health = await ApiClient.getHealth();
    const duration = Date.now() - start;
    
    results.push({
      test: 'Health Check',
      status: 'success',
      data: health,
      duration
    });
    console.log('✅ Test 1: Health Check - PASSED', `(${duration}ms)`);
    console.log('   Response:', health);
  } catch (error) {
    results.push({
      test: 'Health Check',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Test 1: Health Check - FAILED');
    console.error('   Error:', error);
  }

  // Test 2: System Info
  try {
    const start = Date.now();
    const info = await ApiClient.getSystemInfo();
    const duration = Date.now() - start;
    
    results.push({
      test: 'System Info',
      status: 'success',
      data: info,
      duration
    });
    console.log('✅ Test 2: System Info - PASSED', `(${duration}ms)`);
    console.log('   Response:', info);
  } catch (error) {
    results.push({
      test: 'System Info',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Test 2: System Info - FAILED');
    console.error('   Error:', error);
  }

  // Test 3: API Info
  try {
    const start = Date.now();
    const apiInfo = await ApiClient.getApiInfo();
    const duration = Date.now() - start;
    
    results.push({
      test: 'API Info',
      status: 'success',
      data: apiInfo,
      duration
    });
    console.log('✅ Test 3: API Info - PASSED', `(${duration}ms)`);
    console.log('   Response:', apiInfo);
  } catch (error) {
    results.push({
      test: 'API Info',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Test 3: API Info - FAILED');
    console.error('   Error:', error);
  }

  // Test 4: CORS Check (will fail if not authenticated, but tests CORS)
  try {
    const start = Date.now();
    await ApiClient.getCurrentUser();
    const duration = Date.now() - start;
    
    results.push({
      test: 'CORS Check (getCurrentUser)',
      status: 'success',
      data: { message: 'CORS working, but not authenticated (expected)' },
      duration
    });
    console.log('✅ Test 4: CORS Check - PASSED', `(${duration}ms)`);
  } catch (error: any) {
    // 401 is expected if not logged in, but means CORS is working
    if (error?.statusCode === 401) {
      results.push({
        test: 'CORS Check (getCurrentUser)',
        status: 'success',
        data: { message: 'CORS working (401 expected when not authenticated)' }
      });
      console.log('✅ Test 4: CORS Check - PASSED (401 expected)');
    } else {
      results.push({
        test: 'CORS Check (getCurrentUser)',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Test 4: CORS Check - FAILED');
      console.error('   Error:', error);
    }
  }

  // Summary
  console.log('---');
  console.log('📊 Test Summary:');
  const passed = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`   ✅ Passed: ${passed}/${results.length}`);
  console.log(`   ❌ Failed: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! API connection is working!');
  } else {
    console.log('⚠️  Some tests failed. Check errors above.');
  }

  return results;
}

// Auto-run if in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode detected');
  console.log('To run API tests, call: testApiConnection()');
}

// Export for use in components
export default testApiConnection;
