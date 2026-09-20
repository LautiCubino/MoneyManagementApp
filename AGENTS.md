# AGENTS.md

Money-splitting PWA (Spanish UI) built as a Figma Make scaffold: React 19 + Vite 8 + Tailwind CSS v4 + TypeScript. All app logic lives in `src/App.tsx`. No backend, no tests, no CI.

## Commands

- `pnpm dev` — Vite dev server on port **8443** (`strictPort`, host `0.0.0.0`). README's mention of 5173 is stale; 5173 is never used.
- `pnpm build` — the way to verify changes compile; there is no lint/test/typecheck script.
- `pnpm exec tsc --noEmit` — typecheck (no script wired up).
- `pnpm format` — runs **oxfmt**, not Prettier. Existing code in `App.tsx` is not oxfmt-clean; run `pnpm format` after edits.
- Toolchain pinned in `.mise.toml` (Node 22, pnpm 10.34.3). Use `pnpm`, not `npm`.

## Architecture gotchas

- Add UI/code to `src/App.tsx`; `src/main.tsx` mounts it into `#root` and imports `src/index.css`. Tailwind v4 is configured only via the `@tailwindcss/vite` plugin + `src/index.css` — no `tailwind.config`/PostCSS config.
- Path alias `@` → `./src` (mirrored in `vite.config.ts` and `tsconfig.json`).
- State persists to localStorage under `money_app_gastos` and `money_app_participantes`. Do **not** rename these keys or break their JSON schema — existing users' data lives there. The "Vaciar todo" button clears both keys.
- `index.html` contains `<!-- figma:... -->` comment slots injected at build time by a vite plugin that reads `.figma/make/site.json` (title, lang, robots, meta). Edit site metadata there, not in `index.html`.

## Figma Make tooling (don't fight it)

- Keep components as **default exports**. A dev plugin triggers a full reload when a module stops defining a React Refresh boundary (e.g. replacing a component file with a `export { default } ...` re-export).
- Dev-only plugins also expose a stories page at `/.figma/make/kit.html` (files matching `src/**/*.stories.{ts,tsx,js,jsx}`); neither ships in `pnpm build`.
- `vite.config.ts` imports `./.figma/make/site.json` and `devServer.watch` ignores `.figma/**`, so config changes there need a dev-server restart (`.figma/make/dev.json` controls install/restart triggers).
- `.figma/make/` contains platform-managed shims — don't edit them. `/.figma/design-context/`, `/.plugins/`, `/.opencode-skills/` are gitignored.

## Style

- UI copy and commit messages are in Spanish (money formatted `es-AR`, e.g. `toLocaleString("es-AR")`). Match that.
- Code style is 4-space indented and deeply nested in `App.tsx`; oxfmt is the source of truth for acceptable formatting.