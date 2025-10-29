# Design Document

## Overview

This POC implements a single Next.js page that queries Snowflake's SQL REST API directly from the client-side and visualizes the results. The architecture prioritizes simplicity and quick setup over security and scalability, as this is a temporary proof of concept.

The application will use:
- Next.js 14+ with TypeScript and App Router
- Recharts for data visualization (lighter weight than Chart.js, better TypeScript support)
- Native fetch API for HTTP requests
- React hooks for state management

## Architecture

### Component Structure

```
app/
└── page.tsx (Main dashboard component)
    ├── SnowflakeDataFetcher (logic hook)
    ├── MetricsChart (Recharts line chart)
    └── DataTable (HTML table)
```

### Data Flow

1. Component mounts → triggers data fetch
2. Fetch calls Snowflake SQL REST API with credentials
3. Parse JSON response → extract data rows
4. Update React state with parsed data
5. Render chart and table with data

### CORS Workaround Strategy

Since Snowflake's API will likely block direct browser requests due to CORS, we'll implement a Next.js API route as a simple proxy:

```
Client (page.tsx) → Next.js API Route (/api/snowflake) → Snowflake REST API
```

This keeps the solution self-contained within the Next.js project without requiring external proxy services.

## Components and Interfaces

### 1. Main Page Component (`app/page.tsx`)

**Responsibilities:**
- Orchestrate data fetching on component mount
- Manage loading, error, and data states
- Render chart and table components

**State:**
```typescript
interface SnowflakeRow {
  DATE: string;
  TIME: string;
  METRIC: number;
}

interface PageState {
  data: SnowflakeRow[];
  loading: boolean;
  error: string | null;
}
```

### 2. API Proxy Route (`app/api/snowflake/route.ts`)

**Responsibilities:**
- Receive requests from the frontend
- Forward requests to Snowflake SQL REST API with credentials
- Handle authentication and headers
- Return response to frontend

**Configuration:**
```typescript
interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  warehouse: string;
  database: string;
  schema: string;
  role: string;
}
```

**API Endpoint:**
- Method: POST
- Path: `/api/snowflake`
- Request Body: `{ query: string }`
- Response: `{ data: SnowflakeRow[], error?: string }`

### 3. Chart Component (Inline in page.tsx)

**Responsibilities:**
- Render line chart using Recharts
- Format x-axis with DATE/TIME combination
- Display METRIC values on y-axis

**Props:**
```typescript
interface ChartProps {
  data: SnowflakeRow[];
}
```

### 4. Table Component (Inline in page.tsx)

**Responsibilities:**
- Render HTML table with data
- Display column headers
- Format data rows

**Props:**
```typescript
interface TableProps {
  data: SnowflakeRow[];
}
```

## Data Models

### Snowflake API Request

```typescript
// POST to https://<account>.snowflakecomputing.com/api/v2/statements
{
  "statement": "SELECT DATE, TIME, METRIC FROM BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS LIMIT 10;",
  "timeout": 60,
  "database": "BIMA_DUMMY_DB",
  "schema": "PUBLIC",
  "warehouse": "<warehouse_name>",
  "role": "<role_name>"
}
```

### Snowflake API Response

```typescript
{
  "resultSetMetaData": {
    "numRows": number,
    "format": string,
    "rowType": Array<{name: string, type: string}>
  },
  "data": Array<Array<string | number>>,
  "code": string,
  "statementHandle": string,
  "message": string
}
```

### Transformed Data Model

```typescript
interface SnowflakeRow {
  DATE: string;      // e.g., "2024-01-15"
  TIME: string;      // e.g., "14:30:00"
  METRIC: number;    // e.g., 42.5
}
```

## Error Handling

### Error Categories

1. **Network Errors**: Failed fetch, timeout
2. **Authentication Errors**: Invalid credentials, expired token
3. **API Errors**: Snowflake returns error response
4. **Data Parsing Errors**: Unexpected response format

### Error Handling Strategy

```typescript
try {
  // Fetch data
} catch (error) {
  if (error instanceof TypeError) {
    // Network error
    setError("Network error: Unable to reach Snowflake API");
  } else if (error.message.includes("401")) {
    // Auth error
    setError("Authentication failed: Check your credentials");
  } else {
    // Generic error
    setError(`Error: ${error.message}`);
  }
}
```

### User Feedback

- Loading state: Display "Loading data from Snowflake..."
- Error state: Display error message in red with troubleshooting hints
- Empty state: Display "No data available"
- Success state: Display chart and table

## Testing Strategy

### Manual Testing Checklist

1. **Successful Data Fetch**
   - Verify chart renders with correct data
   - Verify table displays all 10 rows
   - Verify x-axis shows DATE/TIME labels
   - Verify y-axis shows METRIC values

2. **Error Scenarios**
   - Test with invalid credentials → should show auth error
   - Test with invalid account → should show network error
   - Test with malformed query → should show API error

3. **UI/UX**
   - Verify loading spinner appears during fetch
   - Verify error messages are readable
   - Verify chart is responsive
   - Verify table formatting is clean

### Testing Approach

Since this is a POC, automated tests are not required. Manual testing in the browser will be sufficient to verify functionality.

## Configuration Setup

### Environment Variables

Create `.env.local` file:

```env
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=BIMA_DUMMY_DB
SNOWFLAKE_SCHEMA=PUBLIC
SNOWFLAKE_ROLE=your_role
```

### Security Notes for POC

- Credentials are stored in `.env.local` (not committed to git)
- API route runs server-side, so credentials are not exposed to browser
- For production, use OAuth or key-pair authentication
- For production, implement rate limiting and request validation

## Implementation Notes

### Dependencies Required

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### File Structure

```
project-root/
├── .env.local (credentials - not committed)
├── app/
│   ├── page.tsx (main dashboard)
│   ├── api/
│   │   └── snowflake/
│   │       └── route.ts (proxy endpoint)
│   └── globals.css (basic styling)
├── package.json
└── tsconfig.json
```

### Styling Approach

Use minimal inline styles and Tailwind CSS (included in Next.js by default) for quick styling without additional CSS files.
