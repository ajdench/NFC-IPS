// --- CONFIGURATION ---

const infoBoxConfig = [
    { title: 'Patient', colorClass: 'grey', dataKey: 'patient' },
    { title: 'IPS Changes', colorClass: 'khaki', dataKey: 'ipsChanges' },
    { title: 'Point of Injury and/or Illness (POI)', colorClass: 'red', dataKey: 'poi', specialClass: 'poi-box' },
    { title: 'Casualty Evacuation (CASEVAC)', colorClass: 'orange', dataKey: 'casevac' },
    { title: 'Medical Evacuation (MEDEVAC)', colorClass: 'yellow', dataKey: 'medevac' },
    { title: 'Role 1 Care (R1)', colorClass: 'green', dataKey: 'r1' },
    { title: 'Role 2 Care (R2)', colorClass: 'blue', dataKey: 'r2' },
    { title: 'Role 3 Care (R3)', colorClass: 'purple', dataKey: 'r3' }
];

const stageKeys = infoBoxConfig
    .map(config => config.dataKey)
    .filter(key => key && !['patient', 'ipsChanges'].includes(key));

const appState = {
    demos: [],
    fragmentViewModel: null,
    currentViewModel: null,
    comparisonViewModel: null
};

// --- UTILITY FUNCTIONS ---

function normaliseBase64(input) {
    if (!input) return '';
    const cleaned = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const remainder = cleaned.length % 4;
    if (remainder === 2) return `${cleaned}==`;
    if (remainder === 3) return `${cleaned}=`;
    if (remainder === 1) return `${cleaned}===`;
    return cleaned;
}

function base64ToUint8Array(input) {
    try {
        const normalised = normaliseBase64(input);
        const binary = atob(normalised);
        const length = binary.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } catch (error) {
        return null;
    }
}

function base64ToString(input) {
    const bytes = base64ToUint8Array(input);
    if (!bytes) return null;
    try {
        return new TextDecoder().decode(bytes);
    } catch (error) {
        let result = '';
        for (let i = 0; i < bytes.length; i += 1) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }
}

