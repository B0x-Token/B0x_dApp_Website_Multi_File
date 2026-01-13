# getMaxCreatePosition Function Extraction

## Summary

The `getMaxCreatePosition()` function has been extracted from `script.js` and added to the `positions-ratio.js` module.

## What This Function Does

The `getMaxCreatePosition()` function calculates the maximum token amounts that can be deposited when creating a new liquidity position, based on:

1. **Wallet Balances** - Gets available 0xBTC and B0x balances
2. **Current Price Ratio** - Fetches the current pool price ratio
3. **Token Selection** - Determines which tokens are selected (TokenA and TokenB)
4. **Balance Validation** - Ensures calculated amounts don't exceed wallet balances
5. **Input Field Updates** - Sets the calculated max amounts in the create section inputs

## Implementation Details

### Location
- **File:** `/js/positions-ratio.js`
- **Lines:** 898-1166 (268 lines)

### Function Flow

```
1. Connect wallet if not connected
2. Get selected tokens from dropdowns (TokenA and TokenB)
3. Get wallet balances for both tokens
4. Fetch current price ratio (throttled)
5. Calculate optimal amounts based on:
   - If TokenA is 0xBTC: Calculate B0x amount needed
   - If TokenA is B0x: Calculate 0xBTC amount needed
6. Validate against wallet balances:
   - If 0xBTC amount exceeds wallet: Recalculate using available 0xBTC
   - If B0x amount exceeds wallet: Recalculate using available B0x
7. Update input fields with max amounts
```

### Key Calculations

**For 0xBTC as TokenA:**
```javascript
if (BigInt(Address_ZEROXBTC_TESTNETCONTRACT) > BigInt(tokenAddresses['B0x'])) {
    priceIn18Decimals = (10n ** 36n) / (calculatedPriceRatio * (10n ** 10n));
    const amountZer0XIn18Decimals = BigInt(amountAtoCreate) * 10n ** 10n;
    amountToDeposit = (amountZer0XIn18Decimals * priceIn18Decimals) / (10n ** 18n);
} else {
    const amountZer0XIn18Decimals = BigInt(amountAtoCreate) * 10n ** 10n;
    priceIn18Decimals = calculatedPriceRatio / (10n ** 10n);
    amountToDeposit = (amountZer0XIn18Decimals * priceIn18Decimals) / (10n ** 18n);
}
```

**For B0x as TokenA:**
```javascript
if (BigInt(Address_ZEROXBTC_TESTNETCONTRACT) > BigInt(tokenAddresses['B0x'])) {
    adjustedPriceRatio = (10n ** 36n) / (priceRatio2 * (10n ** 10n));
    amountAtoCreate = (amountB0x * (10n ** 18n)) / adjustedPriceRatio / (10n ** 10n);
} else {
    amountB0x = (b0xInput * 10n ** 28n) / priceRatio / 10n ** 10n;
    amountAtoCreate = b0xInput;
}
```

### Balance Validation Logic

**Step 1: Check 0xBTC Balance**
```javascript
if (parseFloat(zeroxbtcdecimal) > parseFloat(wallet_zeroxbtc)) {
    console.log("too much 0xbtc u dont have lower it!.");
    // Recalculate using available 0xBTC balance
    amountWith8Decimals0xBTC = BigInt(wallet_zeroxbtc);
    // Recalculate B0x amount based on available 0xBTC
}
```

**Step 2: Check B0x Balance**
```javascript
if (parseFloat(b0xdecimal) > parseFloat(wallet_b0x)) {
    console.log("too much b0x u dont have lower it!.");
    // Recalculate using available B0x balance
    amountToDeposit = BigInt(wallet_b0x);
    // Recalculate 0xBTC amount based on available B0x
}
```

## Integration

### Called By
- `max-buttons.js` - MAX button handlers for create section (Amount A and Amount B)
- Available via `window.getMaxCreatePosition()`

