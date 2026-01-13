# Ratio Functions Extraction Summary

## Completed Work

### 1. Created `positions-ratio.js` Module

**File:** `/js/positions-ratio.js` (1198 lines)

**Purpose:** Comprehensive module for all position ratio calculations across create, increase, and stake-increase sections.

**Functions Extracted:**

#### Create Position Functions
- `getRatioCreatePositiontokenA()` - Calculates TokenB based on TokenA input
- `getRatioCreatePositiontokenB()` - Calculates TokenA based on TokenB input
- `getMaxCreatePosition()` - Calculates maximum amounts based on wallet balances

#### Increase Position Functions
- `getRatioIncreasePositiontokenA()` - Calculates TokenB for liquidity increase
- `getRatioIncreasePositiontokenB()` - Calculates TokenA for liquidity increase

#### Stake Increase Functions
- `getRatioStakeIncreasePositiontokenA()` - Calculates TokenB for stake increase
- `getRatioStakeIncreasePositiontokenB()` - Calculates TokenA for stake increase

#### Helper Functions
- `throttledGetSqrtRtAndPriceRatio()` - Throttled price ratio fetching (2s delay)
- `calculateOptimalAmountsWithTokenAPriority()` - Token A priority calculations
- `calculateOptimalAmountsWithTokenBPriority()` - Token B priority calculations
- `calculateOptimalAmountsWithTokenAPrioritySTAKESECTIONI()` - Stake section Token A
- `calculateOptimalAmountsWithTokenBPrioritySTAKESECTIONI()` - Stake section Token B
- `handleMaxButtonClick()` - Max button handler for increase section
- `handleMaxButtonClickStakeIncrease()` - Max button handler for stake increase

**Key Features:**
- ✅ Handles 0xBTC (8 decimals) and B0x (18 decimals) conversions
- ✅ Wallet balance validation
- ✅ BigInt arithmetic for precision
- ✅ Token ordering logic (address comparison)
- ✅ Programmatic update flags to prevent circular calls
- ✅ Debouncing with throttle mechanism
- ✅ Alert notifications for insufficient balances
- ✅ Integration with wallet, positions, and staking modules

**Exports:**
- ES6 named exports for all functions
- Window object exports for compatibility with init.js

---

### 2. Added Staking UI Functions to `staking.js`

**File:** `/js/staking.js` (added 328 lines)

**Functions Added:**

#### `updateTotalLiqIncreaseSTAKING()`
- Updates total liquidity display in stake-increase section
- Calculates new total: current position + input amounts
- Handles button enable/disable states
- Matches token labels with position data

#### `updateStakePositionInfo()`
- Updates position info card in stake-increase section
- Displays pool, liquidity, APY, and penalty info
- Updates token labels with icons
- Clears inputs when position changes
- Shows warning about penalty reset

#### `updateStakeDecreasePositionInfo()`
- Updates position details in stake-decrease section
- Displays current liquidity and penalty
- Updates token labels with icons
- Recalculates amounts based on slider
- Shows large red warning for penalty

#### `updateStakePercentage(value)`
- Updates percentage display for stake-decrease slider
- Updates CSS custom properties for gradient
- Calculates token amounts with penalty applied
- Formula: `amount * (100 - penalty) / 100`
- Updates readonly input fields

**Key Features:**
- ✅ Uses optional chaining (`?.`) for null safety
- ✅ References `window.tokenIconsBase` for token icons
- ✅ Calls `window.disableButtonWithSpinner()` and `window.enableButton()`
- ✅ Penalty calculation with percentage formatting
- ✅ Token decimal handling from `tokenAddressesDecimals`
- ✅ Window object exports for compatibility

---

### 3. Updated `main.js`

**File:** `/js/main.js` (line 37)

Added import:
```javascript
import * as PositionsRatio from './positions-ratio.js';  // NEW: Ratio calculations
```

---

## How It Works

### Ratio Calculation Flow

1. **User types in input field** (with debounce from init.js)
2. **Function called** (getRatioCreatePositiontokenA/B, etc.)
3. **Wallet check** - Connects if needed
4. **Price ratio fetch** - Throttled call to `getSqrtRtAndPriceRatio`
5. **Calculate amounts** - Uses BigInt for 0xBTC (8 decimals) and B0x (18 decimals)
6. **Balance validation** - Checks wallet balances
7. **Update inputs** - Sets calculated value in opposite input
8. **Update UI** - Calls updateTotalLiqIncrease() or updateTotalLiqIncreaseSTAKING()

