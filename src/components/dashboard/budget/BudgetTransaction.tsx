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

type Transaction = {
  id: number;
  label: string | null;
  amount: number;
  date: Date | string | null;
};

interface BudgetTransactionProps {
  transaction: Transaction;
}

export function BudgetTransaction({ transaction }: BudgetTransactionProps) {
  return (
    <div className="p-2 bg-background/50 rounded border text-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">{transaction.label || "No label"}</div>
          {transaction.date && (
            <div className="text-xs text-muted-foreground">
              {formatDate(transaction.date)}
            </div>
          )}
        </div>
        <div className="font-medium ml-4">
          {formatAmount(transaction.amount)}
        </div>
      </div>
    </div>
  );
}

