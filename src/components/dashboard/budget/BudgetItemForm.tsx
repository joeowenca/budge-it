"use client";

import { UpdateItemDraft, CreateItemDraft } from "@/components/dashboard/budget/BudgetCategory";
import { Input } from "@/components/ui/input";
import { Calendar, X, Plus } from "lucide-react";
import { budgetTypeSchema } from "@/db/schema";
import { z } from "zod";

interface BudgetItemFormProps {
  action: "edit" | "add";
  budgetItem: UpdateItemDraft | CreateItemDraft;
  onNameChange?: (value: string) => void;
  onAmountChange?: (value: string) => void;
  onArchive?: () => void;
  // For "add" mode
  type?: z.infer<typeof budgetTypeSchema>;
  onAdd?: () => void;
}

export function BudgetItemForm({
  action,
  budgetItem,
  onNameChange,
  onAmountChange,
  onArchive,
  type,
  onAdd,
}: BudgetItemFormProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimals (including trailing dots)
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange?.(value);
    }
  };

  const handleAdd = () => {
    if (!budgetItem.name || !budgetItem.amount) {
      return;
    }
    onAdd?.();
  };

  const isAddMode = action === "add";
  const namePlaceholder = isAddMode ? `Add ${type}` : `${type} name`;
  const amountPlaceholder = "0.00"

  return (
    <div className="py-2 pb-3 text-sm border-b-1">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 max-w-48 min-w-0">
          <Input
            type="text"
            value={budgetItem.name || ""}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder={namePlaceholder}
            className="font-medium h-7 px-2 text-sm border-1 focus-visible:ring-0"
          />
          <div className="p-1.25 hover:text-white hover:bg-primary bg-muted rounded-full cursor-pointer transition-all flex-shrink-0 ml-1 mr-3.5">
            <Calendar className="size-4.5" strokeWidth={2} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-yellow-800">$</p>
          <Input
            type="text"
            value={budgetItem.amount}
            onChange={handleAmountChange}
            placeholder={amountPlaceholder}
            className="font-medium w-16 xl:w-20 px-1.5 py-1 text-yellow-800 bg-yellow-500/15 border-yellow-600/20 hover:border-yellow-900 tracking-wider text-sm h-7"
          />
          {isAddMode ? (
            <button
              onClick={handleAdd}
              disabled={!budgetItem.name || !budgetItem.amount}
              className="p-1.25 text-primary bg-muted hover:text-white hover:bg-primary disabled:text-primary disabled:bg-muted rounded-full transition-all cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Add ${type}`}
            >
              <Plus className="size-4.5" strokeWidth={2.75} />
            </button>
          ) : (
            onArchive && (
              <button
                onClick={onArchive}
                className="p-1.25 text-red-600 bg-muted hover:text-white hover:bg-red-500 rounded-full transition-all cursor-pointer flex-shrink-0"
                aria-label="Archive item"
              >
                <X className="size-4.5" strokeWidth={2.5} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
