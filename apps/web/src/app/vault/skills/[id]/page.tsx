import type { AppRouter } from "@better-skills/api/routers/index";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { buildSkillHref } from "@/lib/skills/routes";
import { requireSession } from "@/lib/auth/require-session";
import { createServerPrefetchClient } from "@/lib/api/trpc-server-prefetch";

import SkillDetail from "./skill-detail";

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await requireSession(buildSkillHref(id));

  const queryClient = new QueryClient();
  const serverTrpc = createTRPCOptionsProxy<AppRouter>({
    client: await createServerPrefetchClient(),
    queryClient,
  });

  await Promise.allSettled([
    queryClient.prefetchQuery(serverTrpc.skills.getById.queryOptions({ id, linkMentions: true })),
    queryClient.prefetchQuery(serverTrpc.skills.graphForSkill.queryOptions({ skillId: id })),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <SkillDetail id={id} />
    </HydrationBoundary>
  );
}