function tryParseJson(raw) {
    if (typeof raw !== 'string') return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function looksLikeJson(raw) {
    if (typeof raw !== 'string') return false;
    const trimmed = raw.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString(undefined, options);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleString();
}

function formatDobValue(dob) {
    if (dob === undefined || dob === null) return undefined;
    const dobString = String(dob).padStart(8, '0');
    const year = dobString.slice(0, 4);
    const month = dobString.slice(4, 6);
    const day = dobString.slice(6, 8);
    return `${year}-${month}-${day}`;
}

function formatNHSNumber(nhsNumber) {
    if (!nhsNumber || typeof nhsNumber !== 'string' || nhsNumber.length !== 10) {
        return nhsNumber;
    }
    return `${nhsNumber.substring(0, 3)} ${nhsNumber.substring(3, 6)} ${nhsNumber.substring(6, 10)}`;
}

function codeRefKey(codeRef) {
    if (!codeRef) return '';
    const system = codeRef.sys || '';
    const code = codeRef.code || '';
    return system ? `${system}:${code}` : code;
}

function normaliseCodeRef(codeRef, fallbackIndex) {
    if (!codeRef) {
        const fallback = fallbackIndex !== undefined ? `Code #${fallbackIndex}` : 'Unknown code';
        return { system: '', code: fallback, ref: fallback };
    }
    const system = codeRef.sys || '';
    const code = codeRef.code || '';
    const ref = codeRefKey(codeRef) || (fallbackIndex !== undefined ? `Code #${fallbackIndex}` : 'Unknown code');
    return { system, code, ref };
}

const genderCodeMap = {
    'sct:248153007': 'male',
    'sct:248152002': 'female',
    'sct:337915000': 'other',
    'sct:184115007': 'unknown'
};

function mapGenderFromCodeRef(codeRef) {
    const key = codeRefKey(codeRef);
    if (!key) return 'unknown';
    return genderCodeMap[key] || 'unknown';
}

function showMessage(message, type = 'info') {
    const messageDisplay = document.getElementById('message-display');
    if (!messageDisplay) return;
    messageDisplay.textContent = message;
    messageDisplay.className = `message-display message-display--${type}`;
    setTimeout(() => {
        messageDisplay.textContent = '';
        messageDisplay.className = 'message-display';
    }, 5000);
}

async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching JSON from ${url}:`, error);
        return null;
    }
}

// --- CODEC PIPELINE ---

const codecPipeline = (() => {
    const PROTO_URL = 'resources/nfc_payload.proto';
    const LEGACY_PROTO_URL = 'resources/nfc_payload_legacy.proto';

    let payloadTypePromise = null;
    let legacyPayloadTypePromise = null;

    function ensurePayloadType() {
        if (!payloadTypePromise) {
            payloadTypePromise = fetch(PROTO_URL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Unable to load Proto schema (${response.status})`);
                    }
                    return response.text();
                })
                .then(protoText => {
                    const root = protobuf.parse(protoText).root;
                    const type = root.lookupType('medis.nfc.NFCPayload');
                    if (!type) {
                        throw new Error('NFCPayload type not found in Proto schema.');
                    }
                    return type;
                })
                .catch(error => {
                    payloadTypePromise = null;
                    throw error;
                });
        }
        return payloadTypePromise;
    }

    function ensureLegacyPayloadType() {
        if (!legacyPayloadTypePromise) {
            legacyPayloadTypePromise = fetch(LEGACY_PROTO_URL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Unable to load legacy Proto schema (${response.status})`);
                    }
                    return response.text();
                })
                .then(protoText => {
                    const root = protobuf.parse(protoText).root;
                    const type = root.lookupType('medis.nfc.NFCPayload');
                    if (!type) {
                        throw new Error('Legacy NFCPayload type not found in Proto schema.');
                    }
                    return type;
                })
                .catch(error => {
                    legacyPayloadTypePromise = null;
                    throw error;
                });
        }
        return legacyPayloadTypePromise;
    }

    function attemptInflations(bytes) {
        const results = [];
        try {
            const inflated = pako.inflate(bytes);
            results.push(inflated);
        } catch (inflateError) {
            try {
                const inflatedRaw = pako.inflateRaw(bytes);
                results.push(inflatedRaw);
            } catch (inflateRawError) {
                // Ignore – we'll rely on raw bytes below.
            }
        }
        results.push(bytes);
        return results;
    }

    function decodeWith(payloadType, buffer, options = {}) {
        const message = payloadType.decode(buffer);
        const object = payloadType.toObject(message, { longs: Number, enums: String, defaults: false });
        if (options.schemaVersion) {
            Object.defineProperty(object, '__schemaVersion', {
                value: options.schemaVersion,
                enumerable: false
            });
        }
        return object;
    }

    async function tryDecode(payloadType, buffers, schemaVersion) {
        for (let i = 0; i < buffers.length; i += 1) {
            const buffer = buffers[i];
            try {
                return decodeWith(payloadType, buffer, { schemaVersion });
            } catch (error) {
                // Try next buffer.
            }
        }
        return null;
    }

    async function decodeFragment(fragment) {
        const bytes = base64ToUint8Array(fragment);
        if (!bytes) {
            throw new Error('Fragment is not valid Base64URL data.');
        }

        const buffers = attemptInflations(bytes);

        const payloadType = await ensurePayloadType();
        const coderefResult = await tryDecode(payloadType, buffers, 'coderef');
        if (coderefResult) {
            return { data: coderefResult, schemaVersion: 'coderef' };
        }

        const legacyPayloadType = await ensureLegacyPayloadType();
        const legacyResult = await tryDecode(legacyPayloadType, buffers, 'legacy');
        if (legacyResult) {
            return { data: legacyResult, schemaVersion: 'legacy' };
        }

        throw new Error('Unable to decode NFC payload fragment.');
    }

    return { decodeFragment };
})();

// --- PAYLOAD SERVICE ---

const payloadService = (() => {
    function buildViewModelFromObject(payload, options = {}) {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload is empty or invalid.');
        }

        const schemaVersion = options.schemaVersion || payload.__schemaVersion || null;

        if (payload.resourceType === 'Patient') {
            return buildFromFhir(payload, options);
        }

        if (schemaVersion === 'legacy' || isLegacyIndexedPayload(payload)) {
            return buildFromLegacy(payload, options);
        }

        if (schemaVersion === 'coderef' || isCodeRefPayload(payload)) {
            return buildFromCodeRef(payload, options);
        }

        throw new Error('Unsupported payload format.');
    }

    function isLegacyIndexedPayload(payload) {
        return Boolean(payload && Array.isArray(payload.D) && payload.P);
    }

    function isCodeRefPayload(payload) {
        if (!payload) return false;
        if (payload.patient) return true;
        return stageKeys.some(stageKey => payload[stageKey]);
    }

    function buildFromFhir(patientResource, options = {}) {
        return {
            type: 'fhir',
            label: options.label || 'FHIR Patient',
            patientResource,
            stageSections: options.stageSections || {},
            summary: options.summary || null,
            rawPayload: options.rawPayload || patientResource,
            originalInput: options.originalInput || null,
            codebook: []
        };
    }

    function buildFromLegacy(nfcPayload, options = {}) {
        const codebook = buildLegacyCodebook(nfcPayload.D);
        const patientResource = buildLegacyPatient(nfcPayload, codebook);
        const stageResult = buildLegacyStageSections(nfcPayload, codebook);
        const summary = buildSummary(nfcPayload, stageResult.totals);
        return {
            type: 'nfc',
            label: options.label || 'NFC Payload (indexed)',
            patientResource,
            stageSections: stageResult.sections,
            summary,
            rawPayload: options.rawPayload || nfcPayload,
            originalInput: options.originalInput || null,
            codebook
        };
    }

    function buildFromCodeRef(nfcPayload, options = {}) {
        const codebook = gatherCodeRefs(nfcPayload);
        const patientResource = buildCodeRefPatient(nfcPayload.patient || {});
        const stageResult = buildCodeRefStageSections(nfcPayload);
        const summary = buildSummary(nfcPayload, stageResult.totals);
        return {
            type: 'nfc',
            label: options.label || 'NFC Payload',
            patientResource,
            stageSections: stageResult.sections,
            summary,
            rawPayload: options.rawPayload || nfcPayload,
            originalInput: options.originalInput || null,
            codebook
        };
    }

    function buildLegacyCodebook(entries = []) {
        if (!Array.isArray(entries)) return [];
        return entries.map((entry, index) => {
            const system = entry?.sys || '';
            const code = entry?.code || '';
            const ref = system && code ? `${system}:${code}` : `Code #${index}`;
            return {
                index,
                system,
                code,
                ref
            };
        });
    }

    function resolveLegacyCode(codebook, index) {
        if (index === undefined || index === null) {
            return { ref: 'Unknown', system: '', code: '' };
        }
        const resolved = codebook[index];
        if (resolved) return resolved;
        return { ref: `Code #${index}`, system: '', code: '' };
    }

    function buildLegacyPatient(payload, codebook) {
        const patient = { resourceType: 'Patient' };
        const patientData = payload.P || {};
        const nameParts = Array.isArray(patientData.n) ? patientData.n : [];
        const givenNames = nameParts.length > 1 ? nameParts.slice(0, nameParts.length - 1) : nameParts;
        const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;

        const nameEntry = {
            use: 'official',
            given: givenNames.length ? givenNames : undefined,
            family: familyName || undefined
        };

        if (patientData.r) {
            nameEntry.prefix = [patientData.r];
        }

        patient.name = [nameEntry];
        patient.gender = 'unknown';
        const dob = formatDobValue(patientData.dob);
        if (dob) {
            patient.birthDate = dob;
        }

        const identifiers = [];
        if (patientData.nhs) {
            identifiers.push({
                use: 'official',
                type: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                        code: 'NH',
                        display: 'National Health Service Number'
                    }],
                    text: 'NHS Number'
                },
                value: String(patientData.nhs)
            });
        }
        if (patientData.sn) {
            identifiers.push({
                use: 'secondary',
                type: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                        code: 'MIL',
                        display: 'Military ID number'
                    }],
                    text: 'Service Number'
                },
                value: String(patientData.sn)
            });
        }
        if (identifiers.length) {
            patient.identifier = identifiers;
        }

        const extensions = [];
        if (Number.isInteger(patientData.bg)) {
            const bloodCode = resolveLegacyCode(codebook, patientData.bg);
            extensions.push({
                url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
                valueCodeableConcept: {
                    coding: [{
                        system: bloodCode.system || 'urn:medis:blood-group',
                        code: bloodCode.code || bloodCode.ref,
                        display: bloodCode.code || bloodCode.ref
                    }],
                    text: bloodCode.code || bloodCode.ref
                }
            });
        }
        if (extensions.length) {
            patient.extension = extensions;
        }

        return patient;
    }

    function buildLegacyStageSections(payload, codebook) {
        const sections = {};
        const totals = { vitals: 0, conditions: 0, events: 0 };
        const vitalsSource = payload.V || {};
        const conditionsSource = payload.C || {};
        const eventsSource = payload.E || {};

        stageKeys.forEach(stageKey => {
            const vitals = normaliseLegacyVitals(vitalsSource[stageKey], codebook);
            const conditions = normaliseLegacyConditions(conditionsSource[stageKey], codebook);
            const events = normaliseLegacyEvents(eventsSource[stageKey], codebook);
            totals.vitals += vitals.length;
            totals.conditions += conditions.length;
            totals.events += events.length;
            sections[stageKey] = { vitals, conditions, events };
        });

        return { sections, totals };
    }

    function normaliseLegacyVitals(entries, codebook) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, value, unit] = item;
                const code = resolveLegacyCode(codebook, index);
                const valueParts = [];
                if (value !== undefined && value !== null) valueParts.push(value);
                if (unit) valueParts.push(unit);
                const valueText = valueParts.length ? valueParts.join(' ') : 'Recorded';
                return {
                    label: `Vitals • ${code.code || code.ref}`,
                    value: valueText,
                    tooltip: code.ref
                };
            })
            .filter(Boolean);
    }

    function normaliseLegacyConditions(entries, codebook) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, onset] = item;
                const code = resolveLegacyCode(codebook, index);
                const valueText = onset ? `Onset ${formatDateTime(onset)}` : 'Recorded';
                return {
                    label: `Condition • ${code.code || code.ref}`,
                    value: valueText,
                    tooltip: code.ref
                };
            })
            .filter(Boolean);
    }

    function normaliseLegacyEvents(entries, codebook) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, time, dose, route] = item;
                const code = resolveLegacyCode(codebook, index);
                const valueParts = [];
                if (time) valueParts.push(formatDateTime(time));
                if (dose !== undefined && dose !== null) valueParts.push(`Dose ${dose}`);
                if (route) valueParts.push(`Route ${route}`);
                const valueText = valueParts.length ? valueParts.join(' | ') : 'Recorded';
                return {
                    label: `Event • ${code.code || code.ref}`,
                    value: valueText,
                    tooltip: code.ref
                };
            })
            .filter(Boolean);
    }

    function gatherCodeRefs(payload) {
        const map = new Map();

        function addCodeRef(codeRef) {
            const key = codeRefKey(codeRef);
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, normaliseCodeRef(codeRef));
            }
        }

        if (payload.patient) {
            addCodeRef(payload.patient.gender);
            addCodeRef(payload.patient.blood_group);
            addCodeRef(payload.patient.nhs_id);
            addCodeRef(payload.patient.service_id);
        }

        stageKeys.forEach(stageKey => {
            const stage = payload[stageKey];
            if (!stage) return;
            (stage.vitals || []).forEach(vital => addCodeRef(vital?.code));
            (stage.conditions || []).forEach(condition => addCodeRef(condition?.code));
            (stage.events || []).forEach(event => addCodeRef(event?.code));
        });

        return Array.from(map.values());
    }

    function buildCodeRefPatient(patientData = {}) {
        const patient = { resourceType: 'Patient' };

        if (patientData.given || patientData.family) {
            const nameEntry = { use: 'official' };
            if (patientData.given) {
                nameEntry.given = patientData.given.split(/\s+/).filter(Boolean);
            }
            if (patientData.family) {
                nameEntry.family = patientData.family;
            }
            patient.name = [nameEntry];
        }

        const gender = mapGenderFromCodeRef(patientData.gender);
        if (gender) {
            patient.gender = gender;
        }

        if (patientData.dob) {
            patient.birthDate = patientData.dob;
        }

        const identifiers = [];
        if (patientData.nhs_id?.code) {
            identifiers.push({
                use: 'official',
                type: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                        code: 'NH',
                        display: 'National Health Service Number'
                    }],
                    text: 'NHS Number'
                },
                system: patientData.nhs_id.sys ? `urn:code:${patientData.nhs_id.sys}` : undefined,
                value: String(patientData.nhs_id.code)
            });
        }
        if (patientData.service_id?.code) {
            identifiers.push({
                use: 'secondary',
                type: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                        code: 'MIL',
                        display: 'Military ID number'
                    }],
                    text: 'Service Number'
                },
                system: patientData.service_id.sys ? `urn:code:${patientData.service_id.sys}` : undefined,
                value: String(patientData.service_id.code)
            });
        }
        if (identifiers.length) {
            patient.identifier = identifiers;
        }

        const bloodGroup = normaliseCodeRef(patientData.blood_group);
        if (bloodGroup.code) {
            patient.extension = [{
                url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
                valueCodeableConcept: {
                    coding: [{
                        system: bloodGroup.system ? `urn:code:${bloodGroup.system}` : 'urn:medis:blood-group',
                        code: bloodGroup.code,
                        display: bloodGroup.code
                    }],
                    text: bloodGroup.code
                }
            }];
        }

        return patient;
    }

    function buildCodeRefStageSections(payload) {
        const sections = {};
        const totals = { vitals: 0, conditions: 0, events: 0 };

        stageKeys.forEach(stageKey => {
            const stage = payload[stageKey] || {};
            const vitals = normaliseCodeRefVitals(stage.vitals || []);
            const conditions = normaliseCodeRefConditions(stage.conditions || []);
            const events = normaliseCodeRefEvents(stage.events || []);
            totals.vitals += vitals.length;
            totals.conditions += conditions.length;
            totals.events += events.length;
            sections[stageKey] = { vitals, conditions, events };
        });

        return { sections, totals };
    }

    function normaliseCodeRefVitals(entries) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const valueParts = [];
                if (item.value !== undefined && item.value !== null) {
                    valueParts.push(item.value);
                }
                if (item.unit) {
                    valueParts.push(item.unit);
                }
                const valueText = valueParts.length ? valueParts.join(' ') : 'Recorded';
                return {
                    label: `Vitals • ${code.code || code.ref}`,
                    value: valueText,
                    tooltip: code.ref
                };
            })
            .filter(Boolean);
    }

    function normaliseCodeRefConditions(entries) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const valueText = item.onset ? `Onset ${formatDateTime(item.onset)}` : 'Recorded';
                return {
                    label: `Condition • ${code.code || code.ref}`,
                    value: valueText,
                    tooltip: code.ref
                };
            })
            .filter(Boolean);
    }

    function normaliseCodeRefEvents(entries) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const valueParts = [];
                if (item.time) valueParts.push(formatDateTime(item.time));
                if (item.dose !== undefined && item.dose !== null) {
                    const unitPart = item.unit ? ` ${item.unit}` : '';
                    valueParts.push(`Dose ${item.dose}${unitPart}`.trim());
                }
                if (item.route) valueParts.push(`Route ${item.route}`);
                const valueText = valueParts.length ? valueParts.join(' | ') : 'Recorded';
                return {
                    label: `Event • ${code.code || code.ref}`,
                    value: valueText,
                    tooltip: code.ref
                };
            })
            .filter(Boolean);
    }

    function buildSummary(payload, totals) {
        const summary = { totals };
        if (typeof payload.t === 'number') {
            const timestamp = new Date(payload.t * 60000);
            if (!Number.isNaN(timestamp.getTime())) {
                summary.timestamp = timestamp;
            }
        } else if (typeof payload.t === 'string') {
            const timestamp = new Date(payload.t);
            if (!Number.isNaN(timestamp.getTime())) {
                summary.timestamp = timestamp;
            }
        }
        return summary;
    }

    async function loadFromFragment(fragment) {
        const decoded = decodeURIComponent(fragment || '').trim();
        if (!decoded) {
            throw new Error('URL fragment is empty.');
        }

        if (looksLikeJson(decoded)) {
            const parsed = tryParseJson(decoded);
            if (parsed) {
                return buildViewModelFromObject(parsed, {
                    label: 'Fragment JSON',
                    originalInput: decoded,
                    rawPayload: parsed
                });
            }
        }

        const base64JsonString = base64ToString(decoded);
        if (base64JsonString && looksLikeJson(base64JsonString)) {
            const parsedBase64Json = tryParseJson(base64JsonString);
            if (parsedBase64Json) {
                return buildViewModelFromObject(parsedBase64Json, {
                    label: 'Fragment Base64 JSON',
                    originalInput: decoded,
                    rawPayload: parsedBase64Json
                });
            }
        }

        const decodeResult = await codecPipeline.decodeFragment(decoded);
        return buildViewModelFromObject(decodeResult.data, {
            label: decodeResult.schemaVersion === 'legacy' ? 'Fragment NFC Payload (indexed)' : 'Fragment NFC Payload',
            originalInput: decoded,
            rawPayload: decodeResult.data,
            schemaVersion: decodeResult.schemaVersion
        });
    }

    async function parseUserInput(rawInput) {
        const trimmed = (rawInput || '').trim();
        if (!trimmed) {
            throw new Error('Input is empty.');
        }

        if (looksLikeJson(trimmed)) {
            const parsed = tryParseJson(trimmed);
            if (parsed) {
                return buildViewModelFromObject(parsed, {
                    label: 'Custom JSON',
                    originalInput: trimmed,
                    rawPayload: parsed
                });
            }
        }

        const base64JsonString = base64ToString(trimmed);
        if (base64JsonString && looksLikeJson(base64JsonString)) {
            const parsedBase64Json = tryParseJson(base64JsonString);
            if (parsedBase64Json) {
                return buildViewModelFromObject(parsedBase64Json, {
                    label: 'Custom Base64 JSON',
                    originalInput: trimmed,
                    rawPayload: parsedBase64Json
                });
            }
        }

        const decodeResult = await codecPipeline.decodeFragment(trimmed);
        return buildViewModelFromObject(decodeResult.data, {
            label: decodeResult.schemaVersion === 'legacy' ? 'Custom NFC Payload (indexed)' : 'Custom NFC Payload',
            originalInput: trimmed,
            rawPayload: decodeResult.data,
            schemaVersion: decodeResult.schemaVersion
        });
    }

    return { buildViewModelFromObject, loadFromFragment, parseUserInput };
})();

