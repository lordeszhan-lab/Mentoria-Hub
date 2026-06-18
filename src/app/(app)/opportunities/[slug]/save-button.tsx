"use client";

import { useState, useEffect, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleSave } from "@/server/opportunities/actions";

interface SaveButtonProps {
  opportunityId: string;
  initialSaved: boolean;
}

export function SaveButton({ opportunityId, initialSaved }: SaveButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Local state — doesn't auto-revert after transition like useOptimistic does.
  // Synced to the authoritative server value after each router.refresh().
  const [saved, setSaved] = useState(initialSaved);
  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  function handleSave() {
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      const result = await toggleSave(opportunityId);
      if (result.error) {
        setSaved(!next); // revert on failure
        toast.error("Could not update saved state");
      } else {
        toast.success(result.saved ? "Saved to your list!" : "Removed from saved");
        router.refresh(); // re-fetch so initialSaved prop stays in sync on next render
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isPending}
      aria-label={saved ? "Unsave opportunity" : "Save opportunity"}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm border transition-all active:scale-95",
        saved
          ? "bg-brand border-brand text-white hover:bg-[--color-brand-strong]"
          : "bg-[--color-surface] border-[--color-border] text-[--color-fg] hover:border-brand hover:text-brand",
      )}
    >
      <Heart
        size={16}
        strokeWidth={2}
        fill={saved ? "currentColor" : "none"}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
