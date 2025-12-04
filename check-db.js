require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const totalTx = await prisma.transaction.count();
    const accounts = await prisma.account.findMany();

    console.log('\n=== ACCOUNTS ===');
    console.log('Total accounts:', accounts.length);
    accounts.forEach(a => {
      console.log('  ' + a.name + ': $' + a.currentBalance + ' (' + a.type + ')');
    });

    console.log('\n=== TRANSACTIONS ===');
    console.log('Total transactions:', totalTx);

    if (totalTx > 0) {
      const recent = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true }
      });

      console.log('\nRecent 5 transactions:');
      recent.forEach(t => {
        const dateStr = new Date(t.date).toISOString().split('T')[0];
        console.log('  ' + dateStr + ' | ' + t.description.substring(0, 30) + ' | ' + t.type + ' | $' + t.amount);
      });
    } else {
      console.log('No transactions found! The sync might have failed.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