// --- RENDERING FUNCTIONS ---

function createInfoBoxes() {
    const container = document.getElementById('info-boxes-container');
    if (!container) return;

    infoBoxConfig.forEach(config => {
        const wrapperClass = config.specialClass ? 'poi-box-wrapper' : 'info-box-wrapper';
        const boxClass = config.specialClass ? 'poi-box' : `info-box ${config.colorClass}`;

        const wrapper = document.createElement('div');
        wrapper.className = wrapperClass;

        const box = document.createElement('div');
        box.className = boxClass;
        if (config.dataKey) {
            box.dataset.key = config.dataKey;
        }

        const title = document.createElement('h2');
        title.className = config.specialClass ? 'poi-title' : 'info-title';
        title.textContent = config.title;

        box.appendChild(title);
        wrapper.appendChild(box);
        container.appendChild(wrapper);
    });
}

function createDetailBoxElement(label, value, parentColorClass) {
    const detailBox = document.createElement('div');
    detailBox.classList.add('detail-box');
    if (parentColorClass) {
        detailBox.classList.add(parentColorClass);
    }
    const labelSpan = document.createElement('span');
    labelSpan.classList.add('detail-label');
    labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.classList.add('detail-value');
    valueSpan.textContent = value;
    detailBox.appendChild(labelSpan);
    detailBox.appendChild(valueSpan);
    return detailBox;
}

