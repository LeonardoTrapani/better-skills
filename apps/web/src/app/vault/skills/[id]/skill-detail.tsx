"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { DesktopSkillGraphPanel } from "@/components/skills/detail-page/skill-graph-panels";
import { SkillPageErrorState } from "@/components/skills/detail-page/skill-page-error-state";
import { SkillPageLoadingState } from "@/components/skills/detail-page/skill-page-loading-state";
import { createMarkdownComponents } from "@/components/markdown/markdown-components";
import { markdownUrlTransform } from "@/components/markdown/markdown-url-transform";
import { ForceGraph, type GraphNode } from "@/components/skills/graph/force-graph";
import { authClient } from "@/lib/auth/auth-client";
import { GridBackground } from "@/components/ui/grid-background";
import { useResourceTabs } from "@/hooks/skills/use-resource-tabs";
import {
  createResourceHrefResolver,
  type SkillResourceReference,
} from "@/lib/skills/resource-links";
import {
  buildLoginHref,
  buildSharedSkillViewHref,
  buildSkillHref,
  dashboardRoute,
} from "@/lib/skills/routes";
import { trpc } from "@/lib/api/trpc";
import { ContentTabBar } from "@/app/vault/skills/[id]/_components/content-tab-bar";
import { ResourceTabContent } from "@/app/vault/skills/[id]/_components/resource-tab-content";
import { SharedImportButton } from "@/app/vault/skills/[id]/_components/shared-import-button";
import { SkillDetailHeader } from "@/app/vault/skills/[id]/_components/skill-detail-header";
import { SkillShareButton } from "@/app/vault/skills/[id]/_components/skill-share-button";
import { SidebarPanel } from "@/app/vault/skills/[id]/_components/sidebar-panel";
import {
  MobileSectionControl,
  type MobileSection,
} from "@/app/vault/skills/[id]/_components/mobile-section-control";
import { ResourceList } from "@/components/skills/resource-list";
import { useIsDesktopLg } from "@/hooks/use-is-desktop-lg";

const SKILL_DETAIL_STALE_TIME_MS = 60_000;
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_QUERY_PARAM_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SkillDetailProps = { id: string; shareId?: never } | { id?: never; shareId: string };
type SkillDetailMode = "vault" | "share";

type SkillDetailData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  originalMarkdown: string;
  renderedMarkdown: string;
  sourceIdentifier: string | null;
  sourceUrl: string | null;
  resources: SkillResourceReference[];
  vault: {
    name: string;
    type: "personal" | "enterprise" | "system_default";
    color: string | null;
    isReadOnly: boolean;
    isEnabled: boolean;
  };
  updatedAt: string | Date;
};

