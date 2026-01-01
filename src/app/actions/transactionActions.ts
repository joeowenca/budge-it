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
  // Validate inputs
  const validatedInput = addTransactionSchema.parse(input);

  // Check authentication
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }

  // Category Logic (Upsert)
  // Check if a category exists for this user with the same label and type
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
    // If Yes: Use its ID
    categoryId = existingCategory.id;
  } else {
    // If No: Insert a new category and use the new ID
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

  // Transaction Logic: Insert the transaction with the resolved categoryId
  await db.insert(transactions).values({
    userId: user.id,
    categoryId: categoryId,
    type: validatedInput.type,
    label: validatedInput.label,
    amount: validatedInput.amount,
    date: validatedInput.date,
  });

  // Refresh: Call revalidatePath('/') at the end
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

