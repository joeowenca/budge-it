"use server";

import { db } from "@/db";
import { budgetCategories, budgetItems, getBudgetCategoriesFilterSchema, getBudgetItemsFilterSchema, createBudgetCategorySchema, createBudgetItemSchema, updateBudgetCategorySchema, updateBudgetItemSchema, frequencyTypeSchema, dayOfWeekTypeSchema } from "@/db/schema";
import { checkUser } from "@/lib/checkUser";
import { eq, and, InferInsertModel, desc, ne, asc } from "drizzle-orm";
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
        eq(budgetCategories.name, validatedData.name),
        eq(budgetCategories.isArchived, false)
      ),
    });

    if (existingCategory) {
      return { 
          success: false, 
          error: "Category already exists",
          data: existingCategory
      };
    }

    // Find the current highest sortOrder for categories of the same type
    const highestSortOrderCategory = await db.query.budgetCategories.findFirst({
      where: and(
        eq(budgetCategories.userId, user.id),
        eq(budgetCategories.type, validatedData.type)
      ),
      orderBy: desc(budgetCategories.sortOrder),
    });

    // Set sortOrder to max + 1, or 0 if no categories exist
    const newSortOrder = highestSortOrderCategory ? highestSortOrderCategory.sortOrder + 1 : 0;

    // Create new category
    const [newCategory] = await db
      .insert(budgetCategories)
      .values({
        userId: user.id,
        type: validatedData.type,
        name: validatedData.name,
        emoji: validatedData.emoji,
        color: validatedData.color,
        sortOrder: validatedData.sortOrder ?? newSortOrder,
      })
      .returning();

    revalidatePath("/");

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

    // Find the current highest sortOrder for items in the same category
    const highestSortOrderItem = await db.query.budgetItems.findFirst({
      where: and(
        eq(budgetItems.userId, user.id),
        eq(budgetItems.budgetCategoryId, validatedData.budgetCategoryId)
      ),
      orderBy: desc(budgetItems.sortOrder),
    });

    // Set sortOrder to max + 1, or 0 if no items exist
    const newSortOrder = highestSortOrderItem ? highestSortOrderItem.sortOrder + 1 : 0;

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
        sortOrder: validatedData.sortOrder ?? newSortOrder,
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

    revalidatePath("/");
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
      // Step A: Group items by budgetCategoryId
      const itemsByCategory = new Map<number, typeof validatedDataArray>();
      
      for (const validatedData of validatedDataArray) {
        const categoryId = validatedData.budgetCategoryId;
        if (!itemsByCategory.has(categoryId)) {
          itemsByCategory.set(categoryId, []);
        }
        itemsByCategory.get(categoryId)!.push(validatedData);
      }

      // Step B: Process each category group
      const results = [];

      for (const [categoryId, items] of itemsByCategory.entries()) {
        // Verify that the budget category exists and belongs to the user
        const category = await tx.query.budgetCategories.findFirst({
          where: and(
            eq(budgetCategories.id, categoryId),
            eq(budgetCategories.userId, user.id)
          ),
        });

        if (!category) {
          throw new Error(`Budget category with id ${categoryId} not found`);
        }

        // Fetch the current max sortOrder for this category (once per category group)
        const highestSortOrderItem = await tx.query.budgetItems.findFirst({
          where: and(
            eq(budgetItems.userId, user.id),
            eq(budgetItems.budgetCategoryId, categoryId)
          ),
          orderBy: desc(budgetItems.sortOrder),
        });

        // Store the base sortOrder for this category
        const baseSortOrder = highestSortOrderItem ? highestSortOrderItem.sortOrder : -1;

        // Assign sortOrder to items in memory sequentially (max+1, max+2, max+3...)
        items.forEach((item, index) => {
          if (item.sortOrder === undefined) {
            item.sortOrder = baseSortOrder + index + 1;
          }
        });

        // Insert all items for this category
        for (const item of items) {
          const [newItem] = await tx
            .insert(budgetItems)
            .values({
              userId: user.id,
              budgetCategoryId: item.budgetCategoryId,
              type: item.type,
              name: item.name,
              amount: item.amount,
              frequency: item.frequency,
              startDate: item.startDate,
              dayOfWeek: item.dayOfWeek,
              dayOfMonth: item.dayOfMonth,
              dayOfMonthIsLast: item.dayOfMonthIsLast ?? false,
              secondDayOfMonth: item.secondDayOfMonth,
              secondDayOfMonthIsLast: item.secondDayOfMonthIsLast ?? false,
              sortOrder: item.sortOrder,
            })
            .returning();

          results.push(newItem);
        }
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
    const user = await checkUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const validationResult = z.array(updateBudgetItemSchema).safeParse(dataArray);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0]?.message };
    }

    const validatedDataArray = validationResult.data;

    // 1. Derive the type directly from the DB schema
    type BudgetItemsUpdate = Partial<InferInsertModel<typeof budgetItems>>;

    const updatedItems = await db.transaction(async (tx) => {
      const results = [];

      for (const itemData of validatedDataArray) {
        // Check ownership
        const existingItem = await tx.query.budgetItems.findFirst({
          where: and(
            eq(budgetItems.id, itemData.id),
            eq(budgetItems.userId, user.id)
          ),
        });

        if (!existingItem) {
          throw new Error(`Budget item ${itemData.id} not found`);
        }

        // 2. Separate ID from the rest of the fields
        const { id, ...fieldsToUpdate } = itemData;

        // 3. Construct the update object dynamically
        // Spreading `fieldsToUpdate` automatically includes frequency, startDate, etc.
        const updateData: BudgetItemsUpdate = {
          ...fieldsToUpdate,
          updatedAt: new Date(),
        };

        // 4. Handle your special logic for archiving
        if (fieldsToUpdate.isArchived !== undefined) {
          updateData.archivedAt = fieldsToUpdate.isArchived ? new Date() : null;
        }

        const [updatedItem] = await tx
          .update(budgetItems)
          .set(updateData)
          .where(and(
            eq(budgetItems.id, id),
            eq(budgetItems.userId, user.id)
          ))
          .returning();

        results.push(updatedItem);
      }
      return results;
    });

    revalidatePath("/");
    return { success: true, data: updatedItems };

  } catch (error) {
    console.error("Error batch updating budget items:", error);
    return { success: false, error: "Failed to update items" };
  }
}