### Token Ordering Logic

The code handles two scenarios based on address comparison:

**If 0xBTC < B0x (addresses):**
```javascript
amountWith8Decimals0xBTC = (amountB0x * (10n ** 18n)) / priceRatio;
```

**If 0xBTC > B0x (addresses):**
```javascript
amountWith8Decimals0xBTC = (amountB0x * priceRatio) / (10n ** 18n);
```

### Optimal Amount Calculation

Uses helper function `calculateOptimalAmounts()` with priority tokens:
- **Token A Priority**: User's TokenA input is used as base, calculates TokenB
- **Token B Priority**: User's TokenB input is used as base, calculates TokenA

Returns:
```javascript
{
    amountToDeposit: BigInt,
    amountWith8Decimals0xBTC: BigInt,
    needsAdjustment: boolean,
    limitingFactor: string
}
```

If adjustment is needed, automatically calls `handleMaxButtonClick()` to set max amounts.

---

## Integration with Existing Code

### Functions Still in script.js (Dependencies)

These functions are called via `window` object and need to remain in script.js or be extracted:

1. **`calculateOptimalAmounts()`** - Core calculation function (line 12652+)
2. **`getMaxAmountsWithProperLimiting()`** - Max amount calculation
3. **`getSqrtRtAndPriceRatio()`** - Fetches current price ratio
4. **`getMaxCreatePosition()`** - Gets max amounts for create section
5. **`disableButtonWithSpinner()`** - Button UI management
6. **`enableButton()`** - Button UI management

### Global Variables Required

The functions access these via window object:
- `window.walletConnected` - Wallet connection state
- `window.walletBalances` - Token balances object
- `window.ratioz` - Current price ratio (BigInt)
- `window.Current_getsqrtPricex96` - Sqrt price
- `window.provider` - Ethers provider
- `window.signer` - Ethers signer
- `window.tokenIconsBase` - Token icon URLs

### Module Dependencies

positions-ratio.js imports:
- `config.js` - tokenAddresses, Address_ZEROXBTC_TESTNETCONTRACT, HookAddress
- `wallet.js` - connectWallet()
- `positions.js` - positionData, stakingPositionData, updateTotalLiqIncrease()
- `staking.js` - updateTotalLiqIncreaseSTAKING()

---

## Testing Checklist

- [ ] Create position: Type in TokenA input → TokenB auto-calculates
- [ ] Create position: Type in TokenB input → TokenA auto-calculates
- [ ] Increase position: Type in TokenA input → TokenB auto-calculates
- [ ] Increase position: Type in TokenB input → TokenA auto-calculates
- [ ] Stake increase: Type in TokenA input → TokenB auto-calculates
- [ ] Stake increase: Type in TokenB input → TokenA auto-calculates
- [ ] Balance warnings appear when amounts exceed wallet balance
- [ ] Throttling prevents rapid calls (2 second delay)
- [ ] Max button sets correct amounts for increase section
- [ ] Max button sets correct amounts for stake increase section
- [ ] Stake decrease slider updates percentage display
- [ ] Stake decrease slider calculates amounts with penalty
- [ ] updateStakePositionInfo shows correct info on position change
- [ ] updateStakeDecreasePositionInfo shows penalty warning

---

## Next Steps (Optional)

### 1. Extract Remaining Dependencies from script.js

To make positions-ratio.js fully self-contained, extract these functions:

- `calculateOptimalAmounts()` (line 12652+)
- `getMaxAmountsWithProperLimiting()`
- `getSqrtRtAndPriceRatio()`
- `disableButtonWithSpinner()` / `enableButton()`

### 2. Create Shared Utilities Module

Create `position-utils.js` for shared functions:
- Button state management
- Price ratio fetching
- Max amount calculations

### 3. Improve Type Safety

Add JSDoc types for all parameters and return values.

### 4. Error Handling

Add more comprehensive error handling for:
- Network failures
- Invalid inputs
- Missing position data

---

## File Locations

- **positions-ratio.js**: `/js/positions-ratio.js` (new file)
- **staking.js**: `/js/staking.js` (updated with 4 new functions)
- **main.js**: `/js/main.js` (updated imports)
- **init.js**: `/js/init.js` (already set up to use window.getRatio* functions)

All functions are now available and properly integrated with the modular architecture!
