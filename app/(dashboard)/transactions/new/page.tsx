'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    type: 'debit',
    paymentMethod: 'personal_card',
    categoryId: '',
    notes: '',
    needsReimbursement: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/transactions');
        router.refresh();
      } else {
        alert('Failed to create transaction');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error creating transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Add Manual Transaction
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Expense (Debit)</SelectItem>
                  <SelectItem value="credit">Income (Credit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="What was this for?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal_card">Personal Credit Card</SelectItem>
                  <SelectItem value="personal_debit">Personal Debit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Needs Reimbursement */}
            <div className="flex items-center space-x-2">
              <input
                id="needsReimbursement"
                type="checkbox"
                checked={formData.needsReimbursement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    needsReimbursement: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="needsReimbursement" className="font-normal">
                Needs Reimbursement
              </Label>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#e96934] hover:bg-[#d85a28] text-white"
              >
                {loading ? 'Creating...' : 'Create Transaction'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
