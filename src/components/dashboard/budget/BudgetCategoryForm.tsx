"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBudgetCategory } from "@/app/actions/budgetActions";
import { Category } from "@/components/dashboard/budget/BudgetCategory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Undo } from "lucide-react";
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from "emoji-picker-react";
import { BudgetType } from "@/db/schema";

type BudgetCategoryFormTypes = {
    type?: BudgetType;
    category?: Category;
    isAdding?: boolean;
    toggleIsAdding?: () => void;
    isEditing?: boolean;
    onEmojiChange?: (emoji: string) => void;
    onNameChange?: (name: string) => void;
}

export function BudgetCategoryForm({ type, category, isAdding = false, toggleIsAdding, isEditing = false, onEmojiChange, onNameChange }: BudgetCategoryFormTypes) {
    const router = useRouter();

    const [isCreating, setIsCreating] = useState(false);
    // Initialize with category values if in edit mode, otherwise use defaults
    const [newCategoryEmoji, setNewCategoryEmoji] = useState(isEditing && category ? category.emoji : "💵");
    const [newCategoryName, setNewCategoryName] = useState(isEditing && category ? category.name : "");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update local state when category prop changes (for edit mode)
    useEffect(() => {
        if (isEditing && category) {
            setNewCategoryEmoji(category.emoji);
            setNewCategoryName(category.name);
        }
    }, [isEditing, category]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
    const newEmoji = emojiData.emoji;
    setNewCategoryEmoji(newEmoji);
    setShowEmojiPicker(false);
    // If in edit mode, notify parent of change
    if (isEditing && onEmojiChange) {
      onEmojiChange(newEmoji);
    }
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
      if (type) {
        const result = await createBudgetCategory({
            type,
            name: newCategoryName.trim(),
            emoji: newCategoryEmoji,
        });

        if (result.success) {
            // Reset form state
            closeAddCategory();
            // Refresh the page to show the new category
            router.refresh();
        } else {
            console.error("Failed to create category:", result.error);
            // You might want to show an error toast here
        }
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

    if (toggleIsAdding) {
        toggleIsAdding();
    }
  };

    return (
        <>
            {(isAdding || isEditing) &&
                <div className="flex items-center gap-2 relative">
                    {/* Emoji Trigger Button */}
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`text-xl ${showEmojiPicker && "border-primary bg-muted"}`}
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
                    onChange={(e) => {
                      const newName = e.target.value;
                      setNewCategoryName(newName);
                      // If in edit mode, notify parent of change
                      if (isEditing && onNameChange) {
                        onNameChange(newName);
                      }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !isEditing) {
                        handleSubmit();
                        } else if (e.key === "Escape" && !isEditing) {
                        closeAddCategory();
                        }
                    }}
                    className={`flex-1 font-semibold ${isEditing && "max-w-36 py-0"}`}
                    autoFocus
                    />

                    <div className={`flex items-center gap-2 ${isEditing && "hidden"}`}>
                        {/* Cancel Button */}
                        <div 
                            onClick={closeAddCategory}
                            className="rounded-full cursor-pointer bg-muted text-muted-foreground hover:text-white hover:bg-primary p-1.25 transition-all"
                        >
                            <Undo className="size-4.5" strokeWidth={2.5} />
                        </div>

                        {/* Confirm Button */}
                        <div 
                            onClick={handleSubmit}
                            className={`rounded-full cursor-not-allowed text-primary bg-muted ${!newCategoryName.trim() && "opacity-50"} ${newCategoryName.trim() && "cursor-pointer hover:text-white hover:bg-primary"} p-1.25 transition-all`}
                        >
                            {!isSubmitting ? <Plus className="size-4.5" strokeWidth={2.75} /> : "..."}
                        </div>
                    </div>
                </div>
            }
        </>
    );
}