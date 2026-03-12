"use client";

import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { TextScramble } from "@/components/ui/text-scramble";
import { cn } from "@/lib/utils";
import { LANDING_INSTALL_COMMAND } from "./constants";
import { useClipboardCopy } from "./use-clipboard-copy";

type InstallCommandButtonProps = {
  className?: string;
  promptClassName?: string;
  commandClassName?: string;
  copyShellClassName?: string;
  copyIconClassName?: string;
  copiedIconClassName?: string;
  scrambleTrigger?: boolean;
};

export function InstallCommandButton({
  className,
  promptClassName,
  commandClassName,
  copyShellClassName,
  copyIconClassName,
  copiedIconClassName,
  scrambleTrigger = true,
}: InstallCommandButtonProps) {
  const { copied, copy } = useClipboardCopy();

  const handleCopy = async () => {
    await copy(LANDING_INSTALL_COMMAND);
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleCopy}
      className={cn("group justify-between gap-4 font-mono text-xs font-normal", className)}
    >
      <span className="flex min-w-0 items-center gap-2 text-left">
        <span className={cn("shrink-0 text-primary/60", promptClassName)}>$</span>
        <TextScramble
          as="span"
          trigger={scrambleTrigger}
          className={cn("truncate", scrambleTrigger ? undefined : "opacity-0", commandClassName)}
        >
          {LANDING_INSTALL_COMMAND}
        </TextScramble>
      </span>

      <motion.span
        className={cn(
          "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center border border-border bg-background transition-transform duration-200 ease-out group-hover:scale-105",
          copyShellClassName,
        )}
        animate={copied ? { scale: [1, 1.12, 1], y: [0, -0.5, 0] } : { scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {copied ? (
          <Check className={cn("size-3 text-primary", copiedIconClassName)} />
        ) : (
          <Copy
            className={cn(
              "size-3 opacity-70 transition-opacity group-hover:opacity-100",
              copyIconClassName,
            )}
          />
        )}
      </motion.span>
    </Button>
  );
}
