'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface Transaction {
  id: string;
  vendor: string | null;
}

interface TransactionVendorEditorProps {
  transaction: Transaction;
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

export function TransactionVendorEditor({
  transaction,
}: TransactionVendorEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [vendor, setVendor] = useState(transaction.vendor || '');
  const [customVendor, setCustomVendor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVendorChange = async (newVendor: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor: newVendor || null }),
      });

      if (!response.ok) throw new Error('Failed to update vendor');

      setVendor(newVendor);
      setIsOpen(false);
      setCustomVendor('');
      window.location.reload();
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Failed to update vendor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-xs hover:bg-gray-100"
        >
          {vendor || '+ Add Vendor'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">
              Common Vendors
            </label>
            <div className="mt-2 flex flex-wrap gap-1">
              {COMMON_VENDORS.map((v) => (
                <Button
                  key={v}
                  variant={vendor === v ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => handleVendorChange(v)}
                  disabled={isLoading}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">
              Custom Vendor
            </label>
            <div className="mt-1 flex gap-1">
              <Input
                placeholder="Enter vendor name"
                value={customVendor}
                onChange={(e) => setCustomVendor(e.target.value)}
                className="text-xs h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customVendor) {
                    handleVendorChange(customVendor);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => handleVendorChange(customVendor)}
                disabled={!customVendor || isLoading}
                className="h-8"
              >
                Set
              </Button>
            </div>
          </div>

          {vendor && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleVendorChange('')}
              disabled={isLoading}
            >
              Clear Vendor
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
