"use client";

import { DraftItem } from "./BudgetCategory";
import { Input } from "@/components/ui/input";
import { Calendar, X } from "lucide-react";

interface BudgetItemFormProps {
  budgetItem: DraftItem;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onArchive?: () => void;
}

export function BudgetItemForm({
  budgetItem,
  onNameChange,
  onAmountChange,
  onArchive,
}: BudgetItemFormProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAmountChange(e.target.value);
  };

  return (
    <div className="py-2 pb-3 text-sm border-b-1">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 max-w-48 min-w-0">
          <Input
            type="text"
            value={budgetItem.name || ""}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="No label"
            className="font-medium h-7 px-2 text-sm border-1 focus-visible:ring-0 py-0"
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
            placeholder="0.00"
            className="font-medium w-16 xl:w-20 px-1.5 py-1 text-yellow-800 bg-yellow-500/15 border-yellow-600/20 hover:border-yellow-900 tracking-wider text-sm h-7"
          />
          {onArchive && (
            <button
              onClick={onArchive}
              className="p-1.25 text-red-600 bg-muted hover:text-white hover:bg-red-500 rounded-full transition-all cursor-pointer flex-shrink-0"
              aria-label="Archive item"
            >
              <X className="size-4.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
