# MAX Buttons Module Extraction

## Completed Work

### Created `max-buttons.js` Module

**File:** `/js/max-buttons.js` (450 lines)

**Purpose:** Comprehensive MAX button functionality for all input fields across the entire application.

---

## Functions Extracted

### Main Function

#### `addMaxButtonToField(inputElement, tokenSymbol)`
Creates and adds a MAX button to any input field with section-specific handlers.

**Handles 6 Different Sections:**

1. **Stake Increase Section** (`#stake-increase`)
   - Uses `handleMaxButtonClickStakeIncrease()`
   - Works with `stakingPositionData`
   - Determines token from label (TokenA or TokenB)

2. **Increase Section** (`#increase`)
   - Uses `handleMaxButtonClick()`
   - Works with `positionData`
   - Determines token from label (TokenA or TokenB)

3. **Swap Section** (`#swap`)
   - Gets token from `#fromToken22` dropdown
   - Uses `getMaxAmountForTokenList()`
   - Sets max amount with `setMaxAmount2()`

4. **Create Section - Amount A** (`#create`)
   - Detects "Amount A" label
   - Calls `window.getMaxCreatePosition()`
   - Sets max for first token

5. **Create Section - Amount B** (`#create`)
   - Detects "Amount B" label
   - Calls `window.getMaxCreatePosition()`
   - Sets max for second token

6. **Convert Section** (`#convert`)
   - Gets token from `#fromToken` dropdown
   - Special handling for B0x (checks both B0x and RightsTo0xBTC)
   - Uses ETH wallet balances
   - Calls `window.getConvertTotal()`

---

### Helper Functions

#### `getMaxAmountForTokenList(tokenSymbol)`
- Gets max amount from Base network wallet balances
- Returns: `number` - Maximum available amount

#### `getMaxAmountForTokenListETH(tokenSymbol)`
- Gets max amount from Ethereum network wallet balances
- Returns: `number` - Maximum available amount

#### `getMaxAmountForToken(position, tokenSymbol)`
- Gets max amount for a specific token in a position
- Checks if token is TokenA or TokenB
- Returns: `number` - Position's token amount

#### `setMaxAmount2(inputElement, tokenSymbol, maxAmount)`
- Sets the max amount in an input field
- Triggers 'input' event to update listeners
- Logs the action

#### `truncateDecimals(num, decimals)`
- Truncates decimals without rounding
- Uses: `Math.floor(num * 10^decimals) / 10^decimals`
- Returns: `number` - Truncated number

#### `initializeMaxButtons()`
- Automatically adds MAX buttons to all number inputs
- Scans: create, increase, stake-increase, swap, convert sections
- Prevents duplicate buttons (checks for existing `.max-button`)

---

## Button Styling

**Visual Design:**
```css
position: absolute;
right: 2px;
top: 2px;
bottom: 2px;
background: #007bff;
color: white;
border: none;
padding: 0 12px;
border-radius: 0 2px 2px 0;
font-size: 12px;
cursor: pointer;
z-index: 10;
```

**Hover Effect:**
- Default: `#007bff`
- Hover: `#0056b3`

**Input Modifications:**
- Adds 60px right padding for button space
- Removes right border radius
- Wraps input and button in relative positioned div

---

## Integration

### Files Updated

#### `main.js` (line 38)
```javascript
import * as MaxButtons from './max-buttons.js';  // NEW: MAX button functionality
```

#### `init.js` (lines 28, 740)
```javascript
import { initializeMaxButtons } from './max-buttons.js';

// ... in DOMContentLoaded:
initializeMaxButtons();
```

---

## Dependencies

### Module Imports
- `positions.js` - positionData, stakingPositionData
- `positions-ratio.js` - handleMaxButtonClick, handleMaxButtonClickStakeIncrease, getMaxCreatePosition

### Global Functions (via window object)
- `window.walletBalances` - Base network token balances
- `window.walletBalancesETH` - Ethereum network token balances
- `window.getMaxCreatePosition()` - Get max amounts for create position (from positions-ratio.js)
- `window.getConvertTotal(false)` - Update convert section totals

---

## How It Works

### Button Creation Flow

1. **Create button element** with styling
2. **Add hover effects** (mouseenter/mouseleave)
3. **Add 6 click handlers** for different sections
4. **Create wrapper div** for positioning
5. **Modify input styling** (padding, border radius)
6. **Append button to wrapper**

