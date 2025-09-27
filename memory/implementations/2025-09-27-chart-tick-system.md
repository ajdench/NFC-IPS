# Chart Tick System Implementation - 2025-09-27

## Overview
Comprehensive implementation of dynamic x-axis tick system for vitals chart with OPCP stage-based tick count, hh:00/hh:30 alignment, and two-line labels.

## Requirements Implemented

### 1. Dynamic OPCP-Based Tick Count
- **Constant**: `CARE_STAGE_COUNT = 9` (absolute count including empty stages)
- **Logic**: First tick + 7 intermediate ticks + last tick = 9 total
- **Future-proof**: Will automatically adjust when OPCP stages change to 10

### 2. Smart Boundary Detection
- **First tick**: Closest previous hh:00/hh:30 to encompass first data point
- **Last tick**: Closest next hh:00/hh:30 to encompass last data point
- **Example**: Data 09:17-15:17 → Boundaries 09:00-15:30

### 3. Intermediate Tick Selection (Option C)
- **Method**: Select exactly 7 best hh:00/hh:30 marks between boundaries
- **Algorithm**: If more than 7 available, evenly distribute selection
- **Alternative options memorized**: A) Evenly spaced, B) All hh:00/hh:30 marks

### 4. Two-Line Tick Labels
- **Format**: `hh:mm` / `d mmm yy`
- **Example**: "16:30" / "15 Jan 24"
- **Locale**: en-GB formatting

## Implementation Details

### Files Modified
1. **config/constants.js**: Added `CARE_STAGE_COUNT = 9`
2. **script.js**: Complete x-axis configuration overhaul

### Chart.js Configuration
```javascript
x: {
    type: 'linear',
    // Removed hardcoded min/max to allow afterBuildTicks control
    ticks: {
        callback(value) {
            // Two-line format implementation
            return [time, dateStr];
        },
        autoSkip: false
    },
    afterBuildTicks: function(scale) {
        // Custom boundary calculation and tick generation
    }
}
```

### Boundary Calculation Logic
```javascript
// First tick calculation
const firstTick = new Date(dataMin);
if (dataMin.getMinutes() >= 30) {
    firstTick.setMinutes(30);
} else {
    firstTick.setMinutes(0);
}
// Handle edge cases with fallback logic
```

## Debugging Approach
- Added console logging for data range and calculated boundaries
- Removed Chart.js scale override conflicts
- Iterative boundary calculation refinement

## Known Issues Resolved
1. **Boundary over-extension**: Fixed logic causing 08:30-16:00 instead of 09:00-15:30
2. **Two-line label loss**: Restored after accidental reversion to single-line
3. **Chart.js conflicts**: Removed hardcoded min/max causing scale override
4. **Tick alignment**: Ensured all ticks land on hh:00 or hh:30 marks

## Testing Results
- **Input**: Data range 09:17 to 15:17
- **Expected**: Chart bounds 09:00 to 15:30
- **Ticks**: 9 total ticks on 30-minute boundaries
- **Labels**: Two-line format working

## Future Enhancements
- Text alignment (left/right for first/last ticks)
- Custom tick styling
- Animation improvements
- Responsive tick density

## Configuration Constants
```javascript
export const CARE_STAGE_COUNT = 9; // Total OPCP stages for tick calculation
```

## Debug Console Output
```
Data range: [actual data timestamps]
Calculated boundaries: [09:00 to 15:30 format]
```