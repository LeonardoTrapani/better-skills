import { cn } from "@/lib/utils";

export function VaultColorHex({ color, className }: { color: string | null; className?: string }) {
  if (!color) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("block size-3 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <polygon
        points="12,2.5 20,7.25 20,16.75 12,21.5 4,16.75 4,7.25"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
}
