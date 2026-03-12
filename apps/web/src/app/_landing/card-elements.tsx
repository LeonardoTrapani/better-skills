import { cn } from "@/lib/utils";

export const CARD_EYEBROW_CLASS =
  "pb-1 text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground/65";

export function CardDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className="h-px flex-1 bg-border/70 transition-colors duration-200" />
      <span
        className="inline-block h-2 w-2 rounded-xs border border-border bg-background transition-colors duration-200"
        aria-hidden="true"
      />
    </div>
  );
}
