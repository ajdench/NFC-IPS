# URGENT: Codex Investigation Required - Events Date Display Bug

## 🚨 CRITICAL BUG - Events dates not displaying on first pills

**Problem**: Events pills in MIST chronological display fail to show full dates on the oldest (first: oldest > newest; left > right) Event pills in each OPCP pane. Vitals and Conditions work correctly.

**Expected**: First Event pill shows "15 Jan 24 16:00", subsequent pills show "16:00"
**Actual**: All Event pills show time-only format "16:00"

## Investigation Summary

### ✅ WORKING LAYERS
- **Data Layer**: Events contain valid `rawData.dateTime` timestamps
- **Logic Layer**: Events properly marked `isFirstDisplayedInRow=true`
- **Debug Logs**: Confirm `dateDisplay: "15 Jan 24 16:00"` in pill objects

### ❌ BROKEN LAYER
- **Presentation Layer**: UI rendering fails to display dates (script.js:~4064)
- **Location**: `renderStageSections()` function in presentation rendering

### Failed Attempts
1. Enhanced timestamp detection with `extractTimestamp()` helper
2. Regex pattern changes from `\w+` to `\w{3}` for month matching
3. Events-specific treatment logic (broke empty pane display)
4. Extensive debugging (polluted codebase, caused syntax errors)

## Key Technical Details

**Timestamp Detection** (WORKING):
```javascript
function extractTimestamp(item) {
    return item.time || item.onset || item.rawData?.dateTime || null;
}
```

**Problem Area** (script.js:~4064):
```javascript
// This regex pattern matching appears to fail for Events
const timeMatch = entry.value.match(/(\d{1,2} \w{3} \d{2} \d{2}:\d{2})/);
```

**Debug Evidence**:
- Debug logs show Events pills created with correct `dateDisplay` and `isFirstDisplayedInRow` values
- Same logic that works for Conditions/Vitals fails for Events in UI rendering

## Investigation Needed

1. **Value Structure Analysis**: Compare Events vs Conditions/Vitals data structures
2. **DOM Pipeline Tracing**: Follow pill object → HTML element conversion
3. **CSS Investigation**: Check if dates rendered but hidden by styling
4. **Template Logic**: Understand why identical logic produces different UI results

**Status**: Multiple Claude attempts failed, requires fresh Codex investigation

---

## Next Steps
- Extend regression coverage across encode/decode + parse UI flows
- Verify OPCP empty-state styling remains consistent (particularly POI)
- Architectural refinement: rename payload viewer `right-input` field to `right-output` and update dependent selectors/logic for terminology clarity.

### Update 2025-09-21
- `config.specialClass` path in `createInfoBoxes` commented out so POI pane now shares standard wrapper/title classes.
- Encoding grid panes now mirror main payload left/right styling; right-hand Parse buttons remain disabled placeholders.
- Switched encoding left headers to grid layout with hidden preset spacer so spacing mirrors the viewer pane.
- Payload pane layout: removed inter-element gap so header/input stack without additional vertical spacing.
- Removed Debug Regenerate control; payload header now sits directly above panes with standard padding only.
- Payload header spacing tuned: margin set to 0.75× standard while title margin stays zero to keep panes tight without feeling cramped.
- MIST renderer now trusts normalized pill data; regex-based date collapsing removed so Treatment pills retain full dates where expected.
- Parse pill cleanup: conditions drop the "Onset" prefix; events use dose/route info without repeating FQN and infer units for numeric doses (including SNOMED med mappings).

# Agent Notes (2025-09-21)

- UI palette refined so AXP sits chromatically between CASEVAC/MEDEVAC and R3 carries a richer lavender tone.
- Default startup behaviour remains manual: left pane shows FHIR bundle, right pane empty until user clicks Encode/Parse.
- Fixed POI empty-state styling so it uses the shared condensed title marker like other OPCP panes.
- BUG: POI pane still shows full-height empty state instead of the shared condensed style.
