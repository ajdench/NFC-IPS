# IPS-OPCP Specification v1.0

**Status**: Draft - In Development
**Last Updated**: 2025-10-03
**Purpose**: Define the FHIR IPS Bundle structure with OPCP (Operational Care Pathway) care stage extensions

---

## 1. Overview

This specification defines an **IPS-compliant FHIR Bundle with custom sections** for representing military/pre-hospital operational care pathways.

**Positioning**:
- ✅ **Fully valid IPS Bundle** (conforms to `http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips`)
- ✅ **Custom sections allowed** - IPS standard permits additional sections beyond required ones
- 🔮 **Future**: May become formal "IPS-OPCP Profile" extension

---

## 2. Core Principles

### 2.1 Clinical Content
- **Everything preserved** - All clinical data from source systems included
- **Non-verbose FHIR** - Minimal necessary FHIR elements; strip meta, narratives, redundant codings
- **Standards-compliant** - Valid FHIR R4, valid IPS structure

### 2.2 Care Stage Representation
**Decision**: Use **Encounter.type** with custom CodeSystem (most FHIR-compliant)

```json
{
  "resourceType": "Encounter",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "EMER"
  },
  "type": [{
    "coding": [{
      "system": "http://medis.org.uk/fhir/CodeSystem/opcp-care-stages",
      "code": "poi",
      "display": "Point of Injury"
    }],
    "text": "Point of Injury"
  }],
  "period": {
    "start": "2025-10-02T05:00:00-04:00",
    "end": "2025-10-02T05:25:00-04:00"
  },
  "subject": {"reference": "urn:uuid:patient-id"}
}
```

**Rationale**:
- Uses standard FHIR field (`Encounter.type`) not extensions
- Allows custom CodeSystem for OPCP care stages
- Period tracks timeline of care episode
- Clinical resources link via `encounter.reference`

---

## 3. Bundle Structure

### 3.1 Standard IPS Sections (Required)

1. **Demographics & Identifiers** - LOINC `45970-1`
   - Patient resource
   - Blood group Observation (stable demographic)

2. **Allergies** - LOINC `48765-2`
   - AllergyIntolerance resources

3. **Medications (Maintenance)** - LOINC `10160-0`
   - MedicationStatement resources (chronic/ongoing medications)
   - Example: Daily cetirizine for allergies

### 3.2 OPCP Care Stage Sections (Custom)

**Structure**: Grouped under parent "Operational Care Pathway" section with nested subsections

```json
{
  "title": "Operational Care Pathway",
  "code": {
    "coding": [{
      "system": "http://medis.org.uk/fhir/CodeSystem/opcp-sections",
      "code": "care-pathway",
      "display": "Operational Care Pathway"
    }]
  },
  "section": [
    {
      "title": "Point of Injury (POI)",
      "code": {
        "coding": [{
          "system": "http://medis.org.uk/fhir/CodeSystem/opcp-sections",
          "code": "poi-section"
        }]
      },
      "entry": [...]
    },
    {
      "title": "Role 1 PHC",
      "code": {
        "coding": [{
          "system": "http://medis.org.uk/fhir/CodeSystem/opcp-sections",
          "code": "r1-phc-section"
        }]
      },
      "entry": [...]
    }
  ]
}
```

**Care stage subsections** (in chronological order):

| Title | Code | Description |
|-------|------|-------------|
| Point of Injury (POI) | `poi-section` | Initial point of wounding/injury |
| Casualty Evacuation (CASEVAC) | `casevac-section` | Evacuation from point of injury |
| Ambulance Exchange Point (AXP) | `axp-section` | Transfer point |
| Medical Evacuation (MEDEVAC) | `medevac-section` | Medical evacuation |
| Role 1 PHEC | `r1-phec-section` | Pre-Hospital Emergency Care |
| Role 1 PHC | `r1-phc-section` | Primary Healthcare |
| Forward TACEVAC | `fwd-tacevac-section` | Forward tactical evacuation |
| Role 2 | `r2-section` | Deployed Hospital Care |
| Rear TACEVAC | `rear-tacevac-section` | Rear tactical evacuation |
| Role 3 | `r3-section` | Deployed Hospital Care |
| STRATEVAC | `stratevac-section` | Strategic evacuation |

**Each care stage subsection contains**:
- One Encounter resource (with care stage in `type.coding`)
- Clinical resources that occurred during that Encounter:
  - Observations (vitals, labs)
  - Procedures
  - MedicationAdministration (event-based, not maintenance)
  - DiagnosticReports
  - ImagingStudy
  - Conditions (if diagnosed during this stage)

---

## 4. Resource Linking

### 4.1 Clinical Resources → Care Stage
Clinical resources link to their care stage via `encounter.reference`:

