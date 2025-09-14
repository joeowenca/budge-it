'use client';

import { useState } from 'react';
import Modal from './Modal';

interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, amount: number, categoryId: string) => void;
  type: 'income' | 'expense';
  categories: BudgetCategory[];
}

export default function AddItemModal({ isOpen, onClose, onAdd, type, categories }: AddItemModalProps) {
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim() && itemAmount.trim() && selectedCategoryId) {
      onAdd(itemName.trim(), parseFloat(itemAmount), selectedCategoryId);
      setItemName('');
      setItemAmount('');
      setSelectedCategoryId('');
      onClose();
    }
  };

  const handleClose = () => {
    setItemName('');
    setItemAmount('');
    setSelectedCategoryId('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add ${type === 'income' ? 'Income' : 'Expense'} Item`}
    >
      {(closeModal) => (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-foreground mb-2">
              Item Name
            </label>
            <input
              id="itemName"
              type="text"
              placeholder="Enter item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Add Item
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
