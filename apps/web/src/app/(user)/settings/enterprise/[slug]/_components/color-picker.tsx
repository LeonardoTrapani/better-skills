"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sketch, type ColorResult } from "@uiw/react-color";
import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

// Curated presets — shown only once in our section (Sketch's own are hidden via CSS)
const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#1e293b",
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
  compact?: boolean;
  trigger?: "default" | "swatch";
  onCommit?: (hex: string) => void;
}

export function ColorPicker({
  value,
  onChange,
  className,
  compact = false,
  trigger = "default",
  onCommit,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSketchChange = useCallback(
    (color: ColorResult) => {
      setHexInput(color.hex);
      onChange(color.hex);
    },
    [onChange],
  );

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexInput(raw);
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) onChange(normalized);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      {trigger === "swatch" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "group relative size-10 border border-black/10",
            "transition-opacity hover:opacity-95",
            className,
          )}
          style={{ backgroundColor: value }}
          aria-label="Edit brand color"
        >
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <Pipette className="size-3.5 text-white" />
          </span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "group flex items-center border border-border bg-background text-sm",
            compact ? "h-10 gap-2 px-2.5" : "h-10 gap-2.5 px-3",
            "transition-colors hover:border-primary/40 hover:bg-muted/40",
            open && "border-primary/40 bg-muted/40",
          )}
          aria-label="Open color picker"
        >
          <span
            className={cn("shrink-0 border border-black/10", compact ? "size-5" : "size-4")}
            style={{ backgroundColor: value }}
          />
          {!compact ? (
            <span className="font-mono text-xs text-muted-foreground">{value.toUpperCase()}</span>
          ) : null}
          <Pipette
            className={cn("text-muted-foreground", compact ? "size-3" : "ml-auto size-3.5")}
          />
        </button>
      )}

      {open && (
        <div
          ref={popoverRef}
          className={cn(
            "absolute left-0 top-[calc(100%+4px)] z-50",
            "border border-border bg-background shadow-lg",
          )}
        >
          {/*
            Sketch picker — suppress its built-in preset swatches entirely
            so we don't double-render. Target the swatch row via the
            internal class name that @uiw/react-color-sketch renders.
          */}
          <div className="p-3 [&_.w-color-swatch]:!hidden" style={{ width: 240 }}>
            <Sketch
              color={value}
              onChange={handleSketchChange}
              presetColors={false}
              editableDisable={false}
              style={{
                background: "transparent",
                boxShadow: "none",
                borderRadius: 0,
                padding: 0,
                width: "100%",
              }}
              disableAlpha
            />
          </div>

          {/* Our preset swatches */}
          <div className="border-t border-border px-3 pb-3 pt-2.5">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Presets
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    setHexInput(hex);
                    onChange(hex);
                  }}
                  className="group relative size-5 border border-black/10 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                >
                  {value.toLowerCase() === hex.toLowerCase() && (
                    <Check className="absolute inset-0 m-auto size-3 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Hex input + Done */}
          <div className="border-t border-border px-3 pb-3 pt-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Hex
              </span>
              <input
                type="text"
                value={hexInput}
                onChange={handleHexInputChange}
                spellCheck={false}
                maxLength={7}
                className="h-7 flex-1 border border-border bg-muted/50 px-2 font-mono text-xs text-foreground outline-none focus:border-primary/40"
              />
              <button
                type="button"
                onClick={() => {
                  const normalized = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
                  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
                    onChange(normalized);
                    onCommit?.(normalized);
                  }
                  setOpen(false);
                }}
                className="flex h-7 items-center gap-1 border border-border bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Check className="size-3" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
