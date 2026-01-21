import { integer, pgTable, pgEnum, serial, text, timestamp, boolean, uuid, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const budgetTypeEnum = pgEnum("budget_type", [
  "income", 
  "expense", 
  "savings"
]);

export const frequencyTypeEnum = pgEnum("frequency_type", [
  "weekly", 
  "bi-weekly", 
  "semi-monthly", 
  "monthly"
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "spend", 
  "save", 
  "transfer"
]);

export const dayOfWeekTypeEnum = pgEnum("day_of_week_type", [
  "monday", 
  "tuesday", 
  "wednesday", 
  "thursday", 
  "friday", 
  "saturday", 
  "sunday"
]);

// Budget Type enum
export const budgetTypeSchema = z.enum(["income", "expense", "savings"]);
export type BudgetType = z.infer<typeof budgetTypeSchema>;

// Frequency Type enum
export const frequencyTypeSchema = z.enum(["weekly", "bi-weekly", "semi-monthly", "monthly"]);
export type FrequencyType = z.infer<typeof frequencyTypeSchema>;

// Day of Week Type enum
export const dayOfWeekTypeSchema = z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
export type DayOfWeekType = z.infer<typeof dayOfWeekTypeSchema>;

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

export const createBudgetItemSchema = z
  .object({
    budgetCategoryId: z.number().int().positive(),
    type: budgetTypeSchema,
    name: z.string().min(1, "Name is required"),
    amount: z.number().int().default(0),
    frequency: frequencyTypeSchema,
    startDate: z.date(),

    dayOfWeek: dayOfWeekTypeSchema.nullable().optional(),

    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    dayOfMonthIsLast: z.boolean().default(false),

    secondDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    secondDayOfMonthIsLast: z.boolean().default(false),

    sortOrder: z.number(),
    isArchived: z.boolean().default(false)
  })
  .superRefine((data, ctx) => {
    const F = frequencyTypeSchema.enum;

    /* Weekly / Bi-weekly */
    if (data.frequency === F.weekly || data.frequency === F["bi-weekly"]) {
      if (!data.dayOfWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfWeek"],
          message: "Day of the week is required for this frequency",
        });
      }
    }

    /* Monthly */
    if (data.frequency === F.monthly) {
      if (!data.dayOfMonthIsLast && data.dayOfMonth == null) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfMonth"],
          message: "Day of the month is required unless using last day",
        });
      }
    }

    /* Semi-monthly */
    if (data.frequency === F["semi-monthly"]) {
      if (!data.dayOfMonthIsLast && data.dayOfMonth == null) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfMonth"],
          message: "First payment day is required",
        });
      }

      if (!data.secondDayOfMonthIsLast && data.secondDayOfMonth == null) {
        ctx.addIssue({
          code: "custom",
          path: ["secondDayOfMonth"],
          message: "Second payment day is required",
        });
      }

      // Ordering rule
      if (
        !data.dayOfMonthIsLast &&
        !data.secondDayOfMonthIsLast &&
        data.dayOfMonth != null &&
        data.secondDayOfMonth != null &&
        data.secondDayOfMonth <= data.dayOfMonth
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["secondDayOfMonth"],
          message: "Second payment day must be after the first",
        });
      }
    }
  });

export const budgetItemSchema = createBudgetItemSchema.extend({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
  archivedAt: z.date().nullable(),
});

export type CreateBudgetItemType = z.infer<typeof createBudgetItemSchema>;
export type ReadBudgetItemType = z.infer<typeof budgetItemSchema>;


// Update Budget Category schema
export const updateBudgetCategorySchema = z.object({
  id: z.number().int().positive(),
  emoji: z.string().optional(),
  name: z.string().min(1, "Name is required").optional(),
  sortOrder: z.number().optional(),
  isArchived: z.boolean().optional(),
});

// Update Budget Item schema
export const updateBudgetItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Name is required").optional(),
  amount: z.number().int().optional(),
  frequency: frequencyTypeSchema.optional(),
  startDate: z.date().optional(), 
  dayOfWeek: dayOfWeekTypeSchema.nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  dayOfMonthIsLast: z.boolean().optional(),
  secondDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  secondDayOfMonthIsLast: z.boolean().optional(),
  sortOrder: z.number().optional(),
  isArchived: z.boolean().optional(),
});


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
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  dayOfWeek: dayOfWeekTypeEnum("day_of_week"),
  dayOfMonth: integer("day_of_month"),
  dayOfMonthIsLast: boolean("day_of_month_is_last").notNull().default(false),
  secondDayOfMonth: integer("second_day_of_month"),
  secondDayOfMonthIsLast: boolean("second_day_of_month_is_last").notNull().default(false),
  sortOrder: doublePrecision("sort_order").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const spendingCategories = pgTable("spending_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  emoji: text("emoji"),
  name: text("name").notNull(),
  color: text("color"),
  sortOrder: doublePrecision("sort_order").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  dayOfWeek: dayOfWeekTypeEnum("day_of_week"),
  dayOfMonth: integer("day_of_month"),
  dayOfMonthIsLast: boolean("day_of_month_is_last").notNull().default(false),
  secondDayOfMonth: integer("second_day_of_month"),
  secondDayOfMonthIsLast: boolean("second_day_of_month_is_last").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const spendingTopUpOccurrences = pgTable("spending_top_up_occurences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  spendingTopUpId: integer("spending_top_up_id").references(() => spendingTopUps.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  amount: integer("amount").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  isExecuted: boolean("is_executed").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  executedAt: timestamp("executed_at"),
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