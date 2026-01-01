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

## Phase 4: Dashboard Architecture & Data Entry (Columns 1 & 3)
*Focus: Setting up the responsive grid and enabling data entry for Income (Col 1) and Expenses (Col 3).*

- [ ] **Step 4.1**: The Responsive Grid Shell.
    - Create `src/app/page.tsx` with the **3-Column Layout** for Desktop:
        - **Col 1:** Budget
        - **Col 2:** Insights
        - **Col 3:** Purchases
    -Each column should be its own component stored in `src/components` but rendered on `src/app/page.tsx`
    - Implement **Mobile View**:
        - Reduce the 3-column layout down to 1-column, where at the top of this large singular mobile view column, we have an overview with essential actions like adding purchases and displaying helpful data/information.
- [ ] **Step 4.2**: Column 3 - Purchase Log (Expenses).
    - **Backend**: Create `addTransaction` Server Action (for expenses).
    - **UI**: Create `TransactionList` component.
        - Scrollable feed of recent purchases.
        - Filter by Date / Sort by Amount.
    - **UI**: Create `AddExpenseForm` (Small inline form or Drawer).
- [ ] **Step 4.3**: Column 1 - Budget & Income Manager.
    - **Backend**: Create `addIncome` Server Action.
    - **UI**: Create `IncomeManager` Component (Top of Col 1).
        - Add Income Categories (e.g., "Salary", "Gift").
        - Log Income Events (e.g., "Sept 15 Paycheque").
    - **UI**: Create `BudgetTargets` Component (Bottom of Col 1).
        - Visual progress bars for expense categories (e.g., "Groceries: $150/$400").

## Phase 5: The "Brain" - Analytics (Column 2)
*Focus: Filling the center column with insights derived from the data in Cols 1 & 3.*

- [ ] **Step 5.1**: Data Aggregation.
    - Create `getFinancialInsights` Server Action.
    - Calculate: Total Income, Total Expenses, Net Balance.
    - Group data by Category for charts.
- [ ] **Step 5.2**: Center Column Visualizations.
    - **Pie Chart**: "Expense Breakdown" (Housing vs Food vs Fun).
    - **Bar/Area Chart**: "3-Month Trend" (Income vs Expense over time).
    - **Net Logic**: "Available to Spend" (Income - Expenses).

## Phase 6: Polish & Refinement
- [ ] **Step 6.1**: Mobile Optimization.
    - Ensure the "Quick Add" button on mobile works smoothly.
    - Check touch targets for scrolling lists.
- [ ] **Step 6.2**: Date Filtering.
    - Add a "Month Picker" to the top of the dashboard to filter all 3 columns by a specific month.
- [ ] **Step 6.3**: Empty States.
    - Design friendly "No transactions yet" states for the columns.