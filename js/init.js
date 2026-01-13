/**
 * @module init
 * @description Application initialization and event listeners
 *
 * Handles:
 * - DApp initialization
 * - Event listener setup
 * - Tab management
 * - URL routing
 */

// Import all modules
import { initializeChart, fetchPriceData, pricesLoaded } from './charts.js';
import { checkWalletConnection, setupWalletListeners, connectWallet, disconnectWallet } from './wallet.js';
import {
    switchTab, switchTab2, switchTabForStats, updateLoadingStatus, showLoadingScreen, hideLoadingScreen,
    initNotificationWidget, updateTokenIcon, updateTokenSelection, updatePositionDropdown,
    displayWalletBalances, updatePositionInfoMAIN_UNSTAKING
} from './ui.js';
import * as Settings from './settings.js';
import { mainRPCStarterForPositions, isLatestSearchComplete } from './data-loader.js';
import * as Staking from './staking.js';
import * as Positions from './positions.js';
import * as Swaps from './swaps.js';
import * as Convert from './convert.js';
import { renderContracts, displayNetworkStatus } from './contracts.js';
import { positionData, stakingPositionData, updatePositionInfo, updateTotalLiqIncrease, updateDecreasePositionInfo, updatePercentage } from './positions.js';
import { updateStakingStats, populateStakingManagementData } from './staking.js';
import { initializeMaxButtons } from './max-buttons.js';
// ============================================
// MAIN INITIALIZATION
// ============================================

/**
 * Initializes the B0x DApp
 * Main entry point called on page load
 * @async
 * @returns {Promise<void>}
 */
