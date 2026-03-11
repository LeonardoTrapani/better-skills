export function CornerInsetMarks() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
    </>
  );
}
