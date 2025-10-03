# Multi-Coding Architecture for Lossless Reconstruction

**Date**: 2025-10-03
**Principle**: Everything that can be coded (using terminology) should be, using open standards queryable via APIs

## URI Structure Standard

### Pattern
```
http://medis.org.uk/CodeSystem/{source}/{standard}/{version}/{concept}
```

### Examples
```
http://medis.org.uk/CodeSystem/FHIR/OPCP/care-stages
http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks
http://medis.org.uk/CodeSystem/SNOMED/CT/lookup-table
```

### Local Hosting Strategy

**Directory Structure**:
```
/CodeSystem/
  FHIR/
    OPCP/
      care-stages.json          # IPS-OPCP care stages
  NATO/
    STANAG/
      2116/
        APERSP-01/
          ranks.json            # Military ranks OR-1 to OR-9, OF-1 to OF-10
  SNOMED/
    CT/
      lookup-table.json         # Static SNOMED cache
```

**URL Resolution**:
- **Dev**: `http://127.0.0.1:8080/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks.json`
- **GitHub Pages**: `https://user.github.io/nfc-ips/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks.json`
- **Production**: `https://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks.json`

**Benefits**:
- ✅ Works offline (embedded in app)
- ✅ Version controlled (git)
- ✅ Same URIs across environments
- ✅ No external dependencies
- ✅ Future-proof (URIs stay valid when domain acquired)

---

## Multi-Coding Strategy

### Principle
**Code with ALL applicable terminologies**, store primary in CodeRef, retain all in FHIR

### Example: Military Rank

**FHIR (Multiple Codings)**:
```json
{
  "url": "https://fhir.nato.int/StructureDefinition/military-rank",
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v2-0141",
        "code": "E1",
        "display": "Enlisted 1"
      },
      {
        "system": "http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks",
        "code": "OR-1",
        "display": "Private (OR-1)"
      }
    ],
    "text": "Drummer"
  }
}
```

**CodeRef (Primary Code + Text)**:
```javascript
{
  rank: {
    sys: 'stanag',      // Primary: NATO STANAG (military-specific)
    code: 'OR-1',
    text: 'Drummer'     // Specific UK appointment
  }
}
```

**Reconstruction**:
```javascript
// From CodeRef rank
const rankExtension = {
  url: 'https://fhir.nato.int/StructureDefinition/military-rank',
  valueCodeableConcept: {
    coding: [
      // Add HL7 mapping from lookup
      {
        system: 'http://terminology.hl7.org/CodeSystem/v2-0141',
        code: mapStanagToHL7('OR-1'), // → 'E1'
        display: lookupHL7Display('E1') // → 'Enlisted 1'
      },
      // Add primary STANAG code
      {
        system: 'http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks',
        code: rank.code,
        display: lookupStanagDisplay(rank.code) // → 'Private (OR-1)'
      }
    ],
    text: rank.text // → 'Drummer'
  }
};
```

---

## CodeRef Format - Current vs Multi-Coding

### Current Format (Single Coding)
```javascript
{
  sys: "sct",           // System short code
  code: "248153007"     // Code value
}
```

**Protobuf**:
```protobuf
message CodeRef {
  oneof system_reference {
    string sys = 1;
    SystemType system_id = 9;
  }
  string code = 2;
}
```

### Multi-Coding Format (Aligned with Current)
```javascript
{
  "hl7-v2-0141": "E1",
  "nato-stanag-2116": "OR-1",
  "text": "Drummer"  // optional
}
```

**Why this works**:
- Simple key-value pairs (no nested arrays)
- Easy global migration (find-replace system keys)
- Backward compatible with single codings
- Matches user requirement: `HL70141: E1 AND NATO2116: OR1 AND rank: Drummer`

### System Key Mappings

| Short Key | Full System URI | Use Case |
|-----------|-----------------|----------|
| `sct` | `http://snomed.info/sct` | SNOMED CT codes |
| `loinc` | `http://loinc.org` | LOINC codes |
| `nhs` | `https://fhir.nhs.uk/Id/nhs-number` | NHS number |
| `mil` | Custom service ID system | Military service number |
| `hl7-v2-0141` | `http://terminology.hl7.org/CodeSystem/v2-0141` | HL7 generic ranks |
| `nato-stanag-2116` | `http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks` | NATO ranks |
| `opcp` | `http://medis.org.uk/CodeSystem/FHIR/OPCP/care-stages` | Care stages |

