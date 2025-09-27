# Chart Tick Configuration Pattern

## Use When
Implementing custom Chart.js x-axis tick systems with:
- Dynamic tick count based on business logic
- Custom boundary detection
- Time-based alignment requirements
- Multi-line label formatting

## Pattern Overview
```javascript
// 1. Define global constants
export const BUSINESS_LOGIC_COUNT = 9;

// 2. Chart configuration without hardcoded bounds
x: {
    type: 'linear',
    // No min/max here - let afterBuildTicks control
    ticks: {
        callback(value) {
            // Custom label formatting
            return [line1, line2]; // Two-line labels
        }
    },
    afterBuildTicks: function(scale) {
        // Custom tick generation logic
        const boundaries = calculateBoundaries(scale.min, scale.max);
        const ticks = generateTicks(boundaries, BUSINESS_LOGIC_COUNT);
        scale.ticks = ticks;
        scale.min = boundaries.start;
        scale.max = boundaries.end;
    }
}
```

## Key Components

### Boundary Detection
```javascript
function calculateBoundaries(dataMin, dataMax) {
    const start = roundToPreviousInterval(dataMin, interval);
    const end = roundToNextInterval(dataMax, interval);
    return { start, end };
}
```

### Tick Selection Strategies
- **Option A**: Evenly spaced (ignores alignment)
- **Option B**: All interval marks (variable count)
- **Option C**: Fixed count, best interval selection ✅

### Anti-Patterns
- ❌ Hardcoding min/max in chart options when using afterBuildTicks
- ❌ Not handling edge cases in boundary calculation
- ❌ Mixing scale control between options and callbacks

## Implementation Notes
- Remove scale min/max from chart options
- Use afterBuildTicks for complete control
- Add debug logging for boundary calculation
- Handle timezone/locale formatting carefully

## Example Usage
Perfect for medical timeline charts, business stage visualizations, or any time-based data requiring specific tick alignment.