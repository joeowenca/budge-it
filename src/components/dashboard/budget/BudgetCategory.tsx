"use client";

import { useState } from "react";
import { ChevronRight, Pencil, CheckIcon } from "lucide-react";
import { BudgetItem } from "./BudgetItem";
import { frequencyTypeSchema, dayOfWeekTypeSchema } from "@/db/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";

type Category = {
  id: number;
  emoji: string;
  name: string;
};

export type Item = {
  id: number;
  name: string | null;
  amount: number;
  frequency: z.infer<typeof frequencyTypeSchema>;
  dayOfWeek: z.infer<typeof dayOfWeekTypeSchema>;
  dayOfMonth: number | null;
  dayOfMonthIsLast: boolean;
  secondDayOfMonth: number | null;
  secondDayOfMonthIsLast: boolean;
  startDate: Date | string | null;
  isArchived: boolean;
};

interface BudgetCategoryProps {
  category: Category;
  items: Item[];
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

const titleColors: Record<string, string> = {
  Income: "text-blue-800 bg-primary/10",
  Expenses: "text-red-800 bg-red-600/10",
  Savings: "text-green-900 bg-green-600/10",
};

function TotalAmount({ totalAmount, title, isExpanded }: TotalAmountProps) {
  return (
    <span className={`font-medium text-sm tracking-wider ml-4 px-2.5 py-1 ${titleColors[title ?? ""] || "text-gray-900 bg-gray-600/10"} ${isExpanded && "invisible"} rounded-full`}>
      {totalAmount}
    </span>
  );
}

export function BudgetCategory({
  category,
  items,
  title,
  isExpanded,
  onToggle,
}: BudgetCategoryProps) {
  const activeItems = items.filter((item) => !item.isArchived);
  const isEmpty = activeItems.length === 0;
  const [isEditing, setIsEditing] = useState(isEmpty);

  const getFrequencyMultiplier = (item: Item) => {
    switch (item.frequency) {
      case "weekly":
        return 4;
      case "bi-weekly":
        return 2;
      case "semi-monthly":
        return 2;
      case "monthly":
        return 1;
      default:
        return 1;
    }
  };

  const totalAmount = activeItems.reduce((sum, item) => {
    return sum + item.amount * getFrequencyMultiplier(item);
  }, 0);

  const toggleIsEditing = () => {
    if (!isEmpty) {
      setIsEditing(!isEditing);
    }
  };

  function toggleIsExpanded() {
    if (!isEditing) {
      onToggle();
    }
  }

  return (
    <div className="space-y-2 p-4 rounded-lg shadow-[0px_0px_10px_rgba(0,0,0,0.12)] transition-colors">
      {/* Category Header - Clickable */}
      <div
        className={`${(isEmpty || isEditing) ? "cursor-default" : "cursor-pointer"} select-none`}
        onClick={toggleIsExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <span className="font-semibold truncate"><span className={`${category.emoji && "mr-2"} text-xl`}>{category.emoji}</span>{category.name}</span>
            <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-all ${isEditing && "hidden"} ${(isExpanded || isEmpty) ? "rotate-90" : "rotate-0"}`} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2 relative">
            {(isExpanded || isEmpty) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIsEditing();
                }}
                className={`p-2 rounded-full transition-all ${isEmpty ? "text-muted-foreground cursor-not-allowed" : `hover:text-white ${isEditing ? "hover:bg-green-500 hover:shadow-green-500/25" : "hover:bg-primary hover:shadow-primary/25"} hover:shadow-lg cursor-pointer`} absolute right-0`}
                aria-label="Edit category"
              >
                {isEditing ? (
                  <CheckIcon className={`size-4.5`} strokeWidth={2.5} />
                ) : (
                  <Pencil className="size-4.5" strokeWidth={2} />
                )}
              </button>
            )}
            <TotalAmount title={title} isExpanded={(isExpanded || isEmpty)} totalAmount={formatAmount(totalAmount)} />
          </div>
        </div>
      </div>

      {/* Items - Only show when expanded */}
      {(isExpanded || isEmpty) && (
        <>
          {activeItems.length > 0 && (
            <div className="space-y-1 mt-3">
              {activeItems.map((item) => (
                <BudgetItem
                  key={item.id}
                  item={item}
                  isEditing={isEditing}
                />
              ))}
            </div>
          )}
          {isEditing && <>
            <Button
              variant="ghost"
              className="mb-0"
            >
              + Add Item
            </Button>
          </>}
          {/* Total at bottom - Tally sheet style */}
          <div className="pt-1">
            <div className="flex items-center justify-between mt-1">
              <span className="font-medium">Monthly total</span>
              <TotalAmount title={title} totalAmount={formatAmount(totalAmount)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

