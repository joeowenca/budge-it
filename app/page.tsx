'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
}

export default function Home() {
  const [income, setIncome] = useState<BudgetItem[]>([]);
  const [expenses, setExpenses] = useState<BudgetItem[]>([]);
  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedIncome = localStorage.getItem('budget-income');
    const savedExpenses = localStorage.getItem('budget-expenses');
    
    if (savedIncome) {
      setIncome(JSON.parse(savedIncome));
    }
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save data to localStorage whenever income or expenses change
  useEffect(() => {
    localStorage.setItem('budget-income', JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem('budget-expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addIncome = () => {
    if (newIncomeName.trim() && newIncomeAmount.trim()) {
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        name: newIncomeName.trim(),
        amount: parseFloat(newIncomeAmount),
      };
      setIncome([...income, newItem]);
      setNewIncomeName('');
      setNewIncomeAmount('');
    }
  };

  const addExpense = () => {
    if (newExpenseName.trim() && newExpenseAmount.trim()) {
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        name: newExpenseName.trim(),
        amount: parseFloat(newExpenseAmount),
      };
      setExpenses([...expenses, newItem]);
      setNewExpenseName('');
      setNewExpenseAmount('');
    }
  };

  const removeIncome = (id: string) => {
    setIncome(income.filter(item => item.id !== id));
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(item => item.id !== id));
  };

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;

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
      <main className="container mx-auto px-4 py-8">
        {/* Budget Summary */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Budget Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Monthly Income</h2>
            
            {/* Add Income Form */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Income source"
                value={newIncomeName}
                onChange={(e) => setNewIncomeName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newIncomeAmount}
                  onChange={(e) => setNewIncomeAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={addIncome}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Income List */}
            <div className="space-y-2">
              {income.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(item.amount)}</p>
                  </div>
                  <button
                    onClick={() => removeIncome(item.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {income.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No income sources added yet</p>
              )}
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Monthly Expenses</h2>
            
            {/* Add Expense Form */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Expense category"
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={addExpense}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Expenses List */}
            <div className="space-y-2">
              {expenses.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(item.amount)}</p>
                  </div>
                  <button
                    onClick={() => removeExpense(item.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No expenses added yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
