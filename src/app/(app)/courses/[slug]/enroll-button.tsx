"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { enroll } from "@/server/courses/actions";

export function EnrollButton({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleEnroll() {
    startTransition(async () => {
      try {
        await enroll(courseId);
      } catch {
        toast.error("Could not enroll. Please try again.");
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleEnroll}
      disabled={isPending}
      className="h-11 w-full rounded-full text-sm font-semibold text-white bg-brand hover:bg-brand-strong active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:cursor-wait"
    >
      {isPending ? "Enrolling…" : "Enroll for free"}
    </button>
  );
}
