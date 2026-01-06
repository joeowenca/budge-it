import { integer, pgTable, pgEnum, serial, text, timestamp, boolean, uuid, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const budgetTypeEnum = pgEnum("budget_type", ["income", "expense", "savings"]);
export const frequencyTypeEnum = pgEnum("frequency_type", ["weekly", "bi-weekly", "semi-monthly", "monthly"]);

// DELET THIS
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense", "purchase"]);

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
  totalAmount: integer("total_amount").notNull().default(0),
  sortOrder: doublePrecision("sort_order").notNull(),
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
  sortOrder: doublePrecision("sort_order").notNull(),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
  budgetCategories: many(budgetCategories),
  budgetItems: many(budgetItems)
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

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  label: text("label").notNull(),
  color: text("color").default("#000000"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  label: text("label"),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  interval: text("interval"),
  isPaid: boolean("is_paid").default(false),
  memo: text("memo"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));