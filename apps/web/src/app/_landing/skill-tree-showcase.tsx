"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FileCode2, FileText } from "lucide-react";
import { GeistPixelSquare } from "geist/font/pixel";

import { File, FileTree, Folder } from "@/components/ui/file-tree";
import { useIsDesktopLg } from "@/hooks/use-is-desktop-lg";

type SkillShowcase = {
  id: string;
  folder: string;
  references: string[];
  scripts: string[];
};

const TREE_ROOT_ID = "skill-vault-root";

const skills: SkillShowcase[] = [
  {
    id: "frontend-design",
    folder: "frontend-design",
    references: ["landing-rules.md", "responsive-layouts.md", "micro-interactions.md"],
    scripts: ["review-ui.ts"],
  },
  {
    id: "next-best-practices",
    folder: "next-best-practices",
    references: ["data-patterns.md", "image.md", "hydration-error.md"],
    scripts: ["route-preflight.ts"],
  },
  {
    id: "better-auth-best-practices",
    folder: "better-auth-best-practices",
    references: ["session-lifecycles.md", "account-recovery.md", "team-access.md"],
    scripts: ["audit-auth-setup.ts"],
  },
];

function ReadOnlyTreeFile({ id, label, icon }: { id: string; label: string; icon: ReactNode }) {
  return (
    <File
      id={id}
      label={label}
      icon={icon}
      title="Files stay read-only in this explorer"
      className="font-mono text-[12px] text-muted-foreground/80 disabled:opacity-100"
    />
  );
}

function StatChip({ children }: { children: ReactNode }) {
  return (
    <div className="border border-border bg-background px-3 py-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

export default function SkillTreeShowcase() {
  const defaultSkill = skills[0]!;
  const [activeSkillId, setActiveSkillId] = useState(defaultSkill.id);
  const [desktopExplorerHeight, setDesktopExplorerHeight] = useState<number | null>(null);
  const copyPanelRef = useRef<HTMLDivElement>(null);
  const isDesktopLg = useIsDesktopLg();

  const totalReferences = skills.reduce((count, skill) => count + skill.references.length, 0);

  useEffect(() => {
    if (!isDesktopLg || !copyPanelRef.current) {
      setDesktopExplorerHeight(null);
      return;
    }

    const copyPanel = copyPanelRef.current;
    const updateHeight = () => {
      setDesktopExplorerHeight(Math.ceil(copyPanel.getBoundingClientRect().height));
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(copyPanel);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isDesktopLg]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="flex flex-col overflow-hidden border-x border-border bg-background lg:flex-row lg:border"
    >
      <div
        ref={copyPanelRef}
        className="flex w-full flex-col items-center justify-center gap-4 border-b border-border px-8 pb-8 pt-20 text-center lg:flex-1 lg:items-start lg:border-b-0 lg:border-r lg:px-10 lg:py-12 lg:text-left"
      >
        <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground/50">
          // Skill Package \\
        </p>

        <h2
          className={`text-[2rem] text-balance font-semibold leading-tight tracking-tight text-foreground sm:text-[2.75rem] ${GeistPixelSquare.className}`}
        >
          Define once. Reuse as a <span className="text-primary">skill.</span>
        </h2>

        <p className="text-balance text-sm leading-[1.35] text-muted-foreground">
          A skill keeps one instruction file with the references and scripts around it, so agents
          can carry the same working context between the CLI, the web app, and your vault.
        </p>

        <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
          <StatChip>{skills.length} skills</StatChip>
          <StatChip>{totalReferences} references</StatChip>
        </div>
      </div>

      <div
        className="flex w-full flex-col overflow-hidden bg-muted/[0.25] lg:min-h-0 lg:flex-1"
        style={isDesktopLg && desktopExplorerHeight ? { height: desktopExplorerHeight } : undefined}
      >
        <div className="flex border-b border-border">
          <div className="flex w-auto items-center gap-2 border-r border-border px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
            <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
            <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
            <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
          </div>
          <div className="px-5 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground sm:px-6 sm:py-4">
            Vault Explorer
          </div>
        </div>

        <div className="min-h-[380px] border-b border-border lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:border-b-0">
          <div className="w-full text-left">
            <div className="bg-muted/[0.08] px-4 py-4 sm:px-6 sm:py-5">
              <FileTree
                defaultExpanded={[TREE_ROOT_ID, defaultSkill.id, `${defaultSkill.id}-references`]}
                className="font-mono text-[12px] leading-5"
              >
                <Folder id={TREE_ROOT_ID} label=".agents/" triggerClassName="text-foreground">
                  {skills.map((skill) => {
                    const isActive = activeSkillId === skill.id;

                    return (
                      <Folder
                        key={skill.id}
                        id={skill.id}
                        label={`${skill.folder}/`}
                        onOpenChange={(open) => {
                          if (open) setActiveSkillId(skill.id);
                        }}
                        triggerClassName={
                          isActive ? "bg-muted text-foreground" : "text-foreground/90"
                        }
                      >
                        <ReadOnlyTreeFile
                          id={`${skill.id}-skill-md`}
                          label="SKILL.md"
                          icon={<FileText className="size-4 shrink-0 text-primary/80" />}
                        />

                        <Folder
                          id={`${skill.id}-references`}
                          label={`references/ [${skill.references.length}]`}
                          triggerClassName="text-muted-foreground"
                        >
                          {skill.references.map((reference) => (
                            <ReadOnlyTreeFile
                              key={reference}
                              id={`${skill.id}-${reference}`}
                              label={reference}
                              icon={<FileText className="size-4 shrink-0 text-muted-foreground" />}
                            />
                          ))}
                        </Folder>

                        <Folder
                          id={`${skill.id}-scripts`}
                          label={`scripts/ [${skill.scripts.length}]`}
                          triggerClassName="text-muted-foreground"
                        >
                          {skill.scripts.map((script) => (
                            <ReadOnlyTreeFile
                              key={script}
                              id={`${skill.id}-${script}`}
                              label={script}
                              icon={<FileCode2 className="size-4 shrink-0 text-muted-foreground" />}
                            />
                          ))}
                        </Folder>
                      </Folder>
                    );
                  })}
                </Folder>
              </FileTree>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
