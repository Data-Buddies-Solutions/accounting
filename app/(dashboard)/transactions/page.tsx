import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getTransactions(searchParams: any) {
  const where: any = {};

  if (searchParams.uncategorized === 'true') {
    where.categoryId = null;
  }

  if (searchParams.source) {
    where.source = searchParams.source;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: true,
      account: true,
    },
    orderBy: { date: 'desc' },
    take: 100,
  });

  return transactions;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const transactions = await getTransactions(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <Link href="/transactions/new">
          <Button className="bg-[#e96934] hover:bg-[#d85a28] text-white">
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Link href="/transactions">
          <Button variant={!searchParams.uncategorized && !searchParams.source ? 'default' : 'outline'}>
            All
          </Button>
        </Link>
        <Link href="/transactions?uncategorized=true">
          <Button variant={searchParams.uncategorized === 'true' ? 'default' : 'outline'}>
            Uncategorized
          </Button>
        </Link>
        <Link href="/transactions?source=manual">
          <Button variant={searchParams.source === 'manual' ? 'default' : 'outline'}>
            Manual Entries
          </Button>
        </Link>
        <Link href="/transactions?source=mercury">
          <Button variant={searchParams.source === 'mercury' ? 'default' : 'outline'}>
            Mercury
          </Button>
        </Link>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchParams.uncategorized === 'true'
              ? 'Uncategorized Transactions'
              : searchParams.source === 'manual'
              ? 'Manual Entries'
              : searchParams.source === 'mercury'
              ? 'Mercury Transactions'
              : 'All Transactions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(tx.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{tx.description}</div>
                      {tx.counterpartyName && (
                        <div className="text-sm text-gray-500">
                          {tx.counterpartyName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="secondary">
                          {tx.category.icon} {tx.category.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Uncategorized</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.source === 'manual' ? 'default' : 'secondary'}>
                        {tx.source}
                      </Badge>
                      {tx.paymentMethod && (
                        <div className="text-xs text-gray-500 mt-1">
                          {tx.paymentMethod}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold ${
                          tx.type === 'credit'
                            ? 'text-green-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}$
                        {Number(tx.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
