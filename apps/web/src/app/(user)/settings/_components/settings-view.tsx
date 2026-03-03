"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Building2,
  Check,
  Clock3,
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
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";

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
  const [selectedManagedVaultId, setSelectedManagedVaultId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [vaultColorInput, setVaultColorInput] = useState("#6b7280");
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    vaultId: string;
    userId: string;
    userName: string;
    nextRole: "admin" | "member";
  } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{
    vaultId: string;
    userId: string;
    userName: string;
  } | null>(null);
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
        toast.error(error.message || "Failed to update vault status");
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

  const inviteMemberMutation = useMutation(
    trpc.vaults.inviteMember.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        setInviteEmail("");
        toast.success("Invitation sent");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send invitation");
      },
    }),
  );

  const updateMemberRoleMutation = useMutation(
    trpc.vaults.members.updateRole.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        setPendingRoleChange(null);
        toast.success("Member role updated");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update member role");
      },
    }),
  );

  const removeMemberMutation = useMutation(
    trpc.vaults.members.remove.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        setPendingRemoval(null);
        toast.success("Member removed");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove member");
      },
    }),
  );

  const updateVaultColorMutation = useMutation(
    trpc.vaults.updateColor.mutationOptions({
      onSuccess: async () => {
        await refreshVaultState();
        toast.success("Vault color updated");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update vault color");
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

  const visibleSettingsMemberships = useMemo(
    () => sortedMemberships.filter((membership) => membership.vault.type !== "system_default"),
    [sortedMemberships],
  );

  const manageableEnterpriseMemberships = useMemo(
    () =>
      sortedMemberships.filter(
        (membership) => membership.vault.type === "enterprise" && membership.canAdmin,
      ),
    [sortedMemberships],
  );

  const hasEnterpriseMembership = useMemo(
    () => sortedMemberships.some((membership) => membership.vault.type === "enterprise"),
    [sortedMemberships],
  );

  const managedMembersQueries = useQueries({
    queries: manageableEnterpriseMemberships.map((membership) =>
      trpc.vaults.members.list.queryOptions({ vaultId: membership.vaultId }),
    ),
  });

  const selectedManagedMembership = useMemo(() => {
    if (!selectedManagedVaultId) return manageableEnterpriseMemberships[0] ?? null;
    return (
      manageableEnterpriseMemberships.find(
        (membership) => membership.vaultId === selectedManagedVaultId,
      ) ??
      manageableEnterpriseMemberships[0] ??
      null
    );
  }, [manageableEnterpriseMemberships, selectedManagedVaultId]);

  const selectedManagedMembersQuery = useMemo(() => {
    if (!selectedManagedMembership) return null;
    const index = manageableEnterpriseMemberships.findIndex(
      (membership) => membership.vaultId === selectedManagedMembership.vaultId,
    );
    if (index < 0) return null;
    return managedMembersQueries[index] ?? null;
  }, [manageableEnterpriseMemberships, managedMembersQueries, selectedManagedMembership]);

  const selectedManagedMembers = selectedManagedMembersQuery?.data ?? [];

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

  const handleInviteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedManagedMembership) return;

    inviteMemberMutation.mutate({
      vaultId: selectedManagedMembership.vaultId,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  const handleUpdateColor = () => {
    if (!selectedManagedMembership) return;
    updateVaultColorMutation.mutate({
      vaultId: selectedManagedMembership.vaultId,
      color: vaultColorInput,
    });
  };

  const confirmRoleChange = () => {
    if (!pendingRoleChange) return;
    updateMemberRoleMutation.mutate({
      vaultId: pendingRoleChange.vaultId,
      userId: pendingRoleChange.userId,
      role: pendingRoleChange.nextRole,
    });
  };

  const confirmMemberRemoval = () => {
    if (!pendingRemoval) return;
    removeMemberMutation.mutate({
      vaultId: pendingRemoval.vaultId,
      userId: pendingRemoval.userId,
    });
  };

  useEffect(() => {
    if (manageableEnterpriseMemberships.length === 0) {
      setSelectedManagedVaultId(null);
      return;
    }

    if (
      !selectedManagedVaultId ||
      !manageableEnterpriseMemberships.some(
        (membership) => membership.vaultId === selectedManagedVaultId,
      )
    ) {
      setSelectedManagedVaultId(manageableEnterpriseMemberships[0].vaultId);
    }
  }, [manageableEnterpriseMemberships, selectedManagedVaultId]);

  useEffect(() => {
    if (!selectedManagedMembership) return;
    setVaultColorInput(selectedManagedMembership.vault.color ?? "#6b7280");
  }, [selectedManagedMembership]);

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
          <div className="order-3">
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
          </div>

          {/* ── Appearance ── */}
          <div className="order-4">
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

          {/* ── Security ── */}
          <div className="order-5">
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
          </div>

          {/* ── Vaults ── */}
          <div className="order-1">
            <Section
              icon={<Building2 className="size-4 text-muted-foreground" aria-hidden="true" />}
              title="Vaults"
              description="Manage vault membership status. Disabled vaults stay in search, graph, and sync surfaces."
            >
              <div className="space-y-3">
                {membershipsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Loading vault memberships...
                  </div>
                ) : null}

                {!membershipsQuery.isLoading && visibleSettingsMemberships.length === 0 ? (
                  <div className="border border-dashed border-border px-4 py-4 text-xs text-muted-foreground">
                    No personal or enterprise vault memberships found.
                  </div>
                ) : null}

                {visibleSettingsMemberships.map((membership) => {
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
                          {!membership.isEnabled ? (
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              Disabled
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
            </Section>
          </div>

          <div className="order-2">
            <Section
              icon={<Users className="size-4 text-muted-foreground" aria-hidden="true" />}
              title="Enterprise mailbox"
              description={
                hasEnterpriseMembership
                  ? "Manage enterprise members and invitations."
                  : "Review and respond to pending enterprise invitations."
              }
            >
              <div className="space-y-4">
                {hasEnterpriseMembership ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">
                      <Users className="size-3.5" aria-hidden="true" />
                      Enterprise admin
                    </div>

                    {manageableEnterpriseMemberships.length === 0 ? (
                      <div className="border border-dashed border-border px-4 py-4 text-xs text-muted-foreground">
                        You are part of an enterprise vault, but only owners and admins can manage
                        members.
                      </div>
                    ) : null}

                    {manageableEnterpriseMemberships.length > 0 ? (
                      <>
                        {selectedManagedMembership ? (
                          <div className="space-y-4 border border-border px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                {selectedManagedMembership.vault.color ? (
                                  <span
                                    className="size-2 rounded-full border border-border/60"
                                    style={{
                                      backgroundColor: selectedManagedMembership.vault.color,
                                    }}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <Palette
                                    className="size-3 text-muted-foreground"
                                    aria-hidden="true"
                                  />
                                )}
                                <p className="truncate text-sm font-medium text-foreground">
                                  {selectedManagedMembership.vault.name}
                                </p>
                                <span className="truncate text-xs font-mono text-muted-foreground">
                                  /{selectedManagedMembership.vault.slug}
                                </span>
                              </div>

                              {manageableEnterpriseMemberships.length > 1 ? (
                                <label className="grid gap-1.5">
                                  <span className="sr-only">Managed enterprise</span>
                                  <select
                                    value={selectedManagedMembership.vaultId}
                                    onChange={(event) =>
                                      setSelectedManagedVaultId(event.target.value)
                                    }
                                    className="h-9 w-full border border-border bg-background px-3 text-sm sm:w-auto sm:min-w-52"
                                  >
                                    {manageableEnterpriseMemberships.map((membership) => (
                                      <option key={membership.vaultId} value={membership.vaultId}>
                                        {membership.vault.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : null}
                            </div>

                            <div className="border-t border-dashed border-border" />

                            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                              <p className="text-xs text-muted-foreground">
                                Vault color is used across badges and graph nodes.
                              </p>
                              <Input
                                type="color"
                                value={vaultColorInput}
                                onChange={(event) => setVaultColorInput(event.target.value)}
                                className="h-9 w-full sm:w-20"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleUpdateColor}
                                disabled={updateVaultColorMutation.isPending}
                              >
                                {updateVaultColorMutation.isPending ? (
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                ) : null}
                                Save color
                              </Button>
                            </div>

                            <div className="border-t border-dashed border-border" />

                            <form
                              className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                              onSubmit={handleInviteSubmit}
                            >
                              <Input
                                type="email"
                                placeholder="teammate@company.com"
                                value={inviteEmail}
                                onChange={(event) => setInviteEmail(event.target.value)}
                                required
                              />
                              <select
                                value={inviteRole}
                                onChange={(event) =>
                                  setInviteRole(event.target.value as "admin" | "member")
                                }
                                className="h-9 border border-border bg-background px-3 text-sm"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={
                                  inviteMemberMutation.isPending || inviteEmail.trim().length === 0
                                }
                              >
                                {inviteMemberMutation.isPending ? (
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                ) : null}
                                Invite
                              </Button>
                            </form>

                            <div className="border-t border-dashed border-border" />

                            <div className="space-y-2">
                              <p className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">
                                Members
                              </p>

                              {selectedManagedMembersQuery?.isLoading ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                  Loading members...
                                </div>
                              ) : null}

                              {!selectedManagedMembersQuery?.isLoading &&
                              selectedManagedMembers.length === 0 ? (
                                <div className="text-xs text-muted-foreground">
                                  No members found.
                                </div>
                              ) : null}

                              {selectedManagedMembers.map((member, index) => {
                                const roleToggle = member.role === "admin" ? "member" : "admin";
                                const roleToggleLabel =
                                  member.role === "admin" ? "Set member" : "Set admin";

                                const roleBusy =
                                  updateMemberRoleMutation.isPending &&
                                  updateMemberRoleMutation.variables?.vaultId ===
                                    selectedManagedMembership.vaultId &&
                                  updateMemberRoleMutation.variables?.userId === member.userId;

                                const removeBusy =
                                  removeMemberMutation.isPending &&
                                  removeMemberMutation.variables?.vaultId ===
                                    selectedManagedMembership.vaultId &&
                                  removeMemberMutation.variables?.userId === member.userId;

                                return (
                                  <div
                                    key={member.userId}
                                    className={`flex flex-wrap items-center justify-between gap-2 py-2 ${index > 0 ? "border-t border-border/70" : ""}`}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm text-foreground">
                                        {member.name}
                                      </p>
                                      <p className="truncate text-xs font-mono text-muted-foreground">
                                        {member.email}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase font-mono"
                                      >
                                        {member.role}
                                      </Badge>

                                      {member.role !== "owner" ? (
                                        <>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={roleBusy || removeBusy}
                                            onClick={() =>
                                              setPendingRoleChange({
                                                vaultId: selectedManagedMembership.vaultId,
                                                userId: member.userId,
                                                userName: member.name,
                                                nextRole: roleToggle,
                                              })
                                            }
                                          >
                                            {roleBusy ? (
                                              <Loader2
                                                className="size-3.5 animate-spin"
                                                aria-hidden="true"
                                              />
                                            ) : null}
                                            {roleToggleLabel}
                                          </Button>

                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive"
                                            disabled={roleBusy || removeBusy}
                                            onClick={() =>
                                              setPendingRemoval({
                                                vaultId: selectedManagedMembership.vaultId,
                                                userId: member.userId,
                                                userName: member.name,
                                              })
                                            }
                                          >
                                            {removeBusy ? (
                                              <Loader2
                                                className="size-3.5 animate-spin"
                                                aria-hidden="true"
                                              />
                                            ) : null}
                                            Remove
                                          </Button>
                                        </>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] uppercase font-mono"
                                        >
                                          Owner locked
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}

                {hasEnterpriseMembership ? (
                  <div className="border-t border-dashed border-border" />
                ) : null}

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
          </div>

          {/* ── Danger Zone ── */}
          <div className="order-6">
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
            <AlertDialogCancel disabled={updateMemberRoleMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={updateMemberRoleMutation.isPending}
              onClick={confirmRoleChange}
            >
              {updateMemberRoleMutation.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeMemberMutation.isPending}
              onClick={confirmMemberRemoval}
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
