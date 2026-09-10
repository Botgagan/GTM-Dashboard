import React from 'react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface AdvancedFilterSheetProps {
  title?: string;
  description?: string;
  triggerText?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function AdvancedFilterSheet({
  title = "Advanced Filters",
  description = "Apply specific filters to refine your view.",
  triggerText = "Filters",
  open,
  onOpenChange,
  onApply,
  onClear,
  children
}: AdvancedFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={<Button variant="outline" size="sm" className="h-9 px-3 gap-2" />} >
        <Filter className="w-4 h-4" /> {triggerText}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
          {children}
        </div>
        
        <SheetFooter className="gap-2 sm:justify-end sm:flex-row flex-col">
          <Button variant="outline" onClick={() => { onClear(); onOpenChange(false); }}>Clear All</Button>
          <Button onClick={() => { onApply(); onOpenChange(false); }}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
