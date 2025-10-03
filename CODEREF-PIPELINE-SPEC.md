# CodeRef Pipeline Specification v2.0

**Last Updated**: 2025-10-04
**Status**: Lossless reconstruction architecture complete

## Overview
Ultra-compact medical data format for NFC transmission, designed for maximum space efficiency while maintaining **lossless FHIR reconstruction** capability.

## Pipeline Flow
```
FHIR Bundle → Ultra-Compact CodeRef → Protobuf → Base64 Fragment (<2000 chars)
Base64 Fragment → Protobuf → Ultra-Compact CodeRef → FHIR Bundle (lossless)
```

**Key Change in v2.0**: Full metadata preservation for network lookup and offline reconstruction

## CodeRef Architecture

### Core Principles
1. **Ultra-compact**: Remove all unnecessary syntax
2. **Multi-coding**: Store all terminology codes (HL7, SNOMED, NATO, ISO)
3. **Lossless reconstruction**: Full FHIR fidelity including metadata
4. **OPSEC compliant**: Exclude Author/Practitioner resources
5. **Network lookup**: Bundle.identifier enables API retrieval
6. **Offline resilient**: Full reconstruction without network

### Patient Demographics (Multi-Coding)
```json
{
  "id": "5ed15fe2-7f5f-5f52-a1f6-0991ff75f452",
  "given": "Thomas",
  "family": "Hodge",
  "title": "Mr",
  "dob": "1998-03-15",
  "gender": {"sys": "sct", "code": "248153007"},
  "blood_group": {"sct": "278147001"},
  "nhs_id": {"nhs": "9434765919", "type": "NH"},
  "service_id": {"mil": "A1234567", "type": "MIL"},
  "rank": {
    "hl7-v2-0141": "E1",
    "nato-stanag-2116": "OR-1",
    "text": "Drummer"
  },
  "nationality": {"iso-3166": "GB"}
}
```

**Key Changes in v2.0**:
- ✅ Resource IDs preserved for fullUrl reconstruction
- ✅ Multi-coded fields (rank, nationality)
- ✅ Coded identifiers with type codes

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

### Bundle Metadata (v2.0)
**Preserved for lossless reconstruction:**

```json
{
  "bundle_id": "ips-bundle-phc-illness",
  "bundle_identifier": "urn:uuid:fec6b256-401a-48a2-ae94-b376331a64a7",
  "timestamp": 1727860200000,
  "composition_id": "composition-ips-phc-illness",
  "composition_title": "International Patient Summary — OPCP Illness Pathway (PHC escalation → STRATEVAC)",
  "composition_date": 1727859900000
}
```

**Purpose**:
- `bundle_identifier`: Network lookup of original IPS via API
- `composition_title`: Care context (trauma vs illness pathway)
- Timestamps: Medical-legal documentation

**Overhead**: ~200 bytes (acceptable for OPSEC + interoperability)

### Clinical Data Format (with Resource IDs)
Each care setting contains arrays of clinical entries:

```json
{
  "poi": {
    "vitals": [
      {
        "id": "obs-temp-poi-001",
        "code": {"sys": "loinc", "code": "8310-5"},
        "value": 98.6,
        "unit": "degF",
        "time": "2024-01-15T14:16:00Z"
      }
    ],
    "conditions": [
      {
        "id": "cond-fracture-001",
        "code": {"sys": "sct", "code": "417163006"},
        "onset": "2024-01-15T14:15:00Z"
      }
    ],
    "events": [
      {
        "id": "med-morphine-001",
        "code": {"sys": "sct", "code": "387207008"},
        "dose": "10mg",
        "route": "IV",
        "time": "2024-01-15T14:20:00Z"
      }
    ]
  }
}
```

**Key Change in v2.0**: Resource IDs preserved (~10 bytes per resource)

## System Code Lookup Table (v2.0)

### Terminology Systems
- `sct` → `http://snomed.info/sct`
- `loinc` → `http://loinc.org`
- `icd10` → `http://hl7.org/fhir/sid/icd-10`
- `icd11` → `http://hl7.org/fhir/sid/icd-11`
- `ucum` → `http://unitsofmeasure.org`
- `hl7-v2-0141` → `http://terminology.hl7.org/CodeSystem/v2-0141` (Military ranks)
- `nato-stanag-2116` → `http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks`
- `iso-3166` → `urn:iso:std:iso:3166` (Country codes)
- `opcp` → `http://medis.org.uk/CodeSystem/FHIR/OPCP/care-stages`

### Identifier Systems
- `nhs` → NHS number with type code `NH`
- `mil` → Military service number with type code `MIL`

### Multi-Coding Examples

**Rank** (HL7 + NATO STANAG + optional text):
```json
{
  "hl7-v2-0141": "E1",
  "nato-stanag-2116": "OR-1",
  "text": "Drummer"
}
```

**Nationality** (ISO 3166):
```json
{
  "iso-3166": "GB"
}
```

**Blood Group** (SNOMED):
```json
{
  "sct": "278147001"
}
```

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

## Validation Requirements (v2.0)
- **Lossless reconstruction**: FHIR → CodeRef → FHIR preserves all clinical data + metadata
- **Size targets**: <2000 characters for Base64 fragment
- **Code validation**: All terminology codes must be valid
- **Time precision**: Preserve exact ISO 8601 timestamps
- **Reference integrity**: Resource IDs enable fullUrl reconstruction
- **Multi-coding**: All codings preserved (HL7 + NATO + text)

## OPSEC Compliance
**Excluded from CodeRef** (if captured by enemy):
- ❌ Author/Practitioner resources (no personnel identification)
- ❌ Military-service extension (no unit identification)
- ✅ Clinical data only (contemporaneous treatment record)

**Included** (minimal sensitive data):
- ✅ Patient demographics (name, DOB, rank)
- ✅ Bundle identifier (network lookup capability)
- ✅ Clinical observations/medications

## Use Cases
1. **Trauma care**: NFC card with treatment record at point of injury
2. **Illness pathway**: PHC → R1 → R2 → R3 → STRATEVAC progression
3. **Network lookup**: Later retrieval via Bundle.identifier UUID when online
4. **Offline handover**: Card works without network at rear care facilities
5. **Civilian ingestion**: Output FHIR digestible by hospital EMR systems

## Implementation Status
- ✅ **Phase 1**: CodeSystem setup, bundleMetadata removal
- ⏳ **Phase 2**: Protobuf schema updates (metadata + multi-coding)
- ⏳ **Phase 3**: Converter updates (FHIR ↔ CodeRef)
- ⏳ **Phase 4**: Testing and validation

## References
- See `MULTI-CODING-ARCHITECTURE.md` for complete lossless reconstruction strategy
- See `IPS-OPCP-SPECIFICATION.md` for FHIR Bundle structure
- See `CodeSystem/` directory for local terminology hosting

---
*This specification defines the complete CodeRef v2.0 pipeline architecture for ultra-compact lossless medical data transmission via NFC.*