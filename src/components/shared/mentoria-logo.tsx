import { cn } from "@/lib/utils";

/**
 * Mentoria Hub logo + wordmark. Mirrors Seobloom's logo component.
 *
 * The mark is a rounded square with an "M" — uses the brand green as the
 * single accent (consistent with the monochrome landing where green is the
 * ONLY color). The wordmark renders "Mentoria" in foreground + "Hub" in brand.
 */

export function MentoriaLogo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      M
    </span>
  );
}

export function MentoriaWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <MentoriaLogo size={26} />
      <span className="font-bold tracking-tight">
        <span className="text-foreground">Mentoria</span>{" "}
        <span className="text-brand">Hub</span>
      </span>
    </span>
  );
}
