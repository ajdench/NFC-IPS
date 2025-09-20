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

## Project Maturity Assessment (2025-09-21)

**Overall Read**
- Viewer delivers a polished prototype UI, but core logic remains tightly coupled inside `script.js` (~4.6k LOC) with heavy debug instrumentation and minimal runtime validation.
- Engineering maturity is low: no automated tests, no build-time checks, and several features (encoding workspace, comparison flows) do not function due to missing exports.
- Operational posture is fragile; deployment scripts and asset paths assume a Unix-like host and root-served Pages origin.

**Key Risks**
- `console-logger.js:1-65` overrides `console` to trigger log downloads every 50 messages; with the current verbose logging in `script.js` this floods users with download prompts and blocks normal console inspection.
- `payload-page.js:73-92` calls `showMessage`, `window.convertFhirBundleToCodeRef`, and `window.compressAndEncodeFragment`, but the module-scoped implementations in `script.js` are not exported, so the encoding page throws `ReferenceError` and cannot encode fragments.
- `config/constants.js:275-276` hard-codes `/resources/...` paths; on GitHub Pages the app is served from `/NFC-IPS/` so protobuf schema fetches 404 and codec features break.
- `package.json:9` relies on `mkdir -p`, `cp`, and `mv`, which fail on Windows shells; the build pipeline is therefore non-portable.

**Improvement Opportunities**
1. Split `script.js` into focused ES modules (state, codec, terminology, UI) and gate debug logging behind environment flags to reduce side effects from `console-logger.js`.
2. Expose a small shared API (`window.NfcIps` or dedicated module) so secondary pages reuse codec helpers without duplicating logic, or migrate payload tooling into the main module bundle.
3. Replace the download-based logger with an opt-in developer console (e.g., feature flag that collects logs in memory and renders in-page) and keep the default browser console unobstructed.
4. Make the build portable by switching to a Node-based script (`fs` copy/rename) or `npm-run-all` + `cpx`, and add a smoke-test script that decodes/encodes `payload-1.json` before deployment.

**Documentation Notes**
- Primary references: `README.md` (overview/setup) and `README-gh-pages.md` (deployment branch).
- AI agent specs and workflows: `AI-CODEGEN-SPEC.md`, `CLAUDE.md`, `GEMINI.md`, `CODEC.md`.
- Domain context: `TERMINOLOGY.md`, `resources/nfc_requirements*.md`, `resources/nfc_worked_example.md`.
- Process aids: `COMMIT_MESSAGE.txt`, `AGENTS.md` (this file).
- Consider consolidating overlapping instructions into a single contributor guide plus a concise architecture note for codec and UI layers.
