import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/_og/brand-mark";

export const alt = "BETTER-SKILLS - Your Agent's Second Brain";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const shellBackground =
  "radial-gradient(circle at 84% 12%, rgba(245, 158, 11, 0.24), rgba(245, 158, 11, 0) 44%), radial-gradient(circle at 10% 92%, rgba(59, 130, 246, 0.16), rgba(59, 130, 246, 0) 38%), linear-gradient(rgba(148, 163, 184, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.09) 1px, transparent 1px), linear-gradient(145deg, #070b14 0%, #0b1324 52%, #091120 100%)";

const badgeStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(10, 16, 31, 0.72)",
  color: "#CBD5E1",
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 14,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const graphMetaStyle = {
  color: "#94A3B8",
  fontSize: 13,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const graphTileStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 5,
  flex: 1,
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(15, 23, 42, 0.44)",
};

function Pill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        background: "rgba(10, 16, 31, 0.65)",
        borderRadius: 999,
        color: "#E2E8F0",
        fontSize: 18,
        padding: "8px 14px",
      }}
    >
      {label}
    </div>
  );
}

function GraphPanel() {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        border: "1px solid rgba(148, 163, 184, 0.28)",
        borderRadius: 22,
        background: "linear-gradient(175deg, rgba(8, 13, 25, 0.96) 0%, rgba(2, 6, 23, 0.86) 100%)",
        boxShadow: "0 26px 60px rgba(2, 6, 23, 0.55)",
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
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span>Skill Graph</span>
        <span style={{ color: "#94A3B8", letterSpacing: "0.03em" }}>13 skills / 113 resources</span>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          background: "rgba(2, 6, 23, 0.66)",
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
            <line x1="66" y1="121" x2="144" y2="78" stroke="rgba(148, 163, 184, 0.42)" />
            <line x1="144" y1="78" x2="228" y2="98" stroke="rgba(148, 163, 184, 0.34)" />
            <line x1="228" y1="98" x2="306" y2="52" stroke="rgba(148, 163, 184, 0.38)" />
            <line x1="228" y1="98" x2="306" y2="130" stroke="rgba(148, 163, 184, 0.27)" />
            <line x1="144" y1="78" x2="184" y2="40" stroke="rgba(148, 163, 184, 0.3)" />

            <circle cx="66" cy="121" r="12" fill="#6366F1" />
            <circle cx="144" cy="78" r="13" fill="#F59E0B" />
            <circle cx="228" cy="98" r="11" fill="#60A5FA" />
            <circle cx="306" cy="52" r="10" fill="#6366F1" />
            <circle cx="306" cy="130" r="9" fill="#818CF8" />
            <circle cx="184" cy="40" r="7" fill="#CBD5E1" />
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
              left: 118,
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
              left: 248,
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
        <div style={graphTileStyle}>
          <span style={graphMetaStyle}>cli</span>
          <span style={{ color: "#E2E8F0", fontSize: 15, fontFamily: "ui-monospace" }}>
            better-skills sync
          </span>
        </div>

        <div style={graphTileStyle}>
          <span style={graphMetaStyle}>web</span>
          <span style={{ color: "#E2E8F0", fontSize: 15 }}>Share and import skills</span>
        </div>
      </div>
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
        backgroundImage: shellBackground,
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
            "linear-gradient(105deg, rgba(2, 6, 23, 0.54) 0%, rgba(2, 6, 23, 0.12) 56%, rgba(2, 6, 23, 0.58) 100%)",
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
            left: 48,
            width: 1,
            background: "rgba(148, 163, 184, 0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 48,
            width: 1,
            background: "rgba(148, 163, 184, 0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 48,
            right: 48,
            bottom: 88,
            height: 1,
            background: "rgba(148, 163, 184, 0.22)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "42px 54px",
          gap: 30,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandMark size={48} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                BETTER-SKILLS.
              </span>
              <span style={{ fontSize: 17, color: "#CBD5E1", letterSpacing: "0.01em" }}>
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
                  fontSize: 76,
                  fontWeight: 780,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                <span>Your Agent&apos;s</span>
                <span style={{ color: "#F59E0B" }}>Second Brain</span>
              </div>

              <div
                style={{
                  fontSize: 31,
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
                borderTop: "1px solid rgba(148, 163, 184, 0.24)",
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
            <GraphPanel />
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
