import BudgetSection from "./BudgetSection";
import { getBudgetCategories, getBudgetItems } from "@/app/actions/budgetActions";

type Category = NonNullable<Awaited<ReturnType<typeof getBudgetCategories>>["data"]>[number];
type BudgetItem = NonNullable<Awaited<ReturnType<typeof getBudgetItems>>["data"]>[number];

export interface CategoryWithBudgetItems extends Category {
  budgetItems: BudgetItem[];
}

export default async function Budget() {
  // 1. Fetch the raw responses (which are objects: { success, data, error })
  const incomeCategoriesRes = await getBudgetCategories({ type: "income" });
  const expenseCategoriesRes = await getBudgetCategories({ type: "expense" });
  const savingsCategoriesRes = await getBudgetCategories({ type: "savings" });

  const incomeItemsRes = await getBudgetItems({ type: "income" });
  const expenseItemsRes = await getBudgetItems({ type: "expense" });
  const savingsItemsRes = await getBudgetItems({ type: "savings" });

  // 2. Extract the data arrays safely (defaulting to [] if something failed)
  const incomeCategories = incomeCategoriesRes.data || [];
  const expenseCategories = expenseCategoriesRes.data || [];
  const savingsCategories = savingsCategoriesRes.data || [];

  const incomeItems = incomeItemsRes.data || [];
  const expenseItems = expenseItemsRes.data || [];
  const savingsItems = savingsItemsRes.data || [];

  // 3. Now .reduce will work because incomeItems is guaranteed to be an array
  const incomeItemsByCategoryId = incomeItems.reduce(
    (acc: any, item: any) => {
      // Note: You might need to update "item.categoryId" to match your DB schema 
      // (Your schema seems to use "budgetCategoryId" based on previous files)
      const catId = item.budgetCategoryId; 
      
      if (!acc[catId]) {
        acc[catId] = [];
      }
      acc[catId].push(item);
      return acc;
    },
    {} as Record<number, typeof incomeItems>
  );

  const expenseItemsByCategoryId = expenseItems.reduce(
    (acc: any, item: any) => {
      const catId = item.budgetCategoryId;
      if (!acc[catId]) {
        acc[catId] = [];
      }
      acc[catId].push(item);
      return acc;
    },
    {} as Record<number, typeof expenseItems>
  );

  const savingsItemsByCategoryId = savingsItems.reduce(
    (acc: any, item: any) => {
      const catId = item.budgetCategoryId;
      if (!acc[catId]) {
        acc[catId] = [];
      }
      acc[catId].push(item);
      return acc;
    },
    {} as Record<number, typeof savingsItems>
  );

  // Combine categories with their items
  const incomeCategoriesWithBudgetItems = incomeCategories.map((category: any) => ({
    ...category,
    budgetItems: incomeItemsByCategoryId[category.id] || [],
  }));

  const expenseCategoriesWithBudgetItems = expenseCategories.map((category: any) => ({
    ...category,
    budgetItems: expenseItemsByCategoryId[category.id] || [],
  }));

  const savingsCategoriesWithBudgetItems = savingsCategories.map((category: any) => ({
    ...category,
    budgetItems: savingsItemsByCategoryId[category.id] || [],
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-3xl font-black">Budget</h2>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="h-full lg:overflow-y-auto px-5 pb-5">
          <div className="space-y-6">
            <BudgetSection title="Income" categories={incomeCategoriesWithBudgetItems} budgetType="income" />
            <BudgetSection title="Expenses" categories={expenseCategoriesWithBudgetItems} budgetType="expense" />
            <BudgetSection title="Savings" categories={savingsCategoriesWithBudgetItems} budgetType="savings" />
          </div>
        </div>
      </div>
    </div>
  );
}