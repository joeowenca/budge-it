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

## Phase 2: Authentication & User Sync (Critical)
- [x] **Step 2.1**: Install & Configure Clerk.
    - Install `@clerk/nextjs`.
    - Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`.
    - Wrap `src/app/layout.tsx` in `<ClerkProvider>`.
    - Create `src/middleware.ts` to protect routes.
- [ ] **Step 2.2**: Create the "User Sync" Utility.
    - Create `src/lib/checkUser.ts`.
    - Logic: Get Clerk user -> Check DB for `clerkId` -> If missing, Insert into DB -> Return DB User Object.
- [ ] **Step 2.3**: Verify Auth.
    - Create a temporary call in `src/app/page.tsx` to `checkUser()` and log the result to ensure users are being saved to Postgres.

## Phase 3: UI Shell & Navigation
- [ ] **Step 3.1**: Initialize Shadcn UI.
    - Run `npx shadcn@latest init`.
    - Add components: `button`, `input`, `label`, `card`, `sheet` (mobile menu), `dialog`, `select`.
- [ ] **Step 3.2**: Create App Layout.
    - Create `src/components/Navbar.tsx` (or Sidebar).
    - Ensure it is responsive.
    - Add a "UserButton" from Clerk.

## Phase 4: Transactions (CRUD)
- [ ] **Step 4.1**: Create Server Actions.
    - Create `src/app/actions/addTransaction.ts`.
    - Use Zod to validate input (amount, description, date, category, type).
    - Use `checkUser()` to get the correct `userId`.
    - Revalidate path `/`.
- [ ] **Step 4.2**: Create "Add Transaction" Component.
    - Create `src/components/AddTransactionDialog.tsx`.
    - Use Shadcn Dialog + React Hook Form + Zod Resolver.
- [ ] **Step 4.3**: Create Transaction List.
    - Fetch transactions in `src/app/page.tsx` (Server Component).
    - Pass data to `src/components/TransactionList.tsx`.
    - Format currency and dates properly.
- [ ] **Step 4.4**: Delete Transaction.
    - Add `deleteTransaction` Server Action.
    - Add "Delete" button to the Transaction List rows.

## Phase 5: Dashboard Analytics
- [ ] **Step 5.1**: Backend Aggregation.
    - Create `src/app/actions/getIncomeExpense.ts`.
    - Calculate: Total Income, Total Expense, Net Balance using Drizzle SQL sum().
- [ ] **Step 5.2**: Visualizations.
    - Install `recharts`.
    - Create a Bar Chart for "Income vs Expense".
    - Create a Donut Chart for "Spending by Category".
- [ ] **Step 5.3**: Dashboard Assembly.
    - Display Summary Cards (Balance, Income, Expense) at the top.
    - Display Charts in the middle.
    - Display Recent Transactions at the bottom.

## Phase 6: Polish
- [ ] **Step 6.1**: Add "Edit Transaction" functionality.
- [ ] **Step 6.2**: Implement a "Month Picker" to filter the dashboard by date.