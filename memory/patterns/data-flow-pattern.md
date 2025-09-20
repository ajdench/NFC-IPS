# Data Flow Pattern: IPS FHIR First

## Use When
Patient data needs to be updated or fragments need to be created

## Solution
Always follow this sequence:
1. Update internal IPS FHIR JSON model
2. Sync medicalCodeMap with new clinical codes
3. Convert IPS FHIR to protobuf using encoding logic
4. Generate Base64 fragment

## Example
```javascript
// CORRECT workflow
updatePatientInFHIR(patientData);
syncMedicalCodeMap(newClinicalCodes);
const protobufPayload = encodeIpsToProtobuf(fhirModel);
const fragment = base64Encode(protobufPayload);

// INCORRECT - bypassing FHIR model
const fragment = directFragmentCreation(rawData); // ❌ Never do this
```

## Trade-offs
- **Pro**: Ensures data consistency between FHIR and fragments
- **Pro**: medicalCodeMap stays synchronized
- **Pro**: Single source of truth for patient data
- **Con**: Requires more processing steps
- **Con**: More complex than direct fragment manipulation

## Critical Rule
Never create fragments without updating the IPS FHIR model first.
medicalCodeMap must be updated whenever patient data changes.