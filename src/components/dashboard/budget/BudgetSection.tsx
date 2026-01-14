"use client";

import { useState } from "react";
import { getBudgetCategories, getBudgetItems } from "@/app/actions/budgetActions";
import { BudgetCategory } from "./BudgetCategory";
import type { BudgetType } from "@/db/schema";
import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { Plus } from "lucide-react";

type Category = NonNullable<Awaited<ReturnType<typeof getBudgetCategories>>["data"]>[number];
type BudgetItem = NonNullable<Awaited<ReturnType<typeof getBudgetItems>>["data"]>[number];

interface CategoryWithBudgetItems extends Category {
  budgetItems: BudgetItem[];
}

interface BudgetSectionProps {
  title: string;
  categories: CategoryWithBudgetItems[];
  type: BudgetType;
}

export default function BudgetSection({ title, categories, type }: BudgetSectionProps) {
  // Track expanded state for each category (default: all collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

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

  const toggleIsAdding = () => {
    setIsAdding(!isAdding);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center w-full px-1 py-2">
        <h3 className="text-xl flex-1 font-medium">{title}</h3>
        <div
          onClick={() => {toggleIsAdding()}}
          className={`${isAdding && "hidden"} rounded-full bg-muted cursor-pointer hover:text-white hover:bg-primary transition-all p-1.25`}
        >
          <Plus className="size-4.5" strokeWidth={2.75} />
      </div>
      </div>
      <div className="space-y-4 mb-4">
        {categories.filter((category) => !category.isArchived).length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        ) : (
          categories
            .filter((category) => !category.isArchived)
            .map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              // Map schema category (with 'name') to BudgetCategory expected format (with 'label')
              const categoryForDisplay = {
                id: category.id,
                emoji: category.emoji,
                name: category.name,
                type: category.type,
              };

              return (
                <BudgetCategory
                  key={category.id}
                  category={categoryForDisplay}
                  items={category.budgetItems}
                  title={title}
                  isExpanded={isExpanded}
                  onToggle={() => toggleCategory(category.id)}
                />
              );
            })
        )}
      </div>
      <BudgetCategoryForm type={type} isAdding={isAdding} toggleIsAdding={(toggleIsAdding)} />
    </div>
  );
}

