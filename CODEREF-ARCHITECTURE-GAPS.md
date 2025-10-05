# CodeRef Architecture Gaps Analysis

## Problem Statement
Current CodeRef schema is **losing 27 of 53 FHIR resources** during round-trip conversion (49% data loss).

## Current Coverage

### ✅ Captured (26 resources)
- **Patient**: 1 (demographics, identifiers)
- **AllergyIntolerance**: 1 (via allergies array)
- **Observation (Vitals)**: 18 (via stage.vitals arrays)
- **Observation (Blood Group)**: 1 (via patient.blood_group)
- **Procedure/MedicationAdministration**: 5 (via stage.events arrays)

### ❌ Missing (27 resources)
- **Encounters**: 11 (care stage metadata, periods, locations)
- **Observation (MIST)**: 3 (clinical narrative assessments)
- **Observation (MARCH)**: 3 (TCCC assessment protocols)
- **Observation (Labs)**: 4 (laboratory results)
- **Condition**: 1 (diagnoses beyond care stage events)
- **ImagingStudy**: 2 (radiology reports)
- **MedicationStatement**: 1 (ongoing medications)
- **Organization**: 1 (authoring organization)
- **Composition metadata**: Partial (missing sections, authors)

## Resource Analysis

### 1. Encounters (11 resources) - CRITICAL LOSS
**Purpose**: Link observations/procedures to care episodes, track timing/location

**Example Data**:
```json
{
  "resourceType": "Encounter",
  "id": "enc-poi-phcill",
  "class": { "code": "EMER" },
  "type": [{ "coding": [{ "code": "poi" }] }],
  "period": {
    "start": "2025-10-02T05:10:00-04:00",
    "end": "2025-10-02T05:30:00-04:00"
  }
}
```

**Current CodeRef**: ❌ No encounter representation
**Impact**: Lost care episode boundaries, timing, locations

### 2. MIST Observations (3 resources) - HIGH VALUE
**Purpose**: Clinical narrative following MIST protocol (Mechanism, Injuries, Signs, Treatment)

**Example Data**:
```json
{
  "resourceType": "Observation",
  "id": "mist-POI-10",
  "code": { "coding": [{ "code": "mist-report" }] },
  "valueString": "M: No trauma. Flu-like prodrome, pleuritic chest pain. I: Coarse crackles RLL, febrile. S: HR 104, RR 24, BP 120/78, Temp 38.3°C, SpO2 94% RA. T: O2 via nasal cannula; rapid CASEVAC."
}
```

**Current CodeRef**: ❌ No text/narrative field
**Impact**: Lost critical clinical context

### 3. MARCH Observations (3 resources) - TCCC PROTOCOL
**Purpose**: Tactical Combat Casualty Care assessment (Massive hemorrhage, Airway, Respiration, Circulation, Hypothermia/Head injury)

**Example Data**:
```json
{
  "resourceType": "Observation",
  "id": "march-POI-10",
  "code": { "coding": [{ "code": "march-assessment" }] },
  "component": [
    { "code": { "coding": [{ "code": "massive-hemorrhage" }] }, "valueString": "None observed" },
    { "code": { "coding": [{ "code": "airway" }] }, "valueString": "Patent" },
    // ... more components
  ]
}
```

**Current CodeRef**: ❌ No component observations
**Impact**: Lost structured TCCC assessments

### 4. Laboratory Observations (4 resources)
**Purpose**: Lab results (WBC, CRP, Lactate, etc.)

**Example Data**:
```json
{
  "resourceType": "Observation",
  "id": "lab-6690-2-R1_PHC-40",
  "code": { "coding": [{ "system": "http://loinc.org", "code": "6690-2", "display": "WBC" }] },
  "valueQuantity": { "value": 16.2, "unit": "10*3/uL" },
  "category": [{ "coding": [{ "code": "laboratory" }] }]
}
```

**Current CodeRef**: Stored in `stage.vitals` but **category is lost**
**Impact**: Labs mixed with vitals, can't distinguish

### 5. ImagingStudy (2 resources)
**Example Data**:
```json
{
  "resourceType": "ImagingStudy",
  "id": "img-cxr",
  "description": "Chest X-ray: right lower lobe consolidation consistent with pneumonia.",
  "started": "2025-10-02T10:00:00-04:00"
}
```

**Current CodeRef**: ❌ No imaging representation
**Impact**: Lost diagnostic imaging reports

### 6. MedicationStatement (1 resource)
**Example**: Ongoing medications vs acute administrations

**Current CodeRef**: `stage.events` only captures **MedicationAdministration**
**Impact**: Lost chronic medication tracking

### 7. Condition (1 resource)
**Example**: "Community-acquired pneumonia with sepsis"

**Current CodeRef**: `stage.conditions` exists but **conversion doesn't populate it from Condition resources**
**Impact**: Diagnoses stored in encounters but not extracted

### 8. Organization (1 resource)
**Example**: "British Army Medical Services" (Composition author)

**Current CodeRef**: ❌ No organization field
**Impact**: Lost provenance metadata

## Architectural Solutions

### Option 1: **Extend Existing Structures** (Conservative)
**Add fields to current schema without breaking changes**

```protobuf
message Observation {
    CodeRef code = 1;
    double value = 2;
    string time = 3;
    string id = 4;

    // NEW: Support narrative and lab results
    string narrative = 5;           // For MIST valueString
    string category = 6;            // 'vital-signs', 'laboratory', 'survey'
    repeated Component components = 7; // For MARCH structured data
}

message Component {
    CodeRef code = 1;
    string valueString = 2;
}

message Stage {
    repeated Observation vitals = 1;
    repeated Observation labs = 2;           // NEW: Separate labs
    repeated Observation narratives = 3;     // NEW: MIST/MARCH
    repeated Condition conditions = 4;
    repeated Event events = 5;

    // NEW: Encounter metadata
    string encounter_id = 6;
    string encounter_start = 7;
    string encounter_end = 8;
}

message ImagingStudy {
    string id = 1;
    string description = 2;
    string started = 3;
    CodeRef modality = 4;
}

message NFCPayload {
    // ... existing fields ...
    repeated ImagingStudy imaging = 17;
    repeated MedicationStatement medications = 18;
    string organization_name = 19;
}
```

