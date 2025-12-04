import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        parentId: body.parentId || null,
        color: body.color,
        icon: body.icon,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category has transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${transactionCount} transactions. Please reassign or delete the transactions first.`,
        },
        { status: 400 }
      );
    }

    // Check if category has children
    const childrenCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${childrenCount} subcategories. Please delete or reassign the subcategories first.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Category deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
