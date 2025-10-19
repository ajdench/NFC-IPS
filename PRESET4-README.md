# Preset #4 - Direct FHIR → Protobuf Pipeline

## Overview
Preset #4 is a test preset that bypasses the CodeRef conversion stage entirely, implementing a direct FHIR → Protobuf → Fragment pipeline.

## Test Data
**File:** `ips-fhir-json-4.json` (112 FHIR resources)

**Coverage:** All 11 OPCP care stages with identical data:
- POI, CASEVAC, AXP, MEDEVAC
- R1_PHEC, R1_PHC  
- FWD_TACEVAC
- R2_DHC
- REAR_TACEVAC, R3_DHC, STRATEVAC

**Per Care Stage (3 each):**
- **Vitals:** Heart rate (8867-4), Respiratory rate (9279-1), Body temperature (8310-5)
- **Conditions:** Fever, Headache, Diarrhea
- **Events:** Paracetamol, Ibuprofen, Ondansetron (MedicationAdministrations)

**Total:** 33 vitals + 33 conditions + 33 events = 99 clinical resources

## Pipeline Architecture

### Standard Pipeline (Presets #0, #1, #2, #3)
```
ENCODE:  FHIR → CodeRef → Protobuf → Fragment (3 stages)
DISPLAY: Fragment → Protobuf → CodeRef → FHIR (3 stages)
```

### Direct Pipeline (Preset #4)
```
ENCODE:  FHIR → Protobuf → Fragment (2 stages)
DISPLAY: Fragment → Protobuf → FHIR (2 stages)
```

## Implementation Details

### 1. Encode Path (Action Button)
**File:** `script.js` - `performConversion()` function

**Detection:** `formatState.preset4Mode === true`

**Process:**
1. Calls `convertFhirToProtobufDirect(fhirBundle)`
   - Stores entire FHIR Bundle as JSON string in `originalBundleJson` field
   - Sets `schemaVersion: 'direct-fhir'`
   - All other protobuf fields left empty/default
2. Calls `codecPipeline.encodeProtobufToFragment(protobuf)`
3. Skips CodeRef stage entirely

### 2. Display Path (Display Button)
**File:** `script.js` - `parseButton.addEventListener()` function

**Detection:** `formatState.preset4Mode === true`

**Process:**
1. Uses `formatState.originalFhir` instead of `reconstructedFhir`
2. Skips CodeRef decompression stage
3. Renders directly from stored FHIR JSON

### 3. Key Functions

**convertFhirToProtobufDirect(fhirBundle)**
- Location: `script.js` (after codecPipeline IIFE)
- Purpose: Direct FHIR → Protobuf conversion
- Stores: Full FHIR Bundle as `originalBundleJson` string
- Schema: `schemaVersion: 'direct-fhir'`

**codecPipeline.encodeProtobufToFragment(protobufBinary)**
- Location: `script.js` (inside codecPipeline IIFE)
- Purpose: Protobuf → compressed → base64 fragment
- Extracted from `encodeToFragment` for modular use

## Usage

1. **Load Preset #4:**
   - Click "#4" button
   - Sets `formatState.preset4Mode = true`
   - Loads `ips-fhir-json-4.json` into left pane

2. **Encode:**
   - Click "Encode" button
   - Watch 2-stage progression (no CodeRef)
   - Messages: "Direct FHIR → Protobuf conversion" 
   - Fragment appears in left pane

3. **Display:**
   - Click "Display" button  
   - Watch 2-stage progression (CodeRef skipped)
   - Messages: "Decompress stage skipped (direct FHIR mode)"
   - Clinical data displays across all 11 care stages

## Expected Results

### UI Display
- **All 11 care stage sections** should show data
- **Vitals Chart** should show all 11 care stages (if vitals rendering supports it)
- **Each section** should show:
  - 3 vitals pills (Heart rate, Respiratory rate, Temperature)
  - 3 condition pills (Fever, Headache, Diarrhea)
  - 3 event pills (Paracetamol, Ibuprofen, Ondansetron)

### Console Logs
```
Direct FHIR → Protobuf conversion: {
  fhirSize: ~30000,
  protobufSize: ~XXXX,
  compression: "XX.X%"
}
```

## Benefits of Direct Pipeline

1. **Simpler:** Removes CodeRef conversion complexity
2. **Faster:** One less conversion stage
3. **No Data Loss:** Stores complete FHIR Bundle
4. **Round-Trip Fidelity:** 100% preservation (byte-for-byte)
5. **Testing:** Validates protobuf can store arbitrary FHIR

## Limitations

1. **Larger Protobuf:** Stores full JSON vs compact CodeRef
2. **No Optimization:** Doesn't benefit from CodeRef compression
3. **Test Only:** Not intended for production NFC use

## File Checklist

- ✅ `ips-fhir-json-4.json` - Test FHIR bundle
- ✅ `generate-preset4.mjs` - Generator script
- ✅ `config/constants.js` - IPS_FHIR_JSON_4 constant
- ✅ `nfc/ips/viewer.html` - #4 button added
- ✅ `script.js` - Full pipeline implementation
- ✅ `PRESET4-README.md` - This document

## Testing Commands

```bash
# Verify test data
cat ips-fhir-json-4.json | jq '.entry | length'  # Should show 112

# Regenerate test data if needed
node generate-preset4.mjs

# Run development server
npm run dev:auto-jj
```

## Troubleshooting

**Issue:** Preset #4 button not working
- **Check:** Button exists in `viewer.html` line 162
- **Check:** `payload4` loaded in `script.js` init()
- **Check:** `DEMO_PAYLOADS.IPS_FHIR_JSON_4` defined

**Issue:** Encode shows 3 stages instead of 2
- **Check:** `formatState.preset4Mode = true` after clicking #4
- **Check:** Clear button wasn't clicked (resets preset4Mode)

**Issue:** Display shows CodeRef stage
- **Check:** Encode was clicked first (sets preset4Mode)
- **Check:** `formatState.preset4Mode` still true

**Issue:** No data displays in care stages
- **Check:** FHIR Bundle has proper Encounter.type.coding
- **Check:** Console for errors during `buildViewModelFromFhir()`
