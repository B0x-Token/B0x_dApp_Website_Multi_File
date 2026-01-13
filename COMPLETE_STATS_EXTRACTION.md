# Complete Mining Stats Extraction - Summary

## Date: January 13, 2026

## Overview
Extracted **ALL** mining and price stats functions from `script.js` and integrated them into the `ui.js` module. This includes price fetching, difficulty calculation, reward data, and comprehensive stats display functions.

## Extracted Functions

### 1. **Price Functions**

#### `fetchPriceData()`
- **Purpose**: Fetches WETH and 0xBTC prices from CoinGecko API
- **Returns**: `{ wethPriceUSD, oxbtcPriceUSD }`
- **Updates**: `window.wethPriceUSD` and `window.oxbtcPriceUSD`
- **Throttling**: Called with 120-second cache in GetRewardAPY

#### `calculateB0xPrice()`
- **Purpose**: Calculates B0x to 0xBTC ratio and USD price using swap contract
- **Returns**: `{ ratioB0xTo0xBTC, usdCostB0x }`
- **Method**: Calls getOutput on swap contract with 1 B0x to get 0xBTC amount
- **Updates**: Module-level `ratioB0xTo0xBTC` and `usdCostB0x` variables

### 2. **Mining Difficulty Functions**

#### `getTarget(provider)`
- **Purpose**: Fetches mining target from contract
- **Contract Function**: `miningTarget()`
- **Returns**: Mining target as string

#### `getDifficulty(provider)`
- **Purpose**: Calculates mining difficulty from target
- **Formula**: `difficulty = (2^253 / target) / 524,288`
- **Side Effect**: Updates `#difficulty-input` DOM element if it exists
- **Returns**: Difficulty as string

### 3. **Contract Data Functions**

#### `getEpochCount(provider)`
- **Purpose**: Fetches current epoch count
- **Contract Function**: `epochCount()`
- **Returns**: Epoch count as string

#### `getAvgRewardTime(provider)`
- **Purpose**: Fetches inflation and time data
- **Contract Function**: `inflationMined()`
- **Returns**: Object with:
  - `YearlyInflation`
  - `EpochsPerYear`
  - `RewardsAtTime` (reward per solve)
  - `TimePerEpoch` (average block time in seconds)

#### `getRewardPerSolve(provider)`
- **Purpose**: Gets current reward per block solve
- **Method**: Extracts from inflationMined data
- **Returns**: Reward per solve as number (in B0x tokens)
- **Fallback**: Returns 50 if error occurs

#### `getBlocksToReadjust(provider)`
- **Purpose**: Gets blocks remaining until difficulty adjustment
- **Contract Function**: `blocksToReadjust()`
- **Returns**: Blocks count as string

#### `getTimeEmergency(provider)`
- **Purpose**: Gets time until emergency difficulty adjustment
- **Contract Function**: `seconds_Until_adjustmentSwitch()`
- **Returns**: Seconds as string

#### `getRewardEra(provider)`
- **Purpose**: Gets current reward era (0-54)
- **Contract Function**: `rewardEra()`
- **Returns**: Era number as string

#### `getTokenHolders()`
- **Purpose**: Gets token holder count
- **Current**: Returns placeholder value 1000
- **TODO**: Integrate with actual token holder API

### 4. **Comprehensive Stats Functions**

#### `updateAllMiningStats()`
- **Purpose**: Master function that fetches ALL stats data
- **Process**:
  1. Fetches price data from CoinGecko
  2. Fetches difficulty, epoch count, inflation data in parallel
  3. Calculates B0x price using swap contract
  4. Calculates hashrate
  5. Aggregates all data into stats object
  6. Calls `updateMiningStatsDisplay()` to update DOM
- **Returns**: Comprehensive stats object
- **Error Handling**: Returns null on error

#### `updateMiningStatsDisplay(stats)`
- **Purpose**: Updates all DOM elements with stats data
- **Updates**:
  - `.stat-value-price` - B0x USD price
  - `.stat-value-stakeAPY` - Staking APY percentage
  - `.stat-value-difficulty` - Mining difficulty
  - `.stat-value-hashrate` - Network hashrate
  - `.stat-value-averageRewardTime` - Time per block
  - `.stat-value-rewardPerSolve` - Reward per block
  - `.stat-value-tokenHolders` - Token holder count

