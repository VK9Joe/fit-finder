"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onValueChange: (value: string) => void;
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  onSearch,
  placeholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
  error = false,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
  };

  // Prevent scroll when opening in iframe
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && triggerRef.current) {
      // Store current scroll position
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      setOpen(newOpen);
      
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
    } else {
      setOpen(newOpen);
    }
  };

  const handleSearchChange = (search: string) => {
    setSearchValue(search);
    onSearch(search);
  };

  // Clear search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  const displayValue = React.useMemo(() => {
    if (value) {
      const selectedOption = options.find(option => option.value === value);
      return selectedOption?.label || value;
    }
    return "";
  }, [value, options]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12 px-4 text-left font-normal bg-white text-gray-900 border-gray-300 hover:border-gray-400",
            !value && "text-gray-500",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => {
          // Prevent focus from scrolling the page
          e.preventDefault();
          // Manually focus the input after a brief delay
          setTimeout(() => {
            const target = e.currentTarget as HTMLElement;
            const input = target.querySelector('input');
            if (input) {
              input.focus({ preventScroll: true });
            }
          }, 0);
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search breeds..."
            value={searchValue}
            onValueChange={handleSearchChange}
            className="h-12 border-0 focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
