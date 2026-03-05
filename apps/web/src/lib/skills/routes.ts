import type { Route } from "next";

export const dashboardRoute = "/vault" as Route;
export const deviceRoute = "/device" as Route;
export const welcomeRoute = "/welcome" as Route;

export function buildSkillHref(skillId: string) {
  const encodedId = encodeURIComponent(skillId);
  return `/vault/skills/${encodedId}` as Route;
}

export function buildSharedSkillHref(shareId: string) {
  const encodedShareId = encodeURIComponent(shareId);

  return `/share/${encodedShareId}` as Route;
}

export function buildSharedSkillViewHref(shareId: string, skillId: string) {
  const baseHref = buildSharedSkillHref(shareId);
  const query = new URLSearchParams({ skill: skillId });

  return `${baseHref}?${query.toString()}` as Route;
}

export function buildResourceHref(skillId: string, resourcePath: string) {
  return buildResourceTabHref(skillId, resourcePath);
}

export function buildResourceTabHref(skillId: string, resourcePath: string) {
  const query = new URLSearchParams({ resource: resourcePath });
  return `${buildSkillHref(skillId)}?${query.toString()}` as Route;
}

export function buildLoginHref(nextPath?: string) {
  if (!nextPath) {
    return "/login" as Route;
  }

  return `/login?next=${encodeURIComponent(nextPath)}` as Route;
}

export function buildDeviceAuthorizationHref(userCode?: string) {
  if (!userCode) {
    return deviceRoute;
  }

  return `${deviceRoute}?user_code=${encodeURIComponent(userCode)}` as Route;
}
