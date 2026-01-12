"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, CheckIcon, X as XIcon, Undo } from "lucide-react";
import { BudgetItem } from "./BudgetItem";
import { BudgetItemForm } from "./BudgetItemForm";
import { batchUpdateBudgetItems } from "@/app/actions/budgetActions";
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
  sortOrder: number;
};

export type DraftItem = Omit<Item, "amount"> & { amount: string };

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
  const router = useRouter();
  // Stable sort: sort by sortOrder (ascending) first, then by id (ascending) as tie-breaker
  const activeItems = items
    .filter((item) => !item.isArchived)
    .sort((a, b) => {
      const sortOrderA = a.sortOrder ?? 0;
      const sortOrderB = b.sortOrder ?? 0;
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }
      return a.id - b.id;
    });
  const isEmpty = activeItems.length === 0;
  const [isEditing, setIsEditing] = useState(isEmpty);
  const [editValues, setEditValues] = useState<Record<number, DraftItem>>({});

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
    if (isEmpty) return;

    if (!isEditing) {
      // ENTERING Edit Mode: Initialize values immediately
      // Convert amount from cents (number) to dollars (string), preserving 2 decimal places
      const initialValues: Record<number, DraftItem> = {};
      activeItems.forEach((item) => {
        initialValues[item.id] = {
          ...item,
          amount: (item.amount / 100).toFixed(2),
        };
      });
      setEditValues(initialValues);
      setIsEditing(true);
    } else {
      // EXITING Edit Mode (Cancel): Clear values
      setEditValues({});
      setIsEditing(false);
    }
  };

  const handleSave = async () => {
    // Construct array of updates from editValues
    // Convert amount from dollars (string) back to cents (number)

    if (isEmpty) return;

    const updates = Object.values(editValues).map((item) => {
      const amountInCents = Math.round(parseFloat(item.amount) * 100);
      return {
        id: item.id,
        name: item.name || undefined,
        amount: isNaN(amountInCents) ? 0 : amountInCents,
        isArchived: item.isArchived,
      };
    });

    // Call batchUpdateBudgetItems
    const result = await batchUpdateBudgetItems(updates);

    if (result.success) {
      // Clear edit state and toggle isEditing to false
      setEditValues({});
      setIsEditing(false);
      // Refresh the page data to show updated items
      router.refresh();
    } else {
      // Handle error (could add toast notification here)
      console.error("Failed to update budget items:", result.error);
    }
  };

  const handleNameChange = (itemId: number, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], name: value },
    }));
  };

  const handleAmountChange = (itemId: number, value: string) => {
    // Allow empty string, numbers, and decimals (including trailing dots)
    // Prevent letters and symbols other than dots
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setEditValues((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], amount: value },
      }));
    }
  };

  const handleArchive = (itemId: number) => {
    setEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], isArchived: true },
    }));
  };

  function toggleIsExpanded() {
    if (!isEditing) {
      onToggle();
    }
  }

  return (
    <div className="space-y-2 p-4 rounded-lg shadow-[0px_0px_10px_rgba(0,0,0,0.12)] transition-colors">
      {/* Category Header - Clickable */}
      <div className="flex items-center justify-between">
        <div 
          className={`flex items-center gap-2 pr-2 transition-all ${!isEditing && "hover:text-primary"} ${(isEmpty || isEditing) ? "cursor-default" : "cursor-pointer"} select-none`}
          onClick={toggleIsExpanded}
        >
          <span className="font-semibold truncate"><span className={`${category.emoji && "mr-2"} text-xl`}>{category.emoji}</span>{category.name}</span>
          {isEditing && <div className="text-sm text-red-600 p-1.25 hover:text-white hover:bg-red-500 rounded-full transition-all cursor-pointer -translate-x-1"><XIcon className="size-4.5" strokeWidth={2.5} /></div>}
          <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-all ${isEditing && "hidden"} ${(isExpanded || isEmpty) ? "rotate-90" : "rotate-0"}`} strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2 relative">
          {(isExpanded || isEmpty) && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleIsEditing();
              }}
              className={`p-1.5 rounded-full transition-all ${isEmpty ? "text-muted-foreground cursor-not-allowed" : "hover:text-white hover:bg-primary cursor-pointer"} absolute right-0`}
              aria-label="Edit category"
            >
              <Pencil className="size-4.5" strokeWidth={2} />
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-1 absolute right-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIsEditing();
                }}
                className={`p-1.5 text-muted-foreground rounded-full transition-all ${isEmpty ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer hover:text-white hover:bg-primary"}`}
                aria-label="Cancel editing"
              >
                <Undo className="size-4.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className={`p-1.5 rounded-full transition-all ${isEmpty ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-green-600 hover:text-white hover:bg-green-500"}`}
                aria-label="Save changes"
              >
                <CheckIcon className="size-4.5" strokeWidth={3} />
              </button>
            </div>
          )}
          <TotalAmount title={title} isExpanded={(isExpanded || isEmpty)} totalAmount={formatAmount(totalAmount)} />
        </div>
      </div>

      {/* Items - Only show when expanded */}
      {(isExpanded || isEmpty) && (
        <>
          {activeItems.length > 0 && (
            <div className="space-y-1 mt-3">
              {activeItems.map((item) => {
                if (isEditing) {
                  const editItem = editValues[item.id];
                  // Skip archived items in edit mode
                  if (!editItem || editItem.isArchived) {
                    return null;
                  }
                  return (
                    <BudgetItemForm
                      key={item.id}
                      budgetItem={editItem}
                      onNameChange={(value) => handleNameChange(item.id, value)}
                      onAmountChange={(value) => handleAmountChange(item.id, value)}
                      onArchive={() => handleArchive(item.id)}
                    />
                  );
                }
                return (
                  <BudgetItem
                    key={item.id}
                    item={item}
                    isEditing={isEditing}
                  />
                );
              })}
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

