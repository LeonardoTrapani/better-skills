import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop } from "./grid-background";

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  topSpacer?: boolean;
  bottomSpacer?: boolean;
  variant?: ComponentProps<typeof SectionBackdrop>["variant"];
};

export function LandingSection({
  id,
  children,
  className,
  containerClassName,
  contentClassName,
  topSpacer = false,
  bottomSpacer = false,
  variant = "default",
}: LandingSectionProps) {
  return (
    <section id={id} className={cn("relative overflow-hidden", className)}>
      <SectionBackdrop variant={variant} />

      <LandingContainer className={containerClassName} contentClassName={contentClassName}>
        {topSpacer ? <SectionTailSpacer /> : null}
        {children}
        {bottomSpacer ? <SectionTailSpacer /> : null}
      </LandingContainer>
    </section>
  );
}
