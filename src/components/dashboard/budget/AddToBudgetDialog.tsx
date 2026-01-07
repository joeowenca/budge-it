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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox } from "@/components/ui/combobox";
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
    amount: z.number().int().min(0),
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

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

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
      amount: 0,
      frequency: "monthly",
      startDate: new Date(),
      dayOfWeek: undefined,
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
        amount: data.amount,
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
              <TabsList className="grid w-full grid-cols-3">
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
                      <FormLabel>Amount (cents)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="semi-monthly">
                            Semi-Monthly
                          </SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS_OF_MONTH.map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                            <SelectItem value="Last">Last</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchedFrequency === "semi-monthly" && (
                  <>
                    <FormField
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Day</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select first day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAYS_OF_MONTH.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondDayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Second Day</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select second day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAYS_OF_MONTH.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                              <SelectItem value="Last">Last</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
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

