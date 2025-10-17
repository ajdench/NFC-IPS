# 2025-10-17: CodeRef Architecture Review

## Status: DEFERRED (Strategic refactor)

## Question
Is the CodeRef intermediate format necessary for the NFC IPS compression pipeline?

## Current Architecture (3-Stage Codec)
```
FHIR Bundle (JSON)
    ↓ convertFhirToCodeRef()
CodeRef (Proprietary JS object)
    ↓ encodeCodeRefToProtobuf()
Protobuf (Binary)
    ↓ Base64 URL-safe encoding
Fragment (String)
```

**Reverse**:
```
Fragment → Base64 decode → Protobuf → convertProtobufToCodeRef() → CodeRef → convertCodeRefToFhir() → FHIR
```

## Issues Identified

### 1. Dual careStage Logic (Root Cause of Today's Bug)
- `getCareStageFromResource()` - Used during FHIR→CodeRef (supports Encounter lookup)
- Local `getCareStage()` - Used during CodeRef→FHIR (only supports extensions)
- **Result**: Display button broke for Preset #1

### 2. Information Loss
CodeRef format loses FHIR structure:
- MedicationAdministration vs Procedure distinction (both become "events")
- Observation.category nuances (vitals, labs, assessments collapsed)
- Resource-level metadata (status, verificationStatus details)

### 3. Maintenance Burden
Changes require updates to:
1. FHIR → CodeRef converter (8 resource type handlers)
2. CodeRef → FHIR reconstructor (8 inverse handlers)
3. Protobuf schema (field definitions)
4. Total: ~3000 lines of codec logic

### 4. Bug Surface Area
Three conversion steps = three opportunities for bugs:
- FHIR → CodeRef: careStage extraction, terminology mapping
- CodeRef → Protobuf: schema version mismatches
- Protobuf → CodeRef → FHIR: round-trip fidelity issues

## Alternative: Direct Protobuf Architecture

### Proposed Flow
```
FHIR Bundle (JSON)
    ↓ JSON.stringify() + Gzip
Protobuf (Binary) - Stores raw FHIR JSON
    ↓ Base64 URL-safe encoding
Fragment (String)
```

**Reverse**:
```
Fragment → Base64 decode → Protobuf → Gunzip → JSON.parse() → FHIR Bundle
```

### Implementation
```protobuf
message NFCPayload {
  string fhir_json = 1;          // Gzipped FHIR Bundle JSON
  string schema_version = 2;      // "direct-fhir-v1"
  string timestamp = 3;           // ISO8601
}
```

### Benefits

#### 1. Compression Ratio (Similar)
- **Current**: FHIR (75KB) → CodeRef → Protobuf (7KB) ≈ 91% compression
- **Direct**: FHIR (75KB) → Gzip (6-8KB) ≈ 90-93% compression
- **Conclusion**: Gzip on structured JSON achieves same compression as CodeRef

#### 2. Lossless Round-Trip
- No information loss (byte-for-byte FHIR preservation)
- No conversion bugs (no converters to maintain)
- Single careStage extraction point (during display only)

#### 3. Code Simplification
- **Remove**: 3000+ lines of CodeRef conversion logic
- **Keep**: Protobuf encode/decode (100 lines)
- **Keep**: Display rendering (unchanged)
- **Result**: 70% less codec code

#### 4. Standards Compliance
- Pure IPS-OPCP FHIR (no proprietary format)
- Full FHIR semantics preserved
- Easier interoperability with other systems

#### 5. Single Source of Truth
- One `getCareStageFromResource()` function
- Used only during display rendering
- No encoding/decoding careStage logic

### Drawbacks

#### 1. Terminology API Dependency
- **Current**: CodeRef caches resolved display text
- **Direct**: Must re-run API lookups on each decode
- **Mitigation**: Cache API responses in localStorage (same approach)

#### 2. Migration Effort
- Rewrite Action/Display button handlers
- Create new protobuf schema
- Maintain backward compatibility with existing fragments
- Estimated: 2-3 days development

#### 3. Legacy Support
- Old CodeRef fragments become incompatible
- Need dual-path decoder: detect format, route accordingly
- Version detection: check protobuf schema_version field

## Recommendation

### Immediate (COMPLETED ✅)
Apply tactical fix: Use `getCareStageFromResource()` in `buildStageSectionsDirectlyFromFhirBundle()`

### Short-term (Optional)
Add integration tests for both careStage approaches:
- Test Preset #0 (extension-based)
- Test Preset #1 (Encounter-based)
- Prevent regression

### Long-term (Strategic - DEFERRED)
**If time permits**:
- Implement direct FHIR↔Protobuf architecture
- Benchmark compression ratios (validate Gzip assumption)
- Create migration path for legacy fragments
- Benefits: Simpler codebase, fewer bugs, lossless round-trip

**If time limited**:
- Keep CodeRef architecture
- Document dual careStage approaches clearly
- Add comment warnings about using correct function
- Focus on feature development instead of refactoring

## Decision: DEFERRED
**Rationale**:
- Tactical fix resolves immediate issue (Display button works)
- CodeRef architecture functional (if used correctly)
- Refactor is optimization, not bugfix
- Prioritize feature development over architectural changes

**Save for future**:
- When adding new resource types (complexity justifies simplification)
- When compression requirements change
- When maintenance burden becomes critical

## Related Documents
- memory/fixes/2025-10-17-carestage-encounter-lookup.md (Fix applied)
- memory/fixes/2025-10-17-carestage-extension-reading.md (Previous related fix)
