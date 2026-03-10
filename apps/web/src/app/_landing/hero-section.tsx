"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, Check, ArrowRight, Github } from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextScramble } from "@/components/ui/text-scramble";
import { LANDING_INSTALL_COMMAND } from "./constants";
import { HeroGridOverlay } from "./grid-background";
import { useClipboardCopy } from "./use-clipboard-copy";
import { useLandingCta } from "./use-landing-cta";
import { GeistPixelLine, GeistPixelSquare } from "geist/font/pixel";

export default function HeroSection({ skillCount }: { skillCount: number }) {
  const { copied: didCopy, copy } = useClipboardCopy();
  const { ctaHref, ctaLabel } = useLandingCta();
  const [shouldScrambleCommand, setShouldScrambleCommand] = useState(false);

  const handleCopy = async () => {
    await copy(LANDING_INSTALL_COMMAND);
  };

  const skillBadgeText =
    skillCount > 0
      ? `${skillCount} ${skillCount === 1 ? "skill" : "skills"} in your vault`
      : "Open source";

  return (
    <section className="relative flex min-h-[calc(90vh-52px)] flex-col items-center justify-center overflow-hidden lg:min-h-[calc(90vh-52px)]">
      <HeroGridOverlay />

      <div className="relative z-10 flex w-full -translate-y-8 justify-center px-4 sm:translate-y-0">
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Badge
              variant="outline"
              className="gap-2 border-primary/30 text-xs font-normal text-muted-foreground backdrop-blur-sm"
            >
              <span className="relative flex h-1.5 w-1.5 animate-[rotate-sequence_2s_linear_infinite]">
                <span className="absolute inline-flex h-full w-full bg-primary opacity-75 animate-[ping-sequence_2s_linear_infinite]" />
                <span className="relative inline-flex h-1.5 w-1.5 bg-primary" />
              </span>

              {skillBadgeText}
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-semibold leading-[1.08] tracking-tight text-foreground text-[3.15rem] md:text-7xl"
          >
            <span className={GeistPixelLine.className}>Your Agent's</span>
            <br />
            <span className="text-primary font-mono">
              <span className={`inline-flex items-baseline ${GeistPixelSquare.className}`}>
                <span>Sec</span>
                <span
                  aria-hidden="true"
                  className="relative ml-[0.04em] mr-[0.01em] inline-flex h-[0.62em] w-[0.62em] translate-y-[0.04em]"
                >
                  <Image
                    src="/brand/logo-light.svg"
                    alt=""
                    width={96}
                    height={96}
                    className="block h-full w-full dark:hidden"
                    priority
                  />
                  <Image
                    src="/brand/logo-dark.svg"
                    alt=""
                    width={96}
                    height={96}
                    className="hidden h-full w-full dark:block"
                    priority
                  />
                </span>
                <span>nd Brain</span>
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="max-w-lg text-base leading-relaxed text-muted-foreground sm:px-0 px-6"
          >
            Build, share, and manage a graph of reusable skills for your AI agents.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            onAnimationComplete={() => setShouldScrambleCommand(true)}
            className="flex w-full sm:w-auto max-w-xl flex-col items-center gap-3 px-4 sm:px-6 lg:px-0"
          >
            <div className="flex w-full flex-row gap-3">
              <Button
                size="lg"
                animated
                className="h-11 min-w-0 flex-1 gap-2 px-4 text-sm sm:px-7"
                render={<Link href={ctaHref} />}
              >
                <span className="flex items-center gap-2">
                  {ctaLabel}
                  <ArrowRight className="size-3.5" data-icon="inline-end" />
                </span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                animated
                className="h-11 min-w-0 flex-1 gap-2 text-sm justify-center items-center"
                render={
                  <Link
                    href="https://github.com/leonardotrapani/better-skills"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <span className="flex items-center gap-2">
                  See on GitHub
                  <Github className="size-3.5" />
                </span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={handleCopy}
              className="group h-11 w-full sm:w-auto justify-between gap-4 border-border bg-background/80 px-4 font-mono text-xs font-normal text-muted-foreground backdrop-blur-sm hover:text-foreground"
            >
              <span className="flex min-w-0 items-center gap-2 text-left">
                <span className="shrink-0 text-primary/60">$</span>
                <TextScramble
                  as="span"
                  trigger={shouldScrambleCommand}
                  className={`truncate${shouldScrambleCommand ? "" : " opacity-0"}`}
                >
                  {LANDING_INSTALL_COMMAND}
                </TextScramble>
              </span>
              <motion.span
                className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center border border-border/70 bg-background transition-transform duration-200 ease-out group-hover:scale-105"
                animate={didCopy ? { scale: [1, 1.12, 1], y: [0, -0.5, 0] } : { scale: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {didCopy ? (
                  <Check className="size-3 text-primary" />
                ) : (
                  <Copy className="size-3 opacity-70 transition-opacity group-hover:opacity-100" />
                )}
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
