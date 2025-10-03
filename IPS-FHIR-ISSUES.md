# IPS FHIR JSON Issues & Recommendations

**Date**: 2025-10-03
**Context**: Phase 1 completion review

## Issues Found

### 1. ❌ Blood Group Missing from CodeRef

**Problem**: ips-fhir-json-1.json has blood group as an **Observation** (LOINC 882-1), not as a **Patient extension**.

**Current Structure**:
```json
{
  "resourceType": "Observation",
  "id": "333a7c6d-e1e0-5ff9-ad7e-2cf0d48313da",
  "code": {
    "coding": [{"system": "http://loinc.org", "code": "882-1", "display": "ABO and Rh group"}]
  },
  "valueCodeableConcept": {
    "coding": [{"system": "http://snomed.info/sct", "code": "112144000", "display": "Blood group O positive"}]
  }
}
```

**Expected by Converter** (lines 2228, 2410, 2493):
```json
{
  "resourceType": "Patient",
  "extension": [{
    "url": "http://hl7.org/fhir/StructureDefinition/patient-bloodGroup",
    "valueCodeableConcept": {
      "coding": [{"system": "http://snomed.info/sct", "code": "112144000"}]
    }
  }]
}
```

**IPS-OPCP Spec** (Section 3.1): Blood group Observation should be in Demographics section as stable demographic data.

**Impact**:
- CodeRef converter doesn't extract blood group → missing from compressed payload
- UI won't display blood group for Preset #1

**Recommendation**:
**Option A**: Add blood group as Patient extension (preferred for demographics)
**Option B**: Update converter to extract from Observation AND add to Demographics section

---

### 2. ✅ NHS Number URI is Correct

**Question**: Is `https://fhir.nhs.uk/Id/nhs-number` real?

**Answer**: YES - This is the **official NHS FHIR identifier system URI**

**Verification**:
- NHS Digital FHIR Implementation Guide confirms this URI
- GP Connect uses this as the standard identifier
- Used in NHS England and Wales FHIR implementations

**Current Usage** (ips-fhir-json-1.json):
```json
{
  "system": "https://fhir.nhs.uk/Id/nhs-number",
  "value": "9434765919"
}
```

**Status**: ✅ Correct, no changes needed

---

### 3. ⚠️ NATO Service Number URI Uncertain

**Question**: Is `https://fhir.nato.int/Id/service-number` real?

**Answer**: UNCERTAIN - No public documentation found

**Current Usage** (ips-fhir-json-1.json):
```json
{
  "type": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
      "code": "MIL",
      "display": "Military ID number"
    }]
  },
  "system": "https://fhir.nato.int/Id/service-number",
  "value": "A1234567"
}
```

**Issues**:
- No public NATO FHIR documentation found
- Follows FHIR URI conventions but unverified
- May be placeholder/assumed URI

**Recommendations**:
1. **If NATO FHIR exists**: Verify official URI with NATO healthcare standards
2. **If placeholder**: Consider alternatives:
   - `http://medis.org.uk/fhir/NamingSystem/service-number` (project-specific)
   - `urn:uuid:...` (UUID-based system)
   - `http://terminology.hl7.org/CodeSystem/v2-0203#MIL` (HL7 standard)

**Also Used**:
- `https://fhir.nato.int/StructureDefinition/military-rank`
- `https://fhir.nato.int/StructureDefinition/military-service`
- `https://nato.int/CodeSystem/stanag-2116` (STANAG 2116 rank codes)

**Status**: ⚠️ Requires verification

---

### 4. 🔍 bundleMetadata.composition_json is Large

**Question**: Why is there a blob after `composition_json`?

**Answer**: It's the **entire Composition resource serialized as JSON** (4,797 characters)

