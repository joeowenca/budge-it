"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox } from "@/components/ui/combobox";
import { DayOfMonthPicker } from "./DayOfMonthPicker";
import {
  createBudgetCategorySchema,
  createBudgetItemSchema,
  budgetTypeSchema,
  frequencyTypeSchema,
  type BudgetType,
  type FrequencyType,
} from "@/db/schema";
import {
  getBudgetCategories,
  createBudgetCategory,
  createBudgetItem,
} from "@/app/actions/budgetActions";

// Form schema that extends createBudgetItemSchema but allows category to be string (name) or number (id)
const formSchema = z
  .object({
    category: z.union([z.string().min(1), z.number().int().positive()]),
    type: budgetTypeSchema,
    name: z.string().min(1, "Name is required"),
    amount: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: "Amount must be a positive number.",
      }),
    frequency: frequencyTypeSchema,
    startDate: z.date(),
    dayOfWeek: z.string().optional(),
    dayOfMonth: z.string().optional(),
    secondDayOfMonth: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const Frequency = frequencyTypeSchema.enum;

    // Rule 1: Weekly or Bi-weekly
    if (
      data.frequency === Frequency.weekly ||
      data.frequency === Frequency["bi-weekly"]
    ) {
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
      } else if (data.dayOfMonth) {
        // Validate that 2nd day > 1st day (unless 2nd day is "Last"/"0")
        const firstDay = parseInt(data.dayOfMonth);
        const secondDayStr = data.secondDayOfMonth;
        if (secondDayStr !== "Last" && secondDayStr !== "0") {
          const secondDay = parseInt(secondDayStr);
          if (!isNaN(firstDay) && !isNaN(secondDay) && secondDay <= firstDay) {
            ctx.addIssue({
              code: "custom",
              message: "Second day must be greater than first day",
              path: ["secondDayOfMonth"],
            });
          }
        }
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface AddToBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BudgetCategory = {
  id: number;
  name: string;
  type: BudgetType;
  emoji?: string | null;
  color?: string | null;
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function AddToBudgetDialog({
  open,
  onOpenChange,
}: AddToBudgetDialogProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [newCategories, setNewCategories] = useState<BudgetCategory[]>([]);
  const [activeTab, setActiveTab] = useState<BudgetType>("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      category: "",
      type: "expense",
      name: "",
      amount: "",
      frequency: "weekly",
      startDate: new Date(),
      dayOfWeek: "Monday",
      dayOfMonth: undefined,
      secondDayOfMonth: undefined,
    },
  });

  const watchedType = form.watch("type");
  const watchedFrequency = form.watch("frequency");

  // Fetch categories on mount and when type changes
  useEffect(() => {
    if (open) {
      fetchCategories(activeTab);
    }
  }, [open, activeTab]);

  // Update form type when tab changes
  useEffect(() => {
    form.setValue("type", activeTab);
    form.setValue("category", ""); // Reset category when type changes
  }, [activeTab, form]);

  const fetchCategories = async (type: BudgetType) => {
    const result = await getBudgetCategories({ type });
    if (result.success && result.data) {
      setCategories(result.data as BudgetCategory[]);
    }
  };

  // Get all categories (existing + new) filtered by type
  const getFilteredCategories = (): BudgetCategory[] => {
    const allCategories = [...categories, ...newCategories];
    return allCategories.filter((cat) => cat.type === activeTab);
  };

  // Convert categories to combobox options
  const getCategoryOptions = () => {
    return getFilteredCategories().map((cat) => ({
      value: cat.id.toString(),
      label: cat.name,
    }));
  };

  // Handle category creation in combobox
  const handleCategoryCreate = (categoryName: string) => {
    const newCategory: BudgetCategory = {
      id: Date.now(), // Temporary ID
      name: categoryName,
      type: activeTab,
    };
    setNewCategories((prev) => [...prev, newCategory]);
    // Note: The combobox will call onValueChange with the new value, so we don't need to set it here
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let categoryId: number;

      // Step 1: Check if category is an existing ID or a new name
      if (typeof data.category === "number") {
        categoryId = data.category;
      } else {
        // Step 2: Create the new category
        const categoryResult = await createBudgetCategory({
          type: data.type,
          name: data.category,
        });

        if (!categoryResult.success || !categoryResult.data) {
          throw new Error(
            categoryResult.error || "Failed to create budget category"
          );
        }

        categoryId = categoryResult.data.id;
      }

      // Step 3: Prepare budget item data
      const budgetItemData = {
        budgetCategoryId: categoryId,
        type: data.type,
        name: data.name,
        amount: Math.round(parseFloat(data.amount) * 100),
        frequency: data.frequency,
        startDate: data.startDate,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth:
          data.dayOfMonth === "Last" ? "0" : data.dayOfMonth,
        secondDayOfMonth:
          data.secondDayOfMonth === "Last" ? "0" : data.secondDayOfMonth,
      };

      // Step 4: Create the budget item
      const itemResult = await createBudgetItem(budgetItemData);

      if (!itemResult.success) {
        throw new Error(itemResult.error || "Failed to create budget item");
      }

      // Success - reset form and close dialog
      form.reset();
      setNewCategories([]);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setNewCategories([]);
      setError(null);
      setActiveTab("expense");
    }
  }, [open, form]);

  const categoryOptions = getCategoryOptions();
  const selectedCategoryValue = form.watch("category");
  
  // Convert category value to string for combobox
  // If it's a number (existing category ID), use the ID string
  // If it's a string (new category name), use it directly
  const categoryValueString = React.useMemo(() => {
    if (typeof selectedCategoryValue === "number") {
      return selectedCategoryValue.toString();
    }
    return selectedCategoryValue || "";
  }, [selectedCategoryValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add to Budget</DialogTitle>
          <DialogDescription>
            Create a new budget item by selecting a category or creating a new
            one.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as BudgetType)}
            >
              <label className="text-sm font-medium leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Type
              </label>
              <TabsList className="grid w-full grid-cols-3 mt-1">
                <TabsTrigger value="expense">Expense</TabsTrigger>
                <TabsTrigger value="savings">Savings</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Combobox
                          options={categoryOptions}
                          value={categoryValueString}
                          onValueChange={(value) => {
                            // Check if value exists in options (existing category ID)
                            const option = categoryOptions.find(
                              (opt) => opt.value === value
                            );
                            if (option) {
                              // It's an existing category, store as number (ID)
                              field.onChange(parseInt(value));
                            } else {
                              // It's a new category name, store as string
                              field.onChange(value);
                            }
                          }}
                          placeholder="Select or create a category..."
                          searchPlaceholder="Search categories..."
                          emptyText="No categories found."
                          createText={(input) => `Create "${input}"`}
                          allowCreate={true}
                          onCreate={handleCategoryCreate}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter item name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field} 
                          // No custom onChange needed anymore!
                          // React-hook-form handles the string updates automatically
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Payment Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value && !isNaN(new Date(field.value).getTime())
                              ? new Date(field.value).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            // Only update form state if it's a valid date
                            if (!isNaN(date.getTime())) {
                              field.onChange(date);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Tabs
                        onValueChange={field.onChange}
                        value={field.value}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="weekly">Weekly</TabsTrigger>
                          <TabsTrigger value="bi-weekly">Bi-Weekly</TabsTrigger>
                          <TabsTrigger value="semi-monthly">Semi-Monthly</TabsTrigger>
                          <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional Fields based on Frequency */}
                {(watchedFrequency === "weekly" ||
                  watchedFrequency === "bi-weekly") && (
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <FormControl>
                          <Tabs
                            value={field.value}
                            onValueChange={field.onChange}
                            className="w-full"
                          >
                            <TabsList className="grid w-full grid-cols-7">
                              {DAYS_OF_WEEK.map((day) => (
                                <TabsTrigger 
                                  key={day} 
                                  value={day} 
                                  className="px-0 text-xs sm:text-sm" // tighter padding for 7 items
                                >
                                  {day.substring(0, 3)} {/* "Mon", "Tue", etc. */}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </Tabs>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchedFrequency === "monthly" && (
                  <FormField
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Month</FormLabel>
                        <FormControl>
                          <DayOfMonthPicker
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* SEMI-MONTHLY: Side-by-side pickers */}
                {watchedFrequency === "semi-monthly" && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* 1st Day Picker */}
                    <FormField
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Payment Day</FormLabel>
                          <FormControl>
                            <DayOfMonthPicker
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 2nd Day Picker */}
                    <FormField
                      control={form.control}
                      name="secondDayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Second Payment Day</FormLabel>
                          <FormControl>
                            <DayOfMonthPicker
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Budget Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

