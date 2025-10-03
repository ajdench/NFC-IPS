/**
 * Test Runner for Pipeline Validation
 * Usage: Copy this into browser console after page loads
 */

async function runAllValidationTests() {
    console.clear();
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 NFC IPS PIPELINE VALIDATION TEST SUITE');
    console.log('═══════════════════════════════════════════════════════\n');

    // Initialize validator
    await window.pipelineValidator.init();

    const presets = [
        'ips-fhir-json-1.json',
        'ips-fhir-json-2.json',
        'ips-fhir-json-3.json'
    ];

    const results = [];

    for (const preset of presets) {
        try {
            const result = await window.pipelineValidator.runTest(preset);
            results.push({ preset, status: 'PASSED', result });
        } catch (error) {
            results.push({ preset, status: 'FAILED', error: error.message });
            console.error(`\n❌ Stopping tests due to failure in ${preset}`);
            break; // Exit on first failure
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    results.forEach(r => {
        const icon = r.status === 'PASSED' ? '✅' : '❌';
        console.log(`${icon} ${r.preset}: ${r.status}`);
        if (r.error) {
            console.log(`   Error: ${r.error}`);
        }
    });

    const passCount = results.filter(r => r.status === 'PASSED').length;
    const failCount = results.filter(r => r.status === 'FAILED').length;

    console.log(`\n📈 Results: ${passCount} passed, ${failCount} failed out of ${results.length} tests\n`);

    if (failCount > 0) {
        console.log('❌ VALIDATION FAILED - Fix errors and re-run tests');
        console.log('   View detailed diffs in IndexedDB: NFC_IPS_Validation database\n');
    } else {
        console.log('✅ ALL TESTS PASSED - Pipeline is working correctly!\n');
    }

    return results;
}

// Auto-run when validation framework is ready
window.addEventListener('load', async () => {
    // Wait for modules to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (window.pipelineValidator && window.codecPipeline && window.viewModelBuilder) {
        console.log('🚀 Validation framework ready. Run: await runAllValidationTests()');
    } else {
        console.warn('⚠️  Validation framework not fully loaded. Check script imports.');
    }
});
