import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSoftwareCategories() {
  console.log('Creating Software & Tools categories...\n');

  // Create parent category
  const parentCategory = await prisma.category.upsert({
    where: { name_type: { name: 'Software & Tools', type: 'expense' } },
    update: {},
    create: {
      name: 'Software & Tools',
      type: 'expense',
      color: '#3b82f6', // blue
      icon: '💻',
      isSystem: false,
    },
  });

  console.log('✓ Created parent category: Software & Tools');

  // Create subcategories for each vendor
  const vendors = [
    { name: 'Anthropic', icon: '🤖', color: '#f59e0b' },
    { name: 'Prisma', icon: '🔺', color: '#6366f1' },
    { name: 'OpenAI', icon: '🧠', color: '#10b981' },
    { name: 'Vercel', icon: '▲', color: '#000000' },
    { name: 'Resend', icon: '📧', color: '#ec4899' },
    { name: 'Google', icon: '🔍', color: '#ea4335' },
  ];

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
    console.log(`✓ Created subcategory: ${vendor.name}`);
  }

  console.log('\n✅ All Software & Tools categories created successfully!');

  await prisma.$disconnect();
}

addSoftwareCategories().catch((error) => {
  console.error('Error creating categories:', error);
  process.exit(1);
});
