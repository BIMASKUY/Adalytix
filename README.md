# Snowflake Chatbot Interface

A Next.js application that provides a conversational interface to query Snowflake data using natural language. Ask questions about your marketing campaigns and get intelligent responses with data visualizations.

## Overview

This application demonstrates an AI-powered chatbot interface that connects to Snowflake and allows users to query marketing campaign data using natural language. It fetches data from the `SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN` table and provides intelligent responses with interactive charts.

**Note:** This is a POC focused on functionality. For production use, implement proper security measures, OAuth authentication, and backend API architecture.

## Prerequisites

- Node.js 18+ installed
- A Snowflake account with access to a database and warehouse
- Snowflake credentials (account, username, password)
- Required Snowflake permissions (see below)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Snowflake Credentials

Create or update the `.env.local` file in the project root with your Snowflake credentials:

```env
# Your Snowflake account identifier
SNOWFLAKE_ACCOUNT=your_account_identifier

# Your Snowflake username
SNOWFLAKE_USERNAME=your_username

# Your Snowflake password
SNOWFLAKE_PASSWORD=your_password

# The warehouse to use for query execution
SNOWFLAKE_WAREHOUSE=your_warehouse_name

# Database name
SNOWFLAKE_DATABASE=SNOWFLAKEHACKATHON

# Schema name
SNOWFLAKE_SCHEMA=PUBLIC

# Role to use for authentication
SNOWFLAKE_ROLE=your_role_name

# Agent name
SNOWFLAKE_AGENT=your-snowflake-agent

# PAT Token
SNOWFLAKE_PAT_TOKEN=your-snowflake-pat-token
```

#### Understanding Snowflake Account URL Format

Your Snowflake account identifier can be found in your Snowflake account URL. There are two common formats:

**Format 1: Account Locator (Legacy)**
```
https://<account_locator>.<region>.snowflakecomputing.com
```
Example: `xy12345.us-east-1`

In `.env.local`, use: `SNOWFLAKE_ACCOUNT=xy12345.us-east-1`

**Format 2: Organization and Account Name (Preferred)**
```
https://<orgname>-<account_name>.snowflakecomputing.com
```
Example: `myorg-myaccount`

In `.env.local`, use: `SNOWFLAKE_ACCOUNT=myorg-myaccount`

**How to Find Your Account Identifier:**
1. Log into your Snowflake account
2. Look at the URL in your browser
3. Copy the part between `https://` and `.snowflakecomputing.com`
4. Use this value for `SNOWFLAKE_ACCOUNT`

### 3. Set Up Snowflake Database and Table

Ensure your Snowflake account has the required database and table:

```sql
-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS SNOWFLAKEHACKATHON;

-- Use the database
USE DATABASE SNOWFLAKEHACKATHON;

-- Create schema (if not exists)
CREATE SCHEMA IF NOT EXISTS PUBLIC;

-- Create the marketing campaign table
CREATE TABLE IF NOT EXISTS SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN (
  campaign_id VARCHAR(50),
  company VARCHAR(100),
  campaign_type VARCHAR(50),
  target_audience VARCHAR(100),
  duration NUMBER,
  channel_used VARCHAR(50),
  conversion_rate NUMBER(5,2),
  acquisition_cost NUMBER(10,2),
  roi NUMBER(5,2),
  location VARCHAR(100),
  language VARCHAR(50),
  clicks NUMBER,
  impressions NUMBER,
  engagement_score NUMBER(5,2),
  customer_segment VARCHAR(50),
  date DATE,
  campaign_year NUMBER,
  campaign_month NUMBER,
  campaign_quarter NUMBER,
  campaign_weekday VARCHAR(20),
  roi_per_cost NUMBER(10,4),
  engagement_ratio NUMBER(10,4),
  cost_per_click NUMBER(10,2),
  cost_per_engagement NUMBER(10,2),
  audience_type VARCHAR(50),
  roi_level VARCHAR(20),
  engagement_level VARCHAR(20),
  cost_efficiency VARCHAR(20),
  is_high_roi BOOLEAN,
  is_high_engagement BOOLEAN,
  is_cost_efficient BOOLEAN,
  performance_index NUMBER(10,4)
);

-- Insert sample data (you can add your own marketing campaign data)
-- The application expects data in this table to answer questions about campaigns
```

### 4. Required Snowflake Permissions

Your Snowflake role must have the following permissions:

