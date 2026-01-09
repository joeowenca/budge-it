import { Item } from "./BudgetCategory";

function formatAmount(amount: number): string {
  // Amount is stored in cents, convert to dollars
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
}

interface BudgetItemProps {
  item: Item;
  isEditing: boolean;
}

function getOrdinal(n: number): string {
  if (n < 1 || n > 31) return String(n); // just in case
  if (n >= 11 && n <= 13) return n + "th"; // special case for teens
  const lastDigit = n % 10;
  switch (lastDigit) {
    case 1:
      return n + "st";
    case 2:
      return n + "nd";
    case 3:
      return n + "rd";
    default:
      return n + "th";
  }
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function BudgetItem({ item, isEditing = false }: BudgetItemProps) {
  return (
    <div className="pl-2 py-1 pb-2 text-sm border-b-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {item.name || "No label"}
          </div>
          {item.frequency === "weekly" && item.dayOfWeek && (
            <div className="text-xs text-muted-foreground">
              Every <b>{capitalizeFirstLetter(item.dayOfWeek)}</b>
            </div>
          )}

          {item.frequency === "bi-weekly" && item.dayOfWeek && (
            <div className="text-xs text-muted-foreground">
              Every second <b>{capitalizeFirstLetter(item.dayOfWeek)}</b>
            </div>
          )}

          {item.frequency === "semi-monthly" && item.dayOfMonth && (
            <div className="text-xs text-muted-foreground">
              Every <b>{getOrdinal(item.dayOfMonth)}</b>
              {item.secondDayOfMonthIsLast
                ? " and last day of the month"
                : item.secondDayOfMonth
                ? <> and <b>{getOrdinal(item.secondDayOfMonth)}</b></>
                : ""}
            </div>
          )}

          {item.frequency === "monthly" && item.dayOfMonth && (
            <div className="text-xs text-muted-foreground">
              Every <b>{getOrdinal(item.dayOfMonth)}</b>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground tracking-[0.2em] ml-4 mr-1">
            {item.frequency === "weekly" && "4x"}
            {item.frequency === "bi-weekly" && "2x"}
            {item.frequency === "semi-monthly" && "2x"}
          </span>
        <div className="font-medium px-2.5 py-1 text-yellow-900 bg-yellow-600/10 rounded-full tracking-wider">
          {formatAmount(item.amount)}
        </div>
      </div>
    </div>
  );
}

