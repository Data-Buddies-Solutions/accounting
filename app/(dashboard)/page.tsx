import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getDashboardData() {
  const [accounts, transactions, categories] = await Promise.all([
    prisma.account.findMany(),
    prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.category.findMany(),
  ]);

  // Calculate metrics
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      date: { gte: currentMonth },
    },
  });

  const income = monthlyTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = monthlyTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = accounts
    .filter((a) => a.type !== 'virtual')
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const uncategorized = transactions.filter((t) => !t.categoryId).length;

  return {
    balance,
    income,
    expenses,
    uncategorized,
    transactions,
    accounts,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <form action="/api/sync" method="POST">
          <Button
            type="submit"
            className="bg-[#e96934] hover:bg-[#d85a28] text-white"
          >
            Sync Mercury
          </Button>
        </form>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Mercury accounts only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${data.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Month to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -${data.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Month to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.income - data.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(data.income - data.expenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/transactions/new">
          <Button className="bg-[#e96934] hover:bg-[#d85a28] text-white">
            Add Manual Transaction
          </Button>
        </Link>
        {data.uncategorized > 0 && (
          <Link href="/transactions?uncategorized=true">
            <Button variant="outline">
              Categorize {data.uncategorized} Transaction{data.uncategorized !== 1 ? 's' : ''}
            </Button>
          </Link>
        )}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="link" className="text-[#e96934]">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet. Click "Sync Mercury" to fetch your transactions.
            </div>
          ) : (
            <div className="space-y-2">
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString()} •{' '}
                      {tx.category?.name || 'Uncategorized'}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}$
                    {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
