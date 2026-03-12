"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronRight,
  Clock3,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/auth-client";
import { trpc } from "@/lib/api/trpc";
import { VaultColorHex } from "@/components/skills/vault-color-hex";
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

/* ------------------------------------------------------------------ */
/*  Theme options                                                        */
/* ------------------------------------------------------------------ */
const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

/* ------------------------------------------------------------------ */
/*  Section shell                                                        */
/* ------------------------------------------------------------------ */
function Section({
  icon,
  title,
  description,
  children,
  headerRight,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  variant?: "default" | "danger";
}) {
  const borderColor = variant === "danger" ? "border-destructive/30" : "border-border";
  return (
    <div className={`border ${borderColor} bg-background`}>
      <div className={`border-b ${borderColor} px-5 py-5 space-y-2`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2
              className={`text-sm font-semibold uppercase font-mono tracking-wider ${variant === "danger" ? "text-destructive" : "text-foreground"}`}
            >
              {title}
            </h2>
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row                                                                  */
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

function SectionDivider({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-3 pt-6 pb-1">
      <div className="px-1">
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function RolePill({ role }: { role: "owner" | "admin" | "member" }) {
  return (
    <span className="inline-flex items-center border border-border bg-muted/40 px-2 py-px text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      {role}
    </span>
  );
}

function getVaultHexColor(vault: {
  type: "personal" | "enterprise" | "system_default";
  color: string | null;
}) {
  if (vault.type === "personal") return "#eab308";
  if (vault.type === "enterprise") return vault.color?.trim() ?? "var(--primary)";
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main                                                                 */
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
      queryClient.invalidateQueries({
        queryKey: membershipsQueryOptions.queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: invitationsQueryOptions.queryKey,
      }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.list.queryKey() }),
      queryClient.invalidateQueries({
        queryKey: trpc.skills.listByOwner.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.skills.search.queryKey(),
      }),
      queryClient.invalidateQueries({ queryKey: trpc.skills.graph.queryKey() }),
    ]);
  };

  const setVaultEnabledMutation = useMutation(
    trpc.vaults.setEnabled.mutationOptions({
      onSuccess: async (_, input) => {
        await refreshVaultState();
        toast.success(input.isEnabled ? "Vault enabled" : "Vault disabled");
      },
      onError: (error) => toast.error(error.message || "Failed to update vault status"),
    }),
  );

  const acceptInvitationMutation = useMutation(
    trpc.vaults.invitations.acceptInvitation.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        toast.success("Invitation accepted");
      },
      onError: (error) => toast.error(error.message || "Failed to accept invitation"),
    }),
  );

  const declineInvitationMutation = useMutation(
    trpc.vaults.invitations.declineInvitation.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        toast.success("Invitation declined");
      },
      onError: (error) => toast.error(error.message || "Failed to decline invitation"),
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
        if (a.vault.type === b.vault.type) return a.vault.name.localeCompare(b.vault.name);
        const rank = { personal: 0, enterprise: 1, system_default: 2 };
        return rank[a.vault.type] - rank[b.vault.type];
      }),
    [memberships],
  );

  const visibleSettingsMemberships = useMemo(
    () => sortedMemberships.filter((m) => m.vault.type !== "system_default"),
    [sortedMemberships],
  );

  const enterpriseMemberships = useMemo(
    () => sortedMemberships.filter((m) => m.vault.type === "enterprise"),
    [sortedMemberships],
  );

  const hasPendingEnterpriseInvitation = useMemo(
    () => pendingInvitations.some((inv) => inv.vaultType === "enterprise"),
    [pendingInvitations],
  );

  const shouldShowVaultsSection = useMemo(() => sortedMemberships.length > 2, [sortedMemberships]);

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
            Manage vaults, enterprise access, account, appearance, and security.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {/* ── Account ── */}
          <div>
            <Section
              icon={<User className="size-4 text-muted-foreground" aria-hidden="true" />}
              title="Account"
              description="Your signed-in identity. Connected through your authentication provider."
            >
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {userImage ? (
                    <span className="size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted/40">
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
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground select-none">
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
                    {signOutPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Sign out
                  </Button>
                </Row>
              </div>
            </Section>
          </div>

          {/* ── Appearance ── */}
          <div>
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
          </div>

          <SectionDivider
            title="Workspaces"
            subtitle="Organization memberships, invitations, and vault controls."
          />

          {/* ── Enterprise organizations ── */}
          <div>
            <Section
              icon={<Building2 className="size-4 text-muted-foreground" aria-hidden="true" />}
              title="Organizations"
              headerRight={
                hasPendingEnterpriseInvitation ? (
                  <span
                    aria-label="Pending invitations"
                    className="inline-block size-2.5 bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary)/0.75)]"
                  />
                ) : null
              }
              description="Enterprise vaults you belong to. Owners and admins can manage members and settings."
            >
              <div className="space-y-4">
                {membershipsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading…
                  </div>
                ) : null}

                {!membershipsQuery.isLoading &&
                enterpriseMemberships.length === 0 &&
                pendingInvitations.length === 0 ? (
                  <div className="border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
                    You are not part of any enterprise organization yet.
                  </div>
                ) : null}

                {/* Enterprise org rows */}
                {enterpriseMemberships.length > 0 && (
                  <div className="divide-y divide-border border border-border">
                    {enterpriseMemberships.map((m) => (
                      <div key={m.vaultId} className="flex items-center gap-3 px-4 py-3.5">
                        <VaultColorHex
                          color={getVaultHexColor({
                            type: m.vault.type,
                            color: m.vault.color,
                          })}
                          className="size-4"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {m.vault.name}
                            </p>
                            {m.role !== "member" && <RolePill role={m.role} />}
                          </div>
                          <p className="mt-px text-[10px] font-mono text-muted-foreground">
                            Enterprise organization
                          </p>
                        </div>
                        {m.canAdmin && (
                          <Link
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            href={`/settings/enterprise/${m.vault.slug}` as any}
                            className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Manage
                            <ChevronRight className="size-3.5" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending invitations */}
                {(invitationsQuery.isLoading || pendingInvitations.length > 0) && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <Clock3 className="size-3" />
                      Pending invitations
                    </p>
                    {invitationsQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Loading…
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
                        <div
                          key={invitation.id}
                          className="flex items-center gap-3 border border-border px-4 py-3"
                        >
                          <VaultColorHex
                            color={
                              invitation.vaultType === "enterprise"
                                ? invitation.vaultColor
                                : "#eab308"
                            }
                            className="size-4"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {invitation.vaultName}
                            </p>
                            <p className="mt-px text-[10px] font-mono text-muted-foreground">
                              invited as {invitation.role}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 gap-1 px-2.5 text-xs"
                              disabled={busyAccepting || busyDeclining}
                              onClick={() =>
                                acceptInvitationMutation.mutate({
                                  invitationId: invitation.id,
                                })
                              }
                            >
                              {busyAccepting ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2.5 text-xs"
                              disabled={busyAccepting || busyDeclining}
                              onClick={() =>
                                declineInvitationMutation.mutate({
                                  invitationId: invitation.id,
                                })
                              }
                            >
                              {busyDeclining ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <X className="size-3" />
                              )}
                              Decline
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* ── Vaults ── */}
          {shouldShowVaultsSection ? (
            <div>
              <Section
                icon={<Users className="size-4 text-muted-foreground" aria-hidden="true" />}
                title="Vaults"
                description="Enable or disable vault membership. Disabled vaults are hidden from search, graph, and sync."
              >
                <div className="space-y-2">
                  {membershipsQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading…
                    </div>
                  ) : null}
                  {!membershipsQuery.isLoading && visibleSettingsMemberships.length === 0 ? (
                    <div className="border border-dashed border-border px-4 py-4 text-xs text-muted-foreground">
                      No vault memberships found.
                    </div>
                  ) : null}
                  <div className="divide-y divide-border border border-border">
                    {visibleSettingsMemberships.map((membership) => {
                      const isPersonal = membership.vault.type === "personal";
                      const busy =
                        setVaultEnabledMutation.isPending &&
                        setVaultEnabledMutation.variables?.vaultId === membership.vaultId;
                      return (
                        <div
                          key={membership.membershipId}
                          className="flex items-center gap-3 px-4 py-3.5"
                        >
                          <VaultColorHex
                            color={getVaultHexColor({
                              type: membership.vault.type,
                              color: membership.vault.color,
                            })}
                            className="size-4"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`truncate text-sm font-medium ${!membership.isEnabled ? "text-muted-foreground line-through" : "text-foreground"}`}
                              >
                                {membership.vault.name}
                              </p>
                              {/* Only show role if not personal owner (that's implied) */}
                              {!(isPersonal && membership.role === "owner") && (
                                <RolePill role={membership.role} />
                              )}
                              {membership.isReadOnly && (
                                <span className="border border-border bg-muted/40 px-2 py-px text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                  Read only
                                </span>
                              )}
                              {!membership.isEnabled && (
                                <span className="border border-border bg-muted/40 px-2 py-px text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">
                              {isPersonal ? "Personal vault" : "Enterprise vault"}
                              {membership.vault.isSystemManaged && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <UserCheck className="size-3" />
                                  System-managed
                                </span>
                              )}
                            </p>
                          </div>

                          <Button
                            variant={membership.isEnabled ? "outline" : "default"}
                            size="sm"
                            className="shrink-0"
                            disabled={busy}
                            onClick={() =>
                              setVaultEnabledMutation.mutate({
                                vaultId: membership.vaultId,
                                isEnabled: !membership.isEnabled,
                              })
                            }
                          >
                            {busy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : membership.isEnabled ? (
                              "Disable"
                            ) : (
                              "Enable"
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Section>
            </div>
          ) : null}

          <SectionDivider
            title="Security"
            subtitle="Account protection, sign-in safeguards, and destructive actions."
          />

          {/* ── Security ── */}
          <div>
            <Section
              icon={<ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />}
              title="Security"
              description="Protect your account with additional verification."
            >
              <div className="space-y-3">
                <Row>
                  <div className="flex items-center gap-3 min-w-0">
                    <Lock className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        Password
                        <span className="ml-2 border border-border px-1.5 py-px text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Soon
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" disabled>
                    Change
                  </Button>
                </Row>
                <Row>
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        Two-Factor Authentication
                        <span className="ml-2 border border-border px-1.5 py-px text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Soon
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" disabled>
                    Enable
                  </Button>
                </Row>
              </div>
            </Section>
          </div>

          {/* ── Danger Zone ── */}
          <div>
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
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </Row>
            </Section>
          </div>
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
              {deletePending ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
