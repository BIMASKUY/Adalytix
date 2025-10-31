# Design Document

## Overview

This design extends the existing Snowflake Next.js POC by transforming the current data visualization dashboard into an interactive chatbot interface. The chatbot will allow users to query Snowflake using natural language, receive text responses, and view charts when applicable. The implementation will leverage the existing API infrastructure and chart rendering capabilities while introducing a new conversational UI layer.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App (Client)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Chat Interface Component                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   Message    │  │  Chat Input  │  │    Chart     │ │ │
│  │  │   Display    │  │   Component  │  │  Renderer    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            │ HTTP POST                       │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Route (/api/snowflake)                 │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         Snowflake SDK Connection Handler         │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Snowflake SDK
                            ▼
                  ┌──────────────────┐
                  │    Snowflake     │
                  │     Database     │
                  └──────────────────┘
```

### Component Structure

The application will be restructured to support a chat-based interface while maintaining compatibility with the existing Snowflake API:

- **Main Page Component** (`app/page.tsx`): Orchestrates the chat interface
- **Chat Message List**: Displays conversation history
- **Chat Input Component**: Handles user input and message submission
- **Chart Renderer**: Adapts existing chart logic for inline display
- **API Route** (`app/api/snowflake/route.ts`): Modified to accept user queries and return structured responses

## Components and Interfaces

### 1. TypeScript Interfaces

```typescript
// Message types for chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: ChartData;
}

// Chart data structure
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

// API request/response
interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

interface ChatResponse {
  message: string;
  chartData?: ChartData;
  error?: string;
}
```

### 2. Main Chat Interface Component

**Location**: `app/page.tsx`

**Responsibilities**:
- Manage chat state (messages array)
- Handle user input submission
- Make API calls to Snowflake endpoint
- Render message list and input components
- Coordinate chart rendering

**State Management**:
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [inputValue, setInputValue] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);
```

**Key Functions**:
- `handleSendMessage()`: Validates input, adds user message, calls API
- `handleApiResponse()`: Processes API response and adds assistant message
- `scrollToBottom()`: Auto-scrolls to latest message

### 3. Message Display Component

**Inline Implementation** (within main component)

**Responsibilities**:
- Render individual chat messages
- Apply appropriate styling based on message role
- Display timestamps
- Render charts when chartData is present

**Styling Approach**:
- User messages: Right-aligned, blue background
- Assistant messages: Left-aligned, gray background
- Chart cards: Full-width, white background with shadow

### 4. Chat Input Component

**Inline Implementation** (within main component)

**Responsibilities**:
- Capture user text input
- Handle Enter key submission
- Disable during loading states
- Clear input after submission

**Features**:
- Auto-focus on mount
- Enter key to send
- Send button with loading state
- Character limit (optional)

### 5. Chart Renderer Component

**Approach**: Adapt existing Recharts implementation

**Responsibilities**:
- Accept chartData prop
- Render appropriate chart type (line, bar, pie)
- Apply responsive container
- Maintain consistent styling with existing POC

**Integration**:
- Reuse Recharts library (already in package.json)
- Adapt existing chart configuration
- Wrap in card component for chat context

### 6. API Route Modifications

**Location**: `app/api/snowflake/route.ts`

**Current Behavior**: Executes hardcoded query and returns raw data

**New Behavior**: 
- Accept user message in request body
- Parse/interpret user intent (simplified for MVP)
- Execute appropriate Snowflake query
- Format response with text and optional chart data
- Return structured ChatResponse

**MVP Approach** (No LLM/NLP):
- For MVP, use simple keyword matching or predefined queries
- Example: "show marketing data" → execute MARKETING_CAMPAIGN query
- Return mock text response with actual data
- Transform data into chart format when applicable

## Data Models

### Message Flow

1. **User Input** → ChatMessage (role: 'user')
2. **API Request** → ChatRequest with message text
3. **Snowflake Query** → Execute SQL based on message
4. **API Response** → ChatResponse with text + optional chartData
5. **Assistant Message** → ChatMessage (role: 'assistant') with chartData

### Chart Data Transformation

The API will transform Snowflake query results into chart-ready format:

```typescript
// Snowflake result
[
  { DATE: '2024-01-01', METRIC: 100 },
  { DATE: '2024-01-02', METRIC: 150 }
]

// Transformed to ChartData
{
  type: 'line',
  data: [
    { x: '2024-01-01', y: 100 },
    { x: '2024-01-02', y: 150 }
  ]
}
```

## Error Handling

### Client-Side Error Handling

1. **Network Errors**: Display error message in chat as assistant message
2. **Empty Input**: Prevent submission, show validation hint
3. **API Errors**: Parse error response and display user-friendly message
4. **Chart Rendering Errors**: Gracefully fall back to text-only response

### API Error Handling

1. **Connection Errors**: Return structured error in ChatResponse
2. **Query Errors**: Log error, return user-friendly message
3. **Timeout Errors**: Implement timeout, return timeout message
4. **Authentication Errors**: Return specific auth error message

### Error Message Display

- Errors displayed as assistant messages with error styling
- Include troubleshooting hints when applicable
- Maintain conversation flow even with errors

## Testing Strategy

### Unit Testing Focus

