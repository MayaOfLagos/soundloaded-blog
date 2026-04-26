"use client";

import * as React from "react";
import rawCountries from "world-countries";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const COUNTRIES = rawCountries
  .map((c) => ({ label: c.name.common, value: c.name.common, flag: c.flag, cca2: c.cca2 }))
  .sort((a, b) => {
    // Nigeria first, then alphabetical
    if (a.cca2 === "NG") return -1;
    if (b.cca2 === "NG") return 1;
    return a.label.localeCompare(b.label);
  });

interface CountryPickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CountryPicker({ value, onChange, error, disabled }: CountryPickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = COUNTRIES.find((c) => c.value.toLowerCase() === (value ?? "").toLowerCase());

  return (
    <div className="space-y-0.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "border-input bg-background h-[42px] w-full justify-between px-3 text-sm font-normal",
              !selected && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {selected ? (
                <>
                  <span>{selected.flag}</span>
                  <span className="truncate">{selected.label}</span>
                </>
              ) : (
                "Country"
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.cca2}
                    value={country.label}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : country.value);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2">{country.flag}</span>
                    {country.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value?.toLowerCase() === country.value.toLowerCase()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}
