# Repository Guidelines

## Project Structure & Module Organization
- `apps/web` and `apps/docs` are Next.js App Router apps (`app/`, `public/`).
- `apps/admin` is a Vite + React app (`src/`, `public/`).
- `packages/ui` holds shared React components for the apps.
- `packages/eslint-config` and `packages/typescript-config` centralize lint and TS presets.
- Root workspace uses `pnpm-workspace.yaml` and Turborepo (`turbo.json`).

## Build, Test, and Development Commands
- `pnpm dev`: run all app dev servers via Turborepo.
- `pnpm build`: build all apps/packages.
- `pnpm lint`: lint all apps/packages.
- `pnpm check-types`: run TypeScript checks across the workspace.
- `pnpm format`: format `ts/tsx/md` using Prettier.
- App-specific examples:
  - `pnpm --filter web dev` (Next.js on :3000)
  - `pnpm --filter docs dev` (Next.js on :3001)
  - `pnpm --filter admin dev` (Vite default port)

## Coding Style & Naming Conventions
- TypeScript-first; prefer `.tsx` for React components.
- ESLint configs live in `packages/eslint-config`; run `pnpm lint` before PRs.
- Formatting: Prettier (see `pnpm format`).
- Component files in `packages/ui/src` are lowercase (`button.tsx`, `card.tsx`).

## Testing Guidelines
- No dedicated test framework is configured yet.
- Use `pnpm lint` and `pnpm check-types` as the required validation steps.
- If adding tests, document the runner in the app/package `README.md` and update this file.

## Commit & Pull Request Guidelines
- Commit history uses Conventional Commits with scopes (example: `feat(create-turbo): ...`).
- Keep commits focused and include a short scope (`web`, `docs`, `admin`, `ui`).
- PRs should include:
  - A brief summary of changes and rationale.
  - Linked issues (if any).
  - Screenshots or clips for UI changes (web/docs/admin).

## Environment Notes
- Node.js `>=18` and `pnpm@9` are required (`package.json` engines).
- Use workspace filters to target specific apps or packages.
