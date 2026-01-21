"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { DayOfMonthPicker } from "@/components/dashboard/budget/DayOfMonthPicker";
import {
  createBudgetItemSchema,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const frequencyDialogSchema = createBudgetItemSchema.pick({
  frequency: true,
  startDate: true,
  dayOfWeek: true,
  dayOfMonth: true,
  dayOfMonthIsLast: true,
  secondDayOfMonth: true,
  secondDayOfMonthIsLast: true,
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
        <DialogHeader>
          <DialogTitle>Schedule</DialogTitle>
          <DialogDescription>
            Configure when this budget item occurs.
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
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange(v as FrequencyDialogValues["frequency"])
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencyTypeSchema.options.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FREQUENCY_LABELS[f]}
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(d) => {
                          if (d) field.onChange(d);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <FormLabel>Day of Week</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dayOfWeekTypeSchema.options.map((d) => (
                          <SelectItem key={d} value={d}>
                            {DAY_OF_WEEK_LABELS[d]}
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
                      <FormLabel>Payment 1</FormLabel>
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
                      <FormLabel>Payment 2</FormLabel>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

