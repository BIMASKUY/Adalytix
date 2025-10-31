'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// TypeScript interfaces for data models
interface SnowflakeRow {
  [key: string]: any;
}

interface ApiResponse {
  data: SnowflakeRow[];
  error?: string;
}

// Chat interface types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: ChartData;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie';
  data: ChartDataPoint[];
  labels?: string[];
}

interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

interface ChatResponse {
  message: string;
  chartData?: ChartData;
  error?: string;
}

export default function Home() {
  // React state management for data, loading, and error states
  const [data, setData] = useState<SnowflakeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper function to format timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Chart renderer function - Subtask 7.1
  const renderChart = (chartData: ChartData) => {
    // Conditionally render chart only when chartData exists
    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return null;
    }

    // Transform ChartDataPoint[] to Recharts format
    const chartDataFormatted = chartData.data.map(point => ({
      name: point.x,
      value: point.y,
      label: point.label
    }));

    // Subtask 7.2: Configure chart based on chartData.type
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    let chartComponent;
    
    switch (chartData.type) {
      case 'line':
        chartComponent = (
          <LineChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        );
        break;
      case 'bar':
        chartComponent = (
          <BarChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        );
        break;
      case 'pie':
        chartComponent = (
          <PieChart>
            <Pie
              data={chartDataFormatted}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chartDataFormatted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
        break;
      default:
        // Default to line chart if type is not recognized
        chartComponent = (
          <LineChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        );
    }

    // Subtask 7.3: Wrap chart in card div with Tailwind classes
    return (
      <div className="mt-3 bg-white rounded-lg shadow-md p-4">
        <ResponsiveContainer width="100%" height={300}>
          {chartComponent}
        </ResponsiveContainer>
      </div>
    );
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    // Subtask 5.1: Validate input is not empty
    if (!inputValue.trim() || isLoading) return;

    const userMessageContent = inputValue.trim();

    // Subtask 5.1: Create user message object with unique ID and timestamp
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };

    // Subtask 5.1: Add user message to messages array
    setMessages(prev => [...prev, userMessage]);
    
    // Subtask 5.1: Clear input field
    setInputValue('');
    
    // Reset focus to input field
    inputRef.current?.focus();
    
    // Subtask 5.1: Set loading state to true
    setIsLoading(true);

    try {
      // Subtask 5.2: Make POST request to /api/snowflake with user message
      const response = await fetch('/api/snowflake', {
        method: 'POST',
        // Subtask 5.2: Include proper headers (Content-Type: application/json)
        headers: {
          'Content-Type': 'application/json',
        },
        // Subtask 5.2: Handle request body with ChatRequest structure
        body: JSON.stringify({
          message: userMessageContent,
          conversationHistory: messages
        } as ChatRequest)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      // Subtask 5.3: Parse ChatResponse from API
      const result: ChatResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Subtask 5.3: Create assistant message object with response text
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        // Subtask 5.3: Include chartData if present in response
        chartData: result.chartData
      };

      // Subtask 5.3: Add assistant message to messages array
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      // Subtask 5.4: Catch API errors and network failures
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof TypeError) {
        errorMessage = 'Network error: Unable to reach the API. Please check your connection.';
      } else if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('authentication')) {
          errorMessage = 'Authentication failed: Please check your Snowflake credentials.';
        } else if (err.message.includes('404')) {
          errorMessage = 'API endpoint not found. Please ensure the service is running.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error: The Snowflake service encountered an error.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }

      // Subtask 5.4: Create error message as assistant message
      // Subtask 5.4: Display user-friendly error text
      const errorAssistantMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: `❌ ${errorMessage}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      // Subtask 5.3 & 5.4: Set loading state to false
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Snowflake Chat Assistant
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Ask questions about your data in natural language
          </p>
        </div>
      </header>

      {/* Main Content - Chat Interface */}
      {/* Subtask 8.1: Style main chat container with gradient background, centered, max-width, proper padding */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-140px)]">
        
        {/* Messages Container - Scrollable */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4 px-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm mt-2">Ask me about your Snowflake data</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === 'user' ? '' : 'w-full'
                    }`}
                  >
                    {/* Subtask 8.2: Style message bubbles with proper colors, alignment, rounded corners, padding, shadows */}
                    <div
                      className={`rounded-xl px-4 py-3 shadow-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                    {/* Render chart if chartData exists - Subtask 7.1 */}
                    {message.chartData && renderChart(message.chartData)}
                  </div>
                </div>
              ))}
              
              {/* Subtask 8.4: Add loading indicator styling - animated dots as assistant message */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="rounded-xl px-4 py-3 shadow-lg bg-gray-50 text-gray-900 border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at Bottom */}
        {/* Subtask 8.3: Style input area with flex layout, borders, rounded corners, proper spacing */}
        <div className="bg-white border-t-2 border-gray-200 p-4 rounded-xl shadow-xl">
          <div className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputValue.trim() && !isLoading) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </span>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
