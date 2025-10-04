/**
 * Round-trip verification test
 * Compares original FHIR with encoded→decoded FHIR to identify differences
 */

const fs = require('fs');

// Load the original FHIR
const originalFhir = JSON.parse(fs.readFileSync('ips-fhir-json-1.json', 'utf8'));

// Simulate the encoding→decoding pipeline
// Note: This requires running the actual codec functions from script.js
// For now, we'll just do a deep comparison structure

function deepCompare(obj1, obj2, path = '') {
    const differences = [];

    // Check if types match
    if (typeof obj1 !== typeof obj2) {
        differences.push({
            path,
            original: typeof obj1,
            reconstructed: typeof obj2,
            issue: 'Type mismatch'
        });
        return differences;
    }

    // Handle null
    if (obj1 === null || obj2 === null) {
        if (obj1 !== obj2) {
            differences.push({
                path,
                original: obj1,
                reconstructed: obj2,
                issue: 'Null mismatch'
            });
        }
        return differences;
    }

    // Handle arrays
    if (Array.isArray(obj1)) {
        if (obj1.length !== obj2.length) {
            differences.push({
                path,
                original: `Array[${obj1.length}]`,
                reconstructed: `Array[${obj2.length}]`,
                issue: 'Array length mismatch'
            });
        }

        const maxLen = Math.max(obj1.length, obj2.length);
        for (let i = 0; i < maxLen; i++) {
            differences.push(...deepCompare(obj1[i], obj2[i], `${path}[${i}]`));
        }
        return differences;
    }

    // Handle objects
    if (typeof obj1 === 'object') {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        // Check for missing keys
        const allKeys = new Set([...keys1, ...keys2]);
        for (const key of allKeys) {
            const newPath = path ? `${path}.${key}` : key;

            if (!(key in obj1)) {
                differences.push({
                    path: newPath,
                    original: undefined,
                    reconstructed: obj2[key],
                    issue: 'Key added in reconstruction'
                });
            } else if (!(key in obj2)) {
                differences.push({
                    path: newPath,
                    original: obj1[key],
                    reconstructed: undefined,
                    issue: 'Key missing in reconstruction'
                });
            } else {
                differences.push(...deepCompare(obj1[key], obj2[key], newPath));
            }
        }
        return differences;
    }

    // Primitive comparison
    if (obj1 !== obj2) {
        differences.push({
            path,
            original: obj1,
            reconstructed: obj2,
            issue: 'Value mismatch'
        });
    }

    return differences;
}

console.log('Original FHIR structure:');
console.log(`- resourceType: ${originalFhir.resourceType}`);
console.log(`- id: ${originalFhir.id}`);
console.log(`- meta.lastUpdated: ${originalFhir.meta?.lastUpdated}`);
console.log(`- timestamp: ${originalFhir.timestamp}`);
console.log(`- entry count: ${originalFhir.entry?.length}`);
console.log(`- Total character count: ${JSON.stringify(originalFhir, null, 2).length}`);

console.log('\nTo complete this test:');
console.log('1. Load ips-fhir-json-1.json in left pane');
console.log('2. Click Encode button (produces Fragment)');
console.log('3. Copy the fragment');
console.log('4. Click Decode button (produces reconstructed FHIR in right pane)');
console.log('5. Copy the reconstructed FHIR');
console.log('6. Save both to files and compare');

console.log('\nExpected differences based on code review:');
console.log('- Bundle.meta.lastUpdated (regenerated timestamp)');
console.log('- Possible CodeRef compression losses');
console.log('- Resource ordering might differ');
