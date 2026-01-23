import { UpdateItemDraft, CreateItemDraft } from "@/components/dashboard/budget/BudgetCategory";
import { FrequencyType, ReadBudgetItemType } from "@/db/schema";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertAmountToCurrency(amount: number): string {
  // Amount is stored in cents, convert to dollars
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

const dayOfWeekMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const getFrequencyMultiplier = (item: UpdateItemDraft | CreateItemDraft | ReadBudgetItemType): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const lastDayOfMonth = lastOfMonth.getDate();

  const frequency: FrequencyType = item.frequency ?? "monthly";

  switch (frequency) {
    case "weekly":
    case "bi-weekly": {
      // Convert string dayOfWeek to number
      const targetDay = item.dayOfWeek
        ? dayOfWeekMap[item.dayOfWeek.toLowerCase()] ?? 0
        : firstOfMonth.getDay(); // default to first day of month
      const interval = frequency === "weekly" ? 7 : 14;

      const firstDay = firstOfMonth.getDay();
      const firstOccurrence = 1 + ((7 + targetDay - firstDay) % 7);

      let count = 0;
      for (let d = firstOccurrence; d <= lastDayOfMonth; d += interval) {
        count++;
      }

      return count;
    }

    case "semi-monthly": {
      // Use dayOfMonth and secondDayOfMonth
      const firstDayOfMonth = item.dayOfMonth ?? 1;
      const secondDayOfMonth =
        item.secondDayOfMonth ??
        Math.min(15, lastDayOfMonth); // default to 15th if not provided

      let count = 0;
      if (firstDayOfMonth <= lastDayOfMonth) count++;
      if (secondDayOfMonth <= lastDayOfMonth) count++;
      return count;
    }

    case "monthly":
    default:
      return 1;
  }
};


export function getOrdinal(n: number): string {
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

export function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function capitalizeFirstLetter(str: string): string {
  const first = str.at(0);
  return first ? first.toUpperCase() + str.slice(1) : str;
}
