import { NextRequest, NextResponse } from 'next/server';
import snowflake from 'snowflake-sdk';

interface SnowflakeRow {
  [key: string]: any;
}

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

// Subtask 6.2: Simple query mapping logic
function mapMessageToQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // High ROI campaigns
  if (lowerMessage.includes('high roi') || lowerMessage.includes('best roi') || lowerMessage.includes('top roi')) {
    return 'SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN WHERE roi > 50 ORDER BY roi DESC LIMIT 50;';
  }
  
  // Conversion rate queries
  if (lowerMessage.includes('conversion') && (lowerMessage.includes('high') || lowerMessage.includes('best'))) {
    return 'SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN ORDER BY conversion_rate DESC LIMIT 50;';
  }
  
  // Cost-related queries
  if (lowerMessage.includes('cost') && (lowerMessage.includes('low') || lowerMessage.includes('cheap'))) {
    return 'SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN ORDER BY acquisition_cost ASC LIMIT 50;';
  }
  
  // Channel-specific queries
  if (lowerMessage.includes('social media')) {
    return "SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN WHERE channel_used = 'Social Media' LIMIT 100;";
  }
  if (lowerMessage.includes('email')) {
    return "SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN WHERE channel_used = 'Email' LIMIT 100;";
  }
  if (lowerMessage.includes('search') || lowerMessage.includes('google')) {
    return "SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN WHERE channel_used = 'Search' LIMIT 100;";
  }
  
  // Time-based queries
  if (lowerMessage.includes('recent') || lowerMessage.includes('latest')) {
    return 'SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN ORDER BY date DESC LIMIT 50;';
  }
  
  // Default to all marketing campaigns
  return 'SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN LIMIT 100;';
}

