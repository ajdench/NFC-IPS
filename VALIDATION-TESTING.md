# Pipeline Validation Testing Guide

## Overview
Comprehensive validation framework that tests the entire FHIR → CodeRef → Protobuf → Base64 → Display pipeline and validates perfect round-trip reconstruction.

## Architecture

### Storage (IndexedDB)
- **Database**: `NFC_IPS_Validation`
- **Stores**:
  - `stages`: All pipeline stage snapshots
  - `testRuns`: Test execution metadata

### Pipeline Stages Validated
1. **input_fhir** - Original FHIR Bundle loaded
2. **coderef_conversion** - FHIR → CodeRef transformation
3. **protobuf_encode** - CodeRef → Protobuf binary
4. **base64_encode** - Protobuf → Base64 string
5. **compressed** - Protobuf compressed with pako
6. **base64_decode** - Base64 → Protobuf binary
7. **protobuf_decode** - Protobuf → CodeRef
8. **coderef_result** - Decoded CodeRef
9. **fhir_reconstruction** - CodeRef → FHIR Bundle
10. **display_data** - FHIR → Display model

### Validation Rules
- **Deep equality** with semantic equivalence
- **Date format variation** allowed (ISO8601 variants)
- **Numeric type coercion** allowed (string "123" = number 123)
- **Ignored fields**: `id`, `meta.lastUpdated`, `timestamp` (can legitimately change)
- **Byte-perfect** comparison for binary data (Protobuf buffers)

### Error Handling
- **Halt on first failure**
- **Detailed diff reporting** (up to 10 differences shown in console)
- **Full diffs saved** to IndexedDB for analysis
- **JSON export** available for debugging

## Running Tests

### Method 1: Auto-run on Page Load
1. Open browser: http://127.0.0.1:49619/nfc/ips/viewer.html
2. Open DevTools Console (F12)
3. Wait for message: "Validation framework ready"
4. Run: `await runAllValidationTests()`

### Method 2: Individual Preset
```javascript
// Initialize
await window.pipelineValidator.init();

// Test specific preset
await window.pipelineValidator.runTest('ips-fhir-json-1.json');
await window.pipelineValidator.runTest('ips-fhir-json-2.json');
await window.pipelineValidator.runTest('ips-fhir-json-3.json');
```

### Method 3: Manual Stage Inspection
```javascript
// Get all stages for a test
const testId = 'test_1234567890_ips-fhir-json-1.json';
const stages = await window.pipelineValidator.storage.getAllStages(testId);

// Get specific stage
const fhirStage = await window.pipelineValidator.storage.getStage(testId, 'input_fhir');
const reconstructed = await window.pipelineValidator.storage.getStage(testId, 'fhir_reconstruction');

// Compare manually
console.log(fhirStage.data);
console.log(reconstructed.data);
```

## Expected Output

### Success
```
═══════════════════════════════════════════════════════
🧪 NFC IPS PIPELINE VALIDATION TEST SUITE
═══════════════════════════════════════════════════════

✅ Validation framework initialized

🧪 Starting validation test: ips-fhir-json-1.json
   Test ID: test_1234567890_ips-fhir-json-1.json

  📦 Stage: input_fhir - {"entryCount":53,"resourceTypes":{...}}
  📦 Stage: coderef_conversion - {"hasPatient":true,"stages":[...]}
  ...

🔍 Running deep comparisons...

✅ FHIR reconstruction: Perfect match
✅ CodeRef round-trip: Perfect match
✅ Protobuf round-trip: Byte-perfect match

✅✅✅ TEST PASSED: ips-fhir-json-1.json

[Repeat for presets 2 & 3]

═══════════════════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════════════════

✅ ips-fhir-json-1.json: PASSED
✅ ips-fhir-json-2.json: PASSED
✅ ips-fhir-json-3.json: PASSED

📈 Results: 3 passed, 0 failed out of 3 tests

✅ ALL TESTS PASSED - Pipeline is working correctly!
```

### Failure Example
```
❌ VALIDATION FAILED at stage: fhir_reconstruction
   Found 5 differences:

   1. entry[0].resource.name[0].prefix: missing in reconstructed
      Original: ["Sgt"]
      Reconstructed: undefined

   2. entry[12].resource.bodySite[0].text: value mismatch
      Original: "Left leg, distal femur"
      Reconstructed: "Left leg"

   ... and 3 more differences

❌ TEST FAILED: Validation failed at fhir_reconstruction: 5 differences found

❌ Stopping tests due to failure in ips-fhir-json-1.json

❌ VALIDATION FAILED - Fix errors and re-run tests
   View detailed diffs in IndexedDB: NFC_IPS_Validation database
```

## Inspecting Failures

### View in Browser DevTools
1. Open DevTools → Application tab
2. IndexedDB → NFC_IPS_Validation
3. Open "stages" store
4. Find entries with `stageName: "fhir_reconstruction_diff"`
5. Inspect `data.differences` array

### Export for Analysis
```javascript
// Get failed test stages
const testId = 'test_1234567890_ips-fhir-json-1.json';
const allStages = await window.pipelineValidator.storage.getAllStages(testId);

// Export to JSON
const json = JSON.stringify(allStages, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `validation-stages-${testId}.json`;
a.click();
```

## Fixing Errors - Iterative Process

1. **Run Test** → Identify first failure
2. **Review Diff** → Understand what's missing/wrong
3. **Fix Converter** → Update `convertXToCodeRef` or `convertCodeRefToFhir` functions
4. **Clear Test Data**:
   ```javascript
   await window.pipelineValidator.storage.clearTest(testId);
   ```
5. **Re-run Test** → Verify fix
6. **Repeat** until all 3 presets pass

## Common Issues & Fixes

### Missing Patient Extensions
**Error**: `patient.rank: missing in reconstructed`
**Fix**: Update `convertCodeRefPatientToFhir` to include rank/service/nationality

### Condition bodySite Lost
**Error**: `entry[X].resource.bodySite: missing in reconstructed`
**Fix**: Update `convertCodeRefConditionToFhir` to restore bodySite from CodeRef

### Procedure Notes Missing
**Error**: `entry[X].resource.note: missing in reconstructed`
**Fix**: Update `convertCodeRefProcedureToFhir` to convert `dose` field back to `note`

### Laboratory Observations Lost
**Error**: `entry[X].resource.category: wrong value`
**Fix**: Ensure `category: 'laboratory'` preserved in CodeRef and restored in FHIR

## Files Modified

### New Files
- `validation-framework.js` - Core validation framework
- `run-validation-tests.js` - Test runner
- `VALIDATION-TESTING.md` - This documentation

### Modified Files
- `nfc/ips/viewer.html` - Added validation scripts
- `script.js` - All CodeRef converters (already updated)

## Next Steps

1. **Run tests in browser**
2. **Document first failure**
3. **Fix in script.js**
4. **Re-run until clean**
5. **Repeat for all 3 presets**
6. **Update memory system with results**
