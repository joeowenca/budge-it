"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBudgetCategory } from "@/app/actions/budgetActions";
import { Category } from "@/components/dashboard/budget/BudgetCategory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Loader2 } from "lucide-react";
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from "emoji-picker-react";
import { BudgetType } from "@/db/schema";
import { CategoryEditValueTypes } from "./BudgetCategory";

type BudgetCategoryFormTypes = {
    budgetType?: BudgetType;
    category?: Category;
    action?: "add" | "edit";
    onClose: () => void;
    onChange?: (category: CategoryEditValueTypes) => void;
}

export function BudgetCategoryForm({ 
    budgetType, 
    category, 
    action, 
    onClose, 
    onChange 
}: BudgetCategoryFormTypes) {
    const router = useRouter();
    const isEditing = action === "edit";
    const defaultCategory: CategoryEditValueTypes = {
        emoji: "💵",
        name: ""
    }

    const [newCategory, setNewCategory] = useState<CategoryEditValueTypes>(defaultCategory);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && category) {
            setNewCategory(category);
        }
    }, [isEditing, category]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const categoryWithNewEmoji = {
            emoji: emojiData.emoji,
            name: newCategory.name
        };
        setNewCategory(categoryWithNewEmoji);
        setShowEmojiPicker(false);
        
        if (isEditing && onChange) {
            onChange(categoryWithNewEmoji);
        }
    };

    function getEmojiStyle(): EmojiStyle {
        if (typeof navigator === "undefined") return EmojiStyle.APPLE;

        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) return EmojiStyle.GOOGLE;
        if (/iPhone|iPad|iPod/i.test(ua)) return EmojiStyle.APPLE;
        if (/Windows/i.test(ua)) return EmojiStyle.TWITTER;
        if (/Mac/i.test(ua)) return EmojiStyle.APPLE;
        if (/Linux/i.test(ua)) return EmojiStyle.GOOGLE;
        if (/Ubuntu/i.test(ua)) return EmojiStyle.GOOGLE;
        return EmojiStyle.APPLE;
    }

    const closeForm = () => {
        setNewCategory(defaultCategory);
        setShowEmojiPicker(false);
        setErrorMessage(null);
        onClose();
    };

    const handleSubmit = async () => {
        setErrorMessage(null);

        if (!newCategory.name.trim()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (budgetType) {
                const result = await createBudgetCategory({
                    type: budgetType,
                    name: newCategory.name.trim(),
                    emoji: newCategory.emoji,
                });

                if (result.success) {
                    closeForm();
                    router.refresh();
                } else {
                    console.error("Failed to create category:", result.error);
                    setErrorMessage(result.error as string);
                }
            }
        } catch (error) {
            console.error("Error creating category:", error);
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!action) return null;

    return (
        <div className="flex items-center gap-2 relative">
            {/* Emoji Trigger Button */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className={`text-lg ${showEmojiPicker && "border-primary bg-muted"}`}
                    >
                        {newCategory.emoji}
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
                value={newCategory.name}
                onChange={(e) => {
                    if (errorMessage) setErrorMessage(null);
                    const categoryWithNewName = {
                        emoji: newCategory.emoji,
                        name: e.target.value
                    };
                    setNewCategory(categoryWithNewName)
                    // If in edit mode, notify parent of change
                    if (isEditing && onChange) {
                        onChange(categoryWithNewName);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !isEditing) {
                        handleSubmit();
                    } else if (e.key === "Escape" && !isEditing) {
                        closeForm();
                    }
                }}
                className={`font-semibold h-8 pl-2 ${isEditing && "w-36 py-0"} ${errorMessage ? "border-red-500 focus-visible:ring-red-500 pr-8" : ""}`}
                autoFocus
            />

            {/* Add/Cancel Buttons - Hidden when editing */}
            <div className={`flex items-center gap-2 ${isEditing && "hidden"}`}>
                {/* Cancel Button */}
                <div
                    onClick={closeForm}
                    className="rounded-full cursor-pointer text-red-600 bg-muted hover:text-white hover:bg-red-600 p-1.25 transition-all"
                >
                    <X className="size-4.5" strokeWidth={2.5} />
                </div>

                {/* Confirm Button */}
                <div
                    onClick={handleSubmit}
                    className={`rounded-full cursor-not-allowed text-primary bg-muted ${!newCategory.name.trim() && "opacity-50"} ${newCategory.name.trim() && "cursor-pointer hover:text-white hover:bg-primary"} p-1.25 transition-all`}
                >
                    {!isSubmitting ? <Plus className="size-4.5" strokeWidth={2.75} /> : <Loader2 className="size-4.5 animate-spin" strokeWidth={2.75} />}
                </div>
            </div>
            {errorMessage && (
                <p className="text-xs text-red-500 font-medium absolute top-10 left-11">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}