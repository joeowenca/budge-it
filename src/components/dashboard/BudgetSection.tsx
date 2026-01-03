"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { getCategories, getTransactions } from "@/app/actions/transactionActions";

type Category = Awaited<ReturnType<typeof getCategories>>[number];
type Transaction = Awaited<ReturnType<typeof getTransactions>>[number];

interface CategoryWithTransactions extends Category {
  transactions: Transaction[];
}

interface BudgetSectionProps {
  title: string;
  categories: CategoryWithTransactions[];
}

function formatAmount(amount: number): string {
  // Amount is stored in cents, convert to dollars
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
}

export default function BudgetSection({ title, categories }: BudgetSectionProps) {
  // Track expanded state for each category (default: all collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        ) : (
          categories.map((category) => {
            const totalAmount = category.transactions.reduce(
              (sum, tx) => sum + tx.amount,
              0
            );
            const isExpanded = expandedCategories.has(category.id);

            return (
              <div key={category.id} className="space-y-2">
                {/* Category Header - Clickable */}
                <div
                  className="p-3 bg-muted/50 rounded-md cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => toggleCategory(category.id)}
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
                    {category.transactions.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-3">
                        No transactions yet
                      </p>
                    ) : (
                      <div className="space-y-1 pl-3">
                        {category.transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="p-2 bg-background/50 rounded border text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{transaction.label || "No label"}</div>
                                {transaction.date && (
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(transaction.date)}
                                  </div>
                                )}
                              </div>
                              <div className="font-medium ml-4">
                                {formatAmount(transaction.amount)}
                              </div>
                            </div>
                          </div>
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
          })
        )}
      </div>
    </div>
  );
}

