/**
 * Base64 utilities shared across the NFC IPS Viewer.
 * These helpers normalise URL-safe payloads and decode fragments into bytes.
 */

/**
 * Convert URL-safe Base64 into the standard alphabet + padding used by atob().
 * @param {string} input
 * @returns {string}
 */
export function normaliseBase64(input) {
    if (!input) return '';
    const cleaned = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const remainder = cleaned.length % 4;
    if (remainder === 2) return `${cleaned}==`;
    if (remainder === 3) return `${cleaned}=`;
    if (remainder === 1) return `${cleaned}===`;
    return cleaned;
}

/**
 * Decode a Base64 string into a Uint8Array. Returns null when decoding fails.
 * @param {string} input
 * @returns {Uint8Array|null}
 */
export function base64ToUint8Array(input) {
    try {
        const normalised = normaliseBase64(input);
        let binary;
        if (typeof atob === 'function') {
            binary = atob(normalised);
        } else {
            // Fallback for browsers/environments without atob
            binary = Buffer.from(normalised, 'base64').toString('binary');
        }

        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } catch (error) {
        return null;
    }
}

/**
 * Decode Base64 content into a UTF-8 string. Falls back to char-by-char decoding
 * when TextDecoder is unavailable.
 * @param {string} input
 * @returns {string|null}
 */
export function base64ToString(input) {
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
