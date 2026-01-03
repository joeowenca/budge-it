import BudgetSection from "./BudgetSection";

export default function Budget() {
  // Placeholder data - will be replaced with real data in later steps
  const incomeCategories: unknown[] = [];
  const expenseCategories: unknown[] = [];

  return (
    <div className="h-full flex flex-col p-6 border rounded-lg shadow bg-card">
      <div className="flex-none mb-4">
        <h2 className="text-xl font-semibold mb-4">Budget</h2>
      </div>

      <div className="flex-1 min-h-0">
        <div className="h-full lg:overflow-y-auto">
          <div className="space-y-6">
            <BudgetSection title="Income" items={incomeCategories} />
            <BudgetSection title="Expenses" items={expenseCategories} />
          </div>
        </div>
      </div>
    </div>
  );
}

