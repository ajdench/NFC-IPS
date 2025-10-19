/**
 * Real-time Terminology API Lookup Service
 *
 * Provides async code resolution for SNOMED CT and LOINC codes
 * using public terminology servers with caching and rate limiting.
 *
 * @module terminology-api
 */

// API Configuration
const API_CONFIG = {
    snomed: {
        baseUrl: 'https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/browser/MAIN/concepts',
        rateLimit: 200, // ms between requests
        timeout: 5000    // request timeout
    },
    loinc: {
        // Using tx.fhir.org public terminology server for LOINC
        baseUrl: 'https://tx.fhir.org/r4/CodeSystem/$lookup',
        rateLimit: 200,
        timeout: 5000
    }
};

// In-memory cache for resolved codes
const terminologyCache = new Map();

// Rate limiting queue
const requestQueue = {
    snomed: { lastRequest: 0, pending: [] },
    loinc: { lastRequest: 0, pending: [] }
};

/**
 * Lookup a SNOMED CT code via Snowstorm API
 * @param {string} code - SNOMED CT concept ID
 * @returns {Promise<string>} - Display term (preferred term or FSN)
 */
async function lookupSnomedCode(code) {
    const cacheKey = `sct:${code}`;

    // Check cache first
    if (terminologyCache.has(cacheKey)) {
        return terminologyCache.get(cacheKey);
    }

    const url = `${API_CONFIG.snomed.baseUrl}/${code}`;

    try {
        const response = await fetchWithTimeout(url, API_CONFIG.snomed.timeout);

        if (!response.ok) {
            console.warn(`SNOMED lookup failed for ${code}: ${response.status}`);
            return code; // Fallback to code
        }

        const data = await response.json();

        // Extract display term (prefer PT over FSN)
        const display = data.pt?.term || data.fsn?.term || code;

        // Cache the result
        terminologyCache.set(cacheKey, display);

        return display;

    } catch (error) {
        console.error(`SNOMED API error for ${code}:`, error.message);
        return code; // Fallback to code on error
    }
}

/**
 * Lookup a LOINC code via public FHIR terminology server
 * Uses tx.fhir.org (HL7's public terminology server)
 * @param {string} code - LOINC code
 * @returns {Promise<string>} - Display name or code if not found
 */
async function lookupLoincCode(code) {
    const cacheKey = `loinc:${code}`;

    // Check cache first
    if (terminologyCache.has(cacheKey)) {
        return terminologyCache.get(cacheKey);
    }

    // FHIR CodeSystem $lookup operation
    const url = `${API_CONFIG.loinc.baseUrl}?system=http://loinc.org&code=${code}`;

    try {
        const response = await fetchWithTimeout(url, API_CONFIG.loinc.timeout, {
            headers: {
                'Accept': 'application/fhir+json'
            }
        });

        if (!response.ok) {
            console.warn(`LOINC lookup failed for ${code}: ${response.status}`);
            return code;
        }

        const data = await response.json();

        // FHIR Parameters resource structure
        // Find the 'display' parameter
        const displayParam = data.parameter?.find(p => p.name === 'display');
        const display = displayParam?.valueString || code;

        // Cache the result
        terminologyCache.set(cacheKey, display);

        return display;

    } catch (error) {
        console.error(`LOINC API error for ${code}:`, error.message);
        return code;
    }
}

/**
 * Fetch with timeout wrapper
 * @param {string} url - Request URL
 * @param {number} timeout - Timeout in milliseconds
 * @param {Object} options - Additional fetch options (headers, etc.)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, timeout, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Rate-limited code lookup with queue management
 * @param {string} system - Terminology system ('sct', 'loinc')
 * @param {string} code - Code to lookup
 * @returns {Promise<string>} - Display term
 */
async function rateLimitedLookup(system, code) {
    const queue = requestQueue[system === 'sct' ? 'snomed' : 'loinc'];
    const config = API_CONFIG[system === 'sct' ? 'snomed' : 'loinc'];

    // Calculate delay needed for rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - queue.lastRequest;
    const delay = Math.max(0, config.rateLimit - timeSinceLastRequest);

    // Wait if needed
    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Update last request time
    queue.lastRequest = Date.now();

    // Perform lookup
    if (system === 'sct') {
        return await lookupSnomedCode(code);
    } else if (system === 'loinc') {
        return await lookupLoincCode(code);
    } else {
        return code; // Unknown system
    }
}

/**
 * Main API - Resolve code display from terminology system
 * Replaces the local terminologyDatabase lookup with real-time API calls
 *
 * @param {string} system - Short system identifier ('sct', 'loinc', etc.)
 * @param {string} code - Code to resolve
 * @returns {Promise<string>} - Display term or code if lookup fails
 *
 * @example
 * const display = await resolveCodeDisplayAsync('sct', '233604007');
 * // Returns: "Pneumonia"
 *
 * @example
 * const display = await resolveCodeDisplayAsync('loinc', '8310-5');
 * // Returns: "Body temperature"
 */
export async function resolveCodeDisplayAsync(system, code) {
    if (!code || !system) {
        return code || 'unknown';
    }

    // Normalize system identifier
    const normalizedSystem = system.toLowerCase();

    // Only SNOMED CT and LOINC have working APIs - others fallback to code
    if (normalizedSystem !== 'sct' && normalizedSystem !== 'loinc') {
        // Other systems (HL7, etc.) - fallback to code
        return code;
    }

    // Perform rate-limited API lookup (SNOMED via Snowstorm, LOINC via tx.fhir.org)
    try {
        return await rateLimitedLookup(normalizedSystem, code);
    } catch (error) {
        console.error(`Terminology lookup failed for ${system}:${code}`, error);
        return code;
    }
}

/**
 * Batch lookup multiple codes (parallel with rate limiting)
 * @param {Array<{system: string, code: string}>} codes - Array of code refs
 * @returns {Promise<Map<string, string>>} - Map of "system:code" to display
 */
export async function batchResolveCodeDisplay(codes) {
    const results = new Map();

    // Process lookups with concurrency control
    for (const { system, code } of codes) {
        const key = `${system}:${code}`;
        const display = await resolveCodeDisplayAsync(system, code);
        results.set(key, display);
    }

    return results;
}

/**
 * Clear the terminology cache (useful for testing)
 */
export function clearTerminologyCache() {
    terminologyCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
    return {
        size: terminologyCache.size,
        keys: Array.from(terminologyCache.keys())
    };
}

/**
 * Manually populate cache with display text from FHIR resources
 * Used when FHIR has display text that we want to preserve
 * @param {string} system - Terminology system
 * @param {string} code - Code
 * @param {string} display - Display text
 */
export function cacheDisplayText(system, code, display) {
    if (system && code && display) {
        const cacheKey = `${system}:${code}`;
        terminologyCache.set(cacheKey, display);
    }
}

/**
 * Get display text from cache (synchronous)
 * @param {string} system - Terminology system
 * @param {string} code - Code
 * @returns {string|null} - Cached display or null
 */
export function getCachedDisplay(system, code) {
    const cacheKey = `${system}:${code}`;
    return terminologyCache.get(cacheKey) || null;
}
