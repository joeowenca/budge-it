"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { BudgetTransaction } from "./BudgetTransaction";

type Category = {
  id: number;
  label: string;
};

type Transaction = {
  id: number;
  label: string | null;
  amount: number;
  date: Date | string | null;
};

interface BudgetCategoryProps {
  category: Category;
  transactions: Transaction[];
  isExpanded: boolean;
  onToggle: () => void;
}

function formatAmount(amount: number): string {
  // Amount is stored in cents, convert to dollars
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

export function BudgetCategory({
  category,
  transactions,
  isExpanded,
  onToggle,
}: BudgetCategoryProps) {
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-2">
      {/* Category Header - Clickable */}
      <div
        className="p-3 bg-muted/50 rounded-md cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">{category.label}</span>
          </div>
          {!isExpanded && (
            <span className="text-sm font-semibold">
              {formatAmount(totalAmount)}
            </span>
          )}
        </div>
      </div>

      {/* Transactions - Only show when expanded */}
      {isExpanded && (
        <>
          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-3">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-1 pl-3">
              {transactions.map((transaction) => (
                <BudgetTransaction
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
              {/* Total at bottom - Tally sheet style */}
              <div className="p-2 bg-muted/30 rounded border-t-2 border-muted mt-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

