// ============================================================================
// B0x Website Wallet Module
// ============================================================================
// This module handles all wallet connection, network switching, and wallet
// state management functionality for the B0x DApp.
// ============================================================================

import {
    defaultRPC_Base,
    defaultRPC_ETH,
} from './config.js';

import { showErrorNotification } from './ui.js';

// ============================================================================
// WALLET STATE MANAGEMENT
// ============================================================================

/**
 * Global wallet connection state
 */
export let walletConnected = false;
export let userAddress = null;

/**
 * Provider and signer instances for Base network
 */
export let provider = "";
export let signer = "";

/**
 * Provider and signer instances for Ethereum network
 */
export let providerETH = "";
export let signerETH = "";

/**
 * Network RPC URLs
 */
export let customRPC = defaultRPC_Base;
export let customRPC_ETH = defaultRPC_ETH;

/**
 * Connection attempt tracking
 */
let attemptf2f21 = 0;
let previousAct = "";

/**
 * Connection state for retry logic
 */
let connectionState = {
    lastStep: '',
    isRecovering: false
};

/**
 * Connection lock to prevent simultaneous connection attempts
 */
let isConnecting = false;

// ============================================================================
// WALLET STATE SETTERS
// ============================================================================

/**
 * Update wallet connection state
 * @param {boolean} connected - Connection status
 */
export function setWalletConnected(connected) {
    walletConnected = connected;
}

/**
 * Update user address
 * @param {string} address - User's wallet address
 */
export function setUserAddress(address) {
    userAddress = address;
}

/**
 * Update Base network provider and signer
 * @param {Object} newProvider - Ethers provider instance
 * @param {Object} newSigner - Ethers signer instance
 */
export function setProvider(newProvider, newSigner) {
    provider = newProvider;
    signer = newSigner;
}

/**
 * Update Ethereum network provider and signer
 * @param {Object} newProvider - Ethers provider instance
 * @param {Object} newSigner - Ethers signer instance
 */
export function setProviderETH(newProvider, newSigner) {
    providerETH = newProvider;
    signerETH = newSigner;
}

/**
 * Update custom RPC URLs
 * @param {string} baseRPC - Base network RPC URL
 * @param {string} ethRPC - Ethereum network RPC URL
 */
export function setCustomRPC(baseRPC, ethRPC) {
    if (baseRPC) customRPC = baseRPC;
    if (ethRPC) customRPC_ETH = ethRPC;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// WALLET CONNECTION FUNCTIONS
// ============================================================================

/**
 * Check if wallet was previously connected and auto-connect
 */
export async function checkWalletConnection() {
    console.log("Checking wallet connection");
    if (typeof window.ethereum !== 'undefined' && localStorage.getItem('walletConnected') === 'true') {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

/**
 * Quick wallet connection (simplified flow)
 * @returns {Promise<string|null>} User address or null
 */
export async function quickconnectWallet() {
    console.log("Quick Connect Wallet");

    if (walletConnected) {
        console.log('Wallet already connected');
        return userAddress;
    }

    // Check if connection is already in progress
    if (isConnecting) {
        console.log('Connection already in progress, ignoring duplicate call');
        return null;
    }

    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or Rabby wallet!');
        return null;
    }

    // Set connection lock
    isConnecting = true;

    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
            // Switch to Base network
            await switchToBase();
            userAddress = accounts[0];
            walletConnected = true;

            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', userAddress);

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            updateWalletUI(userAddress, true);

            await switchToEthereum();

            // Set up event listeners for account changes
            setupWalletListeners();

            // Note: The following functions need to be called from the main app
            // They are imported there and called after quickconnectWallet completes:
            // - await fetchBalances();
            // - await fetchBalancesETH();
            // - getTokenIDsOwnedByMetamask();
            // - await checkAdminAccess();
            // - await loadPositionsIntoDappSelections();
            // - await throttledGetSqrtRtAndPriceRatio("ConnectWallet");
            // - await getRewardStats();

            // Release connection lock on success
            isConnecting = false;

            return userAddress;
        }
    } catch (error) {
        handleWalletError(error);

        // Release connection lock on error
        isConnecting = false;

        return null;
    }
}

