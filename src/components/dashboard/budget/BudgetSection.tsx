"use client";

import { useState } from "react";
import { getBudgetCategories, getBudgetItems } from "@/app/actions/budgetActions";
import { BudgetCategory } from "./BudgetCategory";

type Category = NonNullable<Awaited<ReturnType<typeof getBudgetCategories>>["data"]>[number];
type BudgetItem = NonNullable<Awaited<ReturnType<typeof getBudgetItems>>["data"]>[number];

interface CategoryWithBudgetItems extends Category {
  budgetItems: BudgetItem[];
}

interface BudgetSectionProps {
  title: string;
  categories: CategoryWithBudgetItems[];
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
    <div className="space-y-2">
      <h3 className="text-xl font-medium">{title}</h3>
      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        ) : (
          categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            // Map schema category (with 'name') to BudgetCategory expected format (with 'label')
            const categoryForDisplay = {
              id: category.id,
              name: category.name,
            };

            return (
              <BudgetCategory
                key={category.id}
                category={categoryForDisplay}
                transactions={category.budgetItems}
                title={title}
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

