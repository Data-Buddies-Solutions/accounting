import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    // Get a few recent transactions with rawData
    const transactions = await prisma.transaction.findMany({
      where: {
        source: 'mercury',
        rawData: { not: Prisma.DbNull }
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    const formatted = transactions.map(tx => ({
      date: tx.date,
      description: tx.description,
      counterpartyName: tx.counterpartyName,
      amount: tx.amount.toString(),
      rawData: tx.rawData
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