function addGhostItems(container, count) {
    for (let i = 0; i < count; i += 1) {
        const ghost = document.createElement('div');
        ghost.classList.add('detail-ghost-item');
        container.appendChild(ghost);
    }
}

function renderPatientBox(patientResource) {
    const patientBox = document.querySelector('[data-key="patient"]');
    if (!patientBox) return;

    const patientTitle = patientBox.querySelector('.info-title');
    const existingDetails = patientBox.querySelector('.patient-details-container');
    if (existingDetails) existingDetails.remove();

    const patientConfig = infoBoxConfig.find(config => config.dataKey === 'patient');
    const patientColorClass = patientConfig ? patientConfig.colorClass : 'grey';

    if (patientResource && patientResource.resourceType === 'Patient') {
        patientTitle.textContent = 'Patient';
        const detailsElement = createPatientDetailsElement(patientResource, patientColorClass);
        patientBox.appendChild(detailsElement);
        addGhostItems(detailsElement, 10);
    } else {
        patientTitle.textContent = 'Patient (No data)';
    }
}

function createPatientDetailsElement(patientData, parentColorClass) {
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('patient-details-container');

    const name = patientData.name?.[0] || {};
    const details = [
        { label: 'Title', value: name.prefix?.[0] },
        { label: 'Forename', value: name.given?.[0] },
        { label: 'Surname', value: name.family },
        { label: 'Sex', value: patientData.gender },
        { label: 'Date of Birth', value: formatDate(patientData.birthDate) },
        {
            label: 'Service Number',
            value: patientData.identifier?.find(id => id.type?.coding?.some(c => c.code === 'MIL'))?.value
        },
        {
            label: 'NHS Number',
            value: formatNHSNumber(
                patientData.identifier?.find(id => id.type?.text === 'NHS Number')?.value
            )
        }
    ];

    details.forEach(detail => {
        if (detail.value) {
            detailsContainer.appendChild(createDetailBoxElement(detail.label, detail.value, parentColorClass));
        }
    });
    return detailsContainer;
}

