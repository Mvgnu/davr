import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[GET Materials Static] API called');
  return NextResponse.json([
    { id: '1', name: 'Aluminium', slug: 'aluminium' },
    { id: '2', name: 'Kunststoff', slug: 'kunststoff' },
    { id: '3', name: 'Papier', slug: 'papier' },
    { id: '4', name: 'Glas', slug: 'glas' },
    { id: '5', name: 'Metall', slug: 'metall' }
  ]);
}