### Expansion/Compression

**Encode** (FHIR → CodeRef):
```javascript
function compressSystem(fullUri) {
  const sysMap = {
    'http://snomed.info/sct': 'sct',
    'http://loinc.org': 'loinc',
    'https://fhir.nhs.uk/Id/nhs-number': 'nhs',
    'http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks': 'stanag',
    'http://terminology.hl7.org/CodeSystem/v2-0141': 'hl7-rank',
    'http://medis.org.uk/CodeSystem/FHIR/OPCP/care-stages': 'opcp'
  };
  return sysMap[fullUri] || fullUri;
}
```

**Decode** (CodeRef → FHIR):
```javascript
function expandSystem(shortCode) {
  const sysMap = {
    'sct': 'http://snomed.info/sct',
    'loinc': 'http://loinc.org',
    'nhs': 'https://fhir.nhs.uk/Id/nhs-number',
    'stanag': 'http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks',
    'hl7-rank': 'http://terminology.hl7.org/CodeSystem/v2-0141',
    'opcp': 'http://medis.org.uk/CodeSystem/FHIR/OPCP/care-stages'
  };
  return sysMap[shortCode] || shortCode;
}
```

---

## Lossless Reconstruction Strategy

### Design Principle
**Store all data needed to reconstruct valid FHIR for:**
1. Network lookup of original IPS via Bundle identifier
2. Offline reconstruction when network unavailable
3. Ingestion by civilian hospital systems

### Security Consideration
**Exclude identifying metadata:**
- ❌ Author/Practitioner resources (operational security)
- ❌ Unnecessary provenance (minimizes sensitive data if card captured)
- ✅ Clinical data only (contemporaneous treatment record)

### 1. **Store Primary Coding in CodeRef**

**Rule**: Store the **most specific** or **domain-appropriate** code

**Examples**:
- **Rank**: STANAG (military-specific) over HL7 (generic)
- **Allergy**: SNOMED code (queryable) + infer category from hierarchy
- **Care Stage**: OPCP code (specific to use case)

### 2. **Lookup Tables for Secondary Codings**

**Files**:
```
/CodeSystem/mappings/
  stanag-to-hl7-rank.json       # OR-1 → E1
  opcp-to-encounter-class.json  # poi → AMB
```

**Example: stanag-to-hl7-rank.json**:
```json
{
  "OR-1": "E1",
  "OR-2": "E2",
  "OR-3": "E3",
  "OR-4": "E4",
  "OR-5": "E5",
  "OR-6": "E6",
  "OR-7": "E7",
  "OR-8": "E8",
  "OR-9": "E9",
  "OF-1": "O1",
  "OF-2": "O2",
  "OF-3": "O3",
  "OF-4": "O4",
  "OF-5": "O5",
  "OF-6": "O6",
  "OF-7": "O7",
  "OF-8": "O8",
  "OF-9": "O9",
  "OF-10": "O10"
}
```

### 3. **Bundle Metadata Preservation**

**Critical for reconstruction:**

**Store in NFCPayload:**
```protobuf
message NFCPayload {
  // Clinical data
  Patient patient = 1;
  Stage poi = 2;
  // ... other stages ...

  // Metadata for lossless reconstruction
  int64 timestamp = 8;              // Bundle.timestamp (Unix)
  string bundle_id = 11;            // Bundle.id
  string bundle_identifier = 12;    // Bundle.identifier.value (UUID)
  string composition_id = 13;       // Composition.id
  string composition_title = 14;    // Composition.title
  int64 composition_date = 15;      // Composition.date (Unix)
}
```

**Why each field matters:**
- `timestamp`: Medical-legal requirement, care timeline anchor
- `bundle_id`: Traceability to source system
- `bundle_identifier`: Network lookup of original IPS via API
- `composition_title`: Care context (e.g., "OPCP Illness Pathway PHC → STRATEVAC")
- `composition_date`: Often differs from Bundle.timestamp

**Overhead:** ~200 bytes (acceptable for OPSEC + interoperability)

### 4. **Resource ID Preservation**

**Store IDs for reference integrity:**

