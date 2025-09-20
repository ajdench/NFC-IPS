# NFC IPS Terminology System Documentation

## Overview
The NFC IPS Viewer implements a CodeRef terminology system designed as a lightweight placeholder for production-grade FHIR terminology services. This system uses a simplified `{sys, code}` format for efficient NFC payload encoding while maintaining compatibility with international medical coding standards.

## CodeRef Format

### Structure
```javascript
{
    "sys": "system-identifier",    // Terminology system (LOINC, SNOMED, etc.)
    "code": "concept-code"         // Specific code within that system
}
```

### Design Philosophy
- **Compact Encoding**: Minimal overhead for NFC payload size constraints
- **System Agnostic**: Works with any terminology system (LOINC, SNOMED CT, ICD-10, etc.)
- **Future-Proof**: Easy migration path to full FHIR terminology services
- **Client-Side Ready**: Enables offline code resolution with embedded lookup tables

## Current Implementation

### Hardcoded Lookup Tables (script.js:126-150, 307+)

#### Unit Inference System
```javascript
function inferUnitFromCode(system, code) {
    const unitMap = {
        'loinc:8310-5': '°F',        // Body temperature
        'loinc:8867-4': 'bpm',       // Heart rate
        'loinc:8480-6': 'mmHg',      // Systolic blood pressure
        'loinc:8462-4': 'mmHg',      // Diastolic blood pressure
        'loinc:9279-1': '/min',      // Respiratory rate
        'loinc:2708-6': '%',         // Oxygen saturation
        // ... 50+ LOINC vital sign mappings
    };
    return unitMap[`${system}:${code}`];
}
```

#### Medical Code Resolution
```javascript
// Medical code lookup for demo purposes - client-side hardcoded mappings
// Located at script.js:307
```

### Supported Terminology Systems

#### LOINC (Logical Observation Identifiers Names and Codes)
- **System ID**: `"loinc"`
- **Usage**: Laboratory results, vital signs, clinical observations
- **Examples**:
  - `{"sys": "loinc", "code": "8310-5"}` → Body temperature
  - `{"sys": "loinc", "code": "8867-4"}` → Heart rate
  - `{"sys": "loinc", "code": "8480-6"}` → Systolic blood pressure

#### SNOMED CT (Systematized Nomenclature of Medicine Clinical Terms)
- **System ID**: `"sct"`
- **Usage**: Clinical conditions, procedures, body structures
- **Examples**:
  - `{"sys": "sct", "code": "248153007"}` → Gender concepts
  - `{"sys": "sct", "code": "278152006"}` → Blood group concepts

#### NHS Number System
- **System ID**: `"nhs-number"`
- **Usage**: UK National Health Service patient identifiers
- **Example**: `{"sys": "nhs-number", "code": "4857773456"}`

#### Military ID System
- **System ID**: `"mil"`
- **Usage**: Military service identifiers
- **Example**: `{"sys": "mil", "code": "5199"}`

## Data Examples

### Patient Demographics (script.js:2456-2459)
```javascript
{
    "gender": {"sys": "sct", "code": "248153007"},
    "blood_group": {"sys": "sct", "code": "278152006"},
    "nhs_id": {"sys": "nhs-number", "code": "4857773456"},
    "service_id": {"sys": "mil", "code": "5199"}
}
```

### Clinical Observations (script.js:2466-2470)
```javascript
{
    "vitals": [
        {"code": {"sys": "loinc", "code": "8310-5"}, "value": 98.2, "unit": "°F"},
        {"code": {"sys": "loinc", "code": "8867-4"}, "value": 92, "unit": "bpm"},
        {"code": {"sys": "loinc", "code": "8480-6"}, "value": 135, "unit": "mmHg"}
    ]
}
```

## FHIR Conversion

### CodeRef → FHIR Coding
```javascript
// CodeRef format
{"sys": "loinc", "code": "8310-5"}

// Converts to FHIR coding array
{
    "coding": [{
        "system": "http://loinc.org",
        "code": "8310-5",
        "display": "Body temperature"  // Resolved from lookup table
    }]
}
```

