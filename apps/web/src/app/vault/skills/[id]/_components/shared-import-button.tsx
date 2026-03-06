"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth/auth-client";
import { buildLoginHref } from "@/lib/skills/routes";
import { cn } from "@/lib/utils";

type IncludedSkill = {
  id: string;
  slug: string;
  name: string;
};

const CLI_INSTALL_COMMAND = "curl -fsSL https://better-skills.dev/install | bash";

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full items-center justify-between gap-4 border border-border/80 bg-background px-4 py-3 text-left font-mono text-[11px] text-foreground transition-colors hover:border-border hover:bg-muted/10 sm:px-5 sm:text-xs"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className="shrink-0 select-none text-primary">$</span>
        <code className="min-w-0 flex-1 break-all">{command}</code>
      </span>
      <span className="inline-flex size-6 shrink-0 items-center justify-center border border-border/70 bg-background sm:size-7">
        {copied ? (
          <Check className="size-3 text-primary sm:size-4" aria-hidden="true" />
        ) : (
          <Copy
            className="size-3 text-muted-foreground transition-colors group-hover:text-foreground sm:size-4"
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  );
}

type ImportDialogView = "choices" | "install";

export function SharedImportButton({
  shareId,
  includedSkills,
  resourcesCount,
  isImporting,
  onConfirmImport,
  variant = "default",
  size = "sm",
  label = "Import",
  className,
}: {
  shareId: string;
  includedSkills: IncludedSkill[];
  resourcesCount: number;
  isImporting: boolean;
  onConfirmImport: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  label?: string;
  className?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogView, setDialogView] = useState<ImportDialogView>("choices");
  const [shareSourceForCli, setShareSourceForCli] = useState(shareId);
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user?.id);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setShareSourceForCli(`${window.location.origin}/share/${encodeURIComponent(shareId)}`);
  }, [shareId]);

  useEffect(() => {
    if (!dialogOpen) {
      setDialogView("choices");
    }
  }, [dialogOpen]);

  const installShareCommand = useMemo(() => {
    return `better-skills install-share ${shareSourceForCli}`;
  }, [shareSourceForCli]);

  const handleImportIntoVault = () => {
    if (isAuthenticated) {
      setDialogOpen(false);
      onConfirmImport();
      return;
    }

    const nextPath = `/share/${encodeURIComponent(shareId)}?autoImport=1`;
    const loginHref = buildLoginHref(nextPath);
    window.location.assign(loginHref);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={() => setDialogOpen(true)}
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-3.5" aria-hidden="true" />
        )}
        {label}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] justify-items-stretch gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="gap-1.5 border-b border-border px-4 py-4 sm:px-5">
            <DialogTitle className="text-base">
              {dialogView === "choices" ? "Add this shared skill" : "Install on this machine"}
            </DialogTitle>
            {dialogView === "choices" ? (
              <DialogDescription>
                Install adds these skills locally right now. Import saves them to your vault so you
                can sync, manage, and reuse them later.
              </DialogDescription>
            ) : (
              <DialogDescription>
                Run these commands to install the CLI and add this shared bundle directly from the
                terminal.
              </DialogDescription>
            )}
          </DialogHeader>

          {dialogView === "choices" ? (
            <div className="space-y-4 px-4 py-4 sm:px-5">
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-border bg-muted/10 px-3 py-2">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                    Includes
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {includedSkills.length} skills
                  </p>
                </div>
                <div className="border border-border bg-muted/10 px-3 py-2">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                    Resources
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {resourcesCount} total
                  </p>
                </div>
              </div>

              <div className="border border-border bg-background">
                <div className="border-b border-border bg-muted/10 px-3 py-2">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                    Skills included in this share
                  </p>
                </div>
                <ul className="max-h-52 space-y-0.5 overflow-y-auto p-2">
                  {includedSkills.map((skill, index) => (
                    <li key={skill.id} className="flex items-start gap-2 px-1.5 py-1.5">
                      <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center border border-border bg-muted/20 font-mono text-[9px] text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <p className="truncate text-sm font-medium text-foreground">{skill.name}</p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {skill.slug}
                          {index > 0 ? " · connected" : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-4 py-4 sm:px-5">
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                  1. Install CLI
                </p>
                <CommandBlock command={CLI_INSTALL_COMMAND} />
                <p className="text-xs text-muted-foreground/60">
                  Skip this if `better-skills` is already installed.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                  2. Install shared bundle
                </p>
                <CommandBlock command={installShareCommand} />
                <p className="text-xs text-muted-foreground/60">
                  This installs the shared skills locally without adding them to your vault.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border px-4 py-3 sm:justify-stretch sm:px-5">
            {dialogView === "choices" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 text-sm font-medium"
                  onClick={() => setDialogView("install")}
                >
                  Install Only
                </Button>
                <Button
                  size="sm"
                  className="h-9 flex-1 text-sm font-medium"
                  onClick={handleImportIntoVault}
                  disabled={isImporting || isSessionPending}
                >
                  {isImporting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="size-3.5" aria-hidden="true" />
                  )}
                  Import to Vault
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 text-sm font-medium"
                  onClick={() => setDialogView("choices")}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  className="h-9 flex-1 text-sm font-medium"
                  onClick={() => setDialogOpen(false)}
                >
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