```protobuf
message Patient {
  string id = 11;                   // Patient.id
  string given = 1;
  string family = 2;
  // ...
}

message Condition {
  string id = 3;                    // Condition.id
  CodeRef code = 1;
  string onset = 2;
}

message Event {
  string id = 6;                    // MedicationAdministration.id
  CodeRef code = 1;
  string time = 2;
  // ...
}

message Allergy {
  string id = 4;                    // AllergyIntolerance.id
  CodeRef code = 1;
  string onset = 2;
  string severity = 3;
}
```

**fullUrl regeneration:**
```javascript
function reconstructFullUrl(resourceId) {
  return `urn:uuid:${resourceId}`;
}

// Composition.subject.reference = "urn:uuid:b63b1e74-ac70-414b-a017-22c20df29043"
// Generated from Patient.id
```

**Overhead:** ~10 bytes per resource

### 5. **Display Text Resolution**

**Approach**: Load CodeSystem JSON, lookup display by code

```javascript
async function lookupDisplay(system, code) {
  const systemFile = systemToFile(system);
  const codeSystem = await fetch(systemFile).then(r => r.json());
  const concept = codeSystem.concept?.find(c => c.code === code);
  return concept?.display || code;
}

// Example
await lookupDisplay('http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks', 'OR-1')
// → 'Private (OR-1)'
```

### 6. **Reconstruction Algorithm**

**Full FHIR Bundle reconstruction from CodeRef:**

```javascript
function reconstructFhirBundle(codeRefPayload) {
  // Reconstruct Bundle metadata from stored fields
  const bundle = {
    resourceType: 'Bundle',
    id: codeRefPayload.bundle_id || 'ips-reconstructed',
    meta: {
      lastUpdated: new Date(codeRefPayload.timestamp).toISOString(),
      profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips']
    },
    identifier: {
      system: 'urn:ietf:rfc:3986',
      value: codeRefPayload.bundle_identifier || `urn:uuid:${generateUUID()}`
    },
    type: 'document',
    timestamp: new Date(codeRefPayload.timestamp).toISOString(),
    entry: []
  };

  // Reconstruct Composition
  const compositionId = codeRefPayload.composition_id || generateUUID();
  bundle.entry.push({
    fullUrl: `urn:uuid:${compositionId}`,
    resource: {
      resourceType: 'Composition',
      id: compositionId,
      status: 'final',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '60591-5',
          display: 'Patient summary Document'
        }]
      },
      subject: {
        reference: `urn:uuid:${codeRefPayload.patient.id}`
      },
      date: new Date(codeRefPayload.composition_date || codeRefPayload.timestamp).toISOString(),
      title: codeRefPayload.composition_title || 'International Patient Summary',
      section: []
      // ❌ No author - OPSEC
    }
  });

  // Reconstruct Patient resource
  const patient = reconstructPatient(codeRefPayload.patient);
  bundle.entry.push({
    fullUrl: `urn:uuid:${codeRefPayload.patient.id}`,
    resource: patient
  });

  // Reconstruct clinical resources with IDs
  codeRefPayload.poi.conditions.forEach(condition => {
    bundle.entry.push({
      fullUrl: `urn:uuid:${condition.id}`,
      resource: reconstructCondition(condition)
    });
  });

  return bundle;
}

function reconstructPatient(codeRefPatient) {
  return {
    resourceType: 'Patient',
    id: codeRefPatient.id,
    name: [{
      given: [codeRefPatient.given],
      family: codeRefPatient.family,
      prefix: [codeRefPatient.title]
    }],
    gender: expandGender(codeRefPatient.gender),
    birthDate: codeRefPatient.dob,
    identifier: [
      {
        system: 'https://fhir.nhs.uk/Id/nhs-number',
        value: codeRefPatient.nhs_id['nhs'],
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'NH',
            display: 'National Health Service Number'
          }]
        }
      },
      {
        system: 'https://fhir.nato.int/Id/service-number',
        value: codeRefPatient.service_id['mil'],
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'MIL',
            display: 'Military ID number'
          }]
        }
      }
    ],
    extension: [
      // Blood group
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
        valueCodeableConcept: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: codeRefPatient.blood_group['sct'],
            display: await lookupDisplay('http://snomed.info/sct', codeRefPatient.blood_group['sct'])
          }]
        }
      },
      // Multi-coded rank
      {
        url: 'https://fhir.nato.int/StructureDefinition/military-rank',
        valueCodeableConcept: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0141',
              code: codeRefPatient.rank['hl7-v2-0141'],
              display: await lookupDisplay('http://terminology.hl7.org/CodeSystem/v2-0141', codeRefPatient.rank['hl7-v2-0141'])
            },
            {
              system: 'http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks',
              code: codeRefPatient.rank['nato-stanag-2116'],
              display: await lookupDisplay('http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks', codeRefPatient.rank['nato-stanag-2116'])
            }
          ],
          text: codeRefPatient.rank['text']  // Optional specific appointment
        }
      },
      // Nationality
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-nationality',
        valueCodeableConcept: {
          coding: [{
            system: 'urn:iso:std:iso:3166',
            code: codeRefPatient.nationality['iso-3166'],
            display: await lookupDisplay('urn:iso:std:iso:3166', codeRefPatient.nationality['iso-3166'])
          }]
        }
      }
      // ❌ No military-service extension - OPSEC (unit identification)
    ]
  };
}
```

---

## Updated Protobuf Schema

### NFCPayload Message (Metadata Added)

```protobuf
message NFCPayload {
  Patient patient = 1;
  Stage poi = 2;
  Stage medevac = 3;
  Stage r1 = 4;
  Stage r2 = 5;
  Stage casevac = 6;
  Stage r3 = 7;
  int64 t = 8;                       // Bundle.timestamp (Unix) - EXISTING
  BundleMetadata bundleMetadata = 9; // DEPRECATED - remove
  repeated Allergy allergies = 10;

  // NEW: Lossless reconstruction metadata
  string bundle_id = 11;             // Bundle.id
  string bundle_identifier = 12;     // Bundle.identifier.value (UUID)
  string composition_id = 13;        // Composition.id
  string composition_title = 14;     // Composition.title
  int64 composition_date = 15;       // Composition.date (Unix)
}
```

### Patient Message (Multi-Coding + ID)

```protobuf
message Patient {
  string given = 1;
  string family = 2;
  CodeRef gender = 3;
  CodeRef blood_group = 4;
  CodeRef nhs_id = 5;
  CodeRef service_id = 6;
  string dob = 7;
  CodeRef rank = 8;              // ← Changed from string, now multi-coded
  string title = 9;
  CodeRef nationality = 10;      // ← Changed from string, now ISO 3166 coded
  string id = 11;                // ← ADD: Patient.id for references
}
```

### Clinical Resource IDs

```protobuf
message Condition {
  CodeRef code = 1;
  string onset = 2;
  string id = 3;                 // ← ADD: Condition.id
}

message Event {
  CodeRef code = 1;
  string time = 2;
  double dose = 3;
  string unit = 4;
  string route = 5;
  string id = 6;                 // ← ADD: MedicationAdministration.id
}

message Allergy {
  CodeRef code = 1;
  string onset = 2;
  string severity = 3;
  string id = 4;                 // ← ADD: AllergyIntolerance.id
}

message Vital {
  CodeRef code = 1;
  double value = 2;
  string time = 3;
  string id = 4;                 // ← ADD: Observation.id
}
```

### CodeRef Message (No Changes Needed!)

**Current schema already supports multi-coding via JavaScript object:**

```protobuf
message CodeRef {
  oneof system_reference {
    string sys = 1;
    SystemType system_id = 9;
  }
  string code = 2;
  ClinicalStatus clinical_status = 10;
  VerificationStatus verification_status = 11;
  ObservationCategory category = 12;
}
```

**JavaScript usage patterns**:

1. **Single coding** (backward compatible):
   ```javascript
   {sys: "sct", code: "248153007"}
   ```

2. **Multi-coding** (new format):
   ```javascript
   {
     "hl7-v2-0141": "E1",
     "nato-stanag-2116": "OR-1",
     "text": "Drummer"
   }
   ```

3. **Coded identifier**:
   ```javascript
   {
     "nhs": "9434765919",
     "type": "NH"
   }
   ```

**Note**: CodeRef stores multi-coding as JavaScript object with system keys. Protobuf serialization handles this as map-like structure. Text field added implicitly via "text" key.

---

## Multi-Coding Strategy Summary

**Approach**: Store all codings as key-value pairs in CodeRef objects

**Example - Military Rank**:
```javascript
// FHIR has multiple codings
rank: {
  "hl7-v2-0141": "E1",          // Generic grade
  "nato-stanag-2116": "OR-1",   // Specific NATO rank
  "text": "Drummer"             // Optional UK appointment
}
```

