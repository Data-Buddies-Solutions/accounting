import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Prisma.TransactionUncheckedUpdateInput = {};

    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.vendor !== undefined) updateData.vendor = body.vendor;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
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
    console.error('Transaction update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
