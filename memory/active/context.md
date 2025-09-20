# Working Context

## Current Task Context

**Primary Objective**: Fix CodeRef conversion to enable perfect FHIR round-trip reconstruction

**Pipeline Flow**:
1. FHIR Bundle (89,053 chars) → CodeRef conversion (6,623 chars) → Protobuf → Compression → Base64URL fragment
2. Fragment → Base64 decode → Decompression → Protobuf decode → CodeRef → FHIR reconstruction

**Current Status**:
- ✅ **Compression Pipeline**: Working perfectly (92.6% reduction: 89k → 6.6k)
- ✅ **Clean Architecture**: Removed originalBundleJson duplication hack
- ❌ **Reconstruction Issue**: CodeRef→FHIR creates 70 entries (35,728 chars) vs original structure (89,053 chars)

**Root Problem**: CodeRef format doesn't preserve sufficient structural information to reconstruct exact original FHIR Bundle

**Next Steps**:
1. Analyze what structural information is lost in FHIR→CodeRef conversion
2. Enhance CodeRef format to preserve original Bundle entry structure/grouping
3. Fix reconstruction logic to restore exact original FHIR structure

## Architecture Status

**Clean Pipeline Established**:
- ✅ Removed protobuf schema field 11 (original_bundle_json)
- ✅ Removed duplication in convertFhirBundleToCodeRef()
- ✅ Removed "universal solution" fallback logic
- ✅ Clean compression: FHIR → CodeRef → Protobuf → Base64

**Requirements Clarified**:
- CodeRef must encode sufficient structural data for exact reconstruction
- Round-trip must produce identical 89,053 character FHIR Bundle
- No duplication hacks - compression-only approach

## Version Control

Using jj version control system for change management:
- Previous broken state checkpointed
- Clean architecture baseline established
- Ready for CodeRef structural preservation fixes