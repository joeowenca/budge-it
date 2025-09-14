'use client';

import { useState, useRef } from 'react';
import Modal from './Modal';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  type: 'income' | 'expense';
}

export default function AddCategoryModal({ isOpen, onClose, onAdd, type }: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      onAdd(categoryName.trim());
      setCategoryName('');
      onClose();
    }
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  const placeholder = type === 'income' 
    ? 'e.g., Salary, Freelance, Investments' 
    : 'e.g., Housing, Food, Transportation';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add ${type === 'income' ? 'Income' : 'Expense'} Category`}
    >
      {(closeModal) => (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-foreground mb-2">
              Category Name
            </label>
            <input
              id="categoryName"
              type="text"
              placeholder={placeholder}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
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
              Add Category
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
