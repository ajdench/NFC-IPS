/**
 * JSON helpers used across the application to safely parse and clone payloads.
 */

/**
 * Safely parse JSON content, returning null when parsing fails.
 * @param {string} raw
 * @returns {Object|Array|null}
 */
export function tryParseJson(raw) {
    if (typeof raw !== 'string') return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

/**
 * Quick heuristic to determine if a string might contain JSON content.
 * @param {string} raw
 * @returns {boolean}
 */
export function looksLikeJson(raw) {
    if (typeof raw !== 'string') return false;
    const trimmed = raw.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
}

/**
 * Deep clone helper that prefers structuredClone but falls back to a manual
 * traversal for environments where structuredClone is unavailable.
 * @param {any} obj
 * @returns {any}
 */
export function safeDeepClone(obj) {
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(obj);
        } catch (error) {
            // Fall through to manual clone.
        }
    }

    function cloneValue(value) {
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value !== 'object') {
            return value;
        }
        if (value instanceof Date) {
            return new Date(value.getTime());
        }
        if (Array.isArray(value)) {
            return value.map(item => cloneValue(item));
        }
        const cloned = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                cloned[key] = cloneValue(value[key]);
            }
        }
        return cloned;
    }

    return cloneValue(obj);
}
