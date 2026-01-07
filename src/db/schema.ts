import { integer, pgTable, pgEnum, serial, text, timestamp, boolean, uuid, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Budget Type enum
export const budgetTypeSchema = z.enum(["income", "expense", "savings"]);
export type BudgetType = z.infer<typeof budgetTypeSchema>;

// Frequency Type enum
export const frequencyTypeSchema = z.enum(["weekly", "bi-weekly", "semi-monthly", "monthly"]);
export type FrequencyType = z.infer<typeof frequencyTypeSchema>;

// Filter schemas
export const getBudgetCategoriesFilterSchema = z.object({
  type: budgetTypeSchema.optional(),
});

export const getBudgetItemsFilterSchema = z.object({
  type: budgetTypeSchema.optional(),
});

// Create Budget Category schema
export const createBudgetCategorySchema = z.object({
  type: budgetTypeSchema,
  name: z.string().min(1, "Name is required"),
  emoji: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
});

// Create Budget Item schema
export const createBudgetItemSchema = z.object({
  budgetCategoryId: z.number().int().positive(),
  type: budgetTypeSchema,
  name: z.string().min(1, "Name is required"),
  amount: z.number().int().default(0),
  frequency: frequencyTypeSchema,
  startDate: z.date(),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.string().optional(),
  secondDayOfMonth: z.string().optional(),
  sortOrder: z.number().optional(),
}).superRefine((data, ctx) => {
  const Frequency = frequencyTypeSchema.enum;

  // Rule 1: Weekly or Bi-weekly
  if (data.frequency === Frequency.weekly || data.frequency === Frequency["bi-weekly"]) {
    if (!data.dayOfWeek) {
      ctx.addIssue({
        code: "custom",
        message: "Day of the week is required for this frequency",
        path: ["dayOfWeek"],
      });
    }
  }

  // Rule 2: Monthly
  if (data.frequency === Frequency.monthly) {
    if (!data.dayOfMonth) {
      ctx.addIssue({
        code: "custom",
        message: "Day of the month is required for monthly items",
        path: ["dayOfMonth"],
      });
    }
  }

  // Rule 3: Semi-monthly
  if (data.frequency === Frequency["semi-monthly"]) {
    if (!data.dayOfMonth) {
      ctx.addIssue({
        code: "custom",
        message: "First payment day is required",
        path: ["dayOfMonth"],
      });
    }
    if (!data.secondDayOfMonth) {
      ctx.addIssue({
        code: "custom",
        message: "Second payment day is required",
        path: ["secondDayOfMonth"],
      });
    }
  }
});

export const budgetTypeEnum = pgEnum("budget_type", ["income", "expense", "savings"]);
export const frequencyTypeEnum = pgEnum("frequency_type", ["weekly", "bi-weekly", "semi-monthly", "monthly"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["spend", "save", "transfer"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  authId: uuid("auth_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  currency: text("currency").default("USD"),
  theme: text("theme").default("system"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: budgetTypeEnum("type").notNull(),
  emoji: text("emoji"),
  name: text("name").notNull(),
  color: text("color"),
  sortOrder: doublePrecision("sort_order").notNull().default(0),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  budgetCategoryId: integer("budget_caftegory_id").references(() => budgetCategories.id, { onDelete: "cascade" }).notNull(),
  type: budgetTypeEnum("type").notNull(),
  name: text("name").notNull(),
  amount: integer("amount").notNull().default(0),
  frequency: frequencyTypeEnum("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  dayOfWeek: text("day_of_week"),
  dayOfMonth: text("day_of_month"),
  secondDayOfMonth: text("second_day_of_month"),
  sortOrder: doublePrecision("sort_order").notNull().default(0),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const spendingAccounts = pgTable("spending_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  emoji: text("emoji"),
  name: text("name").notNull(),
  color: text("color"),
  balance: integer("balance").notNull().default(0),
  sortOrder: doublePrecision("sort_order").notNull(),
  pinOrder: doublePrecision("pin_order").notNull().default(0),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const spendingCategories = pgTable("spending_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  emoji: text("emoji"),
  name: text("name").notNull(),
  color: text("color"),
  sortOrder: doublePrecision("sort_order").notNull().default(0),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const spendingTransactions = pgTable("spending_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  spendingAccountId: integer("spending_account_id").references(() => spendingAccounts.id, { onDelete: "cascade" }).notNull(),
  spendingCategoryId: integer("spending_category_id").references(() => spendingCategories.id, { onDelete: "cascade" }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull().default(0),
  memo: text("memo"),
  date: timestamp("date"),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const spendingTopUps = pgTable("spending_top_ups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  spendingAccountId: integer("spending_account_id").references(() => spendingAccounts.id, { onDelete: "cascade" }).notNull(),
  spendingCategoryId: integer("spending_category_id").references(() => spendingCategories.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull().default(0),
  frequency: frequencyTypeEnum("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  dayOfWeek: text("day_of_week"),
  dayOfMonth: text("day_of_month"),
  secondDayOfMonth: text("second_day_of_month"),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const spendingTopUpOccurrences = pgTable("spending_top_up_occurences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  spendingTopUpId: integer("spending_top_up_id").references(() => spendingTopUps.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  amount: integer("amount").notNull().default(0),
  isArchived: boolean("is_archived").default(false),
  isExecuted: boolean("is_executed").default(false),
  executedAt: timestamp("executed_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  budgetCategories: many(budgetCategories),
  budgetItems: many(budgetItems),
  spendingAccounts: many(spendingAccounts),
  spendingCategories: many(spendingCategories),
  spendingTransactions: many(spendingTransactions),
  spendingTopUps: many(spendingTopUps),
  spendingTopUpOccurrences: many(spendingTopUpOccurrences)
}));

export const budgetCategoryRelations = relations(budgetCategories, ({ one, many }) => ({
  user: one(users, {
    fields: [budgetCategories.userId],
    references: [users.id],
  }),
  budgetItems: many(budgetItems)
}));

export const budgetItemRelations = relations(budgetItems, ({ one }) => ({
  user: one(users, {
    fields: [budgetItems.userId],
    references: [users.id],
  }),
  budgetCategory: one(budgetCategories, {
    fields: [budgetItems.budgetCategoryId],
    references: [budgetCategories.id]
  })
}));

export const spendingAccountRelations = relations(spendingAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [spendingAccounts.userId],
    references: [users.id],
  }),
  spendingTransactions: many(spendingTransactions)
}));

export const spendingCategoryRelations = relations(spendingCategories, ({ one, many }) => ({
  user: one(users, {
    fields: [spendingCategories.userId],
    references: [users.id],
  }),
  spendingTransactions: many(spendingTransactions)
}));

export const spendingTransactionRelations = relations(spendingTransactions, ({ one }) => ({
  user: one(users, {
    fields: [spendingTransactions.userId],
    references: [users.id],
  }),
  spendingCategory: one(spendingCategories, {
    fields: [spendingTransactions.spendingCategoryId],
    references: [spendingCategories.id]
  }),
  spendingAccount: one(spendingAccounts, {
    fields: [spendingTransactions.spendingAccountId],
    references: [spendingAccounts.id]
  })
}));

export const spendingTopUpRelations = relations(spendingTopUps, ({ one }) => ({
  user: one(users, {
    fields: [spendingTopUps.userId],
    references: [users.id],
  }),
  spendingCategory: one(spendingCategories, {
    fields: [spendingTopUps.spendingCategoryId],
    references: [spendingCategories.id]
  }),
  spendingAccount: one(spendingAccounts, {
    fields: [spendingTopUps.spendingAccountId],
    references: [spendingAccounts.id]
  })
}));

export const spendingTopUpOccurenceRelations = relations( spendingTopUpOccurrences, ({ one }) => ({
  user: one(users, {
    fields: [spendingTopUpOccurrences.userId],
    references: [users.id],
  }),
  spendingTopUp: one(spendingTopUps, {
    fields: [spendingTopUpOccurrences.spendingTopUpId],
    references: [spendingTopUps.id]
  })
}));