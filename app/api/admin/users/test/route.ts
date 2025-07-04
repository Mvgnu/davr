import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// A test route to check database connection
export async function GET(request: NextRequest) {
  try {
    // Perform a simple test query
    const testQuery = 'SELECT NOW() as time';
    const result = await query(testQuery, []);
    
    // Check if users table exists and has the expected schema
    const schemaQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    const schemaResult = await query(schemaQuery, []);
    
    return NextResponse.json({
      message: 'Database connection successful',
      time: result.rows[0].time,
      userSchema: schemaResult.rows,
      endpoints: {
        search: '/api/admin/users/search - GET (with query params)',
        userDetails: '/api/admin/users/:userId - GET',
        updateRole: '/api/admin/users/:userId/role - PUT',
        updateStatus: '/api/admin/users/:userId/status - PUT'
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ 
      error: 'Database connection failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 