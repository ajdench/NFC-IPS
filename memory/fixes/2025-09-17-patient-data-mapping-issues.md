# 2025-09-17-patient-data-mapping-issues.md

## Problem: Patient demographic data mapping inconsistencies between internal FHIR model and Patient OPCP display

## Issues Identified:

### 1. Title/Rank: "Drummer" Missing ❌
- **FHIR Model**: `buildCodeRefPatient()` correctly sets `nameEntry.prefix = [patientData.rank]` (line 883)
- **Demo Data**: Contains `"rank": "Drummer"` (line 1551)
- **Display**: `createPatientDetailsElement()` correctly reads `name.prefix?.[0]` (line 1228)
- **Status**: Should work but needs verification - may be data source issue

### 2. Service Number: "5199" Missing ❌
- **FHIR Model**: `buildCodeRefPatient()` creates identifier with `code: 'MIL'` (line 925)
- **Demo Data**: Contains `"service_id": {"sys": "mil", "code": "5199"}` (line 1550)
- **Display**: `createPatientDetailsElement()` searches for `id.type?.coding?.some(c => c.code === 'MIL')` (line 1220)
- **Status**: Should work but needs verification

### 3. NHS Number System: Wrong UK Core Standard ❌
- **Current**: Uses `http://terminology.hl7.org/CodeSystem/v2-0203` with code `'NH'`
- **Required**: UK Core standard:
  ```json
  {
    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-IdentifierType",
    "code": "nhsNumber",
    "display": "NHS Number"
  }
  ```
- **System Value**: Should be `"https://fhir.nhs.uk/Id/nhs-number"`

### 4. Blood Group Display Value: Missing ❌
- **FHIR Model**: Creates extension but may not be setting display value correctly
- **Demo Data**: Contains `"blood_group": {"sys": "sct", "code": "112144000"}`
- **Display**: Tries to resolve via `resolveCodeDisplay('sct', coding.code)` (line 1242)
- **Issue**: `medicalCodeMap` may not contain blood group SNOMED codes

### 5. Vitals Date/Time Logic: Inconsistent ❌
- **Current**: Vitals in MIST sections don't use consistent date/time display logic
- **Required**: Should follow same smart date display as other medical items
- **Issue**: `createStandardizedPill()` for vitals may not be getting time data

## Root Causes:
1. **NHS Number**: Wrong coding system/standards compliance
2. **Blood Group**: Missing SNOMED blood group codes in `medicalCodeMap`
3. **Data Flow**: Possible issue in CodeRef→FHIR→Display pipeline
4. **Vitals Time**: Missing time data in protobuf or not being passed to pills

## Required Fixes:
1. Update NHS Number identifier to UK Core standard
2. Add blood group SNOMED codes to `medicalCodeMap`
3. Verify CodeRef data is properly flowing to FHIR model
4. Implement consistent date/time for vitals in MIST sections
5. Test with actual demo payloads to verify display

## Files to Modify:
- `script.js:905-917`: NHS Number identifier creation
- `script.js:306-356`: Add blood group codes to `medicalCodeMap`
- `script.js:976-996`: Vitals date/time handling in CodeRef processing
- Verify demo data flow through entire pipeline