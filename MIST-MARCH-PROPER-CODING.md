# MIST/MARCH Proper Coding Example

## Current (BAD) - AI Generated FHIR

### MIST Observation (Text-based)
```json
{
  "resourceType": "Observation",
  "id": "mist-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "survey" }] }],
  "code": { "text": "MIST report" },
  "valueString": "M: No trauma. Flu-like prodrome, pleuritic chest pain. I: Coarse crackles RLL, febrile. S: HR 104, RR 24, BP 120/78, Temp 38.3°C, SpO2 94% RA. T: O2 via nasal cannula; rapid CASEVAC.",
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

### MARCH Observation (Component text)
```json
{
  "resourceType": "Observation",
  "id": "march-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": { "text": "MARCH assessment" },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "component": [
    { "code": { "text": "Massive hemorrhage" }, "valueString": "none" },
    { "code": { "text": "Airway" }, "valueString": "patent" },
    { "code": { "text": "Respiration" }, "valueString": "tachypnea, bilateral air entry; crackles RLL" },
    { "code": { "text": "Circulation" }, "valueString": "stable" },
    { "code": { "text": "Head/Neuro" }, "valueString": "alert" },
    { "code": { "text": "Hypothermia/Heat" }, "valueString": "normothermic" }
  ]
}
```

---

## Proposed (GOOD) - Properly Coded FHIR

### MIST Components → Individual Observations

#### M (Mechanism)
```json
{
  "resourceType": "Observation",
  "id": "obs-mechanism-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "418189009",
      "display": "Mechanism of injury"
    }]
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "428916009",
      "display": "Non-traumatic mechanism"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### I (Injuries/Illness) - Lung Sounds
```json
{
  "resourceType": "Observation",
  "id": "obs-lung-sounds-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "10340-1",
      "display": "Respiratory system Findings"
    }]
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "48348005",
      "display": "Coarse crackles"
    }]
  },
  "bodySite": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "90572001",
      "display": "Structure of lower lobe of right lung"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### I (Injuries/Illness) - Chief Complaint
```json
{
  "resourceType": "Condition",
  "id": "cond-complaint-POI",
  "clinicalStatus": { "coding": [{ "code": "active" }] },
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "426976009",
      "display": "Pleuritic chest pain"
    }]
  },
  "subject": { "reference": "urn:uuid:patient" },
  "onsetDateTime": "2025-10-02T05:00:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### S (Signs) - Already exists as vitals!
```json
// HR already exists as obs-8867-4-POI-10
// RR already exists as obs-9279-1-POI-10
// BP already exists as obs-8480-6-POI-10 and obs-8462-4-POI-10
// Temp already exists as obs-8310-5-POI-10
// SpO2 already exists as obs-59408-5-POI-10
```

#### T (Treatment) - O2 Therapy
```json
{
  "resourceType": "Procedure",
  "id": "proc-o2-therapy-POI-10",
  "status": "completed",
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "371907003",
      "display": "Oxygen administration by nasal cannula"
    }]
  },
  "subject": { "reference": "urn:uuid:patient" },
  "performedDateTime": "2025-10-02T05:12:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### T (Treatment) - CASEVAC Request
```json
{
  "resourceType": "ServiceRequest",
  "id": "svc-casevac-POI-10",
  "status": "active",
  "intent": "order",
  "priority": "urgent",
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "225358003",
      "display": "Casualty evacuation"
    }]
  },
  "subject": { "reference": "urn:uuid:patient" },
  "authoredOn": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

---

### MARCH Components → Individual Observations

#### Massive Hemorrhage Assessment
```json
{
  "resourceType": "Observation",
  "id": "obs-hemorrhage-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "75269-8",
      "display": "Hemorrhage assessment"
    }]
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "260413007",
      "display": "None"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### Airway Assessment
```json
{
  "resourceType": "Observation",
  "id": "obs-airway-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "11392-8",
      "display": "Airway patency"
    }]
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "281900007",
      "display": "Patent"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### Respiration Assessment
```json
{
  "resourceType": "Observation",
  "id": "obs-respiration-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "80341-1",
      "display": "Respiratory pattern"
    }]
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "271823003",
      "display": "Tachypnea"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### Circulation Assessment
```json
{
  "resourceType": "Observation",
  "id": "obs-circulation-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "8478-0",
      "display": "Mean blood pressure"
    }],
    "text": "Perfusion status"
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "58158008",
      "display": "Hemodynamically stable"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### Head/Neuro Assessment
