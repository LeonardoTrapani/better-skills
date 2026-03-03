import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

const ADMIN_TOKEN_HEADER = "x-better-skills-admin-token";

export const adminApiProcedure = t.procedure.use(({ ctx, next }) => {
  const configuredToken = process.env.BETTER_SKILLS_ADMIN_TOKEN;
  if (!configuredToken || configuredToken.trim().length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Admin API token is not configured",
    });
  }

  const providedToken = ctx.requestHeaders.get(ADMIN_TOKEN_HEADER);
  if (!providedToken || providedToken !== configuredToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid admin API token",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminApiToken: providedToken,
    },
  });
});
