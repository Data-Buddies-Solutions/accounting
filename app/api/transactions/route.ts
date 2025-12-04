import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const source = searchParams.get('source');

    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (source) where.source = source;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: true,
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Create manual transaction
    const transaction = await prisma.transaction.create({
      data: {
        accountId: 'manual-account', // Virtual account for manual entries
        date: new Date(body.date),
        amount: parseFloat(body.amount),
        description: body.description,
        type: body.type,
        source: 'manual',
        isManualEntry: true,
        paymentMethod: body.paymentMethod,
        categoryId: body.categoryId,
        notes: body.notes,
        needsReimbursement: body.needsReimbursement || false,
        status: 'posted',
      },
      include: {
        category: true,
        account: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