**Structure** (line 2438 in script.js):
```javascript
bundleMetadata: {
  id: bundle.id || '',
  meta_json: JSON.stringify(bundle.meta || {}),
  identifier_json: JSON.stringify(bundle.identifier || {}),
  type: bundle.type || 'document',
  timestamp: bundle.timestamp || new Date().toISOString(),
  composition_fullUrl: '...',
  composition_json: JSON.stringify(composition),  // ← 4,797 chars!
  entries_json: JSON.stringify(bundle.entry || [])  // ← Even larger!
}
```

**Issue**: This adds significant size to CodeRef payload:
- `composition_json`: ~4.8KB
- `entries_json`: Likely 50-100KB+ (entire Bundle)
- **Total metadata**: Could exceed NFC size limit (<2000 chars target!)

**Current Behavior**:
- Stores entire Bundle for reconstruction
- Allows perfect round-trip (FHIR → CodeRef → FHIR)
- But defeats compression purpose!

**Recommendations**:

**Option A: Minimal Metadata** (Recommended)
```javascript
bundleMetadata: {
  id: bundle.id,
  timestamp: bundle.timestamp,
  // Don't store full Composition - reconstruct from care stages
}
```

**Option B: Selective Composition**
```javascript
bundleMetadata: {
  id: bundle.id,
  timestamp: bundle.timestamp,
  compositionId: composition.id,
  compositionTitle: composition.title,
  // Reconstruct sections from care stages
}
```

**Option C: Compression Flag**
```javascript
// Add option to skip metadata for NFC transmission
function convertFhirBundleToCodeRef(bundle, options = { includeMetadata: false }) {
  if (options.includeMetadata) {
    // Full metadata for testing
  } else {
    // Minimal metadata for NFC
  }
}
```

**Trade-off**:
- **With metadata**: Perfect reconstruction but large payload
- **Without metadata**: Smaller payload but lossy reconstruction

**Status**: 🔍 Requires decision on compression vs. fidelity

---

## Recommended Actions

### Priority 1: Blood Group

**Action**: Add blood group as Patient extension

**Script**: Update ips-fhir-json-1.json
```javascript
// Add to Patient.extension array:
{
  "url": "http://hl7.org/fhir/StructureDefinition/patient-bloodGroup",
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "112144000",
      "display": "Blood group O positive"
    }]
  }
}

// Keep Observation in Demographics section per IPS-OPCP spec
```

### Priority 2: bundleMetadata Size

**Decision Needed**:
1. What's more important: small payload or perfect reconstruction?
2. Is this for NFC transmission (<2KB) or testing/demo?
3. Should we have two modes (compressed vs. full)?

**Recommendation**: Implement Option C (compression flag)

### Priority 3: NATO URIs

**Action**: Document as placeholder pending verification

**Add to IPS-OPCP-SPECIFICATION.md**:
```markdown
### Placeholder URIs (Pending Verification)
- `https://fhir.nato.int/Id/service-number` - NATO service number (unverified)
- `https://fhir.nato.int/StructureDefinition/military-rank` - Military rank extension
- `https://fhir.nato.int/StructureDefinition/military-service` - Service branch extension
- `https://nato.int/CodeSystem/stanag-2116` - STANAG 2116 rank codes

**Note**: These follow FHIR conventions but require official NATO healthcare standards verification.
```

---

## Files to Update

1. **ips-fhir-json-1.json**: Add blood group extension to Patient
2. **script.js**: Add bundleMetadata compression option
3. **IPS-OPCP-SPECIFICATION.md**: Document placeholder URIs
4. **update-encounters.cjs**: Extend to handle blood group migration

---

## Testing Checklist

After fixes:
- [ ] Blood group appears in CodeRef payload
- [ ] Blood group displays in Patient Demographics
- [ ] Payload size measured (with/without metadata)
- [ ] Round-trip test (FHIR → CodeRef → FHIR)
- [ ] NFC size validation (<2000 chars)

---

**Status**: Issues documented, awaiting user decisions
**Next**: Fix blood group extraction, decide on metadata compression strategy
