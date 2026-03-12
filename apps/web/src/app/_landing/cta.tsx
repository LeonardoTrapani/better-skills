"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { LandingContainer } from "./design-system";
import { SectionBackdrop } from "./grid-background";
import { useLandingCta } from "./use-landing-cta";
import { GeistPixelSquare } from "geist/font/pixel";

export default function CTA() {
  const { ctaHref, ctaLabel } = useLandingCta();

  return (
    <section className="relative overflow-hidden">
      <SectionBackdrop variant="default" />

      <LandingContainer className="py-28 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative flex w-full flex-col items-center gap-4 border-x border-border px-8 py-14 text-center sm:px-12"
        >
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground/50">
            // Build Your Vault \\
          </p>

          <h2
            className={`text-5xl tracking-tight text-foreground sm:text-6xl ${GeistPixelSquare.className}`}
          >
            Build once.
            <br />
            Sync on
            <span className="text-primary"> every agent.</span>
          </h2>

          <p className="max-w-xl text-pretty pb-6 leading-relaxed text-muted-foreground">
            Turn your best workflows into reusable skills, keep context consistent across tools, and
            scale from a solo vault to a shared system without starting over.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 w-full justify-center gap-2 px-7 text-sm sm:w-auto"
              render={<Link href={ctaHref} />}
              animated
            >
              {ctaLabel}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </motion.div>
      </LandingContainer>
    </section>
  );
}
