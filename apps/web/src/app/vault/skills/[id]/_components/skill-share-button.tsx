"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Loader2, Share2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/api/trpc";
import { buildSharedSkillHref } from "@/lib/skills/routes";

type SharePhase = "confirm" | "ready";

export function SkillShareButton({ skillId }: { skillId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SharePhase>("confirm");

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

        try {
          await navigator.clipboard.writeText(nextShareUrl);
          toast.success("share link copied");
        } catch {
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
      toast.success("share link copied");
    } catch {
      toast.error("failed to copy share link");
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpenDialog}>
        <Share2 className="size-3.5" aria-hidden="true" />
        Share
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {phase === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>share this skill?</DialogTitle>
                <DialogDescription>
                  anyone with the generated link can view this shared skill and import it into their
                  own vault.
                </DialogDescription>
              </DialogHeader>

              {previewShareQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  preparing shared skill preview...
                </div>
              ) : previewShareQuery.isError ? (
                <p className="text-xs text-destructive">
                  failed to preview shared skill: {previewShareQuery.error.message}
                </p>
              ) : (
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
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
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
                  Share
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>share link generated</DialogTitle>
                <DialogDescription>
                  this link now grants access to the shared skill list above.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Input
                  value={shareUrl ?? ""}
                  readOnly
                  className="font-mono text-[11px]"
                  onFocus={(event) => event.target.select()}
                />

                {shareId && (
                  <Link
                    href={buildSharedSkillHref(shareId)}
                    className="inline-flex text-[11px] font-mono text-primary underline-offset-3 hover:underline"
                  >
                    open shared preview
                  </Link>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyShareLink}
                  disabled={!shareUrl}
                >
                  <Copy className="size-3.5" aria-hidden="true" />
                  Copy link
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
