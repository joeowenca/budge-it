"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, transactions, transactionTypeEnum } from "@/db/schema";
import { checkUser } from "@/lib/checkUser";
import { eq, and, inArray, desc, gte, lte } from "drizzle-orm";

const addTransactionSchema = z.object({
  amount: z.number().positive().transform((val) => Math.round(val * 100)),
  label: z.string().min(1),
  categoryLabel: z.string().min(1),
  type: z.enum(transactionTypeEnum.enumValues),
  date: z.date(),
});

export async function addTransaction(input: z.infer<typeof addTransactionSchema>) {
  const validatedInput = addTransactionSchema.parse(input);

  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }

  const existingCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, user.id),
        eq(categories.label, validatedInput.categoryLabel),
        eq(categories.type, validatedInput.type)
      )
    )
    .limit(1);

  const existingCategory = existingCategories[0];

  let categoryId: number;

  if (existingCategory) {
    categoryId = existingCategory.id;
  } else {
    const newCategory = await db
      .insert(categories)
      .values({
        userId: user.id,
        label: validatedInput.categoryLabel,
        type: validatedInput.type,
      })
      .returning();

    categoryId = newCategory[0].id;
  }

  await db.insert(transactions).values({
    userId: user.id,
    categoryId: categoryId,
    type: validatedInput.type,
    label: validatedInput.label,
    amount: validatedInput.amount,
    date: validatedInput.date,
  });

  revalidatePath("/");
}

export type GetCategoriesOptions = {
  type?: "income" | "expense" | "purchase";
};

export async function getCategories(options?: GetCategoriesOptions) {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }

  const conditions = [eq(categories.userId, user.id)];
  
  if (options?.type) {
    conditions.push(eq(categories.type, options.type));
  }

  const userCategories = await db
    .select()
    .from(categories)
    .where(and(...conditions));

  return userCategories.map((cat) => ({
    id: cat.id,
    type: cat.type as "income" | "expense" | "purchase",
    label: cat.label,
  }));
}

export type GetTransactionsOptions = {
  type?: "income" | "expense" | "purchase";
  categoryId?: number;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
};

export async function getTransactions(options?: GetTransactionsOptions) {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }

  const conditions = [eq(transactions.userId, user.id)];

  if (options?.type) {
    conditions.push(eq(transactions.type, options.type));
  }

  if (options?.categoryId) {
    conditions.push(eq(transactions.categoryId, options.categoryId));
  }

  if (options?.dateRange?.start || options?.dateRange?.end) {
    if (options.dateRange.start) {
      conditions.push(gte(transactions.date, options.dateRange.start));
    }
    if (options.dateRange.end) {
      conditions.push(lte(transactions.date, options.dateRange.end));
    }
  }

  const userTransactions = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date));

  return userTransactions.map((tx) => ({
    id: tx.id,
    userId: tx.userId,
    categoryId: tx.categoryId,
    type: tx.type as "income" | "expense" | "purchase",
    label: tx.label,
    amount: tx.amount,
    date: tx.date,
    isRecurring: tx.isRecurring,
    interval: tx.interval,
    isPaid: tx.isPaid,
    memo: tx.memo,
    isArchived: tx.isArchived,
    createdAt: tx.createdAt,
  }));
}

const addCategorySchema = z.object({
  label: z.string().min(1),
  type: z.enum(transactionTypeEnum.enumValues),
});

export async function addCategory(input: z.infer<typeof addCategorySchema>) {
  const validatedInput = addCategorySchema.parse(input);

  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }

  // Check if category already exists
  const existingCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, user.id),
        eq(categories.label, validatedInput.label),
        eq(categories.type, validatedInput.type)
      )
    )
    .limit(1);

  if (existingCategories.length > 0) {
    // Category already exists, return it
    return {
      id: existingCategories[0].id,
      type: existingCategories[0].type as "income" | "expense" | "purchase",
      label: existingCategories[0].label,
    };
  }

  // Create new category
  const newCategory = await db
    .insert(categories)
    .values({
      userId: user.id,
      label: validatedInput.label,
      type: validatedInput.type,
    })
    .returning();

  return {
    id: newCategory[0].id,
    type: newCategory[0].type as "income" | "expense" | "purchase",
    label: newCategory[0].label,
  };
}