### System URI Mapping
```javascript
const systemUriMap = {
    "loinc": "http://loinc.org",
    "sct": "http://snomed.info/sct",
    "icd10": "http://hl7.org/fhir/sid/icd-10",
    "nhs-number": "https://fhir.hl7.org.uk/Id/nhs-number",
    "mil": "http://example.org/military-id"
};
```

## Production Migration Path

### Phase 1: Current State (Demo/Prototype)
- ✅ Hardcoded lookup tables in JavaScript
- ✅ Basic unit inference for common LOINC codes
- ✅ System agnostic CodeRef format
- ✅ FHIR conversion compatibility

### Phase 2: Enhanced Client-Side (Near Term)
- 📋 Expanded lookup tables (JSON files)
- 📋 Display name resolution for codes
- 📋 Multi-language terminology support
- 📋 Configurable system mappings

### Phase 3: Hybrid Architecture (Medium Term)
- 📋 Client-side caching with server fallback
- 📋 RESTful terminology service integration
- 📋 Incremental lookup table updates
- 📋 Offline-first capability

### Phase 4: Full FHIR Terminology (Production)
- 📋 FHIR R4/R5 terminology services
- 📋 ValueSet expansion and validation
- 📋 ConceptMap translations
- 📋 CodeSystem supplements

## Integration Points

### Codec Pipeline Integration
```javascript
// During FHIR → CodeRef conversion
function convertFhirToCodeRef(fhirData) {
    // Extracts coding[0].system and coding[0].code
    // Maps to {sys: shortName, code: code}
}

// During CodeRef → FHIR conversion
function convertCodeRefToFhirBundle(coderefData) {
    // Expands {sys, code} to full FHIR coding arrays
    // Adds display names from lookup tables
}
```

### UI Display Logic
```javascript
// Resolves codes for human-readable display
function getDisplayName(codeRef) {
    // Lookup chain: hardcoded → inferred → fallback
    return lookupTable[`${codeRef.sys}:${codeRef.code}`] ||
           inferFromContext(codeRef) ||
           codeRef.code;
}
```

## Security & Validation

### Input Validation
- System identifier whitelist
- Code format validation (alphanumeric, hyphens)
- Maximum code length enforcement
- SQL injection prevention

### Trust Model
- **Client-Side Lookup**: Trusted embedded tables
- **Server Integration**: HTTPS with certificate validation
- **Code Verification**: Optional checksum validation
- **Audit Logging**: Code resolution tracking

## Performance Considerations

### Lookup Optimization
- Hash map lookups for O(1) performance
- Lazy loading of terminology tables
- Memory-efficient code caching
- Batch resolution for multiple codes

### Payload Size Impact
```javascript
// CodeRef format (efficient)
{"sys": "loinc", "code": "8310-5"}  // 34 bytes

// Full FHIR coding (verbose)
{
    "coding": [{
        "system": "http://loinc.org",
        "code": "8310-5",
        "display": "Body temperature"
    }]
}  // 156 bytes (4.6x larger)
```

## Testing Strategy

### Code Coverage
- ✅ All supported terminology systems
- ✅ Unit inference for vital signs
- ✅ FHIR conversion round-trip testing
- ✅ Error handling for unknown codes

### Test Data Sets
- **LOINC**: Common laboratory and vital sign codes
- **SNOMED CT**: Clinical condition and procedure codes
- **Edge Cases**: Invalid formats, unknown systems
- **Performance**: Large lookup table stress tests

## Future Enhancements

### Standards Compliance
- FHIR R5 terminology service compatibility
- HL7 FHIR shorthand (FSH) support
- International Patient Summary (IPS) code bindings
- WHO ICD-11 integration readiness

### Advanced Features
- Hierarchical code relationships
- Synonym and translation support
- Context-aware code suggestions
- Real-time terminology updates

### Integration Opportunities
- NHS Digital terminology services
- SNOMED International services
- LOINC terminology server APIs
- Custom military/defense code systems

## References

- [FHIR R4 Terminology Services](https://hl7.org/fhir/R4/terminology-service.html)
- [LOINC Database](https://loinc.org/)
- [SNOMED CT International](https://www.snomed.org/)
- [HL7 International Patient Summary](http://hl7.org/fhir/uv/ips/)
- [NHS Data Dictionary](https://www.datadictionary.nhs.uk/)