import BudgetSection from "./BudgetSection";
import { getCategories, getTransactions } from "@/app/actions/transactionActions";

export default async function Budget() {
  // Fetch categories for each section
  const incomeCategories = await getCategories({ type: "income" });
  const expenseCategories = await getCategories({ type: "expense" });

  // Fetch all transactions for each type (to avoid N+1 queries)
  const incomeTransactions = await getTransactions({ type: "income" });
  const expenseTransactions = await getTransactions({ type: "expense" });

  // Group transactions by categoryId
  const incomeTransactionsByCategory = incomeTransactions.reduce(
    (acc, transaction) => {
      if (!acc[transaction.categoryId]) {
        acc[transaction.categoryId] = [];
      }
      acc[transaction.categoryId].push(transaction);
      return acc;
    },
    {} as Record<number, typeof incomeTransactions>
  );

  const expenseTransactionsByCategory = expenseTransactions.reduce(
    (acc, transaction) => {
      if (!acc[transaction.categoryId]) {
        acc[transaction.categoryId] = [];
      }
      acc[transaction.categoryId].push(transaction);
      return acc;
    },
    {} as Record<number, typeof expenseTransactions>
  );

  // Combine categories with their transactions
  const incomeCategoriesWithTransactions = incomeCategories.map((category) => ({
    ...category,
    transactions: incomeTransactionsByCategory[category.id] || [],
  }));

  const expenseCategoriesWithTransactions = expenseCategories.map((category) => ({
    ...category,
    transactions: expenseTransactionsByCategory[category.id] || [],
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none">
        <h2 className="text-3xl font-black p-5">Budget</h2>
      </div>

      <div className="flex-1 min-h-0">
        <div className="h-full lg:overflow-y-auto px-5 pb-5">
          <div className="space-y-6">
            <BudgetSection title="Income" categories={incomeCategoriesWithTransactions} />
            <BudgetSection title="Expenses" categories={expenseCategoriesWithTransactions} />
          </div>
        </div>
      </div>
    </div>
  );
}

