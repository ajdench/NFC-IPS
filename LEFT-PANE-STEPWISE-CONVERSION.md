# Left Pane Stepwise Conversion Requirements

**Date**: 2025-10-04
**Status**: Specification - Awaiting Implementation

## Current Behavior

### ❌ Problems with Current Implementation (lines 6535-6597)

1. **Convert box**: Auto-converts even without FHIR loaded
2. **Compress box**: Auto-converts FHIR→CodeRef if needed, then compresses
3. **Encode box**: Calls full `performConversion()` pipeline
4. **Navigation**: Title clicks work, but box clicks always try to convert

## Required Behavior

### Stepwise Conversion Rules

**Each box should ONLY perform its specific step, with prerequisite checks:**

1. **Source (green) box click**:
   - ✅ Navigate to FHIR view (no conversion)
   - ✅ Already works correctly

2. **Convert (orange) box click**:
   - ✅ Check: Must be in FHIR mode with valid FHIR JSON
   - ❌ If not in FHIR mode → Warning: "Switch to FHIR source first"
   - ✅ If in FHIR mode → Convert FHIR → CodeRef
   - ✅ Switch to CodeRef view
   - ✅ Show: "✓ Converted to CodeRef"

3. **Compress (blue) box click**:
   - ✅ Check: Must be in CodeRef mode with conversion results
   - ❌ If not in CodeRef mode → Warning: "Convert to CodeRef first"
   - ✅ If in CodeRef mode → Compress CodeRef → Protobuf
   - ✅ Switch to Protobuf view
   - ✅ Show: "✓ Compressed to Protobuf"

4. **Encode (red) box click**:
   - ✅ Check: Must be in Protobuf mode with protobuf binary
   - ❌ If not in Protobuf mode → Warning: "Compress to Protobuf first"
   - ✅ If in Protobuf mode → Encode Protobuf → Fragment
   - ✅ Switch to Fragment view
   - ✅ Show: "✓ Encoded to Fragment"

### Navigation (Without Conversion)

1. **Title click** (double-click):
   - Cycle through formats: FHIR → CodeRef → Protobuf → Fragment
   - **NO conversion**, just view switching
   - Show: "Cycled to [format] view (no conversion)"

2. **Shift + Box click**:
   - Navigate to that format without conversion
   - Show: "Navigated to [format] view (no conversion)"
   - Useful for inspecting intermediate results

### Full Pipeline Conversion

**Encode button (main action button)**:
- Performs full pipeline: FHIR → CodeRef → Protobuf → Fragment
- Updates all intermediate results
- Final view: Fragment
- This is the "one-click" conversion

## Implementation Changes Needed

### File: `script.js` (lines 6520-6600)

**Current logic** (lines 6545-6568):
```javascript
// Auto-converts previous steps if missing
if (!formatState.conversionResults.coderef) {
    // Convert FHIR first
}
```

**Required logic**:
```javascript
// Strict prerequisite checking
if (currentMode !== 'coderef') {
    showMessage('Convert to CodeRef first', 'warning');
    return;
}
```

### Updated Click Handler Pattern

```javascript
stage.addEventListener('click', async (e) => {
    const stageType = stage.dataset.stage;
    const hasContent = leftInput.textContent.trim().length > 0;
    const currentMode = formatState.leftMode;

    if (!hasContent) {
        showMessage('Load content first', 'warning');
        return;
    }

    // Shift-click = navigate without conversion
    if (e.shiftKey) {
        switchToStageFormat('left', stageType);
        updateStageStates('left');
        showMessage(`Navigated to ${stageType} view`, 'info');
        return;
    }

    // Stepwise conversion with strict prerequisites
    try {
        if (stageType === 'convert') {
            if (currentMode !== 'fhir') {
                showMessage('Switch to FHIR source first', 'warning');
                return;
            }
            // Convert FHIR → CodeRef
            const fhirData = JSON.parse(leftInput.textContent);
            formatState.conversionResults.coderef = JSON.stringify(
                codecPipeline.convertFhirBundleToCodeRef(fhirData), null, 2
            );
            await updateLeftPaneMode('coderef');
            showMessage('✓ Converted to CodeRef', 'success');
        }
        else if (stageType === 'compress') {
            if (currentMode !== 'coderef' || !formatState.conversionResults.coderef) {
                showMessage('Convert to CodeRef first', 'warning');
                return;
            }
            // Compress CodeRef → Protobuf
            const codeRefData = JSON.parse(formatState.conversionResults.coderef);
            formatState.conversionResults.protobuf = await codecPipeline.getProtobufBinary(codeRefData);
            await updateLeftPaneMode('protobuf');
            showMessage('✓ Compressed to Protobuf', 'success');
        }
        else if (stageType === 'encode') {
            if (currentMode !== 'protobuf' || !formatState.conversionResults.protobuf) {
                showMessage('Compress to Protobuf first', 'warning');
                return;
            }
            // Encode Protobuf → Fragment
            const fragment = await codecPipeline.encodeToFragment(formatState.conversionResults.protobuf);
            formatState.conversionResults.fragment = fragment;
            await updateLeftPaneMode('fragment');
            showMessage('✓ Encoded to Fragment', 'success');
        }
    } catch (error) {
        showMessage(`${stageType} failed: ${error.message}`, 'error');
    }
});
```

## User Experience

### Workflow Example

1. **Load Preset #1** → Source box turns green (FHIR loaded)
2. **Click Convert box** → Converts to CodeRef, box turns orange
3. **Click Compress box** → Compresses to Protobuf, box turns blue
4. **Click Encode box** → Encodes to Fragment, box turns red
5. **Click title** → Cycle back through views to inspect intermediate results
6. **Shift+click Source** → Jump to FHIR without re-converting

### Error Handling

**Scenario**: User loads FHIR, clicks Compress box (skipping Convert)

**Current behavior**: Auto-converts FHIR → CodeRef, then compresses
**Required behavior**: Shows warning "Convert to CodeRef first"

**Why**: User should understand the pipeline steps, not have them happen automatically

## Benefits

1. **Educational**: User learns the conversion pipeline
2. **Debuggable**: Can inspect each intermediate format
3. **Controlled**: No surprises with auto-conversion
4. **Flexible**: Shift-click for navigation, regular click for conversion

## Related Files

- `script.js`: Lines 6520-6600 (stage click handlers)
- `viewer.html`: Stage reveal HTML structure
- `style.css`: Stage color progression

## Implementation Status

- [ ] Update click handler logic (strict prerequisites)
- [ ] Add Shift-click navigation
- [ ] Update title click to cycle without conversion
- [ ] Test stepwise workflow
- [ ] Document user guide

---

**Next**: Implement strict stepwise conversion with prerequisite checks
