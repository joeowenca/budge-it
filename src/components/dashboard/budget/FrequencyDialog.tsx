"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckIcon, XIcon } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const frequencyDialogSchema = z
  .object({
    frequency: frequencyTypeSchema,
    startDate: z.date(),
    biWeeklyStart: z.enum(["this", "next"]).default("this").optional(), 
    dayOfWeek: dayOfWeekTypeSchema.nullable().optional(),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    dayOfMonthIsLast: z.boolean().default(false),
    secondDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    secondDayOfMonthIsLast: z.boolean().nullable().default(false),
  })
  .superRefine((data, ctx) => {
    const F = frequencyTypeSchema.enum;

    if (data.frequency === F.weekly || data.frequency === F["bi-weekly"]) {
      if (!data.dayOfWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfWeek"],
          message: "Day of the week is required",
        });
      }
    }

    if (data.frequency === F.monthly) {
      if (!data.dayOfMonthIsLast && data.dayOfMonth == null) {
        ctx.addIssue({
          code: "custom",
          path: ["dayOfMonth"],
          message: "Day of the month is required",
        });
      }
    }

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
  itemName?: string;
  defaultValues: Partial<CreateBudgetItemType>;
  onSave: (data: FrequencyDialogValues) => void;
}

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function getBiWeeklyOptions(targetDayOfWeek: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date1 = getNextOccurrence(targetDayOfWeek, 0);
  const date2 = getNextOccurrence(targetDayOfWeek, 1);

  const formatOption = (date: Date, isSecondOption: boolean) => {
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const fullDay = date.toLocaleDateString("en-US", { weekday: "long" });
    const shortDay = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    let prefix = "";

    if (diffDays === 0) prefix = "Today";
    else if (diffDays === 1) prefix = "Tomorrow";
    else if (diffDays < 7) {
        const currentDayIndex = today.getDay(); 
        const targetDayIndex = date.getDay();
        if (targetDayIndex < currentDayIndex) prefix = "Next";
        else prefix = "This";
    } else {
        prefix = "Next";
    }

    if (isSecondOption) {
        prefix = "Following"; 
    }

    const isTodayOrTomorrow = prefix === "Today" || prefix === "Tomorrow";

    return {
      tabLabel: { 
        prefix, 
        shortDay: isTodayOrTomorrow ? "" : shortDay, 
        fullDay: isTodayOrTomorrow ? "" : fullDay 
      },

      dateLabel: dateStr
    };
  };

  return {
    option1: formatOption(date1, false),
    option2: formatOption(date2, true),
  };
}

