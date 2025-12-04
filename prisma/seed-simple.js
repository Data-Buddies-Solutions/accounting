require('dotenv').config({ path: '.env.local' });
const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');

  const categories = [
    { name: 'Client Payments', type: 'income', isSystem: true, color: '#10b981', icon: '💰' },
    { name: 'Interest Income', type: 'income', isSystem: true, color: '#10b981', icon: '💵' },
    { name: 'Other Income', type: 'income', isSystem: false, color: '#10b981', icon: '📈' },
    { name: 'Software & Tools', type: 'expense', isSystem: false, color: '#ef4444', icon: '💻' },
    { name: 'Cloud Infrastructure', type: 'expense', isSystem: false, color: '#ef4444', icon: '☁️' },
    { name: 'Professional Services', type: 'expense', isSystem: false, color: '#ef4444', icon: '🤝' },
    { name: 'Office & Equipment', type: 'expense', isSystem: false, color: '#ef4444', icon: '🖥️' },
    { name: 'Marketing & Advertising', type: 'expense', isSystem: false, color: '#ef4444', icon: '📢' },
    { name: 'Travel', type: 'expense', isSystem: false, color: '#ef4444', icon: '✈️' },
    { name: 'Meals & Entertainment', type: 'expense', isSystem: false, color: '#ef4444', icon: '🍽️' },
    { name: 'Bank Fees', type: 'expense', isSystem: true, color: '#f59e0b', icon: '🏦' },
    { name: 'Legal & Accounting', type: 'expense', isSystem: false, color: '#f59e0b', icon: '⚖️' },
    { name: 'Insurance', type: 'expense', isSystem: false, color: '#f59e0b', icon: '🛡️' },
    { name: 'Taxes', type: 'expense', isSystem: false, color: '#f59e0b', icon: '📊' },
    { name: 'Uncategorized', type: 'expense', isSystem: true, color: '#6b7280', icon: '❓' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }

  console.log('✓ Created default categories');

  await prisma.account.upsert({
    where: { mercuryAccountId: 'manual-virtual-account' },
    update: {},
    create: {
      id: 'manual-account',
      mercuryAccountId: 'manual-virtual-account',
      name: 'Manual Entries',
      type: 'virtual',
      status: 'active',
      currentBalance: 0,
      availableBalance: 0,
      currency: 'USD',
    },
  });

  console.log('✓ Created Manual Entries virtual account');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
