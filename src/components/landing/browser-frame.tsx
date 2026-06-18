import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  children: React.ReactNode;
  className?: string;
  url?: string;
}

export function BrowserFrame({
  children,
  className,
  url = "app.mentoriahub.kz",
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface shadow-card",
        className
      )}
    >
      {/* Chrome bar */}
      <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1.5 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex h-5 min-w-0 max-w-[180px] items-center justify-center rounded-full border border-border bg-canvas px-3">
            <span className="truncate text-[10px] font-medium text-fg-faint">
              {url}
            </span>
          </div>
        </div>
        <div className="w-9 shrink-0" />
      </div>
      {/* Content area */}
      {children}
    </div>
  );
}
