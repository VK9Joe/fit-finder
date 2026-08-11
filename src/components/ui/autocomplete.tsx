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
import { useVisibleViewport } from "@/hooks/useVisibleViewport";

export interface AutocompleteOption {
  value: string;
  label: string;
}

const LIST_MAX_HEIGHT = 300;
const LIST_MIN_HEIGHT = 96;
/** Search row plus the content's own border/offset, above the scrolling list. */
const POPOVER_CHROME = 60;
const EDGE_MARGIN = 8;

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
  const [placement, setPlacement] = React.useState<{
    side: "top" | "bottom";
    listMaxHeight: number;
  }>({ side: "bottom", listMaxHeight: LIST_MAX_HEIGHT });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const getVisibleBand = useVisibleViewport();

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
  };

  /**
   * Open on whichever side has room in the *visible* area and size the list to
   * fit it, so the breed list never lands off screen. Radix can't work this out
   * on its own inside the Shopify embed: the parent stretches the iframe to our
   * full content height, so our viewport is the entire page and its collision
   * detection sees room everywhere.
   */
  const measurePlacement = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const band = getVisibleBand();
    const below = band.bottom - rect.bottom - EDGE_MARGIN;
    const above = rect.top - band.top - EDGE_MARGIN;

    const side = below >= LIST_MAX_HEIGHT + POPOVER_CHROME || below >= above ? "bottom" : "top";
    const available = (side === "bottom" ? below : above) - POPOVER_CHROME;

    setPlacement({
      side,
      listMaxHeight: Math.round(
        Math.min(LIST_MAX_HEIGHT, Math.max(LIST_MIN_HEIGHT, available))
      ),
    });
  }, [getVisibleBand]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) measurePlacement();
    setOpen(newOpen);
  };

  /**
   * cmdk highlights the first item as soon as the list mounts and calls
   * `scrollIntoView({ block: "nearest" })` on it. That walks *every* scrollable
   * ancestor, and inside the iframe the only one able to move is the parent
   * Shopify page — so opening the dropdown dragged the breed field down to the
   * bottom of the window and pushed the list off screen. `preventScroll` does
   * not apply to `scrollIntoView`, so keep the scrolling inside the list.
   */
  const containScroll = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    node.scrollIntoView = () => {
      const list = node.closest<HTMLElement>('[data-slot="command-list"]');
      if (!list) return;

      const item = node.getBoundingClientRect();
      const bounds = list.getBoundingClientRect();
      if (item.top < bounds.top) {
        list.scrollTop -= bounds.top - item.top;
      } else if (item.bottom > bounds.bottom) {
        list.scrollTop += item.bottom - bounds.bottom;
      }
    };
  }, []);

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
        side={placement.side}
        avoidCollisions={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const target = e.currentTarget as HTMLElement;
          setTimeout(() => {
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
          <CommandList style={{ maxHeight: placement.listMaxHeight }}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  ref={containScroll}
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
