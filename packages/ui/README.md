# @flyt-tribe/ui

Shared UI kit (shadcn-based primitives + Aceternity patterns) for all apps.

## How to use
- Styles: `import "@flyt-tribe/ui/styles.css";` (single entry). Fonts live in the app (e.g., Next `font`).
- Components: `import { Button } from "@flyt-tribe/ui/components";` (preferred). Direct paths like `@flyt-tribe/ui/components/primitives/button` only for internal/experimental needs.
- Themes: CSS variables live in `src/styles/themes` (source of truth). Optional TS types are in `@flyt-tribe/ui/theme`.
- Dark mode: `next-themes` + `class` strategy; `.dark` on `<html>`/`<body>` toggles dark variables.

## Project structure
- `src/styles/` - base.css, tokens.css, utilities.css, themes/, index.css (entry).
- `src/components/primitives` - shadcn primitives (buttons, inputs, etc.).
- `src/components/compounds` - composed widgets (nav, cards, etc.).
- `src/components/patterns` - page sections/patterns (e.g., hero, pricing, CTA).
- `src/types/theme/` - TS token types (no runtime values).
- `components.json` - shadcn CLI config (generate only into this package).

## Conventions
- Prefer imports via `@flyt-tribe/ui/components` (barrel) for stability.
- When adding token names, update TS types if you use them.
- Add new UI first as primitives -> then compose into compounds -> then patterns for page reuse.

## Tasks via Turbo
- `pnpm turbo lint --filter @flyt-tribe/ui`
- `pnpm turbo typecheck --filter @flyt-tribe/ui`
- `pnpm turbo test --filter @flyt-tribe/ui` 
