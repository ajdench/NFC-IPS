# SNOMED CT Code Verification for Preset #1

**Status**: Manual verification required - APIs rate-limited/blocked
**Date**: 2025-10-03

## API Access Issues

- **Snowstorm Public API**: Rate limited or returns HTML errors
- **NHS Term Browser API**: Blocked or requires authentication
- **Recommendation**: Use cached lookup table for development; integrate proper API for production

## Codes Requiring Verification

### Patient Demographics

| Code | Claimed Display | Status | Correct Code | Correct Display |
|------|----------------|--------|--------------|-----------------|
| 278147001 | Blood group O Rh(D) positive | ✅ VERIFIED | 278147001 | Blood group O Rh(D) positive |
| (text only) | Private (OR-1) | ✅ CORRECTED | N/A | No specific SNOMED rank codes - using text-only |

### Allergies

| Code | Claimed Display | Status | Correct Code | Correct Display |
|------|----------------|--------|--------------|-----------------|
| 300913006 | Allergy to shellfish | ✅ VERIFIED (web search) | 300913006 | Shellfish allergy |

### Medications - Maintenance

| Code | Claimed Display | Status | Correct Code | Correct Display |
|------|----------------|--------|--------------|-----------------|
| 320818006 | Product containing precisely cetirizine hydrochloride 10mg tablet | ✅ VERIFIED (web search) | 320818006 | Product containing precisely cetirizine hydrochloride 10 milligram/1 each conventional release oral tablet |

### Conditions

| Code | Claimed Display | Status | Correct Code | Correct Display |
|------|----------------|--------|--------------|-----------------|
| 233604007 | Pneumonia (disorder) | ✅ VERIFIED (web search) | 233604007 | Pneumonia (disorder) |

### Medications - Event-Based

| Code | Claimed Display | Status | Correct Code | Correct Display |
|------|----------------|--------|--------------|-----------------|
| 777029003 | Oxygen | ✅ VERIFIED | 777029003 | Oxygen only product |
| 387390002 | Sodium chloride 0.9% infusion | ✅ VERIFIED | 387390002 | Sodium chloride |
| 346628003 | Piperacillin/tazobactam | ✅ VERIFIED | 346628003 | Piperacillin- and tazobactam-containing product |
| 45555007 | Norepinephrine | ✅ VERIFIED | 45555007 | Norepinephrine (substance) |

### Routes of Administration

| Code | Claimed Display | Status | Correct Code | Correct Display |
|------|----------------|--------|--------------|-----------------|
| 47625008 | Intravenous route | ✅ VERIFIED | 47625008 | Intravenous route |
| 46713006 | Nasal route | ✅ VERIFIED | 46713006 | Nasal route |

### Procedures

| Code | Claimed Display | Status | Correct Code | Correct Display |
|------|----------------|--------|--------------|-----------------|
| 233527006 | Central venous catheter insertion | ✅ VERIFIED | 233527006 | Central venous catheter insertion (procedure) |

## Required Actions

✅ **ALL COMPLETED** (2025-10-03):

**Replaced incorrect codes**:
   - 410942007 → 42016111000001102 → 777029003 (Oxygen - UK code not in international edition)
   - 432294006 → 387390002 (Sodium chloride - was Central sleep apnea!)
   - 71796008 → 233527006 (CVC insertion - was device, not procedure)
   - 386980009 → 45555007 (Norepinephrine - was Fever!)
   - 776274009 → 346628003 (Piperacillin/tazobactam - was hydroxycitronellal fragrance!)
   - 160548009 → Removed (no SNOMED rank codes - using text only)

**All 11 codes now validated via Snowstorm training API** ✅

## Production Pipeline - API Integration Options

1. **Snowstorm Training Instance** (Current - Development Only):
   - URL: `https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/`
   - ✅ No authentication required
   - ✅ Full REST API
   - ❌ NOT for production use

2. **NHS Terminology Server** (Production Option):
   - URL: `https://ontology.nhs.uk/production1/fhir`
   - Requires system-to-system account
   - OAuth authentication
   - Production SLA

3. **Local Snowstorm Instance** (Self-hosted):
   - GitHub: https://github.com/IHTSDO/snowstorm
   - Full control, no rate limits
   - Requires SNOMED license

4. **Static Lookup Table** (Fallback):
   - Use `snomed-lookup-table.json`
   - Update periodically via API
   - No runtime API dependency

## Lookup Table Strategy

For development, create `snomed-lookup-table.json` with manually verified codes:

```json
{
  "278147001": {
    "display": "Blood group O Rh(D) positive",
    "verified": true,
    "source": "web_search",
    "date": "2025-10-03"
  },
  "300913006": {
    "display": "Shellfish allergy",
    "verified": true,
    "source": "web_search",
    "date": "2025-10-03"
  }
}
```

## Validation Results (2025-10-03)

### ✅ WORKING API FOUND:
**Snowstorm Training Instance**: `https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/`
- Full REST API access
- International SNOMED CT edition
- No authentication required
- Suitable for development/testing (not production)

### ❌ Non-working APIs:
- Snowstorm FHIR API (snowstorm.ihtsdotools.org): ECONNREFUSED
- NHS Ontology Server (ontology.nhs.uk): CodeSystem not found errors
- SNOMED lookup tool (lookup.snomedtools.org): ECONNREFUSED

### ✅ Created: validate-snomed-snowstorm.cjs
Validator script using working Snowstorm training API

### ✅ Created: snomed-lookup-table.json
Static lookup table with all verified international codes

**Total Codes Verified**: 11 codes - **ALL VALID** ✅

## Next Steps

✅ **Validation Complete** - Ready for next phase:

1. **Extract Presets #2 and #3** to YAML format (same process as Preset #1)
2. **Build YAML → IPS FHIR JSON converter** - Transform YAML to compliant IPS bundles
3. **Production API Integration**:
   - Option 1: NHS Terminology Server (https://ontology.nhs.uk/production1/fhir)
   - Option 2: SNOMED lookup tool (https://lookup.snomedtools.org) - when accessible
   - Option 3: Local Snowstorm instance
   - Current: Use snomed-lookup-table.json for development
