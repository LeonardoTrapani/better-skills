import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Eye,
  FileText,
  Hexagon,
  Info,
  SquarePen,
} from "lucide-react";

import { SkillDescription } from "@/components/skills/skill-description";
import { formatDisplayDate } from "@/lib/format-display-date";
import { dashboardRoute } from "@/lib/skills/routes";
import { getEffectiveVaultColor } from "@/lib/skills/vault-colors";

function VaultHexIcon({ color }: { color: string | null }) {
  if (!color) return null;

  return (
    <svg viewBox="0 0 24 24" className="size-3 shrink-0" aria-hidden="true" focusable="false">
      <polygon
        points="12,2.5 20,7.25 20,16.75 12,21.5 4,16.75 4,7.25"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function SkillDetailHeader({
  slug,
  name,
  description,
  vaultName,
  vaultType,
  vaultColor,
  isReadOnly,
  isVaultEnabled,
  sourceIdentifier,
  sourceUrl,
  updatedAt,
  resourcesCount,
  compact = false,
  mobile = false,
  viewingResource,
  actions,
}: {
  slug: string;
  name: string;
  description?: string | null;
  vaultName: string;
  vaultType: "personal" | "enterprise" | "system_default";
  vaultColor: string | null;
  isReadOnly: boolean;
  isVaultEnabled: boolean;
  sourceIdentifier?: string | null;
  sourceUrl?: string | null;
  updatedAt: string | Date;
  resourcesCount: number;
  compact?: boolean;
  mobile?: boolean;
  viewingResource?: string | null;
  actions?: ReactNode;
}) {
  const viewingResourceName = viewingResource
    ? (viewingResource.split("/").filter(Boolean).at(-1) ?? viewingResource)
    : null;
  const displayVaultColor = getEffectiveVaultColor({
    type: vaultType,
    color: vaultColor,
  });
  const vaultLabel = vaultType === "personal" ? "Personal Vault" : vaultName;
  const vaultIndicatorColor = vaultType === "personal" ? "var(--primary)" : displayVaultColor;

  if (compact) {
    return (
      <header className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={dashboardRoute}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back to skills"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Skills
            </Link>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>

          <nav className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px] text-muted-foreground font-mono">
            <Link
              href={dashboardRoute}
              className="shrink-0 transition-colors duration-150 hover:text-foreground"
            >
              skills
            </Link>
            <span className="shrink-0 text-border">/</span>
            <span
              className={
                viewingResourceName
                  ? "min-w-0 max-w-[34%] truncate whitespace-nowrap font-medium text-foreground"
                  : "min-w-0 truncate whitespace-nowrap font-medium text-foreground"
              }
            >
              {slug}
            </span>
            {viewingResourceName && (
              <>
                <span className="shrink-0 text-border">/</span>
                <span className="min-w-0 flex-1 truncate whitespace-nowrap text-foreground">
                  {viewingResourceName}
                </span>
              </>
            )}
          </nav>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold leading-tight text-foreground break-words">
            {name}
          </h1>
          <SkillDescription description={description} />
        </div>

        {mobile ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-mono">
            <span className="truncate max-w-[200px] inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <VaultHexIcon color={vaultIndicatorColor} /> {vaultLabel}
            </span>
            <span className="text-border">|</span>
            <span>
              {resourcesCount} resource{resourcesCount !== 1 ? "s" : ""}
            </span>
            <span className="text-border">|</span>
            <span>Updated {formatDisplayDate(updatedAt)}</span>
          </div>
        ) : (
          <div>
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {isReadOnly ? (
                  <Eye className="size-3" aria-hidden="true" />
                ) : (
                  <SquarePen className="size-3" aria-hidden="true" />
                )}
                {isReadOnly ? "view only" : "editable"}
              </span>
              <span className="inline-flex items-center gap-1.5 border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                <Info className="size-3" aria-hidden="true" />
                {isVaultEnabled ? "active" : "inactive"}
              </span>
            </div>

            <h3 className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Info
            </h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="size-3" aria-hidden="true" />
                  Resources
                </span>
                <span className="font-mono text-foreground">{resourcesCount}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Hexagon className="size-3" aria-hidden="true" />
                  Vault
                </span>
                <span className="inline-flex max-w-[160px] items-center gap-1.5 truncate font-mono text-foreground">
                  <VaultHexIcon color={vaultIndicatorColor} />
                  {vaultLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3" aria-hidden="true" />
                  Updated
                </span>
                <span className="font-mono text-foreground">{formatDisplayDate(updatedAt)}</span>
              </div>
              {sourceIdentifier && (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="size-3" aria-hidden="true" />
                    Source
                  </span>
                  <span className="max-w-[160px] truncate font-mono text-foreground">
                    {sourceIdentifier}
                  </span>
                </div>
              )}
              {sourceUrl && (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                    Link
                  </span>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-[160px] items-center gap-0.5 truncate font-mono text-primary transition-colors duration-150 hover:text-primary/80"
                  >
                    source
                    <ArrowUpRight className="size-2.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-4">
        <nav className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Link
            href={dashboardRoute}
            className="shrink-0 transition-colors duration-150 hover:text-foreground"
          >
            skills
          </Link>
          <span className="shrink-0 text-border">/</span>
          <span
            className={
              viewingResourceName
                ? "min-w-0 max-w-[34%] truncate whitespace-nowrap font-medium text-foreground"
                : "min-w-0 truncate whitespace-nowrap font-medium text-foreground"
            }
          >
            {slug}
          </span>
          {viewingResourceName && (
            <>
              <span className="shrink-0 text-border">/</span>
              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-foreground">
                {viewingResourceName}
              </span>
            </>
          )}
        </nav>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight text-foreground text-balance break-words sm:text-3xl">
          {name}
        </h1>
        <SkillDescription description={description} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {isReadOnly ? "view only" : "editable"}
          </span>
          <span className="inline-flex items-center border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {isVaultEnabled ? "active" : "inactive"}
          </span>
        </div>

        <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Info
        </h3>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <FileText className="size-3" aria-hidden="true" />
              Resources
            </span>
            <span className="font-mono text-foreground">{resourcesCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Eye className="size-3" aria-hidden="true" />
              Vault
            </span>
            <span className="inline-flex max-w-[240px] items-center gap-1.5 truncate font-mono text-foreground">
              <VaultHexIcon color={vaultIndicatorColor} />
              {vaultLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3" aria-hidden="true" />
              Updated
            </span>
            <span className="font-mono text-foreground">{formatDisplayDate(updatedAt)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Eye className="size-3" aria-hidden="true" />
              Access
            </span>
            <span className="font-mono text-foreground">
              {isReadOnly ? "view only" : "editable"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block size-1.5 rounded-full bg-muted-foreground/60"
                aria-hidden="true"
              />
              Status
            </span>
            <span className="font-mono text-foreground">
              {isVaultEnabled ? "active" : "inactive"}
            </span>
          </div>
          {sourceIdentifier && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Eye className="size-3" aria-hidden="true" />
                Source
              </span>
              <span className="max-w-[240px] truncate font-mono text-foreground">
                {sourceIdentifier}
              </span>
            </div>
          )}
          {sourceUrl && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <ArrowUpRight className="size-3" aria-hidden="true" />
                Link
              </span>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-[240px] items-center gap-0.5 truncate font-mono text-primary transition-colors duration-150 hover:text-primary/80"
              >
                source
                <ArrowUpRight className="size-2.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
