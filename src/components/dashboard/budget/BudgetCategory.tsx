"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, CheckIcon, X as XIcon, Undo, TriangleAlert } from "lucide-react";
import { BudgetItem } from "./BudgetItem";
import { BudgetItemForm } from "./BudgetItemForm";
import { batchUpdateBudgetItems, batchCreateBudgetItems, updateBudgetCategory } from "@/app/actions/budgetActions";
import { budgetTypeSchema, ReadBudgetItemType, CreateBudgetItemType } from "@/db/schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { convertAmountToCurrency, getFrequencyMultiplier } from "@/lib/utils";

export type Category = {
  id: number;
  emoji: string;
  name: string;
  type: z.infer<typeof budgetTypeSchema>;
};

export type CategoryEditValueTypes = {
  emoji: string;
  name: string;
}

export type CreateItemDraft = Omit<CreateBudgetItemType, "amount"> & { amount: string, tempId: number };
export type UpdateItemDraft = Omit<ReadBudgetItemType, "amount"> & { amount: string };

interface BudgetCategoryProps {
  category: Category;
  items: ReadBudgetItemType[];
  title: string;
}

interface TotalAmountProps {
  totalAmount: string;
  title?: string;
  isExpanded?: boolean;
}

const titleColors: Record<string, string> = {
  Income: "text-primary bg-primary/10",
  Expenses: "text-red-600 bg-red-600/10",
  Savings: "text-green-700 bg-green-600/10",
};

function TotalAmount({ totalAmount, title, isExpanded }: TotalAmountProps) {
  return (
    <span className={`font-medium text-sm tracking-wider ml-4 px-2.5 py-1 ${titleColors[title ?? ""] || "text-gray-900 bg-gray-600/10"} ${isExpanded && "invisible"} rounded-full`}>
      {totalAmount}
    </span>
  );
}

let tempIdCounter = -1;

