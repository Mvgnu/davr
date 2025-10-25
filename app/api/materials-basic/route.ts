import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[GET Materials Basic] API called');
  return NextResponse.json({ 
    message: 'Materials API is working',
    materials: [
      { id: '1', name: 'Test Material 1', slug: 'test-material-1' },
      { id: '2', name: 'Test Material 2', slug: 'test-material-2' }
    ]
  });
}