// Subtask 6.3: Transform Snowflake results to ChatResponse format
function transformToChartData(rows: SnowflakeRow[], userMessage?: string): ChartData | undefined {
  if (!rows || rows.length === 0) {
    return undefined;
  }

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const lowerMessage = (userMessage || '').toLowerCase();
  
  // Determine what metric to visualize based on the question
  let yAxisKey = 'roi'; // default
  let chartType: 'line' | 'bar' | 'pie' = 'bar';
  
  if (lowerMessage.includes('roi')) {
    yAxisKey = 'roi';
    chartType = 'bar';
  } else if (lowerMessage.includes('conversion')) {
    yAxisKey = 'conversion_rate';
    chartType = 'bar';
  } else if (lowerMessage.includes('cost')) {
    yAxisKey = 'acquisition_cost';
    chartType = 'bar';
  } else if (lowerMessage.includes('engagement')) {
    yAxisKey = 'engagement_score';
    chartType = 'bar';
  } else if (lowerMessage.includes('channel')) {
    // For channel questions, create a pie chart
    const channelCounts = rows.reduce((acc: any, row) => {
      const channel = row.channel_used || 'Unknown';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {});
    
    const chartDataPoints: ChartDataPoint[] = Object.entries(channelCounts).map(([channel, count]) => ({
      x: channel,
      y: count as number,
      label: channel
    }));
    
    return {
      type: 'pie',
      data: chartDataPoints,
      labels: Object.keys(channelCounts)
    };
  }
  
  // Check if the metric exists in the data
  if (!keys.includes(yAxisKey)) {
    // Fall back to first numeric column
    const numericColumns = keys.filter(key => typeof firstRow[key] === 'number');
    if (numericColumns.length > 0) {
      yAxisKey = numericColumns[0];
    } else {
      return undefined;
    }
  }
  
  // Determine x-axis (prefer campaign_type, then date, then campaign_id)
  let xAxisKey = 'campaign_type';
  if (!keys.includes(xAxisKey)) {
    xAxisKey = keys.find(k => k.toLowerCase().includes('date')) || 'campaign_id';
  }
  
  // Limit to top 20 for readability
  const limitedRows = rows.slice(0, 20);
  
  const chartDataPoints: ChartDataPoint[] = limitedRows.map(row => ({
    x: row[xAxisKey]?.toString() || 'Unknown',
    y: Number(row[yAxisKey]) || 0,
    label: row[xAxisKey]?.toString() || 'Unknown'
  }));

  return {
    type: chartType,
    data: chartDataPoints,
    labels: limitedRows.map(row => row[xAxisKey]?.toString() || 'Unknown')
  };
}

function createResponseMessage(rows: SnowflakeRow[], userMessage: string): string {
  const rowCount = rows.length;
  
  if (rowCount === 0) {
    return "I couldn't find any data matching your query. Please try a different question.";
  }

  const lowerMessage = userMessage.toLowerCase();
  
  // Analyze the data to provide intelligent responses
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  
  // Check what the user is asking about
  if (lowerMessage.includes('how many') || lowerMessage.includes('count')) {
    return `I found ${rowCount} marketing campaigns in the database. The chart below shows the distribution of the data.`;
  }
  
  if (lowerMessage.includes('roi') || lowerMessage.includes('return on investment')) {
    const roiValues = rows.map(r => Number(r.roi || 0)).filter(v => !isNaN(v));
    if (roiValues.length > 0) {
      const avgROI = (roiValues.reduce((a, b) => a + b, 0) / roiValues.length).toFixed(2);
      const maxROI = Math.max(...roiValues).toFixed(2);
      const minROI = Math.min(...roiValues).toFixed(2);
      return `Based on ${rowCount} campaigns:\n• Average ROI: ${avgROI}%\n• Highest ROI: ${maxROI}%\n• Lowest ROI: ${minROI}%\n\nThe chart below visualizes the ROI trends.`;
    }
  }
  
  if (lowerMessage.includes('conversion') || lowerMessage.includes('conversion rate')) {
    const conversionRates = rows.map(r => Number(r.conversion_rate || 0)).filter(v => !isNaN(v));
    if (conversionRates.length > 0) {
      const avgConversion = (conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length).toFixed(2);
      const maxConversion = Math.max(...conversionRates).toFixed(2);
      return `Conversion rate analysis from ${rowCount} campaigns:\n• Average conversion rate: ${avgConversion}%\n• Best performing: ${maxConversion}%\n\nSee the chart below for detailed trends.`;
    }
  }
  
  if (lowerMessage.includes('cost') || lowerMessage.includes('acquisition cost')) {
    const costs = rows.map(r => Number(r.acquisition_cost || 0)).filter(v => !isNaN(v));
    if (costs.length > 0) {
      const avgCost = (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2);
      const totalCost = costs.reduce((a, b) => a + b, 0).toFixed(2);
      return `Cost analysis from ${rowCount} campaigns:\n• Average acquisition cost: $${avgCost}\n• Total cost: $${totalCost}\n\nThe chart shows cost distribution across campaigns.`;
    }
  }
  
  if (lowerMessage.includes('engagement')) {
    const engagementScores = rows.map(r => Number(r.engagement_score || 0)).filter(v => !isNaN(v));
    if (engagementScores.length > 0) {
      const avgEngagement = (engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length).toFixed(2);
      return `Engagement analysis from ${rowCount} campaigns:\n• Average engagement score: ${avgEngagement}\n\nThe chart below shows engagement patterns.`;
    }
  }
  
  if (lowerMessage.includes('channel') || lowerMessage.includes('platform')) {
    const channels = rows.map(r => r.channel_used).filter(Boolean);
    const channelCounts = channels.reduce((acc: any, ch) => {
      acc[ch] = (acc[ch] || 0) + 1;
      return acc;
    }, {});
    const topChannel = Object.entries(channelCounts).sort((a: any, b: any) => b[1] - a[1])[0];
    if (topChannel) {
      return `Channel analysis from ${rowCount} campaigns:\n• Most used channel: ${topChannel[0]} (${topChannel[1]} campaigns)\n• Total channels: ${Object.keys(channelCounts).length}\n\nThe chart shows channel distribution.`;
    }
  }
  
  if (lowerMessage.includes('best') || lowerMessage.includes('top') || lowerMessage.includes('highest')) {
    const roiValues = rows.map(r => ({ roi: Number(r.roi || 0), campaign: r.campaign_type || r.campaign_id }));
    const topCampaign = roiValues.sort((a, b) => b.roi - a.roi)[0];
    if (topCampaign) {
      return `Top performing campaign:\n• Campaign: ${topCampaign.campaign}\n• ROI: ${topCampaign.roi.toFixed(2)}%\n\nAnalyzed ${rowCount} campaigns. See the chart for comparison.`;
    }
  }
  
  // Default response with more context
  return `I analyzed ${rowCount} marketing campaigns. The data includes metrics like ROI, conversion rates, costs, and engagement scores. The chart below visualizes key trends. Try asking specific questions like:\n• "What's the average ROI?"\n• "Which channel performs best?"\n• "Show me conversion rates"`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return new Promise<NextResponse>(async (resolve) => {
    try {
      // Subtask 6.1: Parse message from request body
      let chatRequest: ChatRequest;
      
      try {
        const body = await request.json();
        chatRequest = body as ChatRequest;
      } catch (parseError) {
        // Subtask 6.4: Wrap errors in ChatResponse format
        resolve(NextResponse.json(
          {
            message: '',
            error: 'Invalid request format. Please send a valid JSON body with a message field.'
          } as ChatResponse,
          { status: 400 }
        ));
        return;
      }

      // If no message provided, return error in ChatResponse format
      if (!chatRequest.message) {
        resolve(NextResponse.json(
          {
            message: '',
            error: 'No message provided. Please include a message in your request.'
          } as ChatResponse,
          { status: 400 }
        ));
        return;
      }

      // Read credentials from environment variables (keeping existing logic)
      const account = process.env.SNOWFLAKE_ACCOUNT;
      const username = process.env.SNOWFLAKE_USERNAME;
      const password = process.env.SNOWFLAKE_PASSWORD;
      const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
      const database = process.env.SNOWFLAKE_DATABASE || 'SNOWFLAKEHACKATHON';
      const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';
      const role = process.env.SNOWFLAKE_ROLE;

      // Validate required credentials
      if (!account || !username || !password || !warehouse || !role) {
        // Subtask 6.4: Return user-friendly error messages in ChatResponse format
        resolve(NextResponse.json(
          {
            message: '',
            error: 'Missing Snowflake credentials. Please check your .env.local file.'
          } as ChatResponse,
          { status: 500 }
        ));
        return;
      }

      // Create Snowflake connection (keeping existing logic)
      const connection = snowflake.createConnection({
        account: account,
        username: username,
        password: password,
        warehouse: warehouse,
        database: database,
        schema: schema,
        role: role,
      });

      // Connect to Snowflake
      connection.connect((err, conn) => {
        if (err) {
          // Subtask 6.4: Maintain existing error logging
          console.error('Unable to connect to Snowflake:', err);
          // Subtask 6.4: Return user-friendly error in ChatResponse format
          resolve(NextResponse.json(
            {
              message: '',
              error: 'Failed to connect to Snowflake. Please check your credentials and try again.'
            } as ChatResponse,
            { status: 500 }
          ));
          return;
        }

        console.log('Successfully connected to Snowflake');

        // Subtask 6.2: Map user message to SQL query
        const sqlQuery = mapMessageToQuery(chatRequest.message);

        console.log('Executing query:', sqlQuery);

        connection.execute({
          sqlText: sqlQuery,
          complete: (err, stmt, rows) => {
            console.log('Query completed. Error:', err, 'Rows count:', rows?.length);

            // Always destroy connection after query
            connection.destroy((destroyErr) => {
              if (destroyErr) {
                console.error('Failed to destroy connection:', destroyErr);
              } else {
                console.log('Connection destroyed successfully');
              }
            });

            if (err) {
              // Subtask 6.4: Maintain existing error logging
              console.error('Failed to execute query:', err);
              // Subtask 6.4: Return user-friendly error in ChatResponse format
              resolve(NextResponse.json(
                {
                  message: '',
                  error: 'Query execution failed. Please try rephrasing your question.'
                } as ChatResponse,
                { status: 500 }
              ));
              return;
            }

            console.log('Returning data with', (rows || []).length, 'rows');

            // Subtask 6.3: Transform data rows to ChartData format
            const snowflakeRows = (rows || []) as SnowflakeRow[];
            const chartData = transformToChartData(snowflakeRows, chatRequest.message);
            
            // Subtask 6.3: Create response text based on query results
            const responseMessage = createResponseMessage(snowflakeRows, chatRequest.message);

            // Subtask 6.3: Return structured ChatResponse with message and chartData
            const chatResponse: ChatResponse = {
              message: responseMessage,
              chartData: chartData
            };

            resolve(NextResponse.json(chatResponse));
          }
        });
      });

    } catch (error) {
      // Subtask 6.4: Maintain existing error logging
      console.error('Snowflake SDK error:', error);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Subtask 6.4: Wrap errors in ChatResponse format
      resolve(NextResponse.json(
        {
          message: '',
          error: errorMessage
        } as ChatResponse,
        { status: 500 }
      ));
    }
  });
}
