'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// TypeScript interfaces for data models
interface SnowflakeRow {
  [key: string]: any;
}

interface ApiResponse {
  data: SnowflakeRow[];
  error?: string;
}

export default function Home() {
  // React state management for data, loading, and error states
  const [data, setData] = useState<SnowflakeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch call to /api/snowflake proxy endpoint
        const response = await fetch('/api/snowflake', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Error handling for non-OK responses
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        // Parse response and update component state
        const result: ApiResponse = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setData(result.data || []);
      } catch (err) {
        // User-friendly error messages
        if (err instanceof TypeError) {
          setError('Network error: Unable to reach the API. Please check your connection.');
        } else if (err instanceof Error) {
          if (err.message.includes('401') || err.message.includes('authentication')) {
            setError('Authentication failed: Please check your Snowflake credentials in .env.local');
          } else if (err.message.includes('404')) {
            setError('API endpoint not found: Ensure the /api/snowflake route is properly configured.');
          } else {
            setError(`Error: ${err.message}`);
          }
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Snowflake Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Data from BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Loading state with spinner */}
        {loading && (
          <div className="flex items-center justify-center space-x-3 text-gray-600 py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium">Loading data from Snowflake...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-md mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="font-semibold text-lg">Error</p>
                <p className="mt-1">{error}</p>
                <div className="mt-3 text-sm">
                  <p className="font-medium">Troubleshooting tips:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Verify your Snowflake credentials in .env.local</li>
                    <li>Ensure your Snowflake warehouse is running</li>
                    <li>Check that the database and table exist</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success state - show tables */}
        {!loading && !error && data.length > 0 && (
          <div className="space-y-6">
            {/* Success message */}
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-3 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-medium">Successfully loaded {data.length} rows from HOURLY_ANALYTICS</p>
              </div>
            </div>
            
            {/* Data Table */}
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Hourly Analytics Data</h2>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          {data.length > 0 && Object.keys(data[0]).map((key) => (
                            <th key={key} scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 sm:px-6">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {data.map((row, index) => (
                          <tr 
                            key={index} 
                            className="hover:bg-blue-50 transition-colors duration-150 ease-in-out"
                          >
                            {Object.values(row).map((value, i) => (
                              <td key={i} className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 sm:px-6">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && data.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-900">No data available</p>
            <p className="mt-2 text-sm text-gray-500">The query returned no results from Snowflake.</p>
          </div>
        )}
      </div>
    </main>
  );
}
