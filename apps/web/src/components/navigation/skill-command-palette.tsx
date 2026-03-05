"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Building2,
  CornerDownLeft,
  FileText,
  Loader2,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useDebouncedValue } from "@/hooks/skills/use-skill-search";
import { authClient } from "@/lib/auth/auth-client";
import { trpc } from "@/lib/api/trpc";
import { buildResourceTabHref } from "@/lib/skills/routes";
import { VaultColorHex } from "@/components/skills/vault-color-hex";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

/** "command" | "vault" | enterprise vault id (uuid) */
type PaletteMode = "command" | "vault" | (string & {});

interface EnterpriseVault {
  id: string;
  name: string;
  color: string | null;
  joinedAt: Date | null;
}

interface PersonalVault {
  id: string;
  name: string;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  vault?: FlatItem["vault"];
  action: () => void;
  keywords?: string[];
}

interface FlatItem {
  kind: "suggestion" | "command" | "skill" | "resource";
  id: string;
  label: string;
  subtitle: string;
  vault?: {
    slug: string;
    type: "personal" | "enterprise" | "system_default";
    color: string | null;
    isReadOnly: boolean;
  } | null;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: React.ReactNode;
  sectionLabel?: string;
}

function getVaultIndicatorColor(vault: FlatItem["vault"]): string | null {
  if (!vault) return null;
  if (vault.type === "personal") return "#eab308";
  if (vault.type === "enterprise") return vault.color?.trim() ?? "var(--primary)";
  return null;
}

// ─── Mode badge ──────────────────────────────────────────────────────────────

function ModeBadge({
  mode,
  enterpriseVaults,
}: {
  mode: PaletteMode;
  enterpriseVaults: EnterpriseVault[];
}) {
  if (mode === "command") return null;

  if (mode === "vault") {
    return (
      <span className="inline-flex items-center gap-1 shrink-0 border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground font-mono">
        <VaultColorHex color="#eab308" className="size-2.5" />
        My vault
      </span>
    );
  }

  // enterprise vault mode
  const ev = enterpriseVaults.find((v) => v.id === mode);
  if (!ev) return null;

  const color = ev.color?.trim() ?? "var(--primary)";

  return (
    <span className="inline-flex items-center gap-1 shrink-0 border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground font-mono">
      <VaultColorHex color={color} className="size-2.5" />
      {ev.name}
    </span>
  );
}

// ─── Keyboard footer ─────────────────────────────────────────────────────────

