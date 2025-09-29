# Preset #0 Button Implementation

**Date**: 2025-09-28
**Status**: COMPLETED
**Type**: UI Enhancement

## Overview
Added preset #0 button functionality to the NFC IPS viewer, positioned between Clear and #1 buttons, with complete event handling and file mapping configuration.

## Implementation Details

### Files Modified
1. **nfc/ips/viewer.html**
   - Added `<button id="preset-0" class="preset-button">#0</button>`
   - Positioned in preset-buttons div between Clear and #1

2. **script.js**
   - Added `preset0Button` variable declaration
   - Implemented complete event handler with fragment/FHIR modes
   - Updated `updateActivePreset` function to include preset0Button
   - Modified demo state array with proper index shifting:
     - payload0 → demos[0] (new)
     - payload1 → demos[1] (shifted from 0)
     - payload2 → demos[2] (shifted from 1)
     - payload3 → demos[3] (shifted from 2)

3. **config/constants.js**
   - Added `IPS_FHIR_JSON_0: new URL('ips-fhir-json-0.json', BASE_URL).href`
   - Ensures proper URL resolution for payload0

### File Mappings
- **#0** → `ips-fhir-json-0.json`
- **#1** → `ips-fhir-json-1.json` (updated from previous mapping)
- **#2** → `ips-fhir-json-2.json`
- **#3** → `ips-fhir-json-3.json`

## Issue Resolution

### Problem Encountered
- "Preset 0 not available" error when clicking button
- Root cause: `payload0` failing to load due to hardcoded string vs. constant mismatch

### Solution Applied
1. Added missing `IPS_FHIR_JSON_0` constant to DEMO_PAYLOADS
2. Updated script.js to use `DEMO_PAYLOADS.IPS_FHIR_JSON_0` instead of hardcoded path
3. Ensured consistent URL resolution pattern across all payloads

## Testing Status
✅ HTML button renders correctly in proper position
✅ JavaScript event handlers configured
✅ File loading works via proper constants
✅ Demo state array properly manages all 4 payloads
✅ All preset buttons (#0-#3) functional

## Code Quality
- Follows existing patterns and conventions
- Uses proper constants instead of magic strings
- Maintains consistent event handling approach
- Preserves existing functionality while adding new features

## Impact
- Users can now access payload0 content via preset #0 button
- Maintains backward compatibility with existing preset buttons
- Enhances user workflow with additional demo data option