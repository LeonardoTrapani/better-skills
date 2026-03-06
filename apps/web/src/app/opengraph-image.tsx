import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/_og/brand-mark";

export const alt = "BETTER-SKILLS - Your Agent's Second Brain";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const badgeStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid rgba(248, 250, 252, 0.22)",
  background: "rgba(15, 23, 42, 0.62)",
  color: "#D1D5DB",
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 14,
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
};

function Pill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        background: "rgba(15, 23, 42, 0.42)",
        borderRadius: 999,
        color: "#E5E7EB",
        fontSize: 18,
        padding: "8px 14px",
      }}
    >
      {label}
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundImage:
          "radial-gradient(circle at 82% 14%, rgba(254, 154, 0, 0.22), rgba(254, 154, 0, 0) 46%), radial-gradient(circle at 10% 88%, rgba(59, 130, 246, 0.18), rgba(59, 130, 246, 0) 40%), linear-gradient(rgba(148, 163, 184, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.09) 1px, transparent 1px), linear-gradient(140deg, #030712 0%, #0b1220 50%, #05070b 100%)",
        backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px, 100% 100%",
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
            "linear-gradient(105deg, rgba(2, 6, 23, 0.52) 0%, rgba(2, 6, 23, 0.1) 56%, rgba(2, 6, 23, 0.55) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "44px 54px",
          gap: 30,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandMark size={48} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                BETTER-SKILLS.
              </span>
              <span style={{ fontSize: 17, color: "#CBD5E1" }}>
                Build, share, and manage reusable agent skills
              </span>
            </div>
          </div>

          <div style={badgeStyle}>Open source - terminal first</div>
        </div>

        <div style={{ display: "flex", flex: 1, gap: 28 }}>
          <div
            style={{
              width: "63%",
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
                  fontSize: 70,
                  fontWeight: 780,
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                }}
              >
                <span>Your Agent&apos;s</span>
                <span style={{ color: "#FE9A00" }}>Second Brain</span>
              </div>

              <div
                style={{
                  fontSize: 30,
                  lineHeight: 1.32,
                  color: "#D1D5DB",
                  maxWidth: 640,
                }}
              >
                Build, share, and manage a graph of reusable skills for your AI agents.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Pill label="CLI + Web" />
                <Pill label="Skill Graph" />
                <Pill label="Sync" />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(148, 163, 184, 0.25)",
                paddingTop: 18,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 550,
                  color: "#E2E8F0",
                  letterSpacing: "0.02em",
                }}
              >
                better-skills.dev
              </span>
              <span style={{ fontSize: 18, color: "#94A3B8" }}>Knowledge that persists</span>
            </div>
          </div>

          <div
            style={{
              width: "37%",
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: 22,
                background:
                  "linear-gradient(170deg, rgba(9, 15, 24, 0.96) 0%, rgba(2, 6, 23, 0.82) 100%)",
                boxShadow: "0 28px 70px rgba(2, 6, 23, 0.55)",
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#CBD5E1",
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <span>Skill Graph</span>
                <span style={{ color: "#94A3B8" }}>13 skills / 113 resources</span>
              </div>

              <div
                style={{
                  display: "flex",
                  width: "100%",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  background: "rgba(2, 6, 23, 0.6)",
                  borderRadius: 16,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 180,
                    position: "relative",
                    display: "flex",
                  }}
                >
                  <svg
                    width="380"
                    height="180"
                    viewBox="0 0 380 180"
                    fill="none"
                    style={{ width: "100%", height: "100%" }}
                  >
                    <line x1="66" y1="121" x2="144" y2="78" stroke="rgba(148, 163, 184, 0.45)" />
                    <line x1="144" y1="78" x2="228" y2="98" stroke="rgba(148, 163, 184, 0.35)" />
                    <line x1="228" y1="98" x2="306" y2="52" stroke="rgba(148, 163, 184, 0.4)" />
                    <line x1="228" y1="98" x2="306" y2="130" stroke="rgba(148, 163, 184, 0.28)" />
                    <line x1="144" y1="78" x2="184" y2="40" stroke="rgba(148, 163, 184, 0.32)" />

                    <circle cx="66" cy="121" r="12" fill="#6366F1" />
                    <circle cx="144" cy="78" r="13" fill="#FE9A00" />
                    <circle cx="228" cy="98" r="11" fill="#6366F1" />
                    <circle cx="306" cy="52" r="10" fill="#6366F1" />
                    <circle cx="306" cy="130" r="9" fill="#6366F1" />
                    <circle cx="184" cy="40" r="7" fill="#A5B4FC" />
                  </svg>

                  <span
                    style={{
                      position: "absolute",
                      left: 30,
                      top: 136,
                      color: "#CBD5E1",
                      fontSize: 14,
                    }}
                  >
                    my-vault
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: 120,
                      top: 42,
                      color: "#F8FAFC",
                      fontSize: 14,
                    }}
                  >
                    root-skill
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: 246,
                      top: 74,
                      color: "#CBD5E1",
                      fontSize: 13,
                    }}
                  >
                    linked
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    flex: 1,
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    background: "rgba(15, 23, 42, 0.46)",
                  }}
                >
                  <span style={{ color: "#94A3B8", fontSize: 12, textTransform: "uppercase" }}>
                    cli
                  </span>
                  <span style={{ color: "#E2E8F0", fontSize: 15, fontFamily: "ui-monospace" }}>
                    better-skills sync
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    flex: 1,
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    background: "rgba(15, 23, 42, 0.46)",
                  }}
                >
                  <span style={{ color: "#94A3B8", fontSize: 12, textTransform: "uppercase" }}>
                    web
                  </span>
                  <span style={{ color: "#E2E8F0", fontSize: 15 }}>Share and import skills</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
