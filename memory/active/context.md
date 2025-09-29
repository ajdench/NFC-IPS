# Working Context

## ✅ COMPLETED - Preset #0 Button Implementation (2025-09-28)
- Added preset #0 button positioned between Clear and #1 buttons
- Configured complete JavaScript event handling for fragment/FHIR modes
- Fixed file loading by adding IPS_FHIR_JSON_0 constant to config/constants.js
- Updated demo state array with proper index shifting (payload0→demos[0])
- All preset buttons (#0-#3) now fully functional with correct file mappings

## Outstanding Issues (Lower Priority)
- Patient Demographics card: remove extra bottom gap from pill layout and ensure Service Number / NHS Number pills always render with explicit fallback text.
- Vitals legend + stage bands: overlap/spacing changes landed (15px overlap, 7px markers) with new background shading and STRATEVAC palette; awaiting UX sign-off and multi-day validation.
- Events first-pill date display: rework presentation layer so the first pill in each stage shows full datetime without relying on regex matching inside `entry.value`.
- POI pane empty state: confirm condensed empty-state styling matches other OPCP panes.

## Previous Work
- Added Codex TTL management: `memory/update-codex-md.sh` refreshes `AGENTS.md` timestamps; Auto-JJ optionally invokes it when `CODEX_REFRESH_TTL=1`.
- Updated `AGENTS.md` with Codex quick-start guidance, CQ protocol summary, and dependency snapshot.
- Verified dependencies via `npm outdated` (no updates required) and confirmed network access workflow.

## Key Files Updated
- `AGENTS.md` – new TTL header plus Codex quick-start/CQ protocol sections.
- `memory/update-codex-md.sh` – timestamp refresh script for Codex ops log.
- `scripts/auto-jj.js` – optional Codex TTL refresh hook controlled by `CODEX_REFRESH_TTL` env var.

## Open Questions / Dependencies
- UX decisions needed for minimum spacing rules in the vitals legend when multiple datasets end at similar Y values.
- Confirm desired fallback copy for missing Service/NHS identifiers (e.g., "Not provided" vs. a blank pill value).

## Next Actions
1. Adjust Patient Demographics CSS/JS to normalize spacing and render identifier pills unconditionally.
2. Gather UX feedback on legend spacing/ordering after latest overlap tweaks, stage bands, and payload header toast alignment.
3. Refactor Events rendering to use structured datetime fields for first-pill formatting; validate across payloads.
4. Re-test POI empty-state styling after layout changes.

## Environment Notes
- Auto-JJ active; set `CODEX_REFRESH_TTL=1` before `npm run dev:auto-jj` to keep Codex TTL updated automatically.
- Memory budget remains below 4k tokens; continue pruning legacy context as new work lands.
