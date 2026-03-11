"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { GeistPixelSquare } from "geist/font/pixel";

import { Button } from "@/components/ui/button";
import { CornerInsetMarks } from "./corner-inset-marks";
import { SectionHeader, SectionBackdrop } from "./grid-background";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { useLandingCta } from "./use-landing-cta";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceUnit: "/forever",
    description: "Self-host on your own stack with full ownership, no seats, and no card required.",
    highlight: true,
    features: [
      "Unlimited skills",
      "Unlimited users",
      "Full API access",
      "Better Auth integration",
      "Neon Postgres support",
      "Community support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom" as const,
    description:
      "Dedicated infrastructure, high-touch support, and flexible deployment for larger teams.",
    cta: "Talk to Founders",
    highlight: false,
    features: [
      "Everything unlimited",
      "Custom contracts",
      "On-premise option",
      "Dedicated infrastructure",
      "24/7 phone support",
      "Training sessions",
    ],
  },
];

export default function Pricing() {
  const { ctaHref, ctaLabel } = useLandingCta();

  return (
    <section id="pricing" className="relative overflow-hidden">
      <SectionBackdrop variant="pricing" />

      <LandingContainer>
        <SectionHeader
          decorator="Pricing"
          headline={
            <>
              Start <span className="text-primary">for free,</span> scale with{" "}
              <br className="hidden lg:block" /> enterprise support
            </>
          }
          subtitle="Self-host at no cost, or work with us on dedicated infrastructure for larger teams."
        />

        <div className="mx-auto flex flex-col md:flex-row w-full max-w-[800px] gap-4">
          {tiers.map((tier) => {
            return (
              <div
                key={tier.id}
                className="group border border-border relative flex flex-col overflow-hidden bg-background p-10 gap-6"
              >
                <CornerInsetMarks />

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground/50 group-hover:text-muted-foreground transition-all">
                        {tier.name}
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-balance text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <div className="flex items-end gap-2">
                    {typeof tier.price === "string" ? (
                      <span
                        className={`text-5xl leading-none tracking-tight text-foreground ${GeistPixelSquare.className}`}
                      >
                        {tier.price}
                      </span>
                    ) : (
                      <>
                        <span
                          className={`text-5xl leading-none tracking-tight text-foreground ${GeistPixelSquare.className}`}
                        >
                          ${tier.price}
                        </span>
                        <span className="pb-1 text-sm text-muted-foreground">{tier.priceUnit}</span>
                      </>
                    )}
                  </div>

                  <Button
                    variant={tier.highlight ? "default" : "outline"}
                    size="lg"
                    animated
                    className={`h-10 w-full cursor-pointer text-xs ${tier.highlight ? "hover:bg-primary/80" : ""}`}
                    render={tier.id === "free" ? <Link href={ctaHref} /> : undefined}
                  >
                    {tier.id === "free" ? ctaLabel : tier.cta}
                  </Button>
                </div>

                <div className="h-px w-full bg-border" />

                <div className="flex flex-1 flex-col">
                  {tier.features.map((feature, fi) => (
                    <div
                      key={fi}
                      className="flex items-center gap-2.5 border-b border-border py-3 text-muted-foreground last:border-b-0"
                    >
                      <Check
                        className={`size-3 ${tier.id === "free" ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="font-mono text-[13px] leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
