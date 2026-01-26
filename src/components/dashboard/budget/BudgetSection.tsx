"use client";

import { useState } from "react";
import { CategoryWithBudgetItems } from "./Budget";
import { BudgetCategory } from "./BudgetCategory";
import type { BudgetType } from "@/db/schema";
import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { Plus } from "lucide-react";
import { AmountPillColorTypes } from "@/components/AmountPill";

export const titleColors: Record<string, AmountPillColorTypes> = {
  Income: "blue",
  Expenses: "red",
  Savings: "green"
}

interface BudgetSectionProps {
  title: string;
  categories: CategoryWithBudgetItems[];
  budgetType: BudgetType;
}

export default function BudgetSection({ title, categories, budgetType }: BudgetSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  const toggleIsAdding = () => {
    setIsAdding(!isAdding);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center w-full px-1 py-2">
        <h3 className="text-xl flex-1 font-bold">{title}</h3>
      </div>
      <div className="space-y-4 mb-4">
        {categories.filter((category) => !category.isArchived).length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        ) : (
          categories
            .filter((category) => !category.isArchived)
            .map((category) => {
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
                />
              );
            })
        )}
      </div>
      <div className="flex items-center h-9">
        <div
          onClick={() => {toggleIsAdding()}}
          className={`${isAdding && "hidden"} ml-1 text-primary/75 rounded-full bg-muted cursor-pointer hover:text-white hover:bg-primary transition-all p-1.25`}
        >
            <Plus className="size-4.5" strokeWidth={2.75} />
        </div>
        {isAdding && (<BudgetCategoryForm budgetType={budgetType} action="add" onClose={(toggleIsAdding)} />)}
      </div>
    </div>
  );
}

