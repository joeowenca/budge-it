"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, getOrdinal } from "@/lib/utils";

interface DayOfMonthPickerProps {
  value?: number;
  isLast?: boolean;
  isFirstPayment?: boolean;
  onChange: (day: number | undefined, isLast?: boolean) => void;
  disabled?: boolean;
}

export function DayOfMonthPicker({
  value,
  isLast,
  isFirstPayment,
  onChange,
  disabled = false,
}: DayOfMonthPickerProps) {
  const [open, setOpen] = useState(false);

  const displayText = isLast
    ? "Last Day"
    : value
    ? `${getOrdinal(value)}`
    : "Select Day";

  const handleDayClick = (dayValue: number) => {
    onChange(dayValue, false);
    setOpen(false);
  };

  const handleLastClick = () => {
    onChange(undefined, true);
    setOpen(false);
  };

  const isSelected = (dayValue: number | "last") => {
    if (dayValue === "last") return isLast;
    return value === dayValue && !isLast;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal h-10"
          disabled={disabled}
        >
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 rounded-2xl" align="center">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
            <Button
              key={day}
              variant={isSelected(day) ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 w-9 p-0",
                isSelected(day) && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </Button>
          ))}

          <Button
            variant={isSelected("last") ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-9 w-full col-span-7",
              isSelected("last") && "bg-primary text-primary-foreground",
              isFirstPayment && "hidden"
            )}
            onClick={handleLastClick}
          >
            Last
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