function renderStageSections(stageSections = {}) {
    stageKeys.forEach(stageKey => {
        const stageBox = document.querySelector(`[data-key="${stageKey}"]`);
        if (!stageBox) return;

        const existingContainer = stageBox.querySelector('.stage-details-container');
        if (existingContainer) existingContainer.remove();
        const existingPlaceholder = stageBox.querySelector('.stage-placeholder');
        if (existingPlaceholder) existingPlaceholder.remove();

        const config = infoBoxConfig.find(item => item.dataKey === stageKey);
        const stageColor = config ? config.colorClass : null;
        const stageData = stageSections[stageKey] || { vitals: [], conditions: [], events: [] };
        const entries = [...stageData.vitals, ...stageData.conditions, ...stageData.events];

        if (!entries.length) {
            const placeholder = document.createElement('p');
            placeholder.className = 'stage-placeholder';
            placeholder.textContent = 'No data available.';
            stageBox.appendChild(placeholder);
            return;
        }

        const container = document.createElement('div');
        container.classList.add('stage-details-container');
        entries.forEach(entry => {
            const detail = createDetailBoxElement(entry.label, entry.value, stageColor);
            detail.title = entry.tooltip;
            container.appendChild(detail);
        });
        stageBox.appendChild(container);
    });
}

function renderPayloadDisplay(rawPayload) {
    const payloadDisplay = document.getElementById('payload-display');
    if (!payloadDisplay) return;
    if (!rawPayload) {
        payloadDisplay.textContent = '';
        return;
    }

    try {
        payloadDisplay.textContent = JSON.stringify(rawPayload, null, 2);
    } catch (error) {
        payloadDisplay.textContent = String(rawPayload);
    }
}

