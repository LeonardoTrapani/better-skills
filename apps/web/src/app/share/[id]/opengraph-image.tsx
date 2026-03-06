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

const shellBackground =
  "radial-gradient(circle at 86% 14%, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0) 42%), radial-gradient(circle at 12% 88%, rgba(59, 130, 246, 0.16), rgba(59, 130, 246, 0) 38%), linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(148deg, #070b14 0%, #0b1324 52%, #091120 100%)";

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
        border: "1px solid rgba(148, 163, 184, 0.3)",
        background: "rgba(10, 16, 31, 0.65)",
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

function SideLabel({ label }: { label: string }) {
  return (
    <span
      style={{
        color: "#94A3B8",
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

export default async function ShareOpenGraphImage({ params }: ShareOgImageProps) {
  const { id } = await params;
  const sharePreview = await getSharePreview({ shareId: id });

  const activeSkill = sharePreview?.activeSkill;
  const isAvailable = Boolean(sharePreview);
  const skillName = truncateText(compactText(activeSkill?.name) || "Shared skill", 64);
  const skillDescription = truncateText(
    compactText(activeSkill?.description) ||
      "Open this shared skill to preview the content and import it into your own vault.",
    188,
  );

  const slugLabel = activeSkill?.slug ? truncateText(activeSkill.slug, 44) : "shared-skill";
  const sourceLabel =
    truncateText(compactText(activeSkill?.sourceIdentifier ?? activeSkill?.sourceUrl), 48) || null;
  const shareDateLabel = formatDateLabel(sharePreview?.createdAt);
  const shareIdLabel = shortId(id);
  const rootSkillName = truncateText(compactText(sharePreview?.rootSkill.name) || skillName, 30);
  const includedSkills = sharePreview?.includedSkills ?? [];
  const includedPreview = includedSkills.slice(0, 5);
  const includedOverflow = Math.max(0, includedSkills.length - includedPreview.length);
  const stats = sharePreview?.stats ?? { skills: 0, resources: 0, links: 0 };

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundImage: shellBackground,
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
            "linear-gradient(108deg, rgba(2, 6, 23, 0.58) 0%, rgba(2, 6, 23, 0.16) 55%, rgba(2, 6, 23, 0.62) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 46,
            width: 1,
            background: "rgba(148, 163, 184, 0.23)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 46,
            width: 1,
            background: "rgba(148, 163, 184, 0.23)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 46,
            right: 46,
            bottom: 84,
            height: 1,
            background: "rgba(148, 163, 184, 0.2)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "40px 52px",
          gap: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(148, 163, 184, 0.34)",
              borderRadius: 999,
              padding: "8px 14px",
              background: "rgba(10, 16, 31, 0.72)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                display: "flex",
                borderRadius: 999,
                background: "#F59E0B",
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    fontSize: 18,
                    color: isAvailable ? "#93C5FD" : "#FCA5A5",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {isAvailable ? "ready to import" : "link unavailable"}
                </span>
                <span
                  style={{
                    fontSize: 68,
                    fontWeight: 780,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: "#F8FAFC",
                  }}
                >
                  {skillName}
                </span>
              </div>

              <div
                style={{
                  fontSize: 30,
                  lineHeight: 1.32,
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
                borderTop: "1px solid rgba(148, 163, 184, 0.24)",
                paddingTop: 16,
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                  <span style={{ color: "#CBD5E1", fontSize: 15 }}>{sourceLabel}</span>
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
                  "linear-gradient(176deg, rgba(8, 13, 25, 0.96) 0%, rgba(2, 6, 23, 0.86) 100%)",
                padding: 16,
                gap: 14,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <SideLabel label="root skill" />
                <span style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 650 }}>
                  {rootSkillName}
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
                <SideLabel label="included skills" />

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
                            background: "#60A5FA",
                          }}
                        />
                        <span style={{ color: "#E2E8F0", fontSize: 16 }}>
                          {truncateText(skill.name, 30)}
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
                <SideLabel label="import" />
                <span style={{ color: "#E2E8F0", fontFamily: "ui-monospace", fontSize: 14 }}>
                  better-skills sync --share {shareIdLabel}
                </span>
              </div>

              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <BrandMark size={30} />
                <span
                  style={{
                    color: "#E2E8F0",
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                  }}
                >
                  BETTER-SKILLS.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
