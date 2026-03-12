import { GeistPixelSquare } from "geist/font/pixel";

import { CARD_EYEBROW_CLASS, CardDivider } from "./card-elements";
import { CornerInsetMarks } from "./corner-inset-marks";
import { SectionHeader } from "./grid-background";
import { HOW_IT_WORKS_STEPS } from "./how-it-works.data";
import { StepIllustration } from "./how-it-works-illustrations";
import { LandingSection } from "./landing-section";

export default function HowItWorks() {
  return (
    <LandingSection variant="how-it-works" bottomSpacer>
      <SectionHeader
        decorator="How It Works"
        headline={
          <>
            Three steps to <span className="text-primary">smarter agents</span>
          </>
        }
        subtitle="From install to publish in minutes. No configuration required."
      />

      <div className="flex flex-wrap gap-4">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <div
            key={step.num}
            className="group relative flex min-w-[280px] flex-1 basis-full flex-col gap-6 overflow-hidden border border-border bg-background px-8 py-9 text-left transition-colors duration-200 hover:bg-muted/[0.14] lg:basis-[calc(33.333%-1.1rem)]"
          >
            <CornerInsetMarks />

            <div className="relative flex min-h-[132px] items-center justify-center px-4 pt-2">
              <div className="flex h-20 w-full max-w-[176px] items-center justify-center">
                <StepIllustration pattern={step.pattern} />
              </div>

              <span className="absolute right-0 top-0 pt-1 font-mono text-[1.15rem] leading-none tracking-[-0.08em] text-primary transition-colors duration-200">
                {step.num}
              </span>
            </div>

            <CardDivider />

            <div className="flex flex-col gap-4">
              <p className={CARD_EYEBROW_CLASS}>{step.label}</p>
              <h3
                className={`text-2xl leading-[1.15] tracking-tight text-foreground ${GeistPixelSquare.className}`}
              >
                <span>{step.title}</span>
                <span className="text-primary">{step.titleAccent}</span>
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
