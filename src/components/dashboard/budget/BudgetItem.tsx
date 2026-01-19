import { ReadBudgetItemType } from "@/db/schema";
import { AmountPill } from "@/components/AmountPill";
import { convertAmountToCurrency } from "@/lib/utils";

import { DateDescription } from "./DateDescription";

interface BudgetItemProps {
  item: ReadBudgetItemType;
}

export function BudgetItem({ item }: BudgetItemProps) {
  return (
    <div className="pl-2 py-1 pb-2 text-sm border-b-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {item.name || "No label"}
          </div>
          <DateDescription item={item} />
        </div>
        <span className="text-xs text-muted-foreground tracking-[0.2em] ml-4 mr-1">
          {item.frequency === "weekly" && "4x"}
          {item.frequency === "bi-weekly" && "2x"}
          {item.frequency === "semi-monthly" && "2x"}
        </span>
        <AmountPill amount={convertAmountToCurrency(item.amount)} color="yellow" />
      </div>
    </div>
  );
}

