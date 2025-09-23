# Debugging Best Practices for NFC IPS Viewer

## Core Principle
**Always update logs with exhaustive debugging and seek console outputs when issues arise. All other approaches waste time and tokens.**

## Debugging Workflow

### 1. Immediate Console Access
- Add comprehensive `console.log` statements at critical points
- Log variable states, function entries/exits, error conditions
- Use descriptive prefixes: `console.log('=== RENDER DEBUG ===', variable)`

### 2. JavaScript Error Patterns
- **ReferenceError**: Check variable scope and function signatures
- **Undefined variables**: Trace parameter passing between functions
- **DOM manipulation**: Verify elements exist before manipulation

### 3. Real-time Debugging Steps
1. Add logging statements to suspected functions
2. Refresh browser and check console output
3. Trace execution flow through logged checkpoints
4. Identify exact failure point
5. Fix root cause
6. Remove debug logs

### 4. Common NFC IPS Issues
- **Missing placeholders**: Usually JavaScript errors preventing DOM updates
- **Function signature mismatches**: Check parameter names after refactoring
- **Payload processing**: Log each pipeline stage (decode → parse → render)
- **UI updates**: Verify info box configurations and rendering calls

## Example Debug Pattern
```javascript
console.log('=== FUNCTION_NAME ENTRY ===', {param1, param2});
try {
    // main logic
    console.log('=== CHECKPOINT 1 ===', intermediateResult);
    // more logic
    console.log('=== FUNCTION_NAME SUCCESS ===', result);
    return result;
} catch (error) {
    console.error('=== FUNCTION_NAME ERROR ===', error);
    throw error;
}
```

## Time-Saving Rules
1. **Log first, theorize second** - Don't guess, trace execution
2. **Console over comments** - Active debugging beats passive documentation
3. **Incremental logging** - Add logs progressively through suspected areas
4. **Error context** - Log surrounding state when errors occur

## Memory Update Protocol
After debugging sessions:
- Document root cause in memory/fixes/
- Update this pattern with new insights
- Record successful debugging approaches