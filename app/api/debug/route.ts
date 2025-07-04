import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  let connectionInfo: any = {
    database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
    connected: false,
    prismaConnected: false,
    serverTime: null
  };
  let counts: any = {
    materials: 0,
    recyclingCenters: 0
  };
  let sampleMaterial = null;
  let sampleCenter = null;

  try {
    // 1. Test Prisma connection directly
    // A simple query like count should suffice. If it fails, Prisma isn't connected.
    counts.materials = await prisma.material.count();
    counts.recyclingCenters = await prisma.recyclingCenter.count();
    connectionInfo.prismaConnected = true;
    connectionInfo.connected = true; // If Prisma count works, underlying connection is likely fine
    connectionInfo.serverTime = new Date(); // Use JS Date as proxy for server time when Prisma connects

    // 2. Get sample data using Prisma
    if (counts.materials > 0) {
      sampleMaterial = await prisma.material.findFirst();
    }
    if (counts.recyclingCenters > 0) {
      sampleCenter = await prisma.recyclingCenter.findFirst();
    }

    return NextResponse.json({
      success: true,
      connectionInfo,
      counts,
      sampleData: {
        material: sampleMaterial,
        recyclingCenter: sampleCenter
      }
    });
  } catch (error) {
    console.error('Debug endpoint error [Prisma]:', error);
    // Update connection info on error
    connectionInfo.connected = false;
    connectionInfo.prismaConnected = false;

    return NextResponse.json(
      {
        success: false,
        connectionInfo, // Include potentially partial info
        counts,         // Include potentially partial info
        error: 'Operation error',
        errorDetails: (error as Error).message
      },
      { status: 500 }
    );
  }
} 