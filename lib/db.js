import pg from 'pg';
const { Pool } = pg;

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL || '';

// Fallback error message if DATABASE_URL is not set
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set!');
}

// Initialize Postgres connection pool with better error handling
console.log('Initializing database connection pool');
console.log(`Database URL: ${connectionString ? connectionString.replace(/:[^:]*@/, ':****@') : 'Not set'}`);

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test the connection on startup
pool.query('SELECT NOW()')
  .then((result) => {
    console.log('🔋 Database connection established');
    console.log(`Connected to database at time: ${result.rows[0].now}`);
  })
  .catch(err => {
    console.error('⚠️ Database connection failed:', err.message);
    console.error('Connection details:', {
      host: new URL(connectionString).hostname,
      port: new URL(connectionString).port,
      database: new URL(connectionString).pathname.slice(1),
      user: new URL(connectionString).username
    });
  });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/**
 * Execute a database query with parameters
 */
export async function query(text, params = []) {
  const start = Date.now();
  
  try {
    // Regular Pool query
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in development
    if (duration > 100 && process.env.NODE_ENV !== 'production') {
      console.log('🐌 Slow query:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Query error:', error.message, { text, params });
    
    // Check for specific error types
    if (error.code === 'ECONNREFUSED') {
      console.error('Database connection refused. Check if the database server is running.');
    } else if (error.code === '42P01') {
      console.error('Relation does not exist. Check if the tables are properly created.');
    } else if (error.code === '3D000') {
      console.error('Database does not exist. Check DATABASE_URL and create the database.');
    }
    
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction(callback) {
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
export async function closePool() {
  console.log('Closing database connection pool');
  await pool.end();
  console.log('Database connection pool closed');
}

// Export the pool for direct use when needed
export { pool }; 