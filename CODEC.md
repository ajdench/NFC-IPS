# NFC IPS Codec Pipeline Documentation

## Overview
The NFC IPS Viewer implements a sophisticated codec pipeline for encoding and decoding International Patient Summary (IPS) data in multiple formats. The system handles Base64, protobuf compression/decompression, and conversion between FHIR and CodeRef formats.

## Architecture Components

### 1. Codec Pipeline (script.js:430-603)
Central orchestrator for all encoding/decoding operations:

```javascript
const codecPipeline = createCodecPipeline();
// Returns: { decodeFragment, encodeToFragment, convertCodeRefToFhirBundle, getProtobufBinary, convertFhirToCodeRef }
```

### 2. Multi-Schema Support

#### CodeRef Schema (Modern)
- **File**: `resources/schemas/coderef.proto`
- **Format**: Protobuf with CodeRef objects `{sys: "system", code: "code"}`
- **Usage**: Current standard for new payloads

#### Legacy Schema (Backward Compatibility)
- **File**: `resources/schemas/legacy.proto`
- **Format**: Protobuf with indexed fields
- **Usage**: Support for existing NFC tags

### 3. Decoding Pipeline (script.js:579-603)

```javascript
async function decodeFragment(fragment) {
    // 1. Base64URL decode
    const bytes = base64ToUint8Array(fragment);

    // 2. Attempt compression detection & inflation
    const buffers = attemptInflations(bytes);

    // 3. Try CodeRef schema first (modern)
    const coderefResult = await tryDecode(payloadType, buffers, 'coderef');
    if (coderefResult) return { data: coderefResult, schemaVersion: 'coderef' };

    // 4. Fallback to legacy schema
    const legacyResult = await tryDecode(legacyPayloadType, buffers, 'legacy');
    if (legacyResult) return { data: legacyResult, schemaVersion: 'legacy' };

    throw new Error('Unable to decode NFC payload fragment.');
}
```

### 4. Encoding Pipeline (script.js:1192-1270)

```javascript
async function encodeToFragment(payload) {
    // 1. Format conversion: FHIR → CodeRef if needed
    if (payload.resourceType === 'Patient' || payload.resourceType === 'Bundle') {
        payload = convertFhirToCodeRef(payload);
    }

    // 2. Protobuf encoding using CodeRef schema
    const payloadType = await ensurePayloadType();
    const protobufData = getProtobufBinary(payload);

    // 3. Compression with pako
    const compressed = pako.deflate(protobufData);

    // 4. Base64URL encoding
    return uint8ArrayToBase64(compressed);
}
```

### 5. Format Conversion Functions

#### FHIR → CodeRef (script.js:659-882)
```javascript
function convertFhirToCodeRef(fhirData) {
    // Converts FHIR Bundle/Patient resources to CodeRef format
    // Maps: coding arrays → {sys, code} objects
    // Handles: Patient demographics, conditions, observations, medications
}
```

#### CodeRef → FHIR (script.js:883-1191)
```javascript
function convertCodeRefToFhirBundle(coderefData) {
    // Converts CodeRef format to FHIR Bundle
    // Maps: {sys, code} objects → FHIR coding arrays
    // Generates: Complete FHIR Bundle with Patient + clinical resources
}
```

### 6. Compression Handling (script.js:459-496)

```javascript
function attemptInflations(originalBytes) {
    const buffers = [originalBytes]; // Always try original first

    try {
        // Attempt pako inflation for compressed data
        const inflated = pako.inflate(originalBytes);
        buffers.push(inflated);
    } catch (e) {
        // Not compressed or inflation failed
    }

    return buffers;
}
```

### 7. Base64 Utilities (script.js:364-428)

#### URL-Safe Base64 Encoding
```javascript
function uint8ArrayToBase64(uint8Array) {
    // Standard Base64 → URL-safe Base64
    // Replaces: +/= → -_. (no padding)
}

function base64ToUint8Array(base64) {
    // URL-safe Base64 → Uint8Array
    // Handles: missing padding, URL-safe chars
}
```

## Data Flow Diagrams

### Decoding Flow
```
NFC Fragment (Base64URL)
    ↓
Base64 Decode → Uint8Array
    ↓
Compression Detection → [Original, Inflated?]
    ↓
Schema Detection → Try CodeRef → Try Legacy
    ↓
Protobuf Decode → CodeRef Format
    ↓
Format Conversion → FHIR Bundle
    ↓
UI Rendering
```

### Encoding Flow
```
FHIR Input (Patient/Bundle)
    ↓
Format Detection → Convert to CodeRef
    ↓
Protobuf Encoding → Binary Data
    ↓
Compression (pako) → Compressed Binary
    ↓
Base64URL Encoding → Fragment String
    ↓
NFC Tag / URL Fragment
```

## Error Handling

### Graceful Degradation
- **Schema Mismatch**: Falls back from CodeRef to Legacy
- **Compression Issues**: Tries both inflated and original data
- **Format Errors**: Preserves original data with error context
- **Invalid Base64**: Clear error messages with data validation

### Debug Logging
Comprehensive logging throughout pipeline:
```javascript
console.log('=== DECODING DEBUG ===');
console.log('=== ENCODING DEBUG ===');
// Field-level transformation tracking
```

## Integration Points

### User Interface
- **Parse Button**: Triggers manual decoding of left pane content
- **Encode/Decode Buttons**: Manual format conversion between panes
- **Fragment Loading**: Automatic URL fragment processing on page load
- **Demo Payloads**: Preset data for testing different formats

### External Dependencies
- **protobuf.js**: Protocol buffer compilation and runtime
- **pako**: Compression/decompression library
- **Base64 Polyfills**: Cross-browser compatibility

## Related Documentation
- **[TERMINOLOGY.md](TERMINOLOGY.md)**: CodeRef system and medical code mappings
- **[README.md](README.md)**: High-level architecture and features

## Performance Considerations

### Lazy Loading
- Protobuf schemas loaded on demand
- Compression detection with fallbacks
- Schema caching for repeated operations

### Memory Management
- Efficient Uint8Array handling
- Minimal intermediate object creation
- Buffer reuse in inflation attempts

## Security Considerations

### Input Validation
- Base64 format validation before decoding
- Protobuf schema validation during parsing
- Safe error handling without data leaks

### Data Sanitization
- FHIR resource type validation
- CodeRef structure validation
- Safe DOM manipulation for display

## Testing Strategy

### Demo Payloads
- **payload-1.json**: CodeRef format example
- **payload-2.json**: Alternative patient scenario
- **Built-in Presets**: UI buttons #1, #2, #3

### Format Coverage
- ✅ FHIR Patient resources
- ✅ FHIR Bundle resources
- ✅ CodeRef protobuf format
- ✅ Legacy indexed protobuf format
- ✅ Compressed and uncompressed variants

## Future Enhancements

### Planned Features
- Additional protobuf schema versions
- Enhanced compression algorithms
- Streaming decode for large payloads
- Schema migration utilities

### Optimization Opportunities
- WebAssembly protobuf compilation
- Worker thread processing for large payloads
- Advanced caching strategies
- Progressive loading for complex bundles