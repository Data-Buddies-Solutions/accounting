import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Fetch all transactions in the date range with categories
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by month and category
    const monthlyData: Record<string, any> = {};

    transactions.forEach((tx) => {
      // Skip Internal Transfers - they don't belong in P&L
      const parentName = tx.category?.parent?.name;
      const categoryName = tx.category?.name;
      if (categoryName === 'Internal Transfers' || parentName === 'Internal Transfers') {
        return;
      }

      const month = new Date(tx.date).toISOString().slice(0, 7); // YYYY-MM
      const amount = Number(tx.amount);

      if (!monthlyData[month]) {
        monthlyData[month] = {
          income: {},
          expenses: {},
          totalIncome: 0,
          totalExpenses: 0,
        };
      }

      if (tx.type === 'credit') {
        // Income
        const categoryName = tx.category?.name || 'Uncategorized';
        monthlyData[month].income[categoryName] =
          (monthlyData[month].income[categoryName] || 0) + amount;
        monthlyData[month].totalIncome += amount;
      } else {
        // Expense
        const key = parentName ? `${parentName}|${categoryName}` : categoryName || 'Uncategorized';

        monthlyData[month].expenses[key] =
          (monthlyData[month].expenses[key] || 0) + amount;
        monthlyData[month].totalExpenses += amount;
      }
    });

    // Calculate net profit for each month
    Object.keys(monthlyData).forEach((month) => {
      monthlyData[month].netProfit =
        monthlyData[month].totalIncome - monthlyData[month].totalExpenses;
    });

    return NextResponse.json({
      success: true,
      data: {
        months: Object.keys(monthlyData).sort(),
        monthlyData,
      },
    });
  } catch (error) {
    console.error('P&L report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