/**
 * Wrap network-sensitive operations with retry logic
 * @param {Function} fn - Function to execute with retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {string} stepName - Name of the step for logging
 * @returns {Promise<any>} Result of the function
 */
async function withNetworkRetry(fn, maxRetries = 3, stepName = '') {
    for (let i = 0; i < maxRetries; i++) {
        try {
            connectionState.lastStep = stepName;
            return await fn();
        } catch (error) {
            if (error.code === 'NETWORK_ERROR' && i < maxRetries - 1) {
                console.log(`Network error at step "${stepName}", retrying... (${i + 1}/${maxRetries})`);
                await sleep(1000 * i);
                continue;
            }
            throw error;
        }
    }
}

/**
 * Main wallet connection function with full initialization flow
 * Connects wallet and initializes all app data
 *
 * @param {string|null} resumeFromStep - Optional step to resume from on retry
 * @returns {Promise<string|null>} User address or null
 */
export async function connectWallet(resumeFromStep = null) {
    console.log("Connect Wallet", resumeFromStep ? `(resuming from: ${resumeFromStep})` : '');

    // Check if already connected
    if (walletConnected && !resumeFromStep) {
        console.log('Wallet already connected');
        return userAddress;
    }

    // Check if connection is already in progress
    if (isConnecting && !resumeFromStep) {
        console.log('Connection already in progress, ignoring duplicate call');
        return null;
    }

    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or Rabby wallet!');
        return null;
    }

    // Set connection lock
    isConnecting = true;

    attemptf2f21 = attemptf2f21 + 1;
    if (attemptf2f21 > 2) {
        alert("A connection request is already pending in your wallet. The page will refresh to clear this. Please connect wallet and approve the connection after refresh.");
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        isConnecting = false;
        return null;
    }

    try {
        // Step 1: Request accounts (skip if resuming from later step)
        if (true) {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) return null;

            attemptf2f21 = 0;
            userAddress = accounts[0];
            walletConnected = true;

            // Reset position search if switching accounts
            if (previousAct != userAddress) {
                // Note: WhereToStartSearch needs to be set by caller
                // WhereToStartSearch = LAUNCH_UNISWAP_ID;
                if (window.resetPositionSearch) {
                    window.resetPositionSearch();
                }
            }
            previousAct = userAddress;

            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', userAddress);

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            await updateWalletUI(userAddress, true);
            setupWalletListeners();
            await switchToBase();
        }

        // Step 2: Fetch Base balances
        if (!resumeFromStep || resumeFromStep === 'fetchBalances') {
            await switchToBase();
            if (window.fetchBalances && userAddress) {
                await withNetworkRetry(() => window.fetchBalances(
                    userAddress,
                    window.tokenAddresses,
                    window.tokenAddressesDecimals,
                    window.fetchTokenBalanceWithEthers,
                    window.displayWalletBalances,
                    provider,
                    signer,
                    walletConnected,
                    connectWallet
                ), 3, 'fetchBalances');
            }
        }

        // Step 3: Fetch ETH balances
        if (!resumeFromStep || ['fetchBalances', 'fetchBalancesETH'].includes(resumeFromStep)) {
            await switchToEthereum();
            if (window.fetchBalancesETH && userAddress) {
                await withNetworkRetry(() => window.fetchBalancesETH(
                    userAddress,
                    window.tokenAddressesETH,
                    window.tokenAddressesDecimalsETH,
                    window.fetchTokenBalanceWithEthersETH,
                    window.displayWalletBalancesETH,
                    providerETH,
                    signerETH,
                    walletConnected,
                    connectWallet
                ), 3, 'fetchBalancesETH');
            }
            await switchToBase();
        }

        // Step 4: Initialize position data
        if (!resumeFromStep || ['fetchBalances', 'fetchBalancesETH', 'initPositions'].includes(resumeFromStep)) {
            if (window.resetPositionData) {
                window.resetPositionData();
            }
        }

        // Step 4.5: Get reward stats
        if (!resumeFromStep || resumeFromStep === 'getRewardStats') {
            await sleep(300);
            if (window.getRewardStats) {
                await withNetworkRetry(() => window.getRewardStats(), 3, 'getRewardStats');
            }
        }

        // Step 5: Get token IDs
        if (!resumeFromStep || resumeFromStep === 'getTokenIDs') {
            await sleep(300);
            if (window.getTokenIDsOwnedByMetamask) {
                await withNetworkRetry(() => window.getTokenIDsOwnedByMetamask(), 3, 'getTokenIDs');
            }
        }

        // Step 6: Check admin access
        if (!resumeFromStep || resumeFromStep === 'checkAdmin') {
            await sleep(300);
            if (window.checkAdminAccess) {
                await withNetworkRetry(() => window.checkAdminAccess(), 3, 'checkAdmin');
            }
        }

        // Step 7: Load positions
        if (!resumeFromStep || resumeFromStep === 'loadPositions') {
            await sleep(300);
            if (window.loadPositionsIntoDappSelections) {
                await withNetworkRetry(() => window.loadPositionsIntoDappSelections(), 3, 'loadPositions');
            }
        }

        // Step 8: Get price data
        if (!resumeFromStep || resumeFromStep === 'getPriceData') {
            await sleep(300);
            if (window.throttledGetSqrtRtAndPriceRatio) {
                await withNetworkRetry(() => window.throttledGetSqrtRtAndPriceRatio("ConnectWallet"), 3, 'getPriceData');
            }
        }

        // Step 9: Restore addresses if needed
        if (!resumeFromStep || resumeFromStep === 'restoreAddresses') {
            const toggle1 = document.getElementById('toggle1');
            if (toggle1 && toggle1.checked && window.restoreDefaultAddressesfromContract) {
                console.log("contractAddresses MATCH");
                await withNetworkRetry(() => window.restoreDefaultAddressesfromContract(), 3, 'restoreAddresses');
            }
        }

        // Step 11: Get APY
        if (!resumeFromStep || resumeFromStep === 'getAPY') {
            await sleep(300);
            if (window.GetRewardAPY) {
                await withNetworkRetry(() => window.GetRewardAPY(), 3, 'getAPY');
            }
        }

        // Step 12: Final admin check
        if (window.checkAdminAccess) {
            await withNetworkRetry(() => window.checkAdminAccess(), 3, 'finalAdminCheck');
        }

        connectionState.isRecovering = false;
        connectionState.lastStep = 'completed';

        // Release connection lock on success
        isConnecting = false;
        attemptf2f21 = 0;

        return userAddress;

    } catch (error) {
        if (error.code === 'NETWORK_ERROR' && !connectionState.isRecovering) {
            console.log('Network error detected, attempting recovery...');
            connectionState.isRecovering = true;
            await sleep(2000);
            return connectWallet(connectionState.lastStep);
        }
        console.log("Error25: ", error);
        handleWalletError(error);
        connectionState.isRecovering = false;

        // Release connection lock on error
        isConnecting = false;

        return null;
    }
}

