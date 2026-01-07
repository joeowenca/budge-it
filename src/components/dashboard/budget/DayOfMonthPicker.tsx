import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayOfMonthPickerProps {
  value?: number; // 1-31
  isLast?: boolean; // whether 'Last Day' is selected
  onChange: (day: number | undefined, isLast?: boolean) => void;
  disabled?: boolean;
}

export function DayOfMonthPicker({
  value,
  isLast,
  onChange,
  disabled = false,
}: DayOfMonthPickerProps) {
  const displayText = isLast
    ? "Last Day"
    : value
    ? `Day ${value}`
    : "Select Day";

  const handleDayClick = (dayValue: number) => {
    onChange(dayValue, false); // picking a day sets isLast = false
  };

  const handleLastClick = () => {
    onChange(undefined, true); // last day selected
  };

  const isSelected = (dayValue: number | "last") => {
    if (dayValue === "last") return isLast;
    return value === dayValue && !isLast;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          disabled={disabled}
        >
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
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
              isSelected("last") && "bg-primary text-primary-foreground"
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
