import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/_og/brand-mark";
import { LandingOgFrame, ogColors } from "@/app/_og/landing-frame";

export const alt = "BETTER-SKILLS - Your Agent's Second Brain";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function ActionButton({ text, primary = false }: { text: string; primary?: boolean }) {
  return (
    <div
      style={{
        minWidth: 270,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${primary ? "rgba(250, 188, 18, 0.95)" : ogColors.border}`,
        background: primary ? ogColors.primary : ogColors.panel,
        color: primary ? "#1f180a" : ogColors.textStrong,
        fontSize: 32,
        fontWeight: 520,
      }}
    >
      {text}
    </div>
  );
}

export default function OpenGraphImage() {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandMark size={28} stroke={ogColors.textStrong} dot={ogColors.primary} />
            <span
              style={{
                color: ogColors.textStrong,
                fontSize: 36,
                fontWeight: 610,
                letterSpacing: "0.04em",
              }}
            >
              BETTER-SKILLS.
            </span>
          </div>

          <span
            style={{
              border: `1px solid ${ogColors.border}`,
              background: ogColors.panel,
              color: ogColors.text,
              fontFamily: "ui-monospace",
              fontSize: 20,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "9px 16px",
            }}
          >
            Open source - terminal first
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 24,
          }}
        >
          <div
            style={{
              width: 860,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              textAlign: "center",
            }}
          >
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
                  width: 9,
                  height: 9,
                  display: "flex",
                  background: ogColors.primary,
                }}
              />
              <span
                style={{
                  color: ogColors.text,
                  fontSize: 24,
                }}
              >
                19 skills in your vault
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  color: ogColors.textStrong,
                  fontSize: 88,
                  fontWeight: 730,
                  letterSpacing: "-0.03em",
                }}
              >
                Your Agent&apos;s
              </span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: ogColors.primary,
                  fontFamily: "ui-monospace",
                  fontSize: 82,
                  fontWeight: 730,
                  letterSpacing: "-0.02em",
                }}
              >
                <span>Sec</span>
                <span style={{ width: 48, height: 48, display: "flex" }}>
                  <BrandMark size={48} stroke={ogColors.textStrong} dot={ogColors.primary} />
                </span>
                <span>nd Brain</span>
              </span>
            </div>

            <p
              style={{
                margin: 0,
                color: ogColors.textMuted,
                fontSize: 25,
                lineHeight: 1.35,
                maxWidth: 760,
              }}
            >
              Build, share, and manage a graph of reusable skills for your AI agents.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ActionButton text="Go to Vault  ->" primary />
              <ActionButton text="See on GitHub" />
            </div>

            <div
              style={{
                width: "100%",
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: `1px solid ${ogColors.border}`,
                background: ogColors.panel,
                padding: "0 16px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  color: ogColors.textMuted,
                  fontFamily: "ui-monospace",
                  fontSize: 23,
                }}
              >
                <span style={{ color: ogColors.primary }}>$</span>
                curl -fsSL https://better-skills.dev/install | bash
              </span>

              <span
                style={{
                  width: 22,
                  height: 22,
                  display: "flex",
                  border: `1px solid ${ogColors.border}`,
                  background: ogColors.panelStrong,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </LandingOgFrame>,
    size,
  );
}
