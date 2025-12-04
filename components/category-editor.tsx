'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
}

interface CategoryEditorProps {
  category?: Category;
  allCategories: Category[];
  mode: 'create' | 'edit';
}

export function CategoryEditor({ category, allCategories, mode }: CategoryEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    type: category?.type || 'expense',
    parentId: category?.parentId || 'none',
    color: category?.color || '#3b82f6',
    icon: category?.icon || '📁',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/categories' : `/api/categories/${category?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId === 'none' ? null : formData.parentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save category');

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete category');

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = allCategories.filter(
    (c) => c.type === formData.type && !c.parentId && c.id !== category?.id
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button className="bg-[#e96934] hover:bg-[#d85a28] text-white">
            Add Category
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon (Emoji)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              maxLength={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value, parentId: 'none' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="parentId">Parent Category (Optional)</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => setFormData({ ...formData, parentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None - Top Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - Top Level</SelectItem>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save'}
            </Button>
            {mode === 'edit' && !category?.isSystem && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
