"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, CheckCircle2, Copy, ExternalLink, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/api/trpc";
import { buildSharedSkillHref } from "@/lib/skills/routes";
import { cn } from "@/lib/utils";

type SharePhase = "confirm" | "ready";

export function SkillShareButton({ skillId, className }: { skillId: string; className?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SharePhase>("confirm");
  const [justCopied, setJustCopied] = useState(false);
  const [autoCopiedOnCreate, setAutoCopiedOnCreate] = useState(false);

  const previewShareQuery = useQuery({
    ...trpc.skills.previewShare.queryOptions({ skillId }),
    enabled: dialogOpen,
  });

  const createShareMutation = useMutation(
    trpc.skills.createShare.mutationOptions({
      onSuccess: async ({ shareId }) => {
        if (typeof window === "undefined") return;

        const nextShareUrl = new URL(
          buildSharedSkillHref(shareId),
          window.location.origin,
        ).toString();
        setShareId(shareId);
        setShareUrl(nextShareUrl);
        setPhase("ready");
        setJustCopied(false);

        try {
          await navigator.clipboard.writeText(nextShareUrl);
          setAutoCopiedOnCreate(true);
          setJustCopied(true);
          toast.success("share link copied");
        } catch {
          setAutoCopiedOnCreate(false);
          toast.success("share link ready");
        }
      },
      onError: (error) => {
        toast.error(error.message || "failed to create share link");
      },
    }),
  );

  const includedSkills = previewShareQuery.data?.includedSkills ?? [];

  const handleOpenDialog = () => {
    setPhase("confirm");
    setShareId(null);
    setShareUrl(null);
    setJustCopied(false);
    setAutoCopiedOnCreate(false);
    setDialogOpen(true);
  };

  const handleCreateShare = () => {
    if (createShareMutation.isPending) return;
    createShareMutation.mutate({ skillId });
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setJustCopied(true);
      toast.success("share link copied");
    } catch {
      toast.error("failed to copy share link");
    }
  };

  useEffect(() => {
    if (!justCopied) return;

    const timeout = window.setTimeout(() => {
      setJustCopied(false);
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [justCopied]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "border-border bg-background px-2 flex gap-2 hover:border-muted-foreground/30 hover:bg-muted/50",
          className,
        )}
        onClick={handleOpenDialog}
      >
        <Share2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-medium text-foreground">Share skill</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] justify-items-stretch gap-0 p-0 sm:max-w-lg">
          {phase === "confirm" ? (
            <>
              <DialogHeader className="gap-1.5 border-b border-border px-4 py-4 sm:px-5">
                <DialogTitle className="text-base">Share skill</DialogTitle>
                <DialogDescription>
                  Create a read-only link to preview and import this skill bundle.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-4 py-4 sm:px-5">
                {previewShareQuery.isLoading ? (
                  <div className="flex items-center gap-2 border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Preparing share preview...
                  </div>
                ) : previewShareQuery.isError ? (
                  <div className="border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                    Failed to preview shared skill: {previewShareQuery.error.message}
                  </div>
                ) : (
                  <div className="space-y-4">
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
                          {previewShareQuery.data?.stats.resources ?? 0} total
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
                              <p className="truncate text-sm font-medium text-foreground">
                                {skill.name}
                              </p>
                              <p className="truncate font-mono text-[10px] text-muted-foreground">
                                {skill.slug}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-border px-4 py-3 sm:justify-stretch sm:px-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 text-sm font-medium"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-9 flex-1 text-sm font-medium"
                  onClick={handleCreateShare}
                  disabled={
                    createShareMutation.isPending ||
                    previewShareQuery.isLoading ||
                    previewShareQuery.isError
                  }
                >
                  {createShareMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Share2 className="size-3.5" aria-hidden="true" />
                  )}
                  Generate link
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="gap-1.5 border-b border-border px-4 py-4 sm:px-5">
                <div className="inline-flex w-fit items-center gap-1.5 border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-primary">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Link ready
                </div>
                <DialogTitle className="text-base">Share link generated</DialogTitle>
                <DialogDescription>
                  {autoCopiedOnCreate
                    ? "The link was copied automatically. Paste it where you want to share."
                    : "Copy this link and share it with anyone who should access this skill."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 px-4 py-4 sm:px-5">
                <div className="w-full space-y-2 border border-border bg-muted/10 p-3">
                  <div className="grid w-full max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden border border-border/80 bg-background px-3 py-2.5 font-mono text-[11px]">
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                      <span className="shrink-0 text-primary/80">$</span>
                      <span className="block min-w-0 truncate text-foreground">{shareUrl}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={handleCopyShareLink}
                      disabled={!shareUrl}
                      className="size-7 shrink-0 border-border/80 bg-background"
                      aria-label={justCopied ? "Link copied" : "Copy link"}
                    >
                      {justCopied ? (
                        <Check className="size-3.5 text-primary" aria-hidden="true" />
                      ) : (
                        <Copy
                          className="size-3.5 text-muted-foreground group-hover:text-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  </div>

                  {shareId ? (
                    <Link
                      href={buildSharedSkillHref(shareId)}
                      className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
                    >
                      Open shared preview
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              </div>

              <DialogFooter className="border-t border-border px-4 py-3 sm:px-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full text-sm font-medium"
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
