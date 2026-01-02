"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  createText?: (input: string) => string
  allowCreate?: boolean
  onCreate?: (value: string) => Promise<void> | void
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  createText = (input: string) => `Create "${input}"`,
  allowCreate = true,
  onCreate,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  // Include current value as an option if it exists but isn't in the options list
  const optionsWithCurrentValue = React.useMemo(() => {
    if (!value || selectedOption) {
      return options
    }
    // Add current value as a temporary option
    return [...options, { value, label: value }]
  }, [options, value, selectedOption])

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) {
      return optionsWithCurrentValue
    }
    const lowerSearch = searchValue.toLowerCase()
    return optionsWithCurrentValue.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch)
    )
  }, [optionsWithCurrentValue, searchValue])

  // Check if we should show create option
  const shouldShowCreate = React.useMemo(() => {
    if (!allowCreate || !searchValue.trim()) {
      return false
    }
    const lowerSearch = searchValue.toLowerCase()
    return !optionsWithCurrentValue.some(
      (option) => option.label.toLowerCase() === lowerSearch
    )
  }, [optionsWithCurrentValue, searchValue, allowCreate])

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === value) {
      onValueChange("")
    } else {
      onValueChange(selectedValue)
    }
    setOpen(false)
    setSearchValue("")
  }

  const handleCreate = async () => {
    // Use searchValue directly to preserve the exact input (including spaces)
    const newValue = searchValue.trim()
    if (onCreate) {
      await onCreate(newValue)
    }
    onValueChange(newValue)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedOption ? selectedOption.label : (value || placeholder)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: "var(--radix-popover-trigger-width)" }} className="p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {shouldShowCreate && (
                <CommandItem
                  key={`create-${searchValue.trim()}`}
                  value={searchValue.trim()}
                  onSelect={handleCreate}
                  className="text-primary font-medium"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  {createText(searchValue.trim())}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

