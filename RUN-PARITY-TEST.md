# Round-Trip Parity Test Instructions

## Quick Test

1. Open browser: http://127.0.0.1:53576/nfc/ips/viewer.html
2. Open DevTools Console (F12)
3. Run:

```javascript
await runAllValidationTests()
```

This will test all 3 presets and show differences.

## Detailed Analysis for Single Preset

```javascript
// Initialize
await window.pipelineValidator.init();

// Run test for preset #1
const result = await window.pipelineValidator.runTest('ips-fhir-json-1.json');

// Get original and reconstructed FHIR
const orig = await window.pipelineValidator.storage.getStage(result.testId, 'input_fhir');
const recon = await window.pipelineValidator.storage.getStage(result.testId, 'fhir_reconstruction');

// Compare
const diffs = window.pipelineValidator.deepCompare(orig.data, recon.data);

// Show results
console.log(`Character count - Original: ${JSON.stringify(orig.data, null, 2).length}`);
console.log(`Character count - Reconstructed: ${JSON.stringify(recon.data, null, 2).length}`);
console.log(`Total differences: ${diffs.length}`);
if (diffs.length > 0) {
    console.table(diffs.slice(0, 20));
}
```

## Export Results to Files

```javascript
// After running test above
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

// Download original
downloadJSON(orig.data, 'original-fhir.json');

// Download reconstructed
downloadJSON(recon.data, 'reconstructed-fhir.json');

// Download differences
downloadJSON(diffs, 'differences.json');
```

## What to Look For

### Expected Differences (Acceptable)
- `Bundle.meta.lastUpdated` - Regenerated timestamp
- Possible field ordering changes

### Unexpected Differences (Bugs)
- Missing resources
- Different resource IDs
- Lost clinical data (vitals, conditions, events)
- Lost patient demographics

## Automated Test

The validation framework will:
1. Load preset FHIR
2. Convert: FHIR → CodeRef
3. Encode: CodeRef → Protobuf → Base64 → Fragment
4. Decode: Fragment → Base64 → Protobuf → CodeRef
5. Convert: CodeRef → FHIR (reconstructed)
6. Compare original vs reconstructed
7. Report all differences

All stages are saved to IndexedDB for inspection.
