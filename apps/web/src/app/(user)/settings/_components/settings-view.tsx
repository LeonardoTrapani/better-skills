"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Building2,
  Check,
  Clock3,
  EyeOff,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Moon,
  Palette,
  UserCheck,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/auth-client";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

const VAULT_TYPE_META = {
  personal: { label: "Personal" },
  enterprise: { label: "Enterprise" },
  system_default: { label: "Default" },
} as const;

/* ------------------------------------------------------------------ */
/*  Section shell — mirrors the GitHub settings card pattern            */
/* ------------------------------------------------------------------ */
function Section({
  icon,
  title,
  description,
  children,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  const borderColor = variant === "danger" ? "border-destructive/30" : "border-border";

  return (
    <div className={`border ${borderColor} bg-background`}>
      <div className={`border-b ${borderColor} px-5 py-5 space-y-2`}>
        <div className="flex items-center gap-2.5">
          {icon}
          <h2
            className={`text-sm font-semibold uppercase font-mono ${variant === "danger" ? "text-destructive" : "text-foreground"}`}
          >
            {title}
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row — a single setting item inside a section                       */
/* ------------------------------------------------------------------ */
function Row({
  children,
  borderVariant = "default",
}: {
  children: React.ReactNode;
  borderVariant?: "default" | "danger";
}) {
  const border = borderVariant === "danger" ? "border-destructive/20" : "border-border";
  return (
    <div className={`flex items-center justify-between gap-4 border ${border} px-5 py-3.5`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
interface SettingsViewProps {
  userName: string;
  userEmail: string;
}

export default function SettingsView({ userName, userEmail }: SettingsViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const membershipsQueryOptions = trpc.vaults.listMine.queryOptions();
  const invitationsQueryOptions = trpc.vaults.invitations.listPending.queryOptions();
  const membershipsQuery = useQuery(membershipsQueryOptions);
  const invitationsQuery = useQuery(invitationsQueryOptions);

  const refreshVaultState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: membershipsQueryOptions.queryKey }),
      queryClient.invalidateQueries({ queryKey: invitationsQueryOptions.queryKey }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.listByOwner.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.search.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.graph.queryKey() }),
    ]);
  };

  const setVaultEnabledMutation = useMutation(
    trpc.vaults.setEnabled.mutationOptions({
      onSuccess: async (_, input) => {
        await refreshVaultState();
        toast.success(input.isEnabled ? "Vault enabled" : "Vault disabled");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update vault visibility");
      },
    }),
  );

  const acceptInvitationMutation = useMutation(
    trpc.vaults.invitations.acceptInvitation.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        toast.success("Invitation accepted");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to accept invitation");
      },
    }),
  );

  const declineInvitationMutation = useMutation(
    trpc.vaults.invitations.declineInvitation.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        toast.success("Invitation declined");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to decline invitation");
      },
    }),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTheme = mounted ? (theme ?? "system") : "system";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";
  const userImage = session?.user.image;
  const memberships = membershipsQuery.data ?? [];
  const pendingInvitations = invitationsQuery.data ?? [];

  const sortedMemberships = useMemo(
    () =>
      [...memberships].sort((a, b) => {
        if (a.vault.type === b.vault.type) {
          return a.vault.name.localeCompare(b.vault.name);
        }

        const rank = { personal: 0, enterprise: 1, system_default: 2 };
        return rank[a.vault.type] - rank[b.vault.type];
      }),
    [memberships],
  );

  const handleSignOut = async () => {
    if (signOutPending) return;
    setSignOutPending(true);
    try {
      await authClient.signOut({
        fetchOptions: { onSuccess: () => router.push("/") },
      });
    } finally {
      setSignOutPending(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletePending) return;
    setDeletePending(true);
    try {
      const result = await authClient.deleteUser({ callbackURL: "/" });
      if (result.error) {
        toast.error(result.error.message || "Failed to delete account");
        return;
      }
      toast.success("Your account has been deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeletePending(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleVaultEnabled = (vaultId: string, isEnabled: boolean) => {
    setVaultEnabledMutation.mutate({ vaultId, isEnabled });
  };

  const handleInvitationAccept = (invitationId: string) => {
    acceptInvitationMutation.mutate({ invitationId });
  };

  const handleInvitationDecline = (invitationId: string) => {
    declineInvitationMutation.mutate({ invitationId });
  };

  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="mb-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-primary">
            Workspace Preferences
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account, appearance, and security.
          </p>
        </header>

        <div className="space-y-6">
          {/* ── Account ── */}
          <Section
            icon={<User className="size-4 text-muted-foreground" aria-hidden="true" />}
            title="Account"
            description="Your signed-in identity. Connected through your authentication provider."
          >
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {userImage ? (
                  <span className="size-11 shrink-0 overflow-hidden rounded-full border border-border/70 bg-muted/40">
                    <Image
                      src={userImage}
                      alt={userName}
                      width={44}
                      height={44}
                      className="size-full object-cover"
                      unoptimized
                    />
                  </span>
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted text-sm font-semibold text-muted-foreground select-none">
                    {userInitial}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                  <p className="break-all text-xs font-mono text-muted-foreground">{userEmail}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-border" />

              <Row>
                <div className="flex items-center gap-3 min-w-0">
                  <LogOut className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-foreground">Sign out</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={handleSignOut}
                  disabled={signOutPending}
                >
                  {signOutPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : null}
                  Sign out
                </Button>
              </Row>
            </div>
          </Section>

          {/* ── Appearance ── */}
          <Section
            icon={<Sun className="size-4 text-muted-foreground" aria-hidden="true" />}
            title="Appearance"
            description="Choose how Better Skills looks on this device."
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = option.value === selectedTheme;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setTheme(option.value)}
                    className={`group flex items-center gap-3 border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span
                      className={`inline-flex size-8 shrink-0 items-center justify-center transition-colors ${
                        isSelected
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                      {option.label}
                    </span>

                    <span
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/25 text-transparent"
                      }`}
                    >
                      <Check className="size-2.5" aria-hidden="true" />
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Security ── */}
          <Section
            icon={<ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />}
            title="Security"
            description="Protect your account with additional verification."
          >
            <div className="space-y-3">
              <Row>
                <div className="flex items-center gap-3 min-w-0">
                  <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      Password
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Soon
                      </Badge>
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Change
                </Button>
              </Row>

              <Row>
                <div className="flex items-center gap-3 min-w-0">
                  <ShieldCheck
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      Two-Factor Authentication
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Soon
                      </Badge>
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Enable
                </Button>
              </Row>
            </div>
          </Section>

          {/* ── Vaults ── */}
          <Section
            icon={<Building2 className="size-4 text-muted-foreground" aria-hidden="true" />}
            title="Vaults"
            description="Manage visible vaults and pending invitations. Disabled vaults stay in your membership list."
          >
            <div className="space-y-4">
              <div className="space-y-3">
                {membershipsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Loading vault memberships...
                  </div>
                ) : null}

                {!membershipsQuery.isLoading && sortedMemberships.length === 0 ? (
                  <div className="border border-dashed border-border px-4 py-4 text-xs text-muted-foreground">
                    No vault memberships found.
                  </div>
                ) : null}

                {sortedMemberships.map((membership) => {
                  const vaultType = VAULT_TYPE_META[membership.vault.type];
                  const busy =
                    setVaultEnabledMutation.isPending &&
                    setVaultEnabledMutation.variables?.vaultId === membership.vaultId;

                  return (
                    <Row key={membership.membershipId}>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {membership.vault.name}
                          </p>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {vaultType.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {membership.role}
                          </Badge>
                          {membership.isReadOnly ? (
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              Read only
                            </Badge>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                          {membership.vault.color ? (
                            <span
                              className="inline-block size-2.5 border border-border/70"
                              style={{ backgroundColor: membership.vault.color }}
                              aria-hidden="true"
                            />
                          ) : (
                            <Palette className="size-3" aria-hidden="true" />
                          )}
                          <span>/{membership.vault.slug}</span>
                          {membership.vault.isSystemManaged ? (
                            <span className="inline-flex items-center gap-1">
                              <UserCheck className="size-3" aria-hidden="true" />
                              System-managed
                            </span>
                          ) : null}
                          {!membership.isEnabled ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <EyeOff className="size-3" aria-hidden="true" />
                              Hidden from list/search/graph
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <Button
                        variant={membership.isEnabled ? "outline" : "default"}
                        size="sm"
                        className="shrink-0"
                        disabled={busy}
                        onClick={() =>
                          handleVaultEnabled(membership.vaultId, !membership.isEnabled)
                        }
                      >
                        {busy ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : membership.isEnabled ? (
                          "Disable"
                        ) : (
                          "Enable"
                        )}
                      </Button>
                    </Row>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-border" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  Pending invitations
                </div>

                {invitationsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Loading invitations...
                  </div>
                ) : null}

                {!invitationsQuery.isLoading && pendingInvitations.length === 0 ? (
                  <div className="border border-dashed border-border px-4 py-4 text-xs text-muted-foreground">
                    No pending invitations.
                  </div>
                ) : null}

                {pendingInvitations.map((invitation) => {
                  const busyAccepting =
                    acceptInvitationMutation.isPending &&
                    acceptInvitationMutation.variables?.invitationId === invitation.id;
                  const busyDeclining =
                    declineInvitationMutation.isPending &&
                    declineInvitationMutation.variables?.invitationId === invitation.id;

                  return (
                    <Row key={invitation.id}>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {invitation.vaultName}
                          </p>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {VAULT_TYPE_META[invitation.vaultType].label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {invitation.role}
                          </Badge>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          /{invitation.vaultSlug}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={busyAccepting || busyDeclining}
                          onClick={() => handleInvitationAccept(invitation.id)}
                        >
                          {busyAccepting ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Check className="size-3.5" aria-hidden="true" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={busyAccepting || busyDeclining}
                          onClick={() => handleInvitationDecline(invitation.id)}
                        >
                          {busyDeclining ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <X className="size-3.5" aria-hidden="true" />
                          )}
                          Decline
                        </Button>
                      </div>
                    </Row>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* ── Danger Zone ── */}
          <Section
            icon={<Trash2 className="size-4 text-destructive/70" aria-hidden="true" />}
            title="Danger Zone"
            description="Irreversible actions that affect your entire account."
            variant="danger"
          >
            <Row borderVariant="danger">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Delete account</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Permanently remove your account and all private data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </Button>
            </Row>
          </Section>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently removes your account and cannot be undone. You will lose
              access to your private skills and workspace settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePending}
              onClick={handleDeleteAccount}
            >
              {deletePending ? "Deleting\u2026" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