// ============================================================================
// NETWORK SWITCHING FUNCTIONS
// ============================================================================

/**
 * Switch to Ethereum mainnet
 * @param {number} retryCount - Current retry attempt
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<void>}
 */
export async function switchToEthereum(retryCount = 0, maxRetries = 5) {
    const EthereumConfig = {
        chainId: '0x1', // 1 in hex
        chainName: 'Ethereum',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: [customRPC_ETH],
        blockExplorerUrls: ['https://etherscan.io/']
    };

    // Check if already on Ethereum
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChainId === EthereumConfig.chainId) {
        console.log('Already on Ethereum network');
        providerETH = new ethers.providers.Web3Provider(window.ethereum);
        signerETH = providerETH.getSigner();
        return;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: EthereumConfig.chainId }]
        });
        console.log('Switched to Ethereum network');
        providerETH = new ethers.providers.Web3Provider(window.ethereum);
        signerETH = providerETH.getSigner();
    } catch (switchError) {
        // Chain not added yet
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [EthereumConfig]
                });
                console.log('Ethereum network added and switched');
                providerETH = new ethers.providers.Web3Provider(window.ethereum);
                signerETH = providerETH.getSigner();
            } catch (addError) {
                throw new Error(`Failed to add Ethereum network: ${addError.message}`);
            }
        }
        // User rejected
        else if (switchError.code === 4001) {
            throw new Error('User rejected the network switch request');
        }
        // Network changed during request or pending request
        else if (switchError.code === -32002 ||
                 switchError.message.includes('change in selected network') ||
                 switchError.message.includes('request already pending')) {

            if (retryCount >= maxRetries) {
                throw new Error('Maximum retry attempts reached. Please manually switch to Ethereum network.');
            }

            console.log(`Network switch interrupted, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Recursive retry
            return await switchToEthereum(retryCount + 1, maxRetries);
        }
        else {
            throw new Error(`Failed to switch to Ethereum network: ${switchError.message}`);
        }
    }
}

/**
 * Switch to Base network
 * @param {number} retryCount - Current retry attempt
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<void>}
 */
export async function switchToBase(retryCount = 0, maxRetries = 5) {
    const baseConfig = {
        chainId: '0x2105', // 8453 in hex for Base Mainnet
        chainName: 'Base',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: [customRPC],
        blockExplorerUrls: ['https://basescan.org/']
    };

    // Check if already on Base
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChainId === baseConfig.chainId) {
        console.log('Already on Base network');
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        return;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: baseConfig.chainId }]
        });
        console.log('Switched to Base network');
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
    } catch (switchError) {
        // Chain not added yet
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [baseConfig]
                });
                console.log('Base network added and switched');
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
            } catch (addError) {
                throw new Error(`Failed to add Base network: ${addError.message}`);
            }
        }
        // User rejected
        else if (switchError.code === 4001) {
            throw new Error('User rejected the network switch request');
        }
        // Network changed during request or pending request
        else if (switchError.code === -32002 ||
                 switchError.message.includes('change in selected network') ||
                 switchError.message.includes('request already pending')) {

            if (retryCount >= maxRetries) {
                throw new Error('Maximum retry attempts reached. Please manually switch to Base network.');
            }

            console.log(`Network switch interrupted, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Recursive retry
            return await switchToBase(retryCount + 1, maxRetries);
        }
        else {
            throw new Error(`Failed to switch to Base network: ${switchError.message}`);
        }
    }
}

// ============================================================================
// WALLET MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Handle wallet connection errors
 * @param {Error} error - Error object from wallet connection
 */
export function handleWalletError(error) {
    console.error('Wallet connection error:', error);

    switch (error.code) {
        case 4001:
            alert('Please approve the connection request in your wallet');
            attemptf2f21 = 0;
            break;
        case -32002:
            alert('Connection request is already pending. Please check your wallet');
            attemptf2f21 = 0;
            break;
        default:
            alert('Failed to connect wallet: ' + error.message);
            attemptf2f21 = 0;
    }
}

/**
 * Disconnect wallet and clear all state
 */
export function disconnectWallet() {
    walletConnected = false;
    userAddress = null;

    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');

    // Reset UI
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.classList.remove('connected');
    }
    updateWalletUI("", true);
}

// Track if listeners have been set up
let listenersSetup = false;

/**
 * Set up wallet event listeners for account and network changes
 */
export async function setupWalletListeners() {
    if (!window.ethereum) return;

    // Prevent duplicate listener attachment
    if (listenersSetup) {
        console.log('Wallet listeners already set up, skipping...');
        return;
    }

    console.log('Setting up wallet event listeners...');

    // Handle account changes
    window.ethereum.on('accountsChanged', async (accounts) => {
        console.log('Account changed event:', accounts);
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            const olduserAddy = userAddress;
            userAddress = accounts[0];

            // Clear manual selections when switching accounts
            if (typeof window.userManualSelection !== 'undefined') window.userManualSelection = null;
            if (typeof window.userManualSelectionIncrease !== 'undefined') window.userManualSelectionIncrease = null;
            if (typeof window.userManualSelectionDecrease !== 'undefined') window.userManualSelectionDecrease = null;
            if (typeof window.userManualSelectionStakeIncrease !== 'undefined') window.userManualSelectionStakeIncrease = null;
            if (typeof window.userManualSelectionStakeDecrease !== 'undefined') window.userManualSelectionStakeDecrease = null;
            if (typeof window.userManualSelectionWithdraw !== 'undefined') window.userManualSelectionWithdraw = null;

            updateWalletUI(userAddress, true);

            // Call connect2 if available on window
            if (window.connect2) {
                await window.connect2();
            }
        }
    });

    // Note: chainChanged listener is set up in init.js to avoid duplicates

    listenersSetup = true;
    console.log('✓ Wallet listeners set up');
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Update wallet UI with connected address or disconnected state
 * @param {string} userAddress - User's wallet address
 * @param {boolean|string} walletName - Wallet name or true for default
 */
