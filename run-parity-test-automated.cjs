/**
 * Automated Round-Trip Parity Test using Puppeteer
 * Tests Preset #1: FHIR → CodeRef → Protobuf → Fragment → FHIR
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const SERVER_URL = 'http://127.0.0.1:53576/nfc/ips/viewer.html';
const OUTPUT_DIR = './validation-results';

async function runParityTest() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 ROUND-TRIP PARITY TEST - PRESET #1');
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Capture console output
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            if (text.includes('✅') || text.includes('❌') || text.includes('TEST')) {
                console.log(text);
            }
        });

        console.log(`📡 Loading: ${SERVER_URL}\n`);
        await page.goto(SERVER_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('⏳ Waiting for frameworks to load...\n');

        // Debug: Check what's actually available
        const availableGlobals = await page.evaluate(() => {
            return {
                pipelineValidator: typeof window.pipelineValidator,
                codecPipeline: typeof window.codecPipeline,
                payloadService: typeof window.payloadService,
                viewModelBuilder: typeof window.viewModelBuilder
            };
        });
        console.log('Available globals:', availableGlobals);

        await page.waitForFunction(() => {
            return window.pipelineValidator;
        }, { timeout: 30000 });

        console.log('✅ Frameworks loaded\n');
        console.log('🔄 Running validation test...\n');

        // Run the validation test
        const results = await page.evaluate(async () => {
            await window.pipelineValidator.init();
            const result = await window.pipelineValidator.runTest('ips-fhir-json-1.json');

            const orig = await window.pipelineValidator.storage.getStage(result.testId, 'input_fhir');
            const recon = await window.pipelineValidator.storage.getStage(result.testId, 'fhir_reconstruction');

            const origStr = JSON.stringify(orig.data, null, 2);
            const reconStr = JSON.stringify(recon.data, null, 2);

            const diffs = window.pipelineValidator.deepCompare(orig.data, recon.data);

            return {
                testId: result.testId,
                originalChars: origStr.length,
                reconstructedChars: reconStr.length,
                charDifference: reconStr.length - origStr.length,
                totalDifferences: diffs.length,
                differences: diffs,
                originalData: orig.data,
                reconstructedData: recon.data
            };
        });

        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 RESULTS');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log(`Test ID: ${results.testId}\n`);

        console.log('CHARACTER COUNTS:');
        console.log(`  Original FHIR:       ${results.originalChars} chars`);
        console.log(`  Reconstructed FHIR:  ${results.reconstructedChars} chars`);
        console.log(`  Difference:          ${results.charDifference} chars\n`);

        if (results.charDifference === 0) {
            console.log('✅ Character counts match exactly!\n');
        } else {
            console.log(`⚠️  Character counts differ by ${results.charDifference} chars\n`);
        }

        console.log(`FIELD-BY-FIELD COMPARISON:`);
        console.log(`  Total differences: ${results.totalDifferences}\n`);

        if (results.totalDifferences === 0) {
            console.log('✅ PERFECT ROUND-TRIP: Lossless reconstruction achieved!\n');
        } else {
            console.log(`⚠️  Found ${results.totalDifferences} differences:\n`);

            // Group differences by category
            const categories = {
                metadata: [],
                patient: [],
                resources: [],
                other: []
            };

            results.differences.forEach(diff => {
                if (diff.path.includes('meta.lastUpdated')) {
                    categories.metadata.push(diff);
                } else if (diff.path.includes('patient')) {
                    categories.patient.push(diff);
                } else if (diff.path.includes('entry')) {
                    categories.resources.push(diff);
                } else {
                    categories.other.push(diff);
                }
            });

            console.log('DIFFERENCE BREAKDOWN:');
            console.log(`  Metadata: ${categories.metadata.length}`);
            console.log(`  Patient: ${categories.patient.length}`);
            console.log(`  Resources: ${categories.resources.length}`);
            console.log(`  Other: ${categories.other.length}\n`);

            console.log('FIRST 10 DIFFERENCES:\n');
            results.differences.slice(0, 10).forEach((diff, i) => {
                console.log(`${i + 1}. Path: ${diff.path}`);
                console.log(`   Issue: ${diff.issue}`);
                console.log(`   Original:      ${JSON.stringify(diff.original).substring(0, 80)}`);
                console.log(`   Reconstructed: ${JSON.stringify(diff.reconstructed).substring(0, 80)}\n`);
            });

            if (results.totalDifferences > 10) {
                console.log(`   ... and ${results.totalDifferences - 10} more differences\n`);
            }
        }

        // Save detailed results
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        fs.writeFileSync(
            `${OUTPUT_DIR}/original-fhir.json`,
            JSON.stringify(results.originalData, null, 2)
        );

        fs.writeFileSync(
            `${OUTPUT_DIR}/reconstructed-fhir.json`,
            JSON.stringify(results.reconstructedData, null, 2)
        );

        fs.writeFileSync(
            `${OUTPUT_DIR}/differences.json`,
            JSON.stringify(results.differences, null, 2)
        );

        fs.writeFileSync(
            `${OUTPUT_DIR}/test-report.json`,
            JSON.stringify({
                testId: results.testId,
                timestamp: new Date().toISOString(),
                summary: {
                    originalChars: results.originalChars,
                    reconstructedChars: results.reconstructedChars,
                    charDifference: results.charDifference,
                    totalDifferences: results.totalDifferences
                },
                differences: results.differences
            }, null, 2)
        );

        console.log('═══════════════════════════════════════════════════════');
        console.log('💾 FILES SAVED');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log(`  ${OUTPUT_DIR}/original-fhir.json`);
        console.log(`  ${OUTPUT_DIR}/reconstructed-fhir.json`);
        console.log(`  ${OUTPUT_DIR}/differences.json`);
        console.log(`  ${OUTPUT_DIR}/test-report.json\n`);

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ TEST COMPLETE');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

runParityTest().catch(console.error);
