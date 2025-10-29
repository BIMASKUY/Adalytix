import { NextRequest, NextResponse } from 'next/server';
import snowflake from 'snowflake-sdk';

interface SnowflakeRow {
  DATE: string;
  TIME: string;
  METRIC: number;
}

export async function POST(request: NextRequest) {
  return new Promise((resolve) => {
    try {
      // Read credentials from environment variables
      const account = process.env.SNOWFLAKE_ACCOUNT;
      const username = process.env.SNOWFLAKE_USERNAME;
      const password = process.env.SNOWFLAKE_PASSWORD;
      const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
      const database = process.env.SNOWFLAKE_DATABASE || 'BIMA_DUMMY_DB';
      const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';
      const role = process.env.SNOWFLAKE_ROLE;

      // Validate required credentials
      if (!account || !username || !password || !warehouse || !role) {
        resolve(NextResponse.json(
          {
            error: 'Missing Snowflake credentials. Please check your .env.local file.',
            details: 'Required: SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD, SNOWFLAKE_WAREHOUSE, SNOWFLAKE_ROLE'
          },
          { status: 500 }
        ));
        return;
      }

      // Create Snowflake connection
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
          console.error('Unable to connect to Snowflake:', err);
          resolve(NextResponse.json(
            {
              error: 'Failed to connect to Snowflake',
              details: err.message
            },
            { status: 500 }
          ));
          return;
        }

        console.log('Successfully connected to Snowflake');

        // Execute query to show all tables
        const sqlQuery = 'SHOW TABLES;';

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
              console.error('Failed to execute query:', err);
              resolve(NextResponse.json(
                {
                  error: 'Query execution failed',
                  details: err.message
                },
                { status: 500 }
              ));
              return;
            }

            console.log('Returning data with', (rows || []).length, 'rows');

            // Return all tables info
            resolve(NextResponse.json({
              data: rows || [],
              rowCount: (rows || []).length,
            }));
          }
        });
      });

    } catch (error) {
      console.error('Snowflake SDK error:', error);

      let errorMessage = 'An unexpected error occurred';
      let details = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        details = error.stack || '';
      }

      resolve(NextResponse.json(
        {
          error: errorMessage,
          details: details
        },
        { status: 500 }
      ));
    }
  });
}