**Migration Path**:
1. Use verbose system keys initially: `"hl7-v2-0141"`, `"nato-stanag-2116"`
2. Global find-replace later for simplification: `"hl7"`, `"nato"`
3. No structural changes needed, just key renaming

## Implementation Checklist

### Phase 1: CodeSystem Setup ✅ COMPLETE
- [x] Create `/CodeSystem/` directory structure
- [x] Create `NATO/STANAG/2116/APERSP-01/ranks.json`
- [x] Create `FHIR/OPCP/care-stages.json`
- [x] Create mapping file: `stanag-to-hl7-rank.json`
- [x] Remove bundleMetadata from converter (91% size reduction)
- [x] Document lossless reconstruction strategy

### Phase 2: Protobuf Schema Updates
- [ ] Add metadata fields to NFCPayload (bundle_id, bundle_identifier, composition_id, composition_title, composition_date)
- [ ] Add id field to Patient, Condition, Event, Allergy, Vital messages
- [ ] Change Patient.rank from string to CodeRef (multi-coding support)
- [ ] Change Patient.nationality from string to CodeRef (ISO 3166 coding)
- [ ] Remove deprecated BundleMetadata message
- [ ] Regenerate protobuf JavaScript

### Phase 3: Converter Updates (FHIR → CodeRef)
- [ ] Extract Bundle metadata (id, identifier, timestamp)
- [ ] Extract Composition metadata (id, title, date)
- [ ] Extract resource IDs (Patient, Condition, Event, etc.)
- [ ] Extract multi-coded rank (HL7 + NATO STANAG)
- [ ] Extract coded nationality (ISO 3166)
- [ ] Store multi-codings as key-value objects

### Phase 4: Converter Updates (CodeRef → FHIR)
- [ ] Reconstruct Bundle with preserved metadata
- [ ] Reconstruct Composition with preserved metadata
- [ ] Reconstruct fullUrl references from resource IDs
- [ ] Rebuild multi-coded extensions (rank, nationality, blood group)
- [ ] Implement lookup functions for display text
- [ ] Exclude Author/Practitioner resources (OPSEC)

### Phase 5: Testing
- [ ] Test Bundle metadata preservation
- [ ] Test resource ID preservation and fullUrl reconstruction
- [ ] Test multi-coding: rank (HL7 + NATO)
- [ ] Test coded nationality (ISO 3166)
- [ ] Test round-trip: FHIR → CodeRef → FHIR
- [ ] Verify lossless reconstruction (except OPSEC exclusions)
- [ ] Test network lookup via Bundle.identifier

---

## Benefits Summary

### Multi-Coding
✅ **Interoperability**: HL7 for generic systems, STANAG for military
✅ **Specificity**: Preserve precise codes (OR-1) + text (Drummer)
✅ **Queryable**: Can search by grade (E1) or specific rank (OR-1)
✅ **Standards-based**: Use established terminologies

### Local CodeSystems
✅ **Offline**: Works without internet
✅ **Fast**: No API latency
✅ **Reliable**: No external dependencies
✅ **Versioned**: Git-controlled terminologies
✅ **Future-proof**: URIs work when domain acquired

### Lossless Reconstruction
✅ **Complete**: All clinical data + metadata preserved
✅ **Network lookup**: Bundle.identifier enables API retrieval
✅ **Offline resilient**: Full reconstruction without network
✅ **Civilian compatible**: Valid FHIR for hospital systems
✅ **OPSEC compliant**: No Author/Practitioner/unit identification
✅ **Reference integrity**: Resource IDs → fullUrl regeneration
✅ **Compact overhead**: ~200 bytes metadata + ~10 bytes per resource

### Use Cases Supported
✅ **Trauma care**: NFC card with contemporaneous treatment record
✅ **Illness pathway**: PHC → R1 → R2 → R3 → STRATEVAC progression
✅ **Network lookup**: Later retrieval via Bundle.identifier UUID
✅ **Offline handover**: Card works without network at rear facilities
✅ **Civilian ingestion**: Output FHIR digestible by hospital EMR
✅ **Medical-legal**: Preserved timestamps for documentation

---

**Status**: Architecture complete, protobuf schema updates defined
**Next**: Update nfc_payload.proto and regenerate JavaScript
**Overhead**: ~400 bytes total (acceptable for OPSEC + interoperability)
