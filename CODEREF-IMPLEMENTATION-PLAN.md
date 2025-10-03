# CodeRef Architecture Implementation Plan

**Date**: 2025-10-03
**Based on**: IPS-OPCP-SPECIFICATION.md + CODEREF-PIPELINE-SPEC.md

## Architecture Assessment

### Current State (What We Have)
✅ **Preset #1 YAML Source** - Complete with verified SNOMED codes
✅ **IPS-OPCP Spec** - Defined architecture with Encounter.type approach
✅ **SNOMED Validation** - All codes verified and documented
✅ **Old CodeRef System** - Extension-based (Preset #0 style)

### Target State (What We Need)
🎯 **New CodeRef Architecture**:
- YAML source → IPS FHIR JSON → CodeRef → Protobuf → Base64
- Encounter.type for care stages (not extensions)
- Composition sections for organization
- Prefix-based compact format (sct:, loinc:, nhs:, mil:)

## Key Architectural Decisions

### 1. IPS FHIR JSON as Canonical Source ✅
**Decision**: Use IPS-compliant FHIR JSON as canonical source format
**Why**:
- Standards-compliant (valid IPS Bundle)
- Direct input to CodeRef conversion pipeline
- No intermediate conversion needed
- Production-ready format

**YAML Role**: Development tool ONLY for easier content creation during initial authoring
- ✏️ Content creation aid (easier than editing JSON)
- 🔍 SNOMED code validation input
- 🏗️ Can be used to build IPS FHIR JSON
- ❌ NOT part of production pipeline
- ❌ NOT transmitted via NFC

### 2. Care Stage Representation ✅
**Decision**: Encounter.type with custom CodeSystem
**Why**:
- Standard FHIR field (not extensions)
- IPS-compliant
- Clinical resources link via encounter.reference

### 3. Conversion Pipeline
```
IPS FHIR JSON Bundle (canonical source)
    ↓
[FHIR → CodeRef Converter] ← TO BUILD
    ↓
Ultra-Compact CodeRef
    ↓
[Existing] Protobuf Encoder
    ↓
Base64 Fragment for NFC

Optional Development Flow:
YAML Source (preset-X-source.yaml)
    ↓
[YAML → IPS FHIR Builder] ← TO BUILD (optional development tool)
    ↓
IPS FHIR JSON Bundle → main pipeline above
```

## Implementation Strategy

### Phase 1: IPS FHIR → CodeRef Converter (CORE PIPELINE)
**Priority**: HIGHEST
**Complexity**: MEDIUM

#### Components to Build:

1. **FHIR → CodeRef Converter** (`converters/fhir-to-coderef.js`)
   - Parse IPS Bundle
   - Extract Encounter.type for care stages
   - Convert to ultra-compact format
   - Apply prefix rules (sct:, loinc:, nhs:, mil:)

2. **Care Stage Mapper** (`converters/care-stage-mapper.js`)
   - Map Encounter.type.coding to care stage keys
   - Handle both approaches:
     - Encounter.type (new - Presets #1-3)
     - Extension (old - Preset #0)

#### Input/Output:
```javascript
// Input: IPS FHIR Bundle with Encounter.type
// Output: Ultra-compact CodeRef
```

### Phase 2: CodeRef → IPS FHIR Reconstruction
**Priority**: HIGH
**Complexity**: MEDIUM

#### Components to Update:

1. **CodeRef → FHIR Converter** (`converters/coderef-to-fhir.js`)
   - Reconstruct Encounter resources with type.coding
   - Build Composition sections from care stage groups
   - Link clinical resources to encounters

2. **Prefix Expander** (`converters/prefix-expander.js`)
   - Expand sct: → http://snomed.info/sct
   - Expand loinc: → http://loinc.org
   - Add display text from lookup tables

### Phase 3: YAML Development Tool (OPTIONAL)
**Priority**: LOW
**Complexity**: MEDIUM
**Status**: Only if needed for content creation

#### Components to Build (if needed):

1. **YAML Parser Module** (`builders/yaml-parser.js`)
   - Parse preset-X-source.yaml
   - Calculate absolute timestamps from relative offsets
   - Build resource ID map (UUIDs)

2. **FHIR Bundle Builder** (`builders/fhir-bundle-builder.js`)
   - Create IPS Bundle structure
   - Generate Composition with sections
   - Build Patient resource with extensions

3. **Encounter Generator** (`builders/encounter-builder.js`)
   - Create Encounter resources with type.coding
   - Set care stage from custom CodeSystem
   - Calculate period.start/end from baseTime + duration

4. **Clinical Resource Builders**:
   - `builders/observation-builder.js` - Vitals, labs
   - `builders/medication-builder.js` - MedicationStatement, MedicationAdministration
   - `builders/condition-builder.js` - Conditions/diagnoses
   - `builders/procedure-builder.js` - Procedures
   - `builders/allergy-builder.js` - AllergyIntolerance

5. **Composition Builder** (`builders/composition-builder.js`)
   - Standard IPS sections (demographics, allergies, medications)
   - OPCP Care Pathway parent section
   - Nested care stage subsections
   - Section codes from custom CodeSystem

#### Input/Output:
```javascript
// Input: preset-X-source.yaml (development only)
// Output: ips-fhir-json-X-NEW.json (IPS-compliant with Encounter.type)
// Then: Feed into Phase 1 pipeline (FHIR → CodeRef)
```

## File Structure

```
/builders/
  yaml-parser.js              # Parse YAML with relative timestamps
  fhir-bundle-builder.js      # Main IPS Bundle orchestrator
  encounter-builder.js        # Create Encounter with type.coding
  composition-builder.js      # Build Composition with sections
  observation-builder.js      # Observations (vitals, labs)
  medication-builder.js       # Medications
  condition-builder.js        # Conditions
  procedure-builder.js        # Procedures
  allergy-builder.js         # Allergies

/converters/
  fhir-to-coderef.js         # IPS FHIR → Ultra-compact CodeRef
  coderef-to-fhir.js         # CodeRef → IPS FHIR (reconstruct)
  care-stage-mapper.js       # Map Encounter.type ↔ care stage codes
  prefix-expander.js         # Expand prefixes to full URIs

/lookups/
  snomed-lookup-table.json   # ✅ Already created
  loinc-lookup-table.json    # To create
  care-stage-codes.json      # OPCP CodeSystem definitions

/scripts/
  build-ips-from-yaml.js     # CLI: YAML → IPS FHIR
  validate-ips-bundle.js     # Validate IPS compliance
  test-pipeline.js           # End-to-end pipeline test
```

## Implementation Order

### Step 1: Core Infrastructure ✅ COMPLETED
1. ✅ YAML source created (preset-1-source.yaml) - for validation reference
2. ✅ SNOMED codes validated
3. ✅ IPS FHIR JSON files exist (ips-fhir-json-0.json, ips-fhir-json-1.json)

### Step 2: FHIR → CodeRef Converter (PRIORITY)
1. 🔨 FHIR Bundle parser
2. 🔨 Care stage mapper (Encounter.type → stage keys)
3. 🔨 Prefix compactor (full URIs → prefixes)
4. 🔨 Ultra-compact CodeRef generator

### Step 3: CodeRef → FHIR Reconstructor
1. 🔨 Prefix expander (prefixes → full URIs)
2. 🔨 Encounter reconstructor with type.coding
3. 🔨 Composition regenerator with sections
4. 🔨 Resource linker (encounter.reference)

### Step 4: Testing & Validation
1. 🔨 End-to-end pipeline test
2. 🔨 IPS validation
3. 🔨 Round-trip testing (FHIR → CodeRef → FHIR)
4. 🔨 NFC fragment size validation (<2000 chars)

### Step 5: YAML Development Tool (OPTIONAL - if needed)
1. 🔨 Timestamp calculator (relative → absolute)
2. 🔨 UUID generator for resources
3. 🔨 Encounter generator with type.coding
4. 🔨 Resource builders (Observation, Medication, etc.)
5. 🔨 Bundle orchestrator

## Critical Design Patterns

### 1. Timestamp Calculation
```javascript
function calculateTimestamps(yamlData) {
  const seedTime = new Date(yamlData.seedTime);
  let currentEncounterEnd = seedTime;

  for (const [stageKey, stageData] of Object.entries(yamlData.careStages)) {
    // baseTime is offset from previous encounter's end
    const baseTime = addMinutes(currentEncounterEnd, parseOffset(stageData.Encounter.baseTime));
    const duration = parseOffset(stageData.Encounter.duration);
    const encounterEnd = addMinutes(baseTime, duration);

    // Clinical events are offset from their encounter's baseTime
    for (const observation of stageData.Observation || []) {
      observation.absoluteTime = addMinutes(baseTime, parseOffset(observation.effectiveDateTime));
    }

    currentEncounterEnd = encounterEnd;
  }
}
```

### 2. Encounter with type.coding
```javascript
function createEncounter(stageKey, stageData, baseTime, duration) {
  return {
    resourceType: "Encounter",
    id: `encounter-${stageKey}`,
    status: "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: getEncounterClass(stageKey) // AMB, EMER, IMP
    },
    type: [{
      coding: [{
        system: "http://medis.org.uk/fhir/CodeSystem/opcp-care-stages",
        code: stageKey,
        display: getCareStageDisplay(stageKey)
      }]
    }],
    period: {
      start: baseTime.toISOString(),
      end: addMinutes(baseTime, duration).toISOString()
    },
    subject: { reference: `urn:uuid:patient-${id}` }
  };
}
```

### 3. Composition Sections
```javascript
function buildCompositionSections(encounters, resources) {
  return [
    // Standard IPS sections
    { title: "Patient Demographics", code: { coding: [{ system: "http://loinc.org", code: "45970-1" }] }, entry: [...] },
    { title: "Allergies", code: { coding: [{ system: "http://loinc.org", code: "48765-2" }] }, entry: [...] },
    { title: "Medications", code: { coding: [{ system: "http://loinc.org", code: "10160-0" }] }, entry: [...] },

    // OPCP Care Pathway parent section
    {
      title: "Operational Care Pathway",
      code: { coding: [{ system: "http://medis.org.uk/fhir/CodeSystem/opcp-sections", code: "care-pathway" }] },
      section: encounters.map(enc => ({
        title: enc.type[0].coding[0].display,
        code: { coding: [{ system: "http://medis.org.uk/fhir/CodeSystem/opcp-sections", code: `${enc.type[0].coding[0].code}-section` }] },
        entry: [
          { reference: `urn:uuid:${enc.id}` },
          ...getResourcesForEncounter(resources, enc.id)
        ]
      }))
    }
  ];
}
```

## Testing Strategy

### Unit Tests
- ✅ SNOMED code validation
- 🔨 Timestamp calculation
- 🔨 Encounter generation
- 🔨 Resource builders
- 🔨 Prefix expansion/compaction

### Integration Tests
- 🔨 YAML → FHIR conversion
- 🔨 FHIR → CodeRef conversion
- 🔨 CodeRef → FHIR reconstruction
- 🔨 Round-trip validation

### Validation Tests
- 🔨 IPS profile compliance
- 🔨 FHIR R4 validation
- 🔨 NFC size constraints (<2000 chars)
- 🔨 Clinical accuracy (compare with source)

## Success Criteria

✅ **Phase 1 Complete When** (FHIR → CodeRef):
- IPS FHIR → CodeRef conversion working
- Ultra-compact format achieved
- Prefix notation correct (sct:, loinc:, nhs:, mil:)
- Encounter.type extracted correctly

✅ **Phase 2 Complete When** (CodeRef → FHIR):
- CodeRef → IPS FHIR reconstruction working
- Round-trip validation passes (FHIR → CodeRef → FHIR)
- NFC fragment size <2000 chars
- All clinical data preserved

✅ **Phase 3 Complete When** (YAML Tool - if built):
- YAML → IPS FHIR JSON conversion working
- All resources have correct Encounter.type
- Composition has proper section structure
- IPS profile validation passes

## Next Immediate Steps

1. **Create converters/ directory** with initial modules
2. **Build FHIR → CodeRef converter** - Core to new architecture
3. **Build Care stage mapper** - Extract Encounter.type
4. **Build Prefix compactor** - Ultra-compact format
5. **Test with Preset #1 IPS FHIR** - Validate approach
6. **Build CodeRef → FHIR reconstructor** - Round-trip validation
7. **OPTIONAL: Build YAML tool** - Only if needed for content creation

## Open Questions

1. ❓ **LOINC lookup table** - Do we need display text validation like SNOMED?
2. ❓ **Section code validation** - Should we validate custom CodeSystem codes?
3. ❓ **Error handling** - How to handle invalid YAML structure?
4. ❓ **Protobuf schema** - Does it need updating for Encounter.type?

## References

- IPS-OPCP-SPECIFICATION.md - Architecture decisions
- CODEREF-PIPELINE-SPEC.md - CodeRef format spec
- preset-1-source.yaml - Example YAML source
- SNOMED-VERIFICATION.md - Code validation approach
