# 2025-09-22-events-date-display-bug.md

## Problem
Events pills in MIST chronological display fail to show full dates on the oldest (first: oldest > newest; left > right) Event pills in each OPCP pane. Expected "15 Jan 24 16:00" format on first pill, "16:00" on subsequent pills. All Event pills show time-only format.

## Root Cause Analysis
**Data Layer**: ✅ Working - Events contain valid `rawData.dateTime` timestamps
**Logic Layer**: ✅ Working - Events properly marked `isFirstDisplayedInRow=true`, debug logs confirm correct pill objects
**Presentation Layer**: ❌ Broken - UI rendering in `renderStageSections()` overwrote pill values via regex/date-collapsing

## Investigation Details
- Events timestamp detection working with `extractTimestamp()` helper
- Chronological sorting and row marking logic functional
- Debug logs show Events pills created with correct `dateDisplay: "15 Jan 24 16:00"` and `isFirstDisplayedInRow=true`
- Issue isolated to presentation layer regex pattern matching

## Failed Fix Attempts

### Attempt 1: Enhanced Timestamp Detection
```javascript
function extractTimestamp(item) {
    return item.time || item.onset || item.rawData?.dateTime || null;
}
```
**Result**: Logic layer confirmed working, UI still broken

### Attempt 2: Regex Pattern Precision
```javascript
// Changed from \w+ to \w{3}
const timeMatch = entry.value.match(/(\d{1,2} \w{3} \d{2} \d{2}:\d{2})/);
```
**Result**: Pattern more precise but still not working

### Attempt 3: Events-Specific Treatment Logic
```javascript
if (stageName === 'Treatment' && entry.type === 'Events') {
    // Special handling logic
}
```
**Result**: Broke empty pane display, reverted

### Attempt 4: Comprehensive Debugging
- Added extensive console.log statements throughout pipeline
- Polluted production code with debugging output
- Caused JavaScript syntax errors during cleanup
- Missing closing braces at line 4099

## Fix Implementation (2025-09-22)
- Refactored renderer to consume normalized pill data directly (conditions, vitals, events arrays)
- Removed regex-based date/time parsing and `lastDateInPane` tracking
- Preserved label trimming for subsequent items while respecting precomputed `entry.value`
- Verified full date/time now shows on first Treatment pill; subsequent pills collapse to time-only per normalization layer

## Current State
- **Codebase**: Cleanup complete; renderer simplified, debug pollution removed
- **Functionality**: ✅ Events dates display correctly across OPCP panes
- **Documentation**: Resolution recorded in CLAUDE.md, AGENTS.md, and this fix log

## Prevention
- Segregate debugging utilities instead of polluting production code
- Use JSDoc documentation for debugging functions
- Implement proper error handling and rollback procedures
- Add regression tests for MIST chronological display

## Next Steps
- Add regression coverage for MIST first-pill date display across conditions/vitals/events
- Ensure future renderer changes honor normalized pill data contract

**Status**: RESOLVED - 2025-09-22
