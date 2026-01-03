"use client";

import { useState } from "react";
import { getCategories, getTransactions } from "@/app/actions/transactionActions";
import { BudgetCategory } from "./BudgetCategory";

type Category = Awaited<ReturnType<typeof getCategories>>[number];
type Transaction = Awaited<ReturnType<typeof getTransactions>>[number];

interface CategoryWithTransactions extends Category {
  transactions: Transaction[];
}

interface BudgetSectionProps {
  title: string;
  categories: CategoryWithTransactions[];
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
            const isExpanded = expandedCategories.has(category.id);

            return (
              <BudgetCategory
                key={category.id}
                category={category}
                transactions={category.transactions}
                isExpanded={isExpanded}
                onToggle={() => toggleCategory(category.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

