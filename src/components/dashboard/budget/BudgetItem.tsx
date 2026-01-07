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

interface BudgetItemProps {
  transaction: Transaction;
  isEditing: boolean;
}

export function BudgetItem({ transaction, isEditing }: BudgetItemProps) {
  // Visual indicator for edit mode
  console.log("BudgetItem isEditing:", isEditing);
  return (
    <div className="pl-2 py-1 pb-2 text-sm border-b-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {transaction.label || "No label"}
            {isEditing && <span className="text-xs text-blue-600 ml-2">(Edit Mode)</span>}
          </div>
          {transaction.date && (
            <div className="text-xs text-muted-foreground">
              {formatDate(transaction.date)}
            </div>
          )}
        </div>
        <div className="font-medium ml-4 px-2.5 py-1 text-yellow-900 bg-yellow-600/10 rounded-full">
          {formatAmount(transaction.amount)}
        </div>
      </div>
    </div>
  );
}

