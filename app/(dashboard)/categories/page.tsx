import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryEditor } from '@/components/category-editor';

type CategoryWithCount = {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    transactions: number;
  };
};

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  return categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  const incomeCategories = categories.filter((c: CategoryWithCount) => c.type === 'income');
  const expenseCategories = categories.filter((c: CategoryWithCount) => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <CategoryEditor allCategories={categories} mode="create" />
      </div>

      {/* Income Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Income Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {incomeCategories.filter((c: CategoryWithCount) => !c.parentId).map((category: CategoryWithCount) => (
              <div key={category.id}>
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500">
                        {category._count.transactions} transactions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: category.color || undefined }}
                    >
                      Income
                    </Badge>
                    {category.isSystem && (
                      <Badge variant="outline">System</Badge>
                    )}
                    <CategoryEditor category={category} allCategories={categories} mode="edit" />
                  </div>
                </div>
                {/* Subcategories */}
                {incomeCategories.filter((c: CategoryWithCount) => c.parentId === category.id).map((subcat: CategoryWithCount) => (
                  <div key={subcat.id} className="flex items-center justify-between p-3 border-l-2 ml-8 mt-2 rounded-r-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{subcat.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{subcat.name}</div>
                        <div className="text-xs text-gray-500">
                          {subcat._count.transactions} transactions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryEditor category={subcat} allCategories={categories} mode="edit" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {expenseCategories.filter((c: CategoryWithCount) => !c.parentId).map((category: CategoryWithCount) => (
              <div key={category.id}>
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500">
                        {category._count.transactions} transactions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: category.color || undefined }}
                    >
                      Expense
                    </Badge>
                    {category.isSystem && (
                      <Badge variant="outline">System</Badge>
                    )}
                    <CategoryEditor category={category} allCategories={categories} mode="edit" />
                  </div>
                </div>
                {/* Subcategories */}
                {expenseCategories.filter((c: CategoryWithCount) => c.parentId === category.id).map((subcat: CategoryWithCount) => (
                  <div key={subcat.id} className="flex items-center justify-between p-3 border-l-2 ml-8 mt-2 rounded-r-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{subcat.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{subcat.name}</div>
                        <div className="text-xs text-gray-500">
                          {subcat._count.transactions} transactions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryEditor category={subcat} allCategories={categories} mode="edit" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