1. **Message State Management**
   - Test adding user messages
   - Test adding assistant messages
   - Test message ordering

2. **Input Validation**
   - Test empty input prevention
   - Test input clearing after send
   - Test loading state management

3. **Chart Data Transformation**
   - Test Snowflake data → ChartData conversion
   - Test handling missing/malformed data
   - Test different chart types

### Integration Testing Focus

1. **API Integration**
   - Test successful message → response flow
   - Test error response handling
   - Test loading states

2. **Chart Rendering**
   - Test chart appears with valid data
   - Test no chart with text-only response
   - Test chart responsiveness

### Manual Testing Checklist

1. Send message and receive response
2. Verify message alignment (user right, assistant left)
3. Verify chart renders below assistant message
4. Test scrolling with multiple messages
5. Test error scenarios (network failure, invalid query)
6. Test responsive design on mobile
7. Verify no console errors
8. Test Enter key submission
9. Test send button disabled during loading
10. Verify existing Snowflake connection still works

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Header Bar                            │
│  "Snowflake Chat Assistant"                             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Assistant: Hello! Ask me about your data...   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│                    ┌──────────────────────────────┐     │
│                    │  User: Show marketing data   │     │
│                    └──────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Assistant: Here's the marketing campaign data │    │
│  │                                                 │    │
│  │  ┌───────────────────────────────────────┐    │    │
│  │  │         [Chart Visualization]          │    │    │
│  │  └───────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [Scrollable Area]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  [Text Input Field]                    [Send Button]    │
└─────────────────────────────────────────────────────────┘
```

### Styling Guidelines

**Chat Container**:
- Max width: 1200px
- Centered on page
- Scrollable with max height
- Gradient background (maintain existing style)

**Message Bubbles**:
- User: bg-blue-500, text-white, rounded-lg, right-aligned
- Assistant: bg-gray-100, text-gray-900, rounded-lg, left-aligned
- Padding: px-4 py-3
- Max width: 80% of container
- Shadow: shadow-md

**Chart Cards**:
- Full width within message
- White background
- Rounded corners
- Shadow for depth
- Padding: p-4
- Margin top: mt-3

**Input Area**:
- Fixed at bottom
- White background
- Border top
- Flex layout (input + button)
- Input: flex-1, rounded-lg, border
- Button: bg-blue-600, text-white, rounded-lg, px-6

**Loading Indicator**:
- Animated dots or spinner
- Displayed as assistant message
- Gray color scheme

## Implementation Notes

### Reusing Existing Code

1. **Recharts Configuration**: Copy chart setup from current page.tsx
2. **Tailwind Classes**: Maintain existing color scheme and spacing
3. **API Connection**: Keep existing Snowflake connection logic
4. **Error Handling**: Adapt existing error display patterns

### Chart.js vs Recharts

**Decision**: Continue using Recharts (already in dependencies)
- Requirement mentions Chart.js, but Recharts is already integrated
- Recharts is React-friendly and already working
- Switching would add unnecessary complexity
- If Chart.js is strictly required, we can swap later

**Alternative**: If Chart.js is mandatory:
- Install: `npm install chart.js react-chartjs-2`
- Replace Recharts components with Chart.js equivalents
- Minimal code changes needed

### MVP Simplifications

For the initial implementation without a backend LLM:

1. **Query Mapping**: Simple keyword → SQL mapping
   - "marketing" → MARKETING_CAMPAIGN query
   - "campaign" → MARKETING_CAMPAIGN query
   - Default → MARKETING_CAMPAIGN query

2. **Response Generation**: Template-based responses
   - "Here's the data you requested..."
   - "I found X rows matching your query..."

3. **Chart Decision Logic**: Simple heuristics
   - If numeric columns exist → generate line chart
   - If date column exists → use as X-axis
   - First numeric column → Y-axis

### Future Enhancements (Out of Scope)

- Natural language processing with LLM
- Dynamic SQL generation
- Multiple chart types based on data
- Conversation context/memory
- Export functionality
- Message editing/deletion
- Typing indicators
- Message timestamps display

## Dependencies

### Existing Dependencies (No Changes)
- next: ^14.2.0
- react: ^18.3.0
- react-dom: ^18.3.0
- recharts: ^2.10.0 (for charts)
- snowflake-sdk: ^2.3.1
- tailwindcss: ^3.4.0
- typescript: ^5.0.0

### Optional (If Chart.js Required)
- chart.js: ^4.4.0
- react-chartjs-2: ^5.2.0

## Security Considerations

1. **Input Sanitization**: Sanitize user input before sending to API
2. **SQL Injection Prevention**: Use parameterized queries (future enhancement)
3. **Rate Limiting**: Consider adding rate limiting to API (future enhancement)
4. **Error Message Sanitization**: Don't expose sensitive error details to client
5. **Environment Variables**: Keep Snowflake credentials in .env.local (existing)

## Performance Considerations

1. **Message Limit**: Consider limiting chat history to last N messages
2. **Chart Rendering**: Use React.memo for chart components if needed
3. **Auto-scroll**: Debounce scroll-to-bottom on rapid messages
4. **API Timeout**: Set reasonable timeout for Snowflake queries
5. **Loading States**: Show immediate feedback for better UX
