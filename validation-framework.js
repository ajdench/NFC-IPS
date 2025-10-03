/**
 * Comprehensive Pipeline Validation Framework
 * Purpose: Test FHIR → CodeRef → Protobuf → Base64 → Display pipeline
 * Stores all stage snapshots in IndexedDB for deep comparison
 * Halts on first error with detailed diff reporting
 */

// =============================================================================
// INDEXEDDB STORAGE
// =============================================================================

class ValidationStorage {
    constructor() {
        this.dbName = 'NFC_IPS_Validation';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store for pipeline stages
                if (!db.objectStoreNames.contains('stages')) {
                    const stageStore = db.createObjectStore('stages', { keyPath: 'id', autoIncrement: true });
                    stageStore.createIndex('testId', 'testId', { unique: false });
                    stageStore.createIndex('stageName', 'stageName', { unique: false });
                    stageStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Store for test runs
                if (!db.objectStoreNames.contains('testRuns')) {
                    const runStore = db.createObjectStore('testRuns', { keyPath: 'testId' });
                    runStore.createIndex('presetFile', 'presetFile', { unique: false });
                    runStore.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    async saveStage(testId, stageName, data, metadata = {}) {
        const transaction = this.db.transaction(['stages'], 'readwrite');
        const store = transaction.objectStore('stages');

        const record = {
            testId,
            stageName,
            data: JSON.parse(JSON.stringify(data)), // Deep clone
            metadata,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getStage(testId, stageName) {
        const transaction = this.db.transaction(['stages'], 'readonly');
        const store = transaction.objectStore('stages');
        const index = store.index('testId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(testId);
            request.onsuccess = () => {
                const stages = request.result;
                const stage = stages.find(s => s.stageName === stageName);
                resolve(stage || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveTestRun(testId, presetFile, status, result = null) {
        const transaction = this.db.transaction(['testRuns'], 'readwrite');
        const store = transaction.objectStore('testRuns');

        const record = {
            testId,
            presetFile,
            status, // 'running', 'passed', 'failed'
            result,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllStages(testId) {
        const transaction = this.db.transaction(['stages'], 'readonly');
        const store = transaction.objectStore('stages');
        const index = store.index('testId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(testId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearTest(testId) {
        const transaction = this.db.transaction(['stages', 'testRuns'], 'readwrite');

        // Clear stages
        const stageStore = transaction.objectStore('stages');
        const stageIndex = stageStore.index('testId');
        const stageRequest = stageIndex.openCursor(IDBKeyRange.only(testId));

        stageRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        // Clear test run
        const runStore = transaction.objectStore('testRuns');
        runStore.delete(testId);
    }
}

// =============================================================================
// DEEP COMPARISON WITH SEMANTIC RULES
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
            ignoreFields: ['id', 'meta.lastUpdated', 'timestamp'], // Fields that can legitimately change
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

        // Check if field should be ignored
        if (this._shouldIgnore(currentPath)) {
            return;
        }

        // Handle null/undefined
        if (a === null && b === null) return;
        if (a === undefined && b === undefined) return;
        if ((a === null || a === undefined) !== (b === null || b === undefined)) {
            this._addDifference('null/undefined mismatch', a, b);
            return;
        }

        // Handle dates with format variation
        if (this.options.allowDateFormatVariation && this._areBothDates(a, b)) {
            if (!this._areDatesEqual(a, b)) {
                this._addDifference('date value mismatch', a, b);
            }
            return;
        }

        // Handle numeric type coercion
        if (this.options.allowNumericTypeCoercion && this._areBothNumeric(a, b)) {
            if (Number(a) !== Number(b)) {
                this._addDifference('numeric value mismatch', a, b);
            }
            return;
        }

        // Handle arrays
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

        // Handle objects
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

        // Handle primitives
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
// PIPELINE VALIDATOR
// =============================================================================

class PipelineValidator {
    constructor() {
        this.storage = new ValidationStorage();
        this.comparator = new DeepComparator();
        this.testId = null;
        this.stages = [
            'input_fhir',
            'coderef_conversion',
            'protobuf_encode',
            'base64_encode',
            'compressed',
            'base64_decode',
            'protobuf_decode',
            'coderef_result',
            'fhir_reconstruction',
            'display_data'
        ];
    }

    async init() {
        await this.storage.init();
        console.log('✅ Validation framework initialized');
    }

    async runTest(presetFile) {
        this.testId = `test_${Date.now()}_${presetFile}`;

        try {
            console.log(`\n🧪 Starting validation test: ${presetFile}`);
            console.log(`   Test ID: ${this.testId}\n`);

            await this.storage.saveTestRun(this.testId, presetFile, 'running');

            // Stage 1: Load FHIR
            const fhirBundle = await this.loadFhirPreset(presetFile);
            await this.saveStage('input_fhir', fhirBundle, {
                entryCount: fhirBundle.entry?.length || 0,
                resourceTypes: this.getResourceTypes(fhirBundle)
            });

            // Stage 2: FHIR → CodeRef
            const codeRef = await this.convertToCodeRef(fhirBundle);
            await this.saveStage('coderef_conversion', codeRef, {
                hasPatient: !!codeRef.patient,
                stages: Object.keys(codeRef).filter(k => k !== 'patient' && k !== 'bundleMetadata')
            });

            // Stage 3: CodeRef → Protobuf
            const protobuf = await this.encodeProtobuf(codeRef);
            await this.saveStage('protobuf_encode', { buffer: Array.from(protobuf) }, {
                byteLength: protobuf.length
            });

            // Stage 4: Protobuf → Base64
            const base64 = await this.encodeBase64(protobuf);
            await this.saveStage('base64_encode', base64, {
                length: base64.length
            });

            // Stage 5: Compress
            const compressed = await this.compress(protobuf);
            await this.saveStage('compressed', { buffer: Array.from(compressed) }, {
                byteLength: compressed.length,
                compressionRatio: (compressed.length / protobuf.length * 100).toFixed(2) + '%'
            });

            // ===== REVERSE PIPELINE =====

            // Stage 6: Decompress & Base64 decode
            const decodedBase64 = await this.decodeBase64(base64);
            await this.saveStage('base64_decode', { buffer: Array.from(decodedBase64) }, {
                byteLength: decodedBase64.length
            });

            // Stage 7: Protobuf decode
            const decodedProtobuf = await this.decodeProtobuf(decodedBase64);
            await this.saveStage('protobuf_decode', decodedProtobuf, {
                hasPatient: !!decodedProtobuf.patient
            });

            // Stage 8: CodeRef result
            await this.saveStage('coderef_result', decodedProtobuf);

            // Stage 9: CodeRef → FHIR reconstruction
            const reconstructedFhir = await this.convertToFhir(decodedProtobuf);
            await this.saveStage('fhir_reconstruction', reconstructedFhir, {
                entryCount: reconstructedFhir.entry?.length || 0,
                resourceTypes: this.getResourceTypes(reconstructedFhir)
            });

            // Stage 10: Build display model
            const displayData = await this.buildDisplayModel(reconstructedFhir);
            await this.saveStage('display_data', displayData);

            // ===== VALIDATION =====
            console.log('\n🔍 Running deep comparisons...\n');

            // Compare: Original FHIR vs Reconstructed FHIR
            const fhirComparison = this.comparator.compare(fhirBundle, reconstructedFhir);
            if (!fhirComparison.isEqual) {
                await this.handleValidationFailure('fhir_reconstruction', fhirComparison, fhirBundle, reconstructedFhir);
                return;
            }
            console.log('✅ FHIR reconstruction: Perfect match');

            // Compare: Original CodeRef vs Decoded CodeRef
            const codeRefComparison = this.comparator.compare(codeRef, decodedProtobuf, {
                ignoreFields: ['t', 'timestamp'] // These can legitimately differ
            });
            if (!codeRefComparison.isEqual) {
                await this.handleValidationFailure('coderef_decode', codeRefComparison, codeRef, decodedProtobuf);
                return;
            }
            console.log('✅ CodeRef round-trip: Perfect match');

            // Compare: Original Protobuf vs Decoded Protobuf
            const protobufMatch = this.compareBuffers(protobuf, decodedBase64);
            if (!protobufMatch) {
                await this.handleValidationFailure('protobuf_decode',
                    { isEqual: false, differences: [{ type: 'buffer mismatch', path: 'root' }] },
                    protobuf, decodedBase64);
                return;
            }
            console.log('✅ Protobuf round-trip: Byte-perfect match');

            await this.storage.saveTestRun(this.testId, presetFile, 'passed', {
                message: 'All validations passed',
                stages: this.stages.length
            });

            console.log(`\n✅✅✅ TEST PASSED: ${presetFile}\n`);
            return { success: true, testId: this.testId };

        } catch (error) {
            console.error(`\n❌ TEST FAILED: ${error.message}\n`);
            await this.storage.saveTestRun(this.testId, presetFile, 'failed', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async saveStage(name, data, metadata) {
        console.log(`  📦 Stage: ${name}${metadata ? ' - ' + JSON.stringify(metadata) : ''}`);
        await this.storage.saveStage(this.testId, name, data, metadata);
    }

    async handleValidationFailure(stageName, comparison, original, reconstructed) {
        console.error(`\n❌ VALIDATION FAILED at stage: ${stageName}`);
        console.error(`   Found ${comparison.differences.length} differences:\n`);

        comparison.differences.slice(0, 10).forEach((diff, idx) => {
            console.error(`   ${idx + 1}. ${diff.path}: ${diff.type}`);
            console.error(`      Original: ${JSON.stringify(diff.original)}`);
            console.error(`      Reconstructed: ${JSON.stringify(diff.reconstructed)}`);
        });

        if (comparison.differences.length > 10) {
            console.error(`\n   ... and ${comparison.differences.length - 10} more differences`);
        }

        // Save detailed diff
        await this.storage.saveStage(this.testId, `${stageName}_diff`, {
            differences: comparison.differences,
            original,
            reconstructed
        });

        throw new Error(`Validation failed at ${stageName}: ${comparison.differences.length} differences found`);
    }

    // Helper methods for pipeline operations
    async loadFhirPreset(filename) {
        const response = await fetch(filename);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        return await response.json();
    }

    async convertToCodeRef(fhirBundle) {
        // Use existing codecPipeline
        return window.codecPipeline.convertFhirBundleToCodeRef(fhirBundle);
    }

    async encodeProtobuf(codeRef) {
        // Use existing codecPipeline
        return await window.codecPipeline.encodeToProtobuf(codeRef);
    }

    async encodeBase64(buffer) {
        // Convert Uint8Array to base64
        return btoa(String.fromCharCode(...buffer));
    }

    async compress(buffer) {
        // Use pako for compression
        return pako.deflate(buffer);
    }

    async decodeBase64(base64) {
        // Convert base64 to Uint8Array
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    async decodeProtobuf(buffer) {
        // Use existing codecPipeline
        return await window.codecPipeline.decodeFromProtobuf(buffer);
    }

    async convertToFhir(codeRef) {
        // Use existing codecPipeline
        return window.codecPipeline.convertCodeRefToFhirBundle(codeRef);
    }

    async buildDisplayModel(fhirBundle) {
        // Use existing viewModelBuilder
        return await window.viewModelBuilder.buildViewModelFromObject(fhirBundle, {
            label: 'Validation Test',
            rawPayload: fhirBundle
        });
    }

    getResourceTypes(bundle) {
        const types = {};
        bundle.entry?.forEach(entry => {
            const type = entry.resource?.resourceType;
            if (type) types[type] = (types[type] || 0) + 1;
        });
        return types;
    }

    compareBuffers(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

// =============================================================================
// GLOBAL INSTANCE
// =============================================================================

window.pipelineValidator = new PipelineValidator();
