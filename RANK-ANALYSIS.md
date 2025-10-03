# Military Rank Analysis & Recommendation

**Date**: 2025-10-03
**Issue**: How to handle military rank in FHIR → CodeRef → FHIR pipeline

## Current Situation

### FHIR (ips-fhir-json-1.json)

**Option 1: NATO STANAG 2116** (before update):
```json
{
  "url": "https://fhir.nato.int/StructureDefinition/military-rank",
  "valueCodeableConcept": {
    "coding": [{
      "system": "https://nato.int/CodeSystem/stanag-2116",
      "code": "OR1",
      "display": "Private (OR-1)"
    }],
    "text": "Drummer"
  }
}
```

**Option 2: HL7 v2 Table 0141** (after update):
```json
{
  "url": "https://fhir.nato.int/StructureDefinition/military-rank",
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v2-0141",
      "code": "E1",
      "display": "Enlisted 1"
    }],
    "text": "Drummer"
  }
}
```

### CodeRef (Current)

**Protobuf Schema** (nfc_payload.proto:58-68):
```protobuf
message Patient {
  string given = 1;
  string family = 2;
  CodeRef gender = 3;
  CodeRef blood_group = 4;
  CodeRef nhs_id = 5;
  CodeRef service_id = 6;
  string dob = 7;
  string rank = 8;        // ← Plain text only!
  string title = 9;
  string nationality = 10;
}
```

**Current Extraction** (script.js:2786-2790):
- Rank extracted from `name.prefix[1]` as plain text
- Extension coding **NOT extracted**
- Only stores: `rank: "Drummer"`

### Problem

**Round-trip loss**:
1. FHIR has: `E1` code + "Enlisted 1" display + "Drummer" text
2. CodeRef stores: `"Drummer"` (text only)
3. FHIR reconstructed: Only "Drummer" in name.prefix, no extension/coding!

## Analysis

### Terminology Systems Compared

| System | Example Code | Display | Specificity | Use Case |
|--------|--------------|---------|-------------|----------|
| **NATO STANAG 2116** | OR1 | Private (OR-1) | High | NATO military context |
| **HL7 v2 Table 0141** | E1 | Enlisted 1 | Low (generic) | International/generic |
| **UK Specific** | - | Drummer | Highest | Actual appointment |

### Trade-offs

**NATO STANAG 2116**:
- ✅ Military-specific
- ✅ More descriptive ("Private OR-1")
- ❌ Unverified URI (no public docs)
- ❌ Limited to NATO context

**HL7 v2 Table 0141**:
- ✅ Standard HL7 terminology
- ✅ Verified/official
- ❌ Generic (E1-E9, no country specifics)
- ❌ Loses UK context

**Text-only ("Drummer")**:
- ✅ Most specific
- ✅ UK-specific appointment
- ❌ No coded value
- ❌ Hard to query/aggregate

## Recommendations

### ✅ Option A: Enhanced CodeRef with Dual Support (RECOMMENDED)

**Update protobuf schema**:
```protobuf
message Patient {
  string given = 1;
  string family = 2;
  CodeRef gender = 3;
  CodeRef blood_group = 4;
  CodeRef nhs_id = 5;
  CodeRef service_id = 6;
  string dob = 7;
  CodeRef rank = 8;        // ← Changed to CodeRef!
  string title = 9;
  string nationality = 10;
}
```

**CodeRef rank value**:
```javascript
{
  sys: 'hl7-rank',     // or 'stanag' for NATO
  code: 'E1',          // coded value
  text: 'Drummer'      // specific text (optional)
}
```

**Pros**:
- ✅ Lossless round-trip
- ✅ Supports both coded + text
- ✅ Queryable by grade
- ✅ Preserves specificity

**Cons**:
- ❌ Requires protobuf schema change
- ❌ More complex encoding

---

### Option B: Text-only with Convention

**Keep current schema**, but document convention:
```javascript
{
  rank: "E1|Drummer"  // Format: "code|text"
}
```

**Reconstruction**:
```javascript
const [code, text] = rank.split('|');
// Rebuild extension with code + text
```

**Pros**:
- ✅ No schema change
- ✅ Lossless round-trip
- ✅ Compact

**Cons**:
- ❌ Hacky (relies on string parsing)
- ❌ Fragile (what if text contains |?)

---

### Option C: Text-only (Current)

**Keep rank as plain text**:
```javascript
{
  rank: "Drummer"
}
```

**Pros**:
- ✅ Simple
- ✅ Human-readable
- ✅ No schema change

**Cons**:
- ❌ Lossy (code lost)
- ❌ Can't reconstruct extension
- ❌ Not queryable by grade

---

### Option D: Dual Coding in FHIR

**Use both NATO and HL7 codings**:
```json
{
  "url": "https://fhir.nato.int/StructureDefinition/military-rank",
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "https://nato.int/CodeSystem/stanag-2116",
        "code": "OR1",
        "display": "Private (OR-1)"
      },
      {
        "system": "http://terminology.hl7.org/CodeSystem/v2-0141",
        "code": "E1",
        "display": "Enlisted 1"
      }
    ],
    "text": "Drummer"
  }
}
```

**CodeRef extracts**:
```javascript
{
  rank: {
    sys: 'hl7-rank',
    code: 'E1',
    text: 'Drummer'
  }
}
```

**Pros**:
- ✅ Both systems available in FHIR
- ✅ Can choose preferred for CodeRef
- ✅ Interoperability

**Cons**:
- ❌ Verbose in FHIR
- ❌ Still requires schema change for CodeRef

## Questions for Decision

1. **Is lossless reconstruction required?**
   - If YES → Option A or D
   - If NO → Option C (text-only)

2. **Which terminology system to prefer?**
   - NATO STANAG 2116 (military-specific)
   - HL7 v2 Table 0141 (generic/interoperable)
   - Both (dual coding)

3. **Can we change protobuf schema?**
   - If YES → Option A (rank as CodeRef)
   - If NO → Option B (convention) or Option C (text-only)

4. **What's the use case for rank?**
   - Display only → Text is fine
   - Querying by grade → Need coded value
   - Interoperability → Need standard coding

## Proposed Solution

**Recommendation**: **Option D (Dual Coding) + Option A (CodeRef enhancement)**

**FHIR**:
```json
{
  "url": "https://fhir.nato.int/StructureDefinition/military-rank",
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v2-0141",
        "code": "E1",
        "display": "Enlisted 1"
      }
    ],
    "text": "Drummer"
  }
}
```

**CodeRef** (enhanced):
```javascript
{
  rank: {
    sys: 'hl7-rank',     // Maps to v2-0141
    code: 'E1',
    // text stored in name.prefix for now
  }
}
```

**Reconstruction**:
- Extract CodeRef.rank → HL7 coding
- Extract name.prefix[1] → text field
- Rebuild extension with both

**Next Steps**:
1. Update protobuf schema to make rank a CodeRef
2. Update converter to extract rank extension
3. Update reconstruction to rebuild extension
4. Test round-trip

---

**Status**: Analysis complete, awaiting decision on approach
