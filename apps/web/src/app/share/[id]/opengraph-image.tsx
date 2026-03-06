import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/_og/brand-mark";
import { getSharePreview } from "@/lib/share/get-share-preview";

export const alt = "BETTER-SKILLS shared skill preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type ShareOgImageProps = {
  params: Promise<{ id: string }>;
};

function compactText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function shortId(value: string) {
  if (value.length < 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatDateLabel(value: string | Date | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid rgba(148, 163, 184, 0.34)",
        background: "rgba(15, 23, 42, 0.48)",
        borderRadius: 999,
        padding: "8px 14px",
      }}
    >
      <span
        style={{
          color: "#93C5FD",
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 650 }}>{value}</span>
    </div>
  );
}

export default async function ShareOpenGraphImage({ params }: ShareOgImageProps) {
  const { id } = await params;
  const sharePreview = await getSharePreview({ shareId: id });

  const activeSkill = sharePreview?.activeSkill;
  const skillName = truncateText(compactText(activeSkill?.name) || "Shared Skill", 72);
  const skillDescription = truncateText(
    compactText(activeSkill?.description) ||
      "Open this shared skill to preview the content and import it into your own vault.",
    210,
  );

  const slugLabel = activeSkill?.slug ? truncateText(activeSkill.slug, 44) : "shared-skill";
  const sourceLabel =
    truncateText(compactText(activeSkill?.sourceIdentifier ?? activeSkill?.sourceUrl), 62) || null;
  const shareDateLabel = formatDateLabel(sharePreview?.createdAt);
  const shareIdLabel = shortId(id);
  const rootSkillName = compactText(sharePreview?.rootSkill.name) || skillName;
  const includedSkills = sharePreview?.includedSkills ?? [];
  const includedPreview = includedSkills.slice(0, 4);
  const includedOverflow = Math.max(0, includedSkills.length - includedPreview.length);

  const stats = sharePreview?.stats ?? { skills: 0, resources: 0, links: 0 };

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundImage:
          "radial-gradient(circle at 12% 12%, rgba(254, 154, 0, 0.2), rgba(254, 154, 0, 0) 44%), radial-gradient(circle at 78% 90%, rgba(99, 102, 241, 0.18), rgba(99, 102, 241, 0) 36%), linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(150deg, #030712 0%, #0a1020 44%, #04070c 100%)",
        backgroundSize: "100% 100%, 100% 100%, 42px 42px, 42px 42px, 100% 100%",
        color: "#F8FAFC",
        overflow: "hidden",
        fontFamily: "Geist, Inter, ui-sans-serif, system-ui",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(120deg, rgba(2, 6, 23, 0.62) 0%, rgba(2, 6, 23, 0.2) 55%, rgba(2, 6, 23, 0.68) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "42px 52px",
          gap: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(248, 250, 252, 0.24)",
              borderRadius: 999,
              padding: "8px 14px",
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                display: "flex",
                borderRadius: 999,
                background: "#FE9A00",
              }}
            />
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.08em",
                color: "#CBD5E1",
                textTransform: "uppercase",
              }}
            >
              Shared Skill Preview
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#94A3B8",
              fontSize: 14,
            }}
          >
            <span style={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>share id</span>
            <span style={{ fontFamily: "ui-monospace", color: "#E2E8F0", fontSize: 16 }}>
              {shareIdLabel}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, gap: 24 }}>
          <div
            style={{
              width: "67%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: "#93C5FD",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {sharePreview ? "ready to import" : "link unavailable"}
                </span>
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 780,
                    lineHeight: 1.02,
                    letterSpacing: "-0.03em",
                    color: "#F8FAFC",
                  }}
                >
                  {skillName}
                </span>
              </div>

              <div
                style={{
                  fontSize: 28,
                  lineHeight: 1.34,
                  color: "#D1D5DB",
                  maxWidth: 710,
                }}
              >
                {skillDescription}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <StatBadge label="skills" value={String(stats.skills)} />
                <StatBadge label="resources" value={String(stats.resources)} />
                <StatBadge label="links" value={String(stats.links)} />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(148, 163, 184, 0.26)",
                paddingTop: 16,
                gap: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    color: "#94A3B8",
                    fontSize: 14,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  slug
                </span>
                <span style={{ color: "#E2E8F0", fontFamily: "ui-monospace", fontSize: 17 }}>
                  {slugLabel}
                </span>
              </div>

              {sourceLabel ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      color: "#94A3B8",
                      fontSize: 14,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    source
                  </span>
                  <span style={{ color: "#CBD5E1", fontSize: 16 }}>{sourceLabel}</span>
                </div>
              ) : null}

              {shareDateLabel ? (
                <span style={{ color: "#94A3B8", fontSize: 15 }}>Shared {shareDateLabel}</span>
              ) : null}
            </div>
          </div>

          <div style={{ width: "33%", display: "flex" }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(148, 163, 184, 0.26)",
                borderRadius: 20,
                background:
                  "linear-gradient(175deg, rgba(9, 15, 24, 0.95) 0%, rgba(2, 6, 23, 0.84) 100%)",
                padding: 16,
                gap: 14,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    color: "#94A3B8",
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  root skill
                </span>
                <span style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 650 }}>
                  {truncateText(rootSkillName, 32)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderTop: "1px solid rgba(148, 163, 184, 0.2)",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                  padding: "12px 0",
                }}
              >
                <span
                  style={{
                    color: "#94A3B8",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  included skills
                </span>

                {includedPreview.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {includedPreview.map((skill) => (
                      <div key={skill.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            display: "flex",
                            borderRadius: 999,
                            background: "#6366F1",
                          }}
                        />
                        <span style={{ color: "#E2E8F0", fontSize: 16 }}>
                          {truncateText(skill.name, 28)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#94A3B8", fontSize: 15 }}>No skills in snapshot</span>
                )}

                {includedOverflow > 0 ? (
                  <span style={{ color: "#93C5FD", fontSize: 14 }}>+{includedOverflow} more</span>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: "rgba(15, 23, 42, 0.42)",
                }}
              >
                <span
                  style={{
                    color: "#94A3B8",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  import
                </span>
                <span style={{ color: "#E2E8F0", fontFamily: "ui-monospace", fontSize: 14 }}>
                  better-skills sync --share {shareIdLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 52,
            bottom: 34,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <BrandMark size={36} />
          <span
            style={{ color: "#E2E8F0", fontSize: 20, fontWeight: 600, letterSpacing: "0.03em" }}
          >
            BETTER-SKILLS.
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
