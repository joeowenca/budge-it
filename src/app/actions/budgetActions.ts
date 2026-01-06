"use server";

import { db } from "@/db";
import { budgetCategories, budgetItems } from "@/db/schema";
import { checkUser } from "@/lib/checkUser";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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

// Response type
type ActionResult<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all budget categories for the current user
 * @param filter - Optional filter object with type
 */
export async function getBudgetCategories(
  filter?: z.infer<typeof getBudgetCategoriesFilterSchema>
): Promise<ActionResult> {
  try {
    // Check authentication
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate filter if provided
    if (filter) {
      const validationResult = getBudgetCategoriesFilterSchema.safeParse(filter);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.issues[0]?.message || "Invalid filter",
        };
      }
      filter = validationResult.data;
    }

    // Build query conditions
    const conditions = [eq(budgetCategories.userId, user.id)];
    if (filter?.type) {
      conditions.push(eq(budgetCategories.type, filter.type));
    }

    // Query database
    const categories = await db.query.budgetCategories.findMany({
      where: and(...conditions),
      orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch budget categories",
    };
  }
}

/**
 * Get all budget items for the current user
 * @param filter - Optional filter object with type
 */
export async function getBudgetItems(
  filter?: z.infer<typeof getBudgetItemsFilterSchema>
): Promise<ActionResult> {
  try {
    // Check authentication
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate filter if provided
    if (filter) {
      const validationResult = getBudgetItemsFilterSchema.safeParse(filter);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.issues[0]?.message || "Invalid filter",
        };
      }
      filter = validationResult.data;
    }

    // Build query conditions
    const conditions = [eq(budgetItems.userId, user.id)];
    if (filter?.type) {
      conditions.push(eq(budgetItems.type, filter.type));
    }

    // Query database
    const items = await db.query.budgetItems.findMany({
      where: and(...conditions),
      orderBy: (items, { asc }) => [asc(items.sortOrder)],
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching budget items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch budget items",
    };
  }
}

/**
 * Create a new budget category (with idempotency check)
 * @param data - Budget category data
 */
export async function createBudgetCategory(
  data: z.infer<typeof createBudgetCategorySchema>
): Promise<ActionResult> {
  try {
    // Check authentication
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validationResult = createBudgetCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Invalid input",
      };
    }

    const validatedData = validationResult.data;

    // Idempotency check: Check if category already exists
    const existingCategory = await db.query.budgetCategories.findFirst({
      where: and(
        eq(budgetCategories.userId, user.id),
        eq(budgetCategories.type, validatedData.type),
        eq(budgetCategories.name, validatedData.name)
      ),
    });

    if (existingCategory) {
      return { success: true, data: existingCategory };
    }

    // Create new category
    const [newCategory] = await db
      .insert(budgetCategories)
      .values({
        userId: user.id,
        type: validatedData.type,
        name: validatedData.name,
        emoji: validatedData.emoji,
        color: validatedData.color,
        sortOrder: validatedData.sortOrder ?? 0,
      })
      .returning();

    revalidatePath("/budget");

    return { success: true, data: newCategory };
  } catch (error) {
    console.error("Error creating budget category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create budget category",
    };
  }
}

/**
 * Create a new budget item
 * @param data - Budget item data
 */
export async function createBudgetItem(
  data: z.infer<typeof createBudgetItemSchema>
): Promise<ActionResult> {
  try {
    // Check authentication
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validationResult = createBudgetItemSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Invalid input",
      };
    }

    const validatedData = validationResult.data;

    // Verify that the budget category exists and belongs to the user
    const category = await db.query.budgetCategories.findFirst({
      where: and(
        eq(budgetCategories.id, validatedData.budgetCategoryId),
        eq(budgetCategories.userId, user.id)
      ),
    });

    if (!category) {
      return { success: false, error: "Budget category not found" };
    }

    // Create new budget item
    const [newItem] = await db
      .insert(budgetItems)
      .values({
        userId: user.id,
        budgetCategoryId: validatedData.budgetCategoryId,
        type: validatedData.type,
        name: validatedData.name,
        amount: validatedData.amount,
        frequency: validatedData.frequency,
        startDate: validatedData.startDate,
        dayOfWeek: validatedData.dayOfWeek,
        dayOfMonth: validatedData.dayOfMonth,
        secondDayOfMonth: validatedData.secondDayOfMonth,
        sortOrder: validatedData.sortOrder ?? 0,
      })
      .returning();

    revalidatePath("/");

    return { success: true, data: newItem };
  } catch (error) {
    console.error("Error creating budget item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create budget item",
    };
  }
}

