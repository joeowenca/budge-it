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