/**
 * Extract and Compare Script
 * Run this in browser console after encode→decode to find exact differences
 */

(async function() {
    console.log('🔍 Extracting FHIR data for comparison...\n');

    const leftFhir = document.getElementById('left-input').textContent;
    const rightFhir = document.getElementById('right-input').textContent;

    const leftObj = JSON.parse(leftFhir);
    const rightObj = JSON.parse(rightFhir);

    console.log('Left (Original) FHIR:');
    console.log('  ID:', leftObj.id);
    console.log('  Timestamp:', leftObj.timestamp);
    console.log('  Meta.lastUpdated:', leftObj.meta?.lastUpdated);
    console.log('  Entries:', leftObj.entry?.length);
    console.log('  Chars:', leftFhir.length);
    console.log('');

    console.log('Right (Reconstructed) FHIR:');
    console.log('  ID:', rightObj.id);
    console.log('  Timestamp:', rightObj.timestamp);
    console.log('  Meta.lastUpdated:', rightObj.meta?.lastUpdated);
    console.log('  Entries:', rightObj.entry?.length);
    console.log('  Chars:', rightFhir.length);
    console.log('');

    // Deep comparison function
    function findDifferences(obj1, obj2, path = '', diffs = []) {
        const type1 = Array.isArray(obj1) ? 'array' : typeof obj1;
        const type2 = Array.isArray(obj2) ? 'array' : typeof obj2;

        if (type1 !== type2) {
            diffs.push({
                path,
                type: 'type_mismatch',
                left: type1,
                right: type2
            });
            return diffs;
        }

        if (obj1 === null || obj2 === null || type1 !== 'object') {
            if (obj1 !== obj2) {
                diffs.push({
                    path,
                    type: 'value_mismatch',
                    left: obj1,
                    right: obj2
                });
            }
            return diffs;
        }

        if (Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) {
                diffs.push({
                    path,
                    type: 'array_length',
                    left: obj1.length,
                    right: obj2.length
                });
            }
            const maxLen = Math.max(obj1.length, obj2.length);
            for (let i = 0; i < maxLen; i++) {
                findDifferences(obj1[i], obj2[i], `${path}[${i}]`, diffs);
            }
            return diffs;
        }

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        const allKeys = new Set([...keys1, ...keys2]);

        for (const key of allKeys) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in obj1)) {
                diffs.push({
                    path: newPath,
                    type: 'missing_in_left',
                    right: obj2[key]
                });
            } else if (!(key in obj2)) {
                diffs.push({
                    path: newPath,
                    type: 'missing_in_right',
                    left: obj1[key]
                });
            } else {
                findDifferences(obj1[key], obj2[key], newPath, diffs);
            }
        }

        return diffs;
    }

    console.log('🔄 Running deep comparison...\n');
    const differences = findDifferences(leftObj, rightObj);

    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`📊 FOUND ${differences.length} DIFFERENCES`);
    console.log(`═══════════════════════════════════════════════════════\n`);

    if (differences.length === 0) {
        console.log('✅ No differences found (perfect match)');
    } else {
        // Group by type
        const byType = {};
        differences.forEach(d => {
            byType[d.type] = byType[d.type] || [];
            byType[d.type].push(d);
        });

        console.log('Breakdown by type:');
        Object.entries(byType).forEach(([type, items]) => {
            console.log(`  ${type}: ${items.length}`);
        });
        console.log('');

        console.log('First 20 differences:\n');
        differences.slice(0, 20).forEach((diff, i) => {
            console.log(`${i + 1}. ${diff.type} at: ${diff.path}`);
            if (diff.left !== undefined) console.log(`   Left:  ${JSON.stringify(diff.left).substring(0, 100)}`);
            if (diff.right !== undefined) console.log(`   Right: ${JSON.stringify(diff.right).substring(0, 100)}`);
            console.log('');
        });

        if (differences.length > 20) {
            console.log(`... and ${differences.length - 20} more differences\n`);
        }
    }

    // Download results
    function download(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    }

    console.log('💾 Downloading files...\n');
    download(leftObj, 'left-original-fhir.json');
    download(rightObj, 'right-reconstructed-fhir.json');
    download(differences, 'fhir-differences.json');

    console.log('✅ Downloaded:');
    console.log('  - left-original-fhir.json');
    console.log('  - right-reconstructed-fhir.json');
    console.log('  - fhir-differences.json\n');

    console.log('To see diff in terminal:');
    console.log('  diff -u left-original-fhir.json right-reconstructed-fhir.json | less\n');

    return { differences, leftObj, rightObj };
})();
