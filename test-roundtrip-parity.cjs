/**
 * Round-Trip Parity Test - Node.js Backend
 * Tests: FHIR → CodeRef → Protobuf → Fragment → Protobuf → CodeRef → FHIR
 * Compares original vs reconstructed FHIR to verify lossless conversion
 */

const fs = require('fs');
const path = require('path');

// Load the original FHIR preset
const originalFhir = JSON.parse(fs.readFileSync('ips-fhir-json-1.json', 'utf8'));

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 NFC IPS ROUND-TRIP PARITY TEST');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📁 Loading FHIR Bundle: ips-fhir-json-1.json');
console.log(`   Resource Type: ${originalFhir.resourceType}`);
console.log(`   ID: ${originalFhir.id}`);
console.log(`   Entries: ${originalFhir.entry?.length || 0}`);
console.log(`   Character Count: ${JSON.stringify(originalFhir, null, 2).length}\n`);

// Create output directory
const outputDir = './validation-results';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Save original FHIR
fs.writeFileSync(
    path.join(outputDir, '1-original-fhir.json'),
    JSON.stringify(originalFhir, null, 2)
);
console.log('💾 Saved: 1-original-fhir.json\n');

console.log('⚠️  Browser-based codec required for full pipeline test');
console.log('   The conversion functions use protobuf.js and pako which');
console.log('   are loaded in the browser context.\n');

console.log('📋 ANALYSIS OF CHARACTER COUNT PARITY:\n');

// Analyze what COULD cause same character count
console.log('Possible reasons for identical character counts:');
console.log('1. ✅ Lossless reconstruction working perfectly');
console.log('2. ⚠️  Timestamp regeneration produces same-length string');
console.log('3. ⚠️  Data is being cached/copied instead of converted');
console.log('4. ⚠️  JSON.stringify formatting matches exactly\n');

console.log('🔍 CHECKING KNOWN LOSSY FIELDS:\n');

// Check Bundle metadata
console.log('Bundle.meta.lastUpdated:');
console.log(`   Original: ${originalFhir.meta?.lastUpdated || 'N/A'}`);
console.log('   Reconstructed: [Would be new Date().toISOString()]');
console.log('   Expected: DIFFERENT (timestamp regenerated)\n');

console.log('Bundle.timestamp:');
console.log(`   Original: ${originalFhir.timestamp || 'N/A'}`);
console.log('   Reconstructed: [Should be preserved from CodeRef.t]');
console.log('   Expected: SAME (if metadata preserved)\n');

// Check for resource IDs
const patientEntry = originalFhir.entry?.find(e => e.resource?.resourceType === 'Patient');
if (patientEntry) {
    console.log('Patient.id:');
    console.log(`   Original: ${patientEntry.resource.id || 'N/A'}`);
    console.log('   Reconstructed: [Should be preserved]');
    console.log('   Expected: SAME (Phase 2 preservation)\n');
}

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RECOMMENDATION');
console.log('═══════════════════════════════════════════════════════\n');

console.log('To verify true parity, we need to:');
console.log('1. Load the existing validation framework in browser');
console.log('2. Run: await window.pipelineValidator.runTest("ips-fhir-json-1.json")');
console.log('3. Extract stages from IndexedDB');
console.log('4. Compare input_fhir vs fhir_reconstruction\n');

console.log('OR use the existing test files:');
console.log('   • validation-framework.js (already exists)');
console.log('   • run-validation-tests.js (already exists)\n');

console.log('Run in browser console:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('await window.pipelineValidator.init();');
console.log('const result = await window.pipelineValidator.runTest("ips-fhir-json-1.json");');
console.log('const orig = await window.pipelineValidator.storage.getStage(result.testId, "input_fhir");');
console.log('const recon = await window.pipelineValidator.storage.getStage(result.testId, "fhir_reconstruction");');
console.log('const diffs = window.pipelineValidator.deepCompare(orig.data, recon.data);');
console.log('console.log("Differences:", diffs);');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ Analysis complete - Use browser-based validation for full test\n');
