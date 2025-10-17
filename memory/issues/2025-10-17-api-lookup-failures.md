# 2025-10-17 - Terminology API Lookup Failures

## Status: OPEN - Investigation Required

## Overview
Both LOINC and SNOMED CT terminology API lookups are failing, causing code displays to fallback to numeric codes instead of human-readable text.

## LOINC API Failures

### Error Pattern
```
LOINC API error for [code]: "The string did not match the expected pattern."
```

### Affected Codes
- 8867-4 (Heart rate)
- 9279-1 (Respiratory rate)
- 8480-6 (Systolic blood pressure)
- 8462-4 (Diastolic blood pressure)
- 8310-5 (Body temperature)
- 59408-5 (Oxygen saturation)
- 10340-1, 75269-8 (Returning 400 Bad Request)
- 11392-8, 80341-1, 8478-0, 9269-2
- 6690-2, 1988-5, 2519-7, 2524-7

### Current Configuration
**File:** `terminology-api.js` lines 17-22

```javascript
loinc: {
    baseUrl: 'https://tx.fhir.org/r4/CodeSystem/$lookup',
    rateLimit: 200,
    timeout: 5000
}
```

### Request Format
```javascript
const url = `${API_CONFIG.loinc.baseUrl}?system=http://loinc.org&code=${code}`;
```

**Example:** `https://tx.fhir.org/r4/CodeSystem/$lookup?system=http://loinc.org&code=8310-5`

### Possible Causes
1. **URL Encoding**: LOINC codes with special characters may need proper encoding
2. **API Format Change**: tx.fhir.org may have changed request format requirements
3. **System URL**: `http://loinc.org` may need to be `http://loinc.org/` (trailing slash) or different format
4. **HTTP Method**: May need POST instead of GET
5. **Missing Headers**: May require specific Accept or Content-Type headers

### Impact
- Vital signs show codes like "8310-5" instead of "Body temperature"
- Lab results show codes like "6690-2" instead of readable names
- User experience degraded but data still accessible

## SNOMED CT API Failures

### Error Pattern
```
Origin http://127.0.0.1:8080 is not allowed by Access-Control-Allow-Origin.
Status code: 404
```

### Example Failure
- **Code:** 432122003 (Piperacillin-tazobactam)
- **URL:** `https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/browser/MAIN/concepts/432122003`

### Current Configuration
**File:** `terminology-api.js` lines 11-16

```javascript
snomed: {
    baseUrl: 'https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/browser/MAIN/concepts',
    rateLimit: 200,
    timeout: 5000
}
```

### Issues
1. **CORS Error**: Browser blocking cross-origin requests from localhost
2. **404 Status**: Resource not found on server
3. **Training Server**: Using training server which may be unstable or have limited data

### Possible Causes
1. **Server Down**: Snowstorm training server may be offline or relocated
2. **API Change**: Endpoint structure may have changed
3. **Missing Concepts**: Code 432122003 may not exist in training edition
4. **CORS Policy**: Server may not allow browser-based requests from localhost
5. **Edition Issue**: MAIN branch may not be correct edition for all codes

### Impact
- Medication names show codes like "432122003" instead of "Piperacillin-tazobactam"
- Condition/procedure codes not human-readable
- Clinical data less accessible to users

## Investigation Steps Needed

### LOINC API
1. Check tx.fhir.org documentation: https://confluence.hl7.org/display/FHIR/Public+Test+Servers
2. Test URL manually with curl to see exact response:
   ```bash
   curl "https://tx.fhir.org/r4/CodeSystem/\$lookup?system=http://loinc.org&code=8310-5"
   ```
3. Try alternative LOINC servers:
   - https://fhir.loinc.org (requires auth - already failed)
   - https://r4.ontoserver.csiro.au/fhir
   - https://clinicaltables.nlm.nih.gov/fhir/R4
4. Review FHIR $lookup operation spec: http://hl7.org/fhir/codesystem-operation-lookup.html
5. Test with POST instead of GET
6. Check if URL parameters need encoding

### SNOMED API
1. Verify Snowstorm training server status
2. Test alternative Snowstorm endpoints:
   - https://snowstorm.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/concepts/
   - Public production Snowstorm instances
3. Consider CORS proxy for development
4. Test different SNOMED editions (US, International, UK)
5. Check if concept exists: https://termbrowser.nhs.uk/?perspective=full&conceptId1=432122003
6. Review Snowstorm API docs: https://github.com/IHTSDO/snowstorm/blob/master/docs/using-the-fhir-api.md

## Workarounds

### Current Behavior
Both APIs fallback to displaying the code if lookup fails:
```javascript
return code; // Fallback to code on error
```

### Potential Improvements
1. **Cache Pre-population**: Load common codes into cache at startup
2. **Local Terminology Database**: Bundle subset of LOINC/SNOMED for offline use
3. **Hybrid Approach**: Use APIs when available, fallback to local database
4. **Display Text Preservation**: Cache display text from original FHIR resources

## Related Files
- `terminology-api.js`: API configuration and lookup functions
- `terminology-api-old.js`: Previous version with authenticated LOINC API
- `script.js`: Calls `resolveCodeDisplayAsync()` for all code lookups

## Priority
**High** - Impacts user experience significantly, though data remains accessible via codes
