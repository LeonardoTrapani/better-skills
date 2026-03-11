# Landing Design System

## Purpose

The marketing landing uses a light, grid-first visual system that feels closer to a terminal schematic than a generic SaaS page. The design language should make Better Skills feel precise, technical, and intentionally structured.

## Core Visual Rules

- Light canvas first. The default surface is `bg-background` with `border-border` structure and a single amber primary accent.
- Geometry stays square. Use crisp 1px borders, `rounded-none`, inset corner marks, small square nodes, and boxy terminal chrome.
- Accent color is scarce. Amber should mark the active word, node, divider, or CTA - not flood full sections.
- The page always feels framed. Persistent vertical rails, section dividers, and backdrop rules create the sense of one continuous system.
- Visual motifs should come from product semantics: files, graphs, sync, terminals, nodes, vaults, and linked context.

## Typography Roles

- `GeistPixelSquare` and `GeistPixelLine` are for brand and display moments.
- `Geist Sans` handles paragraph copy and UI text.
- Mono text is reserved for labels, commands, counters, metadata, and technical annotations.
- Headlines should be short, direct, and usually highlight one phrase in `text-primary`.
- Supporting copy stays compact and specific. Avoid soft marketing filler.

## Layout Rules

- All landing content sits inside the shared `LandingContainer` width (`max-w-6xl`).
- New sections should begin with `SectionBackdrop`, use the shared container, and usually end with `SectionTailSpacer`.
- The default section rhythm is: divider -> centered section header -> bordered content module.
- Mobile stacks first. Desktop can split into columns, but it must still align to the same rails.
- When a section needs emphasis, vary composition with span, asymmetry, or a split panel instead of changing the visual language.

## Reusable Primitives

- `PageOverlay`: global structural rails.
- `SectionDivider`: numbered chapter marker between sections.
- `SectionHeader`: shared decorator, headline, and subtitle stack.
- `SectionBackdrop`: section-level graph and dot decoration.
- `CornerInsetMarks`: card edge signature for bordered modules.
- `InstallCommandButton`: canonical CLI interaction pattern.

## Component Patterns

- Cards should look like product panels, not soft marketing tiles.
- Terminal windows use a top chrome row with 3 muted dots and a mono tab label.
- Graph visuals should stay schematic and low-noise unless a fully interactive graph is essential.
- Use hover color shifts lightly. Avoid large shadows, gradients, and rounded consumer-app styling.
- Motion should support reveal and system activity, not decorative flourish.

## Motion Rules

- Prefer small fade-up transitions, subtle scale on CTAs, and lightweight pulse states.
- Keep transforms and opacity as the primary animated properties.
- Respect reduced motion by avoiding essential meaning inside auto-rotating or continuous animation.
- Do not use autoplay carousels or tabs for core content.

## Content Rules

- Explain Better Skills as infrastructure for reusable agent capabilities.
- Favor concrete nouns: vault, skill, sync, graph, files, references, roles.
- Keep each section focused on one job in the story: problem, definition, mechanism, proof, pricing, CTA.
- Avoid repeating the same value prop in multiple sections with different wording.

## Current Story Order

1. Hero
2. How It Works
3. Features
4. The Problem
5. What Is A Skill
6. How We Solve It
7. CLI Demo
8. Enterprise
9. Pricing
10. CTA

## Native Section Checklist

Before shipping a new landing section, verify that it:

- uses the shared container and backdrop primitives
- respects the rail system on desktop and mobile
- uses pixel display type, mono metadata, and concise body copy
- keeps borders square and accent usage restrained
- introduces product-native visuals instead of generic illustration
- avoids duplicate CTAs or dead navigation paths
- feels cohesive next to `hero-section.tsx`, `features.tsx`, `cli-demo.tsx`, and `pricing.tsx`
