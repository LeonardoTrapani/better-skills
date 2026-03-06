# Component Design Guide

This document defines how new UI components should be designed in `apps/web`. It is based on the current system implemented across the shared primitives, the landing pages, and the authenticated vault experience.

Use this guide to keep new components visually consistent, structurally predictable, and easy to place in the codebase.

## 1. Design System Summary

The Better Skills UI has a strong, opinionated visual grammar:

- High contrast, mostly monochrome surfaces with a single amber primary accent.
- Square geometry. Rounded corners are intentionally removed almost everywhere.
- Dense information layout. Most interface text sits in the `10px` to `13px` range.
- Borders first, shadows second. Separation is usually created with `border`, `ring`, muted fills, and occasional backdrop blur.
- Monospace is used as a semantic signal for metadata, labels, breadcrumbs, counts, shortcuts, tabs, and technical information.
- Sans serif is used for primary reading content, titles, descriptions, and standard controls.
- Motion is subtle and short. Transitions reinforce state changes; they do not become a visual layer of their own.
- The same token system powers both light and dark mode. New components must work in both.

If a proposed component looks soft, rounded, glossy, oversized, or overly decorative, it is probably off-system.

## 2. Source of Truth

When designing or implementing a new component, align with these existing foundations first:

- Theme tokens and global styles: `apps/web/src/app/globals.css`
- App fonts and top-level shell: `apps/web/src/app/layout.tsx`
- Base shared primitives:
  - `apps/web/src/components/ui/button.tsx`
  - `apps/web/src/components/ui/input.tsx`
  - `apps/web/src/components/ui/card.tsx`
  - `apps/web/src/components/ui/badge.tsx`
  - `apps/web/src/components/ui/dialog.tsx`
  - `apps/web/src/components/ui/field.tsx`
- Shared structural patterns:
  - `apps/web/src/components/navigation/navbar.tsx`
  - `apps/web/src/components/skills/skill-panel.tsx`
  - `apps/web/src/components/markdown/markdown-components.tsx`
- Authenticated product layouts:
  - `apps/web/src/app/vault/_components/dashboard-view.tsx`
  - `apps/web/src/app/vault/_components/my-skills-table.tsx`
  - `apps/web/src/app/vault/skills/[id]/_components/skill-detail-header.tsx`
- Landing exceptions:
  - `apps/web/src/app/_landing/hero-section.tsx`
  - `apps/web/src/components/ui/grid-background.tsx`

Do not invent a parallel design language when the existing one already solves the problem.

## 3. Component Placement Rules

Follow the package rules from `apps/web/AGENTS.md`:

- Put only shadcn-style shared primitives in `apps/web/src/components/ui`.
- Put page-specific components inside the page folder.
  - Example: landing-only pieces stay in `apps/web/src/app/_landing`.
  - Example: vault page internals stay in `apps/web/src/app/vault/_components` or route-local `_components`.
- Put reusable non-primitive components under `apps/web/src/components/<domain>`.

Practical rule:

- If the component is a foundational control or wrapper used across many features, it may belong in `src/components/ui`.
- If it expresses product meaning, it should usually live outside `ui`.
- If it is tightly coupled to one route, keep it local to that route.

## 4. Visual Tokens

### 4.1 Color

Use semantic tokens, not ad hoc colors:

- Page background: `bg-background`
- Primary text: `text-foreground`
- Secondary text: `text-muted-foreground`
- Default surfaces: `bg-card`, `bg-background`, `bg-popover`
- Separation: `border-border`, `ring-foreground/10`
- Accent action/state: `bg-primary`, `text-primary`, `border-primary/...`
- Error state: `text-destructive`, `border-destructive`, destructive ring styles

Amber is the product accent. New components should not introduce a second accent color unless the feature already has a domain-specific color model, like enterprise vault colors.

### 4.2 Radius

Default to square corners:

- Prefer `rounded-none`.
- Do not introduce `rounded-lg`, pills, capsules, or soft cards unless there is an explicit existing exception.
- If a third-party widget brings rounded corners by default, flatten it with overrides.

### 4.3 Borders and Elevation

Default hierarchy:

1. `border`
2. muted background contrast
3. light `ring`
4. only then subtle shadow if necessary

Preferred patterns:

- Panels: `border border-border bg-background/90 backdrop-blur-sm`
- Floating surfaces: `ring-1 ring-foreground/10 bg-popover`
- Data blocks: border dividers instead of stacked shadows

Avoid heavy drop shadows, glowing surfaces, or gradient-heavy chrome in product UI.

## 5. Typography Rules

### 5.1 Font Roles

Use the existing font roles consistently:

