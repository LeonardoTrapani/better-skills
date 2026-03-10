import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const LANDING_CONTENT_MAX_WIDTH_CLASS = "max-w-6xl";
export const LANDING_CONTENT_MAX_WIDTH_PX = 1152;

export const LANDING_CENTERED_OVERLAY_CLASS = "absolute left-1/2 w-full -translate-x-1/2";

export function LandingContainer({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn("relative z-10 flex w-full justify-center px-4 sm:px-6 lg:px-0", className)}>
      <div
        className={cn("flex w-full flex-col", LANDING_CONTENT_MAX_WIDTH_CLASS, contentClassName)}
      >
        {children}
      </div>
    </div>
  );
}

export function LandingCenteredOverlay({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        LANDING_CENTERED_OVERLAY_CLASS,
        LANDING_CONTENT_MAX_WIDTH_CLASS,
        "lg:w-[72rem] lg:max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTailSpacer() {
  return <div className="h-20" aria-hidden="true" />;
}
