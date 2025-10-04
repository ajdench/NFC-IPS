/**
 * Automated Round-Trip Validation Test
 * Runs validation framework via browser automation
 * Captures all stage snapshots and generates comparison report
 */

const fs = require('fs');
const puppeteer = require('puppeteer');

const SERVER_URL = 'http://127.0.0.1:53576/nfc/ips/viewer.html';
const OUTPUT_DIR = './validation-results';

async function runValidationTest() {
    console.log('🚀 Starting automated round-trip validation test...\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Enable console logging from browser
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('✅') || text.includes('❌') || text.includes('═')) {
                console.log(text);
            }
        });

        console.log(`📡 Loading page: ${SERVER_URL}`);
        await page.goto(SERVER_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for validation framework to load
        console.log('⏳ Waiting for validation framework...');
        await page.waitForFunction(() => {
            return window.pipelineValidator && window.codecPipeline && window.viewModelBuilder;
        }, { timeout: 10000 });

        console.log('✅ Validation framework loaded\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🧪 RUNNING VALIDATION TESTS');
        console.log('═══════════════════════════════════════════════════════\n');

        // Run validation tests
        const results = await page.evaluate(async () => {
            await window.pipelineValidator.init();

            const preset = 'ips-fhir-json-1.json';
            const testResult = await window.pipelineValidator.runTest(preset);

            // Extract stage data from IndexedDB
            const testId = testResult.testId;
            const stages = await window.pipelineValidator.storage.getAllStages(testId);

            return {
                testId,
                status: testResult.status,
                stages: stages.map(s => ({
                    stageName: s.stageName,
                    timestamp: s.timestamp,
                    dataSize: JSON.stringify(s.data).length
                })),
                fullStageData: stages
            };
        });

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 TEST RESULTS');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log(`Test ID: ${results.testId}`);
        console.log(`Status: ${results.status}\n`);

        console.log('Pipeline Stages:');
        results.stages.forEach(stage => {
            console.log(`  ${stage.stageName}: ${stage.dataSize} characters`);
        });

        // Save all stages to files
        console.log(`\n💾 Saving stage data to ${OUTPUT_DIR}/...\n`);

        results.fullStageData.forEach(stage => {
            const filename = `${OUTPUT_DIR}/${stage.stageName}.json`;
            fs.writeFileSync(filename, JSON.stringify(stage.data, null, 2));
            console.log(`  ✓ ${stage.stageName}.json`);
        });

        // Compare original FHIR with reconstructed FHIR
        const originalFhir = results.fullStageData.find(s => s.stageName === 'input_fhir');
        const reconstructedFhir = results.fullStageData.find(s => s.stageName === 'fhir_reconstruction');

        if (originalFhir && reconstructedFhir) {
            console.log('\n═══════════════════════════════════════════════════════');
            console.log('🔍 ROUND-TRIP COMPARISON');
            console.log('═══════════════════════════════════════════════════════\n');

            const origStr = JSON.stringify(originalFhir.data, null, 2);
            const reconStr = JSON.stringify(reconstructedFhir.data, null, 2);

            console.log(`Original FHIR:       ${origStr.length} characters`);
            console.log(`Reconstructed FHIR:  ${reconStr.length} characters`);
            console.log(`Character diff:      ${reconStr.length - origStr.length}\n`);

            // Deep comparison
            const differences = await page.evaluate((orig, recon) => {
                return window.pipelineValidator.deepCompare(orig, recon);
            }, originalFhir.data, reconstructedFhir.data);

            if (differences.length === 0) {
                console.log('✅ PERFECT ROUND-TRIP: No differences found!\n');
            } else {
                console.log(`⚠️  Found ${differences.length} differences:\n`);
                differences.slice(0, 10).forEach(diff => {
                    console.log(`  Path: ${diff.path}`);
                    console.log(`    Original:      ${JSON.stringify(diff.original)}`);
                    console.log(`    Reconstructed: ${JSON.stringify(diff.reconstructed)}`);
                    console.log(`    Issue: ${diff.issue}\n`);
                });

                if (differences.length > 10) {
                    console.log(`  ... and ${differences.length - 10} more differences\n`);
                }

                // Save full diff report
                const diffReport = {
                    summary: {
                        totalDifferences: differences.length,
                        originalSize: origStr.length,
                        reconstructedSize: reconStr.length
                    },
                    differences
                };

                fs.writeFileSync(`${OUTPUT_DIR}/diff-report.json`, JSON.stringify(diffReport, null, 2));
                console.log(`💾 Full diff report saved to: ${OUTPUT_DIR}/diff-report.json\n`);
            }
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ VALIDATION TEST COMPLETE');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
    }
}

// Run the test
runValidationTest().catch(console.error);
