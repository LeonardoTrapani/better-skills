"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Copy, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/ui/grid-background";
import { dashboardRoute } from "@/lib/skills/routes";
import { trpc } from "@/lib/api/trpc";

/* ── Step persistence (localStorage only) ── */

const STEP_KEY = "better-skills:onboarding-step";
const TOTAL_STEPS = 3;

function readSavedStep(): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(STEP_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return parsed >= 1 && parsed <= TOTAL_STEPS ? parsed : 1;
}

function saveStep(step: number) {
  localStorage.setItem(STEP_KEY, String(step));
}

function clearStepStorage() {
  localStorage.removeItem(STEP_KEY);
}

/* ── Copyable command block ── */

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full items-center gap-3 border border-border bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <span className="text-primary/60 select-none">$</span>
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{command}</code>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-primary" />
      ) : (
        <Copy className="size-3.5 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-80" />
      )}
    </button>
  );
}

/* ── Step 1: Install CLI + Login ── */

function StepInstall() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Install the CLI and log in</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The CLI is how you sync skills to your coding agents. Run these two commands in your
          terminal.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
            1. Install
          </p>
          <CommandBlock command="curl -fsSL https://better-skills.dev/install | bash" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
            2. Authenticate
          </p>
          <CommandBlock command="better-skills login" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This will open a browser window to authenticate. Once confirmed, your CLI session is saved
        locally.
      </p>
    </div>
  );
}

/* ── Step 2: Run Sync ── */

function StepSync() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Sync your skills</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This downloads your vault to all configured agents. It will ask which agents you use.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          Run sync
        </p>
        <CommandBlock command="better-skills sync" />
      </div>

      <div className="border border-border bg-muted/10 px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          What happens
        </p>
        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="inline-block size-1 shrink-0 bg-primary" />
            Checks authentication
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block size-1 shrink-0 bg-primary" />
            Downloads all skills from your vault
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block size-1 shrink-0 bg-primary" />
            Installs them to your selected agents
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ── Step 3: Use with your agent ── */

function PromptBlock({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group relative w-full border border-primary/40 bg-primary/5 px-5 py-4 text-left transition-all hover:border-primary/70 hover:bg-primary/10"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 font-mono text-sm leading-relaxed text-foreground">{prompt}</p>
        <span className="mt-0.5 shrink-0">
          {copied ? (
            <Check className="size-4 text-primary" />
          ) : (
            <Copy className="size-4 text-muted-foreground/60 transition-opacity group-hover:text-primary/70" />
          )}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.08em] text-primary/60">
        {copied ? "copied!" : "click to copy"}
      </p>
    </button>
  );
}

function StepCreateSkill() {
  const suggestedPrompt = "onboard better-skills using the better-skills skill";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Use your coding agent</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Open your favorite IDE or terminal and paste this prompt. Your agent will set up
          better-skills and walk you through everything — no manual reading required.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          Paste this prompt
        </p>
        <PromptBlock prompt={suggestedPrompt} />
      </div>

      <div className="border border-border bg-muted/10 px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          What your agent will do
        </p>
        <ul className="mt-2.5 space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 inline-block size-1 shrink-0 bg-primary" />
            Read the better-skills skill from your vault
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 inline-block size-1 shrink-0 bg-primary" />
            Discover what skills are available and how to use them
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 inline-block size-1 shrink-0 bg-primary" />
            Guide you through your first skill-powered workflow
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ── Stepper indicator ── */

function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;

        return (
          <div key={step} className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center border text-[10px] font-mono transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isDone
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
              }`}
            >
              {isDone ? <Check className="size-3" /> : String(step).padStart(2, "0")}
            </span>
            {step < total && (
              <div
                className={`h-px w-6 transition-colors ${isDone ? "bg-primary/40" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main wizard ── */

const STEP_LABELS = ["Install & Login", "Run Sync", "Use your coding agent"];

export default function WelcomeWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  const finishMutation = useMutation(
    trpc.completeOnboarding.mutationOptions({
      onSuccess: async () => {
        queryClient.setQueryData(trpc.hasActivated.queryOptions().queryKey, {
          activated: true,
        });

        await queryClient.invalidateQueries({
          queryKey: trpc.hasActivated.queryOptions().queryKey,
        });

        clearStepStorage();
        router.replace(dashboardRoute);
      },
    }),
  );

  useEffect(() => {
    setStep(readSavedStep());
    setMounted(true);
  }, []);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      const next = step + 1;
      setStep(next);
      saveStep(next);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      const prev = step - 1;
      setStep(prev);
      saveStep(prev);
    }
  }, [step]);

  const finish = useCallback(() => {
    finishMutation.mutate();
  }, [finishMutation]);

  if (!mounted) return null;

  const isLast = step === TOTAL_STEPS;

  return (
    <main className="relative min-h-[calc(100vh-52px)] bg-background">
      <GridBackground intensity={72} className="opacity-20" />

      <div className="relative mx-auto flex min-h-[calc(100vh-52px)] w-full max-w-2xl items-center px-4 py-10 sm:px-6">
        <div className="w-full space-y-8">
          {/* ── Header ── */}
          <header className="space-y-4">
            <p className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-primary">
              <Terminal className="size-3.5" aria-hidden="true" />
              // Getting Started \\
            </p>
            <Stepper current={step} total={TOTAL_STEPS} />
          </header>

          {/* ── Step content ── */}
          <div className="flex min-h-[470px] flex-col border border-border bg-background">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="size-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase font-mono text-foreground">
                  {STEP_LABELS[step - 1]}
                </h2>
              </div>
            </div>
            <div className="flex-1 px-5 py-6">
              {step === 1 && <StepInstall />}
              {step === 2 && <StepSync />}
              {step === 3 && <StepCreateSkill />}
            </div>
            <div className="mt-auto border-t border-border px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  {step > 1 ? (
                    <Button
                      variant="outline"
                      onClick={goBack}
                      className="h-9 gap-2 border-border px-4"
                    >
                      <ArrowLeft className="size-3.5" data-icon="inline-start" />
                      Back
                    </Button>
                  ) : (
                    <div className="h-9" />
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    onClick={finish}
                    disabled={finishMutation.isPending}
                    className="h-9 border-border px-4 text-muted-foreground hover:text-foreground"
                  >
                    Skip for now
                  </Button>
                  {isLast ? (
                    <Button
                      onClick={finish}
                      disabled={finishMutation.isPending}
                      className="h-9 gap-2 px-4 font-semibold"
                    >
                      Go to vault
                      <ArrowRight className="size-3.5" data-icon="inline-end" />
                    </Button>
                  ) : (
                    <Button onClick={goNext} className="h-9 gap-2 px-4 font-semibold">
                      I did it, continue
                      <ArrowRight className="size-3.5" data-icon="inline-end" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
