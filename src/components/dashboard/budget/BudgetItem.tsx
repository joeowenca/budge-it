import { ReadBudgetItemType } from "@/db/schema";
import { AmountPill } from "@/components/AmountPill";
import { convertAmountToCurrency, getFrequencyMultiplier } from "@/lib/utils";

import { DateDescription } from "./DateDescription";

interface BudgetItemProps {
  item: ReadBudgetItemType;
}

export function BudgetItem({ item }: BudgetItemProps) {
  const multiplier = getFrequencyMultiplier(item);
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
          {multiplier > 1 && multiplier + "x"}
        </span>
        <AmountPill amount={convertAmountToCurrency(item.amount)} color="yellow" />
      </div>
    </div>
  );
}

