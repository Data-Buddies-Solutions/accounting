import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';

export async function POST() {
  try {
    const syncService = new SyncService();
    const result = await syncService.fullSync();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger a sync',
    endpoint: '/api/sync',
  });
}
