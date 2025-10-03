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

## CodeRef System Codes

### Updated System Mappings

| CodeRef sys | Full System URI | Use Case |
|-------------|-----------------|----------|
| `sct` | `http://snomed.info/sct` | SNOMED CT codes |
| `loinc` | `http://loinc.org` | LOINC codes |
| `nhs` | `https://fhir.nhs.uk/Id/nhs-number` | NHS number |
| `mil` | Custom service ID system | Military service number |
| `stanag` | `http://medis.org.uk/CodeSystem/NATO/STANAG/2116/APERSP-01/ranks` | NATO ranks |
| `hl7-rank` | `http://terminology.hl7.org/CodeSystem/v2-0141` | HL7 generic ranks |
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

### 3. **Display Text Resolution**

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

### 4. **Reconstruction Algorithm**

```javascript
function reconstructRankExtension(codeRefRank) {
  // CodeRef has: { sys: 'stanag', code: 'OR-1', text: 'Drummer' }

  const extension = {
    url: 'https://fhir.nato.int/StructureDefinition/military-rank',
    valueCodeableConcept: {
      coding: [],
      text: codeRefRank.text
    }
  };

  // Add primary STANAG coding
  if (codeRefRank.sys === 'stanag') {
    extension.valueCodeableConcept.coding.push({
      system: expandSystem('stanag'),
      code: codeRefRank.code,
      display: await lookupDisplay(expandSystem('stanag'), codeRefRank.code)
    });

    // Map to HL7 generic rank
    const hl7Code = mapStanagToHL7(codeRefRank.code);
    extension.valueCodeableConcept.coding.push({
      system: expandSystem('hl7-rank'),
      code: hl7Code,
      display: await lookupDisplay(expandSystem('hl7-rank'), hl7Code)
    });
  }

  return extension;
}
```

---

## Updated Protobuf Schema

### Patient Message (Enhanced)

```protobuf
message Patient {
  string given = 1;
  string family = 2;
  CodeRef gender = 3;
  CodeRef blood_group = 4;
  CodeRef nhs_id = 5;
  CodeRef service_id = 6;
  string dob = 7;
  CodeRef rank = 8;            // ← Changed from string to CodeRef
  string title = 9;
  string nationality = 10;
}
```

### CodeRef Message (with text support)

**Current**:
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

**Enhanced** (add text field):
```protobuf
message CodeRef {
  oneof system_reference {
    string sys = 1;
    SystemType system_id = 9;
  }
  string code = 2;
  string text = 13;            // ← ADD: For specific text like "Drummer"
  ClinicalStatus clinical_status = 10;
  VerificationStatus verification_status = 11;
  ObservationCategory category = 12;
}
```

---

## Implementation Checklist

### Phase 1: CodeSystem Setup
- [x] Create `/CodeSystem/` directory structure
- [x] Create `NATO/STANAG/2116/APERSP-01/ranks.json`
- [x] Create `FHIR/OPCP/care-stages.json`
- [ ] Create mapping files (stanag-to-hl7, etc.)
- [ ] Add SNOMED lookup table
- [ ] Configure web server to serve CodeSystem files

### Phase 2: Protobuf Updates
- [ ] Add `text` field to CodeRef message
- [ ] Change Patient.rank from string to CodeRef
- [ ] Update SystemType enum with stanag/opcp
- [ ] Regenerate protobuf JavaScript

### Phase 3: Converter Updates
- [ ] Update FHIR → CodeRef to extract multi-coded extensions
- [ ] Store primary code (most specific) in CodeRef
- [ ] Update CodeRef → FHIR to rebuild multi-coded extensions
- [ ] Implement lookup functions for displays
- [ ] Implement mapping functions (stanag→hl7, etc.)

### Phase 4: Testing
- [ ] Test rank: STANAG + HL7 dual coding
- [ ] Test care stages: OPCP codes
- [ ] Test round-trip: FHIR → CodeRef → FHIR
- [ ] Verify all codings preserved
- [ ] Test offline (no external APIs)

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
✅ **Complete**: All FHIR data preserved
✅ **Compact**: CodeRef stores primary only
✅ **Expandable**: Secondary codings from lookups
✅ **Accurate**: Display text from CodeSystems

---

**Status**: Architecture defined, awaiting implementation
**Next**: Update protobuf schema, implement converters
