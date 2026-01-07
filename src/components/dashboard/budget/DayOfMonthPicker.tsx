"use client";

import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayOfMonthPickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DayOfMonthPicker({
  value,
  onChange,
  disabled = false,
}: DayOfMonthPickerProps) {
  const displayValue = value || "";
  const displayText =
    displayValue === "Last"
      ? "Last Day"
      : displayValue === "0"
      ? "Last Day"
      : displayValue
      ? `Day ${displayValue}`
      : "Select Day";

  const handleDayClick = (dayValue: string) => {
    onChange(dayValue);
  };

  const isSelected = (dayValue: string | number) => {
    if (dayValue === "Last") {
      return value === "Last" || value === "0";
    }
    return value === String(dayValue);
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
          {/* Render days 1-31 */}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <Button
              key={day}
              variant={isSelected(day) ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 w-9 p-0",
                isSelected(day) && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleDayClick(String(day))}
            >
              {day}
            </Button>
          ))}
          {/* Render "Last" button */}
          <Button
            variant={isSelected("Last") ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-9 w-full col-span-7",
              isSelected("Last") && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleDayClick("Last")}
          >
            Last
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