function renderIpsChangesBox(currentPatient, referencePatient, summary) {
    const ipsChangesBox = document.querySelector('[data-key="ipsChanges"]');
    if (!ipsChangesBox) return;

    const existingDetails = ipsChangesBox.querySelector('.patient-details-container');
    if (existingDetails) existingDetails.remove();

    const existingPlaceholder = ipsChangesBox.querySelector('.ips-placeholder');
    if (existingPlaceholder) existingPlaceholder.remove();

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('patient-details-container');

    const detailItems = [];

    if (summary?.totals) {
        const { vitals = 0, conditions = 0, events = 0 } = summary.totals;
        detailItems.push({ label: 'Total Vitals', value: String(vitals) });
        detailItems.push({ label: 'Total Conditions', value: String(conditions) });
        detailItems.push({ label: 'Total Events', value: String(events) });
    }

    if (summary?.timestamp) {
        detailItems.push({ label: 'Created', value: summary.timestamp.toLocaleString() });
    }

    const differences = buildPatientDifferences(referencePatient, currentPatient);
    differences.forEach(diff => detailItems.push(diff));

    if (detailItems.length) {
        detailItems.forEach(item => {
            detailsContainer.appendChild(createDetailBoxElement(item.label, item.value));
        });
        ipsChangesBox.appendChild(detailsContainer);
        addGhostItems(detailsContainer, 10);
    } else {
        const placeholder = document.createElement('p');
        placeholder.className = 'ips-placeholder';
        placeholder.textContent = 'No summary or changes to display.';
        ipsChangesBox.appendChild(placeholder);
    }
}