```sql
-- Grant usage on warehouse
GRANT USAGE ON WAREHOUSE <your_warehouse_name> TO ROLE <your_role_name>;

-- Grant usage on database
GRANT USAGE ON DATABASE SNOWFLAKEHACKATHON TO ROLE <your_role_name>;

-- Grant usage on schema
GRANT USAGE ON SCHEMA SNOWFLAKEHACKATHON.PUBLIC TO ROLE <your_role_name>;

-- Grant select on table
GRANT SELECT ON TABLE SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN TO ROLE <your_role_name>;
```

**Minimum Required Permissions:**
- `USAGE` on the warehouse (to execute queries)
- `USAGE` on the database and schema (to access objects)
- `SELECT` on the `MARKETING_CAMPAIGN` table (to query data)

**Recommended Role:** Use a role like `ACCOUNTADMIN` for POC testing, but create a custom role with minimal permissions for production.

### 5. Ensure Warehouse is Running

Your Snowflake warehouse must be running or have auto-resume enabled:

```sql
-- Check warehouse status
SHOW WAREHOUSES LIKE '<your_warehouse_name>';

-- Start warehouse if suspended
ALTER WAREHOUSE <your_warehouse_name> RESUME;

-- Enable auto-resume (recommended)
ALTER WAREHOUSE <your_warehouse_name> SET AUTO_RESUME = TRUE;
```

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use the Chatbot

Once the application is running, you can ask questions about your marketing campaigns in natural language:

### Example Questions

**ROI Analysis:**
- "What's the average ROI?"
- "Show me campaigns with high ROI"
- "What's the best performing campaign?"

**Conversion Rates:**
- "What are the conversion rates?"
- "Show me high conversion campaigns"

**Cost Analysis:**
- "What are the acquisition costs?"
- "Which campaigns are most cost-efficient?"
- "Show me low-cost campaigns"

**Channel Performance:**
- "Which channel performs best?"
- "Show me social media campaigns"
- "How do email campaigns perform?"

**Engagement:**
- "What's the engagement score?"
- "Show me campaigns with high engagement"

**General Queries:**
- "How many campaigns are there?"
- "Show me recent campaigns"
- "What's the latest data?"

The chatbot will analyze your question, query the appropriate data from Snowflake, and provide:
- A natural language response with specific metrics
- An interactive chart visualizing the data
- Helpful suggestions for follow-up questions

## Troubleshooting

### Common Issues and Solutions

#### 1. CORS Errors

**Symptom:** Browser console shows CORS policy errors when trying to reach Snowflake API.

**Solution:** This POC uses a Next.js API route (`/api/snowflake`) as a proxy to avoid CORS issues. The proxy runs server-side where CORS restrictions don't apply. Ensure you're calling `/api/snowflake` from the frontend, not the Snowflake API directly.

**Verify:**
- Check that `app/page.tsx` fetches from `/api/snowflake`
- Check that `app/api/snowflake/route.ts` exists and is properly configured

#### 2. Authentication Failed (401 Error)

**Symptom:** Error message: "Authentication failed" or 401 status code.

**Possible Causes and Solutions:**

**a) Incorrect Credentials**
- Double-check username and password in `.env.local`
- Verify credentials by logging into Snowflake web UI
- Ensure no extra spaces or quotes in `.env.local` values

**b) Incorrect Account Identifier**
- Verify `SNOWFLAKE_ACCOUNT` matches your Snowflake URL
- Try both formats: `account.region` or `orgname-accountname`
- Don't include `https://` or `.snowflakecomputing.com`

**c) Password Special Characters**
- If password contains special characters, ensure they're not causing issues
- Try resetting password to use only alphanumeric characters for testing

**d) Account Locked or Expired**
- Check if your Snowflake account is active
- Verify password hasn't expired

#### 3. Network Timeout or Connection Refused

**Symptom:** Request times out or connection is refused.

**Solutions:**
- Check your internet connection
- Verify Snowflake account is accessible (try logging in via web UI)
- Check if your network/firewall blocks Snowflake domains
- Verify the account identifier is correct

#### 4. Warehouse Not Available

**Symptom:** Error message about warehouse not being available or suspended.

**Solutions:**
```sql
-- Resume the warehouse
ALTER WAREHOUSE <your_warehouse_name> RESUME;

-- Enable auto-resume
ALTER WAREHOUSE <your_warehouse_name> SET AUTO_RESUME = TRUE;
```

