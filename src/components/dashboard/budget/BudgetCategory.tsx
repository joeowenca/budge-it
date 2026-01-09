"use client";

import { useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { BudgetItem } from "./BudgetItem";
import { frequencyTypeSchema, dayOfWeekTypeSchema } from "@/db/schema";
import { z } from "zod";

type Category = {
  id: number;
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
  Income: "text-blue-600 bg-primary/10",
  Expenses: "text-red-600 bg-red-600/10",
  Savings: "text-green-700 bg-green-600/10",
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
  const [isEditing, setIsEditing] = useState(false);

  const getFrequencyMultiplier = (item: Item) => {
    switch (item.frequency) {
      case "weekly":
        return 4; // assume 4 weeks per month
      case "bi-weekly":
        return 2; // 2 pay periods per month
      case "semi-monthly":
        return 2; // 2 payments per month
      case "monthly":
        return 1; // 1 payment per month
      default:
        return 1;
    }
  };

  // Filter out archived items
  const activeItems = items.filter((item) => !item.isArchived);

  const totalAmount = activeItems.reduce((sum, item) => {
    return sum + item.amount * getFrequencyMultiplier(item);
  }, 0);

  const toggleIsEditing = () => {
    setIsEditing(!isEditing);
    console.log("BudgetCategory isEditing:", category.name, !isEditing);
  };

  return (
    <div className="space-y-2 p-4 rounded-lg shadow-[0px_0px_15px_rgba(0,0,0,0.1)] transition-colors">
      {/* Category Header - Clickable */}
      <div
        className="cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <span className="font-medium truncate">{category.name}</span>
            <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-all ${isExpanded ? "rotate-90" : "rotate-0"}`} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2 relative">
            {isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIsEditing();
                }}
                className="p-1.5 rounded-full hover:text-white hover:bg-primary transition-colors cursor-pointer absolute right-0"
                aria-label="Edit category"
              >
                <Pencil className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            )}
            <TotalAmount title={title} isExpanded={isExpanded} totalAmount={formatAmount(totalAmount)} />
          </div>
        </div>
      </div>

      {/* Items - Only show when expanded */}
      {isExpanded && (
        <>
          {activeItems.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-3">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-1 mt-3">
              {activeItems.map((item) => (
                <BudgetItem
                  key={item.id}
                  item={item}
                  isEditing={isEditing}
                />
              ))}
              {/* Total at bottom - Tally sheet style */}
              <div className="pt-1">
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">Monthly total</span>
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

