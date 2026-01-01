# Project Context: Budge-it (Personal Budget Tracker)

## 1. Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Components).
- **Language:** TypeScript (Strict mode).
- **Styling:** Tailwind CSS + Shadcn UI (Components installed in `src/components/ui`).
- **Database:** PostgreSQL (Neon) via Drizzle ORM.
- **Auth:** Clerk (@clerk/nextjs).
- **Forms:** React Hook Form + Zod validation.

## 2. Database Schema (`src/db/schema.ts`)
*Reference this for all DB operations:*

```typescript
import { pgTable, text, timestamp, integer, uuid, decimal, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  category: text("category").notNull(), // e.g., "Groceries", "Rent"
  type: text("type").notNull(), // 'income' or 'expense'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  category: text("category").notNull(),
  limit: decimal("limit", { precision: 10, scale: 2 }).notNull(),
  period: text("period").default("monthly"), // 'monthly', 'weekly'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## 3. UI/UX Vision (The "Command Center" Layout)
The app dashboard (`src/app/page.tsx`) follows a strict responsive layout:

### Desktop View (3-Column Grid)
- **Column 1 (Left - 25%): "Budget & Income"**
    - Top: Income Manager (Add/View Income sources).
    - Bottom: Budget Targets (Progress bars for Expense categories).
- **Column 2 (Center - 45%): "Analytics Brain"**
    - The visual center. Charts (Pie/Bar) and Aggregated Totals.
- **Column 3 (Right - 30%): "Purchase Log"**
    - Quick "Add Expense" form.
    - Scrollable list of recent transactions.

### Mobile View (Single Column Stack)
1. **Top Card (Mobile Only):** "Quick Overview" (Available to Spend + Big "+" Button).
2. Stacked Order: Analytics -> Budget -> Transaction Log.

---

## 4. Implementation Plan (Checklist)

### Phase 4: Dashboard Architecture & Data Entry
*Focus: Setting up the responsive grid and enabling data entry for Income (Col 1) and Expenses (Col 3).*

- [ ] **Step 4.1: The Responsive Grid Shell.**
    - Update `src/app/page.tsx`.
    - Implement the `grid-cols-[25%_45%_30%]` layout for desktop.
    - Implement the `flex-col` layout for mobile with the specific "Mobile Overview Card".
- [ ] **Step 4.2: Column 3 - Purchase Log (Expenses).**
    - **Backend:** Create `src/app/actions/addTransaction.ts` (Zod validation, Clerk auth check).
    - **UI:** Create `TransactionList.tsx` (Scrollable feed, date grouping).
    - **UI:** Create `AddTransactionForm.tsx` (Use Shadcn Dialog or inline form).
- [ ] **Step 4.3: Column 1 - Budget & Income Manager.**
    - **Backend:** Create `addIncome` Server Action (Re-use transaction table, type='income').
    - **UI:** Create `IncomeManager.tsx` (List income sources).
    - **UI:** Create `BudgetTargets.tsx` (Visual progress bars).

### Phase 5: The "Brain" - Analytics (Column 2)
*Focus: Filling the center column with insights derived from the data.*

- [ ] **Step 5.1: Data Aggregation.**
    - Create `src/app/actions/getDashboardData.ts`.
    - Logic: SQL `SUM()` queries via Drizzle to get Income vs Expenses, and group by Category.
- [ ] **Step 5.2: Visualizations.**
    - Install Recharts (`npm install recharts`).
    - Build `ExpensePieChart.tsx` and `TrendBarChart.tsx`.
    - Assemble them into the center column.

### Phase 6: Polish
- [ ] **Step 6.1: Date Filte# .cursorrules

You are an expert Senior Next.js Developer.

1.  **Atomic Changes**: You must ONLY implement the specific step requested. Do not refactor unrelated files.
2.  **Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Drizzle ORM (PostgreSQL), Server Actions.
3.  **Styling**: Use "lucide-react" for icons. Use `npx shadcn@latest add [component]` for UI components.
4.  **Data Fetching**: Use Server Components for fetching and Server Actions for mutations. Avoid `useEffect` for data fetching.
5.  **Validation**: Use Zod for all schema validation.
6.  **File Structure**:
    - /app (Routes & Pages)
    - /components (React Components)
    - /db (Database Config & Schema)
    - /lib (Utilities & Server Actions)ring.** (Add Month Picker to Navbar/Dashboard top).
- [ ] **Step 6.2: Empty States.** (Friendly UI when no data exists).