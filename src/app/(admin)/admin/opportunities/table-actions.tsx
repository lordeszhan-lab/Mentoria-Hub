"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Archive, Trash2 } from "lucide-react";

interface TableActionsProps {
  id: string;
  archive: (id: string) => Promise<void | { error: string }>;
  del: (id: string) => Promise<void | { error: string }>;
}

export function OpportunitiesTableActions({ id, archive, del }: TableActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const baseCls =
    "flex items-center justify-center size-7 rounded-md text-muted-foreground disabled:opacity-40 transition-colors duration-150 motion-reduce:transition-none";

  return (
    <div className="flex items-center gap-0.5 justify-end">
      <Link
        href={`/admin/opportunities/${id}/edit`}
        className={`${baseCls} hover:bg-muted hover:text-foreground`}
        aria-label="Edit"
      >
        <Pencil size={13} strokeWidth={1.6} aria-hidden />
      </Link>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const res = await archive(id);
            if (res && "error" in res) {
              toast.error(res.error);
            } else {
              toast.success("Archived");
              router.refresh();
            }
          });
        }}
        className={`${baseCls} hover:bg-muted hover:text-foreground`}
        aria-label="Archive"
      >
        <Archive size={13} strokeWidth={1.6} aria-hidden />
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Permanently delete this opportunity? This cannot be undone.")) return;
          startTransition(async () => {
            const res = await del(id);
            if (res && "error" in res) {
              toast.error(res.error);
            } else {
              toast.success("Deleted");
              router.refresh();
            }
          });
        }}
        className={`${baseCls} hover:bg-destructive/8 hover:text-destructive`}
        aria-label="Delete"
      >
        <Trash2 size={13} strokeWidth={1.6} aria-hidden />
      </button>
    </div>
  );
}