### Dependencies
- `config.js` - tokenAddresses, Address_ZEROXBTC_TESTNETCONTRACT, HookAddress, tokenAddress
- `wallet.js` - connectWallet()
- `window.walletBalances` - Wallet token balances
- `window.ratioz` - Current price ratio
- `window.Current_getsqrtPricex96` - Current sqrt price
- `throttledGetSqrtRtAndPriceRatio()` - Price ratio fetching

### Exports
```javascript
// ES6 Export
export { getMaxCreatePosition };

// Window Export
window.getMaxCreatePosition = getMaxCreatePosition;
```

## Token Decimals Handling

- **0xBTC:** 8 decimals
- **B0x:** 18 decimals
- **Price Ratio:** 29 decimals (after sqrt conversion)

The function handles conversions between these different decimal precisions using BigInt arithmetic for maximum precision.

## Error Handling

```javascript
try {
    // Log all calculated values
    console.log("tokenAddress: ", tokenAddress);
    console.log("amountToDepositBN: ", amountToDepositBN.toString());
    console.log("amountToDepositBN2: ", amountToDepositBN2.toString());

    // Update input fields
    if (tokenAinputAddress == Address_ZEROXBTC_TESTNETCONTRACT) {
        amountInputB.value = ethers.utils.formatUnits(amountToDeposit, 18);
        amountInputA.value = ethers.utils.formatUnits(amountWith8Decimals0xBTC, 8);
    } else {
        amountInputB.value = ethers.utils.formatUnits(amountWith8Decimals0xBTC, 8);
        amountInputA.value = ethers.utils.formatUnits(amountToDeposit, 18);
    }
} catch (error) {
    console.error(`Error in getMaxCreatePosition:`, error);
}
```

## Testing Checklist

- [ ] **MAX Button - Create Amount A:** Clicking sets correct max amounts
- [ ] **MAX Button - Create Amount B:** Clicking sets correct max amounts
- [ ] **0xBTC as TokenA:** Calculates B0x amount correctly
- [ ] **B0x as TokenA:** Calculates 0xBTC amount correctly
- [ ] **Insufficient 0xBTC:** Adjusts to use available balance
- [ ] **Insufficient B0x:** Adjusts to use available balance
- [ ] **Price Ratio Fetching:** Throttled correctly (2 second delay)
- [ ] **Input Field Updates:** Values are formatted correctly
- [ ] **Console Logging:** Debug logs show correct calculations

## Files Modified

1. **`/js/positions-ratio.js`**
   - Added `getMaxCreatePosition()` function (lines 898-1166)
   - Added window export (line 1179)
   - Added ES6 export (line 1194)
   - Updated from 917 lines to 1198 lines

2. **`/home/ti/Documents/B0x-Website-main/RATIO_FUNCTIONS_EXTRACTION.md`**
   - Updated to include `getMaxCreatePosition()` in function list
   - Updated line count from 1020 to 1198

3. **`/home/ti/Documents/B0x-Website-main/MAX_BUTTONS_EXTRACTION.md`**
   - Updated dependencies to note `getMaxCreatePosition` is from positions-ratio.js

## Benefits

✅ **Centralized Logic** - All position ratio calculations in one module
✅ **Proper Exports** - Available via both ES6 imports and window object
✅ **Balance Validation** - Prevents users from entering amounts they don't have
✅ **BigInt Precision** - Accurate calculations for different token decimals
✅ **Throttled Fetching** - Prevents excessive RPC calls
✅ **Comprehensive Logging** - Debug-friendly with detailed console logs

## Related Functions

- `getRatioCreatePositiontokenA()` - Calculates TokenB from TokenA input
- `getRatioCreatePositiontokenB()` - Calculates TokenA from TokenB input
- `handleMaxButtonClick()` - MAX button handler for increase section
- `handleMaxButtonClickStakeIncrease()` - MAX button handler for stake increase

All these functions work together to provide a complete position creation and management experience.