function buildPatientDifferences(referencePatient, currentPatient) {
    if (!referencePatient || !currentPatient) return [];

    const differences = [];

    const identifiers1 = referencePatient.identifier || [];
    const identifiers2 = currentPatient.identifier || [];

    identifiers2.forEach(id2 => {
        const id1 = identifiers1.find(id => id.value === id2.value);
        if (!id1 || JSON.stringify(id1) !== JSON.stringify(id2)) {
            const hasCoding = id2.type?.coding?.some(coding => coding.code && coding.display);
            if (hasCoding && id2.type?.text && id2.value) {
                differences.push({
                    label: `Identifier: ${id2.type.text}`,
                    value: `${id2.type.coding[0].code} - ${id2.type.coding[0].display} (${id2.value})`
                });
            }
        }
    });

    const extensions1 = referencePatient.extension || [];
    const extensions2 = currentPatient.extension || [];

    extensions2.forEach(ext2 => {
        const ext1 = extensions1.find(ext => ext.url === ext2.url);
        if (!ext1 || JSON.stringify(ext1) !== JSON.stringify(ext2)) {
            const hasCoding = ext2.valueCodeableConcept?.coding?.some(coding => coding.code && coding.display);
            if (hasCoding && ext2.valueCodeableConcept?.text) {
                const urlParts = ext2.url.split('/');
                const label = urlParts[urlParts.length - 1]
                    .replace('Extension-UKCore-', '')
                    .replace(/([A-Z])/g, ' $1')
                    .trim();
                differences.push({
                    label: `Extension: ${label}`,
                    value: `${ext2.valueCodeableConcept.coding[0].code} - ${ext2.valueCodeableConcept.coding[0].display} (${ext2.valueCodeableConcept.text})`
                });
            }
        }
    });

    return differences;
}

