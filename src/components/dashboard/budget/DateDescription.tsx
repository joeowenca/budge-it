import { ReadBudgetItemType } from "@/db/schema";
import { getOrdinal, getLastDayOfMonth } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface DateDescriptionProps {
  item: ReadBudgetItemType;
}

export function DateDescription({ item }: DateDescriptionProps) {
    const fortmatDateDescription = (str: string): string => {
      if (!str) return "";
    
      const trimmed = str.slice(0, 3);
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }

  return (
    <div className="flex text-xs font-semibold tracking-wide text-muted-foreground">
      <Calendar className="size-3.5 mt-0.25 mr-1" />
      {item.frequency === "weekly" && item.dayOfWeek && (
        <>
          {fortmatDateDescription(item.dayOfWeek)}
        </>
      )}

      {item.frequency === "bi-weekly" && item.dayOfWeek && (
        <>
          Second {fortmatDateDescription(item.dayOfWeek)}
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