"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddToBudgetDialog } from "./AddToBudgetDialog";
import { Plus } from "lucide-react";

export function AddToBudgetDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add to Budget
      </Button>
      <AddToBudgetDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

