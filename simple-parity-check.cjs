/**
 * Simple Parity Check
 * Compares original vs what you see in the UI after encode→decode
 */

const fs = require('fs');

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 SIMPLE PARITY ANALYSIS - PRESET #1');
console.log('═══════════════════════════════════════════════════════\n');

const originalFhir = JSON.parse(fs.readFileSync('ips-fhir-json-1.json', 'utf8'));

const origStr = JSON.stringify(originalFhir, null, 2);

console.log('ORIGINAL FHIR:');
console.log(`  File: ips-fhir-json-1.json`);
console.log(`  Bundle ID: ${originalFhir.id}`);
console.log(`  Timestamp: ${originalFhir.timestamp}`);
console.log(`  Entries: ${originalFhir.entry?.length || 0}`);
console.log(`  Character Count: ${origStr.length}\n`);

console.log('═══════════════════════════════════════════════════════');
console.log('📋 MANUAL TEST INSTRUCTIONS');
console.log('═══════════════════════════════════════════════════════\n');

console.log('1. Open: http://127.0.0.1:53576/nfc/ips/viewer.html');
console.log('2. Load Preset #1');
console.log('3. Click "Encode" button (green)');
console.log('4. Note the character count in LEFT pane (Fragment)');
console.log('5. Click "Decode" button (green) - or just view right pane');
console.log('6. Note the character count in RIGHT pane (FHIR)\n');

console.log('EXPECTED if truly lossless:');
console.log(`  Right pane FHIR: ${origStr.length} characters (exact match)\n`);

console.log('EXPECTED if lossy (regenerated timestamps):');
console.log(`  Right pane FHIR: ~${origStr.length} characters (similar but not exact)\n`);

console.log('YOU REPORTED:');
console.log(`  Both panes show EXACTLY ${origStr.length} characters\n`);

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 ANALYSIS');
console.log('═══════════════════════════════════════════════════════\n');

console.log('If character counts are EXACTLY the same, this could mean:\n');

console.log('1. ✅ TRUE LOSSLESS RECONSTRUCTION');
console.log('   - Bundle metadata preserved perfectly');
console.log('   - Timestamps preserved (not regenerated)');
console.log('   - Resource IDs preserved');
console.log('   - Field ordering identical\n');

console.log('2. ⚠️  COINCIDENTAL MATCH');
console.log('   - Regenerated timestamp same length');
console.log('   - JSON formatting produces same char count');
console.log('   - Still possible differences in content\n');

console.log('3. ⚠️  DATA COPYING');
console.log('   - Right pane showing cached left pane data');
console.log('   - Not actually performing conversion\n');

console.log('═══════════════════════════════════════════════════════');
console.log('🎯 NEXT STEPS');
console.log('═══════════════════════════════════════════════════════\n');

console.log('To verify TRUE parity, save both FHIRs and compare:\n');

console.log('In browser console after encode→decode:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
// Get left pane original
const leftFhir = document.getElementById('left-input').textContent;

// Get right pane reconstructed
const rightFhir = document.getElementById('right-input').textContent;

// Download both
function download(content, name) {
    const blob = new Blob([content], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
}

download(leftFhir, 'left-original.json');
download(rightFhir, 'right-reconstructed.json');

// Quick comparison
console.log('Left chars:', leftFhir.length);
console.log('Right chars:', rightFhir.length);
console.log('Match:', leftFhir === rightFhir);
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Then run: diff -u left-original.json right-reconstructed.json\n');

console.log('✅ This will show EXACTLY what differs (if anything)\n');
