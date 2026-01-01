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
import { integer, pgTable, serial, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  currency: text("currency").default("USD"),
  theme: text("theme").default("system"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  color: text("color").default("#000000"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  type: text("type").notNull(),
  label: text("label"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  interval: text("interval"),
  isPaid: boolean("is_paid").default(false),
  memo: text("memo"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```