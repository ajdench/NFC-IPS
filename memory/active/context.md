# Working Context

## ✅ COMPLETED - Major Recovery and Integration (2025-09-29)
- **Version Control Recovery**: Comprehensive JJ-to-Git integration with proper conflict resolution
- **JJ Protection Configuration**: Implemented anti-destructive git settings (auto-squash=false, auto-local-bookmark=false, push=false)
- **Feature Consolidation**: Successfully merged chart/axis work with preset #0 and OPCP title improvements
- **Medical Terminology**: Recovered and validated LEGEND_ABBREVIATIONS with proper medical abbreviations (Hgb, pH)
- **Architecture Integration**: CSS Grid vitals layout with spacer columns and Chart.js positioned legends
- **Preset #0 Complete**: Full implementation including event handling, constants, and file mapping
- **Branch Synchronization**: recovery_main branch updated with all integrated features

## Outstanding Issues (Lower Priority)
- Patient Demographics card: remove extra bottom gap from pill layout and ensure Service Number / NHS Number pills always render with explicit fallback text.
- Vitals legend: evaluate collision handling once multi-series datasets arrive; current layout uses fixed spacer column and right-aligned legend text.
- Events first-pill date display: rework presentation layer so the first pill in each stage shows full datetime without relying on regex matching inside `entry.value`.
- POI pane empty state: confirm condensed empty-state styling matches other OPCP panes.

## Previous Work
- Added Codex TTL management: `memory/update-codex-md.sh` refreshes `AGENTS.md` timestamps; Auto-JJ optionally invokes it when `CODEX_REFRESH_TTL=1`.
- Updated `AGENTS.md` with Codex quick-start guidance, CQ protocol summary, and dependency snapshot.
- Verified dependencies via `npm outdated` (no updates required) and confirmed network access workflow.

## Key Files Updated
- `script.js` – restored custom x-axis plugin, spacer-aware legend layout, dynamic OPCP title handling, and updated legend abbreviations.
- `style.css` – vitals grid now uses chart/spacer/legend columns with configurable gap.
- `AGENTS.md` – TTL refreshed and outstanding legend task reframed.

## Open Questions / Dependencies
- UX decisions needed for minimum spacing rules in the vitals legend when multiple datasets end at similar Y values.
- Confirm desired fallback copy for missing Service/NHS identifiers (e.g., "Not provided" vs. a blank pill value).
- Future enhancement: optional smooth-scroll from vitals placeholder to chart (recorded requirement, not yet implemented).

## Next Actions
1. Adjust Patient Demographics CSS/JS to normalize spacing and render identifier pills unconditionally.
2. Stress-test vitals legend with dense datasets to confirm spacer + right alignment prevents collisions.
3. Refactor Events rendering to use structured datetime fields for first-pill formatting; validate across payloads.
4. Re-test POI empty-state styling after layout changes.
5. Evaluate optional smooth-scroll behaviour from vitals placeholder to chart (recorded requirement).
6. Follow startup loading sequence: CLAUDE.md → AGENTS.md → memory/active/status.md → memory/active/context.md → memory/implementations/2025-09-27-chart-tick-system.md before coding.

## Environment Notes
- Auto-JJ active; set `CODEX_REFRESH_TTL=1` before `npm run dev:auto-jj` to keep Codex TTL updated automatically.
- Memory budget remains below 4k tokens; continue pruning legacy context as new work lands.
