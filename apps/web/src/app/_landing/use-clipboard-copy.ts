"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseClipboardCopyOptions {
  resetDelayMs?: number;
}

export function useClipboardCopy({ resetDelayMs = 1500 }: UseClipboardCopyOptions = {}) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);

        if (resetTimerRef.current) {
          clearTimeout(resetTimerRef.current);
        }

        resetTimerRef.current = setTimeout(() => {
          setCopied(false);
        }, resetDelayMs);

        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [resetDelayMs],
  );

  return { copied, copy };
}
