"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { DayOfMonthPicker } from "@/components/dashboard/budget/DayOfMonthPicker";
import {
  dayOfWeekTypeSchema,
  frequencyTypeSchema,
  type CreateBudgetItemType,
} from "@/db/schema";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const frequencyDialogSchema = z
  .object({
    frequency: frequencyTypeSchema,
    startDate: z.date(),
    dayOfWeek: dayOfWeekTypeSchema.nullable().optional(),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    dayOfMonthIsLast: z.boolean().default(false),
    secondDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    secondDayOfMonthIsLast: z.boolean().nullable().default(false),
  })
  .superRefine((data, ctx) => {
    const F = frequencyTypeSchema.enum;

    /* Weekly / Bi-weekly */
    if (data.frequency === F.weekly || data.frequency === F["bi-weekly"]) {
      if (!data.dayOfWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfWeek"],
          message: "Day of the week is required for this frequency",
        });
      }
    }

    /* Monthly */
    if (data.frequency === F.monthly) {
      if (!data.dayOfMonthIsLast && data.dayOfMonth == null) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfMonth"],
          message: "Day of the month is required unless using last day",
        });
      }
    }

    /* Semi-monthly */
    if (data.frequency === F["semi-monthly"]) {
      if (!data.dayOfMonthIsLast && data.dayOfMonth == null) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfMonth"],
          message: "First payment day is required",
        });
      }

      if (!data.secondDayOfMonthIsLast && data.secondDayOfMonth == null) {
        ctx.addIssue({
          code: "custom",
          path: ["secondDayOfMonth"],
          message: "Second payment day is required",
        });
      }

      // Ordering rule
      if (
        !data.dayOfMonthIsLast &&
        !data.secondDayOfMonthIsLast &&
        data.dayOfMonth != null &&
        data.secondDayOfMonth != null &&
        data.secondDayOfMonth <= data.dayOfMonth
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["secondDayOfMonth"],
          message: "Second payment day must be after the first",
        });
      }
    }
  });

type FrequencyDialogFormValues = z.input<typeof frequencyDialogSchema>;
type FrequencyDialogValues = z.output<typeof frequencyDialogSchema>;

interface FrequencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: Partial<CreateBudgetItemType>;
  onSave: (data: FrequencyDialogValues) => void;
}

function coerceDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

function normalizeDefaults(
  defaults: Partial<CreateBudgetItemType>
): FrequencyDialogFormValues {
  const frequency = defaults.frequency ?? "weekly";
  const startDate = coerceDate(defaults.startDate) ?? new Date();

  const dayOfMonthIsLast = defaults.dayOfMonthIsLast ?? false;
  const secondDayOfMonthIsLast = defaults.secondDayOfMonthIsLast ?? false;

  return {
    frequency,
    startDate,
    dayOfWeek:
      defaults.dayOfWeek ??
      (frequency === "weekly" || frequency === "bi-weekly" ? "monday" : null),
    dayOfMonth: dayOfMonthIsLast ? null : (defaults.dayOfMonth ?? null),
    dayOfMonthIsLast,
    secondDayOfMonth: secondDayOfMonthIsLast
      ? null
      : (defaults.secondDayOfMonth ?? null),
    secondDayOfMonthIsLast,
  };
}

const FREQUENCY_LABELS: Record<FrequencyDialogValues["frequency"], string> = {
  weekly: "Weekly",
  "bi-weekly": "Bi-Weekly",
  "semi-monthly": "Semi-Monthly",
  monthly: "Monthly",
};

const DAY_OF_WEEK_LABELS: Record<
  NonNullable<FrequencyDialogValues["dayOfWeek"]>,
  string
> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function FrequencyDialog({
  open,
  onOpenChange,
  defaultValues,
  onSave,
}: FrequencyDialogProps) {
  const normalizedDefaults = useMemo(
    () => normalizeDefaults(defaultValues),
    [defaultValues]
  );

  const form = useForm<FrequencyDialogFormValues>({
    resolver: zodResolver(frequencyDialogSchema),
    defaultValues: normalizedDefaults,
  });

  const watchedFrequency = useWatch({
    control: form.control,
    name: "frequency",
  });

  const watchedDayOfMonthIsLast = useWatch({
    control: form.control,
    name: "dayOfMonthIsLast",
  });

  const watchedSecondDayOfMonthIsLast = useWatch({
    control: form.control,
    name: "secondDayOfMonthIsLast",
  });

  // Reset hidden fields when frequency changes
  useEffect(() => {
    const F = frequencyTypeSchema.enum;

    if (!watchedFrequency) return;

    if (watchedFrequency === F.weekly || watchedFrequency === F["bi-weekly"]) {
      if (form.getValues("dayOfWeek") == null) {
        form.setValue("dayOfWeek", "monday", { shouldValidate: true });
      }
      form.setValue("dayOfMonth", null, { shouldValidate: true });
      form.setValue("dayOfMonthIsLast", false, { shouldValidate: true });
      form.setValue("secondDayOfMonth", null, { shouldValidate: true });
      form.setValue("secondDayOfMonthIsLast", false, { shouldValidate: true });
      return;
    }

    if (watchedFrequency === F.monthly) {
      form.setValue("dayOfWeek", null, { shouldValidate: true });
      form.setValue("secondDayOfMonth", null, { shouldValidate: true });
      form.setValue("secondDayOfMonthIsLast", false, { shouldValidate: true });
      return;
    }

    if (watchedFrequency === F["semi-monthly"]) {
      form.setValue("dayOfWeek", null, { shouldValidate: true });
    }
  }, [watchedFrequency, form]);

  // When the dialog opens, reset to incoming defaults
  useEffect(() => {
    if (open) {
      form.reset(normalizedDefaults);
    }
  }, [open, normalizedDefaults, form]);

  const handleSubmit = (data: FrequencyDialogFormValues) => {
    const parsed = frequencyDialogSchema.parse(data);
    onSave(parsed);
    onOpenChange(false);
  };

  const isWeeklyLike =
    watchedFrequency === "weekly" || watchedFrequency === "bi-weekly";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="font-black text-2xl">Schedule</DialogTitle>
          <DialogDescription>
            Set the schedule for your payment
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">How often?</FormLabel>
                  <FormControl>
                    <Tabs
                      onValueChange={(v) =>
                        field.onChange(v as FrequencyDialogValues["frequency"])
                      }
                      value={field.value}
                      className="w-full"
                    >
                      {/* Mobile: grid-cols-2 (2 rows of 2) 
                        Desktop: grid-cols-4 (1 row of 4) 
                        h-auto: allows the container to expand vertically for the 2 rows
                      */}
                      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                        {frequencyTypeSchema.options.map((f) => (
                          <TabsTrigger
                            key={f}
                            value={f}
                            className="text-sm py-1.5"
                          >
                            {FREQUENCY_LABELS[f]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isWeeklyLike && (
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">{`Every${
                      watchedFrequency === "bi-weekly" ? " second" : ""
                    }`}</FormLabel>
                    <FormControl>
                      <Tabs
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-7 h-10">
                          {dayOfWeekTypeSchema.options.map((d) => (
                            <TabsTrigger
                              key={d}
                              value={d}
                              // px-0 removes internal padding so the letter can center in the narrow column
                              className="py-1.5 h-full text-sm"
                            >
                              {/* Mobile: Show only first letter (M, T, W...) */}
                              <span className="sm:hidden">
                                {DAY_OF_WEEK_LABELS[d].charAt(0)}
                              </span>
                              
                              {/* Desktop: Show 3 letters (Mon, Tue...) */}
                              <span className="hidden sm:inline">
                                {DAY_OF_WEEK_LABELS[d].slice(0, 3)}
                              </span>
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
                    <FormLabel className="text-md">Every</FormLabel>
                    <FormControl>
                      <DayOfMonthPicker
                        value={field.value ?? undefined}
                        isLast={watchedDayOfMonthIsLast ?? false}
                        onChange={(day, isLast) => {
                          form.setValue("dayOfMonth", day ?? null, {
                            shouldValidate: true,
                          });
                          form.setValue("dayOfMonthIsLast", Boolean(isLast), {
                            shouldValidate: true,
                          });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedFrequency === "semi-monthly" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md">Every</FormLabel>
                      <FormControl>
                        <DayOfMonthPicker
                          value={field.value ?? undefined}
                          isLast={watchedDayOfMonthIsLast ?? false}
                          onChange={(day, isLast) => {
                            form.setValue("dayOfMonth", day ?? null, {
                              shouldValidate: true,
                            });
                            form.setValue(
                              "dayOfMonthIsLast",
                              Boolean(isLast),
                              { shouldValidate: true }
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondDayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md">And</FormLabel>
                      <FormControl>
                        <DayOfMonthPicker
                          value={field.value ?? undefined}
                          isLast={watchedSecondDayOfMonthIsLast ?? false}
                          onChange={(day, isLast) => {
                            form.setValue("secondDayOfMonth", day ?? null, {
                              shouldValidate: true,
                            });
                            form.setValue(
                              "secondDayOfMonthIsLast",
                              Boolean(isLast),
                              { shouldValidate: true }
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="sm:flex-row flex-row gap-2 pt-6">
              <Button
                type="submit"
                variant="ghost"
                size="icon-lg"
                onClick={() => onOpenChange(false)}
                className="p-1.5 mr-2 text-red-500 bg-muted hover:text-white hover:bg-red-500 rounded-full transition-all cursor-pointer"
              >
                <XIcon className="size-7" strokeWidth={2.75} />
              </Button>
              <Button
                type="submit"
                variant="ghost"
                size="icon-lg"
                className="p-1.5 text-green-500 bg-muted hover:text-white hover:bg-green-500 rounded-full transition-all cursor-pointer"
              >
                <CheckIcon className="size-7" strokeWidth={3} />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

