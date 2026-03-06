import type { ReactNode } from "react";

export const ogColors = {
  background: "#090b10",
  panel: "#10141d",
  panelStrong: "#0c1018",
  border: "rgba(148, 163, 184, 0.22)",
  borderSoft: "rgba(148, 163, 184, 0.14)",
  textStrong: "#eef2f7",
  text: "#d4d9e2",
  textMuted: "#97a0ae",
  primary: "#fabc12",
} as const;

const gridColumns = [38, 178, 318, 458, 598, 738, 878, 1018, 1158];
const gridRows = [38, 130, 222, 314, 406, 498, 590];

const clusterPattern = ["01111110", "11101110", "11111100", "11011110", "11100111", "01101110"];

const cornerLabelStyle = {
  position: "absolute" as const,
  display: "flex",
  alignItems: "center",
  color: "rgba(148, 163, 184, 0.42)",
  fontFamily: "ui-monospace",
  fontSize: 16,
  letterSpacing: "0.16em",
};

function PixelCluster({
  left,
  top,
  mirror = false,
  opacity = 1,
}: {
  left: number;
  top: number;
  mirror?: boolean;
  opacity?: number;
}) {
  const rows = mirror
    ? clusterPattern.map((row) => row.split("").reverse().join(""))
    : clusterPattern;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        opacity,
      }}
    >
      {rows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} style={{ display: "flex", gap: 3 }}>
          {row.split("").map((cell, cellIndex) => (
            <span
              key={`cell-${rowIndex}-${cellIndex}`}
              style={{
                width: 6,
                height: 6,
                display: "flex",
                background: cell === "1" ? "rgba(148, 163, 184, 0.18)" : "transparent",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function AccentSquare({
  left,
  top,
  size = 10,
  opacity = 1,
}: {
  left: number;
  top: number;
  size?: number;
  opacity?: number;
}) {
  return (
    <span
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        display: "flex",
        background: ogColors.primary,
        opacity,
      }}
    />
  );
}

type LandingOgFrameProps = {
  children: ReactNode;
  bottomOverlay?: ReactNode;
};

export function LandingOgFrame({ children, bottomOverlay }: LandingOgFrameProps) {
  const intersections = gridColumns.flatMap((x) =>
    gridRows.map((y) => ({ key: `${x}-${y}`, x, y })),
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: ogColors.background,
        color: ogColors.textStrong,
        fontFamily: "Geist, Inter, ui-sans-serif, system-ui",
      }}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {gridColumns.map((x) => (
          <span
            key={`col-${x}`}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: x,
              width: 1,
              display: "flex",
              background: "rgba(148, 163, 184, 0.12)",
            }}
          />
        ))}

        {gridRows.map((y) => (
          <span
            key={`row-${y}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y,
              height: 1,
              display: "flex",
              background: "rgba(148, 163, 184, 0.12)",
            }}
          />
        ))}

        {intersections.map((point) => (
          <span
            key={point.key}
            style={{
              position: "absolute",
              left: point.x - 2,
              top: point.y - 2,
              width: 4,
              height: 4,
              display: "flex",
              background: "rgba(148, 163, 184, 0.18)",
            }}
          />
        ))}

        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 38,
            width: 1,
            display: "flex",
            background: "rgba(148, 163, 184, 0.2)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 38,
            width: 1,
            display: "flex",
            background: "rgba(148, 163, 184, 0.2)",
          }}
        />
      </div>

      <PixelCluster left={152} top={48} opacity={0.9} />
      <PixelCluster left={900} top={48} opacity={0.9} mirror />
      <PixelCluster left={62} top={322} opacity={0.7} />
      <PixelCluster left={1050} top={322} opacity={0.7} mirror />

      <AccentSquare left={216} top={188} size={8} opacity={0.72} />
      <AccentSquare left={960} top={188} size={8} opacity={0.72} />
      <AccentSquare left={304} top={282} size={7} opacity={0.58} />
      <AccentSquare left={888} top={282} size={7} opacity={0.58} />

      <span style={{ ...cornerLabelStyle, left: 68, top: 26 }}>[ SKILL ]</span>
      <span style={{ ...cornerLabelStyle, right: 68, top: 26 }}>[ SYNC ]</span>
      <span style={{ ...cornerLabelStyle, left: 68, bottom: 26 }}>[ .MD ]</span>
      <span style={{ ...cornerLabelStyle, right: 68, bottom: 26 }}>[ GRAPH ]</span>

      {bottomOverlay}

      <div
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "40px 52px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
