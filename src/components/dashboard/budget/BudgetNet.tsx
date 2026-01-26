"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { AmountPill, AmountPillColorTypes } from "@/components/AmountPill";
import { convertAmountToCurrency } from "@/lib/utils";

interface BudgetNetProps {
  incomeTotal: number;
  expensesTotal: number;
  savingsTotal: number;
}

export function BudgetNet({
  incomeTotal,
  expensesTotal,
  savingsTotal,
}: BudgetNetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const monthName = new Date().toLocaleString("default", { month: "long" });

  const netTotal = incomeTotal - expensesTotal - savingsTotal;

  const NetItem = ({ name, amount, color }: { name: string; amount: number, color: AmountPillColorTypes }) => {
      return (
        <div className="pl-2 py-2 pb-3 text-sm border-b-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {name}
              </div>
            </div>
            <AmountPill amount={convertAmountToCurrency(amount)} color={color} />
          </div>
        </div>
      );
  };

  return (
    <div className="space-y-2 p-4 rounded-xl shadow-[0px_0px_12px_rgba(0,0,0,0.1)] transition-colors bg-card">
      <div 
        className="flex items-center justify-between m-0 h-7 group"
      >
        <div 
            className="flex items-center gap-2 pr-2 transition-all cursor-pointer select-none hover:text-primary"
            onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="font-semibold truncate">
            <span className="mr-2 text-xl">💰</span>
            Spending
          </span>
          <ChevronRight 
            className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`} 
            strokeWidth={2.5} 
          />
        </div>

        {/* Show Total in Header if Collapsed */}
        <div className={`${isExpanded && "hidden pointer-events-none"}`}>
             <AmountPill amount={convertAmountToCurrency(netTotal)} color="yellow" />
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="space-y-1 mt-3">
            <NetItem name="Income" amount={incomeTotal} color="blue" />
            <NetItem name="Expenses" amount={expensesTotal} color="red" />
            <NetItem name="Savings" amount={savingsTotal} color="green" />
          </div>

        <div className="flex items-center justify-between pt-1">
            <span className="font-medium">Spending available</span>
            <AmountPill amount={convertAmountToCurrency(netTotal)} color="yellow" />
        </div>
        </>
      )}
    </div>
  );
}