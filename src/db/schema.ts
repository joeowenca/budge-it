import { integer, pgTable, pgEnum, serial, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
}));

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