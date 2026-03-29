"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: "default" | "thin";
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    { className, variant = "default", trackClassName, rangeClassName, thumbClassName, ...props },
    ref
  ) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("group relative flex w-full touch-none items-center select-none", className)}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "bg-secondary relative w-full grow overflow-hidden rounded-full",
          variant === "thin" ? "h-[2px]" : "h-1 group-hover:h-1.5",
          trackClassName
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full transition-colors",
            rangeClassName ?? "bg-muted-foreground/60 group-hover:bg-brand"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "ring-offset-background focus-visible:ring-ring block rounded-full bg-current opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-active:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variant === "thin" ? "h-2.5 w-2.5" : "h-3 w-3",
          thumbClassName
        )}
      />
    </SliderPrimitive.Root>
  )
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