function PaletteFooter({
  mode,
  hasEnterpriseVaults,
}: {
  mode: PaletteMode;
  hasEnterpriseVaults: boolean;
}) {
  return (
    <div className="lg:flex hidden items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center size-4 border border-border bg-muted rounded-sm">
            <ArrowUp className="size-2.5" />
          </kbd>
          <kbd className="inline-flex items-center justify-center size-4 border border-border bg-muted rounded-sm">
            <ArrowDown className="size-2.5" />
          </kbd>
          <span>navigate</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center size-4 border border-border bg-muted rounded-sm">
            <CornerDownLeft className="size-2.5" />
          </kbd>
          <span>select</span>
        </span>
        {mode === "command" && (
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center h-4 px-1 border border-border bg-muted rounded-sm text-[10px] font-mono">
              /
            </kbd>
            <span>vault</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-4 px-1 border border-border bg-muted rounded-sm text-[10px]">
            esc
          </kbd>
          <span>close</span>
        </span>
      </div>
      <span className="inline-flex items-center gap-1">
        <kbd className="inline-flex items-center justify-center h-4 px-1 border border-border bg-muted rounded-sm text-[10px]">
          Tab
        </kbd>
        <span>{hasEnterpriseVaults ? "cycle vaults" : "switch"}</span>
      </span>
    </div>
  );
}

// ─── Result row ──────────────────────────────────────────────────────────────

function PaletteRow({
  item,
  isSelected,
  onSelect,
  onHover,
  innerRef,
}: {
  item: FlatItem;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
  innerRef: (el: HTMLButtonElement | null) => void;
}) {
  const vaultColor = getVaultIndicatorColor(item.vault);

  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-2.5 text-left text-xs transition-colors",
        isSelected ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
      )}
    >
      <span className="flex-shrink-0 text-neutral-300">{item.icon}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {vaultColor ? <VaultColorHex color={vaultColor} className="size-2.5" /> : null}
        <span className="min-w-0 truncate">{item.label}</span>
      </span>
      {item.subtitle && (
        <span className="flex-shrink-0 text-[11px] text-muted-foreground truncate max-w-[40%]">
          {item.subtitle}
        </span>
      )}
      {item.shortcut && <span className="flex-shrink-0 ml-1">{item.shortcut}</span>}
    </button>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1.5 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SkillCommandPalette({
  open,
  onOpenChange,
  initialSearch,
  initialMode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearch?: string;
  initialMode?: PaletteMode;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mode, setMode] = useState<PaletteMode>(initialMode ?? "command");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Fetch user's vaults to find enterprise ones ─────────────────────────────

  const myVaultsQuery = useQuery({
    ...trpc.vaults.listMine.queryOptions(),
    enabled: open,
    staleTime: 30_000,
  });

  /**
   * Enterprise vaults ordered by membershipCreatedAt ascending (oldest join first).
   */
  const enterpriseVaults = useMemo<EnterpriseVault[]>(() => {
    if (!myVaultsQuery.data) return [];
    return myVaultsQuery.data
      .filter((m) => m.vault.type === "enterprise")
      .sort(
        (a, b) =>
          new Date(a.membershipCreatedAt).getTime() - new Date(b.membershipCreatedAt).getTime(),
      )
      .map((m) => ({
        id: m.vaultId,
        name: m.vault.name,
        color: m.vault.color,
        joinedAt: new Date(m.membershipCreatedAt),
      }));
  }, [myVaultsQuery.data]);

  const personalVault = useMemo<PersonalVault | null>(() => {
    if (!myVaultsQuery.data) return null;
    const personal = myVaultsQuery.data.find((m) => m.vault.type === "personal");
    if (!personal) return null;
    return { id: personal.vaultId, name: personal.vault.name };
  }, [myVaultsQuery.data]);

  // ── Mode cycle order: command → vault → enterprise1 → enterprise2 → … ───────

  const modeOrder = useMemo<PaletteMode[]>(() => {
    return ["command", "vault", ...enterpriseVaults.map((v) => v.id)];
  }, [enterpriseVaults]);

  const navigateTo = useCallback(
    (href: Route | string) => {
      const target = String(href);
      const current = `${window.location.pathname}${window.location.search}`;

      if (current === target) {
        window.location.assign(target);
        return;
      }

      router.push(target as Route);
    },
    [router],
  );

  // ── Close helper ────────────────────────────────────────────────────────────

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const runAndClose = useCallback(
    (action: () => void) => {
      close();
      action();
    },
    [close],
  );

  // ── Reset state on open/close ──────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setMode(initialMode ?? "command");
      setSearch(initialSearch ?? "");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, initialMode, initialSearch]);

  // ── Sync initialSearch ─────────────────────────────────────────────────────

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  // ── Mode cycling ───────────────────────────────────────────────────────────

  const cycleMode = useCallback(() => {
    setMode((m) => {
      const idx = modeOrder.indexOf(m);
      const next = idx === -1 ? 0 : (idx + 1) % modeOrder.length;
      return modeOrder[next] ?? "command";
    });
    setSearch("");
    setSelectedIndex(0);
  }, [modeOrder]);

  // ── Suggestions: top 3 user skills ─────────────────────────────────────────

  const suggestionsQuery = useQuery({
    ...trpc.skills.listByOwner.queryOptions({ limit: 3 }),
    placeholderData: keepPreviousData,
    enabled: open && mode === "command",
  });
  const suggestedSkills = suggestionsQuery.data?.items ?? [];

  // ── Commands ───────────────────────────────────────────────────────────────

  const isDark = resolvedTheme === "dark";

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: "search-vault",
        label: "Search your vault",
        description: "Find skills & resources",
        icon: <Search className="size-4" />,
        keywords: ["search", "find", "vault", "my"],
        action: () => {
          setMode("vault");
          setSearch("");
          setSelectedIndex(0);
        },
      },
      // One command per enterprise vault
      ...enterpriseVaults.map((ev) => ({
        id: `search-enterprise-${ev.id}`,
        label: `Search through ${ev.name} vault`,
        description: `Find skills & resources in ${ev.name}`,
        icon: <Building2 className="size-4" />,
        vault: {
          slug: ev.name,
          type: "enterprise" as const,
          color: ev.color,
          isReadOnly: false,
        },
        keywords: ["search", "find", "enterprise", ev.name.toLowerCase()],
        action: () => {
          setMode(ev.id);
          setSearch("");
          setSelectedIndex(0);
        },
      })),
      {
        id: "settings",
        label: "Settings",
        description: "Account & preferences",
        icon: <Settings className="size-4" />,
        keywords: ["settings", "account", "preferences", "profile"],
        action: () => runAndClose(() => navigateTo("/settings")),
      },
      {
        id: "switch-theme",
        label: isDark ? "Switch to light mode" : "Switch to dark mode",
        description: "Toggle color theme",
        icon: isDark ? <Sun className="size-4" /> : <Moon className="size-4" />,
        keywords: ["theme", "dark", "light", "mode", "color", "switch", "toggle"],
        action: () => {
          setTheme(isDark ? "light" : "dark");
          close();
        },
      },
      {
        id: "sign-out",
        label: "Sign out",
        description: "Log out of your account",
        icon: <LogOut className="size-4" />,
        keywords: ["sign", "out", "log", "logout", "exit"],
        action: () =>
          runAndClose(() =>
            authClient.signOut({
              fetchOptions: { onSuccess: () => router.push("/") },
            }),
          ),
      },
    ],
    [isDark, setTheme, close, runAndClose, router, navigateTo, enterpriseVaults],
  );

  // ── Vault search (personal vault — all vaults) ─────────────────────────────

  const vaultDebouncedQuery = useDebouncedValue(search.trim(), 200);

  const isPersonalVaultMode = mode === "vault";
  const activeEnterpriseVaultId =
    mode !== "command" && mode !== "vault"
      ? (enterpriseVaults.find((v) => v.id === mode)?.id ?? null)
      : null;

  const vaultQuery = useQuery({
    ...trpc.skills.searchMentions.queryOptions({
      query: vaultDebouncedQuery,
      vaultId: personalVault?.id,
      limit: 10,
    }),
    placeholderData: keepPreviousData,
    enabled: open && isPersonalVaultMode && personalVault !== null,
  });
  const vaultItems = (vaultQuery.data?.items ?? []).filter(
    (item) => item.vault?.type === "personal",
  );

  // ── Enterprise vault search ────────────────────────────────────────────────

  const enterpriseQuery = useQuery({
    ...trpc.skills.searchMentions.queryOptions({
      query: vaultDebouncedQuery,
      vaultId: activeEnterpriseVaultId ?? undefined,
      limit: 10,
    }),
    placeholderData: keepPreviousData,
    enabled: open && activeEnterpriseVaultId !== null,
  });
  const enterpriseItems = enterpriseQuery.data?.items ?? [];

  // ── Build flat item list based on mode ─────────────────────────────────────

  const flatItems = useMemo<FlatItem[]>(() => {
    if (mode === "command") {
      const items: FlatItem[] = [];
      const queryLower = search.trim().toLowerCase();

      // Filter commands by search
      const filteredCommands = queryLower
        ? commands.filter(
            (cmd) =>
              cmd.label.toLowerCase().includes(queryLower) ||
              cmd.description.toLowerCase().includes(queryLower) ||
              cmd.keywords?.some((kw) => kw.includes(queryLower)),
          )
        : commands;

      // Suggestions section (only when not filtering)
      if (!queryLower) {
        // "Search your vault" as first suggestion
        items.push({
          kind: "suggestion",
          id: "__search-vault-suggestion",
          label: "Search your vault",
          subtitle: "Find skills & resources",
          icon: <Search className="size-4" />,
          action: () => {
            setMode("vault");
            setSearch("");
            setSelectedIndex(0);
          },
          shortcut: (
            <kbd className="inline-flex items-center gap-0.5 h-5 px-1.5 border border-border bg-muted text-[10px] font-mono text-muted-foreground">
              /
            </kbd>
          ),
          sectionLabel: "Suggestions",
        });

        // Enterprise vault quick-access suggestions
        for (const ev of enterpriseVaults) {
          items.push({
            kind: "suggestion",
            id: `__search-enterprise-${ev.id}`,
            label: `Search through ${ev.name} vault`,
            subtitle: `Find skills & resources in ${ev.name}`,
            icon: <Building2 className="size-4" />,
            vault: {
              slug: ev.name,
              type: "enterprise",
              color: ev.color,
              isReadOnly: false,
            },
            action: () => {
              setMode(ev.id);
              setSearch("");
              setSelectedIndex(0);
            },
          });
        }

        // Top 3 user skills
        for (const skill of suggestedSkills) {
          items.push({
            kind: "suggestion",
            id: `suggested-${skill.id}`,
            label: skill.name,
            subtitle: skill.description ?? "",
            icon: <BookOpen className="size-4" />,
            vault: skill.vault,
            action: () => runAndClose(() => navigateTo(`/vault/skills/${skill.id}` as Route)),
          });
        }
      }

      // Commands section
      for (const [index, cmd] of filteredCommands.entries()) {
        items.push({
          kind: "command",
          id: cmd.id,
          label: cmd.label,
          subtitle: cmd.description,
          icon: cmd.icon,
          vault: cmd.vault,
          action: cmd.action,
          sectionLabel: index === 0 ? "Commands" : undefined,
        });
      }

      return items;
    }

    if (isPersonalVaultMode) {
      const items: FlatItem[] = [];

      // Group vault results: skills first, then resources
      const skills = vaultItems.filter((it) => it.type === "skill");
      const resources = vaultItems.filter((it) => it.type === "resource");

      for (const skill of skills) {
        const enterpriseColor =
          skill.vault?.type === "enterprise"
            ? (skill.vault.color?.trim() ?? "var(--primary)")
            : null;
        items.push({
          kind: "skill",
          id: skill.id,
          label: skill.label,
          subtitle: skill.subtitle ?? "",
          icon: (
            <BookOpen
              className="size-4"
              style={enterpriseColor ? { color: enterpriseColor } : undefined}
            />
          ),
          vault: skill.vault,
          action: () => runAndClose(() => navigateTo(`/vault/skills/${skill.id}` as Route)),
          sectionLabel: items.length === 0 ? "Skills" : undefined,
        });
      }

      for (const res of resources) {
        const enterpriseColor =
          res.vault?.type === "enterprise" ? (res.vault.color?.trim() ?? "var(--primary)") : null;
        items.push({
          kind: "resource",
          id: res.id,
          label: res.label,
          subtitle: res.subtitle ?? "",
          icon: (
            <FileText
              className="size-4"
              style={enterpriseColor ? { color: enterpriseColor } : undefined}
            />
          ),
          vault: res.vault,
          action: () =>
            runAndClose(() => {
              if (!res.parentSkillId) return;

              const href = buildResourceTabHref(res.parentSkillId, res.label);
              navigateTo(href);
            }),
          sectionLabel:
            items.length === skills.length && resources.indexOf(res) === 0
              ? "Resources"
              : undefined,
        });
      }

      return items;
    }

    // Enterprise vault mode
    if (activeEnterpriseVaultId !== null) {
      const items: FlatItem[] = [];
      const allItems = enterpriseItems;

      if (allItems.length === 0 && vaultDebouncedQuery.length === 0) {
        return items; // show empty state
      }

      const skills = allItems.filter((it) => it.type === "skill");
      const resources = allItems.filter((it) => it.type === "resource");

      for (const skill of skills) {
        items.push({
          kind: "skill",
          id: skill.id,
          label: skill.label,
          subtitle: skill.subtitle ?? "",
          icon: <BookOpen className="size-4" />,
          vault: skill.vault,
          action: () => runAndClose(() => navigateTo(`/vault/skills/${skill.id}` as Route)),
          sectionLabel: items.length === 0 ? "Skills" : undefined,
        });
      }

      for (const res of resources) {
        items.push({
          kind: "resource",
          id: res.id,
          label: res.label,
          subtitle: res.subtitle ?? "",
          icon: <FileText className="size-4" />,
          vault: res.vault,
          action: () =>
            runAndClose(() => {
              if (!res.parentSkillId) return;
              const href = buildResourceTabHref(res.parentSkillId, res.label);
              navigateTo(href);
            }),
          sectionLabel:
            items.length === skills.length && resources.indexOf(res) === 0
              ? "Resources"
              : undefined,
        });
      }

      return items;
    }

    return [];
  }, [
    mode,
    search,
    commands,
    suggestedSkills,
    enterpriseVaults,
    vaultDebouncedQuery,
    vaultItems,
    isPersonalVaultMode,
    activeEnterpriseVaultId,
    enterpriseItems,
    runAndClose,
    router,
    navigateTo,
  ]);

  // ── Reset selection when items change ──────────────────────────────────────

  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems.length, mode]);

  // ── Scroll selected into view ──────────────────────────────────────────────

  useEffect(() => {
    rowRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // ── Loading states ─────────────────────────────────────────────────────────

  const isLoading =
    (isPersonalVaultMode && vaultQuery.isLoading) ||
    (activeEnterpriseVaultId !== null && enterpriseQuery.isLoading);

  const showEmpty =
    (isPersonalVaultMode &&
      vaultDebouncedQuery.length > 0 &&
      !vaultQuery.isLoading &&
      flatItems.length === 0) ||
    (activeEnterpriseVaultId !== null &&
      vaultDebouncedQuery.length > 0 &&
      !enterpriseQuery.isLoading &&
      flatItems.length === 0) ||
    (mode === "command" && search.trim().length > 0 && flatItems.length === 0);

  // ── Keyboard handler ───────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      // Tab -> cycle modes (command → vault → enterprise vaults)
      if (e.key === "Tab") {
        e.preventDefault();
        cycleMode();
        return;
      }

      // "/" at start of empty input in command mode -> vault mode
      if (e.key === "/" && mode === "command" && search === "") {
        e.preventDefault();
        setMode("vault");
        setSearch("");
        setSelectedIndex(0);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => {
          if (flatItems.length === 0) return 0;
          const next = i >= flatItems.length - 1 ? 0 : i + 1;
          return next;
        });
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => {
          if (flatItems.length === 0) return 0;
          return i === 0 ? flatItems.length - 1 : i - 1;
        });
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) {
          item.action();
        }
        return;
      }

      // Backspace in non-command mode with empty search -> return to command
      if (e.key === "Backspace" && search === "" && mode !== "command") {
        e.preventDefault();
        setMode("command");
        setSelectedIndex(0);
      }
    },
    [mode, search, flatItems, selectedIndex, cycleMode],
  );

  // ── Render section headers inline ──────────────────────────────────────────

  const renderedItems = useMemo(() => {
    const elements: React.ReactNode[] = [];
    let previousSection: string | undefined;
    for (let i = 0; i < flatItems.length; i++) {
      const item = flatItems[i];
      if (item.sectionLabel && item.sectionLabel !== previousSection) {
        elements.push(
          <SectionHeader key={`section-${item.sectionLabel}-${i}`} label={item.sectionLabel} />,
        );
        previousSection = item.sectionLabel;
      }
      elements.push(
        <PaletteRow
          key={item.id}
          item={item}
          isSelected={i === selectedIndex}
          onSelect={() => item.action()}
          onHover={() => setSelectedIndex(i)}
          innerRef={(el) => {
            rowRefs.current[i] = el;
          }}
        />,
      );
    }
    return elements;
  }, [flatItems, selectedIndex]);

  // ── Derive placeholder from current mode ───────────────────────────────────

  const placeholder = useMemo(() => {
    if (mode === "command") return "Type a command...";
    if (mode === "vault") return "Search skills & resources...";
    const ev = enterpriseVaults.find((v) => v.id === mode);
    return ev ? `Search ${ev.name} skills & resources...` : "Search skills & resources...";
  }, [mode, enterpriseVaults]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Command palette</DialogTitle>
        <DialogDescription>Search commands, skills, and resources</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="p-0 top-[30%] translate-y-0 sm:max-w-xl gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* ── Search input ── */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="size-4 text-neutral-300 flex-shrink-0" />
          <ModeBadge mode={mode} enterpriseVaults={enterpriseVaults} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            name="command-palette-search"
            autoComplete="off"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            aria-label="Command palette search"
          />
          {mode === "command" && search === "" && (
            <kbd className="inline-flex h-5.5 items-center gap-1 border border-border/60 dark:border-white/8 bg-muted/50 dark:bg-white/3 px-1.5 text-[10px] text-muted-foreground/60 cursor-pointer hover:text-foreground hover:border-foreground/15 transition-colors">
              /
            </kbd>
          )}
        </div>

        {/* ── Results ── */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto border-t border-border">
          {isLoading && flatItems.length === 0 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {showEmpty && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              No results found
            </div>
          )}

          {/* Empty state for enterprise vault with no skills yet */}
          {!isLoading &&
            !showEmpty &&
            activeEnterpriseVaultId !== null &&
            vaultDebouncedQuery.length === 0 &&
            enterpriseItems.length === 0 && (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                No skills in this vault yet
              </div>
            )}

          {renderedItems}
        </div>

        {/* ── Footer ── */}
        <PaletteFooter mode={mode} hasEnterpriseVaults={enterpriseVaults.length > 0} />
      </DialogContent>
    </Dialog>
  );
}