- Sans (`--font-geist-sans`): titles, body copy, descriptions, form labels, buttons
- Mono (`--font-geist-mono`): metadata, shortcuts, chips, breadcrumbs, section labels, counts, code-like strings

Do not use monospace for long body paragraphs.

### 5.2 Type Scale

Current UI is intentionally compact. Use these ranges:

- `text-[10px]` to `text-[11px]`: metadata, eyebrow labels, helper chips, tab labels, command hints
- `text-xs`: default control text, compact content blocks, cards, dialogs, table rows
- `text-sm`: primary compact titles, readable body text inside app views
- `text-lg` to `text-3xl`: page and section titles only

### 5.3 Case and Tracking

Use uppercase mono labels for system framing, not for primary reading content:

- Good uses: tabs, panel titles, small section labels, status markers, keyboard hints
- Bad uses: long descriptions, form help text, paragraph content

Typical style:

- `font-mono uppercase tracking-wider` or `tracking-[0.08em]`

## 6. Spacing and Density

The product UI is dense, not airy.

Preferred patterns already in the codebase:

- Controls: `h-8` default, `h-7` or `h-6` for compact variants
- Panels: `px-4 py-4`, `px-5 py-3.5`, `p-4`
- Tight icon gaps: `gap-1`, `gap-1.5`, `gap-2`
- Section stacks: `space-y-2` to `space-y-6`

Guidance:

- Start compact, then add space only if readability is compromised.
- Use consistent internal padding before increasing outer spacing.
- Avoid oversized empty space inside tables, side panels, dialogs, or metadata sections.

## 7. Layout Patterns

### 7.1 Product UI

Authenticated screens use panelized layouts:

- Clear bordered containers
- Strong horizontal or vertical segmentation
- Sticky or fixed-feeling utility controls where useful
- Dense, scan-friendly content blocks

Common structure:

- header or toolbar
- content region
- optional footer or action rail

When a component contains multiple conceptual areas, separate them with borders before trying background color changes.

### 7.2 Landing UI

The landing surface uses the same tokens but is allowed to feel more expansive:

- Larger typography
- More breathing room
- More motion
- More visual atmosphere from grid overlays and image treatment

Important: this is an exception layer, not a second design system. Landing components should still inherit the same colors, typography families, square geometry, and border language.

## 8. Responsive Behavior

Design for both mobile and desktop from the start.

Current product breakpoint behavior strongly relies on `lg` (`1024px`) as the main layout switch:

- Mobile often uses tabbed or stacked content
- Desktop reveals split views, side panels, persistent utilities, and graph/background layers

Rules:

- Do not hide critical actions on mobile without providing an alternative path.
- Prefer reflow over shrinking everything.
- On small screens, simplify layout first, not typography first.
- Long identifiers, slugs, URLs, and filenames must truncate safely.
- Use `min-w-0` aggressively inside flex rows that contain text.

## 9. Interaction Rules

### 9.1 Buttons and Controls

Use shared primitives whenever possible.

- Start with `Button`, `Input`, `Textarea`, `Select`, `Dialog`, `Badge`, `Field`, `Checkbox`, `Switch`, `Combobox`.
- Extend variants only when the pattern is reusable.
- Do not hand-roll a bespoke button or input if the shared primitive can express it.

Default control characteristics:

- square
- compact
- visible border
- subtle hover fill
- focus ring via existing tokenized classes

### 9.2 Hover, Focus, and Active States

States should be clear but restrained:

- Hover usually changes text color, muted background, or border emphasis
- Focus must be visible with the existing ring styles
- Active/selected states should use foreground emphasis, primary borders, or primary-tinted fills

Do not rely on color alone when the component can also use weight, iconography, border, or position.

### 9.3 Disabled and Error States

Follow the existing shared primitive patterns:

- Disabled: lower opacity, suppress pointer events when appropriate
- Error: use destructive border/ring/text tokens, not custom red values

## 10. Content and Data Presentation

Better Skills frequently renders technical content, metadata, and structured records. New components should support scanability first.

Patterns to preserve:

- Use mono for identifiers, shortcuts, counters, paths, and compact metadata
- Use borders between rows in lists and tables
- Prefer concise secondary descriptions over large paragraph blocks
- Keep supporting metadata visually quieter than the main title
- Use truncation on constrained surfaces, but preserve full access via hover, tooltip, dialog, or detail view when needed

For markdown-like or document-like content:

- Keep body text readable with `text-sm` and generous line-height
- Keep inline code compact and square
- Keep block code bordered and flat
- Keep links visibly interactive with underline and primary color

## 11. Forms

Forms should compose around `Field` and related shared controls.

Rules:

- Use `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` for label/help/error consistency.
- Keep labels short and direct.
- Put supporting explanation in `FieldDescription`, not in placeholder text.
- Use placeholder text as a hint, never as the only label.
- Default to vertical form layout; use horizontal or responsive orientation only when it materially improves scanning.
- Group related inputs with `FieldGroup` or visual separators rather than ad hoc spacing.

When a form becomes multi-step or high-friction, use panel framing and section labels instead of one long undifferentiated stack.

## 12. Icons and Decoration

Icons in this system are functional, not ornamental.

Rules:

- Use Lucide icons to reinforce meaning, not to decorate empty space.
- Small icon sizes are preferred: typically `size-3`, `size-3.5`, or `size-4`.
- Pair icons with text in dense controls and metadata rows.
- Do not create icon-only actions unless the meaning is obvious and there is a label or tooltip.

Decorative background treatments are acceptable only when they already match the existing visual language:

- grid overlays
- subtle blur
- restrained motion
- technical/system framing

Avoid unrelated illustration styles, glossy gradients, or soft marketing-card aesthetics in the app shell.

## 13. Motion

Motion should be short, meaningful, and optional.

Preferred behavior:

- small fade, zoom, or slide transitions for overlays
- hover transitions around `150ms` to `200ms`
- reduced-motion safe behavior for animated effects

Do not:

- animate large layout shifts without reason
- use constant motion for standard controls
- stack multiple attention-grabbing animations in one area

## 14. Accessibility Baseline

Every new component should meet this baseline:

- Keyboard reachable
- Visible focus state
- Sufficient text contrast in both themes
- Proper labels for controls
- `aria-*` semantics for tabs, dialogs, expandable regions, and icon-only actions
- Reduced motion respect for non-essential animation

If a component changes state visually, make sure that state is also communicated semantically where appropriate.

## 15. Composition Strategy

New components should usually be assembled, not invented from scratch.

Preferred order:

1. Start from an existing shared primitive.
2. Compose with existing layout wrappers and utility classes.
3. Add a small local wrapper if the pattern is route-specific.
4. Promote to a shared component only after a real reuse case appears.

Do not push feature-specific semantics into `src/components/ui`.

## 16. Exceptions

A new component may diverge from the compact product UI only when one of these is true:

- It belongs to the landing experience.
- It visualizes graph or brand data that already has its own approved style.
- It wraps a third-party interaction model that cannot reasonably fit the default primitive without adaptation.
- It solves a clear usability problem that the base pattern cannot handle.

Even in those cases, keep:

- semantic color tokens
- square geometry where possible
- existing typography families
- restrained state styling

## 17. Anti-Patterns

Avoid these unless there is a documented reason:

- introducing rounded corners
- using arbitrary hex colors instead of semantic tokens
- creating one-off button or input styles outside shared primitives
- oversized typography inside dense product surfaces
- low-contrast muted-on-muted text
- shadows as the primary separation mechanism
- icon-only controls without labels or tooltips
- placeholders instead of labels
- mobile layouts that simply shrink desktop UI without restructuring
- adding a second accent color to product UI
- placing shared business components under `src/components/ui`

## 18. Definition of Done for a New Component

Before merging a new component, check all of the following:

- It lives in the correct folder.
- It reuses existing primitives where possible.
- It uses semantic tokens from the current theme.
- It works in light and dark mode.
- It preserves square geometry unless there is a clear exception.
- It matches the current density and typography rules.
- It has responsive behavior for mobile and desktop.
- It has visible hover, focus, disabled, and error states where relevant.
- It is keyboard accessible.
- It truncates or wraps long content safely.
- It does not introduce a parallel visual language.

## 19. Quick Decision Matrix

When designing a new component, use this sequence:

1. Is it a primitive control?
   - If yes, extend or compose in `src/components/ui`.
2. Is it tied to one route?
   - If yes, keep it route-local.
3. Is it shared product UI?
   - If yes, place it in `src/components/<domain>`.
4. Does it need emphasis?
   - First use border, text weight, and muted fill.
   - Only then add shadow or stronger color.
5. Does it need technical framing?
   - Use mono labels, compact sizing, borders, and tight spacing.
6. Does it belong to landing?
   - You may open spacing and scale, but keep the same token system.

## 20. Preferred Starting Point for New Work

For most new product components, start from this mental template:

- `border border-border`
- `bg-background` or `bg-background/90`
- `rounded-none`
- compact padding
- title in sans
- metadata in mono
- muted secondary text
- primary accent only for action, selection, or important emphasis
- layout that collapses cleanly on mobile

If the new component still feels like Better Skills after stripping out custom styling, it is probably designed correctly.