function processAndRenderAll(viewModel, comparisonViewModel) {
    if (!viewModel) {
        showMessage('Error: Could not load or parse payload.', 'error');
        return;
    }

    renderPatientBox(viewModel.patientResource);
    renderPayloadDisplay(viewModel.rawPayload);
    renderIpsChangesBox(viewModel.patientResource, comparisonViewModel?.patientResource, viewModel.summary);
    renderStageSections(viewModel.stageSections);
}

// --- INITIALISATION ---

async function init() {
    createInfoBoxes();

    const payloadToggle = document.getElementById('payload-toggle');
    const parseButton = document.getElementById('parse-button');
    const jsonInput = document.getElementById('json-input');

    const payload1 = await fetchJson('payload-1.json');
    const payload2 = await fetchJson('payload-2.json');

    if (payload1) {
        appState.demos[0] = payloadService.buildViewModelFromObject(payload1, {
            label: 'Payload 1',
            rawPayload: payload1
        });
    }
    if (payload2) {
        appState.demos[1] = payloadService.buildViewModelFromObject(payload2, {
            label: 'Payload 2',
            rawPayload: payload2
        });
    }

    let initialViewModel = null;
    let initialComparison = null;

    const fragment = window.location.hash.slice(1);
    if (fragment) {
        try {
            const fragmentViewModel = await payloadService.loadFromFragment(fragment);
            appState.fragmentViewModel = fragmentViewModel;
            initialViewModel = fragmentViewModel;
            initialComparison = appState.demos[0] || null;
            jsonInput.textContent = decodeURIComponent(fragment);
            showMessage('Loaded payload from NFC fragment.', 'success');
        } catch (error) {
            console.error('Failed to decode fragment payload:', error);
            showMessage('Failed to decode fragment. Showing demo payload instead.', 'warning');
            jsonInput.textContent = decodeURIComponent(fragment);
        }
    }

    if (!initialViewModel) {
        if (appState.demos[0]) {
            initialViewModel = appState.demos[0];
            initialComparison = appState.demos[1] || null;
        } else if (appState.demos[1]) {
            initialViewModel = appState.demos[1];
            initialComparison = null;
        }
    }

    if (!initialViewModel) {
        showMessage('No payload data available.', 'error');
        return;
    }

    appState.currentViewModel = initialViewModel;
    appState.comparisonViewModel = initialComparison;
    processAndRenderAll(initialViewModel, initialComparison);

    payloadToggle.addEventListener('change', () => {
        const useSecond = payloadToggle.checked;
        const selected = appState.demos[useSecond ? 1 : 0];
        const comparison = appState.demos[useSecond ? 0 : 1];
        if (!selected) {
            showMessage('Selected demo payload is unavailable.', 'warning');
            return;
        }
        appState.currentViewModel = selected;
        appState.comparisonViewModel = comparison || null;
        processAndRenderAll(selected, comparison);
    });

    parseButton.addEventListener('click', async () => {
        const rawInput = jsonInput.textContent.trim();
        if (!rawInput) {
            showMessage('Input is empty.', 'warning');
            return;
        }
        try {
            const parsedViewModel = await payloadService.parseUserInput(rawInput);
            appState.currentViewModel = parsedViewModel;
            appState.comparisonViewModel = appState.demos[payloadToggle.checked ? 1 : 0] || null;
            processAndRenderAll(parsedViewModel, appState.comparisonViewModel);
            showMessage('Custom payload parsed successfully.', 'success');
        } catch (error) {
            console.error('Error parsing custom payload:', error);
            showMessage(error.message || 'Invalid payload input.', 'error');
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
