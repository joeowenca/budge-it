"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, transactions, transactionTypeEnum } from "@/db/schema";
import { checkUser } from "@/lib/checkUser";
import { eq, and, inArray } from "drizzle-orm";

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

export async function getBudgetTransactions() {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }

  const categoriesWithTransactions = await db.query.categories.findMany({
    where: and(
      eq(categories.userId, user.id),
      inArray(categories.type, ["income", "expense"])
    ),
    with: {
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
        },
      },
  });

  return categoriesWithTransactions;
}

export async function getCategories() {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }

  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id));

  return userCategories.map((cat) => ({
    id: cat.id,
    type: cat.type as "income" | "expense" | "purchase",
    label: cat.label,
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