```json
{
  "resourceType": "Observation",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "8867-4",
      "display": "Heart rate"
    }]
  },
  "valueQuantity": {"value": 104, "unit": "/min"},
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": {"reference": "urn:uuid:encounter-poi"},
  "subject": {"reference": "urn:uuid:patient-id"}
}
```

### 4.2 Composition → Resources
Composition sections contain references to resources:

```json
{
  "title": "Point of Injury (POI)",
  "entry": [
    {"reference": "urn:uuid:encounter-poi"},
    {"reference": "urn:uuid:obs-hr-poi"},
    {"reference": "urn:uuid:obs-temp-poi"},
    {"reference": "urn:uuid:procedure-wound-dressing"}
  ]
}
```

---

## 5. OPCP Care Stage CodeSystem

**System URI**: `http://medis.org.uk/fhir/CodeSystem/opcp-care-stages`

| Code | Display | Encounter.class |
|------|---------|-----------------|
| `poi` | Point of Injury | AMB |
| `casevac` | Casualty Evacuation | EMER |
| `axp` | Ambulance Exchange Point | AMB |
| `medevac` | Medical Evacuation | EMER |
| `r1_phec` | Role 1 PHEC | EMER |
| `r1_phc` | Role 1 PHC | AMB |
| `fwd_tacevac` | Forward TACEVAC | EMER |
| `r2_dhc` | Role 2 | IMP |
| `rear_tacevac` | Rear TACEVAC | EMER |
| `r3_dhc` | Role 3 | IMP |
| `stratevac` | STRATEVAC | EMER |

---

## 6. Source Data Format

### 6.1 Primary Format: IPS FHIR JSON

**Clinical data is authored/maintained in IPS-compliant FHIR JSON format** as the canonical source.

**Structure**:
- Full FHIR R4 IPS Bundle
- Standard IPS sections (Demographics, Allergies, Medications)
- Custom OPCP sections (nested care stage subsections)
- Encounter resources with type.coding for care stages
- Clinical resources linked via encounter.reference

### 6.2 Development Tool: YAML (Temporary)

**YAML format used ONLY during development** for easier content creation and validation.

**Chained relative timestamps** for easy timeline maintenance:
- **seedTime**: Global start time for the entire care pathway
- **Encounter baseTime**: Offset from previous encounter's end (creates contiguous timeline)
- **Clinical events**: Offset from their encounter's baseTime

**YAML serves as**:
1. ✏️ Content creation tool (easier than editing JSON)
2. 🔍 SNOMED code validation input
3. 🏗️ Input for IPS FHIR JSON builder

**YAML is NOT**:
- ❌ Part of final architecture
- ❌ Used in production pipeline
- ❌ Transmitted via NFC

```yaml
seedTime: 2025-10-02T05:00:00-04:00

patient:
  name: Thomas Hodge
  dob: 1998-03-15
  identifiers:
    nhs: "9434765919"
    mil: "A1234567"
  extensions:
    blood_group: {system: sct, code: "112144000"}  # O positive

allergies:
  AllergyIntolerance:
    - code: {system: sct, code: "300913006"}  # Shellfish allergy

medications_maintenance:
  MedicationStatement:
    - medicationCodeableConcept: {system: sct, code: "372729009"}  # Cetirizine 10mg daily

poi:
  Encounter:
    baseTime: +0min  # from seedTime = 05:00:00
    duration: 25min  # period.end = 05:25:00
  Observation:
    - code: {system: loinc, code: "8867-4"}
      valueQuantity: {value: 104, unit: "/min"}
      effectiveDateTime: +10min  # from POI baseTime = 05:10:00
    - code: {system: loinc, code: "9279-1"}
      valueQuantity: {value: 24, unit: "/min"}
      effectiveDateTime: +10min  # 05:10:00
  Condition:
    - code: {system: sct, code: "233604007"}  # Pneumonia
      onsetDateTime: +0min  # 05:00:00

casevac:
  Encounter:
    baseTime: +5min  # from end of POI (05:25) = 05:30:00
    duration: 15min  # period.end = 05:45:00
  Observation:
    - code: {system: loinc, code: "8867-4"}
      valueQuantity: {value: 98, unit: "/min"}
      effectiveDateTime: +5min  # from CASEVAC baseTime = 05:35:00

r1_phc:
  Encounter:
    baseTime: +10min  # from end of CASEVAC (05:45) = 05:55:00
    duration: 120min  # period.end = 07:55:00
  Observation:
    - code: {system: loinc, code: "8867-4"}
      valueQuantity: {value: 122, unit: "/min"}
      effectiveDateTime: +40min  # from R1 PHC baseTime = 06:35:00
  MedicationAdministration:
    - medicationCodeableConcept: {system: sct, code: "387713003"}
      dosage:
        dose: {value: 1000, unit: "mg"}
        route: {system: sct, code: "47625008", display: "Intravenous route"}
      effectiveDateTime: +45min  # 06:40:00
```

**This YAML format will serve as**:
1. Source of truth for clinical content
2. CodeRef format for NFC transmission
3. Input for generating IPS FHIR JSON

---

## 7. Conversion Pipeline

```
YAML Source
    ↓
IPS FHIR JSON Builder
    ↓
Standard IPS Bundle with OPCP sections
    ↓
CodeRef Converter (YAML passthrough)
    ↓
Protobuf Encoder
    ↓
Compressed Base64 Fragment
```

**Note**: CodeRef format = YAML source format (no conversion needed for encode path)

---

## 8. Design Decisions Log

### Decision 1: Encounter.type vs Extension
- **Chosen**: Encounter.type with custom CodeSystem
- **Rationale**: Uses standard FHIR field; most compliant approach
- **Alternative considered**: care-stage extension (Preset #0 approach)
- **Date**: 2025-10-03

### Decision 2: IPS Positioning
- **Chosen**: IPS-compliant with custom sections
- **Rationale**: Allows future profiling; maintains IPS validity
- **Future**: May formalize as "IPS-OPCP Profile"
- **Date**: 2025-10-03

### Decision 3: Composition Section Structure
- **Chosen**: Grouped structure - Standard IPS sections + nested OPCP sections
- **Rationale**: Clear separation between IPS-standard and OPCP-custom content
- **Structure**: Parent "Operational Care Pathway" section contains care stage subsections
- **Date**: 2025-10-03

### Decision 4: Section Codes
- **Chosen**: Codes for all sections (LOINC for standard, custom CodeSystem for OPCP)
- **Rationale**: Machine-readable, robust for CodeRef conversion, language-independent
- **CodeSystem**: `http://medis.org.uk/fhir/CodeSystem/opcp-sections`
- **Date**: 2025-10-03

### Decision 5: Source Data Format
- **Chosen**: YAML with full FHIR resource hints
- **Rationale**: Explicit structure for correct FHIR reconstruction; intermediary help file
- **Structure**: Mirrors FHIR fields (code, valueQuantity, effectiveDateTime, etc.)
- **Date**: 2025-10-03

### Decision 6: Timing Architecture
- **Chosen**: Chained relative timestamps (cascading from seedTime)
- **Rationale**: Easy to maintain contiguous timelines; adjust one seedTime to shift entire pathway
- **Structure**: seedTime (global) → encounter baseTime (offset from previous end) → events (offset from encounter)
- **Date**: 2025-10-03

---

## 9. SNOMED CT Code Validation

**Status**: ✅ **COMPLETE** (2025-10-03)

### Validation Results
- **All 11 codes verified** via Snowstorm training API
- **5 incorrect codes corrected** with international SNOMED CT equivalents
- **Working API**: `https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/`

### Key Corrections Made
- `776274009 → 346628003` (Piperacillin/tazobactam - was fragrance!)
- `42016111000001102 → 777029003` (Oxygen - UK→international edition)
- `386980009 → 45555007` (Norepinephrine - was Fever!)
- `432294006 → 387390002` (Sodium chloride - was Central sleep apnea!)
- `71796008 → 233527006` (CVC insertion - was device not procedure)

### Tools Created
- `validate-snomed-snowstorm.cjs` - Validator using Snowstorm API
- `snomed-lookup-table.json` - Static lookup table with verified codes
- `SNOMED-VERIFICATION.md` - Complete validation documentation

### API Status
- ✅ **Working**: Snowstorm training instance (dev/testing only)
- ❌ **Not working**: lookup.snomedtools.org, browser.ihtsdotools.org, ontology.nhs.uk
- 📋 **Production**: Requires NHS Terminology Server account or local Snowstorm instance

## 10. Next Steps

- [x] Extract Preset #1 to YAML format
- [x] Validate all SNOMED CT codes
- [ ] Extract Presets #2, #3 to YAML format
- [ ] Build IPS FHIR JSON generator from YAML
- [ ] Update CodeRef conversion to parse Encounter.type
- [ ] Document Composition section → care stage mapping logic

---

## 11. References

### FHIR Standards
- FHIR IPS IG: http://hl7.org/fhir/uv/ips/
- FHIR Encounter: http://hl7.org/fhir/R4/encounter.html

### SNOMED CT APIs
- Snowstorm Training API: https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/
- Snowstorm GitHub: https://github.com/IHTSDO/snowstorm
- NHS Terminology Server: https://ontology.nhs.uk/production1/fhir (requires auth)

### Project Documentation
- `preset-1-source.yaml` - Extracted YAML source with verified codes
- `SNOMED-VERIFICATION.md` - Complete SNOMED validation documentation
- `validate-snomed-snowstorm.cjs` - Working validator script
- `snomed-lookup-table.json` - Static lookup table
- `full-ips-fhir-json-example-scaffold-spec.md`
- `CODEREF-PIPELINE-SPEC.md`
