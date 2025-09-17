# Repository Guidelines

## Project Structure & Module Organization
- Root SPA with `index.html`, `script.js`, `style.css`.
- Example data: `payload-1.json`, `payload-2.json`.
- Assets: `resources/`, `visual_cues/`; screenshots: `ips-screenshots/`.
- Build output: `build/` (generated; do not edit).
- Node tooling: `package.json`, `node_modules/`.

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server (live reload via `live-server`).
- `npm run build` — Copy static assets into `build/` and rename README for Pages.
- `npm run deploy` — Publish `build/` to GitHub Pages via `gh-pages`.
- Tests: none configured; use manual verification (see below).

## Coding Style & Naming Conventions
- JavaScript: 4-space indentation, semicolons required, prefer `const`/`let`, strict equality, template strings, and optional chaining (`?.`).
- CSS: 4-space indentation, CSS variables in `:root`; class names in kebab-case; keep colors and spacing as variables.
- HTML: minimal markup; UI is generated dynamically from `script.js` configs.
- Filenames: lower-case with hyphens for assets; keep existing names for core files.

## Testing Guidelines
- Manual checks: load via `npm run dev`, verify:
  - Base64-in-URL parsing renders payload; toggle switches between `payload-1.json` and `payload-2.json`.
  - “Patient” and “IPS Changes” boxes populate; layout remains responsive.
- If adding utilities, co-locate lightweight unit tests or provide a reproducible snippet in PR.

## Commit & Pull Request Guidelines
- Commits: concise, imperative mood. Prefer Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`) with scope when helpful.
- PRs must include:
  - Clear summary and rationale; link issues if applicable.
  - What changed, how tested (commands, steps), and any edge cases.
  - UI-affecting changes: before/after screenshots (store in `ips-screenshots/`).

## Security & Configuration Tips
- Only parse trusted JSON; handle decode/parse failures gracefully.
- Avoid introducing external network calls or large deps; keep SPA static and Pages-friendly.
- Do not commit `build/` or `node_modules/`.

## Node Version Guidance
- Recommended: Node.js 20 LTS (20.x). Also supported: Node.js 18 LTS (>=18.17).
- npm: use the version bundled with your Node (npm 9+ for Node 20, npm 8+ for Node 18).
- Rationale: current dev tooling (`gh-pages@6`, `live-server@1.x`) targets modern LTS Node; older Node versions may fail during install or deploy.
- Quick check: `node -v` and `npm -v` should report the expected major versions.
- Using nvm (recommended): `nvm use --lts` or `nvm install 20` then `nvm use 20`. Windows: use `nvm-windows` with the equivalent commands.
