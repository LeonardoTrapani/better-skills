import { cn } from "@/lib/utils";

type LandingWindowHeaderProps = {
  label: string;
  className?: string;
  labelClassName?: string;
};

export function LandingWindowHeader({
  label,
  className,
  labelClassName,
}: LandingWindowHeaderProps) {
  return (
    <div className={cn("flex border-b border-border", className)}>
      <div className="flex w-auto items-center gap-2 border-r border-border px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
        <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
        <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
      </div>
      <div
        className={cn(
          "px-5 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground sm:px-6 sm:py-4",
          labelClassName,
        )}
      >
        {label}
      </div>
    </div>
  );
}
