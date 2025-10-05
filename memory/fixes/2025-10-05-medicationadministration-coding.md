# 2025-10-05-medicationadministration-coding.md

## Problem
4 MedicationAdministration resources in ips-fhir-json-1.json were being reconstructed as Procedures due to missing SNOMED codes and structured dosages.

## Root Cause
Resources were created with text-only medication descriptions lacking:
- SNOMED CT coding arrays
- Structured dosage.dose values (numeric + units)
- Coded routes of administration

## Resources Fixed

### medadmin-R1_PHEC-50 (Oxygen)
- **SNOMED**: 57485005 (Oxygen)
- **Dose**: 4 L/min
- **Route**: 46073002 (Nasal cannula)

### medadmin-R1_PHC-25 (Crystalloid)
- **SNOMED**: 432102000 (Normal saline)
- **Dose**: 1000 mL
- **Route**: 47625008 (Intravenous route)

### medadmin-R1_PHC-30 (Piperacillin-tazobactam)
- **SNOMED**: 432122003 (Piperacillin and tazobactam)
- **Dose**: 4.5 g
- **Route**: 47625008 (Intravenous route)

### medadmin-R2-20 (Norepinephrine)
- **SNOMED**: 45555007 (Norepinephrine)
- **Dose**: Titrated to effect (text-only, as dose varies)
- **Route**: 47625008 (Intravenous route)

## Fix Applied
Used jq script to add proper FHIR MedicationAdministration structure:
```json
{
  "medicationCodeableConcept": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "<SNOMED_CODE>",
      "display": "<MEDICATION_NAME>"
    }],
    "text": "<ORIGINAL_TEXT>"
  },
  "dosage": {
    "dose": {
      "value": <NUMERIC>,
      "unit": "<UNIT>",
      "system": "http://unitsofmeasure.org",
      "code": "<UNIT_CODE>"
    },
    "route": {
      "coding": [{
        "system": "http://snomed.info/sct",
        "code": "<ROUTE_CODE>",
        "display": "<ROUTE_NAME>"
      }]
    }
  }
}
```

## Expected Result
All 4 MedicationAdministration resources should now:
1. Be properly recognized as MedicationAdministration (not Procedure)
2. Round-trip through protobuf conversion without data loss
3. Display correctly in the NFC IPS viewer

## Prevention
- Always code medications with SNOMED CT
- Always include structured dosage with numeric values
- Always code routes of administration
- Validate FHIR resources against IPS profiles before use

## Next Steps
1. Test round-trip conversion with fixed data
2. Verify viewer displays medications correctly
3. Update documentation if successful
