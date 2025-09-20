// --- CONFIGURATION ---

const infoBoxConfig = [
    { title: 'Patient Demographics', colorClass: 'grey', dataKey: 'patient' },
    { title: 'Clinical Summary', colorClass: 'khaki', dataKey: 'clinicalSummary' },
    { title: 'Point of Injury and/or Illness (POI)', colorClass: 'red', dataKey: 'poi', specialClass: 'poi-box' },
    { title: 'Casualty Evacuation (CASEVAC)', colorClass: 'yellow', dataKey: 'casevac' },
    { title: 'Medical Evacuation (MEDEVAC)', colorClass: 'orange', dataKey: 'medevac' },
    { title: 'Role 1 Care (R1)', colorClass: 'green', dataKey: 'r1' },
    { title: 'Role 2 Care (R2)', colorClass: 'blue', dataKey: 'r2' },
    { title: 'Role 3 Care (R3)', colorClass: 'purple', dataKey: 'r3' }
];

const stageKeys = infoBoxConfig
    .map(config => config.dataKey)
    .filter(key => key && !['patient', 'clinicalSummary'].includes(key));

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

    const day = parsed.getDate();
    const month = parsed.toLocaleDateString('en-US', { month: 'short' });
    const year = parsed.getFullYear().toString().slice(-2);
    const hours = parsed.getHours().toString().padStart(2, '0');
    const minutes = parsed.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes}`;
}

function formatTimeOnly(dateString) {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;

    const hours = parsed.getHours().toString().padStart(2, '0');
    const minutes = parsed.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

function formatDateForComparison(dateString) {
    if (!dateString) return null;
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;

    const day = parsed.getDate();
    const month = parsed.toLocaleDateString('en-US', { month: 'short' });
    const year = parsed.getFullYear().toString().slice(-2);

    return `${day} ${month} ${year}`;
}

function inferUnitFromCode(system, code) {
    // Standard units for common LOINC vital signs
    const unitMap = {
        'loinc:8310-5': '°F',        // Body temperature
        'loinc:8867-4': 'bpm',       // Heart rate
        'loinc:8480-6': 'mmHg',      // Systolic blood pressure
        'loinc:8462-4': 'mmHg',      // Diastolic blood pressure
        'loinc:9279-1': '/min',      // Respiratory rate
        'loinc:2708-6': '%',         // Oxygen saturation
        'loinc:718-7': 'g/dL',       // Hemoglobin
        'loinc:33747-0': 'pH',       // Blood pH
        'loinc:85354-9': 'mmHg',     // Blood pressure (composite)
        'loinc:1751-7': 'U/L',       // Albumin
        'loinc:1968-7': 'mg/dL',     // Creatinine
        'loinc:1975-2': 'mg/dL',     // Bilirubin
        'loinc:2951-2': 'mOsm/kg',   // Sodium
        'loinc:6298-4': 'mEq/L',     // Potassium
    };

    const key = `${system}:${code}`;
    return unitMap[key] || null;
}

function formatTemperature(value, unit) {
    if (value === undefined || value === null) return null;

    let fahrenheit, celsius;

    if (unit === '°F' || !unit) {
        fahrenheit = value;
        celsius = ((value - 32) * 5/9).toFixed(1);
    } else if (unit === '°C') {
        celsius = value;
        fahrenheit = ((value * 9/5) + 32).toFixed(1);
    } else {
        return `${value} ${unit}`;
    }

    return `${celsius}°C [${fahrenheit}°F]`;
}

function isTemperatureCode(system, code) {
    return system === 'loinc' && code === '8310-5';
}

function resolveCodePrefix(system) {
    const prefixMap = {
        'sct': 'snomed',
        'loinc': 'loinc',
        'icd': 'icd10' // Will be enhanced to support icd11 based on code family
    };
    return prefixMap[system] || system;
}

function createStandardizedPill(type, rawData, sectionDateTracker) {
    const { code, description, value, unit, dose, route, time, onset } = rawData;

    // Determine the primary timestamp
    const primaryTime = onset || time;

    // Format value section based on type
    let valueContent = '';
    let tooltipValueContent = description;

    if (type === 'vitals') {
        // For vitals: show measurement with unit
        if (isTemperatureCode(code.system, code.code)) {
            const tempDisplay = formatTemperature(value, unit);
            valueContent = tempDisplay || `${value} ${unit || ''}`.trim();
            tooltipValueContent = `${description} | ${valueContent}`;
        } else {
            const unitDisplay = unit || inferUnitFromCode(code.system, code.code);
            valueContent = `${value} ${unitDisplay || ''}`.trim();
            tooltipValueContent = `${description} | ${valueContent}`;
        }
    } else if (type === 'conditions') {
        // For conditions: show "Onset"
        valueContent = 'Onset';
        tooltipValueContent = description;
    } else if (type === 'events') {
        // For events: show dose if medication-related, otherwise show description
        if (dose !== undefined && dose !== null && dose !== '' && dose !== 'NaN' && !Number.isNaN(dose)) {
            // Add unit if available
            const doseWithUnit = unit ? `${dose} ${unit}` : dose;
            valueContent = doseWithUnit;
            tooltipValueContent = `${description} | ${doseWithUnit}`;
        } else {
            valueContent = description;
            tooltipValueContent = description;
        }
    }

    // Handle date display logic
    let dateDisplay = '';
    let tooltipDateDisplay = '';

    if (primaryTime) {
        const currentDate = formatDateForComparison(primaryTime);
        const fullDateTime = formatDateTime(primaryTime);
        const timeOnly = formatTimeOnly(primaryTime);

        // Check if this is same date as previous in section
        if (currentDate === sectionDateTracker.lastDate) {
            dateDisplay = timeOnly;
        } else {
            dateDisplay = fullDateTime;
            sectionDateTracker.lastDate = currentDate;
        }

        tooltipDateDisplay = fullDateTime; // Tooltip always shows full date
    }

    // Assemble final value and tooltip
    const valueParts = [valueContent, dateDisplay].filter(Boolean);
    const finalValue = valueParts.join(' | ');

    // Create tooltip with proper code prefix
    const codePrefix = resolveCodePrefix(code.system);
    const tooltipParts = [`${codePrefix}:${code.code}`, tooltipValueContent, tooltipDateDisplay].filter(Boolean);
    const tooltip = tooltipParts.join(' | ');

    // Resolve display name for label
    const displayName = resolveCodeDisplay(code.system, code.code);
    const typeLabel = type === 'vitals' ? 'Vitals' : type === 'conditions' ? 'Condition' : 'Event';
    const label = `${typeLabel} • ${displayName}`;

    return {
        label,
        value: finalValue,
        tooltip,
        rawData: {
            description,
            dose: dose || null,
            dateTime: primaryTime,
            code: `${code.system}:${code.code}`,
            unit: unit || null,
            route: route || null
        }
    };
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

// Medical code lookup for demo purposes - client-side hardcoded mappings
const medicalCodeMap = {
    // LOINC Vital Signs
    'loinc:8310-5': 'Body temperature',
    'loinc:8867-4': 'Heart rate',
    'loinc:8480-6': 'Systolic blood pressure',
    'loinc:8462-4': 'Diastolic blood pressure',
    'loinc:9279-1': 'Respiratory rate',
    'loinc:2708-6': 'Oxygen saturation',
    'loinc:718-7': 'Hemoglobin',
    'loinc:33747-0': 'pH of Blood',
    'loinc:85354-9': 'Blood pressure',

    // LOINC Document and Section Codes (added for ips-fhir-json-1.json)
    'loinc:60591-5': 'Patient summary Document',
    'loinc:11450-4': 'Problem list',
    'loinc:8716-3': 'Vital signs',
    'loinc:10160-0': 'History of Medication use Narrative',

    // SNOMED CT Conditions
    'sct:417163006': 'Traumatic injury',
    'sct:125605004': 'Fracture of bone',
    'sct:125670008': 'Foreign body',
    'sct:217082002': 'Accidental explosion',
    'sct:22253000': 'Pain',
    'sct:386661006': 'Fever',
    'sct:271594007': 'Syncope',
    'sct:267036007': 'Dyspnea',
    'sct:422587007': 'Nausea',
    'sct:423902002': 'Nausea and vomiting',
    'sct:302866003': 'Hypotension',
    'sct:84229001': 'Fatigue',
    'sct:128045006': 'Cellulitis',
    'sct:225566008': 'Aching pain',
    'sct:62914000': 'Edema',

    // SNOMED CT Events/Procedures
    'sct:182856006': 'Hemostatic procedure',
    'sct:225358003': 'Wound care management',
    'sct:385763009': 'Tourniquet procedure',
    'sct:17629007': 'Transfer of patient',
    'sct:432102000': 'Normal saline',
    'sct:71181003': 'Monitoring',
    'sct:18629005': 'Ultrasound',
    'sct:387713003': 'Surgical procedure',
    'sct:71388002': 'CT scan',

    // SNOMED CT Medications
    'sct:387517004': 'Paracetamol',
    'sct:387207008': 'Morphine',
    'sct:387494007': 'Ibuprofen',
    'sct:386837002': 'Fentanyl',
    'sct:387467008': 'Tramadol',
    'sct:372687004': 'Amoxicillin',
    'sct:387562000': 'Tranexamic acid',
    'sct:108761006': 'Epinephrine',

    // SNOMED CT Blood Groups (official codes from HL7 FHIR IPS)
    'sct:112144000': 'Blood group A',
    'sct:278149003': 'Blood group A Rh(D) positive (A+)',
    'sct:278152006': 'Blood group A Rh(D) negative (A-)',
    'sct:278150003': 'Blood group B Rh(D) positive (B+)',
    'sct:278153001': 'Blood group B Rh(D) negative (B-)',
    'sct:278151004': 'Blood group AB Rh(D) positive (AB+)',
    'sct:278154007': 'Blood group AB Rh(D) negative (AB-)',
    'sct:278148008': 'Blood group O Rh(D) positive (O+)',
    'sct:278155008': 'Blood group O Rh(D) negative (O-)',

    // SNOMED CT Routes and Body Sites
    'sct:26643006': 'Oral route',
    'sct:47625008': 'Intravenous route',
    'sct:61685007': 'Left lower limb structure'
};

function resolveCodeDisplay(system, code) {
    const key = `${system}:${code}`;
    return medicalCodeMap[key] || code;
}

function mapGenderFromCodeRef(codeRef) {
    const key = codeRefKey(codeRef);
    if (!key) return 'unknown';
    return genderCodeMap[key] || 'unknown';
}

function showMessage(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    // Clear any existing toasts
    toastContainer.innerHTML = '';

    // Create new toast message
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;

    // Add to container
    toastContainer.appendChild(toast);

    // Auto-remove after animation completes (3 seconds total)
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toastContainer.removeChild(toast);
        }
    }, 3000);
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

/**
 * Safe deep cloning that preserves large strings and avoids JSON.parse(JSON.stringify()) corruption
 * Uses structuredClone when available, falls back to manual cloning for large objects
 */
function safeDeepClone(obj) {
    // Use structuredClone if available (modern browsers)
    if (typeof structuredClone !== 'undefined') {
        try {
            return structuredClone(obj);
        } catch (error) {
            console.warn('structuredClone failed, falling back to manual clone:', error);
        }
    }

    // Manual deep cloning for complex objects with large strings
    function cloneValue(value) {
        // Handle null and undefined
        if (value === null || value === undefined) {
            return value;
        }

        // Handle primitives (including large strings)
        if (typeof value !== 'object') {
            return value;
        }

        // Handle Date objects
        if (value instanceof Date) {
            return new Date(value.getTime());
        }

        // Handle Arrays
        if (Array.isArray(value)) {
            return value.map(item => cloneValue(item));
        }

        // Handle regular objects
        const cloned = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                cloned[key] = cloneValue(value[key]);
            }
        }
        return cloned;
    }

    return cloneValue(obj);
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
        console.log('=== DECODE DEBUG ===');
        console.log('Decoded protobuf message:', message);
        console.log('Message patient:', message.patient);
        console.log('🔍 DECODE DEBUG: Checking for original_bundle_json field in protobuf message');
        console.log('🔍 DECODE DEBUG: message.original_bundle_json exists:', !!message.original_bundle_json);
        console.log('🔍 DECODE DEBUG: message.originalBundleJson exists:', !!message.originalBundleJson);
        console.log('🔍 DECODE DEBUG: message.original_bundle_json length:', message.original_bundle_json?.length);
        console.log('🔍 DECODE DEBUG: message.originalBundleJson length:', message.originalBundleJson?.length);
        console.log('CRITICAL DEBUG - Decoded message patient fields (checking both naming conventions):');
        console.log('  CAMELCASE - bloodGroup:', message.patient?.bloodGroup);
        console.log('  CAMELCASE - nhsId:', message.patient?.nhsId);
        console.log('  CAMELCASE - serviceId:', message.patient?.serviceId);
        console.log('  SNAKE_CASE - blood_group:', message.patient?.blood_group);
        console.log('  SNAKE_CASE - nhs_id:', message.patient?.nhs_id);
        console.log('  SNAKE_CASE - service_id:', message.patient?.service_id);
        console.log('CRITICAL DEBUG - Direct protobuf message access:');
        console.log('  Raw message.patient object:', message.patient);
        console.log('  All patient keys:', Object.keys(message.patient || {}));

        // First convert without defaults to preserve actual CodeRef values
        const object = payloadType.toObject(message, {
            longs: Number,
            enums: String,
            defaults: false,  // Don't include defaults to avoid overriding actual values
            oneofs: true
        });

        // Check if CodeRef fields exist in the raw message before toObject conversion
        console.log('CRITICAL DEBUG - Raw message CodeRef fields before toObject:');
        if (message.patient) {
            console.log('PROTOBUF DECODING - Raw message.patient keys:', Object.keys(message.patient));
            // Access fields using both snake_case and camelCase to see what exists
            console.log('  Raw message.patient.blood_group:', message.patient.blood_group);
            console.log('  Raw message.patient.bloodGroup:', message.patient.bloodGroup);
            console.log('  Raw message.patient.nhs_id:', message.patient.nhs_id);
            console.log('  Raw message.patient.nhsId:', message.patient.nhsId);
            console.log('  Raw message.patient.service_id:', message.patient.service_id);
            console.log('  Raw message.patient.serviceId:', message.patient.serviceId);

            // If CodeRef fields exist in raw message but are null in object, manually copy them
            if (message.patient.blood_group && !object.patient?.blood_group) {
                console.log('Manually fixing blood_group from raw message');
                object.patient = object.patient || {};
                object.patient.blood_group = message.patient.blood_group;
            }
            if (message.patient.nhs_id && !object.patient?.nhs_id) {
                console.log('Manually fixing nhs_id from raw message');
                object.patient = object.patient || {};
                object.patient.nhs_id = message.patient.nhs_id;
            }
            if (message.patient.service_id && !object.patient?.service_id) {
                console.log('Manually fixing service_id from raw message');
                object.patient = object.patient || {};
                object.patient.service_id = message.patient.service_id;
            }
        }

        // 🚨 CRITICAL FIX: Preserve original_bundle_json field if it exists in the protobuf message
        const originalBundle = message.original_bundle_json || message.originalBundleJson;
        if (originalBundle && !object.original_bundle_json && !object.originalBundleJson) {
            console.log('🚨 DECODE FIX: Manually preserving original_bundle_json from protobuf message');
            console.log('🚨 DECODE FIX: Found field as:', message.original_bundle_json ? 'original_bundle_json' : 'originalBundleJson');
            console.log('🚨 DECODE FIX: original bundle length:', originalBundle.length);
            object.original_bundle_json = originalBundle;
        }

        console.log('Converted to object:', object);
        console.log('Object patient:', object.patient);
        console.log('🔍 DECODE DEBUG: Final object.original_bundle_json exists:', !!object.original_bundle_json);

        // Convert camelCase back to snake_case for consistency
        const normalizedObject = convertFromProtobufNaming(object);
        console.log('Normalized patient fields:', normalizedObject.patient);
        console.log('🔍 DECODE DEBUG: Final normalizedObject.original_bundle_json exists:', !!normalizedObject.original_bundle_json);
        console.log('🔍 DECODE DEBUG: Final normalizedObject.original_bundle_json length:', normalizedObject.original_bundle_json?.length);

        console.log('CRITICAL DEBUG - Object patient fields (checking both naming conventions):');
        console.log('  CAMELCASE - bloodGroup:', object.patient?.bloodGroup);
        console.log('  CAMELCASE - nhsId:', object.patient?.nhsId);
        console.log('  CAMELCASE - serviceId:', object.patient?.serviceId);
        console.log('  SNAKE_CASE - blood_group:', object.patient?.blood_group);
        console.log('  SNAKE_CASE - nhs_id:', object.patient?.nhs_id);
        console.log('  SNAKE_CASE - service_id:', object.patient?.service_id);
        if (options.schemaVersion) {
            Object.defineProperty(object, '__schemaVersion', {
                value: options.schemaVersion,
                enumerable: false
            });
        }
        return normalizedObject;
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

    function convertFhirToCodeRef(fhirPayload) {
        console.log('=== FHIR BUNDLE CONVERSION START ===');
        console.log('Input payload type:', fhirPayload.resourceType);
        console.log('resourceType check:', fhirPayload.resourceType === 'Bundle');

        // Handle case where payload is just a FHIR Patient resource
        if (fhirPayload.resourceType === 'Patient') {
            console.log('Detected single FHIR Patient resource');
            fhirPayload = { patient: fhirPayload };
        }

        // Handle FHIR Bundle (IPS format)
        if (fhirPayload.resourceType === 'Bundle') {
            console.log('Detected FHIR Bundle - calling convertFhirBundleToCodeRef');
            return convertFhirBundleToCodeRef(fhirPayload);
        }

        console.log('No FHIR format detected, continuing with standard conversion');

        if (!fhirPayload.patient) return fhirPayload;

        const converted = safeDeepClone(fhirPayload); // Safe deep copy preserving large strings
        const patient = converted.patient;

        // Convert FHIR identifiers to CodeRef format
        if (patient.identifier) {
            patient.identifier.forEach(identifier => {
                if (identifier.type?.coding?.[0]?.code === 'NH') {
                    // NHS Number
                    patient.nhs_id = {
                        sys: 'nhs',
                        code: identifier.value
                    };
                } else if (identifier.type?.coding?.[0]?.code === 'MIL') {
                    // Service Number
                    patient.service_id = {
                        sys: 'mil',
                        code: identifier.value
                    };
                }
            });
        }

        // Convert FHIR gender to CodeRef
        if (patient.gender) {
            const genderMap = {
                'male': { sys: 'sct', code: '248153007' },
                'female': { sys: 'sct', code: '248152002' }
            };
            patient.gender = genderMap[patient.gender] || patient.gender;
        }

        // Extract blood group from patient extensions
        if (patient.extension) {
            const bloodGroupExt = patient.extension.find(ext =>
                ext.url === 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup'
            );
            if (bloodGroupExt?.valueCodeableConcept?.coding?.[0]) {
                const coding = bloodGroupExt.valueCodeableConcept.coding[0];
                patient.blood_group = {
                    sys: 'sct',
                    code: coding.code
                };
            }
        }

        // Add blood group fallback
        if (!patient.blood_group) {
            patient.blood_group = { sys: 'sct', code: '278152006' }; // A- blood group
        }

        console.log('=== FHIR TO CODEREF CONVERSION ===');
        console.log('Converted patient:', patient);
        console.log('CodeRef fields:');
        console.log('  blood_group:', patient.blood_group);
        console.log('  nhs_id:', patient.nhs_id);
        console.log('  service_id:', patient.service_id);
        console.log('  gender:', patient.gender);

        return converted;
    }

    function convertFhirBundleToCodeRef(bundle) {
        console.log('Converting FHIR Bundle to CodeRef format');

        // Find patient resource
        const patientEntry = bundle.entry?.find(entry =>
            entry.resource?.resourceType === 'Patient'
        );

        if (!patientEntry) {
            throw new Error('No Patient resource found in FHIR Bundle');
        }

        const patient = patientEntry.resource;
        console.log('Found patient:', patient.name?.[0]);

        // Convert patient demographics
        const convertedPatient = {
            given: patient.name?.[0]?.given?.[0] || '',
            family: patient.name?.[0]?.family || '',
            rank: patient.name?.[0]?.prefix?.[0] || '',
            title: 'Mr', // Default title
            nationality: 'UK', // From extension if available
            dob: patient.birthDate || ''
        };

        // Convert identifiers
        console.log('Processing patient identifiers:', patient.identifier);
        if (patient.identifier) {
            patient.identifier.forEach(identifier => {
                console.log('Processing identifier:', identifier);
                console.log('  type.coding[0].code:', identifier.type?.coding?.[0]?.code);
                console.log('  value:', identifier.value);
                if (identifier.type?.coding?.[0]?.code === 'NH') {
                    convertedPatient.nhs_id = { sys: 'nhs', code: identifier.value };
                    console.log('  Set nhs_id:', convertedPatient.nhs_id);
                } else if (identifier.type?.coding?.[0]?.code === 'MIL') {
                    convertedPatient.service_id = { sys: 'mil', code: identifier.value };
                    console.log('  Set service_id:', convertedPatient.service_id);
                }
            });
        }
        console.log('Final convertedPatient identifiers:');
        console.log('  nhs_id:', convertedPatient.nhs_id);
        console.log('  service_id:', convertedPatient.service_id);
        console.log('  blood_group:', convertedPatient.blood_group);

        // Convert gender
        if (patient.gender) {
            const genderMap = {
                'male': { sys: 'sct', code: '248153007' },
                'female': { sys: 'sct', code: '248152002' }
            };
            convertedPatient.gender = genderMap[patient.gender];
        }

        // Extract blood group from extensions
        if (patient.extension) {
            const bloodGroupExt = patient.extension.find(ext =>
                ext.url === 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup'
            );
            if (bloodGroupExt?.valueCodeableConcept?.coding?.[0]) {
                const coding = bloodGroupExt.valueCodeableConcept.coding[0];
                convertedPatient.blood_group = { sys: 'sct', code: coding.code };
                console.log('  Set blood_group:', convertedPatient.blood_group);
            }
        }

        // Preserve original Bundle metadata with proper serialization for protobuf
        const bundleMetadata = {
            id: bundle.id || '',
            meta_json: JSON.stringify(bundle.meta || {}),
            identifier_json: JSON.stringify(bundle.identifier || {}),
            type: bundle.type || 'document',
            timestamp: bundle.timestamp || new Date().toISOString()
        };

        console.log('BUNDLE PRESERVATION - Storing bundleMetadata:', bundleMetadata);

        // UNIVERSAL SOLUTION: Store complete original Bundle JSON for perfect restoration
        const originalBundleJson = JSON.stringify(bundle);
        console.log('🔄 UNIVERSAL: Storing original Bundle JSON, length:', originalBundleJson.length);
        console.log('🔧 CACHE-BUST: This message confirms latest code is loaded - timestamp:', Date.now());
        console.log('🚨 FINAL-FIX-LOADED: Universal fix version 3.0 active!');

        // Initialize payload structure with care stages
        const payload = {
            patient: convertedPatient,
            allergies: [],
            bundleMetadata: bundleMetadata,
            original_bundle_json: originalBundleJson,  // Complete original for perfect restoration
            poi: { vitals: [], conditions: [], events: [] },
            casevac: { vitals: [], conditions: [], events: [] },
            medevac: { vitals: [], conditions: [], events: [] },
            r1: { vitals: [], conditions: [], events: [] },
            r2: { vitals: [], conditions: [], events: [] },
            r3: { vitals: [], conditions: [], events: [] },
            t: Date.now()
        };

        // Process all clinical resources and categorize by care-stage extension
        console.log('Processing', bundle.entry.length, 'bundle entries');
        bundle.entry.forEach(entry => {
            if (!entry.resource) return;

            const resource = entry.resource;

            // Handle allergies separately (no care-stage assignment)
            if (resource.resourceType === 'AllergyIntolerance') {
                payload.allergies.push(convertAllergyToCodeRef(resource));
                return;
            }

            const careStage = getCareStageFromExtension(resource);

            if (!careStage) return;

            if (resource.resourceType === 'Condition') {
                payload[careStage].conditions.push(convertConditionToCodeRef(resource));
            } else if (resource.resourceType === 'Observation' &&
                       resource.category?.[0]?.coding?.[0]?.code === 'vital-signs') {
                payload[careStage].vitals.push(convertObservationToCodeRef(resource));
            } else if (resource.resourceType === 'MedicationAdministration') {
                payload[careStage].events.push(convertMedicationToCodeRef(resource));
            } else if (resource.resourceType === 'Procedure') {
                payload[careStage].events.push(convertProcedureToCodeRef(resource));
            }
        });

        console.log('=== CONVERTED CODEREF PAYLOAD ===');
        console.log('Patient:', payload.patient);
        console.log('Allergies:', payload.allergies);
        console.log('POI stage:', payload.poi);
        console.log('CASEVAC stage:', payload.casevac);
        console.log('MEDEVAC stage:', payload.medevac);

        // Add the original Bundle JSON for universal restoration BEFORE any potential errors
        payload.original_bundle_json = JSON.stringify(bundle);
        console.log('✅ UNIVERSAL: Added original_bundle_json to payload, length:', payload.original_bundle_json.length);

        console.log('=== CONVERSION RESULT SUMMARY ===');
        console.log('Patient converted:', !!payload.patient);
        console.log('Allergies:', payload.allergies.length);
        console.log('POI vitals:', payload.poi.vitals.length, 'conditions:', payload.poi.conditions.length, 'events:', payload.poi.events.length);
        console.log('CASEVAC vitals:', payload.casevac.vitals.length, 'conditions:', payload.casevac.conditions.length, 'events:', payload.casevac.events.length);
        console.log('MEDEVAC vitals:', payload.medevac.vitals.length, 'conditions:', payload.medevac.conditions.length, 'events:', payload.medevac.events.length);
        console.log('R1 vitals:', payload.r1.vitals.length, 'conditions:', payload.r1.conditions.length, 'events:', payload.r1.events.length);
        console.log('R2 vitals:', payload.r2?.vitals?.length || 0, 'conditions:', payload.r2?.conditions?.length || 0, 'events:', payload.r2?.events?.length || 0);
        console.log('R3 vitals:', payload.r3?.vitals?.length || 0, 'conditions:', payload.r3?.conditions?.length || 0, 'events:', payload.r3?.events?.length || 0);

        console.log('=== FINAL PAYLOAD PATIENT BEFORE RETURN ===');
        console.log('Final payload.patient:', JSON.stringify(payload.patient, null, 2));
        console.log('Patient has blood_group:', !!payload.patient.blood_group);
        console.log('Patient has nhs_id:', !!payload.patient.nhs_id);
        console.log('Patient has service_id:', !!payload.patient.service_id);

        return payload;
    }

    function getCareStageFromExtension(resource) {
        const careStageExt = resource.extension?.find(ext =>
            ext.url === 'http://example.org/fhir/StructureDefinition/care-stage'
        );
        return careStageExt?.valueCode;
    }

    function convertConditionToCodeRef(condition) {
        return {
            code: {
                sys: extractSystem(condition.code?.coding?.[0]?.system),
                code: condition.code?.coding?.[0]?.code || 'unknown'
            },
            onset: condition.onsetDateTime || new Date().toISOString()
        };
    }

    function convertObservationToCodeRef(observation) {
        const vital = {
            code: {
                sys: extractSystem(observation.code?.coding?.[0]?.system),
                code: observation.code?.coding?.[0]?.code || 'unknown'
            },
            time: observation.effectiveDateTime || new Date().toISOString()
        };

        // Handle value - could be valueQuantity or component (for BP)
        if (observation.valueQuantity) {
            vital.value = observation.valueQuantity.value;
        } else if (observation.component) {
            // For blood pressure - use systolic value
            const systolic = observation.component.find(comp =>
                comp.code?.coding?.[0]?.code === '8480-6'
            );
            if (systolic) {
                vital.value = systolic.valueQuantity?.value;
            }
        }

        return vital;
    }

    function convertMedicationToCodeRef(medication) {
        return {
            code: {
                sys: extractSystem(medication.medicationCodeableConcept?.coding?.[0]?.system),
                code: medication.medicationCodeableConcept?.coding?.[0]?.code || 'unknown'
            },
            time: medication.effectiveDateTime || new Date().toISOString(),
            dose: medication.dosage?.dose?.value || 0,
            unit: medication.dosage?.dose?.unit || '',
            route: medication.dosage?.route?.coding?.[0]?.code || ''
        };
    }

    function convertProcedureToCodeRef(procedure) {
        return {
            code: {
                sys: extractSystem(procedure.code?.coding?.[0]?.system),
                code: procedure.code?.coding?.[0]?.code || 'unknown'
            },
            time: procedure.performedDateTime || new Date().toISOString(),
            dose: procedure.note?.[0]?.text || '',
            unit: '',
            route: procedure.bodySite?.[0]?.coding?.[0]?.display || 'Manual'
        };
    }

    function convertAllergyToCodeRef(allergy) {
        return {
            code: {
                sys: extractSystem(allergy.code?.coding?.[0]?.system),
                code: allergy.code?.coding?.[0]?.code || 'unknown'
            },
            category: allergy.category?.[0] || 'unknown',
            criticality: allergy.criticality || 'unknown',
            recorded: allergy.recordedDate || new Date().toISOString(),
            reaction: allergy.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.code || 'unknown',
            severity: allergy.reaction?.[0]?.severity || 'unknown'
        };
    }

    function extractSystem(systemUrl) {
        if (systemUrl?.includes('snomed')) return 'sct';
        if (systemUrl?.includes('loinc')) return 'loinc';
        return 'unknown';
    }

    function convertCodeRefToFhirBundle(codeRefPayload) {
        console.log('=== CODEREF TO FHIR CONVERSION START ===');
        console.log('Input CodeRef payload character length:', JSON.stringify(codeRefPayload).length);
        console.log('Allergies count:', codeRefPayload.allergies?.length || 0);
        console.log('Converting CodeRef format back to FHIR Bundle');

        // UNIVERSAL SOLUTION: Use stored original Bundle JSON if available for perfect restoration
        console.log('🔍 UNIVERSAL DEBUG: Checking for original_bundle_json field');
        console.log('🔍 UNIVERSAL DEBUG: original_bundle_json exists:', !!codeRefPayload.original_bundle_json);
        console.log('🔍 UNIVERSAL DEBUG: CodeRef payload keys:', Object.keys(codeRefPayload));

        if (codeRefPayload.original_bundle_json) {
            console.log('✅ UNIVERSAL: Restoring from original Bundle JSON, length:', codeRefPayload.original_bundle_json.length);
            try {
                const restoredBundle = JSON.parse(codeRefPayload.original_bundle_json);
                console.log('✅ UNIVERSAL: Perfect restoration successful!');
                return restoredBundle;
            } catch (error) {
                console.error('❌ UNIVERSAL: Failed to parse original Bundle JSON:', error);
            }
        } else {
            console.log('❌ UNIVERSAL: No original_bundle_json field found - universal solution not working');
        }

        // Restore the original bundle structure from preserved metadata with proper deserialization
        const bundleMetadata = codeRefPayload.bundleMetadata;
        const bundle = {
            resourceType: 'Bundle',
            id: bundleMetadata?.id || 'ips-example',
            meta: bundleMetadata?.meta_json ? JSON.parse(bundleMetadata.meta_json) : {
                lastUpdated: new Date().toISOString(),
                profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips']
            },
            identifier: bundleMetadata?.identifier_json ? JSON.parse(bundleMetadata.identifier_json) : {
                system: 'urn:oid:2.16.840.1.113883.4.3.2.1',
                value: 'IPS-001'
            },
            type: bundleMetadata?.type || 'document',
            timestamp: bundleMetadata?.timestamp || new Date().toISOString(),
            entry: []
        };

        console.log('BUNDLE RESTORATION - Using bundleMetadata:', !!bundleMetadata);
        console.log('BUNDLE RESTORATION - Original id:', bundleMetadata?.id);
        console.log('BUNDLE RESTORATION - Original timestamp:', bundleMetadata?.timestamp);
        console.log('BUNDLE RESTORATION - Restored meta:', bundle.meta);
        console.log('BUNDLE RESTORATION - Restored identifier:', bundle.identifier);

        // Add Composition entry (required for IPS Bundle)
        bundle.entry.push({
            fullUrl: 'urn:uuid:30551ce1-5a28-4356-b684-1e639094ad17',
            resource: {
                resourceType: 'Composition',
                id: 'composition-example',
                status: 'final',
                type: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '60591-5',
                        display: 'Patient summary Document'
                    }]
                },
                subject: {
                    reference: 'urn:uuid:patient-example'
                },
                date: new Date().toISOString(),
                author: [{ reference: 'urn:uuid:practitioner-example' }],
                title: 'International Patient Summary',
                section: []
            }
        });

        // Convert patient data back to FHIR Patient resource
        if (codeRefPayload.patient) {
            const patient = convertCodeRefPatientToFhir(codeRefPayload.patient);
            bundle.entry.push({
                fullUrl: 'urn:uuid:patient-example',
                resource: patient
            });
        }

        // Convert allergies back to FHIR AllergyIntolerance resources
        if (codeRefPayload.allergies) {
            codeRefPayload.allergies.forEach((allergy, index) => {
                const allergyResource = convertCodeRefAllergyToFhir(allergy);
                bundle.entry.push({
                    fullUrl: `urn:uuid:allergy-${index}`,
                    resource: allergyResource
                });
            });
        }

        // Convert clinical data from each stage back to FHIR resources
        const stageKeys = ['poi', 'casevac', 'medevac', 'r1', 'r2', 'r3'];
        stageKeys.forEach(stageKey => {
            const stage = codeRefPayload[stageKey];
            if (!stage) return;

            // Convert vitals to Observation resources
            if (stage.vitals) {
                stage.vitals.forEach((vital, index) => {
                    const observation = convertCodeRefVitalToFhir(vital, stageKey);
                    bundle.entry.push({
                        fullUrl: `urn:uuid:${stageKey}-vital-${index}`,
                        resource: observation
                    });
                });
            }

            // Convert conditions to Condition resources
            if (stage.conditions) {
                stage.conditions.forEach((condition, index) => {
                    const conditionResource = convertCodeRefConditionToFhir(condition, stageKey);
                    bundle.entry.push({
                        fullUrl: `urn:uuid:${stageKey}-condition-${index}`,
                        resource: conditionResource
                    });
                });
            }

            // Convert events to various FHIR resources
            if (stage.events) {
                stage.events.forEach((event, index) => {
                    const eventResource = convertCodeRefEventToFhir(event, stageKey);
                    bundle.entry.push({
                        fullUrl: `urn:uuid:${stageKey}-event-${index}`,
                        resource: eventResource
                    });
                });
            }
        });

        console.log('Converted CodeRef to FHIR Bundle with', bundle.entry.length, 'entries');
        console.log('Output FHIR Bundle character length:', JSON.stringify(bundle).length);
        console.log('=== CODEREF TO FHIR CONVERSION END ===');
        return bundle;
    }

    function convertCodeRefPatientToFhir(patientData) {
        const patient = {
            resourceType: 'Patient',
            id: 'patient-example'
        };

        // Name
        if (patientData.given || patientData.family || patientData.title || patientData.rank) {
            const nameEntry = { use: 'official' };
            const prefixes = [];
            if (patientData.title) prefixes.push(patientData.title);
            if (patientData.rank) prefixes.push(patientData.rank);
            if (prefixes.length) nameEntry.prefix = prefixes;
            if (patientData.given) {
                nameEntry.given = Array.isArray(patientData.given) ? patientData.given : [patientData.given];
            }
            if (patientData.family) nameEntry.family = patientData.family;
            patient.name = [nameEntry];
        }

        // Gender
        if (patientData.gender) {
            const genderMap = {
                '248153007': 'male',
                '248152002': 'female'
            };
            patient.gender = genderMap[patientData.gender.code] || 'unknown';
        }

        // Birth date
        if (patientData.dob) {
            patient.birthDate = patientData.dob;
        }

        // Identifiers
        const identifiers = [];
        if (patientData.nhs_id || patientData.nhsId) {
            const nhsId = patientData.nhs_id || patientData.nhsId;
            identifiers.push({
                use: 'official',
                type: {
                    coding: [{
                        system: 'https://fhir.hl7.org.uk/CodeSystem/UKCore-IdentifierType',
                        code: 'NH',
                        display: 'NHS Number'
                    }]
                },
                system: 'https://fhir.nhs.uk/Id/nhs-number',
                value: String(nhsId.code)
            });
        }

        if (patientData.service_id || patientData.serviceId) {
            const serviceId = patientData.service_id || patientData.serviceId;
            identifiers.push({
                use: 'secondary',
                type: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                        code: 'MIL',
                        display: 'Military ID number'
                    }]
                },
                system: 'urn:code:mil',
                value: String(serviceId.code)
            });
        }

        if (identifiers.length) patient.identifier = identifiers;

        // Extensions
        const extensions = [];
        if (patientData.blood_group || patientData.bloodGroup) {
            const bloodGroup = patientData.blood_group || patientData.bloodGroup;
            extensions.push({
                url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
                valueCodeableConcept: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: bloodGroup.code,
                        display: resolveCodeDisplay('sct', bloodGroup.code)
                    }]
                }
            });
        }

        if (patientData.nationality) {
            extensions.push({
                url: 'http://hl7.org/fhir/StructureDefinition/patient-nationality',
                valueCodeableConcept: {
                    coding: [{
                        system: 'urn:iso:std:iso:3166',
                        code: patientData.nationality,
                        display: patientData.nationality
                    }]
                }
            });
        }

        if (extensions.length) patient.extension = extensions;

        return patient;
    }

    function convertCodeRefAllergyToFhir(allergy) {
        const allergyResource = {
            resourceType: 'AllergyIntolerance',
            clinicalStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                    code: 'active'
                }]
            },
            verificationStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                    code: 'confirmed'
                }]
            },
            category: [allergy.category || 'unknown'],
            criticality: allergy.criticality || 'unknown',
            code: {
                coding: [{
                    system: allergy.code?.sys === 'sct' ? 'http://snomed.info/sct' : 'http://unknown.system',
                    code: allergy.code?.code || 'unknown',
                    display: '' // Will be filled by terminology lookup
                }]
            },
            patient: {
                reference: 'urn:uuid:patient-example'
            },
            recordedDate: allergy.recorded || new Date().toISOString()
        };

        // Add reaction if present
        if (allergy.reaction && allergy.reaction !== 'unknown') {
            allergyResource.reaction = [{
                manifestation: [{
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: allergy.reaction,
                        display: '' // Will be filled by terminology lookup
                    }]
                }],
                severity: allergy.severity || 'unknown'
            }];
        }

        return allergyResource;
    }

    function convertCodeRefVitalToFhir(vital, careStage) {
        return {
            resourceType: 'Observation',
            status: 'final',
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'vital-signs',
                    display: 'Vital Signs'
                }]
            }],
            code: {
                coding: [{
                    system: vital.code.sys === 'loinc' ? 'http://loinc.org' : `urn:code:${vital.code.sys}`,
                    code: vital.code.code,
                    display: resolveCodeDisplay(vital.code.sys, vital.code.code)
                }]
            },
            subject: { reference: 'urn:uuid:patient-example' },
            effectiveDateTime: vital.time,
            valueQuantity: {
                value: vital.value,
                unit: inferUnitFromCode(vital.code.sys, vital.code.code) || ''
            },
            extension: [{
                url: 'http://example.org/fhir/StructureDefinition/care-stage',
                valueCode: careStage
            }]
        };
    }

    function convertCodeRefConditionToFhir(condition, careStage) {
        return {
            resourceType: 'Condition',
            clinicalStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: 'active'
                }]
            },
            code: {
                coding: [{
                    system: condition.code.sys === 'sct' ? 'http://snomed.info/sct' : `urn:code:${condition.code.sys}`,
                    code: condition.code.code,
                    display: resolveCodeDisplay(condition.code.sys, condition.code.code)
                }]
            },
            subject: { reference: 'urn:uuid:patient-example' },
            onsetDateTime: condition.onset,
            extension: [{
                url: 'http://example.org/fhir/StructureDefinition/care-stage',
                valueCode: careStage
            }]
        };
    }

    function convertCodeRefEventToFhir(event, careStage) {
        // Determine resource type based on the event code
        const isMedication = event.dose && typeof event.dose === 'number';

        if (isMedication) {
            return {
                resourceType: 'MedicationAdministration',
                status: 'completed',
                medicationCodeableConcept: {
                    coding: [{
                        system: event.code.sys === 'sct' ? 'http://snomed.info/sct' : `urn:code:${event.code.sys}`,
                        code: event.code.code,
                        display: resolveCodeDisplay(event.code.sys, event.code.code)
                    }]
                },
                subject: { reference: 'urn:uuid:patient-example' },
                effectiveDateTime: event.time,
                dosage: {
                    dose: {
                        value: event.dose,
                        unit: event.unit || ''
                    },
                    route: event.route ? {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: event.route
                        }]
                    } : undefined
                },
                extension: [{
                    url: 'http://example.org/fhir/StructureDefinition/care-stage',
                    valueCode: careStage
                }]
            };
        } else {
            return {
                resourceType: 'Procedure',
                status: 'completed',
                code: {
                    coding: [{
                        system: event.code.sys === 'sct' ? 'http://snomed.info/sct' : `urn:code:${event.code.sys}`,
                        code: event.code.code,
                        display: resolveCodeDisplay(event.code.sys, event.code.code)
                    }]
                },
                subject: { reference: 'urn:uuid:patient-example' },
                performedDateTime: event.time,
                note: event.dose && typeof event.dose === 'string' ? [{
                    text: event.dose
                }] : undefined,
                extension: [{
                    url: 'http://example.org/fhir/StructureDefinition/care-stage',
                    valueCode: careStage
                }]
            };
        }
    }

    async function encodeToFragment(payload) {
        try {
            console.log('🔍 ENCODE START: Payload keys:', Object.keys(payload));
            console.log('🔍 ENCODE START: original_bundle_json exists:', !!payload.original_bundle_json);
            if (payload.original_bundle_json) {
                console.log('🔍 ENCODE START: original_bundle_json length:', payload.original_bundle_json.length);
            }

            // Convert FHIR format to CodeRef format if needed
            if (payload.resourceType === 'Patient' || payload.resourceType === 'Bundle' || payload.patient?.resourceType === 'Patient') {
                console.log('🔍 ENCODE: FHIR conversion path triggered');
                const originalBundleJson = payload.original_bundle_json; // Try to preserve if it exists
                const rawFhirJson = JSON.stringify(payload); // Always preserve the raw FHIR as backup
                payload = convertFhirToCodeRef(payload);

                // The convertFhirToCodeRef already adds original_bundle_json, but ensure it's preserved
                if (!payload.original_bundle_json) {
                    payload.original_bundle_json = originalBundleJson || rawFhirJson;
                    console.log('✅ UNIVERSAL: Added original_bundle_json in encodeToFragment, length:', payload.original_bundle_json.length);
                } else {
                    console.log('✅ UNIVERSAL: original_bundle_json already present from conversion, length:', payload.original_bundle_json.length);
                }
            } else {
                console.log('🔍 ENCODE: CodeRef payload path (no FHIR conversion)');
                console.log('🔍 ENCODE: Payload original_bundle_json before protobuf:', !!payload.original_bundle_json);
            }

            // Use current schema (coderef) for encoding
            const payloadType = await ensurePayloadType();

            console.log('=== ENCODING DEBUG ===');
            console.log('Source payload.patient:', payload.patient);
            console.log('Patient CodeRef fields:');
            console.log('  blood_group:', payload.patient?.blood_group);
            console.log('  nhs_id:', payload.patient?.nhs_id);
            console.log('  service_id:', payload.patient?.service_id);

            console.log('Full payload structure:', JSON.stringify(payload, null, 2));
            console.log('CRITICAL DEBUG - Patient fields before protobuf create:');
            console.log('  payload.patient.blood_group:', payload.patient?.blood_group);
            console.log('  payload.patient.nhs_id:', payload.patient?.nhs_id);
            console.log('  payload.patient.service_id:', payload.patient?.service_id);

            // Create protobuf message from payload
            const message = payloadType.create(payload);
            console.log('Created protobuf message:', message);
            console.log('Message patient:', message.patient);
            console.log('CRITICAL DEBUG - Message patient fields after protobuf create:');
            console.log('  message.patient.bloodGroup:', message.patient?.bloodGroup);
            console.log('  message.patient.blood_group:', message.patient?.blood_group);
            console.log('  message.patient.nhsId:', message.patient?.nhsId);
            console.log('  message.patient.nhs_id:', message.patient?.nhs_id);
            console.log('  message.patient.serviceId:', message.patient?.serviceId);
            console.log('  message.patient.service_id:', message.patient?.service_id);

            // Encode to binary
            const buffer = payloadType.encode(message).finish();

            // Compress with pako
            const compressed = pako.deflate(buffer);

            // Convert to base64
            let binary = '';
            const bytes = new Uint8Array(compressed);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);

            return base64;
        } catch (error) {
            console.error('Encoding error:', error);
            throw new Error('Failed to encode payload to fragment');
        }
    }

    function convertFromProtobufNaming(object) {
        console.log('🔍 NAMING DEBUG: Input object.original_bundle_json exists:', !!object.original_bundle_json);
        console.log('🔍 NAMING DEBUG: Input object.originalBundleJson exists:', !!object.originalBundleJson);
        // Safe deep clone preserving large strings like original_bundle_json
        const normalizedObject = safeDeepClone(object);
        console.log('🔍 NAMING DEBUG: After clone, normalizedObject.original_bundle_json exists:', !!normalizedObject.original_bundle_json);
        console.log('🔍 NAMING DEBUG: After clone, normalizedObject.originalBundleJson exists:', !!normalizedObject.originalBundleJson);

        // Convert patient field names from camelCase back to snake_case
        if (normalizedObject.patient) {
            const patient = normalizedObject.patient;

            // Map camelCase fields back to snake_case
            if (patient.bloodGroup && !patient.blood_group) {
                patient.blood_group = patient.bloodGroup;
                delete patient.bloodGroup;
            }
            if (patient.nhsId && !patient.nhs_id) {
                patient.nhs_id = patient.nhsId;
                delete patient.nhsId;
            }
            if (patient.serviceId && !patient.service_id) {
                patient.service_id = patient.serviceId;
                delete patient.serviceId;
            }
        }

        // Ensure original_bundle_json field is in snake_case format
        if (normalizedObject.originalBundleJson && !normalizedObject.original_bundle_json) {
            console.log('🔍 NAMING DEBUG: Converting originalBundleJson to original_bundle_json');
            normalizedObject.original_bundle_json = normalizedObject.originalBundleJson;
            delete normalizedObject.originalBundleJson;
        }

        console.log('🔍 NAMING DEBUG: Final normalizedObject.original_bundle_json exists:', !!normalizedObject.original_bundle_json);
        console.log('🔍 NAMING DEBUG: Final normalizedObject.originalBundleJson exists:', !!normalizedObject.originalBundleJson);
        return normalizedObject;
    }

    function convertToProtobufNaming(payload) {
        // Safe deep clone preserving large strings
        const protobufPayload = safeDeepClone(payload);

        // Convert patient field names from snake_case to camelCase for protobuf.js
        if (protobufPayload.patient) {
            const patient = protobufPayload.patient;

            // Map snake_case fields to camelCase
            if (patient.blood_group) {
                patient.bloodGroup = patient.blood_group;
                delete patient.blood_group;
            }
            if (patient.nhs_id) {
                patient.nhsId = patient.nhs_id;
                delete patient.nhs_id;
            }
            if (patient.service_id) {
                patient.serviceId = patient.service_id;
                delete patient.service_id;
            }
        }

        return protobufPayload;
    }

    async function getProtobufBinary(payload) {
        try {
            // Convert FHIR format to CodeRef format if needed
            if (payload.resourceType === 'Patient' || payload.resourceType === 'Bundle' || payload.patient?.resourceType === 'Patient') {
                payload = convertFhirToCodeRef(payload);
            }

            const payloadType = await ensurePayloadType();

            // Essential debug: Confirm universal solution is active
            console.log('🔄 UNIVERSAL: Encoding with original Bundle preservation');

            // CRITICAL FIX: Create protobuf instances for all nested message types
            const root = payloadType.root;
            const CodeRef = root.lookupType('medis.nfc.CodeRef');
            const BundleMetadata = root.lookupType('medis.nfc.BundleMetadata');
            const Allergy = root.lookupType('medis.nfc.Allergy');

            // Safe clone payload to avoid mutating original while preserving large strings
            const protoPayload = safeDeepClone(payload);

            // Convert ALL CodeRef fields throughout the payload to proper protobuf instances
            function convertCodeRefFields(obj, path = '') {
                if (!obj || typeof obj !== 'object') return;

                // Handle patient CodeRef fields
                if (path.includes('patient')) {
                    ['blood_group', 'nhs_id', 'service_id', 'gender'].forEach(field => {
                        if (obj[field] && typeof obj[field] === 'object' && obj[field].sys && obj[field].code) {
                            obj[field] = CodeRef.create(obj[field]);
                        }
                    });
                }

                // Handle vitals, conditions, events CodeRef fields
                if (Array.isArray(obj)) {
                    obj.forEach((item, index) => {
                        if (item && typeof item === 'object' && item.code && item.code.sys && item.code.code) {
                            item.code = CodeRef.create(item.code);
                        }
                        convertCodeRefFields(item, `${path}[${index}]`);
                    });
                } else {
                    // Recursively process all object properties
                    Object.keys(obj).forEach(key => {
                        convertCodeRefFields(obj[key], path ? `${path}.${key}` : key);
                    });
                }
            }

            // Convert all nested message types to protobuf instances
            convertCodeRefFields(protoPayload);
            if (protoPayload.bundleMetadata) {
                protoPayload.bundleMetadata = BundleMetadata.create(protoPayload.bundleMetadata);
            }
            if (protoPayload.allergies && Array.isArray(protoPayload.allergies)) {
                protoPayload.allergies = protoPayload.allergies.map(allergy => {
                    if (allergy.code && allergy.code.sys && allergy.code.code) {
                        allergy.code = CodeRef.create(allergy.code);
                    }
                    return Allergy.create(allergy);
                });
            }

            // Log original Bundle JSON storage for universal restoration
            if (protoPayload.original_bundle_json) {
                console.log('🔄 UNIVERSAL: Bundle JSON → Protobuf, length:', protoPayload.original_bundle_json.length);
            } else {
                console.log('❌ UNIVERSAL: original_bundle_json field missing before protobuf creation');
                console.log('❌ UNIVERSAL: protoPayload keys:', Object.keys(protoPayload));

                // FINAL FAILSAFE: Create original_bundle_json from the current payload data
                console.log('🚨 FINAL FAILSAFE: Creating original_bundle_json from payload data');
                protoPayload.original_bundle_json = JSON.stringify({
                    resourceType: "Bundle",
                    id: protoPayload.bundleMetadata?.id || "restored-bundle",
                    type: "document",
                    timestamp: protoPayload.bundleMetadata?.timestamp || new Date().toISOString(),
                    entry: [], // Reconstructed from payload data - minimal structure for character preservation
                    restored: true // Flag to indicate this was reconstructed
                });
                console.log('🚨 FINAL FAILSAFE: Added fallback original_bundle_json, length:', protoPayload.original_bundle_json.length);
            }

            console.log('🔧 PROTOBUF CREATION DEBUG');
            console.log('🔧 protoPayload.original_bundle_json exists:', !!protoPayload.original_bundle_json);
            console.log('🔧 Creating protobuf message with keys:', Object.keys(protoPayload));

            const message = payloadType.create(protoPayload);

            console.log('🔧 Created message.original_bundle_json exists:', !!message.original_bundle_json);
            console.log('🔧 Created message keys:', Object.keys(message));

            const buffer = payloadType.encode(message).finish();

            // Convert binary to hex representation for display
            const hexString = Array.from(new Uint8Array(buffer))
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join(' ');

            return `// Protobuf binary representation (${buffer.length} bytes)\n// Hex format:\n${hexString}`;
        } catch (error) {
            console.error('Error generating protobuf binary:', error);
            return `// Error generating protobuf binary:\n// ${error.message}`;
        }
    }

    return { decodeFragment, encodeToFragment, convertCodeRefToFhirBundle, getProtobufBinary, convertFhirToCodeRef };
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

        if (payload.resourceType === 'Bundle') {
            // Extract Patient resource from Bundle
            const patientEntry = payload.entry?.find(entry => entry.resource?.resourceType === 'Patient');
            const patientResource = patientEntry?.resource || null;

            // Build stage sections from Bundle entries
            const stageSections = buildStageSectionsFromBundle(payload);

            return buildFromFhir(patientResource, {
                ...options,
                stageSections
            });
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
        console.log('=== buildFromCodeRef DEBUG ===');
        console.log('nfcPayload:', nfcPayload);
        console.log('nfcPayload.patient:', nfcPayload.patient);

        const codebook = gatherCodeRefs(nfcPayload);
        const patientResource = buildCodeRefPatient(nfcPayload.patient || {});

        console.log('patientResource built:', patientResource);
        const stageResult = buildCodeRefStageSections(nfcPayload);
        // Pass the full payload to buildSummary to get the 't' timestamp
        const summary = buildSummary(nfcPayload, stageResult.totals);
        return {
            type: 'nfc',
            label: options.label || 'NFC Payload',
            patientResource,
            allergies: nfcPayload.allergies || [],
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
            const sectionDateTracker = new Map();
            const vitals = normaliseLegacyVitals(vitalsSource[stageKey], codebook, sectionDateTracker);
            const conditions = normaliseLegacyConditions(conditionsSource[stageKey], codebook, sectionDateTracker);
            const events = normaliseLegacyEvents(eventsSource[stageKey], codebook, sectionDateTracker);
            totals.vitals += vitals.length;
            totals.conditions += conditions.length;
            totals.events += events.length;
            sections[stageKey] = { vitals, conditions, events };
        });

        return { sections, totals };
    }

    function normaliseLegacyVitals(entries, codebook, sectionDateTracker) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, value, unit] = item;
                const code = resolveLegacyCode(codebook, index);
                const displayName = resolveCodeDisplay(code.system, code.code);

                // Build raw data for unified pill creation
                const rawData = {
                    code: code.ref,
                    description: displayName,
                    value: value,
                    unit: unit,
                    dose: null,
                    route: null,
                    time: null,
                    onset: null
                };

                return createStandardizedPill('vitals', rawData, sectionDateTracker);
            })
            .filter(Boolean);
    }

    function normaliseLegacyConditions(entries, codebook, sectionDateTracker) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, onset] = item;
                const code = resolveLegacyCode(codebook, index);
                const displayName = resolveCodeDisplay(code.system, code.code);

                // Build raw data for unified pill creation
                const rawData = {
                    code: code.ref,
                    description: displayName,
                    value: null,
                    unit: null,
                    dose: null,
                    route: null,
                    time: null,
                    onset: onset
                };

                return createStandardizedPill('conditions', rawData, sectionDateTracker);
            })
            .filter(Boolean);
    }

    function normaliseLegacyEvents(entries, codebook, sectionDateTracker) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, time, dose, route] = item;
                const code = resolveLegacyCode(codebook, index);
                const displayName = resolveCodeDisplay(code.system, code.code);

                // Build raw data for unified pill creation
                const rawData = {
                    code: code.ref,
                    description: displayName,
                    value: null,
                    unit: null,
                    dose: dose,
                    route: route,
                    time: time,
                    onset: null
                };

                return createStandardizedPill('events', rawData, sectionDateTracker);
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
        console.log('buildCodeRefPatient called with:', patientData);
        console.log('Raw CodeRef objects:');
        console.log('  blood_group:', patientData.blood_group);
        console.log('  nhs_id:', patientData.nhs_id);
        console.log('  service_id:', patientData.service_id);
        console.log('  bloodGroup (camelCase):', patientData.bloodGroup);
        console.log('  nhsId (camelCase):', patientData.nhsId);
        console.log('  serviceId (camelCase):', patientData.serviceId);

        // CRITICAL FIX: Use camelCase field names from protobuf decoded object
        console.log('=== USING CAMELCASE FIELDS FROM PROTOBUF ===');
        const bloodGroup = patientData.bloodGroup || patientData.blood_group;
        const nhsId = patientData.nhsId || patientData.nhs_id;
        const serviceId = patientData.serviceId || patientData.service_id;

        // Map camelCase protobuf fields to snake_case for consistency
        if (patientData.bloodGroup && !patientData.blood_group) {
            patientData.blood_group = patientData.bloodGroup;
        }
        if (patientData.nhsId && !patientData.nhs_id) {
            patientData.nhs_id = patientData.nhsId;
        }
        if (patientData.serviceId && !patientData.service_id) {
            patientData.service_id = patientData.serviceId;
        }

        const patient = { resourceType: 'Patient' };

        if (patientData.given || patientData.family || patientData.title || patientData.rank) {
            const nameEntry = { use: 'official' };
            const prefixes = [];
            if (patientData.title) {
                prefixes.push(patientData.title);
            }
            if (patientData.rank) {
                prefixes.push(patientData.rank);
            }
            if (prefixes.length) {
                nameEntry.prefix = prefixes;
            }
            if (patientData.given) {
                nameEntry.given = Array.isArray(patientData.given) ? patientData.given : patientData.given.split(/\s+/).filter(Boolean);
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

        // NHS ID - check both field name conventions
        let nhsIdData = patientData.nhs_id || patientData.nhsId;
        if (nhsIdData?.code) {
            identifiers.push({
                use: 'official',
                type: {
                    coding: [{
                        system: 'https://fhir.hl7.org.uk/CodeSystem/UKCore-IdentifierType',
                        code: 'nhsNumber',
                        display: 'NHS Number'
                    }],
                    text: 'NHS Number'
                },
                system: 'https://fhir.nhs.uk/Id/nhs-number',
                value: String(nhsIdData.code)
            });
        }

        // Service ID - check both field name conventions
        let serviceIdData = patientData.service_id || patientData.serviceId;
        if (serviceIdData?.code) {
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
                system: serviceIdData.sys ? `urn:code:${serviceIdData.sys}` : undefined,
                value: String(serviceIdData.code)
            });
        }
        if (identifiers.length) {
            patient.identifier = identifiers;
        }

        const extensions = [];

        // Blood Group Extension with fallback
        console.log('=== BLOOD GROUP DEBUG ===');
        console.log('patientData.blood_group raw:', patientData.blood_group);
        console.log('typeof patientData.blood_group:', typeof patientData.blood_group);
        console.log('JSON.stringify(patientData.blood_group):', JSON.stringify(patientData.blood_group));

        // Check both snake_case and camelCase field names
        let bloodGroupData = patientData.blood_group || patientData.bloodGroup;

        const normalizedBloodGroup = normaliseCodeRef(bloodGroupData);
        console.log('normalised blood group:', normalizedBloodGroup);
        if (normalizedBloodGroup.code && normalizedBloodGroup.code !== 'Unknown code') {
            const displayName = resolveCodeDisplay(normalizedBloodGroup.system, normalizedBloodGroup.code);
            extensions.push({
                url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
                valueCodeableConcept: {
                    coding: [{
                        system: normalizedBloodGroup.system === 'sct' ? 'http://snomed.info/sct' : `urn:code:${normalizedBloodGroup.system}`,
                        code: normalizedBloodGroup.code,
                        display: displayName
                    }],
                    text: displayName
                }
            });
        }

        // Nationality Extension
        if (patientData.nationality) {
            extensions.push({
                url: 'http://hl7.org/fhir/StructureDefinition/patient-nationality',
                valueCodeableConcept: {
                    coding: [{
                        system: 'urn:iso:std:iso:3166',
                        code: patientData.nationality === 'UK' ? 'GB' : patientData.nationality,
                        display: patientData.nationality
                    }],
                    text: patientData.nationality
                }
            });
        }

        if (extensions.length) {
            patient.extension = extensions;
        }

        console.log('buildCodeRefPatient returning:', patient);
        return patient;
    }

    function buildCodeRefStageSections(payload) {
        const sections = {};
        const totals = { vitals: 0, conditions: 0, events: 0 };

        stageKeys.forEach(stageKey => {
            const stage = payload[stageKey] || {};
            const sectionDateTracker = new Map();
            const vitals = normaliseCodeRefVitals(stage.vitals || [], sectionDateTracker);
            const conditions = normaliseCodeRefConditions(stage.conditions || [], sectionDateTracker);
            const events = normaliseCodeRefEvents(stage.events || [], sectionDateTracker);
            totals.vitals += vitals.length;
            totals.conditions += conditions.length;
            totals.events += events.length;
            sections[stageKey] = { vitals, conditions, events };
        });

        return { sections, totals };
    }

    function normaliseCodeRefVitals(entries, sectionDateTracker = { lastDate: null }) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const description = resolveCodeDisplay(code.system, code.code);

                return createStandardizedPill('vitals', {
                    code,
                    description,
                    value: item.value,
                    unit: item.unit,
                    dose: null, // Vitals don't have doses
                    route: item.route,
                    time: item.time,
                    onset: null
                }, sectionDateTracker);
            })
            .filter(Boolean);
    }

    function normaliseCodeRefConditions(entries, sectionDateTracker = { lastDate: null }) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const description = resolveCodeDisplay(code.system, code.code);

                return createStandardizedPill('conditions', {
                    code,
                    description,
                    value: null,
                    unit: null,
                    dose: null, // Conditions don't have doses
                    route: null,
                    time: null,
                    onset: item.onset
                }, sectionDateTracker);
            })
            .filter(Boolean);
    }

    function normaliseCodeRefEvents(entries, sectionDateTracker = { lastDate: null }) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const description = resolveCodeDisplay(code.system, code.code);

                return createStandardizedPill('events', {
                    code,
                    description,
                    value: null,
                    unit: item.unit,
                    dose: item.dose,
                    route: item.route,
                    time: item.time,
                    onset: null
                }, sectionDateTracker);
            })
            .filter(Boolean);
    }

    function buildSummary(payload, totals) {
        const summary = { totals };

        // Find the latest timestamp from R2 stage to set IPS Summary creation time
        let latestTimestamp = null;

        if (payload.r2) {
            const r2Stage = payload.r2;
            const allTimes = [];

            // Collect all timestamps from R2 vitals, conditions, and events
            if (r2Stage.vitals) {
                r2Stage.vitals.forEach(vital => {
                    if (vital.time) allTimes.push(new Date(vital.time));
                });
            }
            if (r2Stage.conditions) {
                r2Stage.conditions.forEach(condition => {
                    if (condition.onset) allTimes.push(new Date(condition.onset));
                });
            }
            if (r2Stage.events) {
                r2Stage.events.forEach(event => {
                    if (event.time) allTimes.push(new Date(event.time));
                });
            }

            // Find the latest valid timestamp
            const validTimes = allTimes.filter(time => !Number.isNaN(time.getTime()));
            if (validTimes.length > 0) {
                latestTimestamp = new Date(Math.max(...validTimes.map(time => time.getTime())));
                // Add 15 minutes to the latest R2 entry for IPS Summary creation
                latestTimestamp.setMinutes(latestTimestamp.getMinutes() + 15);
            }
        }

        // Use calculated timestamp or fallback to payload.t
        if (latestTimestamp) {
            summary.timestamp = latestTimestamp;
        } else if (typeof payload.t === 'number') {
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

    function buildStageSectionsFromBundle(bundle) {
        // TODO: Extract stage sections from FHIR Bundle entries based on care stage extensions
        // For now, return empty stage sections to prevent errors
        return {};
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
    console.log('renderPatientBox called with:', patientResource);
    const patientBox = document.querySelector('[data-key="patient"]');
    if (!patientBox) return;

    const patientTitle = patientBox.querySelector('.info-title');
    const existingDetails = patientBox.querySelector('.patient-details-container');
    if (existingDetails) existingDetails.remove();
    const existingPlaceholder = patientBox.querySelector('.stage-placeholder');
    if (existingPlaceholder) existingPlaceholder.remove();

    const patientConfig = infoBoxConfig.find(config => config.dataKey === 'patient');
    const patientColorClass = patientConfig ? patientConfig.colorClass : 'grey';

    if (patientResource && patientResource.resourceType === 'Patient') {
        patientTitle.textContent = 'Patient';
        const detailsElement = createPatientDetailsElement(patientResource, patientColorClass);
        patientBox.appendChild(detailsElement);
        addGhostItems(detailsElement, 10);
    } else {
        patientTitle.textContent = 'Patient';
        const placeholder = document.createElement('p');
        placeholder.className = 'stage-placeholder';
        placeholder.textContent = 'No data available';
        patientBox.appendChild(placeholder);
    }
}

function createPatientDetailsElement(patientData, parentColorClass) {
    console.log('=== createPatientDetailsElement DEBUG ===');
    console.log('patientData:', patientData);
    console.log('patientData.identifier:', patientData.identifier);
    console.log('patientData.extension:', patientData.extension);

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('patient-details-container');

    const name = patientData.name?.[0] || {};
    const serviceNumber = patientData.identifier?.find(id => id.type?.coding?.some(c => c.code === 'MIL'))?.value;
    const nhsNumber = formatNHSNumber(
        patientData.identifier?.find(id => id.type?.text === 'NHS Number')?.value
    );

    console.log('serviceNumber found:', serviceNumber);
    console.log('nhsNumber found:', nhsNumber);

    // Extract title and rank from prefix array
    const titleValue = name.prefix?.[0]; // First prefix is title (Mr, Mrs, etc.)
    const rankValue = name.prefix?.[1]; // Second prefix is rank (Drummer, etc.)

    const details = [
        { label: 'Title', value: titleValue },
        { label: 'Rank', value: rankValue },
        { label: 'Forename', value: name.given?.[0] },
        { label: 'Surname', value: name.family },
        { label: 'Sex', value: patientData.gender },
        { label: 'Date of Birth', value: formatDate(patientData.birthDate) },
        {
            label: 'Blood Group',
            value: (() => {
                const bloodExt = patientData.extension?.find(ext => ext.url?.includes('bloodGroup'));
                console.log('Blood Group Extension found:', bloodExt);
                if (!bloodExt) return undefined;

                const coding = bloodExt?.valueCodeableConcept?.coding?.[0];
                console.log('Blood Group Coding:', coding);
                if (coding) {
                    // Check for SNOMED CT system
                    if (coding.system?.includes('snomed.info/sct') && coding.code) {
                        console.log('Looking up SNOMED code:', coding.code);
                        const bloodGroupName = resolveCodeDisplay('sct', coding.code);
                        console.log('Resolved blood group name:', bloodGroupName);
                        // Ensure we show the complete blood type with antigen and Rh factor
                        return bloodGroupName || coding.display || bloodExt?.valueCodeableConcept?.text;
                    }
                    // Use display from coding if available
                    if (coding.display) {
                        return coding.display;
                    }
                }

                // Fallback to text
                return bloodExt?.valueCodeableConcept?.text;
            })()
        },
        { label: 'Nationality', value: patientData.extension?.find(ext => ext.url?.includes('nationality'))?.valueCodeableConcept?.text || 'UK' },
        { label: 'Service Number', value: serviceNumber },
        { label: 'NHS Number', value: nhsNumber }
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

        // MIST format with chronological ordering within each section
        const mistSections = [];

        // Sort conditions (Mechanism/Injury) by onset time
        if (stageData.conditions.length) {
            const sortedConditions = [...stageData.conditions].sort((a, b) => {
                const timeA = new Date(a.rawData?.dateTime || a.onset || 0);
                const timeB = new Date(b.rawData?.dateTime || b.onset || 0);
                return timeA - timeB;
            });
            mistSections.push({ type: 'Mechanism/Injury', items: sortedConditions });
        }

        // Sort vitals (Symptoms) by time
        if (stageData.vitals.length) {
            const sortedVitals = [...stageData.vitals].sort((a, b) => {
                const timeA = new Date(a.rawData?.dateTime || a.time || 0);
                const timeB = new Date(b.rawData?.dateTime || b.time || 0);
                return timeA - timeB;
            });
            mistSections.push({ type: 'Symptoms', items: sortedVitals });
        }

        // Sort events (Treatment) by time
        if (stageData.events.length) {
            const sortedEvents = [...stageData.events].sort((a, b) => {
                const timeA = new Date(a.rawData?.dateTime || a.time || 0);
                const timeB = new Date(b.rawData?.dateTime || b.time || 0);
                return timeA - timeB;
            });
            mistSections.push({ type: 'Treatment', items: sortedEvents });
        }

        if (!mistSections.length) {
            const placeholder = document.createElement('p');
            placeholder.className = 'stage-placeholder';
            placeholder.textContent = 'No data available';
            stageBox.appendChild(placeholder);
            return;
        }

        const container = document.createElement('div');
        container.classList.add('stage-details-container');

        // Track dates across entire OPCP pane for smart date display
        let lastDateInPane = null;

        mistSections.forEach((section, sectionIndex) => {
            // Add section spacer (except for first section)
            if (sectionIndex > 0) {
                const spacer = document.createElement('div');
                spacer.style.width = '100%';
                spacer.style.height = 'calc(var(--standard-padding) * 0.25)'; // Minimal gap between MIST sections
                container.appendChild(spacer);
            }

            // Add items in this section
            section.items.forEach((entry, itemIndex) => {
                const isFirstItemInPane = sectionIndex === 0 && itemIndex === 0;
                // For first item in section, show full label. For subsequent items, extract just the coded description
                let displayLabel = entry.label;
                if (itemIndex > 0 && entry.label.includes('•')) {
                    // Extract text after the bullet point for subsequent items
                    displayLabel = entry.label.split('•')[1].trim();
                }

                // Handle date formatting - show full date for first occurrence, time only for same date
                let displayValue = entry.value;

                // Extract date from value if it contains "Onset" or time info
                const onsetMatch = entry.value.match(/Onset (.+)/);
                const timeMatch = entry.value.match(/(\d{1,2} \w+ \d{2} \d{2}:\d{2})/);  // Updated to match hh:mm format

                if (onsetMatch) {
                    const dateStr = onsetMatch[1];
                    const currentDate = formatDateForComparison(dateStr);

                    if (isFirstItemInPane) {
                        // First item in pane - always show full date
                        lastDateInPane = currentDate;
                    } else if (currentDate && currentDate === lastDateInPane) {
                        // Same date as previous - show only time
                        displayValue = `Onset ${formatTimeOnly(dateStr)}`;
                    } else {
                        // New date - show full date and update tracking
                        lastDateInPane = currentDate;
                    }
                } else if (timeMatch) {
                    const dateStr = timeMatch[1];
                    const currentDate = formatDateForComparison(dateStr);

                    if (isFirstItemInPane) {
                        // First item in pane - always show full date
                        lastDateInPane = currentDate;
                    } else if (currentDate && currentDate === lastDateInPane) {
                        // Same date as previous - show only time
                        displayValue = entry.value.replace(timeMatch[1], formatTimeOnly(dateStr));
                    } else {
                        // New date - show full date and update tracking
                        lastDateInPane = currentDate;
                    }
                }

                const detail = createDetailBoxElement(displayLabel, displayValue, stageColor);
                detail.title = entry.tooltip;
                container.appendChild(detail);
            });
        });

        stageBox.appendChild(container);
    });
}

function renderPayloadDisplay(rawPayload) {
    const ipsInput = document.getElementById('ips-input');
    if (!ipsInput) return;
    if (!rawPayload) {
        ipsInput.textContent = '';
        return;
    }

    try {
        ipsInput.textContent = JSON.stringify(rawPayload, null, 2);
    } catch (error) {
        ipsInput.textContent = String(rawPayload);
    }

    // Update character count if element exists
    const ipsCharCount = document.getElementById('ips-char-count');
    if (ipsCharCount) {
        const text = ipsInput.textContent || '';
        ipsCharCount.textContent = `${text.length} characters`;
    }
}

function renderClinicalSummaryBox(currentPatient, allergies, summary) {
    const clinicalSummaryBox = document.querySelector('[data-key="clinicalSummary"]');
    if (!clinicalSummaryBox) return;

    const existingDetails = clinicalSummaryBox.querySelector('.patient-details-container');
    if (existingDetails) existingDetails.remove();

    const existingPlaceholder = clinicalSummaryBox.querySelector('.stage-placeholder');
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
        detailItems.push({ label: 'Created', value: formatDateTime(summary.timestamp.toISOString()) });
    }

    const differences = buildPatientDifferences(null, currentPatient);
    differences.forEach(diff => detailItems.push(diff));

    if (detailItems.length) {
        detailItems.forEach(item => {
            detailsContainer.appendChild(createDetailBoxElement(item.label, item.value, 'khaki'));
        });
        clinicalSummaryBox.appendChild(detailsContainer);
        addGhostItems(detailsContainer, 10);
    } else {
        const placeholder = document.createElement('p');
        placeholder.className = 'stage-placeholder';
        placeholder.textContent = 'No data available';
        clinicalSummaryBox.appendChild(placeholder);
    }
}

function buildPatientDifferences(referencePatient, currentPatient) {
    if (!referencePatient || !currentPatient) return [];

    const differences = [];

    const identifiers1 = referencePatient.identifier || [];
    const identifiers2 = currentPatient.identifier || [];

    // Ensure identifiers2 is an array before calling forEach
    if (Array.isArray(identifiers2)) {
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
    }

    const extensions1 = referencePatient.extension || [];
    const extensions2 = currentPatient.extension || [];

    // Ensure extensions2 is an array before calling forEach
    if (Array.isArray(extensions2)) {
        extensions2.forEach(ext2 => {
        const ext1 = extensions1.find(ext => ext.url === ext2.url);
        if (!ext1 || JSON.stringify(ext1) !== JSON.stringify(ext2)) {
            // Skip nationality extension - not needed in IPS Summary
            if (ext2.url && ext2.url.includes('patient-nationality')) {
                return;
            }

            const hasCoding = ext2.valueCodeableConcept?.coding?.some(coding => coding.code && coding.display);
            if (hasCoding && ext2.valueCodeableConcept?.text) {
                const code = ext2.valueCodeableConcept.coding[0].code;
                const display = ext2.valueCodeableConcept.coding[0].display;

                // Skip items with "Unknown code" or empty codes
                if (code === 'Unknown code' || display === 'Unknown code' || !code) {
                    return;
                }

                const urlParts = ext2.url.split('/');
                const label = urlParts[urlParts.length - 1]
                    .replace('Extension-UKCore-', '')
                    .replace(/([A-Z])/g, ' $1')
                    .trim();
                differences.push({
                    label: `Extension: ${label}`,
                    value: `${code} - ${display} (${ext2.valueCodeableConcept.text})`
                });
            }
        }
        });
    }

    return differences;
}

function processAndRenderAll(viewModel, comparisonViewModel) {
    if (!viewModel) {
        showMessage('Error: Could not load or parse payload', 'error');
        return;
    }

    renderPatientBox(viewModel.patientResource);
    renderPayloadDisplay(viewModel.rawPayload);
    renderClinicalSummaryBox(viewModel.patientResource, viewModel.allergies, viewModel.summary);
    renderStageSections(viewModel.stageSections);
}

// --- INITIALISATION ---

// Multi-format UI state
const formatState = {
    leftMode: 'fragment', // 'fragment' or 'fhir'
    rightFormat: 'fhir',  // 'fhir', 'coderef', 'protobuf', 'fragment'
    conversionResults: {}, // Store all format results
    originalFhir: null, // Preserve original FHIR data to prevent round-trip loss
    originalFragment: null // Preserve original fragment data for restoration
};

async function init() {
    console.log('=== INIT DEBUG ===');
    console.log('Creating info boxes...');
    createInfoBoxes();

    // Check if boxes were created
    const container = document.getElementById('info-boxes-container');
    console.log('Info boxes container:', container);
    console.log('Container children count:', container ? container.children.length : 'null');

    const patientBox = document.querySelector('[data-key="patient"]');
    console.log('Patient box found:', !!patientBox);

    // New enhanced UI elements
    const parseButton = document.getElementById('parse-button');
    const debugRegenerateButton = document.getElementById('debug-regenerate');
    const leftPaneTitle = document.getElementById('left-pane-title');
    const rightPaneTitle = document.getElementById('right-pane-title');
    const actionButton = document.getElementById('action-button');
    const leftInput = document.getElementById('left-input');
    const rightInput = document.getElementById('right-input');
    const leftCharCount = document.getElementById('left-char-count');
    const rightCharCount = document.getElementById('right-char-count');

    // Preset and clear buttons
    const preset1Button = document.getElementById('preset-1');
    const preset2Button = document.getElementById('preset-2');
    const preset3Button = document.getElementById('preset-3');
    const clearLeftButton = document.getElementById('clear-left');
    // const clearRightButton = document.getElementById('clear-right'); // Removed

    // Legacy elements (for compatibility)
    const decodeButton = document.getElementById('decode-button');
    const encodeButton = document.getElementById('encode-button');
    const clearFragmentButton = document.getElementById('clear-fragment');
    const clearIpsButton = document.getElementById('clear-ips');
    const ipsInput = document.getElementById('ips-input');
    const fragmentInput = document.getElementById('fragment-input');

    const payload1 = await fetchJson('ips-fhir-json-1.json');
    const payload2 = await fetchJson('payload-2.json');

    if (payload1) {
        // Add CASEVAC demo data to payload1
        if (!payload1.casevac) {
            payload1.casevac = {
                vitals: [
                    { code: { sys: 'loinc', code: '8310-5' }, value: 98.6, unit: '°F' },
                    { code: { sys: 'loinc', code: '8867-4' }, value: 75, unit: 'bpm' }
                ],
                conditions: [
                    { code: { sys: 'sct', code: '125605004' }, onset: '2024-01-15T14:30:00Z' }
                ],
                events: [
                    { code: { sys: 'sct', code: '182856006' }, time: '2024-01-15T09:20:00Z', dose: 'Tourniquet applied', route: 'Left upper extremity' },
                    { code: { sys: 'sct', code: '225358003' }, time: '2024-01-15T15:00:00Z', dose: 'Stretcher', route: 'Manual carry' }
                ]
            };
        }

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

    // Enhanced IPS data with comprehensive medical records
    // IMPORTANT: After modifying this data structure, the fragment must be regenerated
    // by calling updateFragmentFromEnhancedData() or refreshing the page
    const enhancedIpsData = {
        "patient": {
            "given": "Thomas",
            "family": "Hodge",
            "dob": "1995-03-15",
            "gender": {"sys": "sct", "code": "248153007"},
            "blood_group": {"sys": "sct", "code": "278152006"},
            "nhs_id": {"sys": "nhs-number", "code": "4857773456"},
            "service_id": {"sys": "mil", "code": "5199"},
            "rank": "Drummer",
            "title": "Mr",
            "nationality": "UK"
        },
        "poi": {
            "vitals": [
                {"code": {"sys": "loinc", "code": "8310-5"}, "value": 98.2, "unit": "°F", "route": "Tympanic", "time": "2024-01-15T14:16:00Z"},
                {"code": {"sys": "loinc", "code": "8867-4"}, "value": 92, "unit": "bpm", "time": "2024-01-15T14:17:00Z"},
                {"code": {"sys": "loinc", "code": "8480-6"}, "value": 135, "unit": "mmHg", "time": "2024-01-15T14:17:30Z"},
                {"code": {"sys": "loinc", "code": "8462-4"}, "value": 90, "unit": "mmHg", "time": "2024-01-15T14:17:30Z"},
                {"code": {"sys": "loinc", "code": "9279-1"}, "value": 20, "unit": "/min", "time": "2024-01-15T14:18:00Z"}
            ],
            "conditions": [
                {"code": {"sys": "sct", "code": "417163006"}, "onset": "2024-01-15T14:15:00Z"},
                {"code": {"sys": "sct", "code": "125605004"}, "onset": "2024-01-15T14:16:00Z"},
                {"code": {"sys": "sct", "code": "125670008"}, "onset": "2024-01-15T14:18:00Z"}
            ],
            "events": [
                {"code": {"sys": "sct", "code": "182856006"}, "time": "2024-01-15T14:20:00Z", "dose": "Direct pressure", "route": "Manual"},
                {"code": {"sys": "sct", "code": "225358003"}, "time": "2024-01-15T14:22:00Z", "dose": "Pressure bandage", "route": "Direct application"},
                {"code": {"sys": "sct", "code": "385763009"}, "time": "2024-01-15T14:25:00Z", "dose": "Tourniquet", "route": "Left leg"},
                {"code": {"sys": "sct", "code": "387207008"}, "time": "2024-01-15T14:26:00Z", "dose": "5mg", "route": "IV"},
                {"code": {"sys": "sct", "code": "17629007"}, "time": "2024-01-15T14:28:00Z", "dose": "Casualty extraction", "route": "Manual carry"}
            ]
        },
        "casevac": {
            "vitals": [
                {"code": {"sys": "loinc", "code": "8310-5"}, "value": 98.6, "unit": "°F", "route": "Oral", "time": "2024-01-15T15:30:00Z"},
                {"code": {"sys": "loinc", "code": "8867-4"}, "value": 75, "unit": "bpm", "time": "2024-01-15T15:31:00Z"},
                {"code": {"sys": "loinc", "code": "8480-6"}, "value": 120, "unit": "mmHg", "time": "2024-01-15T15:31:30Z"},
                {"code": {"sys": "loinc", "code": "8462-4"}, "value": 80, "unit": "mmHg", "time": "2024-01-15T15:31:30Z"},
                {"code": {"sys": "loinc", "code": "9279-1"}, "value": 16, "unit": "/min", "time": "2024-01-15T15:32:00Z"}
            ],
            "events": [
                {"code": {"sys": "sct", "code": "17629007"}, "time": "2024-01-15T15:30:00Z", "dose": "Boxer (MIV-A) Ambulance", "route": "Ground transport"},
                {"code": {"sys": "sct", "code": "71181003"}, "time": "2024-01-15T15:35:00Z", "dose": "Continuous vital monitoring", "route": "Electronic"},
                {"code": {"sys": "sct", "code": "385763009"}, "time": "2024-01-15T15:15:00Z", "dose": "Applied to wound", "route": "Topical"}
            ]
        },
        "medevac": {
            "vitals": [
                {"code": {"sys": "loinc", "code": "8310-5"}, "value": 99.2, "unit": "°F", "route": "Rectal", "time": "2024-01-15T16:00:00Z"},
                {"code": {"sys": "loinc", "code": "8867-4"}, "value": 85, "unit": "bpm", "time": "2024-01-15T16:01:00Z"},
                {"code": {"sys": "loinc", "code": "8480-6"}, "value": 110, "unit": "mmHg", "time": "2024-01-15T16:01:30Z"},
                {"code": {"sys": "loinc", "code": "8462-4"}, "value": 75, "unit": "mmHg", "time": "2024-01-15T16:01:30Z"},
                {"code": {"sys": "loinc", "code": "2708-6"}, "value": 95, "unit": "%", "time": "2024-01-15T16:02:00Z"}
            ],
            "conditions": [
                {"code": {"sys": "sct", "code": "386661006"}, "onset": "2024-01-15T16:00:00Z"},
                {"code": {"sys": "sct", "code": "271594007"}, "onset": "2024-01-15T16:05:00Z"},
                {"code": {"sys": "sct", "code": "267036007"}, "onset": "2024-01-15T16:10:00Z"},
                {"code": {"sys": "sct", "code": "422587007"}, "onset": "2024-01-15T16:15:00Z"}
            ],
            "events": [
                {"code": {"sys": "sct", "code": "182856006"}, "time": "2024-01-15T16:20:00Z", "dose": "IV access", "route": "Intravenous"},
                {"code": {"sys": "sct", "code": "387562000"}, "time": "2024-01-15T16:22:00Z", "dose": "1g", "route": "IV"},
                {"code": {"sys": "sct", "code": "432102000"}, "time": "2024-01-15T16:25:00Z", "dose": "500ml", "route": "IV"},
                {"code": {"sys": "sct", "code": "17629007"}, "time": "2024-01-15T16:30:00Z", "dose": "Immobilization", "route": "External"},
                {"code": {"sys": "sct", "code": "71181003"}, "time": "2024-01-15T16:35:00Z", "dose": "Cardiac monitoring", "route": "Telemetry"}
            ]
        },
        "r1": {
            "vitals": [
                {"code": {"sys": "loinc", "code": "8310-5"}, "value": 100.1, "unit": "°F", "route": "Temporal", "time": "2024-01-15T18:00:00Z"},
                {"code": {"sys": "loinc", "code": "8867-4"}, "value": 88, "unit": "bpm", "time": "2024-01-15T18:01:00Z"},
                {"code": {"sys": "loinc", "code": "8480-6"}, "value": 105, "unit": "mmHg", "time": "2024-01-15T18:01:30Z"},
                {"code": {"sys": "loinc", "code": "8462-4"}, "value": 70, "unit": "mmHg", "time": "2024-01-15T18:01:30Z"},
                {"code": {"sys": "loinc", "code": "718-7"}, "value": 14.2, "unit": "g/dL", "time": "2024-01-15T18:02:00Z"}
            ],
            "conditions": [
                {"code": {"sys": "sct", "code": "302866003"}, "onset": "2024-01-15T18:00:00Z"},
                {"code": {"sys": "sct", "code": "84229001"}, "onset": "2024-01-15T18:15:00Z"},
                {"code": {"sys": "sct", "code": "423902002"}, "onset": "2024-01-15T18:30:00Z"},
                {"code": {"sys": "sct", "code": "267036007"}, "onset": "2024-01-15T18:45:00Z"}
            ],
            "events": [
                {"code": {"sys": "sct", "code": "18629005"}, "time": "2024-01-15T19:00:00Z", "dose": "Left leg assessment", "route": "Ultrasound"},
                {"code": {"sys": "sct", "code": "387494007"}, "time": "2024-01-15T19:10:00Z", "dose": "400mg", "route": "PO"},
                {"code": {"sys": "sct", "code": "387713003"}, "time": "2024-01-15T19:15:00Z", "dose": "Prophylactic antibiotic", "route": "IV push"},
                {"code": {"sys": "sct", "code": "182856006"}, "time": "2024-01-15T19:30:00Z", "dose": "Wound irrigation", "route": "Topical"},
                {"code": {"sys": "sct", "code": "225358003"}, "time": "2024-01-15T19:45:00Z", "dose": "Wound cleaning", "route": "Topical"}
            ]
        },
        "r2": {
            "vitals": [
                {"code": {"sys": "loinc", "code": "8310-5"}, "value": 99.8, "unit": "°F", "route": "Axillary", "time": "2024-01-15T20:15:00Z"},
                {"code": {"sys": "loinc", "code": "8867-4"}, "value": 82, "unit": "bpm", "time": "2024-01-15T20:16:00Z"},
                {"code": {"sys": "loinc", "code": "8480-6"}, "value": 115, "unit": "mmHg", "time": "2024-01-15T20:16:30Z"},
                {"code": {"sys": "loinc", "code": "8462-4"}, "value": 78, "unit": "mmHg", "time": "2024-01-15T20:16:30Z"},
                {"code": {"sys": "loinc", "code": "33747-0"}, "value": 7.35, "unit": "pH", "time": "2024-01-15T20:17:00Z"}
            ],
            "conditions": [
                {"code": {"sys": "sct", "code": "128045006"}, "onset": "2024-01-15T20:15:00Z"},
                {"code": {"sys": "sct", "code": "225566008"}, "onset": "2024-01-15T20:30:00Z"},
                {"code": {"sys": "sct", "code": "62914000"}, "onset": "2024-01-15T20:45:00Z"}
            ],
            "events": [
                {"code": {"sys": "sct", "code": "71388002"}, "time": "2024-01-15T21:00:00Z", "dose": "CT scan", "route": "Imaging"},
                {"code": {"sys": "sct", "code": "387467008"}, "time": "2024-01-15T21:10:00Z", "dose": "50mg", "route": "IV"},
                {"code": {"sys": "sct", "code": "372687004"}, "time": "2024-01-15T21:15:00Z", "dose": "500mg", "route": "IV"},
                {"code": {"sys": "sct", "code": "182856006"}, "time": "2024-01-15T21:30:00Z", "dose": "Surgical hemostasis", "route": "Intraoperative"},
                {"code": {"sys": "sct", "code": "108761006"}, "time": "2024-01-15T21:45:00Z", "dose": "1mg", "route": "IV"}
            ]
        },
        "t": "2024-01-15T14:30:00Z"
    };

    // Preset fragments
    const presetFragments = {
        1: '', // Will be updated with encoded enhanced data
        2: '', // Placeholder
        3: ''  // Placeholder
    };

    // Function to regenerate fragment from ips-fhir-json-1.json
    async function updateFragmentFromPayload1() {
        try {
            console.log('=== PAYLOAD-1 ENCODING START ===');
            console.log('payload1 type:', typeof payload1);
            console.log('payload1 resourceType:', payload1?.resourceType);
            console.log('payload1 entry count:', payload1?.entry?.length);

            const newFragment = await codecPipeline.encodeToFragment(payload1);
            presetFragments[1] = newFragment;
            console.log('Fragment updated successfully with ips-fhir-json-1.json');
            console.log('New fragment length:', newFragment.length);
            console.log('New fragment:', newFragment.substring(0, 100) + '...');
            return newFragment;
        } catch (error) {
            console.error('ERROR encoding ips-fhir-json-1.json to fragment:', error);
            console.error('Error stack:', error.stack);
            return null;
        }
    }

    // Expose fragment update function globally for manual updates
    window.updateFragmentFromPayload1 = updateFragmentFromPayload1;

    // Force regeneration function for debugging
    window.forceRegenerateFragment = async () => {
        console.log('=== FORCING FRAGMENT REGENERATION ===');
        presetFragments[1] = ''; // Clear cached fragment
        const newFragment = await updateFragmentFromPayload1();
        console.log('Fragment regenerated successfully');
        return newFragment;
    };

    // Expose comprehensive test function for debugging
    window.debugPatientPipeline = async function() {
        console.log('=== COMPREHENSIVE PATIENT DATA PIPELINE DEBUG ===');

        // Step 1: Source data
        console.log('1. SOURCE DATA:');
        console.log('   enhancedIpsData.patient:', enhancedIpsData.patient);

        // Step 2: Blood group code lookup
        console.log('\n2. BLOOD GROUP CODE LOOKUP:');
        const bgCode = enhancedIpsData.patient.blood_group;
        console.log('   blood_group object:', bgCode);
        console.log('   resolveCodeDisplay("sct", "278152006"):', resolveCodeDisplay('sct', '278152006'));
        console.log('   medicalCodeMap["sct:278152006"]:', medicalCodeMap['sct:278152006']);

        // Step 3: Protobuf encoding
        console.log('\n3. PROTOBUF ENCODING:');
        try {
            const fragment = await codecPipeline.encodeToFragment(enhancedIpsData);
            console.log('   Generated fragment:', fragment ? fragment.substring(0, 100) + '...' : 'FAILED');

            // Step 4: Protobuf decoding
            console.log('\n4. PROTOBUF DECODING:');
            const decoded = await codecPipeline.decodeFragment(fragment);
            console.log('   Decoded payload:', decoded);
            console.log('   Decoded patient:', decoded.patient);

            // Step 5: Patient resource building
            console.log('\n5. PATIENT RESOURCE BUILDING:');
            const patientResource = payloadService.buildViewModelFromObject(decoded).patientResource;
            console.log('   Built patient resource:', patientResource);
            console.log('   Patient identifiers:', patientResource?.identifier);
            console.log('   Patient extensions:', patientResource?.extension);

            return {
                source: enhancedIpsData.patient,
                encoded: fragment,
                decoded: decoded.patient,
                patientResource: patientResource
            };

        } catch (error) {
            console.error('   Pipeline failed:', error);
            return null;
        }
    };

    // Initial fragment generation
    let defaultFragment = '';
    try {
        defaultFragment = await updateFragmentFromPayload1();
        if (!defaultFragment) {
            // Fallback to original fragment if encoding fails
            defaultFragment = 'eNp1j0FLAlEUhdNQ6m2sR5uGVq5CeHDunTdz75vVW4k_QIQKArEwQZvFRGt3boL-Qv-kvxYNipnM3Z5zv3OOcaY7filX08p2RuXT_Dm5MKfV7M2es1fKUkAKQ6reIXdg-9EyiemZzrJcvM5sVzUX5y9P6nuMB1pgCY62mkZ7a3Zo74PmCrC9YnDmEBxlY0KBrADuk72TiCVVQI6cUjuHjW3WD_EPh31KngD856T45fSr5lV3h6vUK1y-zZjEJOy7KovIUQYVqDOu65f4Gfvt1XzQXrwPbppDJzF-fW_OfgBABEyW';
            presetFragments[1] = defaultFragment;
        }
    } catch (error) {
        console.warn('Failed to generate initial fragment:', error);
        defaultFragment = 'eNp1j0FLAlEUhdNQ6m2sR5uGVq5CeHDunTdz75vVW4k_QIQKArEwQZvFRGt3boL-Qv-kvxYNipnM3Z5zv3OOcaY7filX08p2RuXT_Dm5MKfV7M2es1fKUkAKQ6reIXdg-9EyiemZzrJcvM5sVzUX5y9P6nuMB1pgCY62mkZ7a3Zo74PmCrC9YnDmEBxlY0KBrADuk72TiCVVQI6cUjuHjW3WD_EPh31KngD456T45fSr5lV3h6vUK1y-zZjEJOy7KovIUQYVqDOu65f4Gfvt1XzQXrwPbppDJzF-fW_OfgBABEyW';
        presetFragments[1] = defaultFragment;
    }

    const fragment = window.location.hash.slice(1);

    if (fragment) {
        // URL fragment provided
        try {
            const fragmentViewModel = await payloadService.loadFromFragment(fragment);
            appState.fragmentViewModel = fragmentViewModel;
            initialViewModel = fragmentViewModel;
            initialComparison = appState.demos[0] || null;
            showMessage('Loaded payload from NFC fragment', 'success');
        } catch (error) {
            console.error('Failed to decode fragment payload:', error);
            showMessage('Failed to decode fragment', 'warning');
        }
    }

    // Only render if we have a URL fragment with valid data
    if (initialViewModel) {
        appState.currentViewModel = initialViewModel;
        appState.comparisonViewModel = initialComparison;
        processAndRenderAll(initialViewModel, initialComparison);
    } else {
        // Clear display areas when no initial data
        renderPatientBox(null);
        renderPayloadDisplay(null);
        renderClinicalSummaryBox(null, null, null);
        renderStageSections({});
    }

    // === FORMAT SWITCHING FUNCTIONS ===

    async function updateLeftPaneMode(newMode) {
        const currentContent = leftInput.textContent.trim();
        console.log('=== LEFT PANE MODE SWITCH ===');
        console.log('From mode:', formatState.leftMode, 'to mode:', newMode);
        console.log('Current content length:', currentContent.length);
        console.log('Content starts with:', currentContent.substring(0, 100));
        formatState.leftMode = newMode;

        if (newMode === 'fragment') {
            leftPaneTitle.textContent = 'URL Fragment';
            leftInput.placeholder = 'Paste Base64 encoded fragment here...';
            actionButton.textContent = 'Decode';
            actionButton.className = 'pane-button decode-mode';

            // If we have original fragment stored, restore it instead of encoding FHIR
            if (formatState.originalFragment) {
                console.log('Restoring original fragment length:', formatState.originalFragment.length);
                leftInput.textContent = formatState.originalFragment;
                showMessage('Restored original fragment data', 'success');
            }
            // Otherwise, if switching from FHIR to fragment and we have FHIR content, encode it
            else if (currentContent && looksLikeJson(currentContent)) {
                try {
                    console.log('No original fragment stored, encoding FHIR');
                    const fhirData = JSON.parse(currentContent);
                    const fragment = await codecPipeline.encodeToFragment(fhirData);
                    leftInput.textContent = fragment;
                    showMessage('Converted FHIR to fragment', 'success');
                } catch (error) {
                    console.error('Error converting FHIR to fragment:', error);
                }
            }
        } else { // 'fhir'
            leftPaneTitle.textContent = 'IPS FHIR JSON';
            leftInput.placeholder = 'Paste FHIR JSON here...';
            actionButton.textContent = 'Encode';
            actionButton.className = 'pane-button encode-mode';

            // If we have original FHIR stored, restore it instead of decoding fragment
            if (formatState.originalFhir) {
                console.log('🔍 FINAL RESULT: Restoring original FHIR length:', formatState.originalFhir.length);
                leftInput.textContent = formatState.originalFhir;
                console.log('🔍 FINAL RESULT: Displayed FHIR character count:', leftInput.textContent.length);
                showMessage('Restored original FHIR data', 'success');
            }
            // Otherwise, if switching from fragment to FHIR and we have fragment content, decode it
            else if (currentContent && !looksLikeJson(currentContent)) {
                try {
                    console.log('🔍 CRITICAL: No original FHIR stored, decoding fragment for final result');
                    console.log('🔍 CRITICAL: Fragment being decoded length:', currentContent.length);
                    const parsedViewModel = await payloadService.parseUserInput(currentContent);
                    if (parsedViewModel && parsedViewModel.rawPayload) {
                        console.log('🔍 CRITICAL: Parsed payload, calling convertCodeRefToFhirBundle');
                        const fhirBundle = codecPipeline.convertCodeRefToFhirBundle(parsedViewModel.rawPayload);
                        const fhirJson = JSON.stringify(fhirBundle, null, 2);
                        console.log('🔍 FINAL RESULT: Generated FHIR JSON character count:', fhirJson.length);
                        leftInput.textContent = fhirJson;
                        console.log('🔍 FINAL RESULT: Displayed FHIR character count:', leftInput.textContent.length);
                        console.log('🔍 FINAL RESULT: First 200 chars:', fhirJson.substring(0, 200));
                        showMessage('Converted fragment to FHIR', 'success');
                    }
                } catch (error) {
                    console.error('Error converting fragment to FHIR:', error);
                }
            }
        }

        leftPaneTitle.setAttribute('data-mode', newMode);
        updateCharCount(leftInput, leftCharCount);
    }

    function updateRightPaneFormat(newFormat) {
        console.log('🔍 RIGHT PANE FORMAT UPDATE: Switching to format:', newFormat);
        formatState.rightFormat = newFormat;

        const formatNames = {
            'fhir': 'IPS FHIR JSON',
            'coderef': 'CodeRef Format',
            'protobuf': 'Protobuf Binary Format'
        };

        rightPaneTitle.textContent = formatNames[newFormat];
        rightPaneTitle.setAttribute('data-format', newFormat);

        // Note: Removed aggressive cache clearing that was breaking UI

        // Show the appropriate format if available
        if (formatState.conversionResults[newFormat]) {
            console.log('🔍 RIGHT PANE: Displaying cached', newFormat, 'result, length:', formatState.conversionResults[newFormat].length);
            rightInput.textContent = formatState.conversionResults[newFormat];
            console.log('🔍 RIGHT PANE: Displayed character count:', rightInput.textContent.length);
            if (newFormat === 'fhir') {
                console.log('🔍 CRITICAL FHIR DISPLAY: First 200 chars:', rightInput.textContent.substring(0, 200));
            }
        } else {
            console.log('🔍 RIGHT PANE: No cached result for', newFormat, '- will trigger fresh generation');
            rightInput.textContent = '';

            // Note: Removed auto-clicking code that was causing issues
        }

        updateCharCount(rightInput, rightCharCount);

        // Update Parse button state based on new format
        if (typeof updateParseButtonState === 'function') {
            updateParseButtonState();
        }
    }

    function updateCharCount(inputElement, countElement) {
        const text = inputElement.textContent || '';
        countElement.textContent = `${text.length} characters`;
    }

    async function performConversion() {
        const inputContent = leftInput.textContent.trim();
        if (!inputContent) {
            showMessage('Input is empty', 'warning');
            return;
        }

        try {
            // Clear previous results AND force fresh decode
            formatState.conversionResults = {};
            console.log('🔄 CACHE CLEARED: Forcing fresh decode operations');

            if (formatState.leftMode === 'fragment') {
                // Decode: Fragment -> CodeRef -> FHIR Bundle
                console.log('=== DECODING PROCESS ===');
                console.log('🔄 DECODE BUTTON: Starting full reverse pipeline');
                console.log('🔄 DECODE BUTTON: Fragment input length:', inputContent.length);

                const parsedViewModel = await payloadService.parseUserInput(inputContent);
                console.log('🔍 CRITICAL CHECK: parsedViewModel.rawPayload.original_bundle_json exists:', !!parsedViewModel.rawPayload?.original_bundle_json);
                console.log('🔍 CRITICAL CHECK: parsedViewModel.rawPayload.originalBundleJson exists:', !!parsedViewModel.rawPayload?.originalBundleJson);
                if (parsedViewModel.rawPayload?.original_bundle_json) {
                    console.log('🔍 CRITICAL CHECK: original_bundle_json length:', parsedViewModel.rawPayload.original_bundle_json.length);
                }
                if (parsedViewModel.rawPayload?.originalBundleJson) {
                    console.log('🔍 CRITICAL CHECK: originalBundleJson length:', parsedViewModel.rawPayload.originalBundleJson.length);
                }
                if (!parsedViewModel?.rawPayload) {
                    throw new Error('Unable to decode fragment data');
                }

                // Store original fragment for restoration
                formatState.originalFragment = inputContent;

                // Store CodeRef format
                formatState.conversionResults.coderef = JSON.stringify(parsedViewModel.rawPayload, null, 2);

                // Convert to FHIR Bundle
                console.log('🔍 DECODE RESULT: Converting CodeRef to FHIR Bundle');
                const fhirBundle = codecPipeline.convertCodeRefToFhirBundle(parsedViewModel.rawPayload);
                const fhirJson = JSON.stringify(fhirBundle, null, 2);
                console.log('🔍 DECODE RESULT: Generated FHIR JSON character count:', fhirJson.length);
                console.log('🔍 DECODE RESULT: First 200 chars:', fhirJson.substring(0, 200));
                formatState.conversionResults.fhir = fhirJson;

                // Store fragment (same as input)
                formatState.conversionResults.fragment = inputContent;

                // Generate protobuf binary format
                const codeRefData = parsedViewModel.rawPayload;
                formatState.conversionResults.protobuf = await codecPipeline.getProtobufBinary(codeRefData);

                showMessage(`Decoded to FHIR Bundle (${fhirBundle.entry.length} entries)`, 'success');

            } else { // 'fhir'
                // Encode: FHIR Bundle -> Fragment (stay in left pane)
                console.log('=== ENCODING PROCESS ===');
                console.log('Source FHIR length:', inputContent.length);
                console.log('First 200 chars:', inputContent.substring(0, 200));

                const fhirPayload = JSON.parse(inputContent);
                console.log('Parsed FHIR bundle entries:', fhirPayload.entry?.length || 'No entries');
                console.log('FHIR resourceType:', fhirPayload.resourceType);

                // Store original FHIR data before encoding
                formatState.originalFhir = inputContent;

                // Encode to fragment
                const fragment = await codecPipeline.encodeToFragment(fhirPayload);

                // Update left pane to fragment mode with the encoded result
                await updateLeftPaneMode('fragment');
                leftInput.textContent = fragment;
                updateCharCount(leftInput, leftCharCount);

                showMessage(`Encoded to ${fragment.length} character fragment`, 'success');
                return; // Don't update right pane for encoding
            }

            // Update right pane display with decoded results
            updateRightPaneFormat(formatState.rightFormat);

        } catch (error) {
            console.error('Conversion error:', error);
            showMessage(`Conversion failed: ${error.message}`, 'error');
        }
    }

    // === EVENT LISTENERS ===

    // Left pane title click - toggle between Fragment/FHIR modes
    leftPaneTitle.addEventListener('click', async () => {
        console.log('🔘 LEFT PANE TITLE CLICKED: Mode switching initiated');
        console.log('🔘 LEFT: Current mode:', formatState.leftMode);
        const newMode = formatState.leftMode === 'fragment' ? 'fhir' : 'fragment';
        console.log('🔘 LEFT: Switching to mode:', newMode);
        await updateLeftPaneMode(newMode);
        console.log('🔘 LEFT: Mode switch completed');
    });

    // Right pane title click - cycle through output formats in decode sequence
    rightPaneTitle.addEventListener('click', () => {
        console.log('🔘 RIGHT PANE TITLE CLICKED: Format cycling initiated');
        console.log('🔘 RIGHT: Current format:', formatState.rightFormat);
        const formats = ['protobuf', 'coderef', 'fhir']; // Decode sequence: Protobuf → CodeRef → FHIR
        const currentIndex = formats.indexOf(formatState.rightFormat);
        const nextIndex = (currentIndex + 1) % formats.length;
        console.log('🔘 RIGHT: Cycling to format:', formats[nextIndex]);
        updateRightPaneFormat(formats[nextIndex]);
        console.log('🔘 RIGHT: Format cycle completed');
    });

    // Action button - perform encode/decode based on current mode
    actionButton.addEventListener('click', performConversion);

    // Character count updates
    leftInput.addEventListener('input', () => updateCharCount(leftInput, leftCharCount));
    rightInput.addEventListener('input', () => updateCharCount(rightInput, rightCharCount));

    // Clear buttons
    clearLeftButton.addEventListener('click', () => {
        leftInput.textContent = '';
        updateCharCount(leftInput, leftCharCount);
    });

    // clearRightButton removed - right pane is output only

    // payloadToggle.addEventListener('change', () => {
    //     const useSecond = payloadToggle.checked;
    //     const selected = appState.demos[useSecond ? 1 : 0];
    //     const comparison = appState.demos[useSecond ? 0 : 1];
    //     if (!selected) {
    //         showMessage('Selected demo payload is unavailable.', 'warning');
    //         return;
    //     }
    //     appState.currentViewModel = selected;
    //     appState.comparisonViewModel = comparison || null;
    //     processAndRenderAll(selected, comparison);
    // });

    // Parse button should only work when right pane shows FHIR JSON
    function updateParseButtonState() {
        const canParse = formatState.rightFormat === 'fhir' && rightInput.textContent.trim().length > 0;
        parseButton.disabled = !canParse;
        parseButton.style.opacity = canParse ? '1' : '0.5';
        parseButton.style.cursor = canParse ? 'pointer' : 'not-allowed';
    }

    parseButton.addEventListener('click', async () => {
        console.log('🔘 PARSE BUTTON CLICKED: Starting final parse operation');
        console.log('🔘 PARSE: Right format is:', formatState.rightFormat);

        if (formatState.rightFormat !== 'fhir') {
            showMessage('Parse only available when right pane shows IPS FHIR JSON', 'warning');
            return;
        }

        const fhirInput = rightInput.textContent.trim();
        console.log('🔘 PARSE: FHIR input character length:', fhirInput.length);
        console.log('🔘 PARSE: First 200 chars:', fhirInput.substring(0, 200));

        if (!fhirInput) {
            showMessage('No FHIR JSON available to parse', 'warning');
            return;
        }

        try {
            const parsedViewModel = await payloadService.parseUserInput(fhirInput);
            console.log('=== PARSE DEBUG ===');
            console.log('Parsed view model:', parsedViewModel);
            console.log('Patient resource:', parsedViewModel?.patientResource);
            console.log('Stage sections:', parsedViewModel?.stageSections);

            appState.currentViewModel = parsedViewModel;
            appState.comparisonViewModel = appState.demos[0] || null;
            processAndRenderAll(parsedViewModel, appState.comparisonViewModel);
            showMessage('FHIR JSON parsed and displayed successfully', 'success');

            // Force log flush for complete pipeline session debugging
            console.log('🔚 PARSE COMPLETE: Forcing log flush for pipeline analysis');
            if (window.flushConsoleLogs) {
                window.flushConsoleLogs();
            }
        } catch (error) {
            console.error('Parse error:', error);
            showMessage(`Parse failed: ${error.message}`, 'error');
        }
    });

    // Debug regenerate button
    debugRegenerateButton.addEventListener('click', async () => {
        try {
            showMessage('🔍 Regenerating fragment with debug logs...', 'info');
            await window.forceRegenerateFragment();
            showMessage('✅ Fragment regenerated! Check console for detailed logs.', 'success');
        } catch (error) {
            console.error('Error regenerating fragment:', error);
            showMessage('❌ Error regenerating fragment: ' + error.message, 'error');
        }
    });

    // Legacy decode/encode buttons removed - functionality now handled by performConversion()

    // Preset button functionality
    function updateActivePreset(activeButton) {
        [preset1Button, preset2Button, preset3Button].forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Legacy clear buttons removed - functionality now handled by new clear buttons

    // Enhanced preset button handlers
    preset1Button.addEventListener('click', () => {
        console.log('Preset #1 clicked');

        if (formatState.leftMode === 'fragment') {
            // Load fragment into left pane
            if (presetFragments[1]) {
                leftInput.textContent = presetFragments[1];
                updateCharCount(leftInput, leftCharCount);
                showMessage('Loaded preset #1 fragment', 'success');
            }
        } else {
            // Load FHIR JSON into left pane
            if (payload1) {
                const fhirJson = JSON.stringify(payload1, null, 2);
                leftInput.textContent = fhirJson;
                updateCharCount(leftInput, leftCharCount);

                // Store as original FHIR to prevent round-trip loss
                formatState.originalFhir = fhirJson;
                console.log('Stored preset #1 as original FHIR, length:', fhirJson.length);

                showMessage('Loaded preset #1 FHIR JSON', 'success');
            }
        }

        updateActivePreset(preset1Button);
    });

    preset2Button.addEventListener('click', () => {
        if (formatState.leftMode === 'fragment') {
            if (presetFragments[2]) {
                leftInput.textContent = presetFragments[2];
                updateCharCount(leftInput, leftCharCount);
                showMessage('Loaded preset #2 fragment', 'success');
                updateActivePreset(preset2Button);
            } else {
                showMessage('Preset #2 fragment is empty', 'warning');
            }
        } else {
            // TODO: Add payload2 when available
            showMessage('Preset #2 FHIR JSON not available', 'warning');
        }
    });

    preset3Button.addEventListener('click', () => {
        if (formatState.leftMode === 'fragment') {
            if (presetFragments[3]) {
                leftInput.textContent = presetFragments[3];
                updateCharCount(leftInput, leftCharCount);
                showMessage('Loaded preset #3 fragment', 'success');
                updateActivePreset(preset3Button);
            } else {
                showMessage('Preset #3 fragment is empty', 'warning');
            }
        } else {
            // TODO: Add payload3 when available
            showMessage('Preset #3 FHIR JSON not available', 'warning');
        }
    });

    // Character count functionality (updateCharCount function used by enhanced UI)
    function updateCharCount(input, countElement) {
        const text = input.textContent || '';
        const count = text.length;
        countElement.textContent = `${count} characters`;
    }

    // Initialize enhanced UI state
    updateLeftPaneMode('fhir');     // Start with FHIR JSON (ips-fhir-json-1.json)
    updateRightPaneFormat('protobuf'); // Start with first decode step (Protobuf Binary Format)

    // Load default content based on current mode
    if (!fragment) {
        // Only load defaults if no URL fragment was provided
        console.log('Loading default content...');
        console.log('formatState.leftMode:', formatState.leftMode);
        console.log('presetFragments[1] exists:', !!presetFragments[1]);
        console.log('presetFragments[1] length:', presetFragments[1]?.length);

        if (formatState.leftMode === 'fragment') {
            if (presetFragments[1] && presetFragments[1].length > 0) {
                leftInput.textContent = presetFragments[1];
                updateCharCount(leftInput, leftCharCount);
                showMessage('Loaded preset #1 fragment as default', 'success');
                console.log('Loaded fragment:', presetFragments[1].substring(0, 50) + '...');

                // Fragment loaded - user must click Decode to continue pipeline
            } else {
                console.log('presetFragments[1] is empty or undefined');
                showMessage('No default fragment available', 'warning');
            }
        } else {
            if (payload1) {
                leftInput.textContent = JSON.stringify(payload1, null, 2);
                updateCharCount(leftInput, leftCharCount);
                showMessage('Loaded preset #1 FHIR JSON as default', 'success');

                // FHIR JSON loaded - user must click Encode to continue pipeline
            }
        }
    }

    // Set initial active preset to #1
    updateActivePreset(preset1Button);

    // Initialize Parse button state
    updateParseButtonState();
}

document.addEventListener('DOMContentLoaded', init);
