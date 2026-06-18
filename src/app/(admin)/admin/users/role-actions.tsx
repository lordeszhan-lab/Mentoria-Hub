"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserRole } from "@/lib/supabase/types";

interface UserRoleActionsProps {
  userId: string;
  currentRole: UserRole;
  updateRole: (userId: string, role: "student" | "mentor" | "admin") => Promise<void | { error: string }>;
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "student", label: "Student" },
  { value: "mentor", label: "Mentor" },
  { value: "admin", label: "Admin" },
];

export function UserRoleActions({
  userId,
  currentRole,
  updateRole,
}: UserRoleActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as UserRole;
    if (newRole === currentRole) return;

    if (newRole === "admin" && !confirm(`Grant admin access to this user?`)) {
      e.target.value = currentRole;
      return;
    }

    startTransition(async () => {
      const res = await updateRole(userId, newRole);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success(`Role updated to ${newRole}`);
        router.refresh();
      }
    });
  }

  return (
    <select
      defaultValue={currentRole}
      disabled={isPending}
      onChange={handleChange}
      className="h-7 px-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60 transition-all duration-200 cursor-pointer hover:bg-muted"
      aria-label="Change role"
    >
      {ROLE_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
