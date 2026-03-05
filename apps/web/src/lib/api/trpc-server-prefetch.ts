import "server-only";

import type { AppRouter } from "@better-skills/api/routers/index";
import { env } from "@better-skills/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";

export async function createServerPrefetchClient() {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
        headers() {
          return cookie ? { cookie } : {};
        },
        fetch(url, options) {
          return fetch(url, {
            ...options,
            cache: "no-store",
          });
        },
      }),
    ],
  });
}
