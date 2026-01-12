"use client";

import { Item } from "./BudgetCategory";
import { Input } from "@/components/ui/input";
import { Calendar, X } from "lucide-react";

interface BudgetItemFormProps {
  budgetItem: Item;
  onNameChange: (value: string) => void;
  onAmountChange: (value: number) => void;
  onArchive?: () => void;
}

export function BudgetItemForm({
  budgetItem,
  onNameChange,
  onAmountChange,
  onArchive,
}: BudgetItemFormProps) {
  // Convert amount from cents to dollars for input
  const amountInDollars = budgetItem.amount === 0 ? "" : (budgetItem.amount / 100).toString();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Convert dollars to cents
      const cents = value === "" ? 0 : Math.round(parseFloat(value) * 100);
      onAmountChange(cents);
    }
  };

  return (
    <div className="pl-2 py-1 pb-2 text-sm border-b-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Input
            type="text"
            value={budgetItem.name || ""}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="No label"
            className="font-medium h-7 px-2 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 p-0"
          />
        </div>
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4 mr-1" strokeWidth={2} />
        <div className="flex items-center gap-1">
          <Input
            type="text"
            value={amountInDollars}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="font-medium w-20 px-2.5 py-1 text-yellow-900 bg-yellow-600/10 rounded-full tracking-wider text-sm h-7 text-right border-0 focus-visible:ring-0"
          />
          {onArchive && (
            <button
              onClick={onArchive}
              className="p-1 rounded-full hover:text-white hover:bg-red-500 hover:shadow-md hover:shadow-red-600/25 transition-all flex-shrink-0 ml-1"
              aria-label="Archive item"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