### 5. **Hashrate Functions** (Previously Added)

#### `calculateHashrate(timePerEpoch, miningDifficulty)`
- **Formula**: `hashrate = (2^22 * difficulty / 524,288) / timePerEpoch`
- **Returns**: Hashrate in H/s

#### `formatHashrate(hashrate)`
- **Purpose**: Formats hashrate with appropriate unit
- **Units**: H/s, KH/s, MH/s, GH/s, TH/s, PH/s, EH/s
- **Returns**: Formatted string like "1.23 TH/s"

#### `calculateAndDisplayHashrate()`
- **Purpose**: Fetches data and calculates hashrate
- **Throttling**: Only runs once every 120 seconds
- **Side Effect**: Updates `#hashrate` DOM element
- **Updates**: Module-level `formattedHashrate` variable

## Integration Points

### In `updateStatsDisplay(stats)`
The main stats display function now calls the comprehensive stats update:

```javascript
// Update all mining and price stats
try {
    await updateAllMiningStats();
    console.log('✓ All mining stats calculated and displayed');
} catch (statsError) {
    console.warn('Failed to calculate all mining stats:', statsError);
    // Fallback to just hashrate if comprehensive update fails
    try {
        await calculateAndDisplayHashrate();
    } catch (hashrateError) {
        console.warn('Failed to calculate hashrate:', hashrateError);
    }
}
```

### Stats Object Structure

The `updateAllMiningStats()` function returns a comprehensive stats object:

```javascript
{
    price: 0.0123,                  // B0x price in USD
    wethPriceUSD: 3000,            // WETH price in USD
    oxbtcPriceUSD: 0.01,           // 0xBTC price in USD
    ratioB0xTo0xBTC: 1.2,          // B0x to 0xBTC exchange rate
    apy: 45.67,                    // Staking APY percentage
    difficulty: 123456.78,         // Mining difficulty
    hashrate: "1.23 TH/s",         // Formatted hashrate
    avgRewardTime: 45.5,           // Seconds per block
    rewardPerSolve: 50.25,         // B0x tokens per block
    epochCount: 12345,             // Current epoch
    blocksToReadjust: 500,         // Blocks until difficulty adjustment
    timeEmergency: 86400,          // Seconds until emergency adjustment
    rewardEra: 3,                  // Current reward era (0-54)
    tokenHolders: 1000             // Token holder count
}
```

## Global Exposure (main.js)

All functions are exposed globally for backwards compatibility:

```javascript
// Price and stats functions
window.fetchPriceData = UI.fetchPriceData;
window.calculateB0xPrice = UI.calculateB0xPrice;
window.getTarget = UI.getTarget;
window.getDifficulty = UI.getDifficulty;
window.getEpochCount = UI.getEpochCount;
window.getAvgRewardTime = UI.getAvgRewardTime;
window.getRewardPerSolve = UI.getRewardPerSolve;
window.getBlocksToReadjust = UI.getBlocksToReadjust;
window.getTimeEmergency = UI.getTimeEmergency;
window.getRewardEra = UI.getRewardEra;
window.getTokenHolders = UI.getTokenHolders;
window.updateAllMiningStats = UI.updateAllMiningStats;
window.updateMiningStatsDisplay = UI.updateMiningStatsDisplay;

// Price variables (reactive)
Object.defineProperty(window, 'ratioB0xTo0xBTC', {
    get: () => UI.ratioB0xTo0xBTC,
    set: (val) => { UI.ratioB0xTo0xBTC = val; }
});
Object.defineProperty(window, 'usdCostB0x', {
    get: () => UI.usdCostB0x,
    set: (val) => { UI.usdCostB0x = val; }
});
```

## What's Included Now

✅ **Price Data**
- CoinGecko API integration for WETH and 0xBTC prices
- B0x price calculation from swap contract
- Automatic calculation of B0x USD value

✅ **Mining Difficulty**
- Mining target fetch
- Difficulty calculation from target
- Proper formula application

✅ **Hashrate Calculation**
- Time per epoch fetch
- Mining difficulty integration
- Formatted hashrate display

✅ **Reward Data**
- Average reward time (seconds per block)
- Reward per solve (B0x tokens per block)
- Reward era tracking

