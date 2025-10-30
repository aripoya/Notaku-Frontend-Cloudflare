/**
 * API Connection Test Component
 * 
 * Visual component to test API connection
 * Add this to your app during development to verify API connectivity
 * 
 * Usage:
 * import ApiConnectionTest from '@/components/ApiConnectionTest';
 * 
 * <ApiConnectionTest />
 */

import { useState } from 'react';
import { testApiConnection } from '@/test-api-connection';

interface TestResult {
  test: string;
  status: 'success' | 'failed';
  data?: any;
  error?: any;
  duration?: number;
}

export default function ApiConnectionTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      const testResults = await testApiConnection();
      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const passed = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🔌 API Connection Test
          </h2>
          <p className="text-gray-600">
            Test connection to Notaku API Server
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Backend URL: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_BACKEND_URL}</code>
          </p>
        </div>

        {/* Test Button */}
        <button
          onClick={runTests}
          disabled={testing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-6"
        >
          {testing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Tests...
            </span>
          ) : (
            '🚀 Run Connection Tests'
          )}
        </button>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Test Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{results.length}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{passed}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
              
              {failed === 0 && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-green-800 font-semibold">
                    🎉 All tests passed! API connection is working!
                  </p>
                </div>
              )}
              
              {failed > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-red-800 font-semibold">
                    ⚠️ Some tests failed. Check details below.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Test Results</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {result.status === 'success' ? '✅' : '❌'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {result.test}
                        </h4>
                        {result.duration && (
                          <p className="text-sm text-gray-600">
                            Duration: {result.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        result.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {showDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {result.status === 'success' && result.data && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Response:</p>
                          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {result.status === 'failed' && result.error && (
                        <div>
                          <p className="text-sm font-semibold text-red-700 mb-1">Error:</p>
                          <pre className="bg-white p-2 rounded text-xs overflow-x-auto text-red-600">
                            {typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {results.length === 0 && !testing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Instructions</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Make sure <code className="bg-blue-100 px-1 rounded">.env.development</code> exists with <code className="bg-blue-100 px-1 rounded">VITE_API_URL</code></li>
              <li>Click "Run Connection Tests" button above</li>
              <li>Check test results and verify all tests pass</li>
              <li>If tests fail, check browser console for details</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