**Pros**:
- Minimal breaking changes
- Clear separation of concerns
- Fits existing mental model

**Cons**:
- Schema complexity increases
- More protobuf fields = larger payload

---

### Option 2: **Generic Extension Mechanism** (Flexible)
**Store unsupported resources as compressed JSON**

```protobuf
message ExtensionResource {
    string resource_type = 1;      // 'Encounter', 'ImagingStudy', etc.
    string id = 2;
    string json_blob = 3;          // Compressed JSON representation
    string care_stage = 4;         // Link to care stage
}

message NFCPayload {
    // ... existing fields ...
    repeated ExtensionResource extensions = 20;
}
```

**Pros**:
- Future-proof for any FHIR resource
- No schema changes needed for new types
- Clean fallback mechanism

**Cons**:
- Less compression (JSON vs protobuf)
- Harder to query/filter
- "Escape hatch" rather than proper design

---

### Option 3: **Hybrid Approach** (Recommended)
**Structured fields for common resources + extension for rare ones**

```protobuf
message Vital {
    CodeRef code = 1;
    double value = 2;
    string time = 3;
    string id = 4;
    string unit = 5;
}

message Lab {
    CodeRef code = 1;
    double value = 2;
    string time = 3;
    string id = 4;
    string unit = 5;
    string category = 6;           // Always 'laboratory'
}

message Narrative {
    CodeRef code = 1;
    string text = 2;               // MIST valueString or MARCH summary
    string time = 3;
    string id = 4;
    repeated Component components = 5; // For MARCH structured data
}

message Imaging {
    string id = 1;
    CodeRef modality = 2;          // CT, X-RAY, MRI
    string description = 3;
    string time = 4;
}

message Encounter {
    string id = 1;
    string start = 2;
    string end = 3;
    CodeRef class = 4;             // EMER, IMP, etc.
}

message Stage {
    repeated Vital vitals = 1;
    repeated Lab labs = 2;
    repeated Narrative narratives = 3;
    repeated Condition conditions = 4;
    repeated Event events = 5;
    Encounter encounter = 6;       // One encounter per stage
}

message NFCPayload {
    // ... existing fields ...
    repeated Imaging imaging = 17;
    repeated MedicationStatement medications = 18;
    string organization = 19;

    // Fallback for truly unsupported resources
    repeated ExtensionResource extensions = 20;
}
```

**Pros**:
- Optimal compression for common resources
- Structured querying for critical data
- Extensible for edge cases
- Clear semantic meaning

**Cons**:
- More protobuf messages to maintain
- Requires careful resource categorization

---

## Compression Impact Analysis

### Current Sizes
- Original FHIR: 62,790 bytes (53 resources)
- Current CodeRef: ~18,000 bytes (26 resources) - **49% data loss**

### Projected Sizes (Option 3 - Hybrid)
- Vitals (18): 18 × 50 bytes = 900 bytes
- Labs (4): 4 × 60 bytes = 240 bytes
- Narratives (6): 6 × 200 bytes = 1,200 bytes (MIST text)
- Encounters (11): 11 × 80 bytes = 880 bytes
- Imaging (2): 2 × 100 bytes = 200 bytes
- Conditions (1): 100 bytes
- Other metadata: 500 bytes

**Total: ~22,000 bytes protobuf (35% of original FHIR)**
**With gzip: ~9,000 bytes (14% of original)**

**Verdict**: Can achieve lossless with <50% size increase from current lossy state.

---

## Decision Matrix

| Criteria | Option 1: Extend | Option 2: Generic | Option 3: Hybrid | Winner |
|----------|------------------|-------------------|------------------|--------|
| Lossless | ✅ Yes | ✅ Yes | ✅ Yes | Tie |
| Compression | ⚠️ Good | ❌ Poor | ✅ Excellent | **Option 3** |
| Maintainability | ⚠️ Complex | ✅ Simple | ⚠️ Moderate | Option 2 |
| Queryability | ✅ Excellent | ❌ Poor | ✅ Excellent | **Option 3** |
| Future-proof | ❌ Limited | ✅ Excellent | ✅ Good | Option 2 |
| NFC Compatible | ✅ Yes | ⚠️ Borderline | ✅ Yes | **Option 3** |

## Recommendation

**Adopt Option 3 (Hybrid Approach)** with phased implementation:

### Phase 1: Critical Resources (This Sprint)
- Add `Lab` message and `stage.labs` arrays
- Add `Narrative` message and `stage.narratives` arrays
- Add `Encounter` message per stage
- Add `Imaging` message array to NFCPayload

### Phase 2: Enhanced Metadata (Next Sprint)
- Add `MedicationStatement` support
- Add `organization` field to NFCPayload
- Add `Component` support for MARCH observations

### Phase 3: Extension Mechanism (Future)
- Implement `ExtensionResource` for truly edge-case resources
- Document extension usage patterns

---

## Next Steps

1. **Update protobuf schema** with Phase 1 messages
2. **Modify FHIR→CodeRef converter** to extract all resource types
3. **Modify CodeRef→FHIR converter** to reconstruct all resources
4. **Run validation tests** to confirm 100% parity
5. **Measure compression ratios** to ensure NFC compatibility

---

**Generated**: 2025-10-05
**Status**: Architectural decision needed before implementation
