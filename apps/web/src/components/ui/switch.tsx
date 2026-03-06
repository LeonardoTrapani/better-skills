"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-none border border-border bg-input/30 p-0.5 outline-none transition-colors data-checked:bg-primary/15 data-checked:border-primary/40 focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="block size-3.5 rounded-none bg-muted-foreground transition-transform data-checked:translate-x-4 data-checked:bg-primary"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