export async function initializeDApp() {
    console.log('🚀 Initializing B0x DApp...');
        showLoadingScreen();
        updateLoadingStatus('Connecting to blockchain...');

    try {
        // Initialize notification widget
        initNotificationWidget();
        console.log('✓ Notification widget initialized');

        // Load settings from localStorage
        await Settings.loadSettings();
        console.log('✓ Settings loaded');

        // Check for existing wallet connection
        await checkWalletConnection();
        console.log('✓ Wallet connection checked');


        updateLoadingStatus('Loading smart contracts...');

        await new Promise(resolve => setTimeout(resolve, 500));


        // Initialize chart (with error handling)
        try {
            await initializeChart(Settings.loadSettings, Settings.customDataSource, Settings.customBACKUPDataSource);
            console.log('✓ Chart initialized');
        } catch (chartError) {
            console.warn('Chart initialization failed:', chartError);
        }

        updateLoadingStatus('Fetching data...');

        await new Promise(resolve => setTimeout(resolve, 500));
        // Initialize staking stats UI
        Staking.updateStakingStats();

        // Start position monitoring (delayed to allow page to render)
        setTimeout(async () => {
            try {
                await mainRPCStarterForPositions();
                console.log('✓ Position monitoring started');
            } catch (posError) {
                console.warn('Position monitoring failed:', posError);
            }
        }, 500);

        updateLoadingStatus('Initializing interface...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Display network status
        await displayNetworkStatus();

        console.log('✅ DApp initialized successfully');


        var x=0
       while(!pricesLoaded && x < 120){
        x++;
                if(x > 12){
                    updateLoadingStatus('Loading price graphs..2. takes up to 30-60 seconds if main server is down');

                }else{

                    updateLoadingStatus('Loading price graphs...');
                }
                
            await new Promise(resolve => setTimeout(resolve, 500));
        }


        var xx=0
       while(!isLatestSearchComplete() && xx < 180){
        xx++;
                if(xx > 12){
                    updateLoadingStatus('Loading latest blockchain data..2. takes up to 30-90 seconds if main server is down');

                }else{

                    updateLoadingStatus('Loading blockchain data...');
                }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if(xx<180 && x<120){
            updateLoadingStatus('Absolutely Ready!');
            await new Promise(resolve => setTimeout(resolve, 500));

        }else{
            updateLoadingStatus('Ready, although took max time to get data!');
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        hideLoadingScreen();


    } catch (error) {
        console.error('❌ DApp initialization error:', error);
    }
}

// ============================================
// EVENT LISTENER SETUP
// ============================================

/**
 * Sets up all event listeners for the application
 * @returns {void}
 */
export function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Wallet connection buttons
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            await connectWallet();
        });
    }

    const disconnectBtn = document.getElementById('disconnectBtn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            disconnectWallet();
        });
    }

    // Swap button
    const swapBtn = document.getElementById('swapBtn');
    if (swapBtn) {
        swapBtn.addEventListener('click', async () => {
            await Swaps.getSwapOfTwoTokens();
        });
    }

    // Get estimate button
    const estimateBtn = document.getElementById('getEstimateBtn');
    if (estimateBtn) {
        estimateBtn.addEventListener('click', async () => {
            await Swaps.getEstimate();
        });
    }

    // Convert section event listeners
    const convertInput = document.querySelector('#convert .form-group:nth-child(5) input');
    if (convertInput) {
        convertInput.addEventListener('input', async () => {
            await Convert.getConvertTotal(false);
        });
    }

    const convertFromSelect = document.querySelector('#convert .form-group:nth-child(4) select');
    if (convertFromSelect) {
        convertFromSelect.addEventListener('change', async () => {
            await Convert.getConvertTotal(false);
        });
    }

    const convertToSelect = document.querySelector('#convert .form-group:nth-child(7) select');
    if (convertToSelect) {
        convertToSelect.addEventListener('change', async () => {
            await Convert.getConvertTotal(false);
        });
    }

    // Position management buttons
    const increaseLiqBtn = document.getElementById('increaseLiquidityBtn');
    if (increaseLiqBtn) {
        increaseLiqBtn.addEventListener('click', async () => {
            await Positions.increaseLiquidity();
        });
    }

    const decreaseLiqBtn = document.getElementById('decreaseLiquidityBtn');
    if (decreaseLiqBtn) {
        decreaseLiqBtn.addEventListener('click', async () => {
            await Positions.decreaseLiquidity();
        });
    }

    // Staking buttons
    const depositNFTBtn = document.getElementById('depositNFTStakeBtn');
    if (depositNFTBtn) {
        depositNFTBtn.addEventListener('click', async () => {
            await Staking.depositNFTStake();
        });
    }

    const collectRewardsBtn = document.getElementById('collectRewardsBtn');
    if (collectRewardsBtn) {
        collectRewardsBtn.addEventListener('click', async () => {
            await Staking.collectRewards();
        });
    }

    // Load More Blocks button (stats page pagination)
    const loadMoreBlocksBtn = document.getElementById('blocks-load-more-btn');
    if (loadMoreBlocksBtn) {
        loadMoreBlocksBtn.addEventListener('click', () => {
            if (typeof window.loadMoreBlocks === 'function') {
                window.loadMoreBlocks();
            }
        });
    }

    console.log('✓ Event listeners set up');
}

// ============================================
// TAB MANAGEMENT
// ============================================

/**
 * Initializes tab from URL parameter
 * @returns {void}
 */
export function initializeTabFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    if (tab) {
        console.log('Initializing tab from URL:', tab);
        // Trigger tab switch based on URL parameter
        const tabElement = document.querySelector(`[data-tab="${tab}"]`);
        if (tabElement) {
            tabElement.click();
        }
    }
}

/**
 * Initializes tab from direct parameter
 * @returns {void}
 */
export function initializeTabFromDirectParam() {
    // Check for direct tab parameter in hash
    const hash = window.location.hash;
    if (hash && hash.startsWith('#tab=')) {
        const tab = hash.replace('#tab=', '');
        console.log('Initializing tab from hash:', tab);

        const tabElement = document.querySelector(`[data-tab="${tab}"]`);
        if (tabElement) {
            tabElement.click();
        }
    }
}

