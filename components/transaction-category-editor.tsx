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
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  parentId: string | null;
}

interface Transaction {
  id: string;
  categoryId: string | null;
  notes: string | null;
  category?: Category | null;
}

export function TransactionCategoryEditor({ transaction }: { transaction: Transaction }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(transaction.categoryId || 'none');
  const [notes, setNotes] = useState(transaction.notes || '');

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
          categoryId: selectedCategoryId === 'none' ? null : selectedCategoryId,
          notes,
        }),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
      } else {
        alert('Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="cursor-pointer">
        {transaction.category ? (
          <Badge variant="secondary" className="hover:bg-gray-200">
            {transaction.category.icon} {transaction.category.name}
          </Badge>
        ) : (
          <Badge variant="outline" className="hover:bg-gray-100">
            Uncategorized
          </Badge>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
