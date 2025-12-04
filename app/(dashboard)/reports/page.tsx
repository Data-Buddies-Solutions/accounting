'use client';

import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface MonthlyData {
  income: Record<string, number>;
  expenses: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState<string[]>([]);
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyData>>({});
  const [viewMode, setViewMode] = useState<'monthly' | 'summary'>('monthly');

  // Default to last 6 months
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const [startDate, setStartDate] = useState(sixMonthsAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/pl?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (data.success) {
        setMonths(data.data.months);
        setMonthlyData(data.data.monthlyData);
      }
    } catch (error) {
      console.error('Error fetching P&L report:', error);
    } finally {
      setLoading(false);
    }
  };

  const setMTD = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const setYTD = () => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    setStartDate(firstDayOfYear.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setViewMode('summary');
  };

  const setLastMonth = () => {
    const today = new Date();
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    setStartDate(firstDayOfLastMonth.toISOString().split('T')[0]);
    setEndDate(lastDayOfLastMonth.toISOString().split('T')[0]);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate summary totals across all months
  const getSummaryData = () => {
    const summary = {
      income: {} as Record<string, number>,
      expenses: {} as Record<string, number>,
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
    };

    months.forEach((month) => {
      const data = monthlyData[month];
      if (data) {
        // Sum income
        Object.entries(data.income).forEach(([category, amount]) => {
          summary.income[category] = (summary.income[category] || 0) + amount;
        });

        // Sum expenses
        Object.entries(data.expenses).forEach(([category, amount]) => {
          summary.expenses[category] = (summary.expenses[category] || 0) + amount;
        });

        summary.totalIncome += data.totalIncome;
        summary.totalExpenses += data.totalExpenses;
      }
    });

    summary.netProfit = summary.totalIncome - summary.totalExpenses;
    return summary;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Statement</h1>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMTD();
                  setTimeout(fetchReport, 100);
                }}
              >
                MTD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setYTD();
                  setTimeout(fetchReport, 100);
                }}
              >
                YTD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLastMonth();
                  setTimeout(fetchReport, 100);
                }}
              >
                Last Month
              </Button>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button
                onClick={fetchReport}
                disabled={loading}
                className="bg-[#e96934] hover:bg-[#d85a28] text-white"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P&L Table */}
      {months.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{viewMode === 'monthly' ? 'Monthly Breakdown' : 'Summary Total'}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('monthly')}
                >
                  Monthly
                </Button>
                <Button
                  variant={viewMode === 'summary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('summary')}
                >
                  Summary
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {viewMode === 'monthly' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">Category</th>
                      {months.map((month) => (
                        <th key={month} className="text-right py-3 px-2 font-semibold">
                          {formatMonth(month)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                <tbody>
                  {/* INCOME SECTION */}
                  <tr className="bg-gray-100">
                    <td className="py-2 px-2 font-bold text-gray-900">INCOME</td>
                    {months.map((month) => (
                      <td key={month} className="text-right py-2 px-2"></td>
                    ))}
                  </tr>

                  {/* Income categories */}
                  {Array.from(
                    new Set(
                      months.flatMap((month) =>
                        Object.keys(monthlyData[month]?.income || {})
                      )
                    )
                  ).map((category) => (
                    <tr key={category} className="border-b border-gray-100">
                      <td className="py-2 px-2 pl-6">{category}</td>
                      {months.map((month) => (
                        <td key={month} className="text-right py-2 px-2 text-gray-900">
                          {monthlyData[month]?.income[category]
                            ? formatCurrency(monthlyData[month].income[category])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Total Income */}
                  <tr className="font-semibold bg-gray-200 border-t-2 border-gray-400">
                    <td className="py-2 px-2">Total Income</td>
                    {months.map((month) => (
                      <td key={month} className="text-right py-2 px-2 text-gray-900">
                        {formatCurrency(monthlyData[month]?.totalIncome || 0)}
                      </td>
                    ))}
                  </tr>

                  {/* Spacer */}
                  <tr>
                    <td colSpan={months.length + 1} className="py-2"></td>
                  </tr>

                  {/* EXPENSES SECTION */}
                  <tr className="bg-gray-100">
                    <td className="py-2 px-2 font-bold text-gray-900">EXPENSES</td>
                    {months.map((month) => (
                      <td key={month} className="text-right py-2 px-2"></td>
                    ))}
                  </tr>

                  {/* Expense categories with hierarchy */}
                  {(() => {
                    const allExpenseKeys = Array.from(
                      new Set(
                        months.flatMap((month) =>
                          Object.keys(monthlyData[month]?.expenses || {})
                        )
                      )
                    );

                    // Separate parent and child categories
                    const parentKeys = allExpenseKeys.filter(key => !key.includes('|')).sort();
                    const childKeysMap: Record<string, string[]> = {};

                    allExpenseKeys.filter(key => key.includes('|')).forEach(key => {
                      const parent = key.split('|')[0];
                      if (!childKeysMap[parent]) childKeysMap[parent] = [];
                      childKeysMap[parent].push(key);
                    });

                    // Render parents with their children
                    const rows: ReactElement[] = [];

                    // First, render standalone parent categories
                    parentKeys.forEach(parentKey => {
                      rows.push(
                        <tr key={parentKey} className="border-b border-gray-100">
                          <td className="py-2 px-2 pl-6">{parentKey}</td>
                          {months.map((month) => (
                            <td key={month} className="text-right py-2 px-2 text-gray-900">
                              {monthlyData[month]?.expenses[parentKey]
                                ? formatCurrency(monthlyData[month].expenses[parentKey])
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      );

                      // Add children
                      if (childKeysMap[parentKey]) {
                        childKeysMap[parentKey].sort().forEach(childKey => {
                          const childName = childKey.split('|')[1];
                          rows.push(
                            <tr key={childKey} className="border-b border-gray-100">
                              <td className="py-2 px-2 pl-8 text-sm text-gray-600">└ {childName}</td>
                              {months.map((month) => (
                                <td key={month} className="text-right py-2 px-2 text-gray-900">
                                  {monthlyData[month]?.expenses[childKey]
                                    ? formatCurrency(monthlyData[month].expenses[childKey])
                                    : '-'}
                                </td>
                              ))}
                            </tr>
                          );
                        });
                      }
                    });

                    // Then, render parent categories that only have children (no direct transactions)
                    Object.keys(childKeysMap).forEach(parentName => {
                      if (!parentKeys.includes(parentName)) {
                        rows.push(
                          <tr key={parentName} className="border-b border-gray-100">
                            <td className="py-2 px-2 pl-6">{parentName}</td>
                            {months.map((month) => (
                              <td key={month} className="text-right py-2 px-2 text-gray-500">-</td>
                            ))}
                          </tr>
                        );

                        childKeysMap[parentName].sort().forEach(childKey => {
                          const childName = childKey.split('|')[1];
                          rows.push(
                            <tr key={childKey} className="border-b border-gray-100">
                              <td className="py-2 px-2 pl-8 text-sm text-gray-600">└ {childName}</td>
                              {months.map((month) => (
                                <td key={month} className="text-right py-2 px-2 text-gray-900">
                                  {monthlyData[month]?.expenses[childKey]
                                    ? formatCurrency(monthlyData[month].expenses[childKey])
                                    : '-'}
                                </td>
                              ))}
                            </tr>
                          );
                        });
                      }
                    });

                    return rows;
                  })()}

                  {/* Total Expenses */}
                  <tr className="font-semibold bg-gray-200 border-t-2 border-gray-400">
                    <td className="py-2 px-2">Total Expenses</td>
                    {months.map((month) => (
                      <td key={month} className="text-right py-2 px-2 text-gray-900">
                        {formatCurrency(monthlyData[month]?.totalExpenses || 0)}
                      </td>
                    ))}
                  </tr>

                  {/* Spacer */}
                  <tr>
                    <td colSpan={months.length + 1} className="py-2"></td>
                  </tr>

                  {/* NET PROFIT */}
                  <tr className="font-bold text-lg bg-gray-300 border-t-4 border-gray-600">
                    <td className="py-3 px-2">NET PROFIT</td>
                    {months.map((month) => {
                      const netProfit = monthlyData[month]?.netProfit || 0;
                      return (
                        <td
                          key={month}
                          className={`text-right py-3 px-2 ${
                            netProfit >= 0 ? 'text-gray-900' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(netProfit)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
              ) : (
                // Summary View
                (() => {
                  const summary = getSummaryData();
                  return (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold">Category</th>
                          <th className="text-right py-3 px-2 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* INCOME SECTION */}
                        <tr className="bg-gray-100">
                          <td className="py-2 px-2 font-bold text-gray-900">INCOME</td>
                          <td className="text-right py-2 px-2"></td>
                        </tr>

                        {Object.entries(summary.income).map(([category, amount]) => (
                          <tr key={category} className="border-b border-gray-100">
                            <td className="py-2 px-2 pl-6">{category}</td>
                            <td className="text-right py-2 px-2 text-gray-900">
                              {formatCurrency(amount)}
                            </td>
                          </tr>
                        ))}

                        <tr className="font-semibold bg-gray-200 border-t-2 border-gray-400">
                          <td className="py-2 px-2">Total Income</td>
                          <td className="text-right py-2 px-2 text-gray-900">
                            {formatCurrency(summary.totalIncome)}
                          </td>
                        </tr>

                        <tr>
                          <td colSpan={2} className="py-2"></td>
                        </tr>

                        {/* EXPENSES SECTION */}
                        <tr className="bg-gray-100">
                          <td className="py-2 px-2 font-bold text-gray-900">EXPENSES</td>
                          <td className="text-right py-2 px-2"></td>
                        </tr>

                        {(() => {
                          const expenseEntries = Object.entries(summary.expenses);

                          // Separate parent and child categories
                          const parentEntries = expenseEntries.filter(([key]) => !key.includes('|')).sort(([a], [b]) => a.localeCompare(b));
                          const childEntriesMap: Record<string, [string, number][]> = {};

                          expenseEntries.filter(([key]) => key.includes('|')).forEach(([key, amount]) => {
                            const parent = key.split('|')[0];
                            if (!childEntriesMap[parent]) childEntriesMap[parent] = [];
                            childEntriesMap[parent].push([key, amount]);
                          });

                          const rows: ReactElement[] = [];

                          // First, render standalone parent categories
                          parentEntries.forEach(([parentKey, amount]) => {
                            rows.push(
                              <tr key={parentKey} className="border-b border-gray-100">
                                <td className="py-2 px-2 pl-6">{parentKey}</td>
                                <td className="text-right py-2 px-2 text-gray-900">
                                  {formatCurrency(amount)}
                                </td>
                              </tr>
                            );

                            // Add children
                            if (childEntriesMap[parentKey]) {
                              childEntriesMap[parentKey].sort(([a], [b]) => a.localeCompare(b)).forEach(([childKey, childAmount]) => {
                                const childName = childKey.split('|')[1];
                                rows.push(
                                  <tr key={childKey} className="border-b border-gray-100">
                                    <td className="py-2 px-2 pl-8 text-sm text-gray-600">└ {childName}</td>
                                    <td className="text-right py-2 px-2 text-gray-900">
                                      {formatCurrency(childAmount)}
                                    </td>
                                  </tr>
                                );
                              });
                            }
                          });

                          // Then, render parent categories that only have children (no direct transactions)
                          Object.keys(childEntriesMap).forEach(parentName => {
                            if (!parentEntries.find(([key]) => key === parentName)) {
                              rows.push(
                                <tr key={parentName} className="border-b border-gray-100">
                                  <td className="py-2 px-2 pl-6">{parentName}</td>
                                  <td className="text-right py-2 px-2 text-gray-500">-</td>
                                </tr>
                              );

                              childEntriesMap[parentName].sort(([a], [b]) => a.localeCompare(b)).forEach(([childKey, childAmount]) => {
                                const childName = childKey.split('|')[1];
                                rows.push(
                                  <tr key={childKey} className="border-b border-gray-100">
                                    <td className="py-2 px-2 pl-8 text-sm text-gray-600">└ {childName}</td>
                                    <td className="text-right py-2 px-2 text-gray-900">
                                      {formatCurrency(childAmount)}
                                    </td>
                                  </tr>
                                );
                              });
                            }
                          });

                          return rows;
                        })()}

                        <tr className="font-semibold bg-gray-200 border-t-2 border-gray-400">
                          <td className="py-2 px-2">Total Expenses</td>
                          <td className="text-right py-2 px-2 text-gray-900">
                            {formatCurrency(summary.totalExpenses)}
                          </td>
                        </tr>

                        <tr>
                          <td colSpan={2} className="py-2"></td>
                        </tr>

                        {/* NET PROFIT */}
                        <tr className="font-bold text-lg bg-gray-300 border-t-4 border-gray-600">
                          <td className="py-3 px-2">NET PROFIT</td>
                          <td className={`text-right py-3 px-2 ${summary.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatCurrency(summary.netProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {months.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No data found for the selected date range. Try adjusting the dates or add some transactions.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
