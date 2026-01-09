"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from "emoji-picker-react";
import { getBudgetCategories, getBudgetItems, createBudgetCategory } from "@/app/actions/budgetActions";
import { BudgetCategory } from "./BudgetCategory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BudgetType } from "@/db/schema";
import { Plus, XIcon, CheckIcon } from "lucide-react";

type Category = NonNullable<Awaited<ReturnType<typeof getBudgetCategories>>["data"]>[number];
type BudgetItem = NonNullable<Awaited<ReturnType<typeof getBudgetItems>>["data"]>[number];

interface CategoryWithBudgetItems extends Category {
  budgetItems: BudgetItem[];
}

interface BudgetSectionProps {
  title: string;
  categories: CategoryWithBudgetItems[];
  type: BudgetType;
}

export default function BudgetSection({ title, categories, type }: BudgetSectionProps) {
  const router = useRouter();
  
  // Track expanded state for each category (default: all collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  // Add Category UI state
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("💵");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewCategoryEmoji(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  function getEmojiStyle(): EmojiStyle {
    if (typeof navigator === "undefined") return EmojiStyle.APPLE; // default for SSR
  
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return EmojiStyle.GOOGLE;
    if (/iPhone|iPad|iPod/i.test(ua)) return EmojiStyle.APPLE;
    if (/Windows/i.test(ua)) return EmojiStyle.TWITTER;
    if (/Mac/i.test(ua)) return EmojiStyle.APPLE;
    if (/Linux/i.test(ua)) return EmojiStyle.GOOGLE;
    if (/Ubuntu/i.test(ua)) return EmojiStyle.GOOGLE;
    return EmojiStyle.APPLE;
  }

  const handleSubmit = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBudgetCategory({
        type,
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
      });

      if (result.success) {
        // Reset form state
        setIsCreating(false);
        setNewCategoryName("");
        setNewCategoryEmoji("💵");
        setShowEmojiPicker(false);
        // Refresh the page to show the new category
        router.refresh();
      } else {
        console.error("Failed to create category:", result.error);
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAddCategory = () => {
    setIsCreating(false);
    setNewCategoryEmoji("💵");
    setNewCategoryName("");
    setShowEmojiPicker(false);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xl font-medium pb-1">{title}</h3>
      <div className="space-y-4">
        {categories.filter((category) => !category.isArchived).length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        ) : (
          categories
            .filter((category) => !category.isArchived)
            .map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              // Map schema category (with 'name') to BudgetCategory expected format (with 'label')
              const categoryForDisplay = {
                id: category.id,
                emoji: category.emoji,
                name: category.name,
              };

              return (
                <BudgetCategory
                  key={category.id}
                  category={categoryForDisplay}
                  items={category.budgetItems}
                  title={title}
                  isExpanded={isExpanded}
                  onToggle={() => toggleCategory(category.id)}
                />
              );
            })
        )}
      </div>
      
      {/* Add Category UI */}
      {!isCreating ? (
        <Button
          variant="ghost"
          onClick={() => setIsCreating(true)}
          className="mt-2"
        >
          + Add Category
        </Button>
      ) : (
        <div className="flex items-center gap-2 mt-4 relative">
          {/* Emoji Trigger Button */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`text-xl ${showEmojiPicker && "border-primary shadow-lg shadow-primary/25"}`}
              >
                {newCategoryEmoji}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                autoFocusSearch={false}
                emojiStyle={getEmojiStyle()}
                height={400}
                width={340}
                previewConfig={{
                  showPreview: false
                }}
                categories={[
                  { name: "Smileys", category: Categories.SMILEYS_PEOPLE },
                  { name: "Animals & Nature", category: Categories.ANIMALS_NATURE },
                  { name: "Food & Drink", category: Categories.FOOD_DRINK },
                  { name: "Travel & Places", category: Categories.TRAVEL_PLACES },
                  { name: "Activities", category: Categories.ACTIVITIES },
                  { name: "Objects", category: Categories.OBJECTS },
                  { name: "Symbols", category: Categories.SYMBOLS },
                  { name: "Flags", category: Categories.FLAGS },
                ]}
                skinTonesDisabled={true}
              />
            </PopoverContent>
          </Popover>

          {/* Name Input */}
          <Input
            type="text"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              } else if (e.key === "Escape") {
                closeAddCategory();
              }
            }}
            className="flex-1"
            autoFocus
          />

          <div className="flex items-center gap-2">
            {/* Cancel Button */}
            <div 
              onClick={closeAddCategory}
              className="rounded-full cursor-pointer hover:text-white hover:bg-red-500 hover:shadow-md hover:shadow-red-600/25 p-1.5 transition-all"
            >
              <XIcon className="size-5" strokeWidth={2.5} />
            </div>

            {/* Confirm Button */}
            <div 
              onClick={handleSubmit}
              className={`rounded-full cursor-not-allowed ${!newCategoryName.trim() && "text-muted-foreground"} ${newCategoryName.trim() && "text-black cursor-pointer hover:text-white hover:bg-green-500 hover:shadow-md hover:shadow-green-500/25"} p-1.5 transition-all`}
            >
              {!isSubmitting ? <CheckIcon className="size-5" strokeWidth={2.5} /> : "..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

