import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { neon } from '@neondatabase/serverless';

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL || '';

// Fallback error message if DATABASE_URL is not set
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set!');
}

// Initialize the pool with a dummy implementation first
let pool: Pool = new Pool(); // This will be overwritten below

// Initialize connection pool differently based on environment
if (process.env.NODE_ENV === 'production') {
  // For production, use a standard pool
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  // For development/other environments
  try {
    // Regular Postgres database (default)
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Special handling for Neon is done in the query function
  } catch (err) {
    console.error('Failed to initialize database pool:', err);
    // Set up a dummy pool that will throw meaningful errors
    // This allows the application to at least start and show proper error messages
    // @ts-ignore - Intentionally creating a mock for error handling
    pool = {
      query: () => Promise.reject(new Error('Database connection not initialized')),
      connect: () => Promise.reject(new Error('Database connection not initialized')),
      end: () => Promise.resolve(),
    };
  }
}

// Test the connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('🔋 Database connection established'))
  .catch(err => console.error('⚠️ Database connection failed:', err));

/**
 * Execute a database query with parameters
 */
export async function query<T extends QueryResultRow = any>(
  text: string, 
  params: any[] = []
): Promise<QueryResult<T>> {
  const start = Date.now();
  
  try {
    // If using Neon database
    if (connectionString.includes('neon.tech') && typeof neon === 'function') {
      const sql = neon(connectionString);
      const result = await sql(text, ...params) as unknown as T[];
      
      // Format the result to match the pg's QueryResult interface
      return {
        rows: result,
        rowCount: result.length,
        // These fields aren't really used in our code, so we're adding dummy values
        command: '',
        oid: 0,
        fields: []
      };
    }
    
    // Regular Pool query
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in development
    if (duration > 100 && process.env.NODE_ENV !== 'production') {
      console.log('🐌 Slow query:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error: any) {
    console.error('Query error:', error.message, { text, params });
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T = any>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gracefully close the database connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

// Export the pool for direct use when needed
export { pool }; 