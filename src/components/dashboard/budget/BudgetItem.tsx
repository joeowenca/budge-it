import { ReadBudgetItemType } from "@/db/schema";
import { Calendar } from "lucide-react";
import { getOrdinal, getLastDayOfMonth } from "@/lib/utils";

function formatAmount(amount: number): string {
  // Amount is stored in cents, convert to dollars
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

interface BudgetItemProps {
  item: ReadBudgetItemType;
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return "";

  const trimmed = str.slice(0, 3);
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

type DateDescriptionProps = {
  item: ReadBudgetItemType;
}

export function DateDescription({ item }: DateDescriptionProps) {
  return (
    <div className="flex text-xs font-semibold tracking-wide text-muted-foreground">
      <Calendar className="size-3.5 mt-0.25 mr-1" />
      {item.frequency === "weekly" && item.dayOfWeek && (
        <>
          {capitalizeFirstLetter(item.dayOfWeek)}
        </>
      )}

      {item.frequency === "bi-weekly" && item.dayOfWeek && (
        <>
          Second {capitalizeFirstLetter(item.dayOfWeek)}
        </>
      )}

      {item.frequency === "semi-monthly" && item.dayOfMonth && (
        <>
          {getOrdinal(item.dayOfMonth)} &
          {item.secondDayOfMonthIsLast
            ? ` ${getLastDayOfMonth(new Date())}`
            : item.secondDayOfMonth
            ? <> {getOrdinal(item.secondDayOfMonth)}</>
            : ""}
        </>
      )}

      {item.frequency === "monthly" && item.dayOfMonth && (
        <>{getOrdinal(item.dayOfMonth)}</>
      )}
    </div>
  );
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
        <div className="font-medium px-2.5 py-1 text-yellow-800 bg-yellow-500/15 rounded-full tracking-wider">
          {formatAmount(item.amount)}
        </div>
      </div>
    </div>
  );
}

