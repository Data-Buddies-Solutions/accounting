import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
