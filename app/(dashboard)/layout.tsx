import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fefcf5]">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-[#e96934]">
                Accounting
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-700 hover:text-[#e96934]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/transactions"
                  className="text-sm font-medium text-gray-700 hover:text-[#e96934]"
                >
                  Transactions
                </Link>
                <Link
                  href="/transactions/new"
                  className="text-sm font-medium text-gray-700 hover:text-[#e96934]"
                >
                  Add Transaction
                </Link>
                <Link
                  href="/categories"
                  className="text-sm font-medium text-gray-700 hover:text-[#e96934]"
                >
                  Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
