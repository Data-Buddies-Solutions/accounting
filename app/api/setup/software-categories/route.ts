import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('Creating Software & Tools categories...');

    // Create parent category
    const parentCategory = await prisma.category.upsert({
      where: { name_type: { name: 'Software & Tools', type: 'expense' } },
      update: {},
      create: {
        name: 'Software & Tools',
        type: 'expense',
        color: '#3b82f6',
        icon: '💻',
        isSystem: false,
      },
    });

    // Create subcategories for each vendor
    const vendors = [
      { name: 'Anthropic', icon: '🤖', color: '#f59e0b' },
      { name: 'Prisma', icon: '🔺', color: '#6366f1' },
      { name: 'OpenAI', icon: '🧠', color: '#10b981' },
      { name: 'Vercel', icon: '▲', color: '#000000' },
      { name: 'Resend', icon: '📧', color: '#ec4899' },
      { name: 'Google', icon: '🔍', color: '#ea4335' },
    ];

    const created = [];
    for (const vendor of vendors) {
      const subcategory = await prisma.category.upsert({
        where: { name_type: { name: vendor.name, type: 'expense' } },
        update: {},
        create: {
          name: vendor.name,
          type: 'expense',
          parentId: parentCategory.id,
          color: vendor.color,
          icon: vendor.icon,
          isSystem: false,
        },
      });
      created.push(subcategory.name);
    }

    return NextResponse.json({
      success: true,
      parent: parentCategory.name,
      subcategories: created,
    });
  } catch (error) {
    console.error('Error creating categories:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
