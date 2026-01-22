"use client";

import { useState } from "react";
import { UpdateItemDraft, CreateItemDraft } from "@/components/dashboard/budget/BudgetCategory";
import { Input } from "@/components/ui/input";
import { Calendar, Trash2, Plus } from "lucide-react";
import { budgetTypeSchema } from "@/db/schema";
import { z } from "zod";
import { FrequencyDialog } from "./FrequencyDialog";
import { capitalizeFirstLetter } from "@/lib/utils";

interface BudgetItemFormProps {
  action: "edit" | "add";
  budgetItem: UpdateItemDraft | CreateItemDraft;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onArchive?: () => void;
  type?: z.infer<typeof budgetTypeSchema>; // For "add" mode
  onAdd?: () => void;
  onFrequencyChange?: (data: any) => void;
  isFrequencyModified?: boolean;
}

export function BudgetItemForm({
  action,
  budgetItem,
  onNameChange,
  onAmountChange,
  onArchive,
  type,
  onAdd,
  onFrequencyChange,
  isFrequencyModified
}: BudgetItemFormProps) {
  const [isFrequencyDialogOpen, setIsFrequencyDialogOpen] = useState(false);

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

  const handleFrequencyChange = (data: any) => {
    onFrequencyChange?.(data);
    setIsFrequencyDialogOpen(false);
  };

  // Extract only frequency-related fields for the dialog
  const frequencyDefaults = {
    frequency: budgetItem.frequency,
    startDate: budgetItem.startDate,
    dayOfWeek: budgetItem.dayOfWeek,
    dayOfMonth: budgetItem.dayOfMonth,
    dayOfMonthIsLast: budgetItem.dayOfMonthIsLast,
    secondDayOfMonth: budgetItem.secondDayOfMonth,
    secondDayOfMonthIsLast: budgetItem.secondDayOfMonthIsLast,
  };

  const isAddMode = action === "add";
  const namePlaceholder = isAddMode ? `Add ${type}` : `${type ? capitalizeFirstLetter(type): "Item"} name`;
  const amountPlaceholder = "0.00"

  return (
    <div className="py-2 pb-3 text-sm border-b-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 min-w-0 gap-2 mr-1">
          <Input
            type="text"
            value={budgetItem.name || ""}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder={namePlaceholder}
            className="font-medium max-w-48 h-7 px-2 text-sm border-1 focus-visible:ring-0"
          />
          <div 
            className={`p-1.25 hover:text-white hover:bg-primary bg-muted ${isFrequencyModified ? "text-primary" : "text-muted-foreground"} ${isFrequencyDialogOpen && "text-white bg-primary"} rounded-full cursor-pointer transition-all flex-shrink-0`}
            onClick={() => setIsFrequencyDialogOpen(true)}
          >
            <Calendar className="size-4.5" strokeWidth={2} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <p className="text-yellow-800">$</p>
            <Input
            type="text"
            value={budgetItem.amount}
            onChange={handleAmountChange}
            placeholder={amountPlaceholder}
            className="font-medium w-20 h-7 px-1.5 py-1 text-yellow-800 bg-yellow-500/15 border-yellow-600/20 hover:border-yellow-900 tracking-wider text-sm"
          />
          </div>
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
                <Trash2 className="size-4.5" strokeWidth={2} />
              </button>
            )
          )}
        </div>
      </div>
      <FrequencyDialog
        open={isFrequencyDialogOpen}
        onOpenChange={setIsFrequencyDialogOpen}
        itemName={budgetItem.name}
        defaultValues={frequencyDefaults}
        onSave={handleFrequencyChange}
      />
    </div>
  );
}
