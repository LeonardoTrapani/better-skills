"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  Search,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { trpc } from "@/lib/api/trpc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "./color-picker";

const PAGE_SIZE = 20;

function getRoleChip(role: "owner" | "admin" | "member") {
  return (
    <span className="inline-flex items-center border border-border bg-muted/40 px-2 py-px text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      {role}
    </span>
  );
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center border border-border/60 bg-muted text-xs font-semibold text-muted-foreground select-none">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

interface EnterpriseSettingsViewProps {
  slug: string;
}

export default function EnterpriseSettingsView({ slug }: EnterpriseSettingsViewProps) {
  const queryClient = useQueryClient();

  const membershipsQueryOptions = trpc.vaults.listMine.queryOptions();
  const membershipsQuery = useQuery(membershipsQueryOptions);

  const membership = useMemo(
    () =>
      (membershipsQuery.data ?? []).find(
        (m) => m.vault.slug === slug && m.vault.type === "enterprise",
      ) ?? null,
    [membershipsQuery.data, slug],
  );

  const vaultId = membership?.vaultId ?? null;

  const membersQueryOptions = trpc.vaults.members.list.queryOptions(
    { vaultId: vaultId ?? "" },
    { enabled: !!vaultId && (membership?.canAdmin ?? false) },
  );
  const membersQuery = useQuery(membersQueryOptions);

  // ── State ──────────────────────────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [colorInput, setColorInput] = useState(membership?.vault.color ?? "#6b7280");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string;
    userName: string;
    nextRole: "admin" | "member";
  } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (membership?.vault.color) setColorInput(membership.vault.color);
  }, [membership?.vault.color]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: membershipsQueryOptions.queryKey }),
      queryClient.invalidateQueries({ queryKey: membersQueryOptions.queryKey }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.listByOwner.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.graph.queryKey() }),
    ]);
  }, [queryClient, membershipsQueryOptions.queryKey, membersQueryOptions.queryKey]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const updateColorMutation = useMutation(
    trpc.vaults.updateColor.mutationOptions({
      onSuccess: async () => {
        await refresh();
        toast.success("Color updated");
      },
      onError: (e) => toast.error(e.message || "Failed to update color"),
    }),
  );

  const inviteMutation = useMutation(
    trpc.vaults.inviteMember.mutationOptions({
      onSuccess: async () => {
        await refresh();
        setInviteEmail("");
        setInviteError(null);
        toast.success("Invitation sent");
      },
      onError: (e) => toast.error(e.message || "Failed to send invitation"),
    }),
  );

  const validateInviteEmail = useCallback((raw: string) => {
    const email = raw.trim();
    if (!email) return "Please enter an email address.";
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) return "Please enter a valid work email.";
    return null;
  }, []);

  const updateRoleMutation = useMutation(
    trpc.vaults.members.updateRole.mutationOptions({
      onSuccess: async () => {
        await refresh();
        setPendingRoleChange(null);
        toast.success("Role updated");
      },
      onError: (e) => toast.error(e.message || "Failed to update role"),
    }),
  );

  const removeMutation = useMutation(
    trpc.vaults.members.remove.mutationOptions({
      onSuccess: async () => {
        await refresh();
        setPendingRemoval(null);
        toast.success("Member removed");
      },
      onError: (e) => toast.error(e.message || "Failed to remove member"),
    }),
  );

  // ── Derived member list ────────────────────────────────────────────────
  const allMembers = membersQuery.data ?? [];
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allMembers;
    return allMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [allMembers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const pagedMembers = filteredMembers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const colorChanged = colorInput !== (membership?.vault.color ?? "#6b7280");
  const inviteValidationError = validateInviteEmail(inviteEmail);

  // ── Guards ─────────────────────────────────────────────────────────────
  if (membershipsQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!membership) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <AlertTriangle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Enterprise vault not found.</p>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Back to settings
        </Link>
      </main>
    );
  }

  if (!membership.canAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Shield className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Owner or admin access required.</p>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Back to settings
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-10">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Settings
          </Link>

          <div className="mt-5 flex items-center gap-4">
            <div className="shrink-0">
              <ColorPicker
                value={colorInput}
                onChange={setColorInput}
                trigger="swatch"
                onCommit={(hex) => {
                  if (hex === (membership.vault.color ?? "#6b7280")) return;
                  updateColorMutation.mutate({ vaultId: membership.vaultId, color: hex });
                }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {membership.vault.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage members, roles, and vault access.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* ── Invite member ── */}
          <section className="border border-border bg-background">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-xs font-semibold uppercase font-mono tracking-widest text-foreground">
                Invite member
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Invite a teammate by email. They'll receive an invitation in their settings.
              </p>
            </div>
            <div className="px-5 py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const validationError = validateInviteEmail(inviteEmail);
                  if (validationError) {
                    setInviteError(validationError);
                    return;
                  }
                  inviteMutation.mutate({
                    vaultId: membership.vaultId,
                    email: inviteEmail.trim(),
                    role: inviteRole,
                  });
                }}
                noValidate
                className="grid gap-2 sm:grid-cols-[1fr_170px_auto]"
              >
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    const next = e.target.value;
                    setInviteEmail(next);
                    if (inviteError) {
                      setInviteError(validateInviteEmail(next));
                    }
                  }}
                  onBlur={() => setInviteError(validateInviteEmail(inviteEmail))}
                  required
                  aria-invalid={Boolean(inviteError)}
                  className={
                    inviteError
                      ? "h-10 border-destructive/70 focus-visible:ring-destructive/30"
                      : "h-10"
                  }
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                  className="h-10 border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  type="submit"
                  size="sm"
                  disabled={inviteMutation.isPending || Boolean(inviteValidationError)}
                  className="h-10 px-4"
                >
                  {inviteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Invite
                </Button>
              </form>
              {inviteError ? (
                <p className="mt-2 inline-flex items-center gap-1.5 border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive">
                  <CircleAlert className="size-3.5" />
                  {inviteError}
                </p>
              ) : null}
            </div>
          </section>

          {/* ── Members ── */}
          <section className="border border-border bg-background">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase font-mono tracking-widest text-foreground">
                    Members
                  </h2>
                  {allMembers.length > 0 && (
                    <span className="border border-border bg-muted px-2 py-px text-[10px] font-mono text-muted-foreground">
                      {allMembers.length}
                    </span>
                  )}
                </div>
              </div>

              {allMembers.length >= 5 && (
                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-full border border-border bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              {membersQuery.isLoading && (
                <div className="flex items-center gap-2 px-5 py-5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading members…
                </div>
              )}

              {!membersQuery.isLoading && filteredMembers.length === 0 && (
                <div className="px-5 py-5 text-center text-xs text-muted-foreground">
                  {search ? "No members match your search." : "No members yet."}
                </div>
              )}

              {pagedMembers.map((member, i) => {
                const isOwner = member.role === "owner";
                const roleToggle = member.role === "admin" ? "member" : "admin";
                const roleToggleLabel =
                  member.role === "admin" ? "Demote to member" : "Promote to admin";
                const roleBusy =
                  updateRoleMutation.isPending &&
                  updateRoleMutation.variables?.userId === member.userId;
                const removeBusy =
                  removeMutation.isPending && removeMutation.variables?.userId === member.userId;

                return (
                  <div
                    key={member.userId}
                    className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <MemberAvatar name={member.name} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {member.name}
                        </p>
                        {getRoleChip(member.role)}
                      </div>
                      <p className="mt-px truncate text-xs font-mono text-muted-foreground">
                        {member.email}
                      </p>
                    </div>

                    {!isOwner && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={roleBusy || removeBusy}
                          onClick={() =>
                            setPendingRoleChange({
                              userId: member.userId,
                              userName: member.name,
                              nextRole: roleToggle,
                            })
                          }
                          className="gap-1.5 text-xs"
                        >
                          {roleBusy ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Shield className="size-3" />
                          )}
                          {roleToggleLabel}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-destructive hover:border-destructive/40 hover:bg-destructive/5"
                          disabled={roleBusy || removeBusy}
                          onClick={() =>
                            setPendingRemoval({ userId: member.userId, userName: member.name })
                          }
                        >
                          {removeBusy ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <UserMinus className="size-3" />
                          )}
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                  <p className="text-xs text-muted-foreground">
                    {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, filteredMembers.length)} of{" "}
                    {filteredMembers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="px-2 text-xs text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Confirm role change ── */}
      <AlertDialog
        open={Boolean(pendingRoleChange)}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm role change</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRoleChange
                ? `Change ${pendingRoleChange.userName} to ${pendingRoleChange.nextRole}? This updates their write permissions immediately.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateRoleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateRoleMutation.isPending}
              onClick={() => {
                if (!pendingRoleChange || !vaultId) return;
                updateRoleMutation.mutate({
                  vaultId,
                  userId: pendingRoleChange.userId,
                  role: pendingRoleChange.nextRole,
                });
              }}
            >
              {updateRoleMutation.isPending ? "Updating…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm remove ── */}
      <AlertDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval
                ? `Remove ${pendingRemoval.userName} from this vault? They will lose access immediately.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => {
                if (!pendingRemoval || !vaultId) return;
                removeMutation.mutate({ vaultId, userId: pendingRemoval.userId });
              }}
            >
              {removeMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
