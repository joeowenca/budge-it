"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, CheckIcon, X as XIcon } from "lucide-react";
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
  const router = useRouter();
  const activeItems = items.filter((item) => !item.isArchived);
  const isEmpty = activeItems.length === 0;
  const [isEditing, setIsEditing] = useState(isEmpty);
  const [editValues, setEditValues] = useState<Record<number, Item>>({});

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

  // Initialize editValues when isEditing becomes true
  useEffect(() => {
    if (isEditing && !isEmpty) {
      const initialValues: Record<number, Item> = {};
      activeItems.forEach((item) => {
        initialValues[item.id] = { ...item };
      });
      setEditValues(initialValues);
    }
  }, [isEditing, isEmpty, activeItems]);

  const toggleIsEditing = () => {
    if (!isEmpty) {
      setIsEditing(!isEditing);
      if (isEditing) {
        // Cancel: clear edit values
        setEditValues({});
      }
    }
  };

  const handleSave = async () => {
    // Construct array of updates from editValues
    const updates = Object.values(editValues).map((item) => ({
      id: item.id,
      name: item.name || undefined,
      amount: item.amount,
      isArchived: item.isArchived,
    }));

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

  const handleAmountChange = (itemId: number, value: number) => {
    setEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], amount: value },
    }));
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
            {(isExpanded || isEmpty) && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIsEditing();
                }}
                className={`p-2 rounded-full transition-all ${isEmpty ? "text-muted-foreground cursor-not-allowed" : "hover:text-white hover:bg-primary hover:shadow-primary/25 hover:shadow-lg cursor-pointer"} absolute right-0`}
                aria-label="Edit category"
              >
                <Pencil className="size-4.5" strokeWidth={2} />
              </button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2 absolute right-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleIsEditing();
                  }}
                  className="p-2 rounded-full transition-all hover:text-white hover:bg-red-500 hover:shadow-red-500/25 hover:shadow-lg cursor-pointer"
                  aria-label="Cancel editing"
                >
                  <XIcon className="size-4.5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="p-2 rounded-full transition-all hover:text-white hover:bg-green-500 hover:shadow-green-500/25 hover:shadow-lg cursor-pointer"
                  aria-label="Save changes"
                >
                  <CheckIcon className="size-4.5" strokeWidth={2.5} />
                </button>
              </div>
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
              {activeItems.map((item) => {
                if (isEditing) {
                  const editItem = editValues[item.id] || item;
                  // Skip archived items in edit mode
                  if (editItem.isArchived) {
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