✅ **APY Display**
- Integration with staking.js APYFINAL variable
- Display in stats

✅ **Additional Stats**
- Epoch count
- Blocks to readjust
- Emergency adjustment time
- Token holders (placeholder)

## What Was NOT Migrated

**`updateAllMinerInfo()`** - This extremely large function (~400+ lines) remains in script.js because:
- Complex mining transaction parsing
- LocalStorage and remote data synchronization
- Rich list and distribution chart updates
- Many global dependencies

It can be migrated later to a dedicated `miner-stats.js` module if needed.

## API Integrations

### CoinGecko API
```javascript
const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=weth,oxbitcoin&vs_currencies=usd');
const data = await response.json();
// Returns: { weth: { usd: 3000 }, oxbitcoin: { usd: 0.01 } }
```

### Swap Contract
```javascript
const result = await tokenSwapperContract.callStatic.getOutput(
    tokenAddresses['0xBTC'],    // Token A
    tokenAddresses['B0x'],      // Token B
    tokenInputAddress,          // Token In (B0x)
    hookAddress,                // Hook
    BigInt(10 ** 18)           // Amount In (1 B0x)
);
// Returns amount of 0xBTC for 1 B0x
```

## Performance Optimizations

1. **Parallel Fetching**: All independent contract calls run in parallel using `Promise.all()`
2. **Throttling**: Price fetches cached for 120 seconds to avoid rate limits
3. **Hashrate Caching**: Hashrate only recalculated every 120 seconds
4. **Error Handling**: Graceful fallbacks if any stat fails to fetch

## Testing Checklist

- [ ] Verify `updateAllMiningStats()` fetches all data successfully
- [ ] Check that all DOM elements update with correct values
- [ ] Confirm price data fetches from CoinGecko
- [ ] Test B0x price calculation from swap contract
- [ ] Verify difficulty calculation is correct
- [ ] Check hashrate displays properly
- [ ] Confirm reward per solve shows correct value
- [ ] Test APY displays from staking data
- [ ] Verify all functions exposed globally
- [ ] Check backwards compatibility with existing code
- [ ] Test error handling and fallbacks
- [ ] Verify no console errors

## Usage Example

```javascript
// Manual update of all stats
const stats = await updateAllMiningStats();
console.log('Current B0x price:', stats.price);
console.log('Network hashrate:', stats.hashrate);
console.log('Staking APY:', stats.apy);

// Individual stat fetches
const provider = new ethers.providers.JsonRpcProvider(customRPC);
const difficulty = await getDifficulty(provider);
const epochCount = await getEpochCount(provider);

// Price data
const priceData = await fetchPriceData();
console.log('WETH price:', priceData.wethPriceUSD);
console.log('0xBTC price:', priceData.oxbtcPriceUSD);

// B0x price
const b0xPrice = await calculateB0xPrice();
console.log('B0x to 0xBTC ratio:', b0xPrice.ratioB0xTo0xBTC);
console.log('B0x USD price:', b0xPrice.usdCostB0x);
```

## Benefits

1. **Complete Stats Coverage**: All mining, price, and reward stats in one module
2. **Automatic Updates**: `updateStatsDisplay()` now updates everything
3. **Better Organization**: All stats logic in ui.js instead of scattered in script.js
4. **Parallel Fetching**: Efficient data retrieval with Promise.all
5. **Error Resilience**: Graceful fallbacks if any stat fails
6. **Backwards Compatible**: All functions available globally
7. **Well Documented**: Clear JSDoc comments for all functions
8. **Maintainable**: Clear separation of concerns

## Next Steps

1. **Replace Token Holders**: Integrate actual API for token holder count
2. **Add More Stats**: Can add network stats, pool stats, etc.
3. **Optimize Caching**: Could add more sophisticated caching strategies
4. **Extract updateAllMinerInfo**: Consider migrating to miner-stats.js module
5. **Add Unit Tests**: Test all calculation formulas and data fetching

## Related Files

- `/js/ui.js` - Contains all stats functions (2500+ lines)
- `/js/main.js` - Exposes functions globally
- `/js/staking.js` - Provides APYFINAL APY data
- `/js/config.js` - Provides contract addresses
- `/js/settings.js` - Provides customRPC
- `/script.js` - Original location (can now be cleaned up)
