# 2025-10-17: careStage Encounter Lookup Fix

## Problem
Display button showed no clinical data for Preset #1 (ips-fhir-json-1.json):
- All care stage sections (POI, CASEVAC, R1, R2) remained empty
- Vitals chart showed no time-series data
- Console showed "DEBUG: Final totals: {vitals: 0, conditions: 0, events: 0}"
- All 63 FHIR resources defaulted to 'patient' stage

## Root Cause
`buildStageSectionsDirectlyFromFhirBundle()` (script.js:4852) used a **local** `getCareStage()` function that only checked for `care-stage` extensions:

```javascript
// BROKEN - Only supports extension-based (Preset #0 format)
const getCareStage = (resource) => {
    const ext = resource.extension?.find(e => e.url === 'http://example.org/fhir/StructureDefinition/care-stage');
    return ext?.valueCode || 'patient';  // Always returns 'patient' for Preset #1
};
```

However, ips-fhir-json-1.json uses **Encounter-based** careStage assignment (IPS-OPCP standard):
- Resources have `encounter.reference: "urn:uuid:..."`
- Encounters have `type.coding` with `system: "http://medis.org.uk/fhir/CodeSystem/opcp-care-stages"`
- No `care-stage` extensions present (extension fields are `null`)

## Dual careStage Approaches in Codebase

### Approach 1: Encounter-based (IPS-OPCP standard)
Used by: ips-fhir-json-1.json (Preset #1)

```json
{
  "id": "obs-mechanism-POI-10",
  "resourceType": "Observation",
  "extension": null,
  "encounter": {
    "reference": "urn:uuid:0dac073f-0ce7-426b-b7c4-a490b7847ca1"
  }
}

// Encounter has the care stage:
{
  "id": "enc-poi-phcill",
  "resourceType": "Encounter",
  "type": [{
    "coding": [{
      "system": "http://medis.org.uk/fhir/CodeSystem/opcp-care-stages",
      "code": "poi"
    }]
  }]
}
```

### Approach 2: Extension-based (Legacy)
Used by: ips-fhir-json-0.json (Preset #0)

```json
{
  "id": "vital-temperature",
  "resourceType": "Observation",
  "extension": [{
    "url": "http://example.org/fhir/StructureDefinition/care-stage",
    "valueCode": "poi"
  }]
}
```

## Fix Applied
**File**: script.js
**Line**: 4852
**Change**: Replace local `getCareStage()` with call to `getCareStageFromResource()`

```javascript
// AFTER - Supports both Encounter-based AND extension-based
const getCareStage = (resource) => {
    return getCareStageFromResource(resource, bundle) || 'patient';
};
```

`getCareStageFromResource()` (script.js:1992-2031) implements the full logic:
1. **Approach 1**: Look up encounter.reference → read Encounter.type.coding
2. **Approach 2**: Fallback to care-stage extension
3. Default to 'patient' if neither found

## Why This Bug Existed
**Two separate implementations** for the same logic:

| Function | Location | Used By | Supports Encounter? | Supports Extension? |
|----------|----------|---------|---------------------|---------------------|
| `getCareStageFromResource()` | script.js:1992 | FHIR→CodeRef encoding | ✅ Yes | ✅ Yes (fallback) |
| Local `getCareStage()` (BROKEN) | script.js:4852 | CodeRef→FHIR decoding | ❌ No | ✅ Yes only |

**During encoding** (Action button):
- Uses `determineCareStage()` → `getCareStageFromResource()` ✅ CORRECT
- Encounter lookup works, all resources properly classified

**During decoding** (Display button):
- Used local `getCareStage()` ❌ WRONG
- No encounter lookup, all resources defaulted to 'patient'

## Impact
**Before Fix**:
- Preset #1 Display button: 100% data loss (all to 'patient' stage)
- Preset #0 Display button: ✅ Works (has extensions)

**After Fix**:
- Preset #1 Display button: ✅ Works (Encounter lookup)
- Preset #0 Display button: ✅ Works (extension fallback)

## Prevention
**Immediate**:
- Single function for careStage extraction across entire codebase
- No duplicate implementations

**Future Consideration**:
- Eliminate CodeRef intermediate format entirely
- Direct FHIR ↔ Protobuf conversion removes this class of bugs
- See memory/issues/2025-10-17-coderef-architecture-review.md (future work)

## Testing Verification
**Test Case 1** (Encounter-based):
1. Load Preset #1
2. Click Action button (encode)
3. Click Display button (decode)
4. **Expected**: POI section shows 13+ vitals, 4+ conditions, 6+ procedures
5. **Expected**: CASEVAC, R1, R2 sections populated
6. **Expected**: Vitals chart shows time-series lines

**Test Case 2** (Extension-based):
1. Load Preset #0
2. Click Action + Display buttons
3. **Expected**: Same behavior as before (regression test)

## Commit
```
fix(fhir): Use getCareStageFromResource for Encounter-based careStage lookup

- Replace local getCareStage() in buildStageSectionsDirectlyFromFhirBundle()
- Now uses getCareStageFromResource() which supports both:
  * Encounter-based (IPS-OPCP standard via encounter.reference)
  * Extension-based (legacy Preset #0 format)
- Fixes Display button not showing data for Preset #1 (ips-fhir-json-1.json)
- All 63 resources were defaulting to 'patient' stage instead of distributing to POI/CASEVAC/R1/R2
- Removed debug logging from investigation phase
- Root cause: Preset #1 uses Encounter references, not care-stage extensions
```

## Related Issues
- memory/issues/2025-10-17-api-lookup-failures.md (LOINC/SNOMED - separate issue)
- memory/fixes/2025-10-17-carestage-extension-reading.md (Previous valueString→valueCode fix)
