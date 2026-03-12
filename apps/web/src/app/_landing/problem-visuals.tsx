function ScatteredKnowledgeVisual() {
  const columns = 7;
  const rows = 4;
  const gap = 10;
  const missing = new Set(["0-2", "0-5", "1-0", "1-4", "2-1", "2-3", "2-6", "3-0", "3-2", "3-5"]);
  const accents = new Set(["0-0", "1-3", "2-5", "3-4"]);

  const cells: { x: number; y: number; accent: boolean }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cellId = `${row}-${column}`;
      if (!missing.has(cellId)) {
        cells.push({
          x: column * gap,
          y: row * gap,
          accent: accents.has(cellId),
        });
      }
    }
  }

  const width = (columns - 1) * gap + 6;
  const height = (rows - 1) * gap + 6;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      {cells.map(({ x, y, accent }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="6"
          height="6"
          fill={accent ? "var(--primary)" : "var(--border)"}
        />
      ))}
    </svg>
  );
}

function ClipboardBlock({
  x,
  y,
  opacity,
  accentTopRight = false,
}: {
  x: number;
  y: number;
  opacity: number;
  accentTopRight?: boolean;
}) {
  const squareSize = 8;
  const gap = 4;

  return (
    <>
      <rect
        x={x}
        y={y}
        width={squareSize}
        height={squareSize}
        fill="var(--border)"
        fillOpacity={opacity}
      />
      <rect
        x={x + squareSize + gap}
        y={y}
        width={squareSize}
        height={squareSize}
        fill={accentTopRight ? "var(--primary)" : "var(--border)"}
        fillOpacity={accentTopRight ? 1 : opacity}
      />
      <rect
        x={x}
        y={y + squareSize + gap}
        width={squareSize}
        height={squareSize}
        fill="var(--border)"
        fillOpacity={opacity * 0.7}
      />
      <rect
        x={x + squareSize + gap}
        y={y + squareSize + gap}
        width={squareSize}
        height={squareSize}
        fill="var(--border)"
        fillOpacity={opacity * 0.7}
      />
    </>
  );
}

function ClipboardVisual() {
  const squareSize = 8;
  const gap = 4;
  const blockWidth = squareSize + gap + squareSize;
  const sourceX = 0;
  const spacing = 34;
  const sourceY = 4;
  const copies = [
    { x: sourceX + spacing, opacity: 0.9 },
    { x: sourceX + spacing * 2, opacity: 0.55 },
    { x: sourceX + spacing * 3, opacity: 0.25 },
  ];
  const totalWidth = sourceX + spacing * 3 + blockWidth;

  return (
    <svg viewBox={`0 0 ${totalWidth} 40`} fill="none" aria-hidden="true" className="h-full w-full">
      <ClipboardBlock x={sourceX} y={sourceY} opacity={1} accentTopRight />
      {copies.map((copy) => (
        <ClipboardBlock key={copy.x} x={copy.x} y={sourceY} opacity={copy.opacity} />
      ))}
    </svg>
  );
}

function OwnershipVisual() {
  const squareSize = 7;
  const gapX = 12;
  const gapY = 14;

  const cells = [
    { col: 0, row: 0, kind: "filled" },
    { col: 1, row: 0, kind: "filled" },
    { col: 2, row: 0, kind: "filled" },
    { col: 3, row: 0, kind: "filled" },
    { col: 4, row: 0, kind: "filled" },
    { col: 0, row: 1, kind: "ghost" },
    { col: 1, row: 1, kind: "filled" },
    { col: 2, row: 1, kind: "ghost" },
    { col: 3, row: 1, kind: "filled" },
    { col: 4, row: 1, kind: "ghost" },
    { col: 0, row: 2, kind: "ghost" },
    { col: 1, row: 2, kind: "ghost" },
    { col: 2, row: 2, kind: "accent" },
    { col: 3, row: 2, kind: "ghost" },
    { col: 4, row: 2, kind: "ghost" },
  ] as const;

  const width = 4 * gapX + squareSize;
  const height = 2 * gapY + squareSize;
  const columns = [0, 1, 2, 3, 4] as const;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      {columns.map((column) => (
        <line
          key={`top-${column}`}
          x1={column * gapX + squareSize / 2}
          y1={squareSize}
          x2={column * gapX + squareSize / 2}
          y2={gapY}
          stroke="var(--border)"
          strokeOpacity="0.5"
          strokeDasharray="2 2"
        />
      ))}
      {columns.map((column) => (
        <line
          key={`bottom-${column}`}
          x1={column * gapX + squareSize / 2}
          y1={gapY + squareSize}
          x2={column * gapX + squareSize / 2}
          y2={gapY * 2}
          stroke="var(--border)"
          strokeOpacity="0.3"
          strokeDasharray="2 2"
        />
      ))}

      {cells.map(({ col, row, kind }) => {
        const x = col * gapX;
        const y = row * gapY;

        if (kind === "ghost") {
          return (
            <rect
              key={`${col}-${row}`}
              x={x}
              y={y}
              width={squareSize}
              height={squareSize}
              fill="none"
              stroke="var(--border)"
              strokeOpacity="0.5"
            />
          );
        }

        return (
          <rect
            key={`${col}-${row}`}
            x={x}
            y={y}
            width={squareSize}
            height={squareSize}
            fill={kind === "accent" ? "var(--primary)" : "var(--border)"}
            fillOpacity={kind === "accent" ? 1 : 0.7}
          />
        );
      })}
    </svg>
  );
}

export const PROBLEM_VISUALS = {
  scattered: ScatteredKnowledgeVisual,
  clipboard: ClipboardVisual,
  ownership: OwnershipVisual,
};