/**
 * Updates URL with current tab
 * @param {string} tabName - Tab name
 * @returns {void}
 */
export function updateURL(tabName) {
    if (!tabName) return;

    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    window.history.pushState({}, '', url);
}

/**
 * Sets responsive padding
 * @returns {void}
 */
export function setPadding() {
    // Responsive layout adjustments
    const mainContent = document.querySelector('.main-content');
    if (mainContent && window.innerWidth < 768) {
        mainContent.style.paddingTop = '60px';
    }
}

// ============================================
// DOM LISTENERS SETUP
// ============================================

/**
 * Sets up all DOM event listeners for position management, sliders, and input fields
 * Includes debounced input handlers for create, increase, and stake-increase sections
 * @returns {void}
 */
export function setupDOMListeners() {
    console.log('Setting up DOM listeners for positions and inputs...');

    // ========================================
    // POSITION SELECTORS
    // ========================================

    // Regular position increase selector
    const positionSelect = document.querySelector('#increase select');
    if (positionSelect) {
        positionSelect.innerHTML = '';
        Object.values(positionData).forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = `${position.pool} - ${position.feeTier} - Position #${position.id.split('_')[1]}`;
            positionSelect.appendChild(option);
        });

        positionSelect.addEventListener('change', updatePositionInfo);
        positionSelect.addEventListener('change', updateTotalLiqIncrease);
        updatePositionInfo();
    }

    // Regular position decrease selector
    const decreasePositionSelect = document.querySelector('#decrease select');
    if (decreasePositionSelect) {
        decreasePositionSelect.innerHTML = '';
        Object.values(positionData).forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = `${position.pool} - ${position.feeTier} - Position #${position.id.split('_')[1]}`;
            decreasePositionSelect.appendChild(option);
        });

        decreasePositionSelect.addEventListener('change', updateDecreasePositionInfo);
        updateDecreasePositionInfo();
    }

    // Staking main page withdraw NFT selector
    const positionSelectMainPageWithdrawNFT = document.querySelector('#staking-main-page .form-group2 select');
    if (positionSelectMainPageWithdrawNFT) {
        positionSelectMainPageWithdrawNFT.innerHTML = '';
        Object.values(stakingPositionData).forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = `${position.pool} - ${position.feeTier} - Stake Position #${position.id.split('_')[2]}`;
            positionSelectMainPageWithdrawNFT.appendChild(option);
        });

        positionSelectMainPageWithdrawNFT.addEventListener('change', updatePositionInfoMAIN_UNSTAKING);
        updatePositionInfoMAIN_UNSTAKING();
    }

    // Stake increase position selector
    const stakePositionSelect = document.querySelector('#stake-increase select');
    if (stakePositionSelect) {
        stakePositionSelect.innerHTML = '';
        Object.values(stakingPositionData).forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = `${position.pool} - ${position.feeTier} - Stake Position #${position.id.split('_')[2]}`;
            stakePositionSelect.appendChild(option);
        });

        if (typeof window.updateStakePositionInfo === 'function') {
            stakePositionSelect.addEventListener('change', window.updateStakePositionInfo);
            window.updateStakePositionInfo();
        }
    }

    // Stake decrease position selector
    const stakeDecreasePositionSelect = document.querySelector('#stake-decrease select');
    if (stakeDecreasePositionSelect) {
        stakeDecreasePositionSelect.innerHTML = '';
        Object.values(stakingPositionData).forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = `${position.pool} - ${position.feeTier} - Stake Position #${position.id.split('_')[2]}`;
            stakeDecreasePositionSelect.appendChild(option);
        });

        if (typeof window.updateStakeDecreasePositionInfo === 'function') {
            stakeDecreasePositionSelect.addEventListener('change', window.updateStakeDecreasePositionInfo);
            window.updateStakeDecreasePositionInfo();
        }
    }

    // ========================================
    // SLIDERS
    // ========================================

    // Decrease section slider
    const decreaseSlider = document.querySelector('#decrease .slider');
    if (decreaseSlider) {
        decreaseSlider.addEventListener('input', function () {
            updatePercentage(this.value);
        });
        decreaseSlider.addEventListener('change', function () {
            updatePercentage(this.value);
        });
        decreaseSlider.addEventListener('mouseup', function () {
            updatePercentage(this.value);
        });
    }

    // Stake decrease slider
    const stakeDecreaseSlider = document.querySelector('#stake-decrease .slider');
    if (stakeDecreaseSlider) {
        if (typeof window.updateStakePercentage === 'function') {
            stakeDecreaseSlider.addEventListener('input', function () {
                window.updateStakePercentage(this.value);
            });
            stakeDecreaseSlider.addEventListener('change', function () {
                window.updateStakePercentage(this.value);
            });
            stakeDecreaseSlider.addEventListener('mouseup', function () {
                window.updateStakePercentage(this.value);
            });
        }
    }

    // ========================================
    // INPUT EVENT LISTENERS (REGULAR INCREASE)
    // ========================================

    const ethInput = document.querySelector('#increase .form-row .form-group:first-child input');
    const usdcInput = document.querySelector('#increase .form-row .form-group:last-child input');

    if (ethInput) {
        ethInput.addEventListener('input', updateTotalLiqIncrease);
        updateTotalLiqIncrease();
    }

    if (usdcInput) {
        usdcInput.addEventListener('input', updateTotalLiqIncrease);
    }

    // ========================================
    // STAKE INCREASE INPUT EVENT LISTENERS
    // ========================================

    const ethInput2 = document.querySelector('#stake-increase .form-row .form-group:first-child input');
    const usdcInput2 = document.querySelector('#stake-increase .form-row .form-group:last-child input');

    if (ethInput2 && typeof window.updateTotalLiqIncreaseSTAKING === 'function') {
        ethInput2.addEventListener('input', window.updateTotalLiqIncreaseSTAKING);
        window.updateTotalLiqIncreaseSTAKING();
    }

    if (usdcInput2 && typeof window.updateTotalLiqIncreaseSTAKING === 'function') {
        usdcInput2.addEventListener('input', window.updateTotalLiqIncreaseSTAKING);
    }

    // ========================================
    // DEBOUNCED INPUT LISTENERS - CREATE SECTION
    // ========================================

    const createSection = document.getElementById('create');
    if (createSection) {
        const numberInputs = createSection.querySelectorAll('input[type="number"]');
        const amountAInput = numberInputs[0]; // First input (Amount A)
        const amountBInput = numberInputs[1]; // Second input (Amount B)

        let isUpdating = false;
        let debounceTimerA;
        let debounceTimerB;

        if (amountAInput) {
            amountAInput.addEventListener('input', function () {
                if (isUpdating) return; // Prevent circular updates

                console.log('Create section - Amount A typing:', this.value);

                // Clear previous timer
                clearTimeout(debounceTimerA);

                // Set new timer - only call function after user stops typing for 1200ms
                debounceTimerA = setTimeout(() => {
                    console.log('Create section - Amount A final value:', this.value);
                    isUpdating = true;

                    if (typeof window.getRatioCreatePositiontokenA === 'function') {
                        window.getRatioCreatePositiontokenA();
                    } else {
                        console.log('getRatioCreatePositiontokenA function not available');
                    }

                    // Reset the updating flag after processing
                    setTimeout(() => {
                        isUpdating = false;
                    }, 50);
                }, 1200);
            });
        }

        if (amountBInput) {
            amountBInput.addEventListener('input', function () {
                if (isUpdating) return; // Prevent circular updates

                console.log('Create section - Amount B typing:', this.value);

                // Clear previous timer
                clearTimeout(debounceTimerB);

                // Set new timer - only call function after user stops typing for 1200ms
                debounceTimerB = setTimeout(() => {
                    console.log('Create section - Amount B final value:', this.value);
                    isUpdating = true;

                    if (typeof window.getRatioCreatePositiontokenB === 'function') {
                        window.getRatioCreatePositiontokenB();
                    } else {
                        console.log('getRatioCreatePositiontokenB function not available');
                    }

                    // Reset the updating flag after processing
                    setTimeout(() => {
                        isUpdating = false;
                    }, 50);
                }, 1200);
            });
        }
    }

    // ========================================
    // DEBOUNCED INPUT LISTENERS - INCREASE SECTION
    // ========================================

    let isProgrammaticUpdate = false;
    let isProgrammaticUpdateB = false;

    const increase = document.getElementById('increase');
    if (increase) {
        const numberInputs = increase.querySelectorAll('input[type="number"]');
        const amountAInput = numberInputs[0]; // First input (Amount A)
        const amountBInput = numberInputs[1]; // Second input (Amount B)

        let isUpdating = false;
        let debounceTimerA;
        let debounceTimerB;

        if (amountAInput) {
            amountAInput.addEventListener('input', function () {
                if (isUpdating) return; // Prevent circular updates
                if (isProgrammaticUpdate || isProgrammaticUpdateB) return;

                console.log('Increase section - Amount A typing:', this.value);

                // Clear previous timer
                clearTimeout(debounceTimerA);

                // Set new timer - only call function after user stops typing for 1001ms
                debounceTimerA = setTimeout(() => {
                    console.log('Increase section - Amount A final value:', this.value);
                    isUpdating = true;

                    if (typeof window.getRatioIncreasePositiontokenA === 'function') {
                        window.getRatioIncreasePositiontokenA();
                    } else {
                        console.log('getRatioIncreasePositiontokenA function not available');
                    }

                    // Reset the updating flag after processing
                    setTimeout(() => {
                        isUpdating = false;
                    }, 50);
                }, 1001);
            });
        }

        if (amountBInput) {
            amountBInput.addEventListener('input', function () {
                if (isUpdating) return; // Prevent circular updates
                if (isProgrammaticUpdate || isProgrammaticUpdateB) return;

                console.log('Increase section - Amount B typing:', this.value);

                // Clear previous timer
                clearTimeout(debounceTimerB);

                // Set new timer - only call function after user stops typing for 1001ms
                debounceTimerB = setTimeout(() => {
                    console.log('Increase section - Amount B final value:', this.value);
                    isUpdating = true;

                    if (typeof window.getRatioIncreasePositiontokenB === 'function') {
                        window.getRatioIncreasePositiontokenB();
                    } else {
                        console.log('getRatioIncreasePositiontokenB function not available');
                    }

                    // Reset the updating flag after processing
                    setTimeout(() => {
                        isUpdating = false;
                    }, 50);
                }, 1001);
            });
        }
    }

    // ========================================
    // DEBOUNCED INPUT LISTENERS - STAKE INCREASE SECTION
    // ========================================

    let isProgrammaticUpdateC = false;
    let isProgrammaticUpdateD = false;

    const increaseStaking = document.getElementById('stake-increase');
    if (increaseStaking) {
        const numberInputs = increaseStaking.querySelectorAll('input[type="number"]');
        const amountAInput = numberInputs[0]; // First input (Amount A)
        const amountBInput = numberInputs[1]; // Second input (Amount B)

        let isUpdating = false;
        let debounceTimerC;
        let debounceTimerD;

        if (amountAInput) {
            amountAInput.addEventListener('input', function () {
                if (isUpdating) return; // Prevent circular updates
                if (isProgrammaticUpdateC || isProgrammaticUpdateD) return;

                console.log('Stake-increase section - Amount A typing:', this.value);

                // Clear previous timer
                clearTimeout(debounceTimerC);

                // Set new timer - only call function after user stops typing for 1001ms
                debounceTimerC = setTimeout(() => {
                    console.log('Stake-increase section - Amount A final value:', this.value);
                    isUpdating = true;

                    if (typeof window.getRatioStakeIncreasePositiontokenA === 'function') {
                        window.getRatioStakeIncreasePositiontokenA();
                    } else {
                        console.log('getRatioStakeIncreasePositiontokenA function not available');
                    }

                    // Reset the updating flag after processing
                    setTimeout(() => {
                        isUpdating = false;
                    }, 50);
                }, 1001);
            });
        }

        if (amountBInput) {
            amountBInput.addEventListener('input', function () {
                if (isUpdating) return; // Prevent circular updates
                if (isProgrammaticUpdateC || isProgrammaticUpdateD) return;

                console.log('Stake-increase section - Amount B typing:', this.value);

                // Clear previous timer
                clearTimeout(debounceTimerD);

                // Set new timer - only call function after user stops typing for 1001ms
                debounceTimerD = setTimeout(() => {
                    console.log('Stake-increase section - Amount B final value:', this.value);
                    isUpdating = true;

                    if (typeof window.getRatioStakeIncreasePositiontokenB === 'function') {
                        window.getRatioStakeIncreasePositiontokenB();
                    } else {
                        console.log('getRatioStakeIncreasePositiontokenB function not available');
                    }

                    // Reset the updating flag after processing
                    setTimeout(() => {
                        isUpdating = false;
                    }, 50);
                }, 1001);
            });
        }
    }

    // ========================================
    // ADDITIONAL INITIALIZATIONS
    // ========================================

    // Update position dropdown
    updatePositionDropdown();

    // Populate staking management data
    populateStakingManagementData();

    // Display wallet balances
    displayWalletBalances();

    // Load settings (if needed)
    if (typeof window.loadSettings === 'function') {
        window.loadSettings();
    }

    // Filter token options for create
    if (typeof window.filterTokenOptionsCreate === 'function') {
        window.filterTokenOptionsCreate();
    }

    // Setup user selection tracking
    if (typeof window.setupUserSelectionTracking === 'function') {
        window.setupUserSelectionTracking();
    }

    // Update token icons and selections
    updateTokenIcon('toToken22', 'toTokenIcon11');
    updateTokenIcon('fromToken22', 'fromTokenIcon22');
    updateTokenSelection('tokenB', 'tokenBIcon');
    updateTokenSelection('tokenA', 'tokenAIcon');

    // Swap tokens convert
    if (typeof window.swapTokensConvert === 'function') {
        window.swapTokensConvert();
        window.swapTokensConvert();
    }

    console.log('✓ DOM listeners setup complete');
}

