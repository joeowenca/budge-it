# Implementation Plan - Personal Budget Tracker

## Phase 1: Foundation & Database
- [x] **Step 1.1**: Initialize project & install dependencies.
    - Install: `drizzle-orm`, `@neondatabase/serverless`, `dotenv`, `zod`.
    - Install Dev: `drizzle-kit`.
    - **Config**: Enable `{ reactCompiler: true }` in `next.config.ts`.
- [x] **Step 1.2**: Set up Database Client.
    - Create `src/db/drizzle.ts` using `@neondatabase/serverless`.
    - Configure `.env.local` with `DATABASE_URL`.
- [x] **Step 1.3**: Define Schema in `src/db/schema.ts`.
    - `users`: (id, clerkId, email, name, createdAt).
    - `transactions`: (id, amount, description, date, category, type['income', 'expense'], userId, createdAt).
    - `budgets`: (id, category, limit, period, userId).
    - Ensure correct Foreign Key relationships (transactions.userId -> users.id).
- [x] **Step 1.4**: Generate and Push Migrations.
    - Run `npx drizzle-kit generate` and `npx drizzle-kit push`.

## Phase 2: Authentication & User Sync
- [x] **Step 2.1**: Install & Configure Clerk.
    - Install `@clerk/nextjs`.
    - Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`.
    - Wrap `src/app/layout.tsx` in `<ClerkProvider>`.
    - Create `src/middleware.ts` to protect routes.
- [x] **Step 2.2**: Create the "User Sync" Utility.
    - Create `src/lib/checkUser.ts`.
    - Logic: Get Clerk user -> Check DB for `clerkId` -> If missing, Insert into DB -> Return DB User Object.
- [x] **Step 2.3**: Verify Auth & DB Sync.
    - Create a temporary call in `src/app/page.tsx` to `checkUser()` and log the result to ensure users are being saved to Postgres.

## Phase 3: UI Shell & Navigation
- [x] **Step 3.1**: Initialize Shadcn UI.
    - Run `npx shadcn@latest init`.
    - Add components: `button`, `input`, `label`, `card`, `sheet` (mobile menu), `dialog`, `select`.
- [x] **Step 3.2**: Create App Navbar.
    - Create `src/components/Navbar.tsx` (or Sidebar).
    - Ensure it is responsive.
    - Add a "UserButton" from Clerk.

## Phase 4: Create a responsive layout

- [x] **Step 4.1**: The Responsive Grid Shell.
    - Create `src/app/page.tsx` with the **3-Column Layout** for Desktop:
        - **Col 1:** Budget
        - **Col 2:** Insights
        - **Col 3:** Spending
    -Each column should be its own component stored in `src/components` but rendered on `src/app/page.tsx`
    -Each component/column should have a title, like "Budget", "Insights", and "Spending"
    -There should be a 4th component that spans along the entire top of the page, below the Navbar, and above the 3 columns. This is going to be an overview component.
- [x] **Step 4.2**: Make the layout responsive with a mobile view
    - Reduce the 3-column layout down to 1-column, all components are sorted vertically and you can scroll down them. The top will be the Overview component, then Insights, then Spending, then Budget.

## Phase 5: Budget Component & Transaction Management
*Focus: Turning the "Budget" column into a functional manager using Relational Data.*

- [x] **Step 5.1**: Backend - Database Relations & Actions.
    - **Update Schema**: Edit `src/db/schema.ts` to add `relations`.
        - Define `usersRelations` (one-to-many transactions, one-to-many categories).
        - Define `categoriesRelations` (one-to-many transactions).
        - Define `transactionsRelations` (one-to-one category).
    - Create `src/app/actions/transactionActions.ts`.
    - **Action 1**: `addTransaction(data)`.
        - Logic: Upsert Category (Find existing or Create new) -> Insert Transaction with `categoryId`.
    - **Action 2**: `getBudgetTransactions()`.
        - Query: `db.query.categories.findMany` matching the userId.
        - Options: `with: { transactions: { orderBy: (t, { desc }) => [desc(t.date)] } }`.
        - Result: Returns Categories with their Transactions nested inside, sorted by newest first.

- [ ] **Step 5.2**: UI - The "Add Transaction" Dialog.
    - Create `src/components/dashboard/AddTransactionDialog.tsx`.
    - Features:
        - **Type Toggle**: Income vs Expense.
        - **Category Input**: Combobox (Select existing OR type new).
        - **Fields**: Amount, Label, Date.
    - Connect to `addTransaction` action.

- [ ] **Step 5.3**: UI - Budget Column Container.
    - Refactor `src/components/dashboard/Budget.tsx`.
    - Fetch data using `getBudgetTransactions`.
    - Separate data into `incomeCategories` and `expenseCategories`.
    - Render two sections:
        - `<BudgetSection title="Income" categories={incomeCategories} />`
        - `<BudgetSection title="Expenses" categories={expenseCategories} />`

- [ ] **Step 5.4**: UI - Recursive Display Components.
    - Create `BudgetSection.tsx` and `CategoryItem.tsx`.
    - **UI Pattern**:
        - **Category Header**: Shows Label (e.g., "Housing") + Total Amount (Sum of transactions).
        - **Accordion/List**: Shows individual transactions (Label | Date | Amount).

## Phase 6: The "Brain" - Analytics (Column 2)
*Focus: Filling the center column with insights derived from the data in Cols 1 & 3.*

- [ ] **Step 6.1**: Data Aggregation.
    - Create `getFinancialInsights` Server Action.
    - Calculate: Total Income, Total Expenses, Net Balance.
    - Group data by Category for charts.
- [ ] **Step 6.2**: Center Column Visualizations.
    - **Pie Chart**: "Expense Breakdown" (Housing vs Food vs Fun).
    - **Bar/Area Chart**: "3-Month Trend" (Income vs Expense over time).
    - **Net Logic**: "Available to Spend" (Income - Expenses).

## Phase 7: Polish & Refinement
- [ ] **Step 7.1**: Mobile Optimization.
    - Ensure the "Quick Add" button on mobile works smoothly.
    - Check touch targets for scrolling lists.
- [ ] **Step 7.2**: Date Filtering.
    - Add a "Month Picker" to the top of the dashboard to filter all 3 columns by a specific month.
- [ ] **Step 7.3**: Empty States.
    - Design friendly "No transactions yet" states for the columns.