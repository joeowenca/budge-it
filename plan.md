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

- [x] **Step 5.2**: UI - The "Add Transaction" Dialog.
    - Create `src/components/dashboard/AddTransactionDialog.tsx`.
    - Features:
        - **Tabs** 3 tabs in this order to create the following items: Purchase, Expense, Income
            - **Purchase tab** 
                -Has the following fields:
                    - Category (Combobox: Select existing category with the type "purchase" or create a new category with the type "purchase")
                    - Amount
                    - Date
                    - Memo
                - Used to create a transaction with the type "Purchase" under the selected category
            - **Expense tab** 
                - Has the following fields:
                    - Category (Combobox: Select existing category with the type "expense" or create a new category with the type "expense")
                    - Label
                    - Amount
                    - (No date field yet, will just consider all expenses as monthly)
            - **Income tab** has the following fields:
                - Has the following fields:
                    - Category (Combobox: Select existing category with the type "income" or create a new category with the type "income")
                    - Label
                    - Amount
                    - (No date field yet, will just consider all income as monthly)
        - **Add button** a button at the bottom of the dialog to create the transaction and/or category based on the tab selected and fields completed.
    - Connect to `addTransaction` action.

- [ ] **Step 5.3**: UI - Budget Column Container.
    - [x] **Step 5.3.1** Refactor `src/components/dashboard/Budget.tsx` to remove the 20 placeholder items, and add two new sections:
        - `<BudgetSection title="Income" categories={incomeCategories} />`
        - `<BudgetSection title="Expenses" categories={expenseCategories} />`
    - [x] **Step 5.3.2** Refactor `transactionActions.ts` to have the following functions:
        - addTransaction (already exists)
        - addCategory (already exists)
        - getTransactions (contains filter options for type, categoryId, and dateRange)
        - getCategories (contains a filter option for type)
        - remove getBudgetCategories
    - [x] **Step 5.3.3** Fetch data for the Income and Expense BudgetSection components using `getCategories` (filter for the types Income and Expense to display the correct categories for each section), then within each category, fetch the transactions for each category using `getTransactions` and filtering the results for the corresponding categoryId and type and render them under that category

- [x] **Step 5.4**: UI - collapsible categories
    - Ability to collapse a category so no transactions within the category are visible
    - A collapsed category looks like "CategoryName >    $1234.56" where it's just the category name, a chevron pointing right, and the total amount on the right-side of the line item. 
    - An expanded category looks like "CategoryName v        " where it's just the category name, a chevron point down, and no total amount. Instead, the total is calculated at the bottom below all transactions like a tally sheet.

- [x] **Step 5.5**: UI - Authentication Page (`src/app/login/page.tsx`)
    - **UI Layout:**
        - Create a centered layout using a Shadcn `Card` component.
        - Use Shadcn `Tabs` to toggle between "Log In" and "Sign Up" modes.
        - Follow the styling patterns used throughout the app so far
    - **Forms:**
        - Implement `react-hook-form` with `zod` schema validation.
        - **Fields:** Email (valid email format) and Password (min 8 chars, one capital, one number, one special character).
        - **Feedback:** Show inline validation errors and a general error alert if the server action fails.
        - **Loading:** specific `isSubmitting` state on buttons (e.g., "Signing in...").
    - **Integration:**
        - Connect forms to `login` and `signup` actions from `src/app/actions/auth.ts`.
        - Handle successful redirects (handled by server action, but ensure client cleans up state).
- [x] **Step 5.6** Create Budget server actions (`/src/app/actions/budgetActions.ts`)
    - **Action 1** Get all budget categories `getBudgetCategories`
        - Checks that the user is signed in
        - Retrieves all budget categories for the user
        - Accepts options for filtering, like only retrieve the budget categories that have the specified type. See the type definition in `/src/db/schema.ts` in the enum `budgetTypeEnum`.
    - **Action 2** Get all budget items `getBudgetItems`
        - Checks that the user is signed in
        - Retrieves all budget items for the user
        - Accepts options for filtering, like only retrieve the budget items that have the specified type. See the type definition in `/src/db/schema.ts` in the enum `budgetTypeEnum`.
    - **Action 3** Create budget category `createBudgetCategory`
        - Checks that the user is signed in 
        - Checks if that budget category already exists based on userId, type, and name. If those 3 fields match another category, then it already exists. We should return that category.
        - If this budget category doesn't exist, create a new budget category with the following fields based on the budgetCateories schema found in `/src/db/schema.ts`
    - **Action 4** Create budget item `createBudgetItem`
        - Checks that the user is signed in 
        - Create a new budget item with the following fields based on the budgetItems schema found in `/src/db/schema.ts`