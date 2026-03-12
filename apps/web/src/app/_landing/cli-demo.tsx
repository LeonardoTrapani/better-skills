"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { SectionBackdrop } from "./grid-background";
import { Button } from "@/components/ui/button";
import { InstallCommandButton } from "./install-command-button";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { useLandingCta } from "./use-landing-cta";
import { GeistPixelSquare } from "geist/font/pixel";
import { CLI_DEMO_AGENTS } from "./cli-demo-icons";
import { LandingWindowHeader } from "./landing-window-header";

export default function CliDemo() {
  const { ctaHref, ctaLabel } = useLandingCta();
  const [shouldScrambleCommand, setShouldScrambleCommand] = useState(false);

  return (
    <section id="docs" className="relative overflow-hidden">
      <SectionBackdrop variant="cli-demo" />

      <div className="hidden lg:block">
        <SectionTailSpacer />
      </div>

      <LandingContainer>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          onAnimationComplete={() => setShouldScrambleCommand(true)}
          className="flex flex-col overflow-hidden lg:border border-x border-border lg:bg-background lg:flex-row"
        >
          <div className="flex flex-col justify-center items-center lg:items-start gap-4 border-b border-border px-8 pb-8 pt-20 lg:w-2/5 lg:border-r lg:border-b-0 lg:px-10 lg:py-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground/50">
              // Terminal Sync \\
            </p>

            <h2
              className={`text-[2rem] sm:text-[2.75rem] text-center lg:text-start text-balance font-semibold tracking-tight leading-tight text-foreground ${GeistPixelSquare.className}`}
            >
              Install once. <br className="hidden lg:block" /> Stay in{" "}
              <span className="text-primary">sync.</span>
            </h2>
            <p className="max-w-[350px] text-sm leading-[1.35] text-muted-foreground text-balance lg:text-start text-center">
              Bring your vault into the CLI so the same skills stay ready in local sessions, editor
              agents, and automation from the first command.
            </p>

            <Button
              animated
              variant="outline"
              className="hidden lg:flex h-11 gap-2 border border-border bg-background px-5 text-sm font-medium text-foreground"
              render={<Link href={ctaHref} />}
            >
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="bg-muted/[0.25] lg:w-3/5">
            <LandingWindowHeader label="Terminal" />

            <div className="flex min-h-[380px] border-b lg:border-b-0 border-border flex-col items-center justify-center gap-4 px-6 py-10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {CLI_DEMO_AGENTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={item.id}
                      title={item.label}
                      className="inline-flex size-11 items-center justify-center border border-border/60 bg-background sm:size-12"
                    >
                      <span
                        className={`inline-flex size-6 items-center justify-center sm:size-7 ${item.shellClass}`}
                      >
                        <Icon />
                      </span>
                    </span>
                  );
                })}
              </div>

              <InstallCommandButton
                scrambleTrigger={shouldScrambleCommand}
                className="h-11 w-full max-w-[700px] border-border bg-background px-4 text-foreground sm:h-auto sm:px-6 sm:py-3 sm:text-sm text-center justify-center items-center sm:w-auto gap-8"
                promptClassName="text-primary"
                copyShellClassName="sm:size-7"
                copyIconClassName="sm:size-4"
                copiedIconClassName="sm:size-4"
              />

              <p className="max-w-sm font-mono text-xs leading-relaxed text-balance text-muted-foreground">
                Works with Claude Code, Cursor, Windsurf, Codex, Gemini CLI, and much more!
              </p>
            </div>
          </div>
        </motion.div>
        <div className="flex w-full justify-center pt-8">
          <Button
            animated
            variant="outline"
            className="flex lg:hidden h-11 gap-2 w-auto min-w-auto pl-20 pr-16 border border-border bg-background text-sm font-medium text-foreground"
            render={<Link href={ctaHref} />}
          >
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
