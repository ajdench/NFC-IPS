/**
 * Headless Validation Test Runner
 * Loads the viewer page and executes validation tests programmatically
 */

const { execSync } = require('child_process');
const fs = require('fs');

const SERVER_URL = 'http://127.0.0.1:53576/nfc/ips/viewer.html';

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 ROUND-TRIP PARITY TEST - PRESET #1');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📡 Loading validation framework from browser...\n');

// Create a minimal HTML page that loads the viewer and runs tests
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <script src="resources/vendor/pako.min.js"></script>
    <script src="resources/vendor/protobuf.min.js"></script>
    <script src="validation-framework.js"></script>
</head>
<body>
<script>
(async () => {
    try {
        // Load script.js functions (they need to be available globally)
        const scriptContent = await fetch('script.js').then(r => r.text());
        eval(scriptContent);

        // Wait for codecPipeline to be available
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Load original FHIR
        const originalFhir = await fetch('ips-fhir-json-1.json').then(r => r.json());

        console.log('Original FHIR loaded:', Object.keys(originalFhir));
        console.log('Entries:', originalFhir.entry?.length);

        // Run encoding pipeline
        const codeRef = window.codecPipeline.convertFhirBundleToCodeRef(originalFhir);
        const protobuf = await window.codecPipeline.getProtobufBinary(codeRef);
        const fragment = await window.codecPipeline.encodeToFragment(originalFhir);

        console.log('Encoded successfully');
        console.log('Fragment length:', fragment.length);

        // Run decoding pipeline
        const decoded = await window.payloadService.parseUserInput(fragment);
        const reconstructedFhir = window.codecPipeline.convertCodeRefToFhirBundle(decoded.rawPayload);

        console.log('Decoded successfully');
        console.log('Reconstructed entries:', reconstructedFhir.entry?.length);

        // Compare
        const origStr = JSON.stringify(originalFhir, null, 2);
        const reconStr = JSON.stringify(reconstructedFhir, null, 2);

        console.log('RESULTS:');
        console.log('Original chars:', origStr.length);
        console.log('Reconstructed chars:', reconStr.length);
        console.log('Difference:', reconStr.length - origStr.length);

        // Simple field comparison
        const origFields = Object.keys(originalFhir);
        const reconFields = Object.keys(reconstructedFhir);
        console.log('Original fields:', origFields);
        console.log('Reconstructed fields:', reconFields);

    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error.stack);
    }
})();
</script>
</body>
</html>
`;

fs.writeFileSync('test-validation-temp.html', testHTML);

console.log('⚠️  Cannot run headless test without puppeteer/playwright');
console.log('   The codec functions require browser environment (protobuf.js, pako)\n');

console.log('═══════════════════════════════════════════════════════');
console.log('📋 ALTERNATIVE: MANUAL BROWSER TEST');
console.log('═══════════════════════════════════════════════════════\n');

console.log('1. Open: http://127.0.0.1:53576/nfc/ips/viewer.html');
console.log('2. Press F12 to open DevTools Console');
console.log('3. Copy and paste this code:\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
// Run validation test for Preset #1
await window.pipelineValidator.init();
const result = await window.pipelineValidator.runTest('ips-fhir-json-1.json');

// Get stages
const orig = await window.pipelineValidator.storage.getStage(result.testId, 'input_fhir');
const recon = await window.pipelineValidator.storage.getStage(result.testId, 'fhir_reconstruction');

// Character counts
const origStr = JSON.stringify(orig.data, null, 2);
const reconStr = JSON.stringify(recon.data, null, 2);
console.log('Original FHIR: ' + origStr.length + ' characters');
console.log('Reconstructed FHIR: ' + reconStr.length + ' characters');
console.log('Difference: ' + (reconStr.length - origStr.length));

// Deep comparison
const diffs = window.pipelineValidator.deepCompare(orig.data, recon.data);
console.log('\\nTotal differences: ' + diffs.length);
if (diffs.length > 0) {
    console.log('\\nFirst 10 differences:');
    diffs.slice(0, 10).forEach(d => {
        console.log('  Path: ' + d.path);
        console.log('    Original: ' + JSON.stringify(d.original));
        console.log('    Reconstructed: ' + JSON.stringify(d.reconstructed));
        console.log('');
    });
}

// Export to see in detail
function download(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

download(diffs, 'parity-differences.json');
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('This will:');
console.log('  ✓ Run full encode/decode pipeline');
console.log('  ✓ Compare original vs reconstructed FHIR');
console.log('  ✓ Show exact differences with paths');
console.log('  ✓ Download detailed diff report\n');

fs.unlinkSync('test-validation-temp.html');