// ============================================
// DOM CONTENT LOADED
// ============================================

/**
 * Main event handler for DOMContentLoaded
 * Sets up the entire application
 */
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM Content Loaded - Starting initialization...');

    // Initialize the DApp
    await initializeDApp();

    // Setup all event listeners
    setupEventListeners();

    // Setup wallet listeners
    await setupWalletListeners();

    // Initialize tabs from URL
    initializeTabFromURL();
    initializeTabFromDirectParam();

    // Render contracts display
    renderContracts();

    // Setup DOM listeners (positions, inputs, sliders)
    setupDOMListeners();

    // Initialize MAX buttons for all input fields
    initializeMaxButtons();

    // Set responsive padding
    setPadding();
    window.addEventListener('resize', setPadding);

    console.log('✅ Application fully initialized and ready');
});

// ============================================
// WINDOW EVENT LISTENERS
// ============================================

// Track if window-level listeners are set up
let windowListenersSetup = false;

// Listen for network changes (if MetaMask is available)
if (window.ethereum && !windowListenersSetup) {
    window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed to:', chainId);
        displayNetworkStatus();
        // Optionally reload the page
        // window.location.reload();
    });

    windowListenersSetup = true;
    console.log('✓ Window-level Ethereum listeners set up');
}

// Note: accountsChanged is handled in wallet.js setupWalletListeners to avoid duplicates

console.log('Init module loaded');
