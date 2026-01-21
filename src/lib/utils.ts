import { FrequencyType } from "@/db/schema";
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

export const getFrequencyMultiplier = (frequency: FrequencyType) => {
  switch (frequency) {
    case "weekly":
      return 4;
    case "bi-weekly":
      return 2;
    case "semi-monthly":
      return 2;
    case "monthly":
      return 1;
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