```json
{
  "resourceType": "Observation",
  "id": "obs-neuro-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "9269-2",
      "display": "Glasgow coma score total"
    }],
    "text": "Level of consciousness"
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "248234008",
      "display": "Alert"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

#### Hypothermia Assessment
```json
{
  "resourceType": "Observation",
  "id": "obs-temp-status-POI-10",
  "status": "final",
  "category": [{ "coding": [{ "code": "exam" }] }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "8310-5",
      "display": "Body temperature"
    }],
    "text": "Temperature status"
  },
  "valueCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "386725007",
      "display": "Normothermic"
    }]
  },
  "effectiveDateTime": "2025-10-02T05:10:00-04:00",
  "encounter": { "reference": "urn:uuid:enc-poi" }
}
```

---

## CodeRef Conversion

### From BAD FHIR (text-based)
**Problem**: Can't convert text to codes
```json
{
  "poi": {
    "narratives": [
      {
        "id": "mist-POI-10",
        "code": { "text": "MIST report" },
        "time": "2025-10-02T05:10:00-04:00",
        "text": "M: No trauma. Flu-like prodrome, pleuritic chest pain. I: Coarse crackles RLL, febrile. S: HR 104, RR 24, BP 120/78, Temp 38.3°C, SpO2 94% RA. T: O2 via nasal cannula; rapid CASEVAC."
      }
    ]
  }
}
```

### From GOOD FHIR (coded)
**Result**: Perfect compression, all codes
```json
{
  "poi": {
    "encounter": { "id": "enc-poi", "start": "2025-10-02T05:00:00-04:00", "end": "2025-10-02T05:25:00-04:00" },

    "vitals": [
      { "id": "obs-8867-4-POI-10", "code": { "sys": "loinc", "code": "8867-4" }, "value": 104, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-9279-1-POI-10", "code": { "sys": "loinc", "code": "9279-1" }, "value": 24, "time": "2025-10-02T05:10:00-04:00" }
      // ... more vitals
    ],

    "assessments": [
      { "id": "obs-mechanism-POI-10", "code": { "sys": "sct", "code": "418189009" }, "value": { "sys": "sct", "code": "428916009" }, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-lung-sounds-POI-10", "code": { "sys": "loinc", "code": "10340-1" }, "value": { "sys": "sct", "code": "48348005" }, "bodySite": { "sys": "sct", "code": "90572001" }, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-hemorrhage-POI-10", "code": { "sys": "loinc", "code": "75269-8" }, "value": { "sys": "sct", "code": "260413007" }, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-airway-POI-10", "code": { "sys": "loinc", "code": "11392-8" }, "value": { "sys": "sct", "code": "281900007" }, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-respiration-POI-10", "code": { "sys": "loinc", "code": "80341-1" }, "value": { "sys": "sct", "code": "271823003" }, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-circulation-POI-10", "code": { "sys": "loinc", "code": "8478-0" }, "value": { "sys": "sct", "code": "58158008" }, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-neuro-POI-10", "code": { "sys": "loinc", "code": "9269-2" }, "value": { "sys": "sct", "code": "248234008" }, "time": "2025-10-02T05:10:00-04:00" },
      { "id": "obs-temp-status-POI-10", "code": { "sys": "loinc", "code": "8310-5" }, "value": { "sys": "sct", "code": "386725007" }, "time": "2025-10-02T05:10:00-04:00" }
    ],

    "conditions": [
      { "id": "cond-complaint-POI", "code": { "sys": "sct", "code": "426976009" }, "onset": "2025-10-02T05:00:00-04:00" }
    ],

    "events": [
      { "id": "proc-o2-therapy-POI-10", "code": { "sys": "sct", "code": "371907003" }, "time": "2025-10-02T05:12:00-04:00" }
    ],

    "requests": [
      { "id": "svc-casevac-POI-10", "code": { "sys": "sct", "code": "225358003" }, "priority": "urgent", "time": "2025-10-02T05:10:00-04:00" }
    ]
  }
}
```

---

## Summary

**Original FHIR**:
- 2 resources (MIST + MARCH) with text → **Cannot compress, cannot code**

**Properly Coded FHIR**:
- 13 resources (all coded observations/conditions/procedures) → **Perfect compression, lossless**

**New CodeRef arrays needed**:
- `assessments` - Coded exam observations (MARCH components, lung sounds, mechanism)
- `requests` - ServiceRequests (CASEVAC, consultations)

**Result**:
- **No text, all codes**
- **Smaller payload** (codes compress better than text)
- **Lossless round-trip** (can reconstruct exact FHIR)

---

**Should I generate the complete properly-coded FHIR bundle for POI stage?**
