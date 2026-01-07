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

type Item = {
  id: number;
  name: string | null;
  amount: number;
  startDate: Date | string | null;
};

interface BudgetItemProps {
  item: Item;
}

export function BudgetItem({ item }: BudgetItemProps) {
  return (
    <div className="pl-2 py-1 pb-2 text-sm border-b-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {item.name || "No label"}
          </div>
          {item.startDate && (
            <div className="text-xs text-muted-foreground">
              {formatDate(item.startDate)}
            </div>
          )}
        </div>
        <div className="font-medium ml-4 px-2.5 py-1 text-yellow-900 bg-yellow-600/10 rounded-full">
          {formatAmount(item.amount)}
        </div>
      </div>
    </div>
  );
}