/**
 * Update the sort order of a budget category via drag-and-drop
 * @param id - The ID of the category being moved
 * @param newPreviousId - The ID of the category that should be before this one (null if moving to top)
 * @param newNextId - The ID of the category that should be after this one (null if moving to bottom)
 */
export async function updateCategorySortOrder(
  id: number,
  newPreviousId: number | null,
  newNextId: number | null
): Promise<ActionResult> {
  try {
    // 1. Auth & Validation
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the category exists and belongs to the user
    const category = await db.query.budgetCategories.findFirst({
      where: and(
        eq(budgetCategories.id, id),
        eq(budgetCategories.userId, user.id)
      ),
    });

    if (!category) {
      return { success: false, error: "Budget category not found" };
    }

    // 2. Fetch Neighbors
    let prevSortOrder = 0;
    if (newPreviousId !== null) {
      const prevCategory = await db.query.budgetCategories.findFirst({
        where: and(
          eq(budgetCategories.id, newPreviousId),
          eq(budgetCategories.userId, user.id),
          eq(budgetCategories.type, category.type) // Ensure same type
        ),
      });
      if (prevCategory) {
        prevSortOrder = prevCategory.sortOrder;
      }
    }

    let nextSortOrder = prevSortOrder + 1000;
    if (newNextId !== null) {
      const nextCategory = await db.query.budgetCategories.findFirst({
        where: and(
          eq(budgetCategories.id, newNextId),
          eq(budgetCategories.userId, user.id),
          eq(budgetCategories.type, category.type) // Ensure same type
        ),
      });
      if (nextCategory) {
        nextSortOrder = nextCategory.sortOrder;
      }
    }

    // 3. Calculate New Position
    const newSortOrder = (prevSortOrder + nextSortOrder) / 2;

    // 4. The "Heal" Strategy
    const shouldRebalance = 
      Math.abs(nextSortOrder - prevSortOrder) < 1 || 
      (prevSortOrder === 0 && nextSortOrder === 0);

    if (shouldRebalance) {
      const siblings = await db.query.budgetCategories.findMany({
        where: and(
          eq(budgetCategories.userId, user.id),
          eq(budgetCategories.type, category.type),
          ne(budgetCategories.id, id)
        ),
        orderBy: (categories, { asc }) => [
          asc(categories.sortOrder),
          asc(categories.id),
        ],
      });

      const siblingIds = siblings.map((s) => s.id);

      // Insertion Logic
      let insertIndex = 0;
      
      const safePrevId = newPreviousId !== null ? Number(newPreviousId) : null;
      const safeNextId = newNextId !== null ? Number(newNextId) : null;

      if (safePrevId !== null) {
        const prevIndex = siblingIds.indexOf(safePrevId);
        
        if (prevIndex !== -1) {
          insertIndex = prevIndex + 1;
        } else {
          if (safeNextId !== null) {
            const nextIndex = siblingIds.indexOf(safeNextId);
            if (nextIndex !== -1) {
              insertIndex = nextIndex;
            }
          }
        }
      } else if (safeNextId !== null) {
        const nextIndex = siblingIds.indexOf(safeNextId);
        if (nextIndex !== -1) {
          insertIndex = nextIndex;
        }
      }

      // Insert the dragged id at the calculated index
      siblingIds.splice(insertIndex, 0, id);

      // Map the new array to clean integers (index + 1) and update all siblings in a transaction
      await db.transaction(async (tx) => {
        for (let i = 0; i < siblingIds.length; i++) {
          await tx
            .update(budgetCategories)
            .set({
              sortOrder: i + 1,
              updatedAt: new Date(),
            })
            .where(and(
              eq(budgetCategories.id, siblingIds[i]),
              eq(budgetCategories.userId, user.id)
            ));
        }
      });
    } else {
      // 5. Fast Path - Simply update the single category with the calculated decimal newSortOrder
      await db
        .update(budgetCategories)
        .set({
          sortOrder: newSortOrder,
          updatedAt: new Date(),
        })
        .where(and(
          eq(budgetCategories.id, id),
          eq(budgetCategories.userId, user.id)
        ));
    }

    // 6. Finalize - Call revalidatePath
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error updating category sort order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category sort order",
    };
  }
}
