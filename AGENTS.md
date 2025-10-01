# Codex Ops Log – NFC IPS Viewer

**⏰ LAST UPDATED: 2025-10-01 13:05 UTC**
**🔄 TTL: Valid until 2025-10-01 14:05 UTC** *(Auto-refresh via Codex timestamp script)*

## Current Mandate
- Conduct end-to-end documentation/code review with focus on custom application surface; treat third-party dependencies as fixed inputs.
- Deliver refreshed architectural assessment (good practices, gaps, risks) and capture actionable follow-ups.
- Track outstanding UI fixes: Patient Demographics spacing/identifier pills, vitals legend behaviour, Events first-pill date rendering.

## Architectural Review (Custom Code Only)
### Good Practices Observed
- Centralised configuration (`config/constants.js`) drives pane metadata, stage titles, and CARE_STAGE_COUNT alignment, keeping rendering logic declarative.
- UI theming relies on CSS custom properties with single scaling multiplier, enabling consistent spacing/typography adjustments across panes.
- Codec pipeline encapsulates Base64 ⇄ Protobuf ⇄ FHIR conversions with modular helpers (`util/base64.js`, `util/json.js`), simplifying encode/decode flows.
- Vitals chart rendering gracefully falls back to a bundled mini renderer when Chart.js is absent, preserving offline functionality.

### Areas to Improve / Architectural Risks
- `createPatientDetailsElement` (script.js:4103) still gates Service/NHS pills on truthy values and logs verbose debug output to console; this blocks guaranteed identifier display and clutters logs.
- Patient Demographics pill layout uses `justify-content: space-between` with large `gap`, causing the extra bottom whitespace reported by user; needs layout realignment to match other OPCP cards.
- Custom legend (`createPositionedLegend`, script.js:4254) absolutely positions items without collision handling or ordering by final Y-value; legend width isn’t coordinated with chart canvas, so instructions about dynamic sizing/spacing remain unfulfilled.
- `renderStageSections` (script.js:4209) treats Event entries identically to Vitals/Conditions, so first-pill date formatting relies on string matching rather than explicit date fields—root cause of the ongoing Events date display regression.
- Debug helpers (`console.log` blocks across render path) remain enabled; consider feature-flagging or removing to avoid performance/log noise in production builds.

### Additional Observations
- Dual-title system is fully wired for all panes but `config.specialClass` hook remains commented out per 2025-09-21 note; confirm whether future styling variations still require that knob.
- Memory system (`memory/active/context.md`) lists follow-up tasks (make scripts executable, tag v3.0, etc.) that appear stale relative to current UI priorities; coordinate with maintainers before pruning.
- STRATEVAC pane appended post-R3 with refreshed R3 palette; chart now renders stage background bands (opacity via `--stage-band-opacity`) and legend abbreviations—monitor for UI feedback.
- Preset bundles #2 and #3 now mirror preset #1’s header layout and use IPS-compliant `urn:uuid` bundle identifiers with unique bundle/document UUIDs to avoid preset collisions during testing.
- Validation harness artefacts (`VALIDATION-TESTING.md`, `run-validation-tests.js`, `test-converters-simple.cjs`, `test-pipeline-node.cjs`, `validation-framework.js`) plus edits to `nfc/ips/viewer.html` and `script.js` remain in the working copy from a prior run; left untouched per user instruction.

## Dependency Snapshot (Treating Vendors as Given)
- `pako` ^2.1.0 (package.json) – last known stable release (still current as of 2024-10); re-check upstream for security patches when online.
- `protobufjs` ^7.5.4 – newer than widely deployed 7.2.x train; confirm compatibility matrix if upgrading Node/tooling.
- Chart.js v4.5.0 bundled under `resources/vendor/chart.umd.min.js`; latest public release track currently 4.4.x/4.5.x, so stay alert for 4.6 breaking changes before adopting.
- `live-server` ^1.2.2 and `gh-pages` ^6.3.0 for tooling; both stable but review changelogs for security updates during next dependency sweep.

## Outstanding Work Items (Custom Layers)
- Patient Demographics: remove excess bottom gap and render Service Number / NHS Number pills regardless of data presence (explicit fallback copy required).
- Vitals Chart: monitor legend collision handling for densely packed datasets; current layout uses fixed spacer column with right-aligned legend and collapsible vitals pills in stages.
- Events Pills: ensure first item in each OPCP row displays full datetime (`15 Jan 24 16:00`) while subsequent pills show time-only, without relying on regex against `entry.value`.
- Validate POI pane empty-state styling (known bug: full-height empty state using condensed style).
- Stage bands: validate midpoint boundaries across multi-day datasets to ensure contiguous colouring remains accurate; confirm STRATEVAC colouring holds across payload sources.

## Clarifications & Decisions Logged
- ✅ Scope confirmed with user: concentrate on custom code; dependencies treated as given—only report versions/status.

## Historical Notes
- Prior agent documented Events date regression extensively (see former AGENTS.md). Current investigation must resolve presentation-layer logic instead of backend timestamp extraction.
- Auto-JJ automation in place; coordinate with hooks before altering build/test scripts to avoid unintended commits.

## Codex Quick Start
- **Load order**:
    1. `cat CLAUDE.md`
    2. `cat AGENTS.md`
    3. `cat memory/active/status.md`
    4. `cat memory/active/context.md`
    5. `cat memory/implementations/2025-09-27-chart-tick-system.md`
    *(ensures both Claude and Codex instructions stay in sync before coding)*
- **TTL maintenance**: run `memory/update-codex-md.sh` or set `CODEX_REFRESH_TTL=1` when launching Auto-JJ so commits call the script automatically.
- **Manual refresh**: execute `./memory/update-codex-md.sh "optional reason"` whenever Codex session resumes without auto-commit triggers.
- **Instant restart**: if JJ or Auto-JJ forces an immediate restart, rerun `./memory/update-codex-md.sh "instant restart"` right away so timestamps and instructions stay in sync before coding resumes.
- **Crash recovery check**: verify the `LAST UPDATED` / `TTL` header near top of `AGENTS.md` before proceeding.

## Codex CQ Protocol
- Trigger clarifying questions for ambiguous tasks, explicit "Ask CQs" requests, or when multiple implementation paths exist.
- Use numbered questions with lettered options (a/b/c/d) prioritising foundational → scope → method → detail ordering.
- Reuse shared scenarios from `memory/patterns/cq-common-scenarios.md`; document new patterns under `memory/questions/` when novel cases arise.
- After receiving answers, summarise understood scope before coding to ensure alignment.
