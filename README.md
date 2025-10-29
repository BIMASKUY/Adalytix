# Snowflake Next.js POC

A proof-of-concept Next.js application that queries Snowflake using the SQL REST API and visualizes analytics data with line charts and data tables.

## Overview

This POC demonstrates direct integration between a Next.js frontend and Snowflake's SQL REST API. It fetches data from the `BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS` table and displays it in both visual (line chart) and tabular formats.

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
SNOWFLAKE_DATABASE=BIMA_DUMMY_DB

# Schema name
SNOWFLAKE_SCHEMA=PUBLIC

# Role to use for authentication
SNOWFLAKE_ROLE=your_role_name
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
CREATE DATABASE IF NOT EXISTS BIMA_DUMMY_DB;

-- Use the database
USE DATABASE BIMA_DUMMY_DB;

-- Create schema (if not exists)
CREATE SCHEMA IF NOT EXISTS PUBLIC;

-- Create the analytics table
CREATE TABLE IF NOT EXISTS BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS (
  DATE DATE,
  TIME TIME,
  METRIC NUMBER
);

-- Insert sample data
INSERT INTO BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS VALUES
  ('2024-01-15', '08:00:00', 42.5),
  ('2024-01-15', '09:00:00', 45.2),
  ('2024-01-15', '10:00:00', 48.7),
  ('2024-01-15', '11:00:00', 51.3),
  ('2024-01-15', '12:00:00', 49.8),
  ('2024-01-15', '13:00:00', 52.1),
  ('2024-01-15', '14:00:00', 55.6),
  ('2024-01-15', '15:00:00', 53.4),
  ('2024-01-15', '16:00:00', 50.9),
  ('2024-01-15', '17:00:00', 47.2);
```

### 4. Required Snowflake Permissions

Your Snowflake role must have the following permissions:

```sql
-- Grant usage on warehouse
GRANT USAGE ON WAREHOUSE <your_warehouse_name> TO ROLE <your_role_name>;

-- Grant usage on database
GRANT USAGE ON DATABASE BIMA_DUMMY_DB TO ROLE <your_role_name>;

-- Grant usage on schema
GRANT USAGE ON SCHEMA BIMA_DUMMY_DB.PUBLIC TO ROLE <your_role_name>;

-- Grant select on table
GRANT SELECT ON TABLE BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS TO ROLE <your_role_name>;
```

**Minimum Required Permissions:**
- `USAGE` on the warehouse (to execute queries)
- `USAGE` on the database and schema (to access objects)
- `SELECT` on the `HOURLY_ANALYTICS` table (to query data)

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
- Verify the database exists: `SHOW DATABASES LIKE 'BIMA_DUMMY_DB';`
- Verify the table exists: `SHOW TABLES LIKE 'HOURLY_ANALYTICS' IN BIMA_DUMMY_DB.PUBLIC;`
- Run the setup SQL from "Set Up Snowflake Database and Table" section
- Check for typos in database/schema/table names

#### 7. Empty Data or "No data available"

**Symptom:** Application loads successfully but shows no data.

**Solutions:**
- Verify table has data: `SELECT COUNT(*) FROM BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS;`
- Insert sample data using the SQL from setup instructions
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
   - Run the query manually: `SELECT DATE, TIME, METRIC FROM BIMA_DUMMY_DB.PUBLIC.HOURLY_ANALYTICS LIMIT 10;`
   - Verify it returns data

4. **Enable Verbose Logging:**
   - Add `console.log` statements in `app/api/snowflake/route.ts`
   - Log the request being sent to Snowflake
   - Log the response received

## Project Structure

```
project-root/
├── .env.local              # Snowflake credentials (not committed to git)
├── app/
│   ├── page.tsx           # Main dashboard with chart and table
│   ├── api/
│   │   └── snowflake/
│   │       └── route.ts   # API proxy to Snowflake
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── package.json           # Dependencies
└── README.md             # This file
```

## Technologies Used

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Recharts** - Chart visualization library
- **Tailwind CSS** - Utility-first CSS framework
- **Snowflake SQL REST API** - Direct database queries

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
