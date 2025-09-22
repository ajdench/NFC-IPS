/**
 * Global Constants and Configuration
 * Purpose: Centralize all hardcoded values following AI-CODEGEN-SPEC
 * Usage: Import specific constants rather than using magic numbers
 */

// =============================================================================
// URL ROUTES AND NAVIGATION
// =============================================================================
export const ROUTES = {
    HOME: 'nfc/ips/home.html',
    VIEWER: 'nfc/ips/viewer.html',
    ENCODING: 'nfc/ips/encoding.html'
};

// =============================================================================
// UI THEME AND STYLING
// =============================================================================
export const COLORS = {
    // Primary theme colors
    PRIMARY_BLUE: '#2196F3',
    PRIMARY_BLUE_HOVER: '#1976D2',
    PRIMARY_BLUE_DISABLED: '#BBDEFB',

    // Button colors
    ORANGE_MAIN: '#e65100',
    ORANGE_HOVER: '#cc4100',
    ORANGE_PALE: '#FFD0A0',
    ORANGE_PALE_HOVER: '#FFB74D',

    GREEN_MAIN: '#388e3c',
    GREEN_HOVER: '#2e7031',

    // Text colors
    TEXT_DARK: '#555',
    TEXT_ERROR: 'lightcoral',

    // Background colors
    BG_PAGE: '#f4f4f4',
    BG_CONTAINER: '#fff',
    BG_DETAIL: '#cccccc',

    // Stage colors
    STAGE_POI: '#ffcccc',
    STAGE_ORANGE: '#ffe0b2',
    STAGE_YELLOW: '#ffe899',
    STAGE_GREEN: '#c8e6c9',
    STAGE_BLUE: '#a8d2ff',
    STAGE_PURPLE: '#e1bee7'
};

// =============================================================================
// DIMENSIONS AND SPACING
// =============================================================================
export const DIMENSIONS = {
    // Base sizing unit
    BASE_UNIT: '15px',

    // Padding and margins
    STANDARD_PADDING: 'var(--standard-padding)',
    HALF_PADDING: 'calc(var(--standard-padding) / 2)',

    // Button dimensions
    BUTTON_HEIGHT: 'calc(var(--standard-padding) * 2)',
    BUTTON_WIDTH_STANDARD: 'calc(var(--standard-padding) * 4)',
    BUTTON_BORDER_RADIUS: 'calc(var(--standard-padding) * 2)',

    // Pane dimensions
    PANE_BUTTON_HEIGHT: 'calc(var(--standard-padding) * 1.5)',
    PANE_BORDER_RADIUS: 'var(--standard-padding)'
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================
export const TYPOGRAPHY = {
    // Font sizes
    FONT_BASE: 'var(--font-size-uniform)',
    FONT_SMALL: 'calc(var(--font-size-uniform) * 0.8)',
    FONT_LARGE: 'calc(var(--font-size-uniform) * 1.5)',
    FONT_XLARGE: 'calc(var(--font-size-uniform) * 3)',

    // Font families
    FONT_MONO: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",

    // Line heights
    LINE_HEIGHT_DEFAULT: '1.4'
};

// =============================================================================
// ANIMATION AND TRANSITIONS
// =============================================================================
export const ANIMATIONS = {
    TRANSITION_FAST: '0.3s ease',
    TRANSITION_STANDARD: '0.4s ease',

    // Hover effects
    BUTTON_HOVER_TRANSITION: 'background-color 0.3s ease',
    COLOR_TRANSITION: 'color 0.3s ease'
};

// =============================================================================
// MEDICAL TERMINOLOGY SYSTEMS
// =============================================================================
export const TERMINOLOGY_SYSTEMS = {
    SNOMED_CT: {
        url: 'http://snomed.info/sct',
        short: 'sct',
        name: 'SNOMED CT',
        id: 1
    },
    LOINC: {
        url: 'http://loinc.org',
        short: 'loinc',
        name: 'LOINC',
        id: 2
    },
    UCUM: {
        url: 'http://unitsofmeasure.org',
        short: 'ucum',
        name: 'UCUM',
        id: 3
    },
    HL7_CONDITION: {
        url: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        short: 'hl7-condition',
        name: 'HL7 Condition Clinical',
        id: 4
    },
    HL7_VERIFICATION: {
        url: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        short: 'hl7-verification',
        name: 'HL7 Verification Status',
        id: 5
    },
    NHS_IDENTIFIER: {
        url: 'https://fhir.nhs.uk/Id/nhs-number',
        short: 'nhs-id',
        name: 'NHS Number',
        id: 8
    }
};

// =============================================================================
// MEDICAL CARE STAGES
// =============================================================================
export const CARE_STAGES = {
    POI: {
        name: 'Point of Injury',
        shortName: 'POI',
        color: COLORS.STAGE_POI,
        order: 1
    },
    CASEVAC: {
        name: 'Casualty Evacuation',
        shortName: 'CASEVAC',
        color: COLORS.STAGE_ORANGE,
        order: 2
    },
    MEDEVAC: {
        name: 'Medical Evacuation',
        shortName: 'MEDEVAC',
        color: COLORS.STAGE_YELLOW,
        order: 3
    },
    R1: {
        name: 'Role 1 Medical Facility',
        shortName: 'R1',
        color: COLORS.STAGE_GREEN,
        order: 4
    },
    R2: {
        name: 'Role 2 Medical Facility',
        shortName: 'R2',
        color: COLORS.STAGE_BLUE,
        order: 5
    },
    R3: {
        name: 'Role 3 Medical Facility',
        shortName: 'R3',
        color: COLORS.STAGE_PURPLE,
        order: 6
    }
};

// =============================================================================
// LOCAL STORAGE KEYS
// =============================================================================
export const STORAGE_KEYS = {
    CURRENT_IPS_FHIR: 'currentIpsFhir',
    USER_PREFERENCES: 'nfcIpsUserPrefs',
    TERMINOLOGY_CACHE: 'terminologyCache'
};

// =============================================================================
// API CONFIGURATION
// =============================================================================
export const API_CONFIG = {
    // Terminology service simulation
    SIMULATION_DELAY_MS: 25,
    NETWORK_TIMEOUT_MS: 5000,

    // External terminology servers (for future use)
    EXTERNAL_TERMINOLOGY_URL: 'https://tx.fhir.org/r4',

    // Version information
    TERMINOLOGY_VERSION: '2024.03.01',
    SUPPORTED_FHIR_VERSION: 'R4'
};

// =============================================================================
// COMPRESSION AND ENCODING
// =============================================================================
export const COMPRESSION = {
    // Target compression ratios
    TARGET_COMPRESSION_PHASE_1: 0.926, // 92.6%
    TARGET_COMPRESSION_PHASE_2: 0.95,  // 95%
    TARGET_COMPRESSION_PHASE_3: 0.96,  // 96%
    TARGET_COMPRESSION_PHASE_4: 0.97,  // 97%

    // Bundle size thresholds
    LARGE_BUNDLE_THRESHOLD: 50000,     // 50KB
    XLARGE_BUNDLE_THRESHOLD: 100000    // 100KB
};

// =============================================================================
// ERROR MESSAGES
// =============================================================================
export const ERROR_MESSAGES = {
    PARSE_ERROR: 'Failed to parse input data',
    NETWORK_ERROR: 'Network connection error',
    TERMINOLOGY_NOT_FOUND: 'Terminology code not found',
    INVALID_FHIR: 'Invalid FHIR Bundle format',
    COMPRESSION_FAILED: 'Compression operation failed',
    ENCODING_ERROR: 'Encoding operation failed'
};

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================
export const SUCCESS_MESSAGES = {
    FRAGMENT_ENCODED: 'Successfully encoded to URL fragment',
    FHIR_DECODED: 'Successfully decoded FHIR Bundle',
    TERMINOLOGY_RESOLVED: 'Terminology codes resolved',
    CACHE_UPDATED: 'Cache updated successfully'
};

// =============================================================================
// VALIDATION PATTERNS
// =============================================================================
export const VALIDATION = {
    // NHS Number format: xxx xxx xxxx
    NHS_NUMBER_PATTERN: /^\d{3}\s\d{3}\s\d{4}$/,

    // UUID pattern for FHIR resources
    UUID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

    // Base64 URL-safe pattern
    BASE64_URL_PATTERN: /^[A-Za-z0-9_-]+$/
};

// =============================================================================
// BASE PATH HELPERS (support GitHub Pages deployment paths)
// =============================================================================
const BASE_URL = new URL('../', import.meta.url);

// =============================================================================
// DEMO PAYLOAD FILES
// =============================================================================
export const DEMO_PAYLOADS = {
    PAYLOAD_1: new URL('payload-1.json', BASE_URL).href,
    PAYLOAD_2: new URL('payload-2.json', BASE_URL).href,
    IPS_FHIR_JSON_1: new URL('ips-fhir-json-1.json', BASE_URL).href
};

// =============================================================================
// RESOURCE FILES
// =============================================================================
export const RESOURCES = {
    NFC_PAYLOAD_PROTO: new URL('resources/nfc_payload.proto', BASE_URL).href,
    NFC_PAYLOAD_LEGACY_PROTO: new URL('resources/nfc_payload_legacy.proto', BASE_URL).href
};

// =============================================================================
// FHIR EXTENSION URLS
// =============================================================================
export const FHIR_EXTENSIONS = {
    PATIENT_BLOOD_GROUP: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
    PATIENT_NATIONALITY: 'http://hl7.org/fhir/StructureDefinition/patient-nationality',
    CARE_STAGE: 'http://example.org/fhir/StructureDefinition/care-stage'
};

// =============================================================================
// FHIR PROFILE URLS
// =============================================================================
export const FHIR_PROFILES = {
    IPS_BUNDLE: 'http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips'
};

// =============================================================================
// ADDITIONAL COLORS FOR CSS REPLACEMENT
// =============================================================================
export const ADDITIONAL_COLORS = {
    // Border and secondary colors
    BORDER_LIGHT: '#f0f0f0',
    TEXT_MUTED: '#666',
    TEXT_DARKER: '#555',
    BG_MUTED: '#f0f0f0',
    BG_DARKER: '#888',
    BG_DARKEST: '#555',

    // Toast message colors
    TOAST_SUCCESS_BORDER: '#90EE90',
    TOAST_SUCCESS_TEXT: '#5cb85c',
    TOAST_WARNING_BORDER: '#FFE4B5',
    TOAST_WARNING_TEXT: '#d2973d',
    TOAST_ERROR_BORDER: '#FFB6C1',
    TOAST_ERROR_TEXT: '#c9302c'
};

/**
 * Example Usage:
 *
 * import { COLORS, ROUTES, DEMO_PAYLOADS, RESOURCES } from './config/constants.js';
 *
 * // Color constants
 * element.style.color = COLORS.PRIMARY_BLUE;
 *
 * // Navigation routes
 * window.location.href = ROUTES.ENCODING;
 *
 * // Demo payload files (auto-resolved paths)
 * const payload = await fetch(DEMO_PAYLOADS.IPS_FHIR_JSON_1);
 *
 * // Resource files (protobuf schemas)
 * const proto = await fetch(RESOURCES.NFC_PAYLOAD_PROTO);
 *
 * // Validation patterns
 * const isValidNHS = VALIDATION.NHS_NUMBER_PATTERN.test(number);
 */