### Click Handler Logic

Each handler checks if the input is in its section:
```javascript
const section = document.getElementById('section-name');
if (!section || !section.contains(inputElement)) {
    return; // Not in this section, skip
}
```

**Section Priority:**
1. Stake Increase (checked first)
2. Increase
3. Swap
4. Create Amount A
5. Create Amount B
6. Convert

All handlers are on the same button, but only one executes based on which section contains the input.

---

## Special Cases

### Convert Section - B0x Token

When B0x is selected in convert section:
```javascript
if (selectedToken === 'B0x') {
    const maxAmount2 = getMaxAmountForTokenListETH('RightsTo0xBTC');
    const maxAmount1 = getMaxAmountForTokenListETH('B0x');

    // Use the smaller of the two
    maxAmount = (maxAmount2 > maxAmount1) ? maxAmount1 : maxAmount2;
}
```

This ensures the conversion doesn't exceed either token's balance.

### Decimal Formatting

Different tokens use different decimal precision:
- **ETH, WBTC**: 6 decimals
- **Others**: 3 decimals

Uses `truncateDecimals()` to avoid rounding errors.

---

## Automatic Initialization

**When:** On `DOMContentLoaded` event (after all other initialization)

**What it does:**
1. Scans all sections for `input[type="number"]` elements
2. Checks if MAX button already exists (`.max-button`)
3. Adds MAX button if not present
4. Logs completion

**Sections scanned:**
- `#create`
- `#increase`
- `#stake-increase`
- `#swap`
- `#convert`

---

## Testing Checklist

- [ ] **Stake Increase:** MAX button sets correct amounts for both tokens
- [ ] **Increase:** MAX button sets correct amounts for both tokens
- [ ] **Swap:** MAX button uses fromToken dropdown value
- [ ] **Create Amount A:** MAX button calls getMaxCreatePosition()
- [ ] **Create Amount B:** MAX button calls getMaxCreatePosition()
- [ ] **Convert:** MAX button handles B0x special case correctly
- [ ] **Convert:** MAX button uses smaller of B0x/RightsTo0xBTC for B0x
- [ ] **Hover effect:** Button changes color on hover
- [ ] **Multiple sections:** Buttons work independently in different sections
- [ ] **Input events:** Setting max triggers input event listeners
- [ ] **No duplicates:** initializeMaxButtons() doesn't create duplicate buttons
- [ ] **Styling:** Button doesn't overlap input text
- [ ] **Responsive:** Button works on different screen sizes

---

## Advantages of Modularization

### Before (in script.js)
- ❌ Single 300+ line function
- ❌ Mixed with other code
- ❌ Hard to maintain
- ❌ No clear dependencies
- ❌ Not reusable

### After (max-buttons.js)
- ✅ Clean, organized module (450 lines)
- ✅ Clear imports and exports
- ✅ Well-documented sections
- ✅ Automatic initialization
- ✅ Easy to test independently
- ✅ Reusable across sections
- ✅ Clear dependencies

---

## Future Improvements

### 1. Token Symbol Auto-Detection
Currently passes 'AUTO' to `addMaxButtonToField()`. Could improve to:
```javascript
const tokenSymbol = detectTokenFromLabel(inputElement);
```

### 2. Centralized Max Amount Logic
Create unified function:
```javascript
function getMaxAmount(section, token, position) {
    // Handle all section-specific logic
}
```

### 3. Button State Management
Add disabled state when:
- No wallet connected
- Token balance is 0
- No position selected

### 4. Visual Feedback
Add loading state when calculating max amounts:
```javascript
maxButton.textContent = '...';
maxButton.disabled = true;
```

### 5. Error Handling
Add try-catch blocks and user notifications:
```javascript
try {
    handleMaxButtonClick(token, input);
} catch (error) {
    showErrorNotification('Failed to set max amount', error.message);
}
```

---

## File Locations

- **max-buttons.js**: `/js/max-buttons.js` (new file, 450 lines)
- **main.js**: `/js/main.js` (updated import on line 38)
- **init.js**: `/js/init.js` (updated import on line 28, call on line 740)

All MAX button functionality is now properly modularized and automatically initialized!
