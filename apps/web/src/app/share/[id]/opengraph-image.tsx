import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/_og/brand-mark";
import { LandingOgFrame, ogColors } from "@/app/_og/landing-frame";
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

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: `1px solid ${ogColors.border}`,
        background: ogColors.panel,
        padding: "7px 12px",
      }}
    >
      <span
        style={{
          color: "#8ec5ff",
          fontSize: 14,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ color: ogColors.textStrong, fontSize: 34, fontWeight: 620 }}>{value}</span>
    </div>
  );
}

function PanelLabel({ text }: { text: string }) {
  return (
    <span
      style={{
        color: ogColors.textMuted,
        fontSize: 15,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </span>
  );
}

export default async function ShareOpenGraphImage({ params }: ShareOgImageProps) {
  const { id } = await params;
  const sharePreview = await getSharePreview({ shareId: id });

  const activeSkill = sharePreview?.activeSkill;
  const isAvailable = Boolean(sharePreview);

  const skillName = truncateText(compactText(activeSkill?.name) || "shared skill", 26);
  const headingSize = skillName.length > 20 ? 64 : 74;
  const skillDescription = truncateText(
    compactText(activeSkill?.description) ||
      "Open this shared skill to preview the content and import it into your own vault.",
    158,
  );

  const slugLabel = activeSkill?.slug ? truncateText(activeSkill.slug, 30) : "shared-skill";
  const shareDateLabel = formatDateLabel(sharePreview?.createdAt);
  const shareIdLabel = shortId(id);
  const rootSkillName = truncateText(compactText(sharePreview?.rootSkill.name) || skillName, 20);
  const includedSkills = sharePreview?.includedSkills ?? [];
  const includedPreview = includedSkills.slice(0, 4);
  const includedOverflow = Math.max(0, includedSkills.length - includedPreview.length);
  const stats = sharePreview?.stats ?? { skills: 0, resources: 0, links: 0 };
  const importCommand = `better-skills sync --share ${shortId(id)}`;

  return new ImageResponse(
    <LandingOgFrame>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              border: `1px solid ${ogColors.border}`,
              background: ogColors.panel,
              padding: "8px 14px",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                display: "flex",
                background: ogColors.primary,
              }}
            />
            <span
              style={{
                color: ogColors.text,
                fontFamily: "ui-monospace",
                fontSize: 21,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Shared skill preview
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                color: ogColors.textMuted,
                fontFamily: "ui-monospace",
                fontSize: 20,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Share ID
            </span>
            <span style={{ color: ogColors.textStrong, fontFamily: "ui-monospace", fontSize: 30 }}>
              {shareIdLabel}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: 22, marginTop: 18 }}>
          <div
            style={{
              width: "67%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span
                style={{
                  color: isAvailable ? "#8ec5ff" : "#fda4af",
                  fontSize: 30,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {isAvailable ? "Ready to import" : "Link unavailable"}
              </span>

              <span
                style={{
                  color: ogColors.textStrong,
                  fontSize: headingSize,
                  fontWeight: 730,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {skillName}
              </span>

              <p
                style={{
                  margin: 0,
                  color: ogColors.text,
                  fontSize: 22,
                  lineHeight: 1.36,
                  maxWidth: 700,
                }}
              >
                {skillDescription}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatChip label="skills" value={String(stats.skills)} />
                <StatChip label="resources" value={String(stats.resources)} />
                <StatChip label="links" value={String(stats.links)} />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: `1px solid ${ogColors.border}`,
                paddingTop: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{
                    color: ogColors.textMuted,
                    fontSize: 17,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  slug
                </span>
                <span
                  style={{ color: ogColors.textStrong, fontFamily: "ui-monospace", fontSize: 30 }}
                >
                  {slugLabel}
                </span>
              </div>

              <span style={{ color: ogColors.textMuted, fontSize: 25 }}>
                {shareDateLabel ? `Shared ${shareDateLabel}` : "Shared snapshot"}
              </span>
            </div>
          </div>

          <div style={{ width: "33%", display: "flex" }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                border: `1px solid ${ogColors.border}`,
                background: "rgba(12, 16, 24, 0.94)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <PanelLabel text="root skill" />
                <span style={{ color: ogColors.textStrong, fontSize: 46, fontWeight: 640 }}>
                  {rootSkillName}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderTop: `1px solid ${ogColors.borderSoft}`,
                  borderBottom: `1px solid ${ogColors.borderSoft}`,
                  padding: "12px 0",
                }}
              >
                <PanelLabel text="included skills" />

                {includedPreview.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {includedPreview.map((skill) => (
                      <div key={skill.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            display: "flex",
                            background: "#7bb8ff",
                          }}
                        />
                        <span style={{ color: ogColors.text, fontSize: 25 }}>
                          {truncateText(skill.name, 20)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: ogColors.textMuted, fontSize: 24 }}>
                    No skills in snapshot
                  </span>
                )}

                {includedOverflow > 0 ? (
                  <span style={{ color: "#8ec5ff", fontSize: 22 }}>+{includedOverflow} more</span>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  border: `1px solid ${ogColors.border}`,
                  background: ogColors.panel,
                  padding: "10px 12px",
                }}
              >
                <PanelLabel text="import" />
                <span style={{ color: ogColors.text, fontFamily: "ui-monospace", fontSize: 21 }}>
                  {importCommand}
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
                <BrandMark size={28} stroke={ogColors.textStrong} dot={ogColors.primary} />
                <span
                  style={{
                    color: ogColors.textStrong,
                    fontSize: 34,
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
    </LandingOgFrame>,
    size,
  );
}
