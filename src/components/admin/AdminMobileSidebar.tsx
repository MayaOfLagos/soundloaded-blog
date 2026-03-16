"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
import type { AdminLogo } from "./AdminSidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function AdminMobileSidebar({
  open,
  onOpenChange,
  logo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logo?: AdminLogo;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="bg-sidebar border-sidebar-border w-64 p-0">
        <VisuallyHidden>
          <SheetTitle>Navigation</SheetTitle>
        </VisuallyHidden>
        <AdminSidebar onNavigate={() => onOpenChange(false)} logo={logo} />
      </SheetContent>
    </Sheet>
  );
}
