import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/_og/brand-mark";

export const alt = "BETTER-SKILLS - Your Agent's Second Brain";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const COLOR_FOREGROUND = "#171717";
const COLOR_MUTED_FOREGROUND = "#737373";
const COLOR_PRIMARY = "#FE9A00";
const COLOR_BORDER = "#E5E7EB";

function Tag({ index, label }: { index: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 168,
        height: 78,
        border: `1px solid ${COLOR_BORDER}`,
        background: "#FFFFFF",
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            background: COLOR_PRIMARY,
          }}
        />
        <span
          style={{
            color: COLOR_MUTED_FOREGROUND,
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
          }}
        >
          {index}
        </span>
      </div>
      <span
        style={{
          color: COLOR_FOREGROUND,
          fontSize: 22,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PixelCluster({
  left,
  top,
  columns,
  rows,
  cell = 9,
  gap = 5,
  opacity = 0.08,
}: {
  left: number;
  top: number;
  columns: number;
  rows: number;
  cell?: number;
  gap?: number;
  opacity?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left,
        top,
        width: columns * cell + (columns - 1) * gap,
        height: rows * cell + (rows - 1) * gap,
      }}
    >
      {Array.from({ length: rows * columns }, (_, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const alpha = opacity * (((row + column) % 3) + 1);

        return (
          <div
            key={`${row}-${column}`}
            style={{
              position: "absolute",
              left: column * (cell + gap),
              top: row * (cell + gap),
              width: cell,
              height: cell,
              background: `rgba(23, 23, 23, ${Math.min(alpha, 0.16)})`,
            }}
          />
        );
      })}
    </div>
  );
}

function pngToDataUrl(data: Uint8Array) {
  return `data:image/png;base64,${Buffer.from(data).toString("base64")}`;
}

function Node({
  left,
  top,
  size,
  color,
}: {
  left: number;
  top: number;
  size: number;
  color: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        background: color,
      }}
    />
  );
}

export default async function OpenGraphImage() {
  const [geistRegular, graphPng] = await Promise.all([
    readFile(new URL("./_og/fonts/Geist-Regular.ttf", import.meta.url)),
    readFile(new URL("./_og/images/graph.png", import.meta.url)),
  ]);
  const graphSrc = pngToDataUrl(graphPng);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#FFFFFF",
        color: COLOR_FOREGROUND,
        overflow: "hidden",
        fontFamily: '"Geist Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
        }}
      >
        <PixelCluster left={834} top={82} columns={6} rows={4} opacity={0.028} />
        <PixelCluster left={1016} top={278} columns={5} rows={3} opacity={0.024} />
        <PixelCluster left={896} top={470} columns={6} rows={3} opacity={0.022} />
        <PixelCluster left={174} top={520} columns={5} rows={2} opacity={0.03} />

        <Node left={846} top={102} size={8} color="rgba(254, 154, 0, 0.18)" />
        <Node left={1006} top={220} size={12} color="rgba(254, 154, 0, 0.22)" />
        <Node left={868} top={506} size={8} color="rgba(254, 154, 0, 0.16)" />
      </div>

      <div
        style={{
          position: "absolute",
          top: 120,
          right: 18,
          width: 376,
          height: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={graphSrc}
          alt=""
          width="470"
          height="720"
          style={{
            display: "flex",
            objectFit: "contain",
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
          padding: "46px 54px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BrandMark size={48} stroke={COLOR_FOREGROUND} dot={COLOR_PRIMARY} />
          <span
            style={{
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.03em",
            }}
          >
            BETTER-SKILLS.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            marginTop: 56,
            maxWidth: 760,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 82,
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: "-0.065em",
            }}
          >
            <span>Your Agent&apos;s</span>
            <span style={{ color: COLOR_PRIMARY }}>Second Brain</span>
          </div>

          <div
            style={{
              display: "flex",
              maxWidth: 740,
              color: COLOR_MUTED_FOREGROUND,
              fontSize: 34,
              lineHeight: 1.28,
              letterSpacing: "-0.035em",
            }}
          >
            Build, share, and manage a graph of reusable skills for your AI agents.
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <Tag index="01" label="CLI + Web" />
            <Tag index="02" label="Skill Graph" />
            <Tag index="03" label="Sync" />
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Geist Sans",
          data: geistRegular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
