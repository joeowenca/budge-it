# Project Context: Budge-it (Personal Budget Tracker)

## 1. Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Components).
- **Language:** TypeScript (Strict mode).
- **Styling:** Tailwind CSS + Shadcn UI (Components installed in `src/components/ui`).
- **Database:** PostgreSQL (Neon) via Drizzle ORM.
- **Auth:** Clerk (@clerk/nextjs).
- **Forms:** React Hook Form + Zod validation.

## 2. Database Schema (`src/db/schema.ts`)
*Reference this file for all DB operations:*

## 3. App functionality
- **Summary** A simple budget app for tracking your income, expenses, and spending. Expenses are subtracted from Income. Expenses can also include savings and spending money.