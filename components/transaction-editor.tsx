'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  parentId: string | null;
}

interface Transaction {
  id: string;
  date: Date | string;
  amount: number;
  description: string;
  type: string;
  categoryId: string | null;
  vendor: string | null;
  notes: string | null;
  source: string;
  isManualEntry: boolean;
  paymentMethod?: string | null;
  category?: Category | null;
}

const COMMON_VENDORS = [
  'Anthropic',
  'Prisma',
  'OpenAI',
  'Vercel',
  'Resend',
  'Google',
  'AWS',
  'Stripe',
  'GitHub',
];

export function TransactionEditor({ transaction }: { transaction: Transaction }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    date: new Date(transaction.date).toISOString().split('T')[0],
    amount: transaction.amount.toString(),
    description: transaction.description,
    type: transaction.type,
    categoryId: transaction.categoryId || 'none',
    vendor: transaction.vendor || 'none',
    notes: transaction.notes || '',
    paymentMethod: transaction.paymentMethod || 'none',
  });

  useEffect(() => {
    if (open && categories.length === 0) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCategories(data.data);
          }
        });
    }
  }, [open, categories.length]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(formData.date).toISOString(),
          amount: parseFloat(formData.amount),
          description: formData.description,
          type: formData.type,
          categoryId: formData.categoryId === 'none' ? null : formData.categoryId,
          vendor: formData.vendor === 'none' ? null : formData.vendor,
          notes: formData.notes || null,
          paymentMethod: formData.paymentMethod === 'none' ? null : formData.paymentMethod,
        }),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Failed to update transaction: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction');
    } finally {
      setLoading(false);
    }
  };

  // Only show edit button for manual entries
  if (!transaction.isManualEntry) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 p-0"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Expense (Debit)</SelectItem>
                    <SelectItem value="credit">Income (Credit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.filter((c) => c.type === 'income').length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                        Income
                      </div>
                      {categories
                        .filter((c) => c.type === 'income' && !c.parentId)
                        .map((category) => (
                          <div key={category.id}>
                            <SelectItem value={category.id}>
                              {category.icon} {category.name}
                            </SelectItem>
                            {categories
                              .filter((c) => c.parentId === category.id)
                              .map((subcat) => (
                                <SelectItem key={subcat.id} value={subcat.id} className="pl-6">
                                  └ {subcat.icon} {subcat.name}
                                </SelectItem>
                              ))}
                          </div>
                        ))}
                    </>
                  )}
                  {categories.filter((c) => c.type === 'expense').length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                        Expenses
                      </div>
                      {categories
                        .filter((c) => c.type === 'expense' && !c.parentId)
                        .map((category) => (
                          <div key={category.id}>
                            <SelectItem value={category.id}>
                              {category.icon} {category.name}
                            </SelectItem>
                            {categories
                              .filter((c) => c.parentId === category.id)
                              .map((subcat) => (
                                <SelectItem key={subcat.id} value={subcat.id} className="pl-6">
                                  └ {subcat.icon} {subcat.name}
                                </SelectItem>
                              ))}
                          </div>
                        ))}
                    </>
                  )}
                  {categories.filter((c) => c.type === 'transfer').length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                        Transfers
                      </div>
                      {categories
                        .filter((c) => c.type === 'transfer' && !c.parentId)
                        .map((category) => (
                          <div key={category.id}>
                            <SelectItem value={category.id}>
                              {category.icon} {category.name}
                            </SelectItem>
                            {categories
                              .filter((c) => c.parentId === category.id)
                              .map((subcat) => (
                                <SelectItem key={subcat.id} value={subcat.id} className="pl-6">
                                  └ {subcat.icon} {subcat.name}
                                </SelectItem>
                              ))}
                          </div>
                        ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={formData.vendor} onValueChange={(value) => setFormData({ ...formData, vendor: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vendor</SelectItem>
                  {COMMON_VENDORS.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {formData.vendor === 'custom' && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom vendor"
                  value={formData.vendor === 'custom' ? '' : formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              )}
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes about this transaction..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#e96934] hover:bg-[#d85a28] text-white"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