export function BudgetCategory({
  category,
  items,
  title,
}: BudgetCategoryProps) {
  const router = useRouter();
  // Stable sort: sort by sortOrder (ascending) first, then by id (ascending) as tie-breaker
  const itemsInDB = items
    .filter((item) => !item.isArchived)
    .sort((a, b) => {
      const sortOrderA = a.sortOrder ?? 0;
      const sortOrderB = b.sortOrder ?? 0;
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }
      return a.id - b.id;
    });

  const defaultItem: CreateItemDraft = {
    tempId: tempIdCounter--,
    budgetCategoryId: category.id,
    type: category.type,
    name: "",
    amount: "",
    frequency: "monthly",
    dayOfWeek: null,
    dayOfMonth: 1,
    dayOfMonthIsLast: false,
    secondDayOfMonth: null,
    secondDayOfMonthIsLast: false,
    startDate: new Date(),
    isArchived: false,
    sortOrder: 0,
  }

  const originalCategoryValues: CategoryEditValueTypes = {
    emoji: category.emoji,
    name: category.name
  }

  const [isExpanded, setIsExpanded] = useState(itemsInDB.length === 0);
  const [isEditing, setIsEditing] = useState(itemsInDB.length === 0);
  const [itemEditValues, setItemEditValues] = useState<Record<number, UpdateItemDraft>>({});
  const [categoryEditValues, setCategoryEditValues] = useState<CategoryEditValueTypes>(originalCategoryValues);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [newItems, setNewItems] = useState<CreateItemDraft[]>([]);
  const [newItem, setNewItem] = useState<CreateItemDraft>({
    tempId: tempIdCounter--,
    budgetCategoryId: category.id,
    type: category.type,
    name: "",
    amount: "",
    frequency: "monthly",
    dayOfWeek: null,
    dayOfMonth: 1,
    dayOfMonthIsLast: false,
    secondDayOfMonth: null,
    secondDayOfMonthIsLast: false,
    startDate: new Date(),
    isArchived: false,
    sortOrder: 0,
  });

  function totalNumberOfItems(): number {
    return itemsInDB.length + newItems.length;
  }

  const totalAmount = itemsInDB.reduce((sum, item) => {
    return sum + item.amount * getFrequencyMultiplier(item);
  }, 0);

  const resetNewItem = () => {
    setNewItem({
      tempId: tempIdCounter--,
      budgetCategoryId: category.id,
      type: category.type,
      name: "",
      amount: "",
      frequency: "monthly",
      dayOfWeek: null,
      dayOfMonth: 1,
      dayOfMonthIsLast: false,
      secondDayOfMonth: null,
      secondDayOfMonthIsLast: false,
      startDate: new Date(),
      isArchived: false,
      sortOrder: 0,
    });
  }

  const resetEditState = () => {
    setItemEditValues({});
    setNewItems([]);
    resetNewItem();
    setIsEditing(false);
    // Restore original category values
    setCategoryEditValues({
      emoji: category.emoji,
      name: category.name
    });
  }

  const toggleIsEditing = () => {
    if (totalNumberOfItems() === 0) return;

    if (!isEditing) {
      // ENTERING Edit Mode: Initialize values immediately
      // Convert amount from cents (number) to dollars (string), preserving 2 decimal places
      const initialValues: Record<number, UpdateItemDraft> = {};
      itemsInDB.forEach((item) => {
        initialValues[item.id] = {
          ...item,
          amount: (item.amount / 100).toFixed(2),
        };
      });
      setItemEditValues(initialValues);
      // Initialize category edit values with current category values
      setCategoryEditValues({
        emoji: category.emoji,
        name: category.name
      });
      setIsEditing(true);

      return;
    }

    // EXITING Edit Mode (Cancel): Clear values
    resetEditState();
  };

  const handleSave = async () => {
    // Construct array of updates from itemEditValues
    // Convert amount from dollars (string) back to cents (number)

    if (totalNumberOfItems() === 0) return;

    const updates = Object.values(itemEditValues).map((item) => {
      const amountInCents = Math.round(parseFloat(item.amount) * 100);
      return {
        id: item.id,
        name: item.name || undefined,
        amount: isNaN(amountInCents) ? 0 : amountInCents,
        isArchived: item.isArchived,
      };
    });

    // Construct array of new items to create
    const creates: CreateBudgetItemType[] = newItems.map((item) => {
      const amountInCents = Math.round(parseFloat(item.amount) * 100);
      return {
        budgetCategoryId: category.id,
        type: category.type,
        name: item.name || "",
        amount: isNaN(amountInCents) ? 0 : amountInCents,
        frequency: item.frequency,
        startDate: item.startDate ? new Date(item.startDate) : new Date(),
        dayOfWeek: item.dayOfWeek,
        dayOfMonth: item.dayOfMonth ?? undefined,
        dayOfMonthIsLast: item.dayOfMonthIsLast,
        secondDayOfMonth: item.secondDayOfMonth ?? undefined,
        secondDayOfMonthIsLast: item.secondDayOfMonthIsLast,
        sortOrder: item.sortOrder,
        isArchived: item.isArchived
      };
    });

    // Update category if emoji or name changed
    const categoryHasChanged =
      originalCategoryValues.emoji !== categoryEditValues.emoji ||
      originalCategoryValues.name !== categoryEditValues.name;

    const categoryUpdate =
      categoryHasChanged
      ? updateBudgetCategory({
            id: category.id,
            emoji: categoryEditValues.emoji,
            name: categoryEditValues.name,
          })
        : Promise.resolve({ success: true, data: [] });

    // Call batchUpdateBudgetItems, batchCreateBudgetItems, and updateBudgetCategory
    const [updateResult, createResult, categoryResult] = await Promise.all([
      updates.length > 0 ? batchUpdateBudgetItems(updates) : Promise.resolve({ success: true, data: [] }),
      creates.length > 0 ? batchCreateBudgetItems(creates) : Promise.resolve({ success: true, data: [] }),
      categoryUpdate,
    ]);

    if (updateResult.success && createResult.success && categoryResult.success) {
      // Clear edit state and toggle isEditing to false
      resetEditState();
      // Refresh the page data to show updated items
      router.refresh();
    } else {
      // Handle error (could add toast notification here)
      const errorMessage = 
        (updateResult.success === false && 'error' in updateResult ? updateResult.error : undefined) ||
        (createResult.success === false && 'error' in createResult ? createResult.error : undefined) ||
        (categoryResult.success === false && 'error' in categoryResult ? categoryResult.error : undefined) ||
        "Failed to save budget items";
      console.error("Failed to save budget items:", errorMessage);
    }
  };

  const handleNameChange = (itemId: number, value: string) => {
    setItemEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], name: value },
    }));
  };

  const handleAmountChange = (itemId: number, value: string) => {
    // Allow empty string, numbers, and decimals (including trailing dots)
    // Prevent letters and symbols other than dots
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setItemEditValues((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], amount: value },
      }));
    }
  };

  const handleArchive = (itemId: number) => {
    setItemEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], isArchived: true },
    }));
  };

  const handleAdd = () => {
    if (!newItem.name || !newItem.amount) {
      return;
    }
    // Add the current newItem to the newItems array
    setNewItems((prev) => [...prev, { ...newItem }]);
    // Reset newItem to empty
    resetNewItem();
  };

  const handleNewItemNameChange = (value: string) => {
    setNewItem((prev) => ({ ...prev, name: value }));
  };

  const handleNewItemAmountChange = (value: string) => {
    // Allow empty string, numbers, and decimals (including trailing dots)
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNewItem((prev) => ({ ...prev, amount: value }));
    }
  };

  const handleRemoveNewItem = (tempId: number) => {
    setNewItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleArchiveCategory = async () => {
    const result = await updateBudgetCategory({
      id: category.id,
      isArchived: true,
    });

    if (result.success) {
      setShowArchiveDialog(false);
      setIsEditing(false);
      router.refresh();
    } else {
      console.error("Failed to archive category:", result.error);
    }
  };

  function toggleIsExpanded() {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  }

  return (
    <div className="space-y-2 p-4 rounded-lg shadow-[0px_0px_10px_rgba(0,0,0,0.12)] transition-colors">
      {/* Category Header - Clickable */}
      <div className="flex items-center justify-between m-0">
        <div 
          className={`flex items-center gap-2 pr-2 transition-all ${!isEditing && "hover:text-primary"} ${isEditing ? "cursor-default" : "cursor-pointer"} select-none`}
          onClick={toggleIsExpanded}
        >
          
          {isEditing ? (
            <>
              <BudgetCategoryForm 
                category={{
                  ...category,
                  emoji: categoryEditValues.emoji,
                  name: categoryEditValues.name,
                }}
                isEditing={true}
                onChange={setCategoryEditValues}
              />
              <div 
              className="text-sm text-red-600 p-1.25 bg-muted hover:text-white hover:bg-red-500 rounded-full transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowArchiveDialog(true);
              }}
            >
              <XIcon className="size-4.5" strokeWidth={2.5} />
            </div>
            </>
          ) : (
            <>
            <span className="font-semibold truncate"><span className={`${category.emoji && "mr-2"} text-xl`}>{category.emoji}</span>{category.name}</span>
            <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-all ${(isExpanded) ? "rotate-90" : "rotate-0"}`} strokeWidth={2.5} />
            </>
          )}
        </div>
        <div className="flex items-center gap-2 relative">
          {isExpanded && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleIsEditing();
              }}
              className={`p-1.5 bg-muted rounded-full transition-all ${itemsInDB.length === 0 ? "text-muted-foreground cursor-not-allowed" : "hover:text-white hover:bg-primary cursor-pointer"} absolute right-0`}
              aria-label="Edit category"
            >
              <Pencil className="size-4.5" strokeWidth={2} />
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 absolute right-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIsEditing();
                }}
                className={`p-1.25 bg-muted text-muted-foreground rounded-full transition-all ${itemsInDB.length === 0 ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer hover:text-white hover:bg-primary"}`}
                aria-label="Cancel editing"
              >
                <Undo className="size-4.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className={`p-1.25 bg-muted rounded-full transition-all ${totalNumberOfItems() === 0 ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-green-600 hover:text-white hover:bg-green-500"}`}
                aria-label="Save changes"
              >
                <CheckIcon className="size-4.5" strokeWidth={3} />
              </button>
            </div>
          )}
          <TotalAmount title={title} isExpanded={isExpanded} totalAmount={convertAmountToCurrency(totalAmount)} />
        </div>
      </div>

      {/* Items - Only show when expanded */}
      {isExpanded && (
        <>
          {(isExpanded || isEditing) && (
            <div className={`space-y-1 ${isEditing ? "mt-1" : "mt-3"}`}>
              {itemsInDB.map((item) => {
                if (isEditing) {
                  const editItem = itemEditValues[item.id];
                  // Skip archived items in edit mode
                  if (!editItem || editItem.isArchived) {
                    return null;
                  }
                  return (
                    <BudgetItemForm
                      key={item.id}
                      action="edit"
                      budgetItem={editItem}
                      onNameChange={(value) => handleNameChange(item.id, value)}
                      onAmountChange={(value) => handleAmountChange(item.id, value)}
                      onArchive={() => handleArchive(item.id)}
                    />
                  );
                }
                return (
                  <BudgetItem
                    key={item.id}
                    item={item}
                  />
                );
              })}
              {isEditing && newItems.map((newItem) => (
                <BudgetItemForm
                  key={newItem.tempId}
                  action="edit"
                  budgetItem={newItem}
                  onNameChange={(value) => {
                    setNewItems((prev) =>
                      prev.map((item) =>
                        item.tempId === newItem.tempId ? { ...item, name: value } : item
                      )
                    );
                  }}
                  onAmountChange={(value) => {
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setNewItems((prev) =>
                        prev.map((item) =>
                          item.tempId === newItem.tempId ? { ...item, amount: value } : item
                        )
                      );
                    }
                  }}
                  onArchive={() => handleRemoveNewItem(newItem.tempId)}
                />
              ))}
              {isEditing && (
                <BudgetItemForm
                  action="add"
                  budgetItem={newItem}
                  onNameChange={handleNewItemNameChange}
                  onAmountChange={handleNewItemAmountChange}
                  type={category.type}
                  onAdd={handleAdd}
                />
              )}
            </div>
          )}
          {itemsInDB.length === 0 && isEditing && newItems.length === 0 && (
            <div className="space-y-1 mt-1">
              <BudgetItemForm
                action="add"
                budgetItem={newItem}
                onNameChange={handleNewItemNameChange}
                onAmountChange={handleNewItemAmountChange}
                type={category.type}
                onAdd={handleAdd}
              />
            </div>
          )}

          {/* Total at bottom - Tally sheet style */}
          <div className="pt-1">
            <div className="flex items-center justify-between mt-1">
              <span className="font-medium">Monthly total</span>
              <TotalAmount title={title} totalAmount={convertAmountToCurrency(totalAmount)} />
            </div>
          </div>
        </>
      )}

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm min-w-0 gap-2">
          <DialogHeader>
            <div className="flex justify-center">
              <div className="p-2 rounded-full bg-yellow-100">
                <TriangleAlert className="size-7 text-yellow-600" strokeWidth={2.5} />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">Are you sure?</DialogTitle>
            <DialogDescription className="text-center text-md mb-1">
              Archiving <b>{categoryEditValues.name}</b> will
              <br />
              archive all its <b>{category.type}{category.type.toString() === "expense" && "s"}</b>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center justify-center sm:flex-row flex-row gap-2">
            <div
              onClick={() => setShowArchiveDialog(false)}
              className="p-1.5 mr-2 text-muted-foreground bg-muted hover:text-white hover:bg-primary rounded-full transition-all cursor-pointer"
            >
              <Undo className="size-7" strokeWidth={2.5} />
            </div>
            <div
              onClick={handleArchiveCategory}
              className="p-1.5 text-green-500 bg-muted hover:text-white hover:bg-green-500 rounded-full transition-all cursor-pointer"
            >
              <CheckIcon className="size-7" strokeWidth={3} />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