function SkillDetailInner({ id, shareId }: SkillDetailProps) {
  const mode: SkillDetailMode = shareId ? "share" : "vault";

  const isDesktopLg = useIsDesktopLg();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [mobileSection, setMobileSection] = useState<MobileSection>("content");
  const [hasAutoImportStarted, setHasAutoImportStarted] = useState(false);

  const selectedShareSkillId = useMemo(() => {
    if (mode !== "share") {
      return undefined;
    }

    const queryValue = searchParams.get("skill")?.trim();
    if (!queryValue || !UUID_QUERY_PARAM_RE.test(queryValue)) {
      return undefined;
    }

    return queryValue.toLowerCase();
  }, [mode, searchParams]);

  const routeParamId =
    id ?? (shareId ? `${shareId}:${selectedShareSkillId ?? "root"}` : undefined) ?? EMPTY_UUID;

  const { data: session } = authClient.useSession();

  const vaultSkillQuery = useQuery({
    ...trpc.skills.getById.queryOptions({
      id: id ?? EMPTY_UUID,
      linkMentions: true,
      includeResourceContent: false,
    }),
    staleTime: SKILL_DETAIL_STALE_TIME_MS,
    enabled: mode === "vault" && Boolean(id),
  });

  const sharedSkillQuery = useQuery({
    ...trpc.skills.getShareById.queryOptions({
      shareId: shareId ?? EMPTY_UUID,
      skillId: selectedShareSkillId,
    }),
    staleTime: SKILL_DETAIL_STALE_TIME_MS,
    enabled: mode === "share" && Boolean(shareId),
  });

  const detailData = useMemo<SkillDetailData | null>(() => {
    if (mode === "vault") {
      const data = vaultSkillQuery.data;
      if (!data) return null;

      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        originalMarkdown: data.originalMarkdown,
        renderedMarkdown: data.renderedMarkdown,
        sourceIdentifier: data.sourceIdentifier,
        sourceUrl: data.sourceUrl,
        resources: data.resources.map((resource) => ({
          id: resource.id,
          path: resource.path,
          kind: resource.kind,
          content: resource.content,
          renderedContent: resource.renderedContent,
          updatedAt: resource.updatedAt,
        })),
        vault: {
          name: data.vault.name,
          type: data.vault.type,
          color: data.vault.color,
          isReadOnly: data.vault.isReadOnly,
          isEnabled: data.vault.isEnabled,
        },
        updatedAt: data.updatedAt,
      };
    }

    const data = sharedSkillQuery.data;
    if (!data) return null;

    const activeSkill = data.activeSkill;

    return {
      id: activeSkill.id,
      slug: activeSkill.slug,
      name: activeSkill.name,
      description: activeSkill.description,
      originalMarkdown: activeSkill.originalMarkdown,
      renderedMarkdown: activeSkill.renderedMarkdown,
      sourceIdentifier: activeSkill.sourceIdentifier,
      sourceUrl: activeSkill.sourceUrl,
      resources: activeSkill.resources.map((resource) => ({
        id: resource.id,
        path: resource.path,
        kind: resource.kind,
        content: resource.content,
        renderedContent: resource.renderedContent,
        updatedAt: data.createdAt,
      })),
      vault: {
        name: "Shared skill",
        type: "enterprise",
        color: null,
        isReadOnly: true,
        isEnabled: true,
      },
      updatedAt: data.createdAt,
    };
  }, [mode, sharedSkillQuery.data, vaultSkillQuery.data]);

  const isLoading = mode === "share" ? sharedSkillQuery.isLoading : vaultSkillQuery.isLoading;
  const isError = mode === "share" ? sharedSkillQuery.isError : vaultSkillQuery.isError;

  const resources = detailData?.resources ?? [];
  const skillSlug = detailData?.slug ?? detailData?.name ?? "skill";
  const skillId = detailData?.id ?? id ?? EMPTY_UUID;

  const {
    tabs,
    activeTab,
    activeTabId,
    activeResourcePath,
    focusNodeId,
    openResource,
    closeTab,
    switchTab,
  } = useResourceTabs({
    skillId,
    skillSlug,
    resources,
    isReady: !isLoading && Boolean(detailData),
  });

  const shouldLoadGraph = isDesktopLg || mobileSection === "graph";

  const graphForSkillQuery = useQuery({
    ...trpc.skills.graphForSkill.queryOptions({ skillId }),
    staleTime: SKILL_DETAIL_STALE_TIME_MS,
    enabled: mode === "vault" && shouldLoadGraph && Boolean(detailData),
  });

  const graphForShareQuery = useQuery({
    ...trpc.skills.graphForShare.queryOptions({
      shareId: shareId ?? EMPTY_UUID,
    }),
    staleTime: SKILL_DETAIL_STALE_TIME_MS,
    enabled: mode === "share" && shouldLoadGraph && Boolean(shareId),
  });

  const graphQuery = mode === "share" ? graphForShareQuery : graphForSkillQuery;
  const autoImportRequested = mode === "share" && searchParams.get("autoImport") === "1";

  const importShareMutation = useMutation(
    trpc.skills.importShare.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.skills.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.skills.listByOwner.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.skills.graph.queryKey(),
          }),
        ]);

        toast.success("shared skill imported. run better-skills sync in your terminal.");
        router.push(dashboardRoute);
      },
      onError: (error) => {
        const isAuthError =
          error.data?.code === "UNAUTHORIZED" ||
          error.data?.httpStatus === 401 ||
          /authentication required|unauthorized/i.test(error.message);

        if (mode === "share" && isAuthError) {
          const fallbackPath =
            shareId !== undefined ? `/share/${encodeURIComponent(shareId)}?autoImport=1` : pathname;
          const loginHref = buildLoginHref(fallbackPath);

          toast.error("sign in to import this skill");

          if (typeof window !== "undefined") {
            window.location.assign(loginHref);
            return;
          }

          router.push(loginHref);
          return;
        }

        toast.error(error.message || "failed to import shared skill");
      },
    }),
  );

  useEffect(() => {
    setHasAutoImportStarted(false);
  }, [shareId]);

  useEffect(() => {
    if (mode !== "share") return;
    if (!shareId || !autoImportRequested) return;
    if (!session?.user?.id) return;
    if (hasAutoImportStarted || importShareMutation.isPending) return;

    setHasAutoImportStarted(true);
    importShareMutation.mutate({ shareId });
  }, [
    autoImportRequested,
    hasAutoImportStarted,
    importShareMutation,
    mode,
    session?.user?.id,
    shareId,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [routeParamId]);

  const handleOpenResourceTab = useCallback(
    (resource: SkillResourceReference) => {
      openResource(resource);
      setMobileSection("content");
    },
    [openResource],
  );

  const handleMobileTabSwitch = useCallback(
    (tabId: string) => {
      switchTab(tabId);
      setMobileSection("content");
    },
    [switchTab],
  );

  const handleResourceListNavigate = useCallback(
    (event: React.MouseEvent<HTMLElement>, href: string) => {
      const skillHref = `/vault/skills/${encodeURIComponent(skillId)}`;
      const legacyPrefix = `${skillHref}/resources/`;

      let decodedPath: string | null = null;
      if (href.startsWith(legacyPrefix)) {
        const encodedPath = href.slice(legacyPrefix.length);
        decodedPath = encodedPath
          .split("/")
          .filter(Boolean)
          .map((segment) => decodeURIComponent(segment))
          .join("/");
      } else {
        const parsed = new URL(href, window.location.origin);
        if (parsed.pathname !== skillHref) return;

        decodedPath = parsed.searchParams.get("resource");
      }

      if (!decodedPath) return;

      const resource = resources.find((resourceItem) => resourceItem.path === decodedPath);
      if (resource) {
        event.preventDefault();
        openResource(resource);
        setMobileSection("content");
      }
    },
    [openResource, resources, skillId],
  );

  const handleGraphNodeClick = useCallback(
    (node: GraphNode): boolean | void => {
      if (node.type === "skill") {
        if (node.id === skillId) {
          switchTab(skillId);
          setMobileSection("content");
          return true;
        }

        if (mode === "share" && shareId) {
          router.push(buildSharedSkillViewHref(shareId, node.id));
          setMobileSection("content");
          return true;
        }
      }

      if (node.type === "resource") {
        const resource = resources.find((resourceItem) => resourceItem.id === node.id);
        if (resource) {
          openResource(resource);
          setMobileSection("content");
          return true;
        }

        if (mode === "share" && shareId && node.parentSkillId) {
          router.push(buildSharedSkillViewHref(shareId, node.parentSkillId));
          setMobileSection("content");
          return true;
        }
      }
    },
    [mode, openResource, resources, router, shareId, skillId, switchTab],
  );

  const resolveSkillHref = useCallback(
    (targetSkillId: string) => {
      if (mode === "share" && shareId) {
        return buildSharedSkillViewHref(shareId, targetSkillId);
      }

      return buildSkillHref(targetSkillId);
    },
    [mode, shareId],
  );

  const markdownComponents = useMemo(
    () =>
      createMarkdownComponents({
        skillId,
        skillName: detailData?.name,
        findResourceByHref: createResourceHrefResolver(resources),
        onResourceNavigate: handleOpenResourceTab,
        resolveSkillHref,
        shareIdForSkillHover: mode === "share" ? shareId : undefined,
      }),
    [detailData?.name, handleOpenResourceTab, mode, resolveSkillHref, resources, shareId, skillId],
  );

  const activeSharedResource = useMemo(() => {
    if (mode !== "share" || activeTab.kind !== "resource") {
      return null;
    }

    return resources.find((resource) => resource.path === activeTab.path) ?? null;
  }, [activeTab, mode, resources]);

  if (isLoading) {
    return <SkillPageLoadingState />;
  }

  if (isError || !detailData) {
    return (
      <SkillPageErrorState
        message={
          mode === "share"
            ? "This shared skill link is not valid or is no longer available."
            : "The requested skill is not accessible or does not exist."
        }
        href={dashboardRoute}
        ctaLabel="Back to Skills"
      />
    );
  }

  const headerProps = {
    slug: detailData.slug,
    name: detailData.name,
    description: detailData.description,
    vaultName: detailData.vault.name,
    vaultType: detailData.vault.type,
    vaultColor: detailData.vault.color,
    isReadOnly: detailData.vault.isReadOnly,
    isVaultEnabled: detailData.vault.isEnabled,
    sourceIdentifier: detailData.sourceIdentifier,
    sourceUrl: detailData.sourceUrl,
    updatedAt: detailData.updatedAt,
    resourcesCount: detailData.resources.length,
  };

  const canShareSkill =
    mode === "vault" && (detailData.vault.type !== "enterprise" || !detailData.vault.isReadOnly);

  const includedShareSkills = mode === "share" ? (sharedSkillQuery.data?.includedSkills ?? []) : [];
  const shareStats = mode === "share" ? sharedSkillQuery.data?.stats : null;

  const showShareAction = mode !== "share" && canShareSkill;

  const viewingResourceLabel = activeTab.kind === "resource" ? activeTab.path : null;

  return (
    <main className="relative min-h-screen bg-background lg:h-[calc(100dvh-52px)] lg:min-h-0 lg:overflow-hidden">
      <div className="relative p-4 pb-6 sm:p-6 lg:hidden">
        <div className="mx-auto space-y-5">
          <SkillDetailHeader
            {...headerProps}
            compact
            mobile
            viewingResource={mobileSection === "content" ? viewingResourceLabel : null}
            actions={showShareAction ? <SkillShareButton skillId={skillId} /> : null}
          />

          {mode === "share" && shareId ? (
            <div className="border border-border bg-primary/5 px-4 py-3 sm:px-">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Import this shared skill</p>
                <p className="text-xs text-muted-foreground">
                  {includedShareSkills.length} skills and {shareStats?.resources ?? 0} resources
                  will be cloned into your vault.
                </p>

                <SharedImportButton
                  shareId={shareId}
                  includedSkills={includedShareSkills}
                  resourcesCount={shareStats?.resources ?? 0}
                  isImporting={importShareMutation.isPending}
                  onConfirmImport={() => importShareMutation.mutate({ shareId })}
                  label="Import to vault"
                />
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden border border-border bg-background/90">
            <MobileSectionControl
              value={mobileSection}
              onChange={setMobileSection}
              resourceCount={resources.length}
            />

            {mobileSection === "content" && tabs.length > 1 && (
              <div className="border-b border-border bg-background/70">
                <ContentTabBar
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onSwitch={handleMobileTabSwitch}
                  onClose={closeTab}
                />
              </div>
            )}

            <div
              id="skill-mobile-section-panel-content"
              role="tabpanel"
              aria-labelledby="skill-mobile-section-tab-content"
              hidden={mobileSection !== "content"}
              className={mobileSection === "content" ? "block" : "hidden"}
            >
              {activeTab.kind === "skill" ? (
                <div className="px-4 py-5 sm:px-5">
                  <article className="min-w-0 break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                      urlTransform={markdownUrlTransform}
                    >
                      {detailData.renderedMarkdown || detailData.originalMarkdown}
                    </ReactMarkdown>
                  </article>
                </div>
              ) : mode === "share" ? (
                activeSharedResource ? (
                  <div className="px-4 py-5 sm:px-5">
                    <article className="min-w-0 break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                        urlTransform={markdownUrlTransform}
                      >
                        {activeSharedResource.renderedContent || activeSharedResource.content}
                      </ReactMarkdown>
                    </article>
                  </div>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      Failed to load resource content.
                    </p>
                  </div>
                )
              ) : (
                activeResourcePath && (
                  <ResourceTabContent
                    skillId={skillId}
                    skillName={detailData.name}
                    resourcePath={activeResourcePath}
                    resources={resources}
                    onResourceNavigate={handleOpenResourceTab}
                    compact
                  />
                )
              )}
            </div>

            <div
              id="skill-mobile-section-panel-resources"
              role="tabpanel"
              aria-labelledby="skill-mobile-section-tab-resources"
              hidden={mobileSection !== "resources"}
              className={mobileSection === "resources" ? "block" : "hidden"}
            >
              <ResourceList
                resources={resources}
                skillId={skillId}
                skillName={detailData.name}
                emptyMessage="No resources attached."
                onNavigate={handleResourceListNavigate}
              />
            </div>

            <div
              id="skill-mobile-section-panel-graph"
              role="tabpanel"
              aria-labelledby="skill-mobile-section-tab-graph"
              hidden={mobileSection !== "graph"}
              className={
                mobileSection === "graph" ? "relative min-h-[360px] overflow-hidden" : "hidden"
              }
            >
              {graphQuery.isLoading ? (
                <div className="flex h-[360px] items-center justify-center">
                  <Loader2
                    className="size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              ) : graphQuery.isError ? (
                <div className="flex h-[360px] items-center justify-center">
                  <p className="text-xs text-muted-foreground">Failed to load graph</p>
                </div>
              ) : graphQuery.data ? (
                <>
                  <GridBackground className="opacity-32" />
                  <ForceGraph
                    data={graphQuery.data}
                    focusNodeId={focusNodeId}
                    height={380}
                    onNodeClick={handleGraphNodeClick}
                    mobileInitialScale={0.9}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden h-full lg:flex">
        <aside className="w-[280px] xl:w-[320px] shrink-0 border-r border-border flex flex-col">
          <div className="px-5 pt-2 overflow-y-auto shrink-0 border-border">
            <SkillDetailHeader
              {...headerProps}
              compact
              viewingResource={viewingResourceLabel}
              actions={null}
            />
          </div>

          {showShareAction ? (
            <div className="border-b border-border px-5 py-4">
              <SkillShareButton skillId={skillId} className="h-10 w-full justify-center" />
            </div>
          ) : null}

          <SidebarPanel
            graphContent={
              <DesktopSkillGraphPanel
                data={graphQuery.data}
                isLoading={graphQuery.isLoading}
                isError={graphQuery.isError}
                focusNodeId={focusNodeId}
                onNodeClick={handleGraphNodeClick}
                showTitle={false}
              />
            }
            resourcesContent={
              <div className="py-4">
                <ResourceList
                  resources={detailData.resources}
                  skillId={detailData.id}
                  skillName={detailData.name}
                  emptyMessage="No resources attached."
                  onNavigate={handleResourceListNavigate}
                />
              </div>
            }
          />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          {mode === "share" && shareId ? (
            <div className="border-b border-border bg-primary/5 py-3">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Import this shared skill</p>
                  <p className="text-xs text-muted-foreground">
                    {includedShareSkills.length} skills and {shareStats?.resources ?? 0} resources
                    will be cloned into your vault.
                  </p>
                </div>

                <SharedImportButton
                  shareId={shareId}
                  includedSkills={includedShareSkills}
                  resourcesCount={shareStats?.resources ?? 0}
                  isImporting={importShareMutation.isPending}
                  onConfirmImport={() => importShareMutation.mutate({ shareId })}
                  size="default"
                  label="Import to vault"
                />
              </div>
            </div>
          ) : null}

          <div className="border-b border-border">
            <ContentTabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSwitch={switchTab}
              onClose={closeTab}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab.kind === "skill" ? (
              <div className="mx-auto px-8 xl:px-16 py-8">
                <article className="mt-3 min-w-0 break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                    urlTransform={markdownUrlTransform}
                  >
                    {detailData.renderedMarkdown || detailData.originalMarkdown}
                  </ReactMarkdown>
                </article>
              </div>
            ) : mode === "share" ? (
              activeSharedResource ? (
                <div className="mx-auto px-8 xl:px-16 py-8">
                  <article className="mt-3 min-w-0 break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                      urlTransform={markdownUrlTransform}
                    >
                      {activeSharedResource.renderedContent || activeSharedResource.content}
                    </ReactMarkdown>
                  </article>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                  <p className="text-sm text-muted-foreground">Failed to load resource content.</p>
                </div>
              )
            ) : (
              activeResourcePath && (
                <ResourceTabContent
                  skillId={skillId}
                  skillName={detailData.name}
                  resourcePath={activeResourcePath}
                  resources={resources}
                  onResourceNavigate={handleOpenResourceTab}
                />
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SkillDetail(props: SkillDetailProps) {
  return (
    <Suspense fallback={<SkillPageLoadingState />}>
      <SkillDetailInner {...props} />
    </Suspense>
  );
}
