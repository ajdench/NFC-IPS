# CodeRef Pipeline Specification v1.0

## Overview
Ultra-compact medical data format for NFC transmission, designed for maximum space efficiency while maintaining full FHIR reconstruction capability.

## Pipeline Flow
```
FHIR Bundle → Ultra-Compact CodeRef → Protobuf → Base64 Fragment (<2000 chars)
Base64 Fragment → Protobuf → Ultra-Compact CodeRef → FHIR Bundle
```

## CodeRef Architecture

### Core Principles
1. **Ultra-compact**: Remove all unnecessary syntax
2. **Human-readable**: Prefix-based terminology (sct:, loinc:, nhs:)
3. **Exact reconstruction**: Full FHIR fidelity maintained
4. **Prefix lookup**: Each prefix maps to known FHIR system/structure

### Patient Demographics
```json
{
  "given": "Thomas",
  "family": "Hodge",
  "sct": "278152006",
  "nhs": "1234567890",
  "mil": "5199"
}
```

### Care Settings
All 11 care settings supported with dynamic R1 variants:
- `poi` - Point of Injury
- `casevac` - Casualty Evacuation
- `axp` - Ambulance Exchange Point
- `medevac` - Medical Evacuation
- `r1` - Role 1 Care (standard)
- `r1_phc` - Role 1 Primary Health Care
- `r1_phec` - Role 1 Primary Health Care Enhancement Capability
- `fwd_tacevac` - Forward Tactical Evacuation
- `r2_dhc` - Role 2 Deployed Hospital Care
- `rear_tacevac` - Rear Tactical Evacuation
- `r3_dhc` - Role 3 Deployed Hospital Care
- `stratevac` - Strategic Evacuation

### Clinical Data Format
Each care setting contains arrays of clinical entries:

```json
{
  "poi": [
    {
      "sct": "386725007",
      "value": 98.6,
      "unit": "degF",
      "time": "2024-01-15T14:16:00Z"
    },
    {
      "sct": "387207008",
      "dose": "10mg",
      "route": "IV",
      "time": "2024-01-15T14:20:00Z"
    }
  ]
}
```

## Prefix Lookup Table

### Terminology Systems
- `sct:` → `http://snomed.info/sct`
- `loinc:` → `http://loinc.org`
- `icd10:` → `http://hl7.org/fhir/sid/icd-10`
- `icd11:` → `http://hl7.org/fhir/sid/icd-11`
- `ucum:` → `http://unitsofmeasure.org`

### Identifier Systems
- `nhs:` → FHIR identifier with system `http://terminology.hl7.org/CodeSystem/v2-0203`, type code `NH`
- `mil:` → FHIR identifier with system `http://terminology.hl7.org/CodeSystem/v2-0203`, type code `MIL`

### Patient Extensions
- `sct: 278152006` in patient → Blood group FHIR extension with SNOMED system

## Field Requirements
- **Mandatory**: `code` (from any terminology system)
- **Optional**: `system`, `time`, `value`, `unit`, `dose`, `route`, etc.
- **Time format**: Always ISO 8601 `2024-01-15T14:16:00Z`
- **Units**: Simple text strings (`degF`, `mmHg`, `mg`)

## Reconstruction Rules

### Patient Demographics
```javascript
// CodeRef: {nhs: "1234567890"}
// Becomes FHIR:
{
  "identifier": [{
    "use": "official",
    "type": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
        "code": "NH",
        "display": "National Health Number"  // From local lookup
      }]
    },
    "system": "https://fhir.nhs.uk/Id/nhs-number",
    "value": "1234567890"
  }]
}
```

### Clinical Observations
```javascript
// CodeRef: {sct: "386725007", value: 98.6, unit: "degF", time: "2024-01-15T14:16:00Z"}
// Becomes FHIR:
{
  "resourceType": "Observation",
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "386725007",
      "display": "Body temperature"  // From local lookup
    }]
  },
  "valueQuantity": {
    "value": 98.6,
    "unit": "degF"
  },
  "effectiveDateTime": "2024-01-15T14:16:00Z"
}
```

## Error Handling
- **Invalid codes**: Display as "Code not recognized: [code]" but preserve through pipeline
- **Missing entries**: Skip failed reconstructions, log warnings, continue processing
- **Unknown prefixes**: Preserve original system URL

## Implementation Phases

### Phase 1: Structured Format (Current)
```json
{
  "patient": {...},
  "poi": [{...}],
  "r1_phc": [{...}]
}
```

### Phase 2: Stacked Format (Next)
```
patient:
  given: Thomas
  family: Hodge
  sct: 278152006

poi:
  sct: 386725007
  value: 98.6
  unit: degF
  time: 2024-01-15T14:16:00Z
```

### Phase 3: Single-Line Format (Future)
```
patient: given: Thomas family: Hodge sct: 278152006
poi: sct: 386725007 value: 98.6 unit: degF time: 2024-01-15T14:16:00Z
```

## Validation Requirements
- **Round-trip testing**: FHIR → CodeRef → FHIR must be identical
- **Size targets**: <2000 characters for Base64 fragment
- **Code validation**: All terminology codes must be valid
- **Time precision**: Preserve exact ISO 8601 timestamps

## Future Development Points
- External terminology API integration
- Unresolved section for unknown elements
- Version compatibility handling
- Compression level options
- Schema evolution support

---
*This specification defines the complete CodeRef pipeline architecture for ultra-compact medical data transmission via NFC.*