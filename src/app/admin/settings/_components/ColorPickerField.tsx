"use client";

import { Input } from "@/components/ui/input";

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

export function ColorPickerField({ label, value, onChange, hint }: ColorPickerFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-foreground text-sm font-medium">{label}</label>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
        />
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          placeholder="#e11d48"
          className="w-32 font-mono text-sm"
        />
        <div className="h-10 w-20 rounded-md border" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}
