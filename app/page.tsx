'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';
import AddCategoryModal from './components/AddCategoryModal';
import AddItemModal from './components/AddItemModal';

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export default function Home() {
  const [incomeCategories, setIncomeCategories] = useState<BudgetCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<BudgetCategory[]>([]);
  const [incomeItems, setIncomeItems] = useState<BudgetItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<BudgetItem[]>([]);
  
  // Modal states
  const [isIncomeCategoryModalOpen, setIsIncomeCategoryModalOpen] = useState(false);
  const [isIncomeItemModalOpen, setIsIncomeItemModalOpen] = useState(false);
  const [isExpenseCategoryModalOpen, setIsExpenseCategoryModalOpen] = useState(false);
  const [isExpenseItemModalOpen, setIsExpenseItemModalOpen] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedIncomeCategories = localStorage.getItem('budget-income-categories');
    const savedExpenseCategories = localStorage.getItem('budget-expense-categories');
    const savedIncomeItems = localStorage.getItem('budget-income-items');
    const savedExpenseItems = localStorage.getItem('budget-expense-items');
    
    if (savedIncomeCategories) {
      setIncomeCategories(JSON.parse(savedIncomeCategories));
    }
    if (savedExpenseCategories) {
      setExpenseCategories(JSON.parse(savedExpenseCategories));
    }
    if (savedIncomeItems) {
      setIncomeItems(JSON.parse(savedIncomeItems));
    }
    if (savedExpenseItems) {
      setExpenseItems(JSON.parse(savedExpenseItems));
    }
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('budget-income-categories', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('budget-expense-categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('budget-income-items', JSON.stringify(incomeItems));
  }, [incomeItems]);

  useEffect(() => {
    localStorage.setItem('budget-expense-items', JSON.stringify(expenseItems));
  }, [expenseItems]);

  // Category management functions
  const addIncomeCategory = (name: string) => {
    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name,
      type: 'income',
    };
    setIncomeCategories([...incomeCategories, newCategory]);
  };

  const addExpenseCategory = (name: string) => {
    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name,
      type: 'expense',
    };
    setExpenseCategories([...expenseCategories, newCategory]);
  };

  const removeIncomeCategory = (id: string) => {
    setIncomeCategories(incomeCategories.filter(cat => cat.id !== id));
    setIncomeItems(incomeItems.filter(item => item.categoryId !== id));
  };

  const removeExpenseCategory = (id: string) => {
    setExpenseCategories(expenseCategories.filter(cat => cat.id !== id));
    setExpenseItems(expenseItems.filter(item => item.categoryId !== id));
  };

  // Item management functions
  const addIncomeItem = (name: string, amount: number, categoryId: string) => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name,
      amount,
      categoryId,
    };
    setIncomeItems([...incomeItems, newItem]);
  };

  const addExpenseItem = (name: string, amount: number, categoryId: string) => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name,
      amount,
      categoryId,
    };
    setExpenseItems([...expenseItems, newItem]);
  };

  const removeIncomeItem = (id: string) => {
    setIncomeItems(incomeItems.filter(item => item.id !== id));
  };

  const removeExpenseItem = (id: string) => {
    setExpenseItems(expenseItems.filter(item => item.id !== id));
  };

  // Calculation functions
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: string, type: 'income' | 'expense') => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Budge-It</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Budget Summary */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Budget Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground text-xs sm:text-sm">Total Income</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground text-xs sm:text-sm">Total Expenses</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground text-xs sm:text-sm">Balance</p>
              <p className={`text-lg sm:text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Income Section */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Income</h2>
            
            {/* Add Income Buttons */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsIncomeCategoryModalOpen(true)}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm sm:text-base font-medium cursor-pointer"
              >
                + Add Income Category
              </button>
              <button
                onClick={() => setIsIncomeItemModalOpen(true)}
                disabled={incomeCategories.length === 0}
                className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                + Add Income Item
              </button>
            </div>

            {/* Income Categories and Items */}
            <div className="space-y-3 sm:space-y-4">
              {incomeCategories.map((category) => {
                const categoryItems = incomeItems.filter(item => item.categoryId === category.id);
                const categoryTotal = categoryItems.reduce((sum, item) => sum + item.amount, 0);
                
                return (
                  <div key={category.id} className="border border-border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                      <h3 className="font-medium text-sm sm:text-base">{category.name}</h3>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {formatCurrency(categoryTotal)}
                        </span>
                        <button
                          onClick={() => removeIncomeCategory(category.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors text-xs sm:text-sm whitespace-nowrap cursor-pointer"
                        >
                          Remove Category
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.amount)}</p>
                          </div>
                          <button
                            onClick={() => removeIncomeItem(item.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors text-xs ml-2 flex-shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {categoryItems.length === 0 && (
                        <p className="text-muted-foreground text-center py-2 text-xs sm:text-sm">No items in this category</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {incomeCategories.length === 0 && (
                <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">No income categories added yet</p>
              )}
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Expenses</h2>
            
            {/* Add Expense Buttons */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsExpenseCategoryModalOpen(true)}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm sm:text-base font-medium cursor-pointer"
              >
                + Add Expense Category
              </button>
              <button
                onClick={() => setIsExpenseItemModalOpen(true)}
                disabled={expenseCategories.length === 0}
                className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                + Add Expense Item
              </button>
            </div>

            {/* Expense Categories and Items */}
            <div className="space-y-3 sm:space-y-4">
              {expenseCategories.map((category) => {
                const categoryItems = expenseItems.filter(item => item.categoryId === category.id);
                const categoryTotal = categoryItems.reduce((sum, item) => sum + item.amount, 0);
                
                return (
                  <div key={category.id} className="border border-border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                      <h3 className="font-medium text-sm sm:text-base">{category.name}</h3>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {formatCurrency(categoryTotal)}
                        </span>
                        <button
                          onClick={() => removeExpenseCategory(category.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors text-xs sm:text-sm whitespace-nowrap cursor-pointer"
                        >
                          Remove Category
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.amount)}</p>
                          </div>
                          <button
                            onClick={() => removeExpenseItem(item.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors text-xs ml-2 flex-shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {categoryItems.length === 0 && (
                        <p className="text-muted-foreground text-center py-2 text-xs sm:text-sm">No items in this category</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {expenseCategories.length === 0 && (
                <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">No expense categories added yet</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddCategoryModal
        isOpen={isIncomeCategoryModalOpen}
        onClose={() => setIsIncomeCategoryModalOpen(false)}
        onAdd={addIncomeCategory}
        type="income"
      />
      
      <AddCategoryModal
        isOpen={isExpenseCategoryModalOpen}
        onClose={() => setIsExpenseCategoryModalOpen(false)}
        onAdd={addExpenseCategory}
        type="expense"
      />
      
      <AddItemModal
        isOpen={isIncomeItemModalOpen}
        onClose={() => setIsIncomeItemModalOpen(false)}
        onAdd={addIncomeItem}
        type="income"
        categories={incomeCategories}
      />
      
      <AddItemModal
        isOpen={isExpenseItemModalOpen}
        onClose={() => setIsExpenseItemModalOpen(false)}
        onAdd={addExpenseItem}
        type="expense"
        categories={expenseCategories}
      />
    </div>
  );
}
