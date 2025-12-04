import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
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

    const category = await prisma.category.create({
      data: {
        name: body.name,
        type: body.type,
        parentId: body.parentId || null,
        color: body.color,
        icon: body.icon,
        isSystem: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
