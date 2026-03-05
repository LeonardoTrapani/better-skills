import { describe, expect, test } from "bun:test";

import { type ContentTab, type ResourceTab, computeSyncedSearchParams } from "./use-resource-tabs";

const SKILL_TAB: ContentTab = {
  kind: "skill",
  id: "skill-id",
  label: "skill.md",
};

const RESOURCE_TAB_A: ResourceTab = {
  kind: "resource",
  id: "00000000-0000-4000-8000-000000000001",
  path: "docs/a.md",
  label: "a.md",
};

const RESOURCE_TAB_B: ResourceTab = {
  kind: "resource",
  id: "00000000-0000-4000-8000-000000000002",
  path: "docs/b.md",
  label: "b.md",
};

describe("use-resource-tabs URL sync", () => {
  test("returns null when URL is already synchronized", () => {
    const currentSearchParams = new URLSearchParams({
      references: `${RESOURCE_TAB_A.id},${RESOURCE_TAB_B.id}`,
      activeTab: RESOURCE_TAB_B.id,
    });

    const result = computeSyncedSearchParams({
      currentSearchParams,
      openResourceTabs: [RESOURCE_TAB_A, RESOURCE_TAB_B],
      activeTab: RESOURCE_TAB_B,
    });

    expect(result).toBeNull();
  });

  test("sets references and activeTab while removing legacy resource param", () => {
    const currentSearchParams = new URLSearchParams({
      resource: "docs/legacy.md",
      foo: "bar",
    });

    const result = computeSyncedSearchParams({
      currentSearchParams,
      openResourceTabs: [RESOURCE_TAB_A, RESOURCE_TAB_B],
      activeTab: RESOURCE_TAB_B,
    });

    expect(result).not.toBeNull();
    expect(result?.get("references")).toBe(`${RESOURCE_TAB_A.id},${RESOURCE_TAB_B.id}`);
    expect(result?.get("activeTab")).toBe(RESOURCE_TAB_B.id);
    expect(result?.get("resource")).toBeNull();
    expect(result?.get("foo")).toBe("bar");
  });

  test("clears references and activeTab when only skill tab remains", () => {
    const currentSearchParams = new URLSearchParams({
      references: `${RESOURCE_TAB_A.id}`,
      activeTab: RESOURCE_TAB_A.id,
      resource: "docs/legacy.md",
      foo: "bar",
    });

    const result = computeSyncedSearchParams({
      currentSearchParams,
      openResourceTabs: [],
      activeTab: SKILL_TAB,
    });

    expect(result).not.toBeNull();
    expect(result?.has("references")).toBe(false);
    expect(result?.has("activeTab")).toBe(false);
    expect(result?.has("resource")).toBe(false);
    expect(result?.get("foo")).toBe("bar");
  });
});
