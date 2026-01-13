# Hashrate and Mining Stats Functions - Extraction Summary

## Date: January 13, 2026

## Overview
Extracted `calculateAndDisplayHashrate` and related mining stats functions from `script.js` and integrated them into the `ui.js` module for better organization and modular architecture.

## Files Modified

### 1. `/js/ui.js`
**Added Functions:**
- `calculateAndDisplayHashrate()` - Main function to calculate and display network hashrate
- `calculateHashrate(timePerEpoch, miningDifficulty)` - Core hashrate calculation logic
- `formatHashrate(hashrate)` - Format hashrate with appropriate units (H/s, KH/s, MH/s, GH/s, etc.)
- `sleep(ms)` - Utility function for async delays

**Added State Variables:**
- `prevHashrate` - Cached previous hashrate value for throttling
- `prevTimeInFunc` - Timestamp for throttling repeated calls
- `formattedHashrate` - Export variable containing formatted hashrate string
- `ratioB0xTo0xBTC` - Price ratio (for backwards compatibility)
- `usdCostB0x` - USD price (for backwards compatibility)

**Updated Functions:**
- `updateStatsDisplay(stats)` - Now calls `calculateAndDisplayHashrate()` to fetch and display hashrate
- `updateWidget()` - Already calls `calculateAndDisplayHashrate()` (no changes needed)

**Added Imports:**
- `ProofOfWorkAddresss` from `./config.js`
- `customRPC` from `./settings.js`

### 2. `/js/main.js`
**Added Global Exposures:**
```javascript
// Hashrate and mining stats
window.calculateAndDisplayHashrate = UI.calculateAndDisplayHashrate;
window.calculateHashrate = UI.calculateHashrate;
window.formatHashrate = UI.formatHashrate;

// Reactive access to formattedHashrate
Object.defineProperty(window, 'formattedHashrate', {
    get: () => UI.formattedHashrate
});

// Price variables (reactive access)
Object.defineProperty(window, 'ratioB0xTo0xBTC', {
    get: () => UI.ratioB0xTo0xBTC,
    set: (val) => { UI.ratioB0xTo0xBTC = val; }
});
Object.defineProperty(window, 'usdCostB0x', {
    get: () => UI.usdCostB0x,
    set: (val) => { UI.usdCostB0x = val; }
});
```

## How It Works

### Hashrate Calculation Flow

1. **`calculateAndDisplayHashrate()`** is called:
   - Checks throttle (only runs once every 120 seconds)
   - Creates ethers.js provider using `customRPC`
   - Uses Multicall3 to batch two contract calls:
     - `inflationMined()` - Gets time per epoch
     - `getMiningDifficulty()` - Gets current mining difficulty
   - Calls `calculateHashrate()` with the results
   - Formats the result using `formatHashrate()`
   - Updates DOM element `#hashrate` if it exists
   - Caches result for future throttled calls

2. **`calculateHashrate(timePerEpoch, miningDifficulty)`**:
   - Formula: `hashrate = (2^22 * (difficulty / 524,288)) / timePerEpoch`
   - Returns hashrate in H/s (hashes per second)

3. **`formatHashrate(hashrate)`**:
   - Converts raw H/s to appropriate unit (EH/s, PH/s, TH/s, GH/s, MH/s, KH/s, H/s)
   - Returns formatted string like "1.23 TH/s"

### Integration Points

#### In `updateStatsDisplay(stats)`
```javascript
// Calculate and update hashrate
try {
    await calculateAndDisplayHashrate();
    console.log('✓ Hashrate calculated and displayed');
} catch (hashrateError) {
    console.warn('Failed to calculate hashrate:', hashrateError);
}
```

#### In `updateWidget()`
```javascript
await calculateAndDisplayHashrate();

setTimeout(() => {
    const usdPrice = window.usdCostB0x || usdCostB0x || 0;
    const btcPrice = window.ratioB0xTo0xBTC || ratioB0xTo0xBTC || 0;

    if (usdPriceEl) usdPriceEl.textContent = `$${usdPrice.toFixed(4)}`;
    if (btcPriceEl) btcPriceEl.textContent = btcPrice.toFixed(6);
    if (hashrateEl) hashrateEl.textContent = formattedHashrate;
}, 1000);
```

## Throttling Behavior

The `calculateAndDisplayHashrate()` function implements intelligent throttling:
- **First call**: Executes immediately (prevHashrate === 0)
- **Subsequent calls within 120 seconds**: Returns cached `prevHashrate` without making contract calls
- **After 120 seconds**: Makes fresh contract calls and updates cache

This prevents excessive RPC calls while keeping data reasonably fresh.

## updateAllMinerInfo Status

**Note:** The `updateAllMinerInfo()` function from script.js was NOT migrated because:

1. **Complexity**: It's a very large function (~400+ lines) with complex logic
2. **Dependencies**: Relies on many global variables and localStorage operations
3. **Scope**: Handles mined block data fetching, parsing, and rich list updates
4. **Current Usage**: Still actively used in script.js for other features

### What updateAllMinerInfo Does:
- Fetches mined block data from remote JSON sources and localStorage
- Processes mining transaction history
- Calculates per-miner statistics (blocks mined, epochs, rewards)
- Updates rich lists and distribution data
- Manages difficulty period tracking

### Future Integration:
If needed, `updateAllMinerInfo()` can be:
1. Extracted to a separate module like `js/miner-stats.js`
2. Refactored to remove global dependencies
3. Called from `updateStatsDisplay()` for comprehensive stats

For now, the hashrate calculation provides the most important real-time mining metric without the complexity of the full mining stats system.

## Backwards Compatibility

All functions are exposed globally via `window` object, maintaining full backwards compatibility with:
- Existing script.js code
- HTML onclick handlers
- Legacy function calls

## Testing Checklist

- [ ] Verify `calculateAndDisplayHashrate()` runs successfully
- [ ] Check that hashrate displays in the stats widget
- [ ] Confirm throttling prevents excessive calls
- [ ] Test that `formattedHashrate` updates correctly
- [ ] Verify no console errors related to missing dependencies
- [ ] Check that `updateStatsDisplay()` includes hashrate calculation
- [ ] Confirm `updateWidget()` still works properly

## Benefits

1. **Better Organization**: Mining stats logic now in appropriate UI module
2. **Reusability**: Functions can be called from multiple places
3. **Maintainability**: Clear separation of concerns
4. **Performance**: Throttling prevents excessive RPC calls
5. **Type Safety**: Well-documented function signatures
6. **Error Handling**: Graceful fallbacks for failed calculations

## Related Files

- `/js/ui.js` - Contains all mining stats functions
- `/js/main.js` - Exposes functions globally
- `/js/config.js` - Provides `ProofOfWorkAddresss`
- `/js/settings.js` - Provides `customRPC`
- `/script.js` - Original location (can be deprecated)
