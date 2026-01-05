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
  title: string;
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

interface TotalAmountProps {
  totalAmount: string;
  title?: string;
  isExpanded?: boolean;
}

function TotalAmount({ totalAmount, title, isExpanded }: TotalAmountProps) {
  return (
    <span className={`font-medium text-sm ml-4 px-2.5 py-1 ${title === "Income" ? "text-green-900 bg-green-600/10" : "text-blue-900 bg-primary/10"} rounded-full ${isExpanded && "invisible"}`}>
      {totalAmount}
    </span>
  );
}

export function BudgetCategory({
  category,
  transactions,
  title,
  isExpanded,
  onToggle,
}: BudgetCategoryProps) {
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-2 p-4 rounded-lg shadow-[0px_0px_15px_rgba(0,0,0,0.1)] transition-colors">
      {/* Category Header - Clickable */}
      <div
        className="cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <span className="font-medium truncate">{category.label}</span>
            <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`} strokeWidth={2.5} />
          </div>
          <TotalAmount title={title} isExpanded={isExpanded} totalAmount={formatAmount(totalAmount)} />
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
            <div className="space-y-1 mt-3">
              {transactions.map((transaction) => (
                <BudgetTransaction
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
              {/* Total at bottom - Tally sheet style */}
              <div className="pt-1">
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">Total</span>
                  <TotalAmount title={title} totalAmount={formatAmount(totalAmount)} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

