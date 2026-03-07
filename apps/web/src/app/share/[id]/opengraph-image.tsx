import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/_og/brand-mark";
import { getSharePreview } from "@/lib/share/get-share-preview";

const COLOR_FOREGROUND = "#171717";
const COLOR_MUTED_FOREGROUND = "#737373";
const COLOR_PRIMARY = "#FE9A00";
const COLOR_BORDER = "#E5E7EB";

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 186,
        border: `1px solid ${COLOR_BORDER}`,
        background: "#FFFFFF",
        padding: "18px 18px 16px",
      }}
    >
      <span
        style={{
          color: COLOR_MUTED_FOREGROUND,
          fontFamily: '"Geist Sans", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: COLOR_FOREGROUND,
          fontSize: 46,
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function RailIntersection({
  left,
  top,
  size = 8,
  color = "rgba(23, 23, 23, 0.04)",
}: {
  left: number;
  top: number;
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: left - size / 2,
        top: top - size / 2,
        width: size,
        height: size,
        background: color,
      }}
    />
  );
}

function PixelCluster({
  left,
  top,
  columns,
  rows,
  cell = 9,
  gap = 5,
}: {
  left: number;
  top: number;
  columns: number;
  rows: number;
  cell?: number;
  gap?: number;
}) {
  const cells = Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const opacity = (row + column) % 3 === 0 ? 0.1 : (row + column) % 2 === 0 ? 0.06 : 0.035;

    return {
      key: `${row}-${column}`,
      left: column * (cell + gap),
      top: row * (cell + gap),
      opacity,
    };
  });

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
      {cells.map((square) => (
        <div
          key={square.key}
          style={{
            position: "absolute",
            left: square.left,
            top: square.top,
            width: cell,
            height: cell,
            background: `rgba(23, 23, 23, ${square.opacity})`,
          }}
        />
      ))}
    </div>
  );
}

export default async function ShareOpenGraphImage({ params }: ShareOgImageProps) {
  const { id } = await params;
  const [sharePreview, geistRegular] = await Promise.all([
    getSharePreview({ shareId: id }),
    readFile(new URL("../../_og/fonts/Geist-Regular.ttf", import.meta.url)),
  ]);

  const activeSkill = sharePreview?.activeSkill;
  const skillName = truncateText(compactText(activeSkill?.name) || "Shared Skill", 56);
  const skillDescription = truncateText(
    compactText(activeSkill?.description) ||
      "Open this shared skill to preview the content and import it into your own vault.",
    150,
  );

  const linkedSkillCount = Math.max(0, (sharePreview?.includedSkills.length ?? 1) - 1);
  const referenceCount = sharePreview?.stats.resources ?? 0;

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
          backgroundImage:
            "linear-gradient(to right, rgba(23, 23, 23, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(23, 23, 23, 0.05) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            width: "100%",
            height: "100%",
            border: `1px solid ${COLOR_BORDER}`,
            background: "#FFFFFF",
            padding: "30px 28px 26px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 380,
              display: "flex",
              borderLeft: "1px solid rgba(23, 23, 23, 0.04)",
              background: "transparent",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 150,
                left: 0,
                right: 0,
                height: 1,
                background: "rgba(23, 23, 23, 0.04)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 336,
                left: 0,
                right: 0,
                height: 1,
                background: "rgba(23, 23, 23, 0.04)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 520,
                left: 0,
                right: 0,
                height: 1,
                background: "rgba(23, 23, 23, 0.04)",
              }}
            />

            <RailIntersection left={58} top={150} />
            <RailIntersection left={214} top={150} />
            <RailIntersection left={58} top={336} />
            <RailIntersection left={214} top={336} />
            <RailIntersection left={58} top={520} />
            <RailIntersection left={214} top={520} />

            <div
              style={{
                position: "absolute",
                left: 214 - 10,
                top: 150 - 10,
                width: 20,
                height: 20,
                background: "rgba(254, 154, 0, 0.55)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 38,
                top: 56,
                width: 10,
                height: 10,
                background: "rgba(254, 154, 0, 0.35)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 85,
                top: 94,
                width: 10,
                height: 10,
                background: "rgba(254, 154, 0, 0.28)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 182,
                top: 204,
                width: 10,
                height: 10,
                background: "rgba(254, 154, 0, 0.34)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 206,
                top: 236,
                width: 10,
                height: 10,
                background: "rgba(254, 154, 0, 0.25)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 38,
                top: 458,
                width: 10,
                height: 10,
                background: "rgba(254, 154, 0, 0.33)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 82,
                top: 500,
                width: 10,
                height: 10,
                background: "rgba(254, 154, 0, 0.24)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 48,
                top: 64,
                width: 1,
                height: 52,
                background: "rgba(23, 23, 23, 0.035)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 48,
                top: 115,
                width: 36,
                height: 1,
                background: "rgba(23, 23, 23, 0.035)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 192,
                top: 212,
                width: 1,
                height: 34,
                background: "rgba(23, 23, 23, 0.035)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 192,
                top: 245,
                width: 26,
                height: 1,
                background: "rgba(23, 23, 23, 0.035)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 48,
                top: 468,
                width: 1,
                height: 32,
                background: "rgba(23, 23, 23, 0.035)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 48,
                top: 499,
                width: 36,
                height: 1,
                background: "rgba(23, 23, 23, 0.035)",
              }}
            />

            <PixelCluster left={72} top={18} columns={7} rows={4} cell={8} gap={5} />
            <PixelCluster left={252} top={236} columns={5} rows={3} cell={8} gap={5} />
            <PixelCluster left={122} top={430} columns={6} rows={3} cell={8} gap={5} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              flex: 1,
              maxWidth: 860,
              position: "relative",
            }}
          >
            <span
              style={{
                color: COLOR_PRIMARY,
                fontFamily:
                  '"Geist Sans", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
              }}
            >
              Shared Skill Preview
            </span>

            <span
              style={{
                color: COLOR_FOREGROUND,
                fontSize: 78,
                lineHeight: 0.92,
                fontWeight: 500,
                letterSpacing: "-0.06em",
                maxWidth: 760,
              }}
            >
              {skillName}
            </span>

            <span
              style={{
                color: COLOR_MUTED_FOREGROUND,
                fontSize: 30,
                lineHeight: 1.34,
                letterSpacing: "-0.03em",
                maxWidth: 840,
              }}
            >
              {skillDescription}
            </span>

            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <Metric label="Linked skills" value={String(linkedSkillCount)} />
              <Metric label="References" value={String(referenceCount)} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: 30,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: COLOR_FOREGROUND,
                fontSize: 40,
                fontWeight: 500,
                letterSpacing: "-0.04em",
              }}
            >
              <BrandMark size={34} stroke={COLOR_FOREGROUND} dot={COLOR_PRIMARY} />
              <span>BETTER-SKILLS.</span>
            </div>
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
