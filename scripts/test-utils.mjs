#!/usr/bin/env node
import assert from 'node:assert/strict';
import { normaliseBase64, base64ToUint8Array, base64ToString } from '../util/base64.js';
import { tryParseJson, looksLikeJson, safeDeepClone } from '../util/json.js';

// Polyfill atob for Node environments prior to v20.
if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (input) => Buffer.from(input, 'base64').toString('binary');
}

function toBase64Url(text) {
    return Buffer.from(text, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function runBase64Tests() {
    const originalText = 'Hello+/World';
    const urlSafe = toBase64Url(originalText);
    const normalised = normaliseBase64(urlSafe);

    assert.equal(normalised.length % 4, 0, 'normaliseBase64 should result in length divisible by 4');

    const decodedString = base64ToString(urlSafe);
    assert.equal(decodedString, originalText, 'base64ToString should round-trip URL-safe payloads');

    const byteArray = base64ToUint8Array(urlSafe);
    assert(byteArray instanceof Uint8Array, 'base64ToUint8Array should return Uint8Array');
    assert.equal(Buffer.from(byteArray).toString('utf8'), originalText, 'byte array should decode to original text');
}

function runJsonTests() {
    assert.equal(looksLikeJson(' { "a": 1 }'), true, 'looksLikeJson should detect JSON');
    assert.equal(looksLikeJson('plain'), false, 'looksLikeJson should reject non-JSON');

    assert.deepEqual(tryParseJson('{"a":1}'), { a: 1 }, 'tryParseJson should parse valid JSON');
    assert.equal(tryParseJson('invalid'), null, 'tryParseJson should return null for invalid JSON');

    const source = { nested: { value: 1 }, array: [1, 2, 3] };
    const clone = safeDeepClone(source);
    clone.nested.value = 2;
    clone.array.push(4);
    assert.equal(source.nested.value, 1, 'safeDeepClone should deep clone objects');
    assert.equal(source.array.length, 3, 'safeDeepClone should clone arrays');
}

runBase64Tests();
runJsonTests();

console.log('Utility tests passed.');