export function updateWalletUI(userAddress, walletName) {
    // Get the elements
    const connectBtn = document.getElementById('connectBtn');
    const walletInfo = document.getElementById('walletInfo');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const walletAddress = document.getElementById('walletAddress');
    const walletAddressSpan = document.querySelector('#walletInfo #walletAddress');

    if (userAddress) {
        // Shorten the address for display (first 6 + last 4 characters)
        const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;

        // Create the BaseScan URL
        const baseScanUrl = `https://basescan.org/address/${userAddress}`;

        walletAddressSpan.style.display = 'block';
        // Update the span with a clickable link that fills the entire button
        walletAddressSpan.innerHTML = `<a href="${baseScanUrl}" target="_blank" rel="noopener noreferrer">${shortAddress}</a>`;

        // Show the wallet info div
        walletInfo.style.display = 'block';
        disconnectBtn.style.display = 'block';

        // Update connect button
        connectBtn.textContent = `Connected (${walletName || 'Wallet'})`;
        connectBtn.classList.add('connected');

        // Optional: Add title attribute for full address on hover
        walletAddressSpan.title = userAddress;
    } else {
        // Hide wallet info if no address
        console.log("Disconnected");
        walletAddressSpan.style.display = 'none';
        walletInfo.style.display = 'none';
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.classList.remove('connected');
        disconnectBtn.style.display = 'none';
    }
}

// ============================================================================
// RECONNECTION HELPER
// ============================================================================

/**
 * Reconnect wallet and refresh all data (used on account change)
 * This is exported to be called from the main app when needed
 */
export async function connect2() {
    // Clear position data and UI immediately when connecting/switching accounts
    if (window.positionData) window.positionData = {};
    if (window.stakingPositionData) window.stakingPositionData = {};

    // Clear all position dropdowns immediately
    const selectors = [
        '#increase select',
        '#decrease select',
        '#staking-main-page select',
        '#staking-main-page .form-group2 select',
        '#stake-increase select'
    ];
    selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = '';
            element.value = '';
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    console.log("Cleared all position data and UI for account switch");

    if (previousAct != userAddress) {
        if (window.resetPositionSearch) {
            window.resetPositionSearch();
        }
    }
    previousAct = userAddress;

    await switchToEthereum();
    if (window.fetchBalancesETH && userAddress) {
        await window.fetchBalancesETH(
            userAddress,
            window.tokenAddressesETH,
            window.tokenAddressesDecimalsETH,
            window.fetchTokenBalanceWithEthersETH,
            window.displayWalletBalancesETH,
            providerETH,
            signerETH,
            walletConnected,
            connectWallet
        );
    }

    await switchToBase();
    if (window.fetchBalances && userAddress) {
        await window.fetchBalances(
            userAddress,
            window.tokenAddresses,
            window.tokenAddressesDecimals,
            window.fetchTokenBalanceWithEthers,
            window.displayWalletBalances,
            provider,
            signer,
            walletConnected,
            connectWallet
        );
    }

    if (window.getRewardStats) await window.getRewardStats();
    if (window.getTokenIDsOwnedByMetamask) await window.getTokenIDsOwnedByMetamask();
    if (window.checkAdminAccess) await window.checkAdminAccess();
    if (window.loadPositionsIntoDappSelections) await window.loadPositionsIntoDappSelections();
    if (window.throttledGetSqrtRtAndPriceRatio) window.throttledGetSqrtRtAndPriceRatio("ConnectWallet");
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize wallet module on DOMContentLoaded
 */
export function initWalletModule() {
    document.addEventListener('DOMContentLoaded', function () {
        // Optional: Auto-check wallet connection on page load
        // Uncomment if you want automatic reconnection
        // checkWalletConnection();
    });
}
