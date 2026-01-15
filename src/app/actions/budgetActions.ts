"use server";

import { db } from "@/db";
import { budgetCategories, budgetItems, getBudgetCategoriesFilterSchema, getBudgetItemsFilterSchema, createBudgetCategorySchema, createBudgetItemSchema, updateBudgetCategorySchema, updateBudgetItemSchema } from "@/db/schema";
import { checkUser } from "@/lib/checkUser";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
      orderBy: (categories, { asc }) => [
        asc(categories.sortOrder),
        asc(categories.id), // Secondary sort by id for stable ordering
      ],
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

/**
 * Update a budget category
 * @param data - Budget category update data with id and optional fields to update
 */
export async function updateBudgetCategory(
  data: z.infer<typeof updateBudgetCategorySchema>
): Promise<ActionResult> {
  try {
    // Check authentication
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validationResult = updateBudgetCategorySchema.safeParse(data);
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
        eq(budgetCategories.id, validatedData.id),
        eq(budgetCategories.userId, user.id)
      ),
    });

    if (!category) {
      return { success: false, error: "Budget category not found" };
    }

    // Build update object with only provided fields
    const updateData: {
      emoji?: string;
      name?: string;
      sortOrder?: number;
      isArchived?: boolean;
      archivedAt?: Date | null;
      updatedAt?: Date;
    } = {};

    if (validatedData.emoji !== undefined) {
      updateData.emoji = validatedData.emoji;
    }
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.sortOrder !== undefined) {
      updateData.sortOrder = validatedData.sortOrder;
    }
    if (validatedData.isArchived !== undefined) {
      updateData.isArchived = validatedData.isArchived;
      // Set archivedAt when archiving, clear when unarchiving
      updateData.archivedAt = validatedData.isArchived ? new Date() : null;
    }
    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    // Use transaction to update category and archive all items if archiving
    const result = await db.transaction(async (tx) => {
      // Update the category
      const [updatedCategory] = await tx
        .update(budgetCategories)
        .set(updateData)
        .where(and(
          eq(budgetCategories.id, validatedData.id),
          eq(budgetCategories.userId, user.id)
        ))
        .returning();

      // If archiving the category, archive all items within it
      if (validatedData.isArchived === true) {
        const archiveTimestamp = new Date();
        await tx
          .update(budgetItems)
          .set({
            isArchived: true,
            archivedAt: archiveTimestamp,
            updatedAt: archiveTimestamp,
          })
          .where(and(
            eq(budgetItems.budgetCategoryId, validatedData.id),
            eq(budgetItems.userId, user.id),
            eq(budgetItems.isArchived, false) // Only archive items that aren't already archived
          ));
      }

      return updatedCategory;
    });

    revalidatePath("/budget");
    revalidatePath("/");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating budget category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update budget category",
    };
  }
}

/**
 * Batch create budget items
 * @param dataArray - Array of budget item data to create
 */
export async function batchCreateBudgetItems(
  dataArray: z.infer<typeof createBudgetItemSchema>[]
): Promise<ActionResult> {
  try {
    // Check authentication
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input array
    const validationResult = z.array(createBudgetItemSchema).safeParse(dataArray);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Invalid input",
      };
    }

    const validatedDataArray = validationResult.data;

    // Use transaction to create all items
    const createdItems = await db.transaction(async (tx) => {
      const results = [];

      for (const validatedData of validatedDataArray) {
        // Verify that the budget category exists and belongs to the user
        const category = await tx.query.budgetCategories.findFirst({
          where: and(
            eq(budgetCategories.id, validatedData.budgetCategoryId),
            eq(budgetCategories.userId, user.id)
          ),
        });

        if (!category) {
          throw new Error(`Budget category with id ${validatedData.budgetCategoryId} not found`);
        }

        // Create new budget item
        const [newItem] = await tx
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
            dayOfMonthIsLast: validatedData.dayOfMonthIsLast ?? false,
            secondDayOfMonth: validatedData.secondDayOfMonth,
            secondDayOfMonthIsLast: validatedData.secondDayOfMonthIsLast ?? false,
            sortOrder: validatedData.sortOrder ?? 0,
          })
          .returning();

        results.push(newItem);
      }

      return results;
    });

    revalidatePath("/");

    return { success: true, data: createdItems };
  } catch (error) {
    console.error("Error batch creating budget items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to batch create budget items",
    };
  }
}

/**
 * Batch update budget items
 * @param dataArray - Array of budget item update data with id and optional fields to update
 */
export async function batchUpdateBudgetItems(
  dataArray: z.infer<typeof updateBudgetItemSchema>[]
): Promise<ActionResult> {
  try {
    // Check authentication
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input array
    const validationResult = z.array(updateBudgetItemSchema).safeParse(dataArray);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Invalid input",
      };
    }

    const validatedDataArray = validationResult.data;

    // Use transaction to update all items
    const updatedItems = await db.transaction(async (tx) => {
      const results = [];

      for (const validatedData of validatedDataArray) {
        // Verify that the budget item exists and belongs to the user
        const item = await tx.query.budgetItems.findFirst({
          where: and(
            eq(budgetItems.id, validatedData.id),
            eq(budgetItems.userId, user.id)
          ),
        });

        if (!item) {
          throw new Error(`Budget item with id ${validatedData.id} not found`);
        }

        // Build update object with only provided fields
        const updateData: {
          name?: string;
          amount?: number;
          sortOrder?: number;
          isArchived?: boolean;
          archivedAt?: Date | null;
          updatedAt?: Date;
        } = {};

        if (validatedData.name !== undefined) {
          updateData.name = validatedData.name;
        }
        if (validatedData.amount !== undefined) {
          updateData.amount = validatedData.amount;
        }
        if (validatedData.sortOrder !== undefined) {
          updateData.sortOrder = validatedData.sortOrder;
        }
        if (validatedData.isArchived !== undefined) {
          updateData.isArchived = validatedData.isArchived;
          // Set archivedAt when archiving, clear when unarchiving
          updateData.archivedAt = validatedData.isArchived ? new Date() : null;
        }
        // Always update the updatedAt timestamp
        updateData.updatedAt = new Date();

        // Update the item
        const updatedItemResult = await tx
          .update(budgetItems)
          .set(updateData)
          .where(and(
            eq(budgetItems.id, validatedData.id),
            eq(budgetItems.userId, user.id)
          ))
          .returning();

        if (updatedItemResult.length === 0) {
          throw new Error(`Budget item with id ${validatedData.id} not found or unauthorized`);
        }

        results.push(updatedItemResult[0]);
      }

      return results;
    });

    revalidatePath("/");

    return { success: true, data: updatedItems };
  } catch (error) {
    console.error("Error batch updating budget items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to batch update budget items",
    };
  }
}

