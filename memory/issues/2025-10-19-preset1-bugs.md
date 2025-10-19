# Preset #1 Display Bugs - 2025-10-19

## Current Status After Fixes

### ✅ Fixed Issues
1. **Scope Error (ReferenceError)** - Fixed
   - Issue: `getCareStageFromResource` was out of scope
   - Fix: Implemented inline Encounter-based lookup in `buildStageSectionsDirectlyFromFhirBundle`
   - Commit: 3b1320a3

2. **LOINC API Pattern Mismatch** - Fixed
   - Issue: tx.fhir.org returning HTML instead of JSON
   - Fix: Added `Accept: application/fhir+json` header
   - Commit: 9b0fb3df

3. **Condition/Event "undefined" Display** - Fixed
   - Issue: `createStandardizedPill` calling `resolveCodeDisplay()` which returned undefined
   - Fix: Use `description` from `rawData` parameter instead
   - Commit: 67530e98

4. **Redundant Pre-loading** - Fixed
   - Issue: All 4 presets being processed on page load
   - Fix: Removed automatic `buildViewModelFromObject` calls in `init()`
   - Commit: 7c932bab

### ❌ Outstanding Issues

#### 1. Vitals Chart Only Showing POI and R1
**Symptom**: Chart legend/data only shows POI and R1, missing R2, MEDEVAC, etc.
**Expected**: Should show all care stages that have vitals data
**Data Analysis**:
- POI encounter: 19 resources
- R1_PHEC encounter: 9 resources  
- R1_PHC encounter: 16 resources
- R2_DHC encounter: 3 resources
- Other encounters (CASEVAC, AXP, MEDEVAC, etc.): 0 resources

**Likely Cause**: 
- Chart.js dataset filtering or care stage mapping issue
- R1_PHEC and R1_PHC both map to 'r1' - combined 25 resources
- Need to check if R2 vitals are being processed but not charted

#### 2. Not All Code Items Displaying
**Symptom**: Some coded items missing from display
**Expected**: All FHIR resources with encounter references should display
**Analysis Needed**:
- Which specific codes are missing?
- Are they Observations, Conditions, Procedures, MedicationAdministrations?
- Do they have valid encounter references?
- Are they being filtered out during processing?

#### 3. Vitals "Click to Open" Not Working
**Symptom**: Clicking vitals placeholder doesn't open modal/detail view
**Expected**: Should open vitals detail view or expand chart
**Location**: Vitals placeholder div with "See Vitals chart below or click to open"

## Data Distribution (ips-fhir-json-1.json)

### Encounter UUIDs → Care Stages
```
poi:          urn:uuid:0dac073f-0ce7-426b-b7c4-a490b7847ca1 (19 resources)
casevac:      urn:uuid:9c6f6ae5-2bd7-493e-9fbe-e7bf84047ac8 (0 resources)
axp:          urn:uuid:009fcb58-d829-456e-b500-e70e1668a13a (0 resources)
medevac:      urn:uuid:c0d1331f-4cf4-4f0e-9110-8ca5ae678a3c (0 resources)
r1_phec:      urn:uuid:2972c6a4-96e4-4795-a659-e1a6ba9b3d13 (9 resources)
r1_phc:       urn:uuid:eaf7a7aa-5060-4afc-a947-aa5920479a9f (16 resources)
fwd_tacevac:  urn:uuid:b244a7c6-206b-43df-91cc-28250b323b1d (0 resources)
r2_dhc:       urn:uuid:edf8bafe-33e5-4932-a203-846e25f1492a (3 resources)
rear_tacevac: urn:uuid:b623ff8a-c630-4ec4-9888-55e85cea4630 (0 resources)
r3_dhc:       urn:uuid:e522b4a5-5e31-4ce1-80b3-0e858ef81641 (0 resources)
stratevac:    urn:uuid:765812af-8889-4a42-9b8d-e18cbaf17e1f (0 resources)
```

### Expected Display
- **POI**: Should have data (19 resources)
- **CASEVAC/AXP/MEDEVAC/FWD_TACEVAC/REAR_TACEVAC/R3/STRATEVAC**: Should be empty (0 resources) ✅ CORRECT
- **R1**: Should have data (25 resources = 9 PHEC + 16 PHC)
- **R2**: Should have data (3 resources)

### Actual Display (User Report)
- **POI**: Has data ✅
- **R1**: Has data ✅
- **R2**: Has data ✅
- **Vitals Chart**: Only showing POI and R1 ❌ (missing R2)
- **Some codes missing**: Unclear which specific items ❌

## API Issues (Lower Priority)

### LOINC API
- ✅ Most codes working with Accept header fix
- ❌ Two codes still failing: 10340-1, 75269-8 (HTTP 400)
- Impact: Minor - only 2 codes out of ~20

### SNOMED API
- ❌ Code 432122003 failing (CORS + 404)
- Server: snowstorm-training.snomedtools.org
- Status: Concept not found in training database
- Impact: Medium - display text exists in FHIR already, so no visual impact

## Next Steps

1. **Investigate Vitals Chart Filtering**
   - Check chart dataset creation
   - Verify R2 vitals are in parsedViewModel.stageSections.r2.vitals
   - Check if care stage color/label mapping includes R2

2. **Identify Missing Code Items**
   - Get specific list from user of which items should appear but don't
   - Check console for processing logs
   - Verify encounter reference matching

3. **Fix Vitals Click Handler**
   - Find click event listener for vitals placeholder
   - Check if modal/expand function exists
   - Implement or repair handler

## Test Commands

```bash
# Check R2 resources in FHIR
cat ips-fhir-json-1.json | jq '.entry[] | select(.resource.encounter.reference == "urn:uuid:edf8bafe-33e5-4932-a203-846e25f1492a") | {type: .resource.resourceType, id: .resource.id}'

# Count resource types per encounter
cat ips-fhir-json-1.json | jq -r '.entry[] | select(.resource.encounter) | "\(.resource.resourceType): \(.resource.encounter.reference)"' | sort | uniq -c
```

## AUTOMATED ANALYSIS REPORT (test-preset1-analysis.mjs)

### Expected Data Distribution

**POI Section:**
- 15 Vitals (Observations)
- 2 Conditions
- 1 Event (1 Procedure)
- **Total: 18 items** (1 ServiceRequest is patient-level, not stage-level)

**R1 Section (r1_phec + r1_phc combined):**
- 20 Vitals (8 PHEC + 12 PHC)
- 1 Condition (PHC)
- 4 Events (1 PHEC MedicationAdmin + 2 PHC MedicationAdmin + 1 PHC ImagingStudy)
- **Total: 25 items**

**R2 Section:**
- 0 Vitals
- 0 Conditions  
- 3 Events (1 ImagingStudy + 1 Procedure + 1 MedicationAdministration)
- **Total: 3 items**

**Empty Sections (should show "No data available"):**
- CASEVAC, AXP, MEDEVAC, Fwd TACEVAC, Rear TACEVAC, R3, STRATEVAC ✅

### Vitals Chart Expected Behavior
- **Care stages with vitals:** POI, R1 only
- **R2 has NO vitals** (only events/imaging)
- **Chart is CORRECT** showing only POI and R1 ✅

### Conclusion
- **Vitals chart behavior: CORRECT** ✅
- **R2 missing from chart: EXPECTED** (has no Observations) ✅
- **Issue #1 (chart) is NOT A BUG** ✅

### Remaining Issues to Investigate
1. **"Not all code items displaying"** - Need user to specify which specific items are missing
2. **Vitals "click to open" not working** - Real bug, needs fix

Run analysis: `node test-preset1-analysis.mjs`