#### 5. Permission Denied Errors

**Symptom:** Error message about insufficient privileges or access denied.

**Solutions:**
- Verify your role has required permissions (see "Required Snowflake Permissions" above)
- Check that the role specified in `.env.local` is assigned to your user
- Try using `ACCOUNTADMIN` role for testing (if you have access)

```sql
-- Check your current role
SELECT CURRENT_ROLE();

-- Check roles assigned to your user
SHOW GRANTS TO USER <your_username>;

-- Grant role to user (if needed)
GRANT ROLE <your_role_name> TO USER <your_username>;
```

#### 6. Table or Database Not Found

**Symptom:** Error message: "Object does not exist" or similar.

**Solutions:**
- Verify the database exists: `SHOW DATABASES LIKE 'SNOWFLAKEHACKATHON';`
- Verify the table exists: `SHOW TABLES LIKE 'MARKETING_CAMPAIGN' IN SNOWFLAKEHACKATHON.PUBLIC;`
- Run the setup SQL from "Set Up Snowflake Database and Table" section
- Check for typos in database/schema/table names

#### 7. Empty Data or "No data available"

**Symptom:** Application loads successfully but shows no data.

**Solutions:**
- Verify table has data: `SELECT COUNT(*) FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN;`
- Ensure your table has marketing campaign data
- Check browser console for API errors

#### 8. Environment Variables Not Loading

**Symptom:** Undefined or null values for Snowflake configuration.

**Solutions:**
- Ensure `.env.local` is in the project root directory
- Restart the Next.js dev server after changing `.env.local`
- Verify variable names match exactly (case-sensitive)
- Don't use quotes around values in `.env.local`

#### 9. TypeScript or Build Errors

**Symptom:** Compilation errors or type errors.

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### Debugging Tips

1. **Check API Response:**
   - Open browser DevTools → Network tab
   - Look for the request to `/api/snowflake`
   - Check the response status and body

2. **Check Server Logs:**
   - Look at the terminal where `npm run dev` is running
   - Server-side errors will appear here

3. **Test Snowflake Connection:**
   - Log into Snowflake web UI
   - Run the query manually: `SELECT * FROM SNOWFLAKEHACKATHON.PUBLIC.MARKETING_CAMPAIGN LIMIT 10;`
   - Verify it returns data

4. **Enable Verbose Logging:**
   - Add `console.log` statements in `app/api/snowflake/route.ts`
   - Log the request being sent to Snowflake
   - Log the response received

## Project Structure

```
project-root/
├── .env.local             # Snowflake credentials (not committed to git)
├── .env.example           # Change file name to .env.local
├── app/
│   ├── page.tsx           # Chat interface with message handling
│   ├── api/
│   │   └── snowflake/
│   │       └── route.ts   # API route with intelligent query mapping
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── package.json           # Dependencies
└── README.md              # This file
```

## Technologies Used

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Recharts** - Chart visualization library (Line, Bar, Pie charts)
- **Tailwind CSS** - Utility-first CSS framework
- **Snowflake SDK** - Node.js connector for Snowflake
- **React Hooks** - useState, useEffect, useRef for state management

## Features

- 🤖 **Natural Language Interface** - Ask questions in plain English
- 📊 **Smart Data Visualization** - Automatic chart generation based on your question
- 💬 **Conversational UI** - Chat-like interface with message history
- 🎯 **Context-Aware Responses** - Intelligent answers with specific metrics
- 📈 **Multiple Chart Types** - Line, bar, and pie charts
- 🔄 **Real-time Queries** - Direct connection to Snowflake
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Fast Performance** - Optimized queries and rendering
- 🎨 **Modern UI** - Clean, professional interface with Tailwind CSS

## Security Considerations for Production

This POC stores credentials in `.env.local` for simplicity. For production deployments:

1. **Use OAuth or Key-Pair Authentication** instead of username/password
2. **Implement proper backend API** instead of direct database queries
3. **Add rate limiting** to prevent abuse
4. **Use connection pooling** for better performance
5. **Implement request validation** and input sanitization
6. **Store credentials in secure vault** (AWS Secrets Manager, Azure Key Vault, etc.)
7. **Add logging and monitoring** for security events
8. **Implement role-based access control** (RBAC)
9. **Use HTTPS** for all connections
10. **Regular security audits** and dependency updates

## License

This is a proof-of-concept project for demonstration purposes.
