"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, CheckIcon, X as XIcon, Trash2, Undo, TriangleAlert } from "lucide-react";
import { BudgetItem } from "./BudgetItem";
import { BudgetItemForm } from "./BudgetItemForm";
import { AmountPill } from "@/components/AmountPill";
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
import { titleColors } from "./BudgetSection";

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

let tempIdCounter = -1;

interface BudgetCategoryProps {
  category: Category;
  items: ReadBudgetItemType[];
  title: string;
}

export function BudgetCategory({
  category,
  items,
  title,
}: BudgetCategoryProps) {
  const router = useRouter();

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    startDate: today,
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
  const [newItem, setNewItem] = useState<CreateItemDraft>(defaultItem);

  const itemsToBeArchivedCount = useMemo(
    () => Object.values(itemEditValues).filter(i => i.isArchived).length,
    [itemEditValues]
  );

  const activeItemsCount = useMemo(
    () => itemsInDB.length - itemsToBeArchivedCount + newItems.length,
    [itemsInDB.length, itemsToBeArchivedCount, newItems.length]
  );

  const isEmpty = activeItemsCount === 0;

  function normalizeItemForCompare(item: ReadBudgetItemType): UpdateItemDraft {
    return {
      ...item,
      amount: (item.amount / 100).toFixed(2),
    };
  }

  function isItemEdited(
    original: ReadBudgetItemType,
    edited: UpdateItemDraft
  ): boolean {
    const normalized = normalizeItemForCompare(original);

    const getDateRes = (d: Date | string | undefined | null) => 
      d ? new Date(d).getTime() : 0;

    return (
      normalized.name !== edited.name ||
      normalized.amount !== edited.amount ||
      normalized.frequency !== edited.frequency ||
      normalized.dayOfWeek !== edited.dayOfWeek ||
      normalized.dayOfMonth !== edited.dayOfMonth ||
      normalized.dayOfMonthIsLast !== edited.dayOfMonthIsLast ||
      normalized.secondDayOfMonth !== edited.secondDayOfMonth ||
      normalized.secondDayOfMonthIsLast !== edited.secondDayOfMonthIsLast ||
      getDateRes(normalized.startDate) !== getDateRes(edited.startDate) ||
      edited.isArchived === true
    );
  }

  const hasItemEdits = itemsInDB.some(item => {
    const edited = itemEditValues[item.id];
    if (!edited) return false;
    return isItemEdited(item, edited);
  });

  const hasNewItems = newItems.length > 0;

  const hasAnyEdits = hasItemEdits || hasNewItems;

  const canUndo = itemsInDB.length > 0 && hasAnyEdits;

  const getDateRes = (d: Date | string | undefined | null) => 
    d ? new Date(d).getTime() : 0;

  function isFrequencyModified(
    original: CreateItemDraft | ReadBudgetItemType, 
    draft: CreateItemDraft | UpdateItemDraft
  ): boolean {
    return (
      original.frequency !== draft.frequency ||
      original.dayOfWeek !== draft.dayOfWeek ||
      original.dayOfMonth !== draft.dayOfMonth ||
      original.dayOfMonthIsLast !== draft.dayOfMonthIsLast ||
      original.secondDayOfMonth !== draft.secondDayOfMonth ||
      original.secondDayOfMonthIsLast !== draft.secondDayOfMonthIsLast ||
      getDateRes(original.startDate) !== getDateRes(draft.startDate)
    );
  }

  function toCents(amount: number | string): number {
    return typeof amount === "string"
      ? Math.round(Number(amount) * 100)
      : amount;
  }

  const totalAmount = useMemo(() => {
    return [
      ...itemsInDB.map(item => itemEditValues[item.id] ?? item),
      ...newItems,
    ]
      .filter(item => !item.isArchived)
      .reduce((sum, item) => {
        return (
          sum +
          toCents(item.amount) * getFrequencyMultiplier(item.frequency)
        );
      }, 0);
  }, [itemsInDB, itemEditValues, newItems]);

  const resetNewItem = () => {
    setNewItem(defaultItem);
  }

  const initializeEditState = () => {
    const initialValues: Record<number, UpdateItemDraft> = {};

    itemsInDB.forEach((item) => {
      initialValues[item.id] = {
        ...item,
        amount: (item.amount / 100).toFixed(2),
      };
    });

    setItemEditValues(initialValues);
    setNewItems([]);
    resetNewItem();
    setCategoryEditValues({
      emoji: category.emoji,
      name: category.name
    });
  }

  const closeEditState = () => {
    initializeEditState();
    setIsEditing(false);
  }

  const toggleIsEditing = () => {
    if (canUndo && isEditing) {
      initializeEditState();
      return;
    }

    if (isEmpty) return;

    if (!isEditing) {
      initializeEditState();
      setIsEditing(true);

      return;
    }

    initializeEditState();
  };

  const handleSave = async () => {
    if (isEmpty) return;

    if (!hasAnyEdits) {
      closeEditState();
      return;
    }

    const updates = Object.values(itemEditValues).map((item) => {
      const amountInCents = Math.round(parseFloat(item.amount) * 100);
      return {
        id: item.id,
        name: item.name || undefined,
        amount: isNaN(amountInCents) ? 0 : amountInCents,
        isArchived: item.isArchived,
        frequency: item.frequency,
        startDate: item.startDate ? new Date(item.startDate) : undefined, 
        dayOfWeek: item.dayOfWeek,
        dayOfMonth: item.dayOfMonth,
        dayOfMonthIsLast: item.dayOfMonthIsLast,
        secondDayOfMonth: item.secondDayOfMonth,
        secondDayOfMonthIsLast: item.secondDayOfMonthIsLast,
      };
    });

    const itemsToCreate: CreateBudgetItemType[] = newItems.map((item) => {
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

    const [updateResult, createResult, categoryResult] = await Promise.all([
      updates.length > 0 ? batchUpdateBudgetItems(updates) : Promise.resolve({ success: true, data: [] }),
      itemsToCreate.length > 0 ? batchCreateBudgetItems(itemsToCreate) : Promise.resolve({ success: true, data: [] }),
      categoryUpdate,
    ]);

    if (updateResult.success && createResult.success && categoryResult.success) {
      closeEditState();
      router.refresh();
    } else {
      const errorMessage = 
        (updateResult.success === false && 'error' in updateResult ? updateResult.error : undefined) ||
        (createResult.success === false && 'error' in createResult ? createResult.error : undefined) ||
        (categoryResult.success === false && 'error' in categoryResult ? categoryResult.error : undefined) ||
        "Failed to save budget items";
      console.error("Failed to save budget items:", errorMessage);
    }
  };

  const handleItemNameChange = (itemId: number, value: string) => {
    setItemEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], name: value },
    }));
  };

  const handleItemAmountChange = (itemId: number, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setItemEditValues((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], amount: value },
      }));
    }
  };

  const handleItemArchive = (itemId: number) => {
    setItemEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], isArchived: true },
    }));
  };

  const handleCreateNewItem = () => {
    if (!newItem.name || !newItem.amount) {
      return;
    }
    setNewItems((prev) => [...prev, { ...newItem }]);
    resetNewItem();
  };

  const handleNewItemNameChange = (value: string) => {
    setNewItem((prev) => ({ ...prev, name: value }));
  };

  const handleNewItemAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNewItem((prev) => ({ ...prev, amount: value }));
    }
  };

  const handleRemoveNewItem = (tempId: number) => {
    setNewItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleItemFrequencyChange = (itemId: number, data: any) => {
    setItemEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...data },
    }));
  };

  const handleNewListItemFrequencyChange = (tempId: number, data: any) => {
    setNewItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, ...data } : item
      )
    );
  };

  const handleNewInputFrequencyChange = (data: any) => {
    setNewItem((prev) => ({ ...prev, ...data }));
  };

  const handleArchiveCategory = async () => {
    const result = await updateBudgetCategory({
      id: category.id,
      isArchived: true,
    });

    if (result.success) {
      setShowArchiveDialog(false);
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
    <div className="space-y-2 p-4 rounded-xl border-1 border-muted shadow-[0px_0px_10px_rgba(0,0,0,0.05)] transition-colors">
      {/* Category Header - Clickable */}
      <div className="flex items-center justify-between m-0 h-7">
        <div 
          className={`flex items-center gap-2 pr-2 transition-all relative ${!isEditing && "hover:text-primary"} ${isEditing ? "cursor-default" : "cursor-pointer"} select-none`}
          onClick={toggleIsExpanded}
        >
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <BudgetCategoryForm 
                category={{
                  ...category,
                  emoji: categoryEditValues.emoji,
                  name: categoryEditValues.name,
                }}
                action="edit"
                onChange={setCategoryEditValues}
                onClose={() => null}
              />
              <div 
                className="text-sm text-red-600 p-1.25 bg-muted hover:text-white hover:bg-red-500 rounded-full transition-all cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowArchiveDialog(true);
                }}
              >
                <Trash2 className="size-4.5" strokeWidth={2} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate"><span className={`${category.emoji && "mr-2"} text-xl`}>{category.emoji}</span>{category.name}</span>
              <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-all ${(isExpanded) ? "rotate-90" : "rotate-0"}`} strokeWidth={2.5} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 relative">
          {isExpanded && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleIsEditing();
              }}
              className={`p-1.5 bg-muted rounded-full transition-all ${isEmpty ? "text-muted-foreground cursor-not-allowed opacity-50" : "hover:text-white hover:bg-primary cursor-pointer"} absolute right-0`}
              aria-label="Edit category"
            >
              <Pencil className="size-4" strokeWidth={2.25} />
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 absolute right-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIsEditing();
                }}
                className={`p-1.25 bg-muted text-muted-foreground rounded-full transition-all ${canUndo ? "cursor-pointer hover:text-white hover:bg-primary" : "hidden"}`}
                aria-label="Cancel editing"
              >
                <Undo className="size-4.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className={`p-1.25 bg-muted rounded-full transition-all ${isEmpty ? "cursor-not-allowed text-muted-foreground opacity-50" : "cursor-pointer text-green-600 hover:text-white hover:bg-green-500"}`}
                aria-label="Save changes"
              >
                <CheckIcon className="size-4.5" strokeWidth={3} />
              </button>
            </div>
          )}
          <AmountPill amount={convertAmountToCurrency(totalAmount)} color={titleColors[title]} className={`${isExpanded && "hidden"}`} />
        </div>
      </div>

      {/* Items - Only show when expanded */}
      {isExpanded && (
        <>
          {(isExpanded || isEditing) && (
            <div className="space-y-1 mt-3">
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
                      type={category.type}
                      onNameChange={(value) => handleItemNameChange(item.id, value)}
                      onAmountChange={(value) => handleItemAmountChange(item.id, value)}
                      onArchive={() => handleItemArchive(item.id)}
                      onFrequencyChange={(data) => handleItemFrequencyChange(item.id, data)}
                      isFrequencyModified={isFrequencyModified(item, editItem)}
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
                  type={category.type}
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
                  onFrequencyChange={(data) => handleNewListItemFrequencyChange(newItem.tempId, data)}
                  isFrequencyModified={isFrequencyModified(defaultItem, newItem)}
                />
              ))}
              {isEditing && (
                <BudgetItemForm
                  action="add"
                  budgetItem={newItem}
                  onNameChange={handleNewItemNameChange}
                  onAmountChange={handleNewItemAmountChange}
                  type={category.type}
                  onAdd={handleCreateNewItem}
                  onFrequencyChange={handleNewInputFrequencyChange}
                  isFrequencyModified={isFrequencyModified(defaultItem, newItem)}
                />
              )}
            </div>
          )}

          <div className="pt-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">Monthly total</span>
              <AmountPill amount={convertAmountToCurrency(totalAmount)} color={titleColors[title]} />
            </div>
          </div>
        </>
      )}

      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent showCloseButton={false} className="sm:max-w-xs max-w-xs min-w-0 gap-2">
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
          <DialogFooter className="sm:justify-center justify-center sm:flex-row flex-row gap-2 mt-2">
            <div
              onClick={() => setShowArchiveDialog(false)}
              className="p-1.5 mr-2 text-red-500 bg-muted hover:text-white hover:bg-red-500 rounded-full transition-all cursor-pointer"
            >
              <XIcon className="size-7" strokeWidth={2.75} />
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