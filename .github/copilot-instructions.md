# Copilot / AI Agent Instructions — project-kvk

Purpose: give an AI coding agent the minimal, actionable context to be immediately productive working on this Vite + React + TypeScript app.

1) Big picture
- This is a single-page front-end app scaffolded with Vite + React + TypeScript.
- Entry points: `index.html` -> `/src/main.tsx` -> `src/App.tsx`.
- Build: TypeScript project references are used (`tsconfig.app.json`, `tsconfig.node.json`). Production build runs `tsc -b && vite build` (see `package.json`).

2) Key files and their roles (start here)
- `index.html` — app root and script bootstrapping.
- `src/main.tsx` — React root/StrictMode and mount point.
- `src/App.tsx` — primary UI example and HMR playground.
- `vite.config.ts` — Vite config; `@vitejs/plugin-react` is enabled.
- `package.json` — scripts: `dev`, `build`, `preview`, `lint`.
- `tsconfig.app.json` / `tsconfig.node.json` — project references used by `tsc -b`.

3) Developer workflows & commands (exact)
- Start dev server (HMR): `npm run dev` (invokes `vite`).
- Full production build: `npm run build` (runs `tsc -b && vite build`).
- Quick preview of production build: `npm run preview`.
- Lint: `npm run lint` (ESLint is configured at repo root).

4) Project-specific patterns & gotchas
- Static assets: absolute root imports like `/vite.svg` (served from project root/public). Use `/` for public-root files, and relative imports for `src/assets`.
- Files use `.tsx` for React components; prefer named exports for components when adding new ones.
- Type-checked linting is not enabled by default; the README documents how to enable type-aware ESLint rules by pointing parserOptions.project to `tsconfig.*` files.
- There are no tests configured in this scaffold — do not assume test runners or configs exist.

5) Integration points & external dependencies
- Vite dev server + `@vitejs/plugin-react` — HMR/fast refresh.
- TypeScript project references — `tsc -b` is required before `vite build` for typed builds.
- ESLint config present at repo root (see `eslint.config.js`) — use `npm run lint` to validate code style.

6) What to do when changing build or types
- If you add new TS project references or change paths, update `tsconfig.app.json` and `tsconfig.node.json` and ensure `tsc -b` still succeeds.
- For stricter linting, follow the README snippet to enable `tseslint.configs.recommendedTypeChecked` and set `parserOptions.project`.

7) Small examples (copyable)
- Add a quick component and verify HMR:

  - Create `src/components/Hello.tsx` exporting a small component.
  - Import and render it in `src/App.tsx`, save — dev server should HMR the change.

8) When you need more context
- Inspect `package.json` scripts and `vite.config.ts` for customizations.
- If you modify TypeScript settings, run `npm run build` locally to catch `tsc -b` errors.

If anything here is unclear or you want more detail about runtime conventions or future CI hooks, tell me which area to expand.
