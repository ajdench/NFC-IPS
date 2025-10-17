# 2025-10-17 - careStage Extension Reading Bug

## Problem
All 63 FHIR resources were showing `careStage: patient` instead of properly distributing across POI, CASEVAC, R1, R2, and other care stage sections. Clinical data was not displaying in UI despite success toast message.

## Investigation

### Initial Symptoms
- Display button showed "Success" toast
- Console output: `DEBUG: Final totals: {vitals: 0, conditions: 0, events: 0}`
- All resources logged as `careStage: patient`
- No clinical data visible in any care stage sections

### Discovery Process
1. Created `test-conversion.mjs` Node.js script to analyze original FHIR structure
2. Found 66 resources with proper care-stage extensions in original payload
3. Distribution in original: poi: 15, casevac: 9, medevac: 15, r1: 14, r2: 13
4. Discovered extension format mismatch

### Root Causes (Two-Part Bug)

#### Part 1: Extension Format Mismatch (Fixed in previous session)
**Original FHIR format:**
```json
{
  "extension": [{
    "url": "http://example.org/fhir/StructureDefinition/care-stage",
    "valueCode": "poi"
  }]
}
```

**My converter code was creating:**
```json
{
  "extension": [{
    "url": "http://example.org/fhir/StructureDefinition/careStage",
    "valueString": "poi"
  }]
}
```

**Issues:**
- URL used camelCase `careStage` instead of hyphenated `care-stage`
- Used `valueString` instead of `valueCode`

**Fix:**
Bulk sed replacement across all 8 converter functions:
```bash
sed -i '' "s|careStage|care-stage|g" script.js
sed -i '' "s/valueString: careStage/valueCode: careStage/g" script.js
```

#### Part 2: getCareStage() Reading Wrong Field (Fixed this session)
**Bug Location:** script.js line 4854

**Buggy code:**
```javascript
const getCareStage = (resource) => {
    const ext = resource.extension?.find(e => e.url === 'http://example.org/fhir/StructureDefinition/care-stage');
    return ext?.valueString || 'patient';  // ❌ Checking valueString
};
```

**After Part 1 fix, all extensions use `valueCode`, but `getCareStage()` was still checking `valueString`**, causing all resources to default to `'patient'`.

## Fix

**Modified code:**
```javascript
const getCareStage = (resource) => {
    const ext = resource.extension?.find(e => e.url === 'http://example.org/fhir/StructureDefinition/care-stage');
    return ext?.valueCode || 'patient';  // ✅ Now checking valueCode
};
```

**File:** `/Users/andrew.dench/Documents/nfc-ips/script.js` line 4854
**Function:** `buildStageSectionsDirectlyFromFhirBundle()`

## Impact

### Before Fix
- All 63 resources → `careStage: patient`
- No clinical data displayed in any section
- Zero totals: `{vitals: 0, conditions: 0, events: 0}`

### After Fix (Expected)
- Resources properly distributed across care stages
- Clinical data visible in POI, CASEVAC, R1, R2, etc. sections
- Proper totals reflecting actual resource counts per stage

## Prevention
- Extension format matches FHIR standard (`valueCode` for coded values)
- Reading logic matches writing logic (both use `valueCode`)
- Test script (`test-conversion.mjs`) can verify extension structure independently

## Commits
1. Previous session: `fix(fhir): Correct careStage extension URL and use valueCode instead of valueString`
2. This session: `fix(fhir): Fix getCareStage() to read valueCode instead of valueString`

## Testing
**Status:** Awaiting browser refresh to verify clinical data displays correctly

**Test Steps:**
1. Refresh browser
2. Click Display button
3. Verify clinical data appears in POI, CASEVAC, R1, R2 sections
4. Check console for proper careStage distribution (not all 'patient')
5. Verify totals show non-zero counts for vitals, conditions, events