function getNextOccurrence(dayName: string, offsetWeeks: number = 0): Date {
  const targetDayIndex = DAY_MAP[dayName.toLowerCase()];
  
  const date = new Date();
  
  date.setHours(0, 0, 0, 0);

  if (targetDayIndex === undefined) return date;

  const currentDayIndex = date.getDay();

  let diff = targetDayIndex - currentDayIndex;

  if (diff < 0) {
    diff += 7;
  }

  date.setDate(date.getDate() + diff);

  if (offsetWeeks > 0) {
    date.setDate(date.getDate() + (offsetWeeks * 7));
  }

  return date;
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
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
  
  let startDate = coerceDate(defaults.startDate) ?? new Date();
  startDate.setHours(0, 0, 0, 0);

  const dayOfMonthIsLast = defaults.dayOfMonthIsLast ?? false;
  const secondDayOfMonthIsLast = defaults.secondDayOfMonthIsLast ?? false;

  const dayOfWeek =
    defaults.dayOfWeek ??
    (frequency === "weekly" || frequency === "bi-weekly" ? "monday" : null);

  let biWeeklyStart: "this" | "next" = "this";
  
  if (frequency === "bi-weekly" && dayOfWeek) {
    const nextCycleDate = getNextOccurrence(dayOfWeek, 1);
    
    if (isSameDay(startDate, nextCycleDate)) {
      biWeeklyStart = "next";
    }
  }

  return {
    frequency,
    startDate,
    biWeeklyStart,
    dayOfWeek,
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

const DAY_OF_WEEK_LABELS: Record<string, string> = {
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
  itemName,
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

  const watchedFrequency = useWatch({ control: form.control, name: "frequency" });
  const watchedDayOfWeek = useWatch({ control: form.control, name: "dayOfWeek" });
  const watchedBiWeeklyStart = useWatch({ control: form.control, name: "biWeeklyStart" });
  
  const watchedDayOfMonthIsLast = useWatch({
    control: form.control,
    name: "dayOfMonthIsLast",
  });
  const watchedSecondDayOfMonthIsLast = useWatch({
    control: form.control,
    name: "secondDayOfMonthIsLast",
  });

  useEffect(() => {
    if (watchedFrequency === 'bi-weekly' && watchedDayOfWeek && watchedBiWeeklyStart) {
        const offset = watchedBiWeeklyStart === 'next' ? 1 : 0;
        const newStartDate = getNextOccurrence(watchedDayOfWeek, offset);

        form.setValue("startDate", newStartDate);
    }
  }, [watchedFrequency, watchedDayOfWeek, watchedBiWeeklyStart, form]);

  useEffect(() => {
    const F = frequencyTypeSchema.enum;
    if (!watchedFrequency) return;

    if (watchedFrequency === F.weekly || watchedFrequency === F["bi-weekly"]) {
      if (form.getValues("dayOfWeek") == null) {
        form.setValue("dayOfWeek", "monday", { shouldValidate: true });
      }

      if (watchedFrequency === F["bi-weekly"] && !form.getValues("biWeeklyStart")) {
         form.setValue("biWeeklyStart", "this");
      }

      form.setValue("dayOfMonth", 1, { shouldValidate: true });
      form.setValue("dayOfMonthIsLast", false, { shouldValidate: true });
      form.setValue("secondDayOfMonth", 15, { shouldValidate: true });
      form.setValue("secondDayOfMonthIsLast", false, { shouldValidate: true });
      return;
    }

    if (watchedFrequency === F["semi-monthly"]) {
      form.setValue("dayOfWeek", null, { shouldValidate: true });
    }
  }, [watchedFrequency, form]);

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
  const isBiWeekly = watchedFrequency === "bi-weekly";

  const { option1, option2 } = useMemo(
    () => getBiWeeklyOptions(watchedDayOfWeek || "monday"),
    [watchedDayOfWeek]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="font-black text-2xl">Schedule</DialogTitle>
          <DialogDescription>
            Set the schedule for your <b className="text-black font-medium">{itemName && itemName.length > 0 && itemName}</b> {!itemName && "your payment"}
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
                      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                        {frequencyTypeSchema.options.map((f) => (
                          <TabsTrigger key={f} value={f} className="text-sm py-1.5">
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
                      isBiWeekly ? " second" : ""
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
                              className="py-1.5 h-full text-sm"
                            >
                              <span className="sm:hidden">
                                {DAY_OF_WEEK_LABELS[d].charAt(0)}
                              </span>
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

            {isBiWeekly && (
              <FormField
                control={form.control}
                name="biWeeklyStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Starting</FormLabel>
                    <FormControl>
                      <Tabs
                        value={field.value}
                        onValueChange={field.onChange}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2 h-10">
                          <TabsTrigger value="this" className="py-1.5">
                             <span className="sm:hidden">
                                {option1.tabLabel.prefix} {option1.tabLabel.shortDay}
                             </span>
                             <span className="hidden sm:inline">
                                {option1.tabLabel.prefix} {option1.tabLabel.fullDay}
                             </span>
                          </TabsTrigger>

                          <TabsTrigger value="next" className="py-1.5">
                             <span className="sm:hidden">
                                {option2.tabLabel.prefix} {option2.tabLabel.shortDay}
                             </span>
                             <span className="hidden sm:inline">
                                {option2.tabLabel.prefix} {option2.tabLabel.fullDay}
                             </span>
                          </TabsTrigger>
                        </TabsList>

                        <div className="grid grid-cols-2 pt-1">
                           <div className={`text-center text-sm font-medium transition-colors ${
                             field.value === 'this' ? "text-primary" : "text-muted-foreground"
                           }`}>
                              {option1.dateLabel}
                           </div>
                           <div className={`text-center text-sm font-medium transition-colors ${
                             field.value === 'next' ? "text-primary" : "text-muted-foreground"
                           }`}>
                              {option2.dateLabel}
                           </div>
                        </div>

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
                          form.setValue("dayOfMonth", day ?? null);
                          form.setValue("dayOfMonthIsLast", Boolean(isLast));
                          form.trigger("dayOfMonth");
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
                          isFirstPayment={true}
                          onChange={(day, isLast) => {
                            form.setValue("dayOfMonth", day ?? null);
                            form.setValue("dayOfMonthIsLast", Boolean(isLast));
                            form.trigger(["dayOfMonth", "secondDayOfMonth"]);
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
                            form.setValue("secondDayOfMonth", day ?? null);
                            form.setValue("secondDayOfMonthIsLast", Boolean(isLast));
                            form.trigger(["dayOfMonth", "secondDayOfMonth"]);
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
                type="button"
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