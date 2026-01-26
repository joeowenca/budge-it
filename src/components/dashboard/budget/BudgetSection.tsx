"use client";

import { useState } from "react";
import { CategoryWithBudgetItems } from "./Budget";
import { BudgetCategory } from "./BudgetCategory";
import type { BudgetType } from "@/db/schema";
import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { Plus } from "lucide-react";
import { AmountPillColorTypes } from "@/components/AmountPill";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { updateCategorySortOrder } from "@/app/actions/budgetActions";

export const titleColors: Record<string, AmountPillColorTypes> = {
  Income: "blue",
  Expenses: "red",
  Savings: "green"
}

interface BudgetSectionProps {
  title: string;
  categories: CategoryWithBudgetItems[];
  budgetType: BudgetType;
}

export default function BudgetSection({ title, categories, budgetType }: BudgetSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [categoryStates, setCategoryStates] = useState<
    Record<string, { isExpanded: boolean; isEditing: boolean }>
  >({});

  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleIsAdding = () => {
    setIsAdding(!isAdding);
  }

  const filteredCategories = categories.filter((category) => !category.isArchived);
  const categoryIds = filteredCategories.map((cat) => cat.id.toString());

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categoryIds.indexOf(active.id as string);
    const newIndex = categoryIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = arrayMove(categoryIds, oldIndex, newIndex);

    const prevItemId = newOrder[newIndex - 1];
    const nextItemId = newOrder[newIndex + 1];

    const draggedId = parseInt(active.id as string);

    const newPreviousId = prevItemId ? parseInt(prevItemId) : null;
    const newNextId = nextItemId ? parseInt(nextItemId) : null;

    const result = await updateCategorySortOrder(
      draggedId,
      newPreviousId,
      newNextId
    );

    if (result.success) {
      router.refresh();
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getCategoryState = (id: string, itemsCount: number) => {
    const stored = categoryStates[id];
    if (stored) return stored;

    const isDefaultOpen = itemsCount === 0; 
    return { isExpanded: isDefaultOpen, isEditing: isDefaultOpen };
  };

  const setCategoryState = (id: string, updates: Partial<{ isExpanded: boolean; isEditing: boolean }>) => {
    setCategoryStates((prev) => {
      const current = prev[id] || { isExpanded: false, isEditing: false };

      return {
        ...prev,
        [id]: { ...current, ...updates }
      };
    });
  };

  const activeCategory = filteredCategories.find(c => c.id.toString() === activeId);
  const activeCategoryForDisplay = activeCategory ? {
    id: activeCategory.id,
    emoji: activeCategory.emoji,
    name: activeCategory.name,
    type: activeCategory.type,
  } : null;

  let activeState = { isExpanded: false, isEditing: false };

  if (activeCategory) {
   const itemsCount = activeCategory.budgetItems.length;
   
   const stored = categoryStates[activeCategory.id.toString()];
   if (stored) {
     activeState = stored;
   } else {
     activeState = { 
       isExpanded: itemsCount === 0, 
       isEditing: itemsCount === 0 
     };
   }
}

  return (
    <div className="space-y-2">
      <div className="flex items-center w-full px-1 py-2">
        <h3 className="text-xl flex-1 font-bold">{title}</h3>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 mb-4">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground ml-1">No categories yet - add one below!</p>
            ) : (
              filteredCategories.map((category) => {
                const currentState = getCategoryState(category.id.toString(), category.budgetItems.length);

                const categoryForDisplay = {
                  id: category.id,
                  emoji: category.emoji,
                  name: category.name,
                  type: category.type,
                };

                return (
                  <BudgetCategory
                    key={category.id}
                    category={categoryForDisplay}
                    items={category.budgetItems}
                    title={title}
                    isExpanded={currentState.isExpanded}
                    isEditing={currentState.isEditing}
                    onToggleExpand={() => setCategoryState(category.id.toString(), { isExpanded: !currentState.isExpanded })}
                    onSetEditing={(value) => setCategoryState(category.id.toString(), { isEditing: value })}
                  />
                );
              })
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCategory && activeCategoryForDisplay ? (
            <div className="w-full opacity-90 cursor-grabbing">
              <BudgetCategory
                category={activeCategoryForDisplay}
                items={activeCategory.budgetItems}
                title={title}
                isExpanded={activeState.isExpanded}
                isEditing={activeState.isEditing}
                onToggleExpand={() => {}}
                onSetEditing={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>
      <div className="flex items-center h-9">
        <div
          onClick={() => {toggleIsAdding()}}
          className={`${isAdding && "hidden"} ml-1 text-primary/75 rounded-full bg-muted cursor-pointer hover:text-white hover:bg-primary transition-all p-1.25`}
        >
            <Plus className="size-4.5" strokeWidth={2.75} />
        </div>
        {isAdding && (<BudgetCategoryForm budgetType={budgetType} action="add" onClose={(toggleIsAdding)} />)}
      </div>
    </div>
  );
}