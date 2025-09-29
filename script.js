
/**
 * NFC IPS VIEWER - CORE APPLICATION
 *
 * Purpose: International Patient Summary (IPS) viewer for NFC-encoded medical data
 * Architecture: Modular ES6+ JavaScript with protobuf compression and FHIR interoperability
 *
 * Key Components:
 * - Terminology Service: Medical code resolution (SNOMED CT, LOINC, UCUM)
 * - Codec Pipeline: FHIR ↔ CodeRef ↔ Protobuf ↔ Base64 compression
 * - UI Rendering: Dynamic medical stage visualization
 * - Data Models: Patient demographics, vitals, conditions, events, allergies
 *
 * Dependencies:
 * - protobuf.min.js: Protocol buffer serialization
 * - pako.min.js: Data compression/decompression
 * - style.css: CSS variable system for theming
 * - config/constants.js: Centralized configuration values
 *
 * @version 1.0.0
 * @author AI-Generated following AI-CODEGEN-SPEC
 */

// =============================================================================
// IMPORTS AND DEPENDENCIES
// =============================================================================

import {
    TERMINOLOGY_SYSTEMS,
    DEMO_PAYLOADS,
    RESOURCES,
    FHIR_EXTENSIONS,
    FHIR_PROFILES,
    CARE_STAGE_COUNT
} from './config/constants.js';
import {
    normaliseBase64,
    base64ToUint8Array,
    base64ToString
} from './util/base64.js';
import {
    tryParseJson,
    looksLikeJson,
    safeDeepClone
} from './util/json.js';

// =============================================================================
// CONFIGURATION AND DATA MODELS
// =============================================================================

/**
 * Dual Title Display Configuration
 * Purpose: Global settings for displaying both short and full titles in panes
 * Usage: Controls which panes show dual titles and transparency settings
 */
const DUAL_TITLE_CONFIG = {
    enabled: true,
    transparency: 0.5,
    enabledPanes: new Set(['patient', 'clinicalSummary', 'poi', 'casevac', 'axp', 'medevac', 'r1', 'fwdTacevac', 'r2', 'rearTacevac', 'r3', 'stratevac']) // All panes enabled
};

/**
 * Medical Stage Configuration
 * Purpose: Defines UI rendering and data mapping for OPCP (Operational Patient Care Pathway) stages
 * Usage: Drives dynamic info box generation and color coding
 */
const infoBoxConfig = [
    { title: 'Patient Demographics', colorClass: 'grey', dataKey: 'patient' },
    { title: 'Clinical Summary', colorClass: 'khaki', dataKey: 'clinicalSummary' },
    { title: 'Point of Injury and/or Illness (POI)', colorClass: 'red', dataKey: 'poi' },
    { title: 'Casualty Evacuation (CASEVAC)', colorClass: 'yellow', dataKey: 'casevac' },
    { title: 'Ambulance Exchange Point (AXP)', colorClass: 'axp', dataKey: 'axp' },
    { title: 'Medical Evacuation (MEDEVAC)', colorClass: 'orange', dataKey: 'medevac' },
    { title: 'Role 1 Care (R1)', colorClass: 'green', dataKey: 'r1' },
    { title: 'Forward Tactical Evacuation (Fwd TACEVAC)', colorClass: 'fwd-tacevac', dataKey: 'fwdTacevac' },
    { title: 'Role 2 Deployed Hospital Care', colorClass: 'blue', dataKey: 'r2' },
    { title: 'Rear Tactical Evacuation (Rear TACEVAC)', colorClass: 'rear-tacevac', dataKey: 'rearTacevac' },
    { title: 'Role 3 Deployed Hospital Care', colorClass: 'purple', dataKey: 'r3' },
    { title: 'Strategic Evacuation (STRATEVAC)', colorClass: 'stratevac', dataKey: 'stratevac' }
];

const stageTitleLookup = infoBoxConfig.reduce((acc, config) => {
    if (config.dataKey) acc[config.dataKey] = config.title;
    return acc;
}, {});

const vitalColorPalette = [
    '#d32f2f', '#1976d2', '#388e3c', '#f57f17', '#7b1fa2', '#00796b', '#5d4037', '#c2185b'
];
const vitalColorAssignments = new Map();
let vitalColorIndex = 0;

function getVitalColor(vitalType) {
    if (!vitalColorAssignments.has(vitalType)) {
        const color = vitalColorPalette[vitalColorIndex % vitalColorPalette.length];
        vitalColorAssignments.set(vitalType, color);
        vitalColorIndex += 1;
    }
    return vitalColorAssignments.get(vitalType);
}

/**
 * Medical Care Stage Identifiers
 * Purpose: Extract stage keys for data processing (excludes patient demographics)
 * Usage: Iteration over medical stages for rendering and validation
 */
const stageKeys = infoBoxConfig
    .map(config => config.dataKey)
    .filter(key => key && !['patient', 'clinicalSummary'].includes(key));

const STAGE_SHORT_TITLES = {
    poi: 'POI',
    casevac: 'CASEVAC',
    axp: 'AXP',
    medevac: 'MEDEVAC',
    r1: 'R1',
    fwdTacevac: 'Fwd TACEVAC',
    r2: 'R2 DHC',
    rearTacevac: 'Rear TACEVAC',
    r3: 'R3 DHC',
    stratevac: 'STRATEVAC'
};

const stageColorVarMap = {
    poi: { background: '--bg-color-poi', text: '--text-color-poi' },
    casevac: { background: '--bg-color-yellow', text: '--text-color-yellow' },
    axp: { background: '--bg-color-axp', text: '--text-color-axp' },
    medevac: { background: '--bg-color-orange', text: '--text-color-orange' },
    r1: { background: '--bg-color-green', text: '--text-color-green' },
    fwdTacevac: { background: '--bg-color-fwd-tacevac', text: '--text-color-fwd-tacevac' },
    r2: { background: '--bg-color-blue', text: '--text-color-blue' },
    rearTacevac: { background: '--bg-color-rear-tacevac', text: '--text-color-rear-tacevac' },
    r3: { background: '--bg-color-purple', text: '--text-color-r3' },
    stratevac: { background: '--bg-color-stratevac', text: '--text-color-stratevac' }
};

let stageBackgroundPluginRegistered = false;
let customXAxisPluginRegistered = false;

const LEGEND_ABBREVIATIONS = new Map([
    ['body temperature', 'BT'],
    ['temperature', 'BT'],
    ['heart rate', 'HR'],
    ['pulse', 'HR'],
    ['systolic blood pressure', 'SBP'],
    ['diastolic blood pressure', 'DBP'],
    ['blood pressure (systolic)', 'SBP'],
    ['blood pressure (diastolic)', 'DBP'],
    ['oxygen saturation', 'SpO2'],
    ['respiratory rate', 'RR'],
    ['glucose', 'Glu'],
    ['hemoglobin', 'Hgb'],
    ['ph of blood', 'Blood pH'],
    ['blood ph', 'Blood pH'],
    ['blood gas ph', 'Blood pH'],
    ['arterial blood ph', 'Blood pH'],
    ['venous blood ph', 'Blood pH'],
    ['spo2', 'SpO2'],
    ['sao2', 'SpO2'],
    ['map', 'MAP']
]);

function getCssVariableValue(variableName) {
    if (typeof window === 'undefined') return '';
    const computedStyle = getComputedStyle(document.documentElement);
    return computedStyle.getPropertyValue(variableName)?.trim() || '';
}

function getStageBandOpacity() {
    const value = parseFloat(getCssVariableValue('--stage-band-opacity'));
    return Number.isFinite(value) ? value : 0.35;
}

function getStageBandLabelPadding() {
    const value = parseFloat(getCssVariableValue('--standard-padding'));
    return Number.isFinite(value) ? value : 10;
}

function collectStageTimestamps(stageData = {}) {
    const timestamps = [];
    ['vitals', 'conditions', 'events'].forEach(type => {
        const items = stageData[type];
        if (!Array.isArray(items)) return;
        items.forEach(item => {
            const timestamp = extractTimestamp(item);
            if (!timestamp) return;
            const timeValue = new Date(timestamp).getTime();
            if (Number.isFinite(timeValue)) {
                timestamps.push(timeValue);
            }
        });
    });
    timestamps.sort((a, b) => a - b);
    return timestamps;
}

function computeStageBandData(stageSections = {}) {
    const bands = [];
    stageKeys.forEach((key, index) => {
        const timestamps = collectStageTimestamps(stageSections[key]);
        if (!timestamps.length) return;

        const colorVars = stageColorVarMap[key];
        if (!colorVars) return;

        const baseColor = getCssVariableValue(colorVars.background) || '#cccccc';
        const textColor = getCssVariableValue(colorVars.text) || '#333333';
        const label = STAGE_SHORT_TITLES[key] || stageTitleLookup[key] || key.toUpperCase();

        bands.push({
            key,
            label,
            baseColor,
            textColor,
            startTime: timestamps[0],
            endTime: timestamps[timestamps.length - 1],
            order: index
        });
    });
    return bands;
}

function midpoint(a, b) {
    if (Number.isFinite(a) && Number.isFinite(b)) {
        return a + (b - a) / 2;
    }
    if (Number.isFinite(a)) return a;
    if (Number.isFinite(b)) return b;
    return 0;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function abbreviateLegendLabel(label) {
    if (!label) return label;
    const key = label.toLowerCase().trim();
    return LEGEND_ABBREVIATIONS.get(key) || label;
}

const stageBackgroundPlugin = {
    id: 'stageBackgrounds',
    beforeDatasetsDraw(chart) {
        const config = chart.options.plugins?.stageBackgrounds;
        if (!config || !Array.isArray(config.bands) || !config.bands.length) return;

        const xScale = chart.scales.x;
        const chartArea = chart.chartArea;
        if (!xScale || !chartArea) return;

        const scaleMin = xScale.min;
        const scaleMax = xScale.max;
        if (!Number.isFinite(scaleMin) || !Number.isFinite(scaleMax)) return;

        const opacity = typeof config.opacity === 'number' ? config.opacity : 0.35;
        const labelPadding = config.labelPadding ?? 10;
        const bands = [...config.bands].filter(band => Number.isFinite(band.startTime) && Number.isFinite(band.endTime));
        if (!bands.length) return;

        bands.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const ctx = chart.ctx;
        const baseFont = config.font || chart.options.font?.string || Chart.defaults.font?.string || '12px sans-serif';

        bands.forEach((band, index) => {
            const prev = bands[index - 1];
            const next = bands[index + 1];

            const prevEnd = prev ? (Number.isFinite(prev.endTime) ? prev.endTime : prev.startTime) : null;
            const currentStart = Number.isFinite(band.startTime) ? band.startTime : band.endTime;
            const currentEnd = Number.isFinite(band.endTime) ? band.endTime : band.startTime;
            const nextStart = next ? (Number.isFinite(next.startTime) ? next.startTime : next.endTime) : null;

            let start = index === 0 ? scaleMin : midpoint(prevEnd, currentStart);
            let end = index === bands.length - 1 ? scaleMax : midpoint(currentEnd, nextStart);

            start = clamp(start, scaleMin, scaleMax);
            end = clamp(end, scaleMin, scaleMax);
            if (!(end > start)) return;

            const left = xScale.getPixelForValue(start);
            const right = xScale.getPixelForValue(end);
            const width = right - left;
            const top = chartArea.top;
            const height = chartArea.bottom - chartArea.top;

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = band.baseColor || '#cccccc';
            ctx.fillRect(left, top, width, height);
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = band.textColor || '#333333';
            ctx.font = `bold ${baseFont}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(band.label, left + labelPadding, top + labelPadding);
            ctx.restore();
        });
    }
};

const customXAxisLabelPlugin = {
    id: 'customXAxisLabels',
    afterDraw(chart, args, options = {}) {
        const xScale = chart.scales.x;
        const chartArea = chart.chartArea;
        if (!xScale || !chartArea || !xScale.ticks?.length) return;

        const ctx = chart.ctx;
        if (!ctx) return;

        const padding = options.padding ?? 8;
        const fontSpec = options.font || Chart.defaults.font;
        const font = Chart.helpers?.toFont ? Chart.helpers.toFont(fontSpec) : fontSpec;
        const color = options.color || xScale.options.ticks?.color || Chart.defaults.color || '#666';

        const lineHeight = font.lineHeight || (font.size * 1.2);
        const baseY = chartArea.bottom + padding;

        ctx.save();
        ctx.font = font.string || `${font.size}px ${font.family}`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';

        xScale.ticks.forEach((tick, index) => {
            if (!tick) return;
            const lines = Array.isArray(tick.labelLines) && tick.labelLines.length
                ? tick.labelLines
                : (tick.label != null ? [tick.label] : []);
            if (!lines.length) return;

            const x = xScale.getPixelForValue(tick.value);
            const align = tick.textAlign || (index === xScale.ticks.length - 1 ? 'right' : 'left');
            ctx.textAlign = align;
            const offsetX = align === 'right' ? -padding : padding;

            lines.forEach((line, lineIndex) => {
                ctx.fillText(line, x + offsetX, baseY + lineIndex * lineHeight);
            });
        });

        ctx.restore();
    }
};

let vitalsChartInstance = null;
let vitalsChartLibrary = 'chartjs';

function destroyVitalsChart() {
    if (!vitalsChartInstance) return;
    if (vitalsChartLibrary === 'chartjs' && typeof vitalsChartInstance.destroy === 'function') {
        vitalsChartInstance.destroy();
    } else if (vitalsChartLibrary === 'mini' && typeof vitalsChartInstance.destroy === 'function') {
        vitalsChartInstance.destroy();
    }
    vitalsChartInstance = null;

    resetLegendLayout();
}

function resetLegendLayout(targetWrapper = null) {
    const chartWrapper = targetWrapper || document.querySelector('.vitals-chart-wrapper');
    if (!chartWrapper) return;

    const legendWrapper = chartWrapper.querySelector('#vitals-legend-wrapper');
    if (legendWrapper) {
        legendWrapper.classList.remove('is-visible');
        legendWrapper.innerHTML = '';
        legendWrapper.style.width = '';
        legendWrapper.style.minWidth = '';
        legendWrapper.style.marginTop = '';
        legendWrapper.style.marginBottom = '';
        legendWrapper.style.height = '';
    }

    const vitalsContent = chartWrapper.closest('.vitals-content');
    if (vitalsContent) {
        vitalsContent.classList.remove('has-data');
        vitalsContent.style.setProperty('--legend-column-width', '0px');
        vitalsContent.style.setProperty('--legend-spacer-width', 'var(--standard-padding)');
    }
}

/**
 * Application State Container
 * Purpose: Centralized state management for UI and data synchronization
 *
 * Properties:
 * - demos: Available demo payloads for testing
 * - fragmentViewModel: Current NFC fragment data model
 * - currentViewModel: Active display data (post-processing)
 * - comparisonViewModel: Secondary data for comparison features
 */
const appState = {
    demos: [],
    fragmentViewModel: null,
    currentViewModel: null,
    comparisonViewModel: null
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================


/**
 * Human-Readable Date Formatter
 * Purpose: Convert ISO date strings to readable format for patient records
 * Usage: Display dates in medical records and patient information
 *
 * @param {string} dateString - ISO date string (YYYY-MM-DD format)
 * @returns {string} - Formatted date ('January 15, 2024') or 'N/A' if invalid
 *
 * Example:
 *   formatDate('2024-01-15') → 'January 15, 2024'
 *   formatDate(null) → 'N/A'
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString(undefined, options);
}

/**
 * Compact DateTime Formatter
 * Purpose: Format datetime for compact display in medical stages and events
 * Usage: Show timestamps in care stage events with space-efficient format
 *
 * @param {string} dateString - ISO datetime string
 * @returns {string} - Compact format ('15 Jan 24 14:30') or original if invalid
 *
 * Example:
 *   formatDateTime('2024-01-15T14:30:00Z') → '15 Jan 24 14:30'
 *   formatDateTime('invalid') → 'invalid'
 */
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

function formatDateTimeWithBullet(dateString) {
    const formatted = formatDateTime(dateString);
    const parts = formatted.split(' ');
    if (parts.length >= 4) {
        const datePart = `${parts[0]} ${parts[1]} ${parts[2]}`;
        const timePart = parts.slice(3).join(' ');
        return `${datePart} • ${timePart}`;
    }
    const idx = formatted.lastIndexOf(' ');
    return idx > -1 ? `${formatted.slice(0, idx)} • ${formatted.slice(idx + 1)}` : formatted;
}

/**
 * Time-Only Formatter
 * Purpose: Extract and format just the time portion from datetime strings
 * Usage: Display time in vitals and measurements where date is shown separately
 *
 * @param {string} dateString - ISO datetime string
 * @returns {string} - Time in HH:MM format or 'N/A' if invalid
 *
 * Example:
 *   formatTimeOnly('2024-01-15T14:30:00Z') → '14:30'
 *   formatTimeOnly(null) → 'N/A'
 */
function formatTimeOnly(dateString) {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;

    const hours = parsed.getHours().toString().padStart(2, '0');
    const minutes = parsed.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

/**
 * Date Formatter for Patient Comparison
 * Purpose: Standardized date format for comparing patient record changes
 * Usage: IPS change detection and comparison views
 *
 * @param {string} dateString - ISO date string
 * @returns {string|null} - Compact date ('15 Jan 24') or null if invalid
 *
 * Example:
 *   formatDateForComparison('2024-01-15T00:00:00Z') → '15 Jan 24'
 *   formatDateForComparison('invalid') → null
 */
function formatDateForComparison(dateString) {
    if (!dateString) return null;
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;

    const day = parsed.getDate();
    const month = parsed.toLocaleDateString('en-US', { month: 'short' });
    const year = parsed.getFullYear().toString().slice(-2);

    return `${day} ${month} ${year}`;
}

/**
 * Medical Unit Inference Engine
 * Purpose: Infer appropriate units for medical measurements based on LOINC codes
 * Usage: Provide default units when measurements lack explicit unit information
 *
 * @param {string} system - Terminology system URL (e.g., 'http://loinc.org')
 * @param {string} code - Medical measurement code (e.g., '8480-6' for systolic BP)
 * @returns {string} - Inferred unit ('mmHg', 'kg', 'bpm') or empty string if unknown
 *
 * Example:
 *   inferUnitFromCode('http://loinc.org', '8480-6') → 'mmHg' (systolic blood pressure)
 *   inferUnitFromCode('http://loinc.org', '29463-7') → 'kg' (body weight)
 */
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

        // SNOMED medication administrations (common IPS examples)
        'sct:387207008': 'mg',       // Morphine
        'sct:387494007': 'mg',       // Ibuprofen
        'sct:387467008': 'mg',       // Tramadol
        'sct:372687004': 'mg',       // Amoxicillin
        'sct:387562000': 'g',        // Amoxicillin (IV) - grams
        'sct:108761006': 'mg',       // Epinephrine
        'sct:182777000': 'mg',       // Tranexamic acid (example)
        'sct:16990000': 'mL',        // Ringer's solution / fluids
        'sct:432102000': 'mL',       // Normal saline
        'sct:387713003': 'dose',     // Cephalexin (single dose)
    };

    const key = `${system}:${code}`;
    return unitMap[key] || null;
}

/**
 * Temperature Unit Converter
 * Purpose: Standardize temperature display with dual units (Celsius/Fahrenheit)
 * Usage: Convert temperature measurements for international medical records
 *
 * @param {number} value - Temperature value
 * @param {string} unit - Input unit ('°F', '°C', or other)
 * @returns {string|null} - Dual format '36.5°C [97.7°F]' or null if invalid
 *
 * Example:
 *   formatTemperature(98.6, '°F') → '37.0°C [98.6°F]'
 *   formatTemperature(36.5, '°C') → '36.5°C [97.7°F]'
 */
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

/**
 * Temperature Code Detector
 * Purpose: Identify LOINC codes that represent temperature measurements
 * Usage: Trigger temperature-specific formatting and unit conversion
 *
 * @param {string} system - Terminology system ('loinc')
 * @param {string} code - LOINC code to check
 * @returns {boolean} - True if code represents body temperature
 *
 * Example:
 *   isTemperatureCode('loinc', '8310-5') → true (body temperature)
 *   isTemperatureCode('loinc', '8867-4') → false (heart rate)
 */
function isTemperatureCode(system, code) {
    return system === 'loinc' && code === '8310-5';
}

/**
 * Terminology System Code Prefix Resolver
 * Purpose: Map terminology system names to standardized prefixes for CodeRef
 * Usage: Convert between different system naming conventions in codec pipeline
 *
 * @param {string} system - System identifier ('sct', 'loinc', 'icd')
 * @returns {string} - Standardized prefix ('snomed', 'loinc', 'icd10')
 *
 * Example:
 *   resolveCodePrefix('sct') → 'snomed'
 *   resolveCodePrefix('loinc') → 'loinc'
 */
function resolveCodePrefix(system) {
    const prefixMap = {
        'sct': 'snomed',
        'loinc': 'loinc',
        'icd': 'icd10' // Will be enhanced to support icd11 based on code family
    };
    return prefixMap[system] || system;
}

function normalizeRouteDisplay(routeValue) {
    if (!routeValue) return '';
    const trimmed = routeValue.trim();
    return trimmed.replace(/\s*route$/i, '');
}

// Global debug control - set to false to disable all debug logging
window.DEBUG_ENABLED = false;

/**
 * Clean debug logging for MIST date display analysis
 * Note: File logging disabled, console output controlled by DEBUG_ENABLED
 */
function debugMIST(message, data = null) {
    if (!window.DEBUG_ENABLED) return;

    // Auto-download logging disabled - only console output when enabled

    // Keep the file logging logic for future use but disable accumulation
    // const timestamp = new Date().toISOString();
    // const logEntry = `${timestamp}: ${message}`;
    // const fullEntry = data ? `${logEntry}\n${JSON.stringify(data, null, 2)}\n---\n` : `${logEntry}\n`;
    // if (!window.mistDebugLog) window.mistDebugLog = '';
    // window.mistDebugLog += fullEntry;
}

/**
 * Export debug log to file (manual use only)
 * Note: Auto-download disabled. Enable with window.DEBUG_ENABLED = true first
 */
function exportMISTDebugLog() {
    if (!window.mistDebugLog) {
        return;
    }
    const blob = new Blob([window.mistDebugLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mist-debug-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.exportMISTDebugLog = exportMISTDebugLog;

/**
 * Group medical data chronologically into MIST rows for consistent date/time display
 * Purpose: Ensure first pill in each chronological row shows date, subsequent pills show time only
 *
 * @param {Array} vitals - Array of vital data objects
 * @param {Array} conditions - Array of condition data objects
 * @param {Array} events - Array of event data objects
 * @returns {Array} - Array of chronological rows with mixed data types
 */
/**
 * Extract timestamp from an item regardless of field structure
 * @param {Object} item - The data item (vitals, conditions, events)
 * @returns {string|null} - ISO timestamp string or null if no timestamp
 */
function extractTimestamp(item) {
    return item.time || item.onset || item.rawData?.dateTime || null;
}

function createMISTChronologicalRows(vitals, conditions, events) {
    debugMIST('createMISTChronologicalRows called', {
        vitalCount: vitals.length,
        conditionCount: conditions.length,
        eventCount: events.length
    });
    // Combine all data with timestamps and types
    const allData = [
        ...vitals.map(item => ({ ...item, dataType: 'vitals' })),
        ...conditions.map(item => ({ ...item, dataType: 'conditions' })),
        ...events.map(item => ({ ...item, dataType: 'events' }))
    ];

    // Separate data with and without timestamps
    const withTimestamps = allData.filter(item => extractTimestamp(item));
    const withoutTimestamps = allData.filter(item => !extractTimestamp(item));

    debugMIST('After timestamp analysis', {
        originalCount: allData.length,
        withTimestamps: withTimestamps.length,
        withoutTimestamps: withoutTimestamps.length,
        eventsSample: allData.filter(item => item.dataType === 'events').slice(0, 3).map(item => ({
            dataType: item.dataType,
            time: item.time,
            onset: item.onset,
            rawDataDateTime: item.rawData?.dateTime,
            description: item.description,
            hasTime: !!item.time,
            hasOnset: !!item.onset,
            hasRawDataDateTime: !!item.rawData?.dateTime
        })),
        sampleWithTimestamps: withTimestamps.slice(0, 2).map(item => ({
            dataType: item.dataType,
            time: item.time,
            onset: item.onset,
            description: item.description
        })),
        sampleWithoutTimestamps: withoutTimestamps.slice(0, 2).map(item => ({
            dataType: item.dataType,
            description: item.description
        }))
    });

    // Sort timestamped data chronologically (oldest first for proper MIST order)
    withTimestamps.sort((a, b) => {
        const timeA = new Date(extractTimestamp(a));
        const timeB = new Date(extractTimestamp(b));
        return timeA - timeB;
    });

    // Mark first pill of each date PER DATA TYPE for display logic BEFORE reversal
    // This ensures the oldest pill of each type gets the full date
    const dateTrackingByType = {};

    withTimestamps.forEach((item, index) => {
        const timestamp = extractTimestamp(item);
        const currentDate = formatDateForComparison(timestamp);
        const dataType = item.dataType;

        // Track last date per data type independently
        if (!dateTrackingByType[dataType]) {
            dateTrackingByType[dataType] = null;
        }

        if (currentDate !== dateTrackingByType[dataType]) {
            item.isFirstDisplayedInRow = true;
            dateTrackingByType[dataType] = currentDate;
            debugMIST(`Marked isFirstDisplayedInRow=true for ${dataType} item ${index} (oldest in chronological order)`, {
                dataType: item.dataType,
                description: item.description,
                timestamp: timestamp,
                currentDate: currentDate
            });
        } else {
            item.isFirstDisplayedInRow = false;
        }
    });

    // Keep chronological order (oldest first) - DO NOT REVERSE for UI display
    // withTimestamps.reverse(); // REMOVED - UI should show oldest->newest left->right

    // Mark non-timestamped data: First item shows "No Date", others show nothing
    withoutTimestamps.forEach((item, index) => {
        item.isFirstDisplayedInRow = (index === 0);  // Only first item shows "No Date"
        item.noTimestamp = true;  // Flag for special handling
    });

    const finalData = [...withTimestamps, ...withoutTimestamps];

    debugMIST('Final MIST chronological rows', {
        totalCount: finalData.length,
        timestampedCount: withTimestamps.length,
        nonTimestampedCount: withoutTimestamps.length,
        firstDisplayedInRowCount: finalData.filter(item => item.isFirstDisplayedInRow).length,
        perTypeFirstCount: {
            vitals: finalData.filter(item => item.dataType === 'vitals' && item.isFirstDisplayedInRow).length,
            conditions: finalData.filter(item => item.dataType === 'conditions' && item.isFirstDisplayedInRow).length,
            events: finalData.filter(item => item.dataType === 'events' && item.isFirstDisplayedInRow).length
        },
        finalOrder: finalData.slice(0, 5).map(item => ({
            dataType: item.dataType,
            description: item.description,
            isFirstDisplayedInRow: item.isFirstDisplayedInRow,
            timestamp: extractTimestamp(item),
            noTimestamp: item.noTimestamp
        }))
    });

    return finalData;
}

/**
 * Standardized Medical Data Pill Generator
 * Purpose: Create consistent UI pills for different types of medical data
 * Usage: Generate formatted display elements for vitals, conditions, medications
 *
 * @param {string} type - Data type ('vital', 'condition', 'medication', 'event')
 * @param {Object} rawData - Medical data object with code, description, value, etc.
 * @param {Object} sectionDateTracker - Tracks dates for efficient display grouping
 * @param {boolean} isFirstDisplayedInRow - Whether this is the first pill displayed in a chronological row (left-to-right MIST order)
 * @returns {HTMLElement} - Formatted pill element for medical data display
 *
 * Example:
 *   createStandardizedPill('vital', {code: '8480-6', value: 120, unit: 'mmHg'})
 *   → HTML pill element for systolic blood pressure
 */
function createStandardizedPill(type, rawData, sectionDateTracker, isFirstDisplayedInRow = false) {
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
        // Conditions rely on date-only display; keep tooltip descriptive text
        valueContent = '';
        tooltipValueContent = description;
    } else if (type === 'events') {
        const cleanedDose = typeof dose === 'number'
            ? dose.toString()
            : (dose || '').toString().trim();
        const cleanedRoute = (route || '').toString().trim();

        const descriptionText = (description || '').toString().trim();
        const matchesDescription = cleanedDose && descriptionText
            && cleanedDose.toLowerCase() === descriptionText.toLowerCase();

        const hasDose = cleanedDose !== ''
            && cleanedDose.toLowerCase() !== 'nan'
            && !matchesDescription;
        const isPureNumericDose = hasDose && /^[0-9]+(?:\.[0-9]+)?$/.test(cleanedDose);

        let unitDisplay = unit || '';
        if (isPureNumericDose && !unitDisplay) {
            unitDisplay = inferUnitFromCode(code.system, code.code) || '';
        }

        const tooltipExtras = [];
        const displayParts = [];

        if (hasDose) {
            const doseWithUnit = unitDisplay ? `${cleanedDose} ${unitDisplay}` : cleanedDose;
            displayParts.push(doseWithUnit);
            tooltipExtras.push(doseWithUnit);
        }

        const isMeaningfulRoute = cleanedRoute && !/^manual(?:\b|\s)/i.test(cleanedRoute);
        if (isMeaningfulRoute) {
            displayParts.push(cleanedRoute);
            tooltipExtras.push(cleanedRoute);
        }

        valueContent = displayParts.join(' • ');

        tooltipValueContent = [descriptionText, ...tooltipExtras]
            .filter(Boolean)
            .join(' | ') || descriptionText;
    }

    // Handle date display logic for MIST chronological rows
    let dateDisplay = '';
    let tooltipDateDisplay = '';

    if (primaryTime) {
        const currentDate = formatDateForComparison(primaryTime);
        const fullDateTime = formatDateTimeWithBullet(primaryTime);
        const timeOnly = formatTimeOnly(primaryTime);

        // MIST logic: First pill in chronological row shows date, subsequent pills show time only
        if (isFirstDisplayedInRow) {
            dateDisplay = fullDateTime;
            sectionDateTracker.lastDate = currentDate;
            debugMIST('Pill showing FULL DATE', {
                type: type,
                description: description,
                isFirstDisplayedInRow: isFirstDisplayedInRow,
                dateDisplay: dateDisplay,
                primaryTime: primaryTime
            });
        } else {
            dateDisplay = timeOnly;
            debugMIST('Pill showing TIME ONLY', {
                type: type,
                description: description,
                isFirstDisplayedInRow: isFirstDisplayedInRow,
                dateDisplay: dateDisplay,
                primaryTime: primaryTime
            });
        }

        tooltipDateDisplay = fullDateTime; // Tooltip always shows full date
    } else {
        // Handle data without timestamps: show "No Date" on first item only
        if (rawData.noTimestamp && isFirstDisplayedInRow) {
            dateDisplay = 'No Date';
            tooltipDateDisplay = 'No timestamp available';
            debugMIST('Pill showing NO DATE (first non-timestamped)', {
                type: type,
                description: description,
                isFirstDisplayedInRow: isFirstDisplayedInRow,
                dateDisplay: dateDisplay
            });
        } else {
            // No date display for subsequent non-timestamped items
            debugMIST('Pill has NO TIMESTAMP (no display)', {
                type: type,
                description: description,
                isFirstDisplayedInRow: isFirstDisplayedInRow,
                time: time,
                onset: onset
            });
        }
    }

    // Assemble final value and tooltip
    const valueParts = [valueContent, dateDisplay].filter(Boolean);
    const finalValue = valueParts.join(' • ');


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

/**
 * Date of Birth Formatter
 * Purpose: Convert integer date format (YYYYMMDD) to ISO date string
 * Usage: Format patient birth dates from compressed numeric format
 *
 * @param {number|string} dob - Date of birth as 8-digit number (20240115)
 * @returns {string|undefined} - ISO date string ('2024-01-15') or undefined if invalid
 *
 * Example:
 *   formatDobValue(20240115) → '2024-01-15'
 *   formatDobValue(240115) → '0024-01-15' (zero-padded)
 */
function formatDobValue(dob) {
    if (dob === undefined || dob === null) return undefined;
    const dobString = String(dob).padStart(8, '0');
    const year = dobString.slice(0, 4);
    const month = dobString.slice(4, 6);
    const day = dobString.slice(6, 8);
    return `${year}-${month}-${day}`;
}

/**
 * NHS Number Formatter
 * Purpose: Format 10-digit NHS numbers with standard spacing (XXX XXX XXXX)
 * Usage: Display NHS numbers in patient information following UK conventions
 *
 * @param {string} nhsNumber - Unformatted NHS number (1234567890)
 * @returns {string} - Formatted NHS number ('123 456 7890') or original if invalid
 *
 * Example:
 *   formatNHSNumber('1234567890') → '123 456 7890'
 *   formatNHSNumber('invalid') → 'invalid'
 */
function formatNHSNumber(nhsNumber) {
    if (!nhsNumber || typeof nhsNumber !== 'string' || nhsNumber.length !== 10) {
        return nhsNumber;
    }
    return `${nhsNumber.substring(0, 3)} ${nhsNumber.substring(3, 6)} ${nhsNumber.substring(6, 10)}`;
}

/**
 * CodeRef Key Generator
 * Purpose: Generate consistent string keys for CodeRef objects in terminology lookups
 * Usage: Create hash keys for terminology caching and code resolution
 *
 * @param {Object} codeRef - CodeRef object with sys and code properties
 * @returns {string} - Key string ('system:code') or code only if no system
 *
 * Example:
 *   codeRefKey({sys: 'sct', code: '12345'}) → 'sct:12345'
 *   codeRefKey({code: '12345'}) → '12345'
 */
function codeRefKey(codeRef) {
    if (!codeRef) return '';
    const system = codeRef.sys || '';
    const code = codeRef.code || '';
    return system ? `${system}:${code}` : code;
}

/**
 * CodeRef Normalizer
 * Purpose: Standardize CodeRef objects with fallback handling for missing data
 * Usage: Ensure consistent CodeRef structure throughout the application
 *
 * @param {Object} codeRef - Raw CodeRef object that might be incomplete
 * @param {number} fallbackIndex - Index number for fallback code generation
 * @returns {Object} - Normalized CodeRef with system, code, and ref properties
 *
 * Example:
 *   normaliseCodeRef({sys: 'sct', code: '12345'}) → {system: 'sct', code: '12345', ref: 'sct:12345'}
 *   normaliseCodeRef(null, 1) → {system: '', code: 'Code #1', ref: 'Code #1'}
 */
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

// === TERMINOLOGY SERVICE ARCHITECTURE ===
// Production-grade terminology server simulation matching external API patterns

// Terminology Database - Simulates external terminology server responses
// Phase 2: System enum mappings for 90% URL compression
const SystemEnums = {
    'http://snomed.info/sct': 1,                                          // SNOMED_CT
    'http://loinc.org': 2,                                               // LOINC
    'http://unitsofmeasure.org': 3,                                      // UCUM
    'http://terminology.hl7.org/CodeSystem/condition-clinical': 4,        // HL7_CONDITION
    'http://terminology.hl7.org/CodeSystem/condition-ver-status': 5,      // HL7_VERIFICATION
    'http://terminology.hl7.org/CodeSystem/observation-category': 6,      // HL7_OBSERVATION
    'urn:iso:std:iso:3166': 7,                                           // ISO_3166
    'https://fhir.nhs.uk/Id/nhs-number': 8                              // NHS_IDENTIFIER
};

const StatusEnums = {
    clinical: { 'active': 1, 'resolved': 2, 'inactive': 3, 'remission': 4 },
    verification: { 'confirmed': 1, 'unconfirmed': 2, 'provisional': 3, 'differential': 4 },
    category: { 'vital-signs': 1, 'laboratory': 2, 'survey': 3, 'social-history': 4 }
};

const terminologyDatabase = {
    version: "2024.03.01",
    lastUpdated: "2024-03-01T00:00:00Z",

    // Clinical codes (enhanced with full API response structure)
    clinical: {
        // LOINC Vital Signs
        'loinc:8310-5': {
            system: 'http://loinc.org',
            code: '8310-5',
            display: 'Body temperature',
            definition: 'Measurement of core body temperature',
            status: 'active',
            version: '2.76'
        },
        'loinc:8867-4': {
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate',
            definition: 'Number of heart beats per minute',
            status: 'active',
            version: '2.76'
        },
        'loinc:85354-9': {
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure',
            definition: 'Systolic and diastolic blood pressure measurement',
            status: 'active',
            version: '2.76'
        },
        'loinc:60591-5': {
            system: 'http://loinc.org',
            code: '60591-5',
            display: 'Patient summary Document',
            definition: 'International Patient Summary document',
            status: 'active',
            version: '2.76'
        },
        'loinc:11450-4': {
            system: 'http://loinc.org',
            code: '11450-4',
            display: 'Problem list',
            definition: 'List of patient problems and diagnoses',
            status: 'active',
            version: '2.76'
        },
        'loinc:8716-3': {
            system: 'http://loinc.org',
            code: '8716-3',
            display: 'Vital signs',
            definition: 'Patient vital signs measurements',
            status: 'active',
            version: '2.76'
        },

        // SNOMED CT Conditions
        'sct:417163006': {
            system: 'http://snomed.info/sct',
            code: '417163006',
            display: 'Traumatic injury',
            definition: 'Physical damage to body tissues caused by external force',
            status: 'active',
            version: '20240301'
        },
        'sct:125605004': {
            system: 'http://snomed.info/sct',
            code: '125605004',
            display: 'Fracture of bone',
            definition: 'Break or crack in bone structure',
            status: 'active',
            version: '20240301'
        },
        'sct:217082002': {
            system: 'http://snomed.info/sct',
            code: '217082002',
            display: 'Accidental explosion',
            definition: 'Unintentional explosive event causing injury',
            status: 'active',
            version: '20240301'
        },
        'sct:386661006': {
            system: 'http://snomed.info/sct',
            code: '386661006',
            display: 'Fever',
            definition: 'Elevated body temperature above normal range',
            status: 'active',
            version: '20240301'
        },
        'sct:387207008': {
            system: 'http://snomed.info/sct',
            code: '387207008',
            display: 'Morphine',
            definition: 'Opioid analgesic medication',
            status: 'active',
            version: '20240301'
        },
        'sct:278152006': {
            system: 'http://snomed.info/sct',
            code: '278152006',
            display: 'Blood group A Rh(D) negative (A-)',
            definition: 'ABO blood group A with Rh negative',
            status: 'active',
            version: '20240301'
        },
        'sct:47625008': {
            system: 'http://snomed.info/sct',
            code: '47625008',
            display: 'Intravenous route',
            definition: 'Administration via intravenous route',
            status: 'active',
            version: '20240301'
        },

        // Additional LOINC Codes
        'loinc:10160-0': {
            system: 'http://loinc.org',
            code: '10160-0',
            display: 'History of Medication use Narrative',
            definition: 'Narrative description of patient medication history',
            status: 'active',
            version: '2.76'
        },
        'loinc:8480-6': {
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure',
            definition: 'Systolic arterial blood pressure measurement',
            status: 'active',
            version: '2.76'
        },
        'loinc:8462-4': {
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure',
            definition: 'Diastolic arterial blood pressure measurement',
            status: 'active',
            version: '2.76'
        },
        'loinc:9279-1': {
            system: 'http://loinc.org',
            code: '9279-1',
            display: 'Respiratory rate',
            definition: 'Number of breaths per minute',
            status: 'active',
            version: '2.76'
        },
        'loinc:2708-6': {
            system: 'http://loinc.org',
            code: '2708-6',
            display: 'Oxygen saturation',
            definition: 'Percentage of oxygen saturation in arterial blood',
            status: 'active',
            version: '2.76'
        },
        'loinc:718-7': {
            system: 'http://loinc.org',
            code: '718-7',
            display: 'Hemoglobin',
            definition: 'Hemoglobin concentration in blood',
            status: 'active',
            version: '2.76'
        },
        'loinc:33747-0': {
            system: 'http://loinc.org',
            code: '33747-0',
            display: 'pH of Blood',
            definition: 'Acidity/alkalinity measurement of blood pH',
            status: 'active',
            version: '2.76'
        },

        // Additional SNOMED CT Condition Codes
        'sct:125670008': {
            system: 'http://snomed.info/sct',
            code: '125670008',
            display: 'Foreign body',
            definition: 'Object present in body tissue where it does not belong',
            status: 'active',
            version: '20240301'
        },
        'sct:271594007': {
            system: 'http://snomed.info/sct',
            code: '271594007',
            display: 'Syncope',
            definition: 'Temporary loss of consciousness due to reduced blood flow to brain',
            status: 'active',
            version: '20240301'
        },
        'sct:267036007': {
            system: 'http://snomed.info/sct',
            code: '267036007',
            display: 'Dyspnea',
            definition: 'Difficulty breathing or shortness of breath',
            status: 'active',
            version: '20240301'
        },
        'sct:422587007': {
            system: 'http://snomed.info/sct',
            code: '422587007',
            display: 'Nausea',
            definition: 'Feeling of discomfort in stomach with urge to vomit',
            status: 'active',
            version: '20240301'
        },
        'sct:302866003': {
            system: 'http://snomed.info/sct',
            code: '302866003',
            display: 'Hypotension',
            definition: 'Low blood pressure below normal range',
            status: 'active',
            version: '20240301'
        },
        'sct:84229001': {
            system: 'http://snomed.info/sct',
            code: '84229001',
            display: 'Fatigue',
            definition: 'State of physical or mental exhaustion',
            status: 'active',
            version: '20240301'
        },
        'sct:423902002': {
            system: 'http://snomed.info/sct',
            code: '423902002',
            display: 'Nausea and vomiting',
            definition: 'Combined symptoms of nausea with actual vomiting',
            status: 'active',
            version: '20240301'
        },
        'sct:128045006': {
            system: 'http://snomed.info/sct',
            code: '128045006',
            display: 'Cellulitis',
            definition: 'Bacterial infection of skin and soft tissue',
            status: 'active',
            version: '20240301'
        },
        'sct:225566008': {
            system: 'http://snomed.info/sct',
            code: '225566008',
            display: 'Aching pain',
            definition: 'Continuous dull pain sensation',
            status: 'active',
            version: '20240301'
        },
        'sct:62914000': {
            system: 'http://snomed.info/sct',
            code: '62914000',
            display: 'Edema',
            definition: 'Swelling due to fluid accumulation in tissues',
            status: 'active',
            version: '20240301'
        },

        // SNOMED CT Procedure Codes
        'sct:387713003': {
            system: 'http://snomed.info/sct',
            code: '387713003',
            display: 'Surgical procedure',
            definition: 'Medical intervention involving operative technique',
            status: 'active',
            version: '20240301'
        },
        'sct:182856006': {
            system: 'http://snomed.info/sct',
            code: '182856006',
            display: 'Hemostatic procedure',
            definition: 'Medical procedure to control or stop bleeding',
            status: 'active',
            version: '20240301'
        },
        'sct:225358003': {
            system: 'http://snomed.info/sct',
            code: '225358003',
            display: 'Wound care management',
            definition: 'Clinical care and treatment of wounds',
            status: 'active',
            version: '20240301'
        },
        'sct:385763009': {
            system: 'http://snomed.info/sct',
            code: '385763009',
            display: 'Tourniquet procedure',
            definition: 'Application of compressive device to control bleeding',
            status: 'active',
            version: '20240301'
        },
        'sct:61685007': {
            system: 'http://snomed.info/sct',
            code: '61685007',
            display: 'Left lower limb structure',
            definition: 'Anatomical structure of the left leg',
            status: 'active',
            version: '20240301'
        },
        'sct:17629007': {
            system: 'http://snomed.info/sct',
            code: '17629007',
            display: 'Transfer of patient',
            definition: 'Movement of patient from one care location to another',
            status: 'active',
            version: '20240301'
        },
        'sct:71181003': {
            system: 'http://snomed.info/sct',
            code: '71181003',
            display: 'Monitoring',
            definition: 'Continuous observation and measurement of patient status',
            status: 'active',
            version: '20240301'
        },
        'sct:18629005': {
            system: 'http://snomed.info/sct',
            code: '18629005',
            display: 'Ultrasound',
            definition: 'Diagnostic imaging using high-frequency sound waves',
            status: 'active',
            version: '20240301'
        },
        'sct:71388002': {
            system: 'http://snomed.info/sct',
            code: '71388002',
            display: 'CT scan',
            definition: 'Computed tomography imaging procedure',
            status: 'active',
            version: '20240301'
        },

        // SNOMED CT Medication Codes
        'sct:387562000': {
            system: 'http://snomed.info/sct',
            code: '387562000',
            display: 'Amoxicillin',
            definition: 'Beta-lactam antibiotic medication',
            status: 'active',
            version: '20240301'
        },
        'sct:432102000': {
            system: 'http://snomed.info/sct',
            code: '432102000',
            display: 'Normal saline',
            definition: '0.9% sodium chloride solution for injection',
            status: 'active',
            version: '20240301'
        },
        'sct:387494007': {
            system: 'http://snomed.info/sct',
            code: '387494007',
            display: 'Ibuprofen',
            definition: 'Nonsteroidal anti-inflammatory drug (NSAID)',
            status: 'active',
            version: '20240301'
        },
        'sct:387467008': {
            system: 'http://snomed.info/sct',
            code: '387467008',
            display: 'Tramadol',
            definition: 'Opioid analgesic medication for pain management',
            status: 'active',
            version: '20240301'
        },
        'sct:372687004': {
            system: 'http://snomed.info/sct',
            code: '372687004',
            display: 'Amoxicillin',
            definition: 'Beta-lactam antibiotic medication (alternative code)',
            status: 'active',
            version: '20240301'
        },
        'sct:108761006': {
            system: 'http://snomed.info/sct',
            code: '108761006',
            display: 'Epinephrine',
            definition: 'Hormone and medication used in emergency situations',
            status: 'active',
            version: '20240301'
        },

        // SNOMED CT Route Codes
        'sct:26643006': {
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route',
            definition: 'Administration of medication by mouth',
            status: 'active',
            version: '20240301'
        }
    },

    // System URLs (Phase 2 - High compression impact)
    systems: {
        'http://snomed.info/sct': { id: 1, short: 'sct', name: 'SNOMED CT International' },
        'http://loinc.org': { id: 2, short: 'loinc', name: 'Logical Observation Identifiers Names and Codes' },
        'http://unitsofmeasure.org': { id: 3, short: 'ucum', name: 'Unified Code for Units of Measure' },
        'http://terminology.hl7.org/CodeSystem/condition-clinical': { id: 4, short: 'hl7-condition', name: 'HL7 Condition Clinical Status' },
        'http://terminology.hl7.org/CodeSystem/condition-ver-status': { id: 5, short: 'hl7-verification', name: 'HL7 Condition Verification Status' },
        'http://terminology.hl7.org/CodeSystem/observation-category': { id: 6, short: 'hl7-obs-cat', name: 'HL7 Observation Category' }
    },

    // Status codes (Phase 2 - 95% compression potential)
    status: {
        'http://terminology.hl7.org/CodeSystem/condition-clinical': {
            'active': { id: 0, display: 'Active', definition: 'The condition is active and ongoing' },
            'resolved': { id: 1, display: 'Resolved', definition: 'The condition has been resolved' },
            'inactive': { id: 2, display: 'Inactive', definition: 'The condition is inactive' }
        },
        'http://terminology.hl7.org/CodeSystem/condition-ver-status': {
            'confirmed': { id: 0, display: 'Confirmed', definition: 'Condition has been confirmed' },
            'unconfirmed': { id: 1, display: 'Unconfirmed', definition: 'Condition has not been confirmed' },
            'provisional': { id: 2, display: 'Provisional', definition: 'Condition is provisionally diagnosed' }
        },
        'http://terminology.hl7.org/CodeSystem/observation-category': {
            'vital-signs': { id: 0, display: 'Vital Signs', definition: 'Clinical measurements of vital signs' },
            'laboratory': { id: 1, display: 'Laboratory', definition: 'Laboratory test results' },
            'survey': { id: 2, display: 'Survey', definition: 'Survey or questionnaire responses' }
        }
    },

    // Units of measure (Phase 2 - UCUM codes)
    units: {
        'Cel': { system: 'ucum', display: '°C', name: 'degree Celsius' },
        '[degF]': { system: 'ucum', display: '°F', name: 'degree Fahrenheit' },
        'mm[Hg]': { system: 'ucum', display: 'mmHg', name: 'millimeter of mercury' },
        '/min': { system: 'ucum', display: '/min', name: 'per minute' },
        'mg': { system: 'ucum', display: 'mg', name: 'milligram' },
        'mL': { system: 'ucum', display: 'mL', name: 'milliliter' }
    }
};

// Terminology Service - Simulates external API calls
class TerminologyService {
    constructor(database = terminologyDatabase) {
        this.db = database;
        this.isOnline = false; // Simulate external API availability
        this.simulationDelay = 25; // ms - realistic network delay
    }

    async lookup(system, code) {
        await this.simulateNetworkDelay();

        const systemKey = this.getSystemKey(system);
        const key = `${systemKey}:${code}`;
        const result = this.db.clinical[key];

        if (!result) {
            throw new TerminologyNotFoundError(system, code);
        }

        return this.formatAPIResponse(result);
    }

    async validate(system, code) {
        await this.simulateNetworkDelay();

        const systemKey = this.getSystemKey(system);
        const key = `${systemKey}:${code}`;
        return { valid: !!this.db.clinical[key] };
    }

    async resolveSystem(systemUrl) {
        await this.simulateNetworkDelay();
        return this.db.systems[systemUrl] || null;
    }

    async resolveStatus(systemUrl, code) {
        await this.simulateNetworkDelay();
        return this.db.status[systemUrl]?.[code] || null;
    }

    getSystemKey(systemUrl) {
        const systemInfo = this.db.systems[systemUrl];
        return systemInfo?.short || 'unknown';
    }

    formatAPIResponse(termData) {
        return {
            resourceType: 'Parameters',
            parameter: [{
                name: 'result',
                valueBoolean: true
            }, {
                name: 'display',
                valueString: termData.display
            }, {
                name: 'definition',
                valueString: termData.definition
            }, {
                name: 'version',
                valueString: termData.version
            }]
        };
    }

    simulateNetworkDelay() {
        return new Promise(resolve =>
            setTimeout(resolve, this.isOnline ? this.simulationDelay : 0)
        );
    }
}

// Custom error for terminology resolution failures
class TerminologyNotFoundError extends Error {
    constructor(system, code) {
        super(`Terminology not found: ${system}|${code}`);
        this.name = 'TerminologyNotFoundError';
        this.system = system;
        this.code = code;
    }
}

// Global terminology service instance
const terminologyService = new TerminologyService();

// Legacy compatibility functions
const medicalCodeMap = {};
Object.entries(terminologyDatabase.clinical).forEach(([key, value]) => {
    medicalCodeMap[key] = value.display;
});

// === QUALITY ASSURANCE SYSTEM ===
// Terminology validation and coverage testing

class TerminologyValidator {
    constructor(database = terminologyDatabase) {
        this.db = database;
        this.payloadUrl = DEMO_PAYLOADS.PAYLOAD_1;
    }

    async validatePayloadCoverage() {

        try {
            // Extract all codes from payload-1.json
            const payloadCodes = await this.extractCodesFromPayload();

            // Check coverage
            const results = this.checkCoverage(payloadCodes);

            // Report results
            this.reportResults(results);

            return results;
        } catch (error) {
            console.error('❌ Terminology validation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async extractCodesFromPayload() {
        const response = await fetch(this.payloadUrl);
        const payload = await response.json();
        const codes = new Set();

        // Extract codes from all FHIR resources
        const entries = payload.entry || [];
        entries.forEach(entry => {
            if (entry.resource) {
                this.extractCodesFromResource(entry.resource, codes);
            }
        });

        return Array.from(codes);
    }

    extractCodesFromResource(resource, codes) {
        // Extract from coding arrays
        this.findCodingArrays(resource).forEach(coding => {
            coding.forEach(code => {
                if (code.system && code.code) {
                    const systemKey = this.getSystemKey(code.system);
                    codes.add(`${systemKey}:${code.code}`);
                }
            });
        });
    }

    findCodingArrays(obj, path = '') {
        const codingArrays = [];

        if (obj && typeof obj === 'object') {
            if (Array.isArray(obj)) {
                // Check if this is a coding array
                if (obj.length > 0 && obj[0].system && obj[0].code) {
                    codingArrays.push(obj);
                } else {
                    // Recurse into array elements
                    obj.forEach((item, index) => {
                        codingArrays.push(...this.findCodingArrays(item, `${path}[${index}]`));
                    });
                }
            } else {
                // Recurse into object properties
                Object.keys(obj).forEach(key => {
                    if (key === 'coding' && Array.isArray(obj[key])) {
                        codingArrays.push(obj[key]);
                    } else {
                        codingArrays.push(...this.findCodingArrays(obj[key], `${path}.${key}`));
                    }
                });
            }
        }

        return codingArrays;
    }

    getSystemKey(systemUrl) {
        const systemMapping = {
            'http://snomed.info/sct': 'sct',
            'http://loinc.org': 'loinc',
            'http://unitsofmeasure.org': 'ucum',
            'http://terminology.hl7.org/CodeSystem/condition-clinical': 'hl7-condition',
            'http://terminology.hl7.org/CodeSystem/condition-ver-status': 'hl7-verification',
            'http://terminology.hl7.org/CodeSystem/observation-category': 'hl7-obs-cat'
        };
        return systemMapping[systemUrl] || 'unknown';
    }

    checkCoverage(payloadCodes) {
        const covered = [];
        const missing = [];
        const systemStats = {};

        payloadCodes.forEach(code => {
            const [system] = code.split(':');
            systemStats[system] = systemStats[system] || { total: 0, covered: 0 };
            systemStats[system].total++;

            if (this.db.clinical[code]) {
                covered.push(code);
                systemStats[system].covered++;
            } else {
                missing.push(code);
            }
        });

        const coverageRate = (covered.length / payloadCodes.length) * 100;

        return {
            success: missing.length === 0,
            total: payloadCodes.length,
            covered: covered.length,
            missing: missing.length,
            coverageRate: coverageRate,
            missingCodes: missing,
            systemStats: systemStats
        };
    }

    reportResults(results) {

        if (results.missing > 0) {
            results.missingCodes.forEach(code => {
            });
        }

        Object.entries(results.systemStats).forEach(([system, stats]) => {
            const rate = (stats.covered / stats.total) * 100;
        });

        if (results.success) {
        } else {
        }
    }

    // API response format consistency validation
    validateResponseFormat() {

        const errors = [];
        const requiredFields = ['system', 'code', 'display', 'definition', 'status', 'version'];

        Object.entries(this.db.clinical).forEach(([key, value]) => {
            requiredFields.forEach(field => {
                if (!value[field]) {
                    errors.push(`${key}: Missing required field '${field}'`);
                }
            });
        });

        if (errors.length === 0) {
            return { success: true };
        } else {
            return { success: false, errors };
        }
    }
}

// Global validator instance
const terminologyValidator = new TerminologyValidator();

// Auto-run validation on page load (for development)
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Run validation after a short delay to ensure everything is loaded
        setTimeout(() => {
            terminologyValidator.validatePayloadCoverage();
            terminologyValidator.validateResponseFormat();
        }, 1000);
    });
}

/**
 * Medical Code Display Resolver
 * Purpose: Resolve medical codes to human-readable display names
 * Usage: Convert medical terminology codes to descriptive text for UI display
 *
 * @param {string} system - Terminology system identifier
 * @param {string} code - Medical code to resolve
 * @returns {string} - Display name or original code if not found
 *
 * Example:
 *   resolveCodeDisplay('sct', '386661006') → 'Fever'
 *   resolveCodeDisplay('loinc', '8480-6') → 'Systolic blood pressure'
 */
function resolveCodeDisplay(system, code) {
    const key = `${system}:${code}`;
    return medicalCodeMap[key] || code;
}

/**
 * Gender Code Mapper
 * Purpose: Convert SNOMED CT gender codes to standardized gender values
 * Usage: Normalize gender representation across different data sources
 *
 * @param {Object} codeRef - CodeRef object containing gender code
 * @returns {string} - Standardized gender ('male', 'female', 'other', 'unknown')
 *
 * Example:
 *   mapGenderFromCodeRef({sys: 'sct', code: '248153007'}) → 'male'
 *   mapGenderFromCodeRef({sys: 'sct', code: '248152002'}) → 'female'
 */
function mapGenderFromCodeRef(codeRef) {
    const key = codeRefKey(codeRef);
    if (!key) return 'unknown';
    return genderCodeMap[key] || 'unknown';
}

/**
 * Toast Message Display System
 * Purpose: Show temporary notifications to users with auto-dismiss functionality
 * Usage: Display success messages, errors, and information to users
 *
 * @param {string} message - Message text to display
 * @param {string} type - Message type ('info', 'success', 'error', 'warning')
 *
 * Example:
 *   showMessage('Payload decoded successfully', 'success')
 *   showMessage('Failed to parse data', 'error')
 */
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

/**
 * Async JSON Fetcher
 * Purpose: Safely fetch JSON data from URLs with error handling
 * Usage: Load demo payloads and external data sources
 *
 * @param {string} url - URL to fetch JSON from
 * @returns {Promise<Object|null>} - Parsed JSON object or null if fetch fails
 *
 * Example:
 *   const data = await fetchJson('payload-1.json')
 *   if (data) { processPayload(data) }
 */
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
// --- CODEC PIPELINE ---

const codecPipeline = (() => {
    const PROTO_URL = RESOURCES.NFC_PAYLOAD_PROTO;
    const LEGACY_PROTO_URL = RESOURCES.NFC_PAYLOAD_LEGACY_PROTO;

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

        // First convert without defaults to preserve actual CodeRef values
        const object = payloadType.toObject(message, {
            longs: Number,
            enums: String,
            defaults: false,  // Don't include defaults to avoid overriding actual values
            oneofs: true
        });

        // Check if CodeRef fields exist in the raw message before toObject conversion
        if (message.patient) {
            // Access fields using both snake_case and camelCase to see what exists

            // If CodeRef fields exist in raw message but are null in object, manually copy them
            if (message.patient.blood_group && !object.patient?.blood_group) {
                object.patient = object.patient || {};
                object.patient.blood_group = message.patient.blood_group;
            }
            if (message.patient.nhs_id && !object.patient?.nhs_id) {
                object.patient = object.patient || {};
                object.patient.nhs_id = message.patient.nhs_id;
            }
            if (message.patient.service_id && !object.patient?.service_id) {
                object.patient = object.patient || {};
                object.patient.service_id = message.patient.service_id;
            }
        }

        // 🚨 CRITICAL FIX: Preserve original_bundle_json field if it exists in the protobuf message
        const originalBundle = message.original_bundle_json || message.originalBundleJson;
        if (originalBundle && !object.original_bundle_json && !object.originalBundleJson) {
            object.originalBundleJson = originalBundle;
        }


        // Convert camelCase back to snake_case for consistency
        const normalizedObject = convertFromProtobufNaming(object);

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

        // Handle case where payload is just a FHIR Patient resource
        if (fhirPayload.resourceType === 'Patient') {
            fhirPayload = { patient: fhirPayload };
        }

        // Handle FHIR Bundle (IPS format)
        if (fhirPayload.resourceType === 'Bundle') {
            return convertFhirBundleToCodeRef(fhirPayload);
        }


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
                ext.url === FHIR_EXTENSIONS.PATIENT_BLOOD_GROUP
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


        return converted;
    }

    function convertFhirBundleToCodeRef(bundle) {

        // Find patient resource
        const patientEntry = bundle.entry?.find(entry =>
            entry.resource?.resourceType === 'Patient'
        );

        if (!patientEntry) {
            throw new Error('No Patient resource found in FHIR Bundle');
        }

        const patient = patientEntry.resource;

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
        if (patient.identifier) {
            patient.identifier.forEach(identifier => {
                if (identifier.type?.coding?.[0]?.code === 'NH') {
                    convertedPatient.nhs_id = { sys: 'nhs', code: identifier.value };
                } else if (identifier.type?.coding?.[0]?.code === 'MIL') {
                    convertedPatient.service_id = { sys: 'mil', code: identifier.value };
                }
            });
        }

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
                ext.url === FHIR_EXTENSIONS.PATIENT_BLOOD_GROUP
            );
            if (bloodGroupExt?.valueCodeableConcept?.coding?.[0]) {
                const coding = bloodGroupExt.valueCodeableConcept.coding[0];
                convertedPatient.blood_group = { sys: 'sct', code: coding.code };
            }
        }

        // Preserve original Bundle metadata with proper serialization for protobuf
        const bundleMetadata = {
            id: bundle.id || '',
            meta_json: JSON.stringify(bundle.meta || {}),
            identifier_json: JSON.stringify(bundle.identifier || {}),
            type: bundle.type || 'document',
            timestamp: bundle.timestamp || new Date().toISOString(),
            composition_fullUrl: bundle.entry?.find(entry => entry.resource?.resourceType === 'Composition')?.fullUrl || null,
            composition_json: JSON.stringify(bundle.entry?.find(entry => entry.resource?.resourceType === 'Composition')?.resource || null),
            entries_json: JSON.stringify(bundle.entry || [])
        };


        // Initialize payload structure with care stages
        const payload = {
            patient: convertedPatient,
            allergies: [],
            bundleMetadata: bundleMetadata,
            poi: { vitals: [], conditions: [], events: [] },
            casevac: { vitals: [], conditions: [], events: [] },
            axp: { vitals: [], conditions: [], events: [] },
            medevac: { vitals: [], conditions: [], events: [] },
            r1: { vitals: [], conditions: [], events: [] },
            fwdTacevac: { vitals: [], conditions: [], events: [] },
            r2: { vitals: [], conditions: [], events: [] },
            rearTacevac: { vitals: [], conditions: [], events: [] },
            r3: { vitals: [], conditions: [], events: [] },
            t: Date.now()
        };

        // Process all clinical resources and categorize by care-stage extension
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


        // Focus on proper CodeRef compression - no duplication needed



        return payload;
    }

    const CARE_STAGE_VALUE_MAP = {
        poi: 'poi',
        casevac: 'casevac',
        axp: 'axp',
        mevac: 'medevac', // common shorthand typo
        medevac: 'medevac',
        r1: 'r1',
        'fwdtacevac': 'fwdTacevac',
        'fwd-tacevac': 'fwdTacevac',
        'forwardtacevac': 'fwdTacevac',
        'forward-tacevac': 'fwdTacevac',
        'fwd tacevac': 'fwdTacevac',
        r2: 'r2',
        'reartacevac': 'rearTacevac',
        'rear-tacevac': 'rearTacevac',
        'rear tacevac': 'rearTacevac',
        r3: 'r3',
        stratevac: 'stratevac',
        'strategic evacuation': 'stratevac',
        'strategic-evacuation': 'stratevac',
        'strategic_evacuati': 'stratevac'
    };

    function normaliseCareStageValue(rawValue) {
        if (!rawValue) return null;
        const trimmed = String(rawValue).trim();
        const direct = CARE_STAGE_VALUE_MAP[trimmed];
        if (direct) return direct;
        const lowered = trimmed.toLowerCase().replace(/\s+/g, '');
        return CARE_STAGE_VALUE_MAP[lowered] || trimmed;
    }

    function getCareStageFromExtension(resource) {
        const careStageExt = resource.extension?.find(ext =>
            ext.url === FHIR_EXTENSIONS.CARE_STAGE
        );
        if (!careStageExt) {
            debugMIST(`No care stage extension found for ${resource.resourceType}`, {
                resourceId: resource.id,
                extensions: resource.extension?.map(ext => ext.url) || []
            });
            return null;
        }
        const careStage = normaliseCareStageValue(careStageExt.valueCode || careStageExt.valueString || careStageExt.value);
        debugMIST(`Extracted care stage: ${careStage}`, {
            resourceType: resource.resourceType,
            resourceId: resource.id,
            rawValue: careStageExt.valueCode || careStageExt.valueString || careStageExt.value
        });
        return careStage;
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
            route: normalizeRouteDisplay(
                medication.dosage?.route?.coding?.[0]?.display
                || medication.dosage?.route?.text
                || medication.dosage?.route?.coding?.[0]?.code
                || ''
            )
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
            route: normalizeRouteDisplay(
                procedure.bodySite?.[0]?.coding?.[0]?.display
                || procedure.bodySite?.[0]?.text
                || procedure.performedString
                || 'Manual'
            )
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

        // PERFECT RESTORATION: Use preserved original Bundle entries for exact reconstruction
        const bundleMetadata = codeRefPayload.bundleMetadata;

        // Restore original Bundle structure exactly as it was
        const bundle = {
            resourceType: 'Bundle',
            id: bundleMetadata?.id || 'ips-example',
            meta: bundleMetadata?.meta_json ? JSON.parse(bundleMetadata.meta_json) : {
                lastUpdated: new Date().toISOString(),
                profile: [FHIR_PROFILES.IPS_BUNDLE]
            },
            identifier: bundleMetadata?.identifier_json ? JSON.parse(bundleMetadata.identifier_json) : {
                system: 'urn:oid:2.16.840.1.113883.4.3.2.1',
                value: 'IPS-001'
            },
            type: bundleMetadata?.type || 'document',
            timestamp: bundleMetadata?.timestamp || new Date().toISOString(),
            entry: []
        };

        const originalEntries = bundleMetadata?.entries_json ? JSON.parse(bundleMetadata.entries_json) : null;
        if (originalEntries) {
            bundle.entry = originalEntries.map(entry => ({ ...entry, resource: entry.resource ? JSON.parse(JSON.stringify(entry.resource)) : entry.resource }));
        } else {
            bundle.entry.push({
                fullUrl: bundleMetadata?.composition_fullUrl || 'urn:uuid:generated-composition',
                resource: bundleMetadata?.composition_json ? JSON.parse(bundleMetadata.composition_json) : {
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
        }

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
        const stageKeys = ['poi', 'casevac', 'axp', 'medevac', 'r1', 'fwdTacevac', 'r2', 'rearTacevac', 'r3', 'stratevac'];
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
                url: FHIR_EXTENSIONS.PATIENT_BLOOD_GROUP,
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
                url: FHIR_EXTENSIONS.PATIENT_NATIONALITY,
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
                url: FHIR_EXTENSIONS.CARE_STAGE,
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
                url: FHIR_EXTENSIONS.CARE_STAGE,
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
                    url: FHIR_EXTENSIONS.CARE_STAGE,
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
                    url: FHIR_EXTENSIONS.CARE_STAGE,
                    valueCode: careStage
                }]
            };
        }
    }

    async function encodeToFragment(payload) {
        try {
            if (payload.original_bundle_json) {
            }

            // Convert FHIR format to CodeRef format if needed
            if (payload.resourceType === 'Patient' || payload.resourceType === 'Bundle' || payload.patient?.resourceType === 'Patient') {
                const originalBundleJson = payload.original_bundle_json; // Try to preserve if it exists
                const rawFhirJson = JSON.stringify(payload); // Always preserve the raw FHIR as backup
                payload = convertFhirToCodeRef(payload);

                // The convertFhirToCodeRef already adds original_bundle_json, but ensure it's preserved
                if (!payload.originalBundleJson) {
                    payload.originalBundleJson = originalBundleJson || rawFhirJson;
                } else {
                }
            } else {
            }

            // Use current schema (coderef) for encoding
            const payloadType = await ensurePayloadType();



            // Create protobuf message from payload
            const message = payloadType.create(payload);

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
        // Safe deep clone preserving large strings like original_bundle_json
        const normalizedObject = safeDeepClone(object);

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
            // Keep field in camelCase for protobuf.js compatibility
        }

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
            if (protoPayload.originalBundleJson) {
            } else {

                // FINAL FAILSAFE: Create originalBundleJson from the current payload data
                protoPayload.originalBundleJson = JSON.stringify({
                    resourceType: "Bundle",
                    id: protoPayload.bundleMetadata?.id || "restored-bundle",
                    type: "document",
                    timestamp: protoPayload.bundleMetadata?.timestamp || new Date().toISOString(),
                    entry: [], // Reconstructed from payload data - minimal structure for character preservation
                    restored: true // Flag to indicate this was reconstructed
                });
            }


            // CRITICAL: Check schema fields

            const message = payloadType.create(protoPayload);


            // CRITICAL: Check if field 11 exists with different name
            for (let i = 0; i < 15; i++) {
                const field = payloadType.fields[i];
                if (field) {
                }
            }

            const buffer = payloadType.encode(message).finish();


            // CRITICAL TEST: Immediately decode to verify field preservation
            const testDecode = payloadType.decode(buffer);
            if (!testDecode.originalBundleJson) {

                // Test with smaller string to verify if it's a size issue
                const testPayload = { ...protoPayload, originalBundleJson: 'test123' };
                const testMessage = payloadType.create(testPayload);
                const testBuffer = payloadType.encode(testMessage).finish();
                const testDecodeSmall = payloadType.decode(testBuffer);
            }

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

    return {
        decodeFragment,
        encodeToFragment,
        convertCodeRefToFhirBundle,
        getProtobufBinary,
        convertFhirToCodeRef,
        convertFhirBundleToCodeRef
    };
})();

/**
 * Encode FHIR payloads to NFC fragments while returning the intermediate CodeRef.
 * Used by auxiliary tooling (e.g., payload encoder page) to avoid duplicate work.
 */
async function encodeFhirPayloadToFragment(fhirPayload) {
    if (!fhirPayload) {
        throw new Error('No FHIR payload provided for encoding.');
    }

    const codeRefPayload = codecPipeline.convertFhirToCodeRef(fhirPayload);
    const fragment = await codecPipeline.encodeToFragment(codeRefPayload);
    return { fragment, codeRefPayload };
}

// Provide a minimal shared API for secondary pages without leaking internals.
window.NfcIps = {
    ...(window.NfcIps || {}),
    showMessage,
    convertFhirToCodeRef: codecPipeline.convertFhirToCodeRef,
    convertFhirBundleToCodeRef: codecPipeline.convertFhirBundleToCodeRef,
    encodeCodeRefToFragment: codecPipeline.encodeToFragment,
    encodeFhirToFragment: encodeFhirPayloadToFragment,
    decodeFragment: codecPipeline.decodeFragment
};

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
            const stageData = buildStageSectionsFromBundle(payload);

            return buildFromFhir(patientResource, {
                ...options,
                stageSections: stageData.sections,
                summary: stageData.summary,
                allergies: stageData.allergies,
                rawPayload: options.rawPayload || payload
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
            allergies: options.allergies || [],
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
                url: FHIR_EXTENSIONS.PATIENT_BLOOD_GROUP,
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
            debugMIST(`Processing LEGACY stage: ${stageKey}`);

            const sectionDateTracker = new Map();

            // Get raw data first
            const rawVitals = normaliseLegacyVitalsRaw(vitalsSource[stageKey], codebook);
            const rawConditions = normaliseLegacyConditionsRaw(conditionsSource[stageKey], codebook);
            const rawEvents = normaliseLegacyEventsRaw(eventsSource[stageKey], codebook);

            debugMIST(`Raw data for ${stageKey}`, {
                rawVitals: rawVitals.length,
                rawConditions: rawConditions.length,
                rawEvents: rawEvents.length
            });

            // Create MIST chronological rows
            const chronologicalRows = createMISTChronologicalRows(rawVitals, rawConditions, rawEvents);

            // Process chronological rows into pills - keep chronological order intact
            const allPills = [];
            const vitals = [];
            const conditions = [];
            const events = [];

            chronologicalRows.forEach(item => {
                const pill = createStandardizedPill(item.dataType, item, sectionDateTracker, item.isFirstDisplayedInRow);
                allPills.push(pill); // Keep chronological order
                if (item.dataType === 'vitals') vitals.push(pill);
                else if (item.dataType === 'conditions') conditions.push(pill);
                else if (item.dataType === 'events') events.push(pill);
            });

            debugMIST(`Final pills for ${stageKey}`, {
                vitals: vitals.length,
                conditions: conditions.length,
                events: events.length
            });

            totals.vitals += vitals.length;
            totals.conditions += conditions.length;
            totals.events += events.length;
            sections[stageKey] = { vitals, conditions, events, allPills };
        });

        return { sections, totals };
    }

    function normaliseLegacyVitalsRaw(entries, codebook) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, value, unit] = item;
                const code = resolveLegacyCode(codebook, index);
                const displayName = resolveCodeDisplay(code.system, code.code);

                return {
                    code: code.ref,
                    description: displayName,
                    value: value,
                    unit: unit,
                    dose: null,
                    route: null,
                    time: null,
                    onset: null
                };
            })
            .filter(Boolean);
    }

    function normaliseLegacyConditionsRaw(entries, codebook) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, onset] = item;
                const code = resolveLegacyCode(codebook, index);
                const displayName = resolveCodeDisplay(code.system, code.code);

                return {
                    code: code.ref,
                    description: displayName,
                    value: null,
                    unit: null,
                    dose: null,
                    route: null,
                    time: null,
                    onset: onset
                };
            })
            .filter(Boolean);
    }

    function normaliseLegacyEventsRaw(entries, codebook) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(item => {
                if (!Array.isArray(item) || item.length === 0) return null;
                const [index, time] = item;
                const code = resolveLegacyCode(codebook, index);
                const displayName = resolveCodeDisplay(code.system, code.code);

                return {
                    code: code.ref,
                    description: displayName,
                    value: null,
                    unit: null,
                    dose: null,
                    route: null,
                    time: time,
                    onset: null
                };
            })
            .filter(Boolean);
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

        // CRITICAL FIX: Use camelCase field names from protobuf decoded object
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

        // Check both snake_case and camelCase field names
        let bloodGroupData = patientData.blood_group || patientData.bloodGroup;

        const normalizedBloodGroup = normaliseCodeRef(bloodGroupData);
        if (normalizedBloodGroup.code && normalizedBloodGroup.code !== 'Unknown code') {
            const displayName = resolveCodeDisplay(normalizedBloodGroup.system, normalizedBloodGroup.code);
            extensions.push({
                url: FHIR_EXTENSIONS.PATIENT_BLOOD_GROUP,
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
                url: FHIR_EXTENSIONS.PATIENT_NATIONALITY,
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

        return patient;
    }

    function buildCodeRefStageSections(payload) {
        const sections = {};
        const totals = { vitals: 0, conditions: 0, events: 0 };

        stageKeys.forEach(stageKey => {
            debugMIST(`Processing CODEREF stage: ${stageKey}`);

            const stage = payload[stageKey] || {};
            const sectionDateTracker = new Map();

            // Get raw data first
            const rawVitals = normaliseCodeRefVitalsRaw(stage.vitals || []);
            const rawConditions = normaliseCodeRefConditionsRaw(stage.conditions || []);
            const rawEvents = normaliseCodeRefEventsRaw(stage.events || []);

            debugMIST(`Raw data for ${stageKey}`, {
                rawVitals: rawVitals.length,
                rawConditions: rawConditions.length,
                rawEvents: rawEvents.length
            });

            // Create MIST chronological rows
            const chronologicalRows = createMISTChronologicalRows(rawVitals, rawConditions, rawEvents);

            // Process chronological rows into pills - keep chronological order intact
            const allPills = [];
            const vitals = [];
            const conditions = [];
            const events = [];

            chronologicalRows.forEach(item => {
                const pill = createStandardizedPill(item.dataType, item, sectionDateTracker, item.isFirstDisplayedInRow);
                allPills.push(pill); // Keep chronological order
                if (item.dataType === 'vitals') vitals.push(pill);
                else if (item.dataType === 'conditions') conditions.push(pill);
                else if (item.dataType === 'events') events.push(pill);
            });

            debugMIST(`Final pills for ${stageKey}`, {
                vitals: vitals.length,
                conditions: conditions.length,
                events: events.length
            });

            totals.vitals += vitals.length;
            totals.conditions += conditions.length;
            totals.events += events.length;
            sections[stageKey] = { vitals, conditions, events, allPills };
        });

        return { sections, totals };
    }

    function normaliseCodeRefVitalsRaw(entries) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const description = resolveCodeDisplay(code.system, code.code);

                return {
                    code,
                    description,
                    value: item.value,
                    unit: item.unit,
                    dose: null,
                    route: item.route,
                    time: item.time,
                    onset: null
                };
            })
            .filter(Boolean);
    }

    function normaliseCodeRefConditionsRaw(entries) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const description = resolveCodeDisplay(code.system, code.code);

                return {
                    code,
                    description,
                    value: null,
                    unit: null,
                    dose: null,
                    route: null,
                    time: null,
                    onset: item.onset
                };
            })
            .filter(Boolean);
    }

    function normaliseCodeRefEventsRaw(entries) {
        return entries
            .map(item => {
                if (!item || !item.code) return null;
                const code = normaliseCodeRef(item.code);
                const description = resolveCodeDisplay(code.system, code.code);

                return {
                    code,
                    description,
                    value: null,
                    unit: null,
                    dose: item.dose,
                    route: item.route,
                    time: item.time,
                    onset: null
                };
            })
            .filter(Boolean);
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
        if (!bundle || bundle.resourceType !== 'Bundle') {
            return { sections: {}, summary: null, allergies: [] };
        }

        try {
            const codeRefPayload = codecPipeline.convertFhirToCodeRef(bundle);
            const stageResult = buildCodeRefStageSections(codeRefPayload);
            const summary = buildSummary(codeRefPayload, stageResult.totals);
            return {
                sections: stageResult.sections || {},
                summary,
                allergies: codeRefPayload.allergies || []
            };
        } catch (error) {
            console.warn('Failed to build stage sections from FHIR bundle:', error);
            return { sections: {}, summary: null, allergies: [] };
        }
    }

    return { buildViewModelFromObject, loadFromFragment, parseUserInput };
})();

// --- RENDERING FUNCTIONS ---

/**
 * Dynamic Info Box Creator
 * Purpose: Generate the main UI structure for medical data display
 * Usage: Create colored info boxes for different medical data types
 *
 * Renders: Patient box, vital signs boxes, stage-specific medical data boxes
 * Uses: infoBoxConfig array to determine box types, colors, and layout
 *
 * Example: Creates POI box (red), CASEVAC box (orange), R1-R3 boxes (green/blue/purple)
 */
function createInfoBoxes() {
    const container = document.getElementById('info-boxes-container');
    if (!container) return;

    container.innerHTML = '';

    infoBoxConfig.forEach(config => {
        // const wrapperClass = config.specialClass ? 'poi-box-wrapper' : 'info-box-wrapper';
        // const boxClass = config.specialClass ? 'poi-box' : `info-box ${config.colorClass}`;

        const wrapper = document.createElement('div');
        wrapper.className = 'info-box-wrapper';

        const box = document.createElement('div');
        box.className = `info-box ${config.colorClass} empty`;
        if (config.dataKey) {
            box.dataset.key = config.dataKey;
        }

        const title = document.createElement('h2');
        // title.className = config.specialClass ? 'poi-title' : 'info-title';
        title.className = 'info-title';

        const fullTitle = config.title;
        const shortTitleMatch = config.title.match(/\(([^)]+)\)/);
        let shortTitle;

        if (shortTitleMatch) {
            shortTitle = shortTitleMatch[1];
        } else {
            // Create short titles for panes without parentheses
                const shortTitleMap = {
                    patient: 'Patient',
                    clinicalSummary: 'Clinical',
                    casevac: 'CASEVAC',
                    axp: 'AXP',
                    medevac: 'MEDEVAC',
                    r1: 'R1',
                    fwdTacevac: 'Fwd TACEVAC',
                    r2: 'R2 DHC',
                    rearTacevac: 'Rear TACEVAC',
                    r3: 'R3 DHC',
                    stratevac: 'STRATEVAC'
                };
            shortTitle = shortTitleMap[config.dataKey] || fullTitle;
        }

        title.dataset.baseTitle = fullTitle;
        title.dataset.shortTitle = shortTitle;

        // Check if dual title display is enabled for this pane
        if (DUAL_TITLE_CONFIG.enabled && DUAL_TITLE_CONFIG.enabledPanes.has(config.dataKey)) {
            title.classList.add('dual-title', 'dual-title-empty');

            // Left title (short title)
            const leftTitle = document.createElement('span');
            leftTitle.className = 'left-title';
            leftTitle.textContent = shortTitle;

            // Empty state text
            const emptySpan = document.createElement('span');
            emptySpan.className = 'empty-text';
            emptySpan.textContent = 'No data available';

            // Right title (full title with transparency)
            const rightTitle = document.createElement('span');
            rightTitle.className = 'right-title';
            rightTitle.textContent = fullTitle;
            rightTitle.style.opacity = DUAL_TITLE_CONFIG.transparency;

            title.appendChild(leftTitle);
            title.appendChild(emptySpan);
            title.appendChild(rightTitle);
        } else {
            title.textContent = config.title;
        }

        box.appendChild(title);
        wrapper.appendChild(box);
        container.appendChild(wrapper);
    });
}

function setTitleAvailability(titleElement, hasData) {
    if (!titleElement) return;

    // Extract titles from existing structure if present, otherwise fallback to textContent
    let baseTitle = titleElement.dataset.baseTitle;
    let shortTitle = titleElement.dataset.shortTitle;

    if (!baseTitle || !shortTitle) {
        const leftTitleSpan = titleElement.querySelector('.left-title');
        const rightTitleSpan = titleElement.querySelector('.right-title');

        if (leftTitleSpan && rightTitleSpan) {
            // Extract from existing dual title structure
            shortTitle = shortTitle || leftTitleSpan.textContent.trim();
            baseTitle = baseTitle || rightTitleSpan.textContent.trim();
        } else {
            // Fallback to textContent for non-dual-title elements
            const fallbackTitle = titleElement.textContent.split('•')[0].trim();
            baseTitle = baseTitle || fallbackTitle;
            shortTitle = shortTitle || fallbackTitle;
        }
    }
    titleElement.dataset.baseTitle = baseTitle;
    titleElement.dataset.shortTitle = shortTitle;

    const container = titleElement.parentElement;
    const isDualTitle = titleElement.classList.contains('dual-title');

    // Rebuild the title structure so we can manage layout consistently
    titleElement.innerHTML = '';

    if (isDualTitle && hasData) {
        titleElement.classList.remove('dual-title-empty');

        // Rebuild dual title structure for populated state
        const leftTitle = document.createElement('span');
        leftTitle.className = 'left-title';
        leftTitle.textContent = shortTitle;

        const rightTitle = document.createElement('span');
        rightTitle.className = 'right-title';
        rightTitle.textContent = baseTitle;
        rightTitle.style.opacity = DUAL_TITLE_CONFIG.transparency;

        titleElement.appendChild(leftTitle);
        titleElement.appendChild(rightTitle);
    } else if (isDualTitle && !hasData) {
        titleElement.classList.add('dual-title-empty');

        // Preserve dual-title layout while centering empty-state messaging
        const leftTitle = document.createElement('span');
        leftTitle.className = 'left-title';
        leftTitle.textContent = shortTitle;

        const emptySpan = document.createElement('span');
        emptySpan.className = 'empty-text';
        emptySpan.textContent = 'No data available';

        const rightTitle = document.createElement('span');
        rightTitle.className = 'right-title';
        rightTitle.textContent = baseTitle;
        rightTitle.style.opacity = DUAL_TITLE_CONFIG.transparency;

        titleElement.appendChild(leftTitle);
        titleElement.appendChild(emptySpan);
        titleElement.appendChild(rightTitle);
    } else {
        titleElement.classList.remove('dual-title-empty');

        // Standard single title behavior
        const baseSpan = document.createElement('span');
        baseSpan.className = 'base-title';
        baseSpan.textContent = baseTitle;
        titleElement.appendChild(baseSpan);

        if (!hasData) {
            const emptySpan = document.createElement('span');
            emptySpan.className = 'empty-text';
            emptySpan.textContent = 'No data available';

            const spacerSpan = document.createElement('span');
            spacerSpan.className = 'empty-spacer';
            spacerSpan.setAttribute('aria-hidden', 'true');
            spacerSpan.textContent = baseTitle;

            titleElement.appendChild(emptySpan);
            titleElement.appendChild(spacerSpan);
        }
    }

    if (hasData) {
        titleElement.classList.remove('is-empty');
        if (container) {
            container.classList.remove('empty');
        }
    } else {
        titleElement.classList.add('is-empty');
        if (container) {
            container.classList.add('empty');
        }
    }
}

function updateDualTitleText(titleElement, leftText, rightText) {
    if (!titleElement) return;

    const leftTitleSpan = titleElement.querySelector('.left-title');
    const rightTitleSpan = titleElement.querySelector('.right-title');

    if (leftTitleSpan) {
        leftTitleSpan.textContent = leftText;
    }
    if (rightTitleSpan) {
        rightTitleSpan.textContent = rightText;
        rightTitleSpan.style.opacity = DUAL_TITLE_CONFIG.transparency;
    }

    titleElement.dataset.shortTitle = leftText;
    titleElement.dataset.baseTitle = rightText;
}

function resetR1Title() {
    const r1Box = document.querySelector('[data-key="r1"]');
    const titleElement = r1Box?.querySelector('.info-title');
    if (!titleElement) return;
    updateDualTitleText(titleElement, 'R1', 'Role 1 Care');
}

function updateR1TitleBasedOnData(stageData) {
    const r1Box = document.querySelector('[data-key="r1"]');
    const titleElement = r1Box?.querySelector('.info-title');
    if (!titleElement) return;

    const hasEntries = Boolean(stageData && (
        (Array.isArray(stageData.events) && stageData.events.length)
        || (Array.isArray(stageData.vitals) && stageData.vitals.length)
        || (Array.isArray(stageData.conditions) && stageData.conditions.length)
    ));

    if (!hasEntries) {
        resetR1Title();
        return;
    }

    const containsPhcIndicator = Boolean(stageData && (
        (Array.isArray(stageData.events) && stageData.events.some(event =>
            event?.careSettingType === 'PHC'
            || event?.setting === 'PHC'
            || (event?.code?.display && event.code.display.includes('Primary Healthcare'))
        ))
        || (Array.isArray(stageData.vitals) && stageData.vitals.some(vital =>
            vital?.careSettingType === 'PHC' || vital?.setting === 'PHC'
        ))
        || (Array.isArray(stageData.conditions) && stageData.conditions.some(condition =>
            condition?.careSettingType === 'PHC' || condition?.setting === 'PHC'
        ))
    ));

    if (containsPhcIndicator) {
        updateDualTitleText(titleElement, 'R1 PHC', 'Role 1 Primary Healthcare');
        return;
    }

    updateDualTitleText(titleElement, 'R1 PHEC', 'Role 1 Pre Hospital Emergency Care');
}

function applyStaticOcpTitleOverrides() {
    const overrides = {
        r2: {
            left: 'R2 DHC',
            right: 'Role 2 Deployed Hospital Care'
        },
        r3: {
            left: 'R3 DHC',
            right: 'Role 3 Deployed Hospital Care'
        }
    };

    Object.entries(overrides).forEach(([key, texts]) => {
        const box = document.querySelector(`[data-key="${key}"]`);
        if (!box) return;
        const titleElement = box.querySelector('.info-title');
        if (!titleElement) return;
        updateDualTitleText(titleElement, texts.left, texts.right);
    });
}

/**
 * Detail Box Element Factory
 * Purpose: Create standardized label-value display elements
 * Usage: Generate consistent UI elements for patient details throughout the app
 *
 * @param {string} label - Display label for the data
 * @param {string} value - Data value to display
 * @param {string} parentColorClass - CSS class for color theming
 * @returns {HTMLElement} - Formatted detail box element
 *
 * Example:
 *   createDetailBoxElement('Name', 'John Doe', 'patient-color')
 *   → <div class="detail-box patient-color">...
 */
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

/**
 * Ghost Item Layout System
 * Purpose: Add invisible spacing elements for consistent flexbox wrapping
 * Usage: Ensure even spacing in patient detail grids regardless of item count
 *
 * @param {HTMLElement} container - Container to add ghost items to
 * @param {number} count - Number of ghost items to add for spacing
 *
 * Technical: Implements advanced flexbox spacing technique from AI-CODEGEN-SPEC
 */
function addGhostItems(container, count) {
    for (let i = 0; i < count; i += 1) {
        const ghost = document.createElement('div');
        ghost.classList.add('detail-ghost-item');
        container.appendChild(ghost);
    }
}

/**
 * Patient Information Renderer
 * Purpose: Render complete patient demographics and identifiers
 * Usage: Display patient details in the main patient information box
 *
 * @param {Object} patientResource - FHIR Patient resource object
 *
 * Renders: Name, DOB, gender, NHS number, identifiers, contact information
 * Features: NHS number formatting, date formatting, gender code mapping
 *
 * Example: Displays 'John Doe, DOB: 15 January 1990, NHS: 123 456 7890'
 */
function renderPatientBox(patientResource) {
    const patientBox = document.querySelector('[data-key="patient"]');
    if (!patientBox) return;

    const patientTitle = patientBox.querySelector('.info-title');
    const existingDetails = patientBox.querySelector('.patient-details-container');
    if (existingDetails) existingDetails.remove();

    const patientConfig = infoBoxConfig.find(config => config.dataKey === 'patient');
    const patientColorClass = patientConfig ? patientConfig.colorClass : 'grey';

    if (patientResource && patientResource.resourceType === 'Patient') {
        setTitleAvailability(patientTitle, true);
        const detailsElement = createPatientDetailsElement(patientResource, patientColorClass);
        patientBox.appendChild(detailsElement);
        addGhostItems(detailsElement, 10);
    } else {
        setTitleAvailability(patientTitle, false);
    }
}

function createPatientDetailsElement(patientData, parentColorClass) {

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('patient-details-container');

    const name = patientData.name?.[0] || {};
    const serviceNumber = patientData.identifier?.find(id =>
        id.type?.coding?.some(c => c.code === 'MIL') ||
        id.type?.text === 'Service Number'
    )?.value;
    const nhsNumber = formatNHSNumber(
        patientData.identifier?.find(id =>
            id.type?.coding?.some(c => c.code === 'NH') ||
            id.type?.text === 'NHS Number'
        )?.value
    );


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
                if (!bloodExt) return undefined;

                const coding = bloodExt?.valueCodeableConcept?.coding?.[0];
                if (coding) {
                    // Check for SNOMED CT system
                    if (coding.system?.includes('snomed.info/sct') && coding.code) {
                        const bloodGroupName = resolveCodeDisplay('sct', coding.code);
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

/**
 * Medical Stage Sections Renderer
 * Purpose: Render care stage data using MIST (Mechanism, Injury, Signs, Treatment) format
 * Usage: Display medical data organized by care stages (POI, CASEVAC, MEDEVAC, R1-R3)
 *
 * @param {Object} stageSections - Object containing medical data organized by care stage
 *
 * Features:
 * - MIST format organization (military medical standard)
 * - Chronological ordering within each section
 * - Color-coded stage presentation
 * - Vitals, conditions, and events display
 *
 * Example: Displays POI vitals (red), CASEVAC treatments (orange), R1 assessments (green)
 */
function renderStageSections(stageSections = {}) {
    stageKeys.forEach(stageKey => {
        const stageBox = document.querySelector(`[data-key="${stageKey}"]`);
        if (!stageBox) return;

        const existingContainer = stageBox.querySelector('.stage-details-container');
        if (existingContainer) existingContainer.remove();

        const config = infoBoxConfig.find(item => item.dataKey === stageKey);
        const stageColor = config ? config.colorClass : null;
        const stageData = stageSections[stageKey] || { vitals: [], conditions: [], events: [] };

        if (stageKey === 'r1') {
            updateR1TitleBasedOnData(stageData);
        }

        const mistSections = [
            { type: 'Mechanism/Injury', items: stageData.conditions || [] },
            { type: 'Symptoms', items: stageData.vitals || [] },
            { type: 'Treatment', items: stageData.events || [] }
        ].filter(section => Array.isArray(section.items) && section.items.length);

        const titleElement = stageBox.querySelector('.info-title');

        if (!mistSections.length) {
            setTitleAvailability(titleElement, false);
            return;
        }

        setTitleAvailability(titleElement, true);

        const container = document.createElement('div');
        container.classList.add('stage-details-container');

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
                if (!entry) return;

                // For first item in section, show full label. For subsequent items, extract just the coded description
                let displayLabel = entry.label;
                if (itemIndex > 0 && entry.label.includes('•')) {
                    // Extract text after the bullet point for subsequent items
                    displayLabel = entry.label.split('•')[1].trim();
                }

                const detail = createDetailBoxElement(displayLabel, entry.value, stageColor);
                detail.title = entry.tooltip;
                container.appendChild(detail);
            });
        });

        stageBox.appendChild(container);
    });
}


function renderVitalsChart(viewModel) {
    const canvas = document.getElementById('vitals-chart');
    const emptyState = document.getElementById('vitals-empty');

    if (!canvas) return;

    if (!viewModel || !viewModel.stageSections) {
        destroyVitalsChart();
        if (emptyState) emptyState.style.display = 'flex';
        canvas.style.display = 'none';
        return;
    }

    const stageSections = viewModel.stageSections;
    const datasetsMap = new Map();

    stageKeys.forEach(stageKey => {
        const section = stageSections[stageKey];
        if (!section || !Array.isArray(section.vitals) || !section.vitals.length) return;

        const stageTitle = stageTitleLookup[stageKey] || stageKey;
        const stageShort = stageTitle.match(/\(([^)]+)\)/)?.[1] || stageTitle;

        section.vitals.forEach(pill => {
            if (!pill) return;
            const raw = pill.rawData || {};
            const timeString = raw.dateTime || raw.time;
            if (!timeString) return;

            const timestamp = new Date(timeString).getTime();
            if (!Number.isFinite(timestamp)) return;

            let value = Number(raw.value);
            if (!Number.isFinite(value) && raw.value != null) {
                value = Number.parseFloat(raw.value);
            }
            if (!Number.isFinite(value)) {
                const valueMatch = typeof pill.value === 'string'
                    ? pill.value.match(/-?\d+(?:\.\d+)?/)
                    : null;
                value = valueMatch ? Number(valueMatch[0]) : Number.NaN;
            }
            if (!Number.isFinite(value)) return;

            let unit = raw.unit || '';
            if (!unit && typeof pill.value === 'string') {
                const unitGuess = pill.value.replace(/-?\d+(?:\.\d+)?\s*/, '').trim();
                if (unitGuess && unitGuess.length <= 6) {
                    unit = unitGuess;
                }
            }

            const type = raw.description
                || (typeof pill.label === 'string' ? pill.label.split('•')[1]?.trim() : 'Vital');
            const datasetKey = type || 'Vital';

            const entry = {
                x: timestamp,
                y: value,
                meta: {
                    type: datasetKey,
                    unit,
                    stage: stageTitle,
                    stageShort,
                    value,
                    dateTime: timeString
                }
            };

            if (!datasetsMap.has(datasetKey)) {
                datasetsMap.set(datasetKey, []);
            }
            datasetsMap.get(datasetKey).push(entry);
        });
    });

    let minTime = Infinity;
    let maxTime = -Infinity;

    const datasets = Array.from(datasetsMap.entries()).map(([label, points]) => {
        points.sort((a, b) => a.x - b.x);
        const color = getVitalColor(label);
        const displayLabel = abbreviateLegendLabel(label);

        if (points.length) {
            minTime = Math.min(minTime, points[0].x);
            maxTime = Math.max(maxTime, points[points.length - 1].x);
        }

        return {
            label: displayLabel,
            data: points,
            borderColor: color,
            backgroundColor: color,
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5,
            spanGaps: true
        };
    });

    datasets.forEach(dataset => {
        dataset.data.forEach(point => {
            const meta = point.meta || {};
            const rawUnit = meta.unit;
            const trimmedUnit = rawUnit ? String(rawUnit).trim() : '';
            let value = meta.value;
            if (value == null || Number.isNaN(Number(value))) {
                value = point.y;
            }
            const formattedValue = trimmedUnit ? `${value} ${trimmedUnit}` : `${value}`;
            meta.displayValue = formattedValue;
            point.meta = meta;
        });
    });

    const hasData = datasets.length > 0;
    const timeSpan = hasData ? Math.max(maxTime - minTime, 60 * 1000) : 0;
    const timePadding = hasData ? Math.max(timeSpan * 0.05, 30 * 1000) : 0;
    const xMin = hasData ? minTime - timePadding : undefined;
    const xMax = hasData ? maxTime + timePadding : undefined;

    if (emptyState) emptyState.style.display = hasData ? 'none' : 'flex';
    canvas.style.display = hasData ? 'block' : 'none';

    destroyVitalsChart();

    if (!hasData) return;

    const ctx = canvas.getContext('2d');
    const axisLabelPaddingPx = getVitalsAxisPadding(canvas);

    const stageBands = computeStageBandData(stageSections);
    const stageBandOpacity = getStageBandOpacity();
    const stageBandLabelPadding = getStageBandLabelPadding();


    if (typeof Chart !== 'undefined' && Chart !== null && typeof Chart === 'function' && typeof Chart.defaults !== 'undefined') {
        if (!stageBackgroundPluginRegistered && typeof Chart.register === 'function') {
            Chart.register(stageBackgroundPlugin);
            stageBackgroundPluginRegistered = true;
        }
        if (!customXAxisPluginRegistered && typeof Chart.register === 'function') {
            Chart.register(customXAxisLabelPlugin);
            customXAxisPluginRegistered = true;
        }

        vitalsChartLibrary = 'chartjs';
        vitalsChartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: axisLabelPaddingPx
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false
                },
                scales: {
                    x: {
                        type: 'linear',
                        ticks: {
                            display: false,
                            callback(value, index, ticks) {
                                const tick = ticks && ticks[index];
                                if (tick && Array.isArray(tick.labelLines)) {
                                    return tick.labelLines;
                                }
                                if (tick && tick.label != null) return tick.label;
                                return value;
                            },
                            align(context) {
                                return context.tick?.align || 'inner';
                            },
                            crossAlign: 'near',
                            autoSkip: false
                        },
                        afterBuildTicks: function(scale) {
                            const dataMin = Number.isFinite(minTime) ? new Date(minTime) : new Date(scale.min);
                            const dataMax = Number.isFinite(maxTime) ? new Date(maxTime) : new Date(scale.max);


                            // First tick: closest previous hh:00/30 to encompass first data point
                            const firstTick = new Date(dataMin);

                            // Round DOWN to nearest hh:00 or hh:30
                            if (dataMin.getMinutes() >= 30) {
                                firstTick.setMinutes(30);
                            } else {
                                firstTick.setMinutes(0);
                            }
                            firstTick.setSeconds(0);
                            firstTick.setMilliseconds(0);


                            // If rounded tick is still after data, go back 30 minutes
                            const thirtyMinutesMs = 30 * 60 * 1000;
                            if (firstTick.getTime() > dataMin.getTime()) {
                                firstTick.setTime(firstTick.getTime() - thirtyMinutesMs);
                            }

                            // Last tick: closest next hh:00/30 to encompass last data point
                            const lastTick = new Date(dataMax);
                            // Round UP to nearest hh:00 or hh:30
                            if (dataMax.getMinutes() > 30) {
                                lastTick.setHours(lastTick.getHours() + 1);
                                lastTick.setMinutes(0);
                            } else if (dataMax.getMinutes() > 0) {
                                lastTick.setMinutes(30);
                            } else {
                                // Exactly on the hour, keep as is
                                lastTick.setMinutes(0);
                            }
                            lastTick.setSeconds(0);
                            lastTick.setMilliseconds(0);

                            // If rounded tick is still before data, advance 30 minutes
                            if (lastTick.getTime() < dataMax.getTime()) {
                                lastTick.setTime(lastTick.getTime() + (30 * 60 * 1000));
                            }


                            // Generate tick marks constrained to hh:00 / hh:30 with max 10 total
                            const maxTotalTicks = 10;
                            const totalIntervals = Math.max(1, Math.round((lastTick.getTime() - firstTick.getTime()) / thirtyMinutesMs));
                            const maxInternalTicks = Math.max(1, maxTotalTicks - 1);
                            const skipFactor = Math.max(1, Math.ceil((totalIntervals + 1) / maxInternalTicks));

                            const tickValues = [];
                            let cursor = firstTick.getTime();
                            while (cursor < lastTick.getTime()) {
                                tickValues.push(cursor);
                                cursor += thirtyMinutesMs * skipFactor;
                            }
                            tickValues.push(lastTick.getTime());

                            const uniqueTickValues = Array.from(new Set(tickValues)).sort((a, b) => a - b);
                            while (uniqueTickValues.length > maxTotalTicks) {
                                uniqueTickValues.splice(uniqueTickValues.length - 2, 1);
                            }

                            const finalTicks = uniqueTickValues.map((value, index, array) => {
                                const prev = index > 0 ? array[index - 1] : null;
                                const currentDate = new Date(value);
                                const timeLabel = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                let labelLines = [timeLabel];

                                const shouldShowDate = (() => {
                                    if (index === 0 || index === array.length - 1) return true;
                                    if (!prev) return true;
                                    const prevDate = new Date(prev);
                                    return currentDate.toDateString() !== prevDate.toDateString();
                                })();

                                if (shouldShowDate) {
                                    const dateLabel = currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
                                    labelLines = [timeLabel, dateLabel];
                                }

                                const isLast = index === array.length - 1;
                                const isSecondLast = array.length >= 3 && index === array.length - 2;
                                const align = (isLast || isSecondLast) ? 'outer' : 'inner';
                                const textAlign = (isLast || isSecondLast) ? 'right' : 'left';

                                return {
                                    value,
                                    labelLines,
                                    align,
                                    textAlign
                                };
                            });

                            scale.ticks = finalTicks;
                            scale.min = firstTick.getTime();
                            scale.max = lastTick.getTime();
                        },
                        adapters: {},
                        grid: {
                            color: 'rgba(0, 0, 0, 0.06)',
                            drawTicks: true,
                            borderDash: [3, 3]
                        }
                    },
                    y: {
                        display: true,
                        ticks: {
                            display: true,
                            maxTicksLimit: 6,
                            autoSkip: false
                        },
                        title: {
                            display: false
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderDash: [2, 2]
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        usePointStyle: true,
                        boxWidth: 8,
                        boxHeight: 8,
                        callbacks: {
                            title(items) {
                                if (!items.length) return '';
                                const first = items[0];
                                const meta = first.raw?.meta || {};
                                const dateStr = meta.dateTime
                                    ? formatDateTimeWithBullet(meta.dateTime)
                                    : formatDateTimeWithBullet(new Date(Number(first.raw?.x ?? first.parsed.x)).toISOString());
                                return dateStr;
                            },
                            label(context) {
                                const meta = context.raw.meta || {};
                                const type = meta.type || context.dataset.label;
                                const rawUnit = meta.unit || '';
                                const trimmedUnit = rawUnit ? String(rawUnit).trim() : '';
                                const stage = meta.stageShort || meta.stage || 'Unknown';
                                const value = meta.value ?? context.parsed.y;
                                const displayValue = meta.displayValue || (trimmedUnit ? `${value} ${trimmedUnit}` : `${value}`);
                                return ` • ${type} • ${displayValue} • ${stage}`;
                            }
                        }
                    },
                    stageBackgrounds: {
                        bands: stageBands,
                        opacity: stageBandOpacity,
                        labelPadding: stageBandLabelPadding
                    },
                    customXAxisLabels: {
                        padding: 8,
                        font: Chart.defaults.font,
                        color: Chart.defaults.color
                    }
                }
            }
        });

        const syncLegend = () => renderCustomLegend(vitalsChartInstance);
        syncLegend();
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(syncLegend);
        } else {
            setTimeout(syncLegend, 0);
        }

        const animationOptions = vitalsChartInstance.options.animation || {};
        const originalOnComplete = animationOptions.onComplete;
        animationOptions.onComplete = (...args) => {
            if (typeof originalOnComplete === 'function') {
                originalOnComplete(...args);
            }
            renderCustomLegend(vitalsChartInstance);
        };

        vitalsChartInstance.options.animation = animationOptions;
        vitalsChartInstance.options.onResize = () => renderCustomLegend(vitalsChartInstance);

    } else if (typeof window !== 'undefined' && window.VitalsMiniChart) {
        vitalsChartLibrary = 'mini';
        vitalsChartInstance = new window.VitalsMiniChart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                xMin,
                xMax,
                legendFontSize: Math.max(10, Math.floor(parseFloat(getComputedStyle(document.documentElement).fontSize || '16') * 0.75))
            }
        });
        resetLegendLayout(canvas.closest('.vitals-chart-wrapper'));
    } else {
        // No charting library available
        canvas.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        resetLegendLayout(canvas.closest('.vitals-chart-wrapper'));
    }
}

/**
 * Raw Payload Display Renderer
 * Purpose: Display raw JSON payload data in the right panel for debugging/inspection
 * Usage: Show formatted JSON of current payload with character count
 *
 * @param {Object} rawPayload - Raw payload object to display
 *
 * Features:
 * - JSON pretty-printing with 2-space indentation
 * - Character count display
 * - Error handling for non-JSON data
 * - Automatic clearing when no payload
 *
 * Example: Displays formatted FHIR Bundle or CodeRef data in right panel
 */
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

/**
 * Clinical Summary Box Renderer
 * Purpose: Display high-level clinical statistics and summary information
 * Usage: Show totals for vitals, conditions, events and creation timestamp
 *
 * @param {Object} currentPatient - Current patient resource
 * @param {Array} allergies - Patient allergies array
 * @param {Object} summary - Summary statistics object with totals and timestamp
 *
 * Features:
 * - Total counts for each data type
 * - Creation timestamp display
 * - Formatted statistics presentation
 *
 * Example: 'Total Vitals: 15, Total Conditions: 3, Created: 15 Jan 24 14:30'
 */
function renderClinicalSummaryBox(currentPatient, allergies, summary) {
    const clinicalSummaryBox = document.querySelector('[data-key="clinicalSummary"]');
    if (!clinicalSummaryBox) return;

    const existingDetails = clinicalSummaryBox.querySelector('.patient-details-container');
    if (existingDetails) existingDetails.remove();

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

    const titleElement = clinicalSummaryBox.querySelector('.info-title');

    if (detailItems.length) {
        detailItems.forEach(item => {
            detailsContainer.appendChild(createDetailBoxElement(item.label, item.value, 'khaki'));
        });
        clinicalSummaryBox.appendChild(detailsContainer);
        addGhostItems(detailsContainer, 10);
        setTitleAvailability(titleElement, true);
    } else {
        setTitleAvailability(titleElement, false);
    }
}

/**
 * Patient Difference Analyzer
 * Purpose: Compare two patient records and identify changes for IPS change tracking
 * Usage: Generate difference report between reference and current patient data
 *
 * @param {Object} referencePatient - Reference patient resource for comparison
 * @param {Object} currentPatient - Current patient resource to compare against
 * @returns {Array} - Array of difference objects with label and value properties
 *
 * Features:
 * - Identifier comparison (Service Number, NHS Number, etc.)
 * - Extension comparison (Blood Group, etc.)
 * - Deep JSON comparison for change detection
 * - Filters out non-essential differences (nationality)
 *
 * Example: Detects changes in blood group, identifiers, medical extensions
 */
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

/**
 * Main Rendering Orchestrator
 * Purpose: Coordinate all UI rendering operations for a complete view model
 * Usage: Primary function to render all components when payload changes
 *
 * @param {Object} viewModel - Complete view model with patient, stages, and summary data
 * @param {Object} comparisonViewModel - Optional comparison view model for diff display
 *
 * Features:
 * - Orchestrates all rendering functions
 * - Error handling with user notifications
 * - Renders patient box, payload display, clinical summary, and stage sections
 *
 * Example: Called after successful payload parsing to update entire UI
 */
function processAndRenderAll(viewModel, comparisonViewModel) {
    if (!viewModel) {
        showMessage('Error: Could not load or parse payload', 'error');
        return;
    }

    renderPatientBox(viewModel.patientResource);
    renderPayloadDisplay(viewModel.rawPayload);
    renderClinicalSummaryBox(viewModel.patientResource, viewModel.allergies, viewModel.summary);
    renderStageSections(viewModel.stageSections);
    renderVitalsChart(viewModel);
}

// --- INITIALISATION ---

// Multi-format UI state
const formatState = {
    leftMode: 'fragment', // 'fragment' or 'fhir'
    rightFormat: 'fhir',  // 'fhir', 'coderef', 'protobuf', 'fragment'
    conversionResults: {}, // Store all format results
    originalFhir: null, // Preserve original FHIR data to prevent round-trip loss
    originalFragment: null, // Preserve original fragment data for restoration
    suppressMessages: false
};

/**
 * Application Initialization Function
 * Purpose: Initialize the NFC IPS Viewer application and set up all event handlers
 * Usage: Called on page load to set up the complete application
 *
 * Features:
 * - Creates dynamic info boxes from configuration
 * - Sets up all button event handlers (parse, presets, navigation)
 * - Initializes payload processing from URL fragments
 * - Configures demo data switching
 * - Sets up character count tracking
 * - Handles NFC tag data processing
 *
 * Flow: Create UI → Setup Events → Process URL Fragment → Load Demo Data
 */
async function init() {

    // Only rebuild info boxes if HTML structure is incomplete
    const firstBox = document.querySelector('.info-box .info-title');
    const hasCorrectStructure = firstBox && firstBox.querySelector('.left-title') && firstBox.querySelector('.empty-text');
    const hasStratevac = document.querySelector('[data-key="stratevac"]');

    if (!hasCorrectStructure || !hasStratevac) {
        createInfoBoxes();
    }

    applyStaticOcpTitleOverrides();
    resetR1Title();

    const container = document.getElementById('info-boxes-container');

    // New enhanced UI elements
    const parseButton = document.getElementById('parse-button');
    const leftPaneTitle = document.getElementById('left-pane-title');
    const rightPaneTitle = document.getElementById('right-pane-title');
    const actionButton = document.getElementById('action-button');
    const leftInput = document.getElementById('left-input');
    const rightInput = document.getElementById('right-input');
    const leftCharCount = document.getElementById('left-char-count');
    const rightCharCount = document.getElementById('right-char-count');

    // Preset and clear buttons
    const preset0Button = document.getElementById('preset-0');
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

    const payload0 = await fetchJson(DEMO_PAYLOADS.IPS_FHIR_JSON_0);
    const payload1 = await fetchJson(DEMO_PAYLOADS.IPS_FHIR_JSON_1);
    const payload2 = await fetchJson(DEMO_PAYLOADS.IPS_FHIR_JSON_2);
    const payload3 = await fetchJson(DEMO_PAYLOADS.IPS_FHIR_JSON_3);

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

        appState.demos[1] = payloadService.buildViewModelFromObject(payload1, {
            label: 'Payload 1',
            rawPayload: payload1
        });
    }
    if (payload0) {
        appState.demos[0] = payloadService.buildViewModelFromObject(payload0, {
            label: 'Payload 0',
            rawPayload: payload0
        });
    }
    if (payload2) {
        appState.demos[2] = payloadService.buildViewModelFromObject(payload2, {
            label: 'Payload 2',
            rawPayload: payload2
        });
    }
    if (payload3) {
        appState.demos[3] = payloadService.buildViewModelFromObject(payload3, {
            label: 'Payload 3',
            rawPayload: payload3
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
                {"code": {"sys": "loinc", "code": "8310-5"}, "value": 97.8, "unit": "°F", "route": "Tympanic", "time": "2024-01-15T14:16:30Z"},
                {"code": {"sys": "loinc", "code": "8867-4"}, "value": 108, "unit": "bpm", "time": "2024-01-15T14:17:00Z"},
                {"code": {"sys": "loinc", "code": "8480-6"}, "value": 135, "unit": "mmHg", "time": "2024-01-15T14:17:30Z"},
                {"code": {"sys": "loinc", "code": "8462-4"}, "value": 90, "unit": "mmHg", "time": "2024-01-15T14:17:30Z"},
                {"code": {"sys": "loinc", "code": "2708-6"}, "value": 96, "unit": "%", "time": "2024-01-15T14:18:30Z"},
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
                {"code": {"sys": "loinc", "code": "8867-4"}, "value": 78, "unit": "bpm", "time": "2024-01-15T15:34:00Z"},
                {"code": {"sys": "loinc", "code": "8480-6"}, "value": 120, "unit": "mmHg", "time": "2024-01-15T15:31:30Z"},
                {"code": {"sys": "loinc", "code": "8462-4"}, "value": 80, "unit": "mmHg", "time": "2024-01-15T15:31:30Z"},
                {"code": {"sys": "loinc", "code": "2708-6"}, "value": 95, "unit": "%", "time": "2024-01-15T15:36:00Z"},
                {"code": {"sys": "loinc", "code": "9279-1"}, "value": 18, "unit": "/min", "time": "2024-01-15T15:32:00Z"}
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
                {"code": {"sys": "loinc", "code": "2708-6"}, "value": 94, "unit": "%", "time": "2024-01-15T16:02:00Z"},
                {"code": {"sys": "loinc", "code": "9279-1"}, "value": 17, "unit": "/min", "time": "2024-01-15T16:02:30Z"}
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

            const newFragment = await codecPipeline.encodeToFragment(payload1);
            presetFragments[1] = newFragment;
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
        presetFragments[1] = ''; // Clear cached fragment
        const newFragment = await updateFragmentFromPayload1();
        return newFragment;
    };

    // Expose comprehensive test function for debugging
    window.debugPatientPipeline = async function() {

        // Step 1: Source data

        // Step 2: Blood group code lookup
        const bgCode = enhancedIpsData.patient.blood_group;

        // Step 3: Protobuf encoding
        try {
            const fragment = await codecPipeline.encodeToFragment(enhancedIpsData);

            // Step 4: Protobuf decoding
            const decoded = await codecPipeline.decodeFragment(fragment);

            // Step 5: Patient resource building
            const patientResource = payloadService.buildViewModelFromObject(decoded).patientResource;

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

    // URL fragment processing disabled - user must manually trigger decode
    // const fragment = window.location.hash.slice(1);
    // if (fragment) { ... } // Auto-processing removed

    // Page starts in empty state - user must manually trigger parsing
    // Auto-rendering disabled to ensure clean initialization
    // Skip render calls since HTML already has correct empty structure
    // renderPatientBox(null);
    // renderPayloadDisplay(null);
    // renderClinicalSummaryBox(null, null, null);
    // renderStageSections({});
    renderVitalsChart(null);


    // === FORMAT SWITCHING FUNCTIONS ===

    async function updateLeftPaneMode(newMode) {
        const currentContent = leftInput.textContent.trim();
        formatState.leftMode = newMode;

        if (newMode === 'fragment') {
            leftPaneTitle.textContent = 'URL Fragment';
            leftInput.placeholder = 'Paste Base64 encoded fragment here...';
            actionButton.textContent = 'Decode';
            actionButton.className = 'pane-button decode-mode';

            // If we have original fragment stored, restore it instead of encoding FHIR
            if (formatState.originalFragment) {
                leftInput.textContent = formatState.originalFragment;
                if (!formatState.suppressMessages) {
                    showMessage('Restored original fragment data', 'success');
                }
            }
            // Otherwise, if switching from FHIR to fragment and we have FHIR content, encode it
            else if (currentContent && looksLikeJson(currentContent)) {
                try {
                    const fhirData = JSON.parse(currentContent);
                    const fragment = await codecPipeline.encodeToFragment(fhirData);
                    leftInput.textContent = fragment;
                    if (!formatState.suppressMessages) {
                        showMessage('Converted FHIR to fragment', 'success');
                    }
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
                leftInput.textContent = formatState.originalFhir;
                if (!formatState.suppressMessages) {
                    showMessage('Restored original FHIR data', 'success');
                }
            }
            // Otherwise, if switching from fragment to FHIR and we have fragment content, decode it
            else if (currentContent && !looksLikeJson(currentContent)) {
                try {
                    const parsedViewModel = await payloadService.parseUserInput(currentContent);
                    if (parsedViewModel && parsedViewModel.rawPayload) {
                        const fhirBundle = codecPipeline.convertCodeRefToFhirBundle(parsedViewModel.rawPayload);
                        const fhirJson = JSON.stringify(fhirBundle, null, 2);
                        leftInput.textContent = fhirJson;
                        if (!formatState.suppressMessages) {
                            showMessage('Converted fragment to FHIR', 'success');
                        }
                    }
                } catch (error) {
                    console.error('Error converting fragment to FHIR:', error);
                }
            }
        }

        leftPaneTitle.setAttribute('data-mode', newMode);
        updateCharCount(leftInput, leftCharCount);
        formatState.suppressMessages = false;
    }

    function updateRightPaneFormat(newFormat) {
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
            rightInput.textContent = formatState.conversionResults[newFormat];
            if (newFormat === 'fhir') {
            }
        } else {
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

            if (formatState.leftMode === 'fragment') {
                // Decode: Fragment -> CodeRef -> FHIR Bundle

                const parsedViewModel = await payloadService.parseUserInput(inputContent);
                if (parsedViewModel.rawPayload?.original_bundle_json) {
                }
                if (parsedViewModel.rawPayload?.originalBundleJson) {
                }
                if (!parsedViewModel?.rawPayload) {
                    throw new Error('Unable to decode fragment data');
                }

                // Store original fragment for restoration
                formatState.originalFragment = inputContent;

                // Store CodeRef format
                formatState.conversionResults.coderef = JSON.stringify(parsedViewModel.rawPayload, null, 2);

                // Convert to FHIR Bundle
                const fhirBundle = codecPipeline.convertCodeRefToFhirBundle(parsedViewModel.rawPayload);
                const fhirJson = JSON.stringify(fhirBundle, null, 2);
                formatState.conversionResults.fhir = fhirJson;

                // Store fragment (same as input)
                formatState.conversionResults.fragment = inputContent;

                // Generate protobuf binary format
                const codeRefData = parsedViewModel.rawPayload;
                formatState.conversionResults.protobuf = await codecPipeline.getProtobufBinary(codeRefData);

                showMessage(`Decoded to FHIR Bundle (${fhirBundle.entry.length} entries)`, 'success');

            } else { // 'fhir'
                // Encode: FHIR Bundle -> Fragment (stay in left pane)

                const fhirPayload = JSON.parse(inputContent);

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
        const newMode = formatState.leftMode === 'fragment' ? 'fhir' : 'fragment';
        await updateLeftPaneMode(newMode);
    });

    // Right pane title click - cycle through output formats in decode sequence
    rightPaneTitle.addEventListener('click', () => {
        const formats = ['protobuf', 'coderef', 'fhir']; // Decode sequence: Protobuf → CodeRef → FHIR
        const currentIndex = formats.indexOf(formatState.rightFormat);
        const nextIndex = (currentIndex + 1) % formats.length;
        updateRightPaneFormat(formats[nextIndex]);
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
        updateActivePreset(null);
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

        if (formatState.rightFormat !== 'fhir') {
            showMessage('Parse only available when right pane shows IPS FHIR JSON', 'warning');
            return;
        }

        const fhirInput = rightInput.textContent.trim();

        if (!fhirInput) {
            showMessage('No FHIR JSON available to parse', 'warning');
            return;
        }

        try {
            const parsedViewModel = await payloadService.parseUserInput(fhirInput);

            appState.currentViewModel = parsedViewModel;
            appState.comparisonViewModel = appState.demos[0] || null;
            processAndRenderAll(parsedViewModel, appState.comparisonViewModel);
            showMessage('FHIR JSON parsed and displayed successfully', 'success');

            // Force log flush for complete pipeline session debugging
            if (window.flushConsoleLogs) {
                window.flushConsoleLogs();
            }
        } catch (error) {
            console.error('Parse error:', error);
            showMessage(`Parse failed: ${error.message}`, 'error');
        }
    });

    // Legacy decode/encode buttons removed - functionality now handled by performConversion()

    // Preset button functionality
    function updateActivePreset(activeButton) {
        [preset0Button, preset1Button, preset2Button, preset3Button].forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Legacy clear buttons removed - functionality now handled by new clear buttons

    // Enhanced preset button handlers
    preset0Button.addEventListener('click', () => {
        if (formatState.leftMode === 'fragment') {
            // Load fragment into left pane
            if (presetFragments[0]) {
                leftInput.textContent = presetFragments[0];
                updateCharCount(leftInput, leftCharCount);
                showMessage('Loaded preset #0 fragment', 'success');
            }
        } else {
            // Load FHIR JSON into left pane
            if (payload0) {
                const fhirJson = JSON.stringify(payload0, null, 2);
                leftInput.textContent = fhirJson;
                updateCharCount(leftInput, leftCharCount);
                // Store as original FHIR to prevent round-trip loss
                formatState.originalFhir = fhirJson;
                showMessage('Loaded preset #0', 'success');
            } else {
                showMessage('Preset #0 not available', 'warning');
            }
        }

        updateActivePreset(preset0Button);
    });

    preset1Button.addEventListener('click', () => {

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
            // Load FHIR JSON into left pane
            if (payload2) {
                const fhirJson = JSON.stringify(payload2, null, 2);
                leftInput.textContent = fhirJson;
                updateCharCount(leftInput, leftCharCount);
                // Store as original FHIR to prevent round-trip loss
                formatState.originalFhir = fhirJson;
                showMessage('Loaded preset #2 FHIR JSON', 'success');
            } else {
                showMessage('Preset #2 FHIR JSON not available', 'warning');
            }
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
            // Load FHIR JSON into left pane
            if (payload3) {
                const fhirJson = JSON.stringify(payload3, null, 2);
                leftInput.textContent = fhirJson;
                updateCharCount(leftInput, leftCharCount);
                // Store as original FHIR to prevent round-trip loss
                formatState.originalFhir = fhirJson;
                showMessage('Loaded preset #3 FHIR JSON', 'success');
            } else {
                showMessage('Preset #3 FHIR JSON not available', 'warning');
            }
        }
    });

    // Character count functionality (updateCharCount function used by enhanced UI)
    function updateCharCount(input, countElement) {
        const text = input.textContent || '';
        const count = text.length;
        countElement.textContent = `${count} characters`;
    }

    // Initialize enhanced UI state
    updateRightPaneFormat('protobuf');

    // Load default content based on current mode
    // Fragment processing disabled - always start with default FHIR data
    {
        // Default to FHIR input without triggering automatic encoding/decoding

        // Start with empty FHIR pane - no auto-loading of payload data
        formatState.originalFhir = null;

        formatState.originalFragment = null;
        formatState.suppressMessages = true;

        // Skip updateLeftPaneMode during init to prevent payload pane blip
        // Just set the initial mode state without DOM changes
        formatState.leftMode = 'fhir';

        delete formatState.conversionResults.fhir;

        // Skip updateCharCount calls during init to prevent payload blip
        // Character counts are already "0 characters" in HTML for empty inputs
    }

    // No preset selected on initialization - user must manually select

    // Payload title navigation
    const payloadTitle = document.getElementById('payload-title');
    if (payloadTitle) {
        payloadTitle.addEventListener('click', () => {
            // Store current FHIR content for payload page
            if (formatState.rightFormat === 'fhir' && rightInput.textContent.trim()) {
                localStorage.setItem('currentIpsFhir', rightInput.textContent);
            }
            window.location.href = 'encoding.html';
        });
    }

    // Initialize Parse button state
    updateParseButtonState();

    // Dual title display now handled in createInfoBoxes()
}


// Legend Configuration
const LEGEND_CONFIG = {
    MARKER_SIZE: 7,
    MIN_ROW_GAP: 14,
    EXTRA_WIDTH_PADDING: 4
};

function renderCustomLegend(chartInstance) {
    if (!chartInstance || vitalsChartLibrary !== 'chartjs') return;

    const canvas = chartInstance.canvas;
    if (!canvas) return;

    const { vitalsContent, legendWrapper } = ensureLegendWrapper(canvas);
    if (!vitalsContent || !legendWrapper) return;

    const chartWrapper = vitalsContent.querySelector('.vitals-chart-wrapper');
    if (!chartWrapper) {
        resetLegendLayout();
        return;
    }

    const datasets = chartInstance.data?.datasets || [];
    const yScale = chartInstance.scales?.y;
    if (!datasets.length || !yScale) {
        resetLegendLayout(chartWrapper);
        return;
    }

    const visibleItems = datasets
        .map((dataset, index) => {
            if (chartInstance.isDatasetVisible && !chartInstance.isDatasetVisible(index)) {
                return null;
            }

            const data = dataset.data || [];
            const lastPoint = data[data.length - 1];
            if (!lastPoint || typeof lastPoint.y !== 'number') return null;

            const pixelY = yScale.getPixelForValue(lastPoint.y);
            if (!Number.isFinite(pixelY)) return null;

            return {
                dataset,
                label: dataset.label || 'Dataset',
                color: dataset.borderColor || '#000',
                pixelY
            };
        })
        .filter(Boolean);

    visibleItems.sort((a, b) => a.pixelY - b.pixelY);

    if (!visibleItems.length) {
        resetLegendLayout(chartWrapper);
        return;
    }

    const chartArea = chartInstance.chartArea;
    if (!chartArea) {
        resetLegendLayout(chartWrapper);
        return;
    }

    const canvasBounds = canvas.getBoundingClientRect();
    const cssHeight = canvasBounds.height || canvas.offsetHeight || chartInstance.height || 1;
    const internalHeight = chartInstance.height || cssHeight || 1;
    const pixelRatio = internalHeight ? cssHeight / internalHeight : 1;

    const areaHeightInternal = Math.max(chartArea.bottom - chartArea.top, 0);
    const areaHeightCss = areaHeightInternal * pixelRatio;
    const areaTopCss = chartArea.top * pixelRatio;
    const areaBottomCss = cssHeight - (areaTopCss + areaHeightCss);

    legendWrapper.classList.add('is-visible');
    legendWrapper.innerHTML = '';

    const availableHeight = Math.max(areaHeightCss, 0);
    legendWrapper.style.marginTop = `${Math.max(areaTopCss, 0)}px`;
    legendWrapper.style.marginBottom = `${Math.max(areaBottomCss, 0)}px`;
    legendWrapper.style.height = `${availableHeight}px`;
    const minSpacing = visibleItems.length > 1
        ? Math.max(0, Math.min(LEGEND_CONFIG.MIN_ROW_GAP, availableHeight / (visibleItems.length - 1)))
        : 0;

    const desiredPositions = visibleItems.map(item => {
        const pixel = item.pixelY * pixelRatio;
        const relative = pixel - areaTopCss;
        return Math.min(Math.max(relative, 0), availableHeight);
    });

    const adjustedPositions = resolveLegendPositions(
        desiredPositions,
        0,
        availableHeight,
        minSpacing
    );

    vitalsContent.classList.add('has-data');

    visibleItems.forEach((item, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'vitals-legend-item';
        legendItem.style.top = `${adjustedPositions[index]}px`;

        const marker = document.createElement('div');
        marker.className = 'vitals-legend-marker';
        marker.style.backgroundColor = item.color;

        const label = document.createElement('span');
        label.textContent = item.label;

        legendItem.appendChild(marker);
        legendItem.appendChild(label);
        legendWrapper.appendChild(legendItem);
    });

    const legendWidth = measureLegendWidth(legendWrapper);
    legendWrapper.style.width = `${legendWidth}px`;
    legendWrapper.style.minWidth = `${legendWidth}px`;
    vitalsContent.style.setProperty('--legend-column-width', `${legendWidth}px`);

    const computedStyles = getComputedStyle(vitalsContent);
    vitalsContent.style.setProperty('--legend-spacer-width', 'var(--standard-padding)');
}

function getVitalsAxisPadding(canvas) {
    const fallbackPadding = 36;
    if (!canvas) return fallbackPadding;
    const vitalsContent = canvas.closest('.vitals-content');
    if (!vitalsContent) return fallbackPadding;
    const styles = getComputedStyle(vitalsContent);
    const rawValue = styles.getPropertyValue('--vitals-axis-label-height');
    const parsed = Number.parseFloat(rawValue);
    return Number.isFinite(parsed) && parsed > 0 ? Math.max(parsed, fallbackPadding) : fallbackPadding;
}

function ensureLegendWrapper(canvas) {
    const vitalsContent = canvas.closest('.vitals-content');
    if (!vitalsContent) return { vitalsContent: null, legendWrapper: null };

    let spacer = vitalsContent.querySelector('.vitals-spacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.className = 'vitals-spacer';
        vitalsContent.appendChild(spacer);
    }

    let legendWrapper = vitalsContent.querySelector('#vitals-legend-wrapper');
    if (!legendWrapper) {
        legendWrapper = document.createElement('div');
        legendWrapper.id = 'vitals-legend-wrapper';
        legendWrapper.className = 'vitals-legend-wrapper';
        vitalsContent.appendChild(legendWrapper);
    }

    if (!vitalsContent.style.getPropertyValue('--legend-column-width')) {
        vitalsContent.style.setProperty('--legend-column-width', '0px');
    }

    return { vitalsContent, legendWrapper };
}

function measureLegendWidth(wrapper) {
    const widths = Array.from(wrapper.children).map(child => child.getBoundingClientRect().width);
    const widest = widths.length ? Math.max(...widths) : 0;
    const baseWidth = Math.ceil(widest + LEGEND_CONFIG.EXTRA_WIDTH_PADDING);
    const minimum = LEGEND_CONFIG.MARKER_SIZE + 24;
    return Math.max(minimum, baseWidth);
}

function resolveLegendPositions(positions, minY, maxY, minSpacing) {
    if (!positions.length) return [];

    const sorted = positions
        .map((pos, index) => ({ pos, index }))
        .sort((a, b) => a.pos - b.pos);

    const adjusted = new Array(positions.length);
    const clampValue = (value, lower, upper) => Math.min(Math.max(value, lower), upper);

    let cluster = [];
    let prevLast = minY - minSpacing;

    const distributeCluster = () => {
        if (!cluster.length) return;

        const n = cluster.length;
        let lowerBound = Math.max(minY, prevLast + minSpacing);
        let upperBound = Math.max(minY, maxY);
        if (lowerBound > upperBound) lowerBound = upperBound;
        const availableSpan = Math.max(upperBound - lowerBound, 0);

        if (n === 1 || minSpacing <= 0) {
            const value = clampValue(cluster[0].pos, lowerBound, upperBound);
            adjusted[cluster[0].index] = value;
            prevLast = value;
            cluster = [];
            return;
        }

        const center = cluster.reduce((sum, item) => sum + item.pos, 0) / n;
        const offsets = new Array(n);
        if (n % 2 === 1) {
            const mid = Math.floor(n / 2);
            for (let i = 0; i < n; i += 1) {
                offsets[i] = (i - mid) * minSpacing;
            }
        } else {
            const mid = n / 2;
            for (let i = 0; i < n; i += 1) {
                offsets[i] = (i - mid + 0.5) * minSpacing;
            }
        }

        let clusterPositions = offsets.map(offset => center + offset);
        const span = clusterPositions[n - 1] - clusterPositions[0];

        const createDistributedPositions = () => {
            const step = n > 1 ? (availableSpan / Math.max(n - 1, 1)) : 0;
            return clusterPositions.map((_, i) => lowerBound + step * i);
        };

        if (span > availableSpan + 0.001) {
            clusterPositions = createDistributedPositions();
        } else {
            const minShift = lowerBound - clusterPositions[0];
            const maxShift = upperBound - clusterPositions[n - 1];

            if (minShift > maxShift) {
                clusterPositions = createDistributedPositions();
            } else {
                let shift = 0;
                if (minShift > 0) {
                    shift = Math.min(minShift, maxShift);
                } else if (maxShift < 0) {
                    shift = Math.max(maxShift, minShift);
                }
                clusterPositions = clusterPositions.map(pos => pos + shift);
            }
        }

        cluster.forEach((item, idx) => {
            const value = clampValue(clusterPositions[idx], lowerBound, upperBound);
            adjusted[item.index] = value;
        });

        const clusterLast = adjusted[cluster[cluster.length - 1].index];
        prevLast = clusterLast;
        cluster = [];
    };

    sorted.forEach(item => {
        if (!cluster.length) {
            cluster.push(item);
            return;
        }

        const previous = cluster[cluster.length - 1];
        if (item.pos - previous.pos < minSpacing) {
            cluster.push(item);
        } else {
            distributeCluster();
            cluster.push(item);
        }
    });

    distributeCluster();

    return adjusted;
}

document.addEventListener('DOMContentLoaded', init);
