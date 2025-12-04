import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getDashboardData() {
  const [accountsRaw, transactionsRaw, categories] = await Promise.all([
    prisma.account.findMany(),
    prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.category.findMany(),
  ]);

  // Convert Decimals to numbers
  const accounts = accountsRaw.map(a => ({
    ...a,
    currentBalance: Number(a.currentBalance),
    availableBalance: Number(a.availableBalance),
  }));

  const transactions = transactionsRaw.map(t => ({
    ...t,
    amount: Number(t.amount),
  }));

  // Calculate metrics
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [currentMonthTxs, lastMonthTxs, ytdTxs] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: { gte: currentMonthStart },
      },
      include: {
        category: {
          include: { parent: true },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        date: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      include: {
        category: {
          include: { parent: true },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        date: { gte: yearStart },
      },
      include: {
        category: {
          include: { parent: true },
        },
      },
    }),
  ]);

  // Filter out Internal Transfers
  const filterTransfers = (txs: any[]) =>
    txs.filter(tx =>
      tx.category?.name !== 'Internal Transfers' &&
      tx.category?.parent?.name !== 'Internal Transfers'
    );

  const currentFiltered = filterTransfers(currentMonthTxs);
  const lastFiltered = filterTransfers(lastMonthTxs);
  const ytdFiltered = filterTransfers(ytdTxs);

  const currentIncome = currentFiltered
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const currentExpenses = currentFiltered
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastIncome = lastFiltered
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastExpenses = lastFiltered
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdIncome = ytdFiltered
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Owner Payout - find Payroll category
  const lastMonthPayroll = lastFiltered
    .filter((t) => t.type === 'debit' && t.category?.name === 'Payroll')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdPayroll = ytdFiltered
    .filter((t) => t.type === 'debit' && t.category?.name === 'Payroll')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate expenses excluding payroll for profit margin
  const lastExpensesExclPayroll = lastFiltered
    .filter((t) => t.type === 'debit' && t.category?.name !== 'Payroll')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdExpensesExclPayroll = ytdFiltered
    .filter((t) => t.type === 'debit' && t.category?.name !== 'Payroll')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Profit margin = (Income - Operating Expenses) / Income * 100
  const lastProfitMargin = lastIncome > 0
    ? ((lastIncome - lastExpensesExclPayroll) / lastIncome) * 100
    : 0;

  const ytdProfitMargin = ytdIncome > 0
    ? ((ytdIncome - ytdExpensesExclPayroll) / ytdIncome) * 100
    : 0;

  const balance = accounts
    .filter((a) => a.type !== 'virtual')
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const uncategorized = transactions.filter((t) => !t.categoryId).length;

  return {
    balance,
    currentIncome,
    currentExpenses,
    lastIncome,
    lastExpenses,
    ytdIncome,
    lastMonthPayroll,
    ytdPayroll,
    lastProfitMargin,
    ytdProfitMargin,
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
            <CardTitle className="text-sm font-medium">Income (Year to Date)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.ytdIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">
              Last month: ${data.lastIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner Payout (Year to Date)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(data.ytdPayroll / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">
              Last month: ${(data.lastMonthPayroll / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.ytdProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.ytdProfitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              Last month: {data.lastProfitMargin.toFixed(1)}%
            </p>
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
