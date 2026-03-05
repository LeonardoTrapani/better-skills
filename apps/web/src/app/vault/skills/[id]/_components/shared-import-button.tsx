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
      className="group flex w-full items-start gap-3 border border-border bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <span className="text-primary/60 select-none">$</span>
      <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{command}</code>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <Copy
          className="size-3.5 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-80"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

type ImportDialogView = "choices" | "install";

export function SharedImportButton({
  shareId,
  includedSkills,
  isImporting,
  onConfirmImport,
  variant = "default",
  size = "sm",
  label = "Import",
}: {
  shareId: string;
  includedSkills: IncludedSkill[];
  isImporting: boolean;
  onConfirmImport: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  label?: string;
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogView === "choices" ? "choose how to add this shared skill" : "just install"}
            </DialogTitle>
            {dialogView === "choices" ? (
              <DialogDescription>
                option 1 just installs it to your machine. option 2 imports to your vault for
                syncing and management
              </DialogDescription>
            ) : (
              <DialogDescription>
                install this shared skill directly to your machine.
              </DialogDescription>
            )}
          </DialogHeader>

          {dialogView === "choices" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                  included skills ({includedSkills.length})
                </p>
                <ul className="max-h-44 space-y-1 overflow-y-auto border border-border px-3 py-2">
                  {includedSkills.map((skill, index) => (
                    <li key={skill.id} className="text-[11px] text-foreground">
                      <span className="font-medium">{skill.name}</span>
                      <span className="ml-1 text-muted-foreground">({skill.slug})</span>
                      {index > 0 ? (
                        <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          connected
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] text-muted-foreground">import to vault is recommended</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
                  1. install cli (if not already installed)
                </p>
                <CommandBlock command={CLI_INSTALL_COMMAND} />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
                  2. install this shared skill
                </p>
                <CommandBlock command={installShareCommand} />
              </div>
            </div>
          )}

          <DialogFooter>
            {dialogView === "choices" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setDialogView("install")}>
                  just install
                </Button>
                <Button
                  size="sm"
                  onClick={handleImportIntoVault}
                  disabled={isImporting || isSessionPending}
                >
                  {isImporting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="size-3.5" aria-hidden="true" />
                  )}
                  Import to vault
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setDialogView("choices")}>
                  Back
                </Button>
                <Button size="sm" onClick={() => setDialogOpen(false)}>
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
