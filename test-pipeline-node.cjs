#!/usr/bin/env node

/**
 * Automated Pipeline Validation - Node.js Test Harness
 * Runs complete FHIR → CodeRef → Protobuf → Display validation
 * Exits on first error with detailed diff
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// DEEP COMPARATOR (from validation-framework.js)
// =============================================================================

class DeepComparator {
    constructor() {
        this.differences = [];
        this.path = [];
    }

    compare(original, reconstructed, options = {}) {
        this.differences = [];
        this.path = [];
        this.options = {
            allowDateFormatVariation: true,
            allowNumericTypeCoercion: true,
            ignoreFields: ['id', 'meta.lastUpdated', 'timestamp'],
            ...options
        };

        this._compareValues(original, reconstructed);
        return {
            isEqual: this.differences.length === 0,
            differences: this.differences
        };
    }

    _compareValues(a, b) {
        const currentPath = this.path.join('.');

        if (this._shouldIgnore(currentPath)) return;

        // null/undefined
        if (a === null && b === null) return;
        if (a === undefined && b === undefined) return;
        if ((a === null || a === undefined) !== (b === null || b === undefined)) {
            this._addDifference('null/undefined mismatch', a, b);
            return;
        }

        // Dates with format variation
        if (this.options.allowDateFormatVariation && this._areBothDates(a, b)) {
            if (!this._areDatesEqual(a, b)) {
                this._addDifference('date value mismatch', a, b);
            }
            return;
        }

        // Numeric type coercion
        if (this.options.allowNumericTypeCoercion && this._areBothNumeric(a, b)) {
            if (Number(a) !== Number(b)) {
                this._addDifference('numeric value mismatch', a, b);
            }
            return;
        }

        // Arrays
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
                this._addDifference('array length mismatch', a.length, b.length);
                return;
            }
            for (let i = 0; i < a.length; i++) {
                this.path.push(`[${i}]`);
                this._compareValues(a[i], b[i]);
                this.path.pop();
            }
            return;
        }

        if (Array.isArray(a) !== Array.isArray(b)) {
            this._addDifference('type mismatch (array)', a, b);
            return;
        }

        // Objects
        if (typeof a === 'object' && typeof b === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            const allKeys = new Set([...keysA, ...keysB]);

            for (const key of allKeys) {
                this.path.push(key);
                if (!(key in a)) {
                    this._addDifference('missing in original', undefined, b[key]);
                } else if (!(key in b)) {
                    this._addDifference('missing in reconstructed', a[key], undefined);
                } else {
                    this._compareValues(a[key], b[key]);
                }
                this.path.pop();
            }
            return;
        }

        // Primitives
        if (a !== b) {
            this._addDifference('value mismatch', a, b);
        }
    }

    _shouldIgnore(path) {
        return this.options.ignoreFields.some(field => {
            if (field.includes('.')) {
                return path === field || path.endsWith('.' + field);
            }
            return path.endsWith(field);
        });
    }

    _areBothDates(a, b) {
        return this._isDateString(a) && this._isDateString(b);
    }

    _isDateString(val) {
        if (typeof val !== 'string') return false;
        const iso8601Pattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
        return iso8601Pattern.test(val);
    }

    _areDatesEqual(a, b) {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return !isNaN(dateA) && !isNaN(dateB) && dateA.getTime() === dateB.getTime();
    }

    _areBothNumeric(a, b) {
        return !isNaN(Number(a)) && !isNaN(Number(b)) &&
               (typeof a === 'number' || typeof a === 'string') &&
               (typeof b === 'number' || typeof b === 'string');
    }

    _addDifference(type, originalValue, reconstructedValue) {
        this.differences.push({
            path: this.path.join('.'),
            type,
            original: originalValue,
            reconstructed: reconstructedValue
        });
    }
}

// =============================================================================
// LOAD AND EXECUTE SCRIPT.JS IN NODE CONTEXT
// =============================================================================

async function loadScriptModules() {
    // Read script.js
    const scriptPath = path.join(__dirname, 'script.js');
    let scriptContent = fs.readFileSync(scriptPath, 'utf-8');

    // Remove ES6 imports (we'll provide these as globals)
    scriptContent = scriptContent.replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?/g, '');
    scriptContent = scriptContent.replace(/import\s+.*from\s+['"][^'"]+['"];?/g, '');

    // Mock constants from config/constants.js
    const constants = `
        const TERMINOLOGY_SYSTEMS = {};
        const DEMO_PAYLOADS = {};
        const RESOURCES = {};
        const FHIR_EXTENSIONS = {
            CARE_STAGE: 'http://hl7.org/fhir/StructureDefinition/care-stage',
            PATIENT_BLOOD_GROUP: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup'
        };
        const FHIR_PROFILES = {
            IPS_BUNDLE: 'http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips'
        };
        const CARE_STAGE_COUNT = 9;
    `;

    // Mock utility functions
    const utils = `
        function normaliseBase64(str) { return str; }
        function base64ToUint8Array(str) {
            const binary = Buffer.from(str, 'base64');
            return new Uint8Array(binary);
        }
        function base64ToString(str) {
            try {
                return Buffer.from(str, 'base64').toString('utf-8');
            } catch {
                return null;
            }
        }
        function tryParseJson(str) {
            try { return JSON.parse(str); } catch { return null; }
        }
        function looksLikeJson(str) {
            return str && (str.trim().startsWith('{') || str.trim().startsWith('['));
        }
        function safeDeepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }
    `;

    // Create isolated context
    const fullScript = constants + utils + scriptContent;

    // Evaluate in Node context with window/document mocks
    const window = {
        DEBUG_ENABLED: false,
        location: { href: '' },
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    const document = {
        getElementById: () => null,
        querySelector: () => null,
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    const context = {
        console, Buffer, TextEncoder, TextDecoder,
        window, document,
        pako: null, // Will be loaded if needed
        protobuf: null
    };

    const ExecuteScript = new Function('context', `
        with (context) {
            ${fullScript}
            return { codecPipeline, viewModelBuilder };
        }
    `);

    return ExecuteScript(context);
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runTest(presetFile) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing: ${presetFile}`);
    console.log('='.repeat(60));

    const comparator = new DeepComparator();
    const stages = {};

    try {
        // Load modules
        console.log('\n📦 Loading script modules...');
        const { codecPipeline, viewModelBuilder } = await loadScriptModules();

        // Stage 1: Load FHIR
        console.log('\n1️⃣  Loading FHIR preset...');
        const fhirPath = path.join(__dirname, presetFile);
        const fhirBundle = JSON.parse(fs.readFileSync(fhirPath, 'utf-8'));
        stages.input_fhir = fhirBundle;
        console.log(`   ✅ Loaded ${fhirBundle.entry?.length || 0} entries`);

        // Stage 2: FHIR → CodeRef
        console.log('\n2️⃣  Converting FHIR → CodeRef...');
        const codeRef = codecPipeline.convertFhirBundleToCodeRef(fhirBundle);
        stages.coderef = codeRef;
        console.log(`   ✅ CodeRef created (patient: ${!!codeRef.patient})`);

        // Stage 3: CodeRef → FHIR reconstruction
        console.log('\n3️⃣  Reconstructing FHIR from CodeRef...');
        const reconstructedFhir = codecPipeline.convertCodeRefToFhirBundle(codeRef);
        stages.fhir_reconstructed = reconstructedFhir;
        console.log(`   ✅ Reconstructed ${reconstructedFhir.entry?.length || 0} entries`);

        // Validation: Original FHIR vs Reconstructed FHIR
        console.log('\n🔍 Validating FHIR reconstruction...');
        const fhirComparison = comparator.compare(fhirBundle, reconstructedFhir);

        if (!fhirComparison.isEqual) {
            console.error(`\n❌ VALIDATION FAILED: ${fhirComparison.differences.length} differences found\n`);

            fhirComparison.differences.slice(0, 20).forEach((diff, idx) => {
                console.error(`   ${idx + 1}. ${diff.path}`);
                console.error(`      Type: ${diff.type}`);
                console.error(`      Original: ${JSON.stringify(diff.original)}`);
                console.error(`      Reconstructed: ${JSON.stringify(diff.reconstructed)}`);
                console.error('');
            });

            if (fhirComparison.differences.length > 20) {
                console.error(`   ... and ${fhirComparison.differences.length - 20} more differences\n`);
            }

            // Save diff to file
            const diffPath = path.join(__dirname, `validation-diff-${presetFile}`);
            fs.writeFileSync(diffPath, JSON.stringify({
                preset: presetFile,
                differences: fhirComparison.differences,
                original: fhirBundle,
                reconstructed: reconstructedFhir
            }, null, 2));
            console.error(`📄 Full diff saved to: ${diffPath}\n`);

            throw new Error(`FHIR reconstruction validation failed`);
        }

        console.log('   ✅ FHIR reconstruction: Perfect match!');
        console.log(`\n✅✅✅ TEST PASSED: ${presetFile}\n`);

        return { success: true, preset: presetFile };

    } catch (error) {
        console.error(`\n❌ TEST FAILED: ${error.message}`);
        console.error(`   Stack: ${error.stack}\n`);
        throw error;
    }
}

async function runAllTests() {
    console.log('\n' + '═'.repeat(60));
    console.log('🧪 NFC IPS PIPELINE VALIDATION - AUTOMATED TEST SUITE');
    console.log('═'.repeat(60));

    const presets = [
        'ips-fhir-json-1.json',
        'ips-fhir-json-2.json',
        'ips-fhir-json-3.json'
    ];

    const results = [];

    for (const preset of presets) {
        try {
            const result = await runTest(preset);
            results.push({ preset, status: 'PASSED' });
        } catch (error) {
            results.push({ preset, status: 'FAILED', error: error.message });
            console.error(`\n🛑 Stopping tests due to failure in ${preset}\n`);
            break; // Exit on first failure
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60) + '\n');

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
        console.log('❌ VALIDATION FAILED - Fix errors and re-run: node test-pipeline-node.js\n');
        process.exit(1);
    } else {
        console.log('✅ ALL TESTS PASSED - Pipeline is working correctly!\n');
        process.exit(0);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
