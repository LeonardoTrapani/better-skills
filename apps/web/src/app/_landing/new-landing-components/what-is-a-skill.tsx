"use client";

import { ArrowRight, Folder, FileText, FileCode } from "lucide-react";
import { motion } from "motion/react";
import { SectionBackdrop, SectionHeader } from "../grid-background";
import { LandingContainer, SectionTailSpacer } from "../design-system";

/* ── Window chrome for skill tree ── */
function SkillTreeWindow() {
  const lines = [
    {
      indent: 0,
      text: ".agents/",
      color: "text-foreground/60",
      delay: 0,
      icon: <Folder className="size-3 text-foreground/50" />,
      closed: false,
    },
    {
      indent: 1,
      text: "vercel-react-best-practices/",
      color: "text-foreground/60",
      delay: 0.06,
      icon: <Folder className="size-3 text-primary/50" />,
      closed: false,
    },
    {
      indent: 2,
      text: "SKILL.md",
      color: "text-primary",
      delay: 0.12,
      icon: <FileText className="size-3 text-primary" />,
    },
    {
      indent: 2,
      text: "references/",
      color: "text-foreground/50",
      delay: 0.18,
      icon: <Folder className="size-3 text-foreground/50" />,
      closed: false,
    },
    {
      indent: 3,
      text: "react-compiler.md",
      color: "text-muted-foreground",
      delay: 0.24,
      icon: <FileText className="size-3 text-muted-foreground/70" />,
    },
    {
      indent: 3,
      text: "server-components.md",
      color: "text-muted-foreground",
      delay: 0.3,
      icon: <FileText className="size-3 text-muted-foreground/70" />,
    },
    {
      indent: 2,
      text: "scripts/",
      color: "text-foreground/50",
      delay: 0.36,
      icon: <Folder className="size-3 text-foreground/50" />,
      closed: false,
    },
    {
      indent: 3,
      text: "analyze-bundle.sh",
      color: "text-muted-foreground",
      delay: 0.42,
      icon: <FileCode className="size-3 text-muted-foreground/70" />,
    },
    {
      indent: 2,
      text: "links: next-best-practices",
      color: "text-primary/60",
      delay: 0.48,
    },
    {
      indent: 2,
      text: "links: frontend-design",
      color: "text-primary/60",
      delay: 0.54,
    },
    {
      indent: 1,
      text: "web-design-guidelines/",
      color: "text-muted-foreground/70",
      delay: 0.6,
      icon: <Folder className="size-3 text-muted-foreground/50" />,
      closed: true,
    },
    {
      indent: 1,
      text: "next-best-practices/",
      color: "text-muted-foreground/70",
      delay: 0.66,
      icon: <Folder className="size-3 text-muted-foreground/50" />,
      closed: true,
    },
  ];

  return (
    <div className="flex w-full flex-col bg-background">
      {/* Window chrome - gray dots like terminal */}
      <div className="flex border-b border-border/70">
        <div className="flex w-auto items-center gap-2 border-r border-border/70 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
          <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
          <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
          <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
        </div>
        <div className="px-5 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground sm:px-6 sm:py-4">
          Agent
        </div>
      </div>

      {/* File tree content */}
      <div className="px-6 py-8 bg-muted/[0.03]">
        <div className="font-mono text-xs leading-7">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: line.delay }}
              className={`flex items-center gap-2 ${line.color}`}
            >
              {line.indent === 0 && (
                <>
                  {line.icon}
                  <span>{line.text}</span>
                </>
              )}
              {line.indent === 1 && (
                <>
                  <span className="select-none whitespace-pre text-muted-foreground/30">
                    {"  "}
                  </span>
                  <span className="select-none text-muted-foreground/30 mr-1">{"├─ "}</span>
                  {line.icon}
                  <span>{line.text}</span>
                </>
              )}
              {line.indent === 2 && (
                <>
                  <span className="select-none whitespace-pre text-muted-foreground/30">
                    {"    "}
                  </span>
                  <span className="select-none text-muted-foreground/30 mr-1">{"├─ "}</span>
                  {line.icon}
                  <span>{line.text}</span>
                </>
              )}
              {line.indent === 3 && (
                <>
                  <span className="select-none whitespace-pre text-muted-foreground/30">
                    {"      "}
                  </span>
                  <span className="select-none text-muted-foreground/30 mr-1">{"│   "}</span>
                  {line.icon}
                  <span>{line.text}</span>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WhatIsASkill() {
  return (
    <section id="what-are-skills" className="relative overflow-hidden">
      <SectionBackdrop variant="skill" />
      <SectionHeader
        decorator="SKILLS"
        headline={
          <span>
            What is a <span className="text-primary">skill?</span>
          </span>
        }
        subtitle="What are skills, what are their limitations and how we solve them! "
      />

      {/* Custom layout - no SplitSection */}
      <LandingContainer>
        <div className="flex flex-col border-y border-border/70 bg-background lg:flex-row">
          {/* Left: Skill tree (1/3 width on desktop) */}
          <div className="lg:w-[33.3%] border-r border-border/70 lg:order-1 order-2">
            <SkillTreeWindow />
          </div>

          {/* Right: Text content (2/3 width on desktop) */}
          <div className="flex flex-col justify-center gap-6 px-8 py-12 lg:px-12 lg:py-16 lg:w-[66.6%] lg:order-2 order-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              // What is a Skill? \\
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-[1.15] sm:text-4xl">
              A reusable capability, <br className="hidden lg:block" />
              <span className="text-primary">packaged for agents</span>
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                A skill is a reusable capability packaged as a{" "}
                <code className="rounded-none border border-border bg-muted/40 px-1 py-0.5 font-mono text-xs">
                  SKILL.md
                </code>{" "}
                file — a structured description your agent loads at runtime, not a one-off prompt
                you paste into a chat window and lose.
              </p>
              <p>
                Each skill carries instructions, context, and usage examples. It can include
                supporting resources like documentation and scripts. And it links to related skills
                through a typed graph, so agents can traverse relationships and load exactly what
                they need.
              </p>
              <p>
                Skills are versioned, owned, and shared through vaults — giving teams a single
                structured source of agent knowledge that stays current across every tool they use.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://better-skills.dev/blog/what-is-a-skill"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-primary transition-opacity hover:opacity-70"
              >
                Read more about skills
                <ArrowRight className="size-3" />
              </a>
            </div>
          </div>
        </div>
        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
