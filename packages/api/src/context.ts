import type { Context as HonoContext } from "hono";

import { auth } from "@better-skills/auth";

export type CreateContextOptions = {
  context: HonoContext;
};

type Session = typeof auth.$Infer.Session;

export async function createContext({ context }: CreateContextOptions) {
  const requestHeaders = context.req.raw.headers;
  const session = (await auth.api.getSession({
    headers: requestHeaders,
  })) as Session;

  return {
    session,
    requestHeaders,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
