/**
 * UI Module - Pure UI functions for DOM manipulation and user interactions
 *
 * This module contains all UI-related functions extracted from script.js
 * Focuses on pure UI operations - rendering, display updates, formatting, etc.
 */

// Import dependencies
import { TOKEN_ORDER, TOKEN_ORDERETH } from './utils.js';
import { tokenIconsBase, tokenIconsETH, ProofOfWorkAddresss, tokenAddresses, contractAddress_Swapper, hookAddress } from './config.js';
import { positionData, stakingPositionData } from './positions.js';
import {functionCallCounter, incrementFunctionCallCounter, hasUserMadeSelection, customRPC} from './settings.js'
import {firstRewardsAPYRun, APYFINAL} from './staking.js';
// =============================================================================
// NOTIFICATION WIDGET CLASS
// =============================================================================

/**
 * Mobile-optimized notification widget for displaying toast messages
 */
class MobileNotificationWidget {
    constructor(position = 'bottom-right') {
        this.container = document.getElementById('notificationContainer');
        this.notifications = new Map();
        this.counter = 0;
        this.position = position;
        this.setPosition(position);
    }

    setPosition(position) {
        this.position = position;
        if (this.container) {
            this.container.className = `notification-container ${position}`;
        }
    }

    positionInContainer(containerSelector) {
        const targetContainer = document.querySelector(containerSelector);
        if (targetContainer && this.container) {
            targetContainer.style.position = 'relative';
            targetContainer.appendChild(this.container);
            this.container.style.position = 'absolute';
            this.container.style.bottom = '20px';
            this.container.style.right = '20px';
        }
    }

    resetToViewport() {
        if (this.container) {
            document.body.appendChild(this.container);
            this.container.style.position = 'fixed';
        }
    }

    show(type = 'info', title = '', message = '', duration = 10000) {
        if (!this.container) return null;

        const id = ++this.counter;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('data-id', id);

        const icons = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'i'
        };

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.hide(id);

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                ${message ? `<div class="notification-message">${message}</div>` : ''}
            </div>
            <div class="notification-progress"></div>
        `;

        // Insert close button before progress bar
        notification.insertBefore(closeBtn, notification.lastElementChild);

        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            this.hide(id);
        }, duration);

        return id;
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 400);
        }
    }

    success(title, message = '') {
        return this.show('success', title, message);
    }

    error(title, message = '') {
        return this.show('error', title, message);
    }

    warning(title, message = '') {
        return this.show('warning', title, message);
    }

    info(title, message = '') {
        return this.show('info', title, message);
    }
}

// Initialize the notification widget (will be initialized after DOM is ready)
let notificationWidget = null;

/**
 * Initialize notification widget after DOM is loaded
 */
export function initNotificationWidget() {
    if (!notificationWidget) {
        notificationWidget = new MobileNotificationWidget('bottom-right');
    }
    return notificationWidget;
}

/**
 * Get or initialize the notification widget
 */
function getNotificationWidget() {
    if (!notificationWidget) {
        notificationWidget = initNotificationWidget();
    }
    return notificationWidget;
}

// =============================================================================
// NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Hide a notification by ID (used by notification close buttons)
 * @param {number} id - Notification ID
 */
export function hideNotification(id) {
    getNotificationWidget().hide(id);
}

/**
 * Shows success notification with optional transaction hash
 * @param {string} msg - Main message
 * @param {string} msg2 - Secondary message
 * @param {string} txHash - Optional transaction hash for explorer link
 * @returns {string} Notification ID
 */
export function showSuccessNotification(msg = 'Swap Complete!', msg2 = 'Transaction confirmed on blockchain', txHash = null) {
    let enhancedMessage = msg2;
    let notificationId;

    if (txHash) {
        enhancedMessage = `${msg2} <br><a href="https://basescan.org/tx/${txHash}" target="_blank" style="color: #10b981; text-decoration: underline; font-weight: 600;">View on Explorer →</a>`;
    }

    // Show notification for 30 seconds (30000ms)
    notificationId = getNotificationWidget().show('success', msg, enhancedMessage, 30000);

    // If txHash is provided, make the notification 1.7x larger
    if (txHash) {
        setTimeout(() => {
            const notification = document.querySelector(`[data-id="${notificationId}"]`);
            if (notification) {
                notification.style.transform = 'scale(1.7)';
                notification.style.zIndex = '10001';
                notification.style.transformOrigin = 'bottom right';
            }
        }, 50);
    }

    return notificationId;
}

/**
 * Shows error notification
 * @param {string} msg - Main message
 * @param {string} msg2 - Secondary message
 */
export function showErrorNotification(msg = 'Transaction Failed', msg2 = 'Please check wallet and try again') {
    getNotificationWidget().error(msg, msg2);
}

/**
 * Shows warning notification
 * @param {string} msg - Main message
 * @param {string} msg2 - Secondary message
 */
export function showWarningNotification(msg = 'High Gas Fees', msg2 = 'Network congestion detected') {
    getNotificationWidget().warning(msg, msg2);
}

/**
 * Shows info notification
 * @param {string} msg - Main message
 * @param {string} msg2 - Secondary message
 */
export function showInfoNotification(msg = 'Processing...', msg2 = 'Please wait for confirmation') {
    getNotificationWidget().info(msg, msg2);
}

/**
 * Shows toast notification
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether it's an error toast
 */
export function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = isError ? '#dc3545' : '#28a745';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Shows alert notification
 * @param {string} message - Message to display
 * @param {string} type - Alert type (info, success, error)
 */
export function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const settingsPage = document.getElementById('settings');
    settingsPage.insertBefore(alertDiv, settingsPage.firstChild);

    setTimeout(() => alertDiv.remove(), 5000);
}

/**
 * Shows success message temporarily
 * @param {string} elementId - Element ID to show
 */
export function showSuccessMessage(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// =============================================================================
// LOADING WIDGET FUNCTIONS
// =============================================================================

/**
 * Shows loading widget
 * @param {string} message - Loading message
 * @param {string} title - Loading title
 */
export function showLoadingWidget(message = 'Loading...', title = 'Loading') {
    const widget = document.getElementById('loading-widget');
    const messageEl = document.getElementById('loading-widget-message');
    const titleEl = widget.querySelector('.loading-widget-title');

    widget.className = 'loading-widget';
    titleEl.textContent = title;
    messageEl.textContent = message;
    setLoadingProgress(0);

    setTimeout(() => widget.classList.add('show'), 10);
}

/**
 * Updates loading widget status
 * @param {string} message - Status message (HTML allowed)
 */
export function updateLoadingStatusWidget(message) {
    document.getElementById('loading-widget-message').innerHTML = message;
}

/**
 * Sets loading progress percentage
 * @param {number} percentage - Progress percentage (0-100)
 */
export function setLoadingProgress(percentage) {
    document.getElementById('loading-progress-bar').style.width = percentage + '%';
}

/**
 * Hides loading widget
 */
export function hideLoadingWidget() {
    document.getElementById('loading-widget').classList.remove('show');
}

/**
 * Updates loading status message
 * @param {string} message - Status message
 */
export function updateLoadingStatus(message) {
    document.getElementById('loading-status').textContent = message;
}

/**
 * Shows loading screen
 */
export function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingContent = loadingScreen.querySelector('.loading-content');
    const loadingSubtitle = loadingScreen.querySelector('.loading-status');

    loadingSubtitle.textContent = 'Now loading the data';
    const parent = loadingContent.parentNode;
    const newContent = loadingContent.cloneNode(true);
    parent.removeChild(loadingContent);
    parent.appendChild(newContent);

    loadingScreen.style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
}

/**
 * Hides loading screen
 */
export function hideLoadingScreen() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

// =============================================================================
// TAB SWITCHING FUNCTIONS
// =============================================================================

let PreviousTabName = "";

/**
 * Switches main application tab
 * @param {string} tabName - Name of tab to switch to
 */
export async function switchTab(tabName) {
    var name = '#' + tabName;
    getNotificationWidget().positionInContainer(name);

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = '';
    });

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected page
    const selectedPage = document.getElementById(tabName);
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);

    if (selectedTab) selectedTab.classList.add('active');
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    console.log("Switched to tab:", tabName);
    updateURL(tabName);

    if (tabName == "staking") {
        tabName = "staking-main-page";
    }
    if (tabName == 'miner') {
        setTimeout(() => {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }, 100);
    }
    // Tab-specific data loading
    if (tabName == 'stats' && PreviousTabName != 'stats') {
        switchTab2('stats-home');

        // Load stats data if functions are available
        if (typeof window.GetContractStatsWithMultiCall === 'function') {
            const stats = await window.GetContractStatsWithMultiCall();
            if (stats && typeof window.updateStatsDisplay === 'function') {
                window.updateStatsDisplay(stats);
            }
        }
        if (typeof window.updateAllMinerInfoFirst === 'function') {
            await window.updateAllMinerInfoFirst();
        }
    } else if (tabName === 'staking-management' || tabName === 'staking-main-page') {
        // Load staking data when switching to staking tabs
        if (window.walletConnected && typeof window.getTokenIDsOwnedByMetamask === 'function') {
            await window.getTokenIDsOwnedByMetamask();
        }
        if (typeof window.updateStakingStats === 'function') {
            window.updateStakingStats();
        }
    } else if (tabName === 'liquidity-positions') {
        // Load position data when switching to positions tab
        if (window.walletConnected && typeof window.getTokenIDsOwnedByMetamask === 'function') {
            await window.getTokenIDsOwnedByMetamask();
        }
        if (typeof window.loadPositionsIntoDappSelections === 'function') {
            await window.loadPositionsIntoDappSelections();
        }
    } else if (tabName === 'side-pools') {
        // Load pool fees data
        if (typeof window.getAllFees === 'function') {
            await window.getAllFees();
        } else {
            console.warn('Pool fees function not available');
        }
    } else {
        // Remove active class from all sub-tabs and sub-pages
        document.querySelectorAll('.nav-tab2').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.stats-page').forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });
    }

    PreviousTabName = tabName;
}

/**
 * Switches to stats tab
 */
export async function switchTabForStats() {
    var tabName = 'stats';
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = '';
    });

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected page
    const selectedPage = document.getElementById(tabName);
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);

    if (selectedTab) selectedTab.classList.add('active');
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    if (tabName == 'stats' && PreviousTabName != 'stats') {
        switchTab2('stats-home');
        await GetContractStatsWithMultiCall();
        await updateAllMinerInfoFirst();
    } else {
        document.querySelectorAll('.nav-tab2').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.stats-page').forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });
    }
    PreviousTabName = tabName;

    if (tabName === 'stats') {
        document.querySelector('.content').style.padding = '0px';
    } else {
        document.querySelector('.content').style.padding = '40px';
    }
}

import { initEthers2, updateGraphData } from "./charts.js";

/**
 * Switches stats sub-navigation tab
 * @param {string} tabName - Stats tab name
 */
export async function switchTab2(tabName) {
    if (tabName == 'stats-staking-rich-list') {
        loadData2();
    } else if (tabName == 'stats-rich-list') {
        loadData();
    } else if (tabName == 'rich-list') {
        loadData();
    }
    updateURL(tabName);

    // Remove active class from all sub-tabs and sub-pages
    document.querySelectorAll('.nav-tab2').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.stats-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    // Add active class to selected sub-tab and sub-page
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedPage = document.getElementById(tabName);

    if (selectedTab) selectedTab.classList.add('active');
    if (selectedPage) {
        selectedPage.classList.add('active');
        selectedPage.style.display = 'block';
    }

    if (tabName == "stats-graphs") {
        await initEthers2();
        updateGraphData(30, 30);
    }
}

/**
 * Updates URL with tab parameter
 * @param {string} tabName - Tab name for URL
 */
export function updateURL(tabName) {
    if (tabName == "staking-main-page") {
        tabName = 'staking';
    }
    if (tabName == "stats-home") {
        tabName = 'stats';
    }
    if (tabName == "stats-staking-rich-list") {
        tabName = 'staking-rich-list';
    }
    if (tabName == "stats-rich-list") {
        tabName = 'rich-list';
    }
    if (tabName == "staking-main-page") {
        tabName = 'staking';
    }
    const baseUrl = window.location.origin + window.location.pathname;
    const newUrl = `${baseUrl}?${tabName}`;
    window.history.replaceState(null, '', newUrl);
}

// =============================================================================
// WALLET UI FUNCTIONS
// =============================================================================

/**
 * Updates wallet UI with connection info
 * @param {string} userAddress - User's wallet address
 * @param {string} walletName - Wallet name/type
 */
export function updateWalletUI(userAddress, walletName) {
    const connectBtn = document.getElementById('connectBtn');
    const walletInfo = document.getElementById('walletInfo');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const walletAddress = document.getElementById('walletAddress');
    const walletAddressSpan = document.querySelector('#walletInfo #walletAddress');

    if (userAddress) {
        const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        const baseScanUrl = `https://basescan.org/address/${userAddress}`;

        walletAddressSpan.style.display = 'block';
        walletAddressSpan.innerHTML = `<a href="${baseScanUrl}" target="_blank" rel="noopener noreferrer">${shortAddress}</a>`;

        walletInfo.style.display = 'block';
        disconnectBtn.style.display = 'block';

        connectBtn.textContent = `Connected (${walletName || 'Wallet'})`;
        connectBtn.classList.add('connected');

        walletAddressSpan.title = userAddress;
    } else {
        walletAddressSpan.style.display = 'none';
        walletInfo.style.display = 'none';
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.classList.remove('connected');
        disconnectBtn.style.display = 'none';
    }
}

/**
 * Displays wallet balances for Base chain
 */
export function displayWalletBalances() {
    const containers = [
        document.getElementById('walletBalancesDisplay'),
        document.getElementById('walletBalancesDisplay2'),
        document.getElementById('walletBalancesDisplay3'),
        document.getElementById('walletBalancesDisplay4')
    ];

    if (!containers[0]) return;

    const walletBalances = window.walletBalances || {};
    let balancesHTML = '';

    // Use predefined order
    TOKEN_ORDER.forEach(token => {
        if (walletBalances[token] !== undefined) {
            const iconUrl = tokenIconsBase[token] || '';
            balancesHTML += `
                <div class="balance-item">
                    ${iconUrl ? `<img src="${iconUrl}" alt="${token}" class="token-icon222" onerror="this.style.display='none'">` : ''}
                    <span class="token-name">${token}</span>
                    <span class="token-amount">${formatExactNumber(walletBalances[token])}</span>
                </div>
            `;
        }
    });

    // Add any tokens not in predefined order
    for (const [token, balance] of Object.entries(walletBalances)) {
        if (!TOKEN_ORDER.includes(token)) {
            const iconUrl = tokenIconsBase[token] || '';
            balancesHTML += `
                <div class="balance-item">
                    ${iconUrl ? `<img src="${iconUrl}" alt="${token}" class="token-icon222" onerror="this.style.display='none'">` : ''}
                    <span class="token-name">${token}</span>
                    <span class="token-amount">${formatExactNumber(balance)}</span>
                </div>
            `;
        }
    }

    // Update all containers
    containers.forEach(container => {
        if (container) container.innerHTML = balancesHTML;
    });
}

/**
 * Displays wallet balances for ETH chain
 */
export function displayWalletBalancesETH() {
    const balancesContainer = document.getElementById('walletBalancesDisplay5');

    if (!balancesContainer) return;

    const walletBalancesETH = window.walletBalancesETH || {};
    let balancesHTML = '';

    TOKEN_ORDERETH.forEach(token => {
        if (walletBalancesETH[token] !== undefined) {
            const iconUrl = tokenIconsETH[token] || '';
            balancesHTML += `
                <div class="balance-item">
                    ${iconUrl ? `<img src="${iconUrl}" alt="${token}" class="token-icon222" onerror="this.style.display='none'">` : ''}
                    <span class="token-name">${token}</span>
                    <span class="token-amount">${formatExactNumber(walletBalancesETH[token])}</span>
                </div>
            `;
        }
    });

    // Add any tokens not in predefined order
    for (const [token, balance] of Object.entries(walletBalancesETH)) {
        if (!TOKEN_ORDERETH.includes(token)) {
            const iconUrl = tokenIconsETH[token] || '';
            balancesHTML += `
                <div class="balance-item">
                    ${iconUrl ? `<img src="${iconUrl}" alt="${token}" class="token-icon222" onerror="this.style.display='none'">` : ''}
                    <span class="token-name">${token}</span>
                    <span class="token-amount">${formatExactNumber(balance)}</span>
                </div>
            `;
        }
    }

    balancesContainer.innerHTML = balancesHTML;
}

// =============================================================================
// WIDGET UPDATE FUNCTIONS
// =============================================================================
let prevTimeInFunc2 = Date.now();

var firstthree = 0;

// Price state variables (accessed via window for compatibility with script.js)
export let ratioB0xTo0xBTC = 0;
export let usdCostB0x = 0;

/**
 * Updates main widget with price and hashrate info
 */
export async function updateWidget() {
    const currentTime = Date.now();
    const timeDiff = currentTime - prevTimeInFunc2;

    if (timeDiff < 60000 && firstthree > 1 && firstRewardsAPYRun > 2) {
        console.log("repetive call not called updateWidget");
        return;
    } else {
        console.log("updateWidget run happened");
    }
    if (firstRewardsAPYRun <= 2) {
        console.log("First run because of RewardsAPYRun <=2");
    }
    firstthree = firstthree + 1;
    prevTimeInFunc2 = Date.now();

    // Set loading state
    const usdPriceEl = document.getElementById('usd-price');
    const btcPriceEl = document.getElementById('btc-price');
    const hashrateEl = document.getElementById('hashrate');

    if (usdPriceEl) usdPriceEl.textContent = 'Loading...';
    if (btcPriceEl) btcPriceEl.textContent = 'Loading...';
    if (hashrateEl) hashrateEl.textContent = 'Loading...';

    await calculateAndDisplayHashrate();

    setTimeout(() => {
        // Get values from window if they exist (for backwards compatibility)
        const usdPrice = window.usdCostB0x || usdCostB0x || 0;
        const btcPrice = window.ratioB0xTo0xBTC || ratioB0xTo0xBTC || 0;

        if (usdPriceEl) usdPriceEl.textContent = `$${usdPrice.toFixed(4)}`;
        if (btcPriceEl) btcPriceEl.textContent = btcPrice.toFixed(6);
        if (hashrateEl) hashrateEl.textContent = formattedHashrate;
    }, 1000);
}

/**
 * Handles widget visibility based on toggle
 */
export function handleWidgetVisibility() {
    const b0xwidget = document.getElementById('b0x-widget');
    const toggle = document.getElementById('toggle1');

    if (toggle && toggle.checked) {
        b0xwidget.style.display = "flex";
    } else {
        b0xwidget.style.display = "none";
    }
}

// =============================================================================
// TOKEN ICON UPDATE FUNCTIONS
// =============================================================================

/**
 * Updates token icon
 * @param {string} selectId - Select element ID
 * @param {string} iconId - Icon element ID
 */
export function updateTokenIcon(selectId, iconId) {
    const select = document.getElementById(selectId);
    const token = select.value;
    const icon = document.getElementById(iconId);
    const iconURL = tokenIconsBase[token];

    if (iconURL) {
        icon.innerHTML = `<img src="${iconURL}" alt="${token}" class="token-icon222" onerror="this.parentElement.textContent='${token.charAt(0)}'">`;
    } else {
        icon.textContent = token.charAt(0);
    }

    // Clear the amount input field in the same form group
    const formGroup = select.closest('.form-group').nextElementSibling;
    if (formGroup && formGroup.classList.contains('form-group')) {
        const amountInput = formGroup.querySelector('input[type="number"]');
        if (amountInput) {
            amountInput.value = '0.0';
        }
    }

    filterTokenOptionsSwap();
}

/**
 * Updates token icon for ETH chain
 * @param {string} selectId - Select element ID
 * @param {string} iconId - Icon element ID
 */
export function updateTokenIconETH(selectId, iconId) {
    const select = document.getElementById(selectId);
    const token = select.value;
    const icon = document.getElementById(iconId);
    const iconURL = tokenIconsETH[token];

    if (iconURL) {
        icon.innerHTML = `<img src="${iconURL}" alt="${token}" class="token-icon222" onerror="this.parentElement.textContent='${token.charAt(0)}'">`;
    } else {
        icon.textContent = token.charAt(0);
    }

    const formGroup = select.closest('.form-group').nextElementSibling;
    if (formGroup && formGroup.classList.contains('form-group')) {
        const amountInput = formGroup.querySelector('input[type="number"]');
        if (amountInput) {
            amountInput.value = '0.0';
        }
    }

    filterTokenOptionsSwapETH();
   // getConvertTotal(false);
}

/**
 * Updates token icon for create position page
 */
export function updateTokenIconCreate() {
    const formGroups = document.querySelectorAll('#create .form-group');

    formGroups.forEach(group => {
        const label = group.querySelector('label');
        const select = group.querySelector('select');
        const icon = group.querySelector('.token-icon');

        if (label && select && icon) {
            const labelText = label.textContent;
            if (labelText === 'Token A' || labelText === 'Token B') {
                const selectedValue = select.value;
                const tokenIcons = {
                    'ETH': 'E',
                    'USDC': 'U',
                    'DAI': 'D',
                    'WBTC': 'W'
                };
                const iconURL = tokenIconsBase[selectedValue];

                if (iconURL) {
                    icon.innerHTML = `<img src="${iconURL}" alt="${selectedValue}" class="token-icon222" onerror="this.parentElement.textContent='${selectedValue.charAt(0)}'">`;
                } else {
                    icon.textContent = selectedValue.charAt(0);
                }
            }
        }
    });

    filterTokenOptionsCreate();
}

/**
 * Updates token selection with icon
 * @param {string} selectId - Select element ID
 * @param {string} iconId - Icon element ID
 */
export function updateTokenSelection(selectId, iconId) {
    const select = document.getElementById(selectId);
    const icon = document.getElementById(iconId);
    const selectedValue = select.value;
    const iconURL = tokenIconsBase[selectedValue];

    const tokenIcons = {
        'ETH': 'E',
        'USDC': 'U',
        'DAI': 'D',
        'WBTC': 'W'
    };

    if (iconURL) {
        icon.innerHTML = `<img src="${iconURL}" alt="${selectedValue}" class="token-icon222" onerror="this.parentElement.textContent='${tokenIcons[selectedValue] || selectedValue.charAt(0)}'">`;
    } else {
        icon.textContent = tokenIcons[selectedValue] || selectedValue.charAt(0);
    }
}

// =============================================================================
// TOKEN FILTER FUNCTIONS
// =============================================================================

/**
 * Filter token options for create position to prevent selecting same token twice
 * Hides selected TokenA from TokenB dropdown
 */
export function filterTokenOptionsCreate() {
    const tokenA = document.getElementById('tokenA');
    const tokenB = document.getElementById('tokenB');

    if (!tokenA || !tokenB) return;

    const tokenAValue = tokenA.value;
    const tokenBValue = tokenB.value;

    // Reset all tokenB options to visible first
    Array.from(tokenB.options).forEach(option => {
        option.style.display = '';
        option.disabled = false;
    });

    // Hide the selected tokenA option in tokenB dropdown only
    Array.from(tokenB.options).forEach(option => {
        if (option.value === tokenAValue) {
            option.style.display = 'none';
            option.disabled = true;
        }
    });

    // If current tokenB selection matches tokenA, change it to first available option
    if (tokenBValue === tokenAValue) {
        const availableOptions = Array.from(tokenB.options).filter(option =>
            option.value !== tokenAValue && option.style.display !== 'none'
        );
        if (availableOptions.length > 0) {
            tokenB.value = availableOptions[0].value;
            updateTokenSelection('tokenB', 'tokenBIcon');
        }
    }
}

/**
 * Filter token options for swap to prevent selecting same token twice
 * Hides selected fromToken from toToken dropdown
 */
export function filterTokenOptionsSwap() {
    const fromToken = document.querySelector('#swap #fromToken22');
    const toToken = document.querySelector('#swap #toToken22');

    if (!fromToken || !toToken) return;

    const fromValue = fromToken.value;
    const toValue = toToken.value;

    // Reset all toToken options to visible first
    Array.from(toToken.options).forEach(option => {
        option.style.display = '';
        option.disabled = false;
    });

    // Hide the selected fromToken option in toToken dropdown only
    Array.from(toToken.options).forEach(option => {
        if (option.value === fromValue) {
            option.style.display = 'none';
            option.disabled = true;
        }
    });

    // If current toToken selection matches fromToken, change it to first available option
    if (toValue === fromValue) {
        const availableOptions = Array.from(toToken.options).filter(option =>
            option.value !== fromValue && option.style.display !== 'none'
        );
        if (availableOptions.length > 0) {
            toToken.value = availableOptions[0].value;
            updateTokenIcon('toToken22', 'toTokenIcon11');
        }
    }
}

/**
 * Filter token options for ETH convert to prevent selecting same token twice
 * Hides selected fromToken from toToken dropdown
 */
export function filterTokenOptionsSwapETH() {
    const fromToken = document.querySelector('#convert #fromToken');
    const toToken = document.querySelector('#convert #toToken');

    if (!fromToken || !toToken) return;

    const fromValue = fromToken.value;
    const toValue = toToken.value;

    // Reset all toToken options to visible first
    Array.from(toToken.options).forEach(option => {
        option.style.display = '';
        option.disabled = false;
    });

    // Hide the selected fromToken option in toToken dropdown only
    Array.from(toToken.options).forEach(option => {
        if (option.value === fromValue) {
            option.style.display = 'none';
            option.disabled = true;
        }
    });

    // If current toToken selection matches fromToken, change it to first available option
    if (toValue === fromValue) {
        const availableOptions = Array.from(toToken.options).filter(option =>
            option.value !== fromValue && option.style.display !== 'none'
        );
        if (availableOptions.length > 0) {
            toToken.value = availableOptions[0].value;
            updateTokenIcon('toToken', 'toTokenIcon');
        }
    }
}

// =============================================================================
// POSITION INFO UPDATE FUNCTIONS
// =============================================================================

/**
 * Updates position info for main staking page
 */
export function updatePositionInfoMAIN_STAKING() {
    const positionSelect = document.querySelector('#staking-main-page select');
    const selectedPositionId = positionSelect.value;
    const position = positionData[selectedPositionId];

    if (!position) {
        const infoCard = document.querySelector('#staking-main-page .info-card2');
        infoCard.innerHTML = `<h3>NFT Position Info</h3>
                                <p>Create Position to Stake Position</p>`;
        document.getElementById('estimatedRewards').value = "0%";
        return;
    }

    var positionLiq = parseFloat(position.currentLiquidity);
    var percentOfStaking = positionLiq / (parseFloat(totalLiquidityInStakingContract.toString()) + positionLiq);
    document.getElementById('estimatedRewards').value = percentOfStaking.toFixed(6) * 100 + "%";

    const infoCard = document.querySelector('#staking-main-page .info-card2');
    infoCard.innerHTML = `<h3>Current Selected Position</h3>
        <p><strong>Pool:</strong> ${position.pool} (${position.feeTier})</p>
        <p><strong>Current Liquidity:</strong> ${position.currentLiquidity.toFixed(2)}</p>
        <p><strong>Total Liquidity:</strong> ${parseFloat(position.currentTokenA).toFixed(4)} ${position.tokenA} & ${parseFloat(position.currentTokenB).toFixed(4)} ${position.tokenB}</p>
    `;
}

/**
 * Updates position info for unstaking
 */
export function updatePositionInfoMAIN_UNSTAKING() {
    const positionSelect = document.querySelector('#staking-main-page .form-group2 select');
    const selectedPositionId = positionSelect.value;
    const position = stakingPositionData[selectedPositionId];

    if (!position) {
        const infoCard = document.querySelector('#staking-main-page .info-card');
        infoCard.innerHTML = `<h3>Token Withdrawing</h3>
                            <p>Unstake your Unsiwap NFT tokens below.  Currently you have no staked positions.</p>
                            `;
        return;
    }

    const infoCard = document.querySelector('#staking-main-page .info-card');
    var parseFloatz = parseFloat(position.PenaltyForWithdraw).toFixed(3);
    infoCard.innerHTML = `<h3>Current Selected Position</h3>
        <p><strong>Pool:</strong> ${position.pool} (${position.feeTier})</p>
        <p><strong>Current Liquidity:</strong> ${position.currentLiquidity.toFixed(2)}</p>
        <p><strong>Total Liquidity:</strong> ${parseFloat(position.currentTokenA).toFixed(4)} ${position.tokenA} & ${parseFloat(position.currentTokenB).toFixed(4)} ${position.tokenB}</p>
        <p style="font-weight: bold; font-size: 2em; color: red;"><strong>Penalty for Early Stake Withdrawl:</strong> ${parseFloatz} %</p>
         <p>It is cheaper if you use Stake Decrease if you are only removing a portion of your funds from staking, cheaper than removing everthing and restaking.</p>
        `;
}

/**
 * Updates position info for increase liquidity page
 */
export function updatePositionInfo() {
    const positionSelect = document.querySelector('#increase select');
    const selectedPositionId = positionSelect.value;
    const position = positionData[selectedPositionId];

    if (!position) {
        const infoCard = document.querySelector('#increase .info-card:nth-child(5)');
        infoCard.innerHTML = `
            <h3>Increase Position Liquidity</h3>
             <p>Create Position to increase liquidity on it</p>`;
        return;
    }

    const infoCard = document.querySelector('#increase .info-card:nth-child(5)');
    infoCard.innerHTML = `
        <h3>Current Selected Position</h3>
        <p><strong>Pool:</strong> ${position.pool} (${position.feeTier})</p>
        <p><strong>Current Liquidity:</strong> ${position.currentLiquidity.toFixed(2)}</p>
        <p><strong>Total Liquidity:</strong> ${parseFloat(position.currentTokenA).toFixed(4)} ${position.tokenA} & ${parseFloat(position.currentTokenB).toFixed(4)} ${position.tokenB}</p>
        <p><strong>Unclaimed Fees:</strong> ${parseFloat(position.unclaimedFeesTokenA).toFixed(4)} ${position.tokenA} & ${parseFloat(position.unclaimedFeesTokenB).toFixed(4)} ${position.tokenB}</p>
    `;

    const inputs = document.querySelectorAll('#increase input[type="number"]');
    inputs.forEach(input => input.value = '0');
    updateTotalLiqIncrease();
}

/**
 * Updates total liquidity for increase operation
 */
export function updateTotalLiqIncrease() {
    const positionSelect = document.querySelector('#increase select');
    const selectedPositionId = positionSelect.value;
    const position = positionData[selectedPositionId];
    if (!position) return;

    const tokenASpan = document.querySelector('#increase #tokenALabel');
    const tokenBSpan = document.querySelector('#increase #tokenBLabel');

    if (tokenASpan) {
        const iconURL = tokenIconsBase[position.tokenA];
        if (iconURL) {
            tokenASpan.innerHTML = `<img src="${iconURL}" alt="${position.tokenA}" class="token-icon222" style="margin-right: 8px;"> ${position.tokenA}`;
        } else {
            tokenASpan.textContent = position.tokenA;
        }
    }

    if (tokenBSpan) {
        const iconURL = tokenIconsBase[position.tokenB];
        if (iconURL) {
            tokenBSpan.innerHTML = `<img src="${iconURL}" alt="${position.tokenB}" class="token-icon222" style="margin-right: 8px;"> ${position.tokenB}`;
        } else {
            tokenBSpan.textContent = position.tokenB;
        }
    }

    let inputTokenA = 0;
    let inputTokenB = 0;

    const tokenAInput = document.querySelector('#increase #tokenAAmount');
    const tokenBInput = document.querySelector('#increase #tokenBAmount');

    if (tokenAInput) inputTokenA = tokenAInput.value || 0;
    if (tokenBInput) inputTokenB = tokenBInput.value || 0;

    var maxAmountA = addWithPrecision(position.currentTokenA, inputTokenA, tokenAddressesDecimals[position.tokenA]);
    var maxAmountB = addWithPrecision(position.currentTokenB, inputTokenB, tokenAddressesDecimals[position.tokenB]);

    const totalLiquidityInput = document.querySelector('#increase input[readonly]');
    if (totalLiquidityInput) {
        totalLiquidityInput.value = `${(maxAmountA).toString()} ${position.tokenA} & ${(maxAmountB).toString()} ${position.tokenB}`;
    }
}

/**
 * Updates percentage slider for decrease liquidity
 * @param {number} value - Percentage value
 */
export function updatePercentage(value) {
    const percentageDisplay = document.getElementById('percentageDisplay');
    percentageDisplay.textContent = value + '%';

    const positionSelect = document.querySelector('#decrease select');
    const selectedPositionId = positionSelect.value;
    const position = positionData[selectedPositionId];

    const slider = document.querySelector('#decrease .slider');
    slider.style.setProperty('--value', value + '%');

    if (!position) return;

    const percentage = parseFloat(value) / 100;
    const removeAmount = percentage;

    const tokenAAmount = position.currentTokenA * removeAmount;
    const tokenBAmount = position.currentTokenB * removeAmount;

    var tokenaDecimals = tokenAddressesDecimals[position.tokenA];
    var tokenBDecimals = tokenAddressesDecimals[position.tokenB];

    const tokenInputs = document.querySelectorAll('#decrease .form-row input');
    if (tokenInputs.length >= 2) {
        tokenInputs[0].value = `${(tokenAAmount).toFixed(tokenaDecimals)} ${position.tokenA}`;
        tokenInputs[1].value = `${(tokenBAmount).toFixed(tokenBDecimals)} ${position.tokenB}`;
    }
}

/**
 * Updates staking percentage slider
 * @param {number} value - Percentage value
 */
export function updateStakePercentage(value) {
    const percentageDisplay = document.getElementById('stakePercentageDisplay');
    if (percentageDisplay) {
        percentageDisplay.textContent = value + '%';
    }

    const slider = document.querySelector('#stake-decrease .slider');
    slider.style.setProperty('--value', value + '%');

    const positionSelect = document.querySelector('#stake-decrease select');
    if (!positionSelect) return;

    const selectedPositionId = positionSelect.value;
    const position = stakingPositionData[selectedPositionId];

    if (!position) return;

    const percentage = parseFloat(value) / 100;
    const removeAmount = percentage;

    const tokenAAmount = position.currentTokenA * removeAmount;
    const tokenBAmount = position.currentTokenB * removeAmount;

    var tokenaDecimals = tokenAddressesDecimals[position.tokenA];
    var tokenBDecimals = tokenAddressesDecimals[position.tokenB];

    const tokenInputs = document.querySelectorAll('#stake-decrease .form-row input');
    if (tokenInputs.length >= 2) {
        var penaltyAsNumber = parseFloat(position.PenaltyForWithdraw.replace('%', ''));
        tokenInputs[0].value = `${(((tokenAAmount * (100 - penaltyAsNumber)) / 100)).toFixed(tokenaDecimals)} ${position.tokenA}`;
        tokenInputs[1].value = `${(((tokenBAmount * (100 - penaltyAsNumber)) / 100)).toFixed(tokenBDecimals)} ${position.tokenB}`;
    }
}

// =============================================================================
// STAKING STATS FUNCTIONS
// =============================================================================

/**
 * Updates staking stats display
 */
export function updateStakingStats() {
    const container = document.querySelector('#staking-main-page #stakingStatsContainer');
    if (!container) return;

    var tokencheck = Address_ZEROXBTC_TESTNETCONTRACT;
    var tokencheck2 = tokenAddresses['B0x'];

    let currency0, currency1;
    if (tokencheck.toLowerCase() < tokencheck2.toLowerCase()) {
        currency0 = tokencheck;
        currency1 = tokencheck2;
    } else {
        currency0 = tokencheck2;
        currency1 = tokencheck;
    }

    let statsHTML = '';

    statsHTML += `
        <div class="stat-card">
    `;

    const token0Name = getTokenNameFromAddress(currency0);
    const token1Name = getTokenNameFromAddress(currency1);

    statsHTML += `<div class="stat-value" id="totalStaked0">0 ${token0Name}</div>`;
    statsHTML += `<div class="stat-value" id="totalStaked1">0 ${token1Name}</div>`;

    statsHTML += `
            <div class="stat-label">Your Total Staked</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="APYPercentage">0%</div>
            <div class="stat-label">Your Current APY</div>
        </div>
    `;

    container.innerHTML = statsHTML;
}

/**
 * Updates staking values
 * @param {Array} stakedAmounts - Array of staked amounts
 * @param {string} apy - APY percentage
 */
export function updateStakingValues(stakedAmounts, apy) {
    let rawString = currentSettingsAddresses.contractAddresses;

    try {
        rawString = rawString.replace(/^"/, '').replace(/"$/, '');
        rawString = rawString.replace(/\\"/g, '"');
        var tokenAddresses1;
        tokenAddresses1 = JSON.parse(rawString);
    } catch (error) {
        console.error("Still can't parse:", error);
        tokenAddresses1 = rawString;
    }

    var tokencheck = Address_ZEROXBTC_TESTNETCONTRACT;
    var tokencheck2 = tokenAddresses['B0x'];

    let currency0, currency1;
    if (tokencheck.toLowerCase() < tokencheck2.toLowerCase()) {
        currency0 = tokencheck;
        currency1 = tokencheck2;
    } else {
        currency0 = tokencheck2;
        currency1 = tokencheck;
    }

    const element0 = document.getElementById(`totalStaked0`);
    if (element0) {
        const tokenName = getTokenNameFromAddress(currency0);
        element0.textContent = `${stakedAmounts[0] || '0'} ${tokenName}`;
    }

    const element1 = document.getElementById(`totalStaked1`);
    if (element1) {
        const tokenName = getTokenNameFromAddress(currency1);
        element1.textContent = `${stakedAmounts[1] || '0'} ${tokenName}`;
    }

    const apyElement = document.getElementById('APYPercentage');
    if (apyElement) {
        apyElement.textContent = `${apy}%`;
    }
}

// =============================================================================
// FORMAT FUNCTIONS
// =============================================================================

/**
 * Formats exact number without rounding
 * @param {*} value - Value to format
 * @returns {string} Formatted number
 */
export function formatExactNumber(value) {
    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'bigint') {
        return value.toString();
    }

    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return value.toFixed(0);
        }
        return value.toString();
    }

    return value.toString();
}

/**
 * Formats exact number with commas
 * @param {*} value - Value to format
 * @returns {string} Formatted number with commas
 */
export function formatExactNumberWithCommas(value) {
    const exactValue = formatExactNumber(value);
    return exactValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats large numbers with K/M/B suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
}

/**
 * Formats balance with decimals
 * @param {number} balance - Balance to format
 * @returns {string} Formatted balance
 */
export function formatBalance(balance) {
    return (balance / 1e18).toFixed(4);
}

/**
 * Truncates address for display
 * @param {string} address - Address to truncate
 * @returns {string} Truncated address
 */
export function truncateAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats time in seconds to readable format
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time
 */
export function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

// =============================================================================
// DROPDOWN UPDATE FUNCTIONS
// =============================================================================

/**
 * Updates position dropdown for staking
 */
export function updatePositionDropdown() {
    const positionSelect2 = document.querySelector('#staking-main-page select');
    if (!positionSelect2) return;

   // functionCallCounter++;
    incrementFunctionCallCounter();

    let selectionToPreserve;
    if (hasUserMadeSelection && userSelectedPosition && userSelectedPosition.startsWith('position_')) {
        selectionToPreserve = userSelectedPosition;
    } else {
        const currentValue = positionSelect2.value;
        if (currentValue && currentValue.startsWith('position_')) {
            selectionToPreserve = currentValue;
        } else {
            selectionToPreserve = null;
        }
    }

    positionSelect2.innerHTML = '';

    Object.values(positionData).forEach(position => {
        const option = document.createElement('option');
        option.value = position.id;
        option.textContent = `${position.pool} - ${position.feeTier} - Position #${position.id.split('_')[1]}`;
        positionSelect2.appendChild(option);
    });

    // Restore selection or default to first
    if (selectionToPreserve && positionSelect2.querySelector(`option[value="${selectionToPreserve}"]`)) {
        positionSelect2.value = selectionToPreserve;
    } else if (positionSelect2.options.length > 0) {
        positionSelect2.selectedIndex = 0;
    }

    updatePositionInfoMAIN_STAKING();
}

// =============================================================================
// TABLE RENDERING FUNCTIONS
// =============================================================================

/**
 * Renders table for staking rich list
 */
export function renderTable2() {
    const sortedData = [...filteredData].sort((a, b) => {
        return parseFloat(b.B0xStaked) - parseFloat(a.B0xStaked);
    });

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = sortedData.slice(start, end);

    let tableHTML = `
        <style>
            .address-link {
                color: white !important;
                text-decoration: none;
            }
            .address-link:visited,
            .address-link:hover,
            .address-link:active {
                color: white !important;
            }
            .address-link:hover {
                text-decoration: underline;
            }
        </style>
        <table>
            <thead>
                <tr>
                <th style="font-size: 1em; padding: 3px 4px;">Rank</th>
                <th style="font-size: 3em; padding: 12px 16px;">Address</th>
                <th style="font-size: 3em; padding: 12px 16px;">B0x Staked</th>
                <th style="font-size: 3em; padding: 12px 16px;">0xBTC Staked</th>
                </tr>
            </thead>
            <tbody>
    `;

    const globalStart = (currentPage - 1) * pageSize;
    pageData.forEach((user, index) => {
        const rank = globalStart + index + 1;

        var b0xStakedFormatted = 0;
        if (user.B0xStaked / 1e18 > 999.999) {
            b0xStakedFormatted = parseFloat(user.B0xStaked / 1e18).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        } else if (user.B0xStaked / 1e18 > 19.999) {
            b0xStakedFormatted = parseFloat(user.B0xStaked / 1e18).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1
            });
        } else if (user.B0xStaked / 1e18 > 1.999) {
            b0xStakedFormatted = parseFloat(user.B0xStaked / 1e18).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
        } else {
            b0xStakedFormatted = parseFloat(user.B0xStaked / 1e18).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3
            });
        }

        var btcStakedFormatted = 0;
        if (user['0xBTCStaked'] / 1e8 > 99.999) {
            btcStakedFormatted = (user['0xBTCStaked'] / 1e8).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            });
        } else if (user['0xBTCStaked'] / 1e8 > 9.999) {
            btcStakedFormatted = (user['0xBTCStaked'] / 1e8).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
            });
        } else if (user['0xBTCStaked'] / 1e8 > 1.999) {
            btcStakedFormatted = (user['0xBTCStaked'] / 1e8).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
        } else {
            btcStakedFormatted = (user['0xBTCStaked'] / 1e8).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3,
            });
        }

        tableHTML += `
            <tr>
                <td class="rank55">${rank}</td>
                <td>
                    <a href="https://basescan.org/address/${user.address}"
                       target="_blank"
                       class="address55 address-link"
                       title="${user.address}">
                        ${user.address}
                    </a>
                </td>
                <td class="balance55">${b0xStakedFormatted}</td>
                <td class="balance55">${btcStakedFormatted}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    document.getElementById('tableContent55').innerHTML = tableHTML;

    adjustTableForScreenSize();
}

/**
 * Renders pagination for staking rich list
 */
export function renderPagination2() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const pagination = document.getElementById('pagination55');

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';

    let paginationHTML = `
        <button onclick="changePage2(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
    `;

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage2(${i})" class="${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `;
    }

    paginationHTML += `
        <button onclick="changePage2(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
        <span class="pagination55-info">
            Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredData.length)}
            of ${filteredData.length} users
        </span>
    `;

    pagination.innerHTML = paginationHTML;
}

/**
 * Renders table for holder rich list
 */
export function renderTable() {
    const start = (currentPage2 - 1) * pageSize2;
    const end = start + pageSize2;
    const pageData = filteredData2.slice(start, end);

    let tableHTML = `
        <table class="table-rich">
            <thead>
                <tr>
                    <th class="balance-th-rank">Rank</th>
                    <th class="balance-th">Address</th>
                    <th class="balance-th-balance">Base B0x</th>
                    <th class="balance-th-balance">ETH B0x</th>
                </tr>
            </thead>
            <tbody>
    `;

    const screenWidth = window.innerWidth;
    const maxDecimals = screenWidth <= 650 ? 1 : 6;

    pageData.forEach((holder, index) => {
        var rank = "";
        if (sortByB0xBaseChain) {
            rank = holder.rankBaseB0x;
        } else {
            rank = holder.rankETHb0x;
        }
        tableHTML += `
            <tr>
                <td class="spot-rich">${rank}</td>
                <td class="address-rich" data-full-address="${holder.address}">
                    <a href="${_BLOCK_EXPLORER_ADDRESS_URL}${holder.address}" target="_blank">${holder.address}</a>
                </td>
                <td class="balance-rich">${holder.b0xBalance.toLocaleString(undefined, { maximumFractionDigits: maxDecimals })}</td>
                <td class="balance-rich">${holder.ethB0xBalance.toLocaleString(undefined, { maximumFractionDigits: maxDecimals })}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    document.getElementById('tableContent').innerHTML = tableHTML;

    setTimeout(fixsize, 50);
    renderPagination();
}

/**
 * Renders pagination for holder rich list
 */
export function renderPagination() {
    const totalPages = Math.ceil(filteredData2.length / pageSize2);
    const pagination = document.getElementById('pagination');

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';

    let paginationHTML = `
        <button ${currentPage2 === 1 ? 'disabled' : ''} onclick="changePage(${currentPage2 - 1})">Previous</button>
    `;

    const startPage = Math.max(1, currentPage2 - 2);
    const endPage = Math.min(totalPages, currentPage2 + 2);

    if (startPage > 1) {
        paginationHTML += '<button onclick="changePage(1)">1</button>';
        if (startPage > 2) paginationHTML += '<span>...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button ${i === currentPage2 ? 'class="active"' : ''} onclick="changePage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += '<span>...</span>';
        paginationHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    paginationHTML += `
        <button ${currentPage2 === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage2 + 1})">Next</button>
        <div class="pagination-info-rich">
            Showing ${((currentPage2 - 1) * pageSize2) + 1}-${Math.min(currentPage2 * pageSize2, filteredData2.length)} of ${filteredData2.length}
        </div>
    `;

    pagination.innerHTML = paginationHTML;
}

// =============================================================================
// STATS DISPLAY FUNCTIONS
// =============================================================================

/**
 * Update stats display in stats-home section with data from GetContractStatsWithMultiCall
 * @param {Object} stats - Stats object returned from GetContractStatsWithMultiCall
 */
export async function updateStatsDisplay(stats) {
    if (!stats) {
        console.warn('No stats data provided to updateStatsDisplay');
        return;
    }

    console.log('Updating stats display with:', stats);

    try {
        // Update Epoch Count
        const epochCountEl = document.querySelector('.stat-value-epochCount');
        if (epochCountEl && stats.epochCount) {
            epochCountEl.textContent = parseInt(stats.epochCount).toLocaleString();
        }

        // Update Current Reward Era
        const currentEraEl = document.querySelector('.stat-value-currentEra');
        if (currentEraEl && stats.rewardEra) {
            const era = parseInt(stats.rewardEra);
            currentEraEl.innerHTML = `${era.toLocaleString()} <span class="detail">/ 55 (next era: calculating...)</span>`;
        }

        // Update Mining Difficulty (will be calculated by updateAllMinerInfo)
        // This is complex and requires additional calculations from updateAllMinerInfo

        // Update Blocks to Readjust
        const blocksToGoEl = document.querySelector('.stat-value-blocksToGo');
        if (blocksToGoEl && stats.blocksToReadjust) {
            const blocksToGo = parseInt(stats.blocksToReadjust);
            // Approximate time: ~12 seconds per block on Base network
            const secondsUntilAdjust = blocksToGo * 12;
            const minutesUntilAdjust = Math.floor(secondsUntilAdjust / 60);
            const hoursUntilAdjust = Math.floor(minutesUntilAdjust / 60);

            let timeDisplay = '';
            let timeUnit = '';

            if (hoursUntilAdjust > 24) {
                const days = Math.floor(hoursUntilAdjust / 24);
                timeDisplay = days.toFixed(1);
                timeUnit = 'days';
            } else if (hoursUntilAdjust > 0) {
                timeDisplay = hoursUntilAdjust.toFixed(1);
                timeUnit = 'hours';
            } else {
                timeDisplay = minutesUntilAdjust.toFixed(0);
                timeUnit = 'minutes';
            }

            blocksToGoEl.innerHTML = `${blocksToGo.toLocaleString()} <span class="detail blocksToGoUnit">(~${timeDisplay} ${timeUnit})</span>`;
        }

        // Update Emergency Adjustment Time
        const emergencyEl = document.querySelector('.stat-value-emergency');
        if (emergencyEl && stats.secondsUntilSwitch) {
            const seconds = parseInt(stats.secondsUntilSwitch);
            const days = seconds / 86400;
            const hours = seconds / 3600;

            let timeDisplay = '';
            let timeUnit = '';

            if (days > 1) {
                timeDisplay = days.toFixed(1);
                timeUnit = 'days';
            } else {
                timeDisplay = hours.toFixed(1);
                timeUnit = 'hours';
            }

            emergencyEl.innerHTML = `${timeDisplay} <span class="detail emergencyUnit">${timeUnit}</span>`;
        }

        // Update Last Difficulty Start Block
        const lastDiffBlockEl = document.querySelector('.stat-value-lastDiffBlock');
        if (lastDiffBlockEl && stats.latestDiffPeriod) {
            const blockNum = parseInt(stats.latestDiffPeriod);
            lastDiffBlockEl.innerHTML = `${blockNum.toLocaleString()} <span class="detail lastDiffBlockDetail">(Base block)</span>`;
        }

        // Update Last Difficulty Time
        const lastDiffTimeEl = document.querySelector('.stat-value-lastDiffTime');
        if (lastDiffTimeEl && stats.latestDiffPeriod2) {
            const timestamp = parseInt(stats.latestDiffPeriod2);
            const date = new Date(timestamp * 1000);
            const timeAgo = getTimeAgo(timestamp);
            lastDiffTimeEl.innerHTML = `${date.toLocaleString()} <span class="detail lastDiffBlockDetail2">(${timeAgo})</span>`;
        }

        // Update Tokens Minted
        const distMiningEl = document.querySelector('.stat-value-distMining');
        if (distMiningEl && stats.tokensMinted) {
            const minted = parseFloat(stats.tokensMinted) / 1e18;
            distMiningEl.innerHTML = `${minted.toLocaleString(undefined, {maximumFractionDigits: 0})} <span class="unit">B0x</span>`;
        }

        // Update Max Supply for Era
        const maxSupplyEl = document.querySelector('.stat-value-MAxSupply');
        if (maxSupplyEl && stats.maxSupplyForEra) {
            const maxSupply = parseFloat(stats.maxSupplyForEra) / 1e18;
            maxSupplyEl.innerHTML = `${maxSupply.toLocaleString(undefined, {maximumFractionDigits: 0})} <span class="unit">B0x</span>`;
        }

        // Update Remaining Supply
        const remainingSupplyEl = document.querySelector('.stat-value-remainingSupply');
        if (remainingSupplyEl && stats.maxSupplyForEra && stats.tokensMinted) {
            const maxSupply = parseFloat(stats.maxSupplyForEra) / 1e18;
            const minted = parseFloat(stats.tokensMinted) / 1e18;
            const remaining = maxSupply - minted;

            // Estimate blocks remaining (assuming ~50 B0x per block as average)
            const avgRewardPerBlock = 50;
            const blocksRemaining = Math.floor(remaining / avgRewardPerBlock);

            remainingSupplyEl.innerHTML = `${remaining.toLocaleString(undefined, {maximumFractionDigits: 0})} <span class="unit">B0x <span class="detail">(~${blocksRemaining.toLocaleString()} blocks)</span></span>`;
        }

        // Update Mining Target (for reference, though not displayed in HTML)
        if (stats.miningTarget) {
            window.CURRENT_MINING_TARGET = stats.miningTarget;
        }

        // Fetch and update additional mining stats
        // Note: Most contract stats are already in 'stats' from GetContractStatsWithMultiCall above
        // We only need to fetch: Price (CoinGecko API), B0x price (swap contract), APY (staking), and Token Holders
        try {
            // Fetch price data from CoinGecko (external API - not in multicall)
            const priceData = await fetchPriceData();

            // Calculate B0x price using swap contract (separate call - not PoW contract)
            const b0xPriceData = await calculateB0xPrice();

            // Update price display
            const priceEl = document.querySelector('.stat-value-price');
            if (priceEl && b0xPriceData.usdCostB0x) {
                priceEl.innerHTML = `${b0xPriceData.usdCostB0x.toFixed(4)} <span class="unit">$</span>`;
            }

            // Update APY display (from staking module)
            const apyEl = document.querySelector('.stat-value-stakeAPY');
            const currentAPY = window.APYFINAL || APYFINAL || 0;
            if (apyEl && currentAPY) {
                apyEl.innerHTML = `${currentAPY.toFixed(2)} <span class="unit">%</span>`;
            }

            // Update difficulty from multicall stats (already fetched above)
            const difficultyEl = document.querySelector('.stat-value-difficulty');
            if (difficultyEl && stats.miningDifficulty) {
                // Convert from contract units (difficulty is stored as difficulty * 524288)
                const difficulty = parseFloat(stats.miningDifficulty) / 524_288;
                difficultyEl.innerHTML = `${difficulty.toLocaleString(undefined, {maximumFractionDigits: 2})} <span class="detail">(mining difficulty)</span>`;
            }

            // Calculate and update hashrate (uses inflationMined.timePerEpoch and miningDifficulty from stats)
            await calculateAndDisplayHashrate();
            const hashrateEl = document.querySelector('.stat-value-hashrate');
            if (hashrateEl && formattedHashrate) {
                hashrateEl.innerHTML = `${formattedHashrate} <span class="detail">(network hashrate)</span>`;
            }

            // Update average reward time from multicall stats (already fetched above)
            const avgRewardEl = document.querySelector('.stat-value-averageRewardTime');
            const avgRewardTime = parseFloat(stats.inflationMined.timePerEpoch);
            if (avgRewardEl && avgRewardTime) {
                avgRewardEl.innerHTML = `${avgRewardTime.toFixed(1)} <span class="detail">seconds</span>`;
            }

            // Update reward per solve from multicall stats (already fetched above)
            const rewardPerSolveEl = document.querySelector('.stat-value-rewardPerSolve');
            const rewardPerSolve = parseFloat(stats.inflationMined.rewardsAtTime) / 1e18;
            if (rewardPerSolveEl && rewardPerSolve) {
                rewardPerSolveEl.innerHTML = `${rewardPerSolve.toFixed(2)} <span class="detail">B0x per solve</span>`;
            }

            // Update token holders (placeholder - needs separate API integration)
            const tokenHolders = await getTokenHolders();
            const holdersEl = document.querySelector('.stat-value-tokenHolders');
            if (holdersEl && tokenHolders) {
                holdersEl.textContent = tokenHolders.toLocaleString();
            }

            console.log('✓ Additional mining stats updated successfully');

        } catch (error) {
            console.error('Error updating additional mining stats:', error);
        }

        console.log('✓ Stats display updated successfully');

    } catch (error) {
        console.error('Error updating stats display:', error);
    }
}

/**
 * Helper function to get time ago from timestamp
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Human-readable time ago string
 */
function getTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const secondsAgo = now - timestamp;

    if (secondsAgo < 60) {
        return `${secondsAgo} seconds ago`;
    } else if (secondsAgo < 3600) {
        const minutes = Math.floor(secondsAgo / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (secondsAgo < 86400) {
        const hours = Math.floor(secondsAgo / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(secondsAgo / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}

// =============================================================================
// HASHRATE AND MINING STATS FUNCTIONS
// =============================================================================

/**
 * Mining stats functions extracted from script.js
 *
 * These functions handle:
 * - Hashrate calculation from mining difficulty and time per epoch
 * - Formatting hashrate with appropriate units (H/s, KH/s, MH/s, etc.)
 * - Fetching mining data from contracts via multicall
 * - Updating DOM elements with calculated values
 *
 * Note: updateAllMinerInfo() from script.js is a large, complex function that:
 * - Fetches mined block data from remote sources and localStorage
 * - Processes mining transactions and calculates miner statistics
 * - Updates rich lists and distribution charts
 * - Can be integrated here if needed for stats display
 * Currently it remains in script.js due to its complexity and many dependencies
 */

// State variables for hashrate calculation
let prevHashrate = 0;
let prevTimeInFunc = Date.now();
export let formattedHashrate = '0 H/s';

/**
 * Sleep utility for async delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format hashrate with appropriate unit (H/s, KH/s, MH/s, etc.)
 * @param {number} hashrate - Hashrate in H/s
 * @returns {string} Formatted hashrate string with unit
 */
export function formatHashrate(hashrate) {
    const units = [
        { suffix: 'EH/s', divisor: 1e18 },
        { suffix: 'PH/s', divisor: 1e15 },
        { suffix: 'TH/s', divisor: 1e12 },
        { suffix: 'GH/s', divisor: 1e9 },
        { suffix: 'MH/s', divisor: 1e6 },
        { suffix: 'KH/s', divisor: 1e3 },
        { suffix: 'H/s', divisor: 1 }
    ];

    for (const unit of units) {
        if (hashrate >= unit.divisor) {
            const value = hashrate / unit.divisor;
            return `${value.toFixed(2)} ${unit.suffix}`;
        }
    }

    return `${hashrate.toFixed(2)} H/s`;
}

/**
 * Calculate hashrate from mining parameters
 * Formula: hashrate = 2^22 * difficulty / time
 * @param {number} timePerEpoch - Average time in seconds per epoch
 * @param {number} miningDifficulty - Current mining difficulty
 * @returns {number} Calculated hashrate in H/s
 */
export function calculateHashrate(timePerEpoch, miningDifficulty) {
    console.log("calculateHashrate inputs - timePerEpoch:", timePerEpoch, "miningDifficulty:", miningDifficulty);

    // Constants
    const POWER_OF_22 = Math.pow(2, 22); // 2^22 = 4,194,304
    const DIVISOR = 524_288; // Given divisor

    // Validate inputs
    if (timePerEpoch <= 0) {
        throw new Error("TimePerEpoch must be greater than 0");
    }

    if (miningDifficulty <= 0) {
        throw new Error("Mining difficulty must be greater than 0");
    }

    // Adjust difficulty
    const adjustedDifficulty = miningDifficulty / DIVISOR;

    // Calculate hashrate: (2^22 * adjusted_difficulty) / time_per_epoch
    const hashrate = (POWER_OF_22 * adjustedDifficulty) / timePerEpoch;

    console.log("Calculated hashrate:", hashrate, "H/s");
    return hashrate;
}

/**
 * Calculate and display current network hashrate
 * Fetches mining difficulty and time per epoch from contract
 * Updates formattedHashrate export variable
 * @returns {Promise<number|null>} Calculated hashrate or null on error
 */
export async function calculateAndDisplayHashrate() {
    const currentTime = Date.now();
    const timeDiff = currentTime - prevTimeInFunc;
    console.log("prevHashrate:", prevHashrate);

    // Throttle: Only run once every 120 seconds
    if (timeDiff < 120000 && prevHashrate != 0) {
        console.log("Throttled: calculateAndDisplayHashrate not called (ran recently)");
        return prevHashrate;
    }

    if (prevHashrate == 0) {
        console.log("First run: Previous hashrate = 0");
    }

    console.log("Running calculateAndDisplayHashrate");

    // Update the timestamp after execution
    prevTimeInFunc = Date.now();

    try {
        await sleep(500);
        console.log("Custom RPC:", customRPC);

        const provider = new ethers.providers.JsonRpcProvider(customRPC);

        // Define the two function signatures
        const inflationMinedInterface = new ethers.utils.Interface([{
            "inputs": [],
            "name": "inflationMined",
            "outputs": [
                {"internalType": "uint256", "name": "YearlyInflation", "type": "uint256"},
                {"internalType": "uint256", "name": "EpochsPerYear", "type": "uint256"},
                {"internalType": "uint256", "name": "RewardsAtTime", "type": "uint256"},
                {"internalType": "uint256", "name": "TimePerEpoch", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        }]);

        const getMiningDifficultyInterface = new ethers.utils.Interface([{
            "inputs": [],
            "name": "getMiningDifficulty",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }]);

        // Multicall3 ABI
        const multicall3ABI = [{
            "inputs": [
                {
                    "components": [
                        {"internalType": "address", "name": "target", "type": "address"},
                        {"internalType": "bool", "name": "allowFailure", "type": "bool"},
                        {"internalType": "bytes", "name": "callData", "type": "bytes"}
                    ],
                    "internalType": "struct Multicall3.Call3[]",
                    "name": "calls",
                    "type": "tuple[]"
                }
            ],
            "name": "aggregate3",
            "outputs": [
                {
                    "components": [
                        {"internalType": "bool", "name": "success", "type": "bool"},
                        {"internalType": "bytes", "name": "returnData", "type": "bytes"}
                    ],
                    "internalType": "struct Multicall3.Result[]",
                    "name": "returnData",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }];

        // Multicall3 contract address (same on most chains)
        const multicall3Address = "0xcA11bde05977b3631167028862bE2a173976CA11";

        const multicall3Contract = new ethers.Contract(
            multicall3Address,
            multicall3ABI,
            provider
        );

        // Encode the call data for both functions
        const inflationMinedCallData = inflationMinedInterface.encodeFunctionData("inflationMined");
        const getMiningDifficultyCallData = getMiningDifficultyInterface.encodeFunctionData("getMiningDifficulty");

        // Prepare the calls array
        const calls = [
            {
                target: ProofOfWorkAddresss,
                allowFailure: false,
                callData: inflationMinedCallData
            },
            {
                target: ProofOfWorkAddresss,
                allowFailure: false,
                callData: getMiningDifficultyCallData
            }
        ];

        // Execute multicall
        const results = await multicall3Contract.aggregate3(calls);

        // Decode results
        const inflationMinedResult = inflationMinedInterface.decodeFunctionResult(
            "inflationMined",
            results[0].returnData
        );
        const miningDifficultyResult = getMiningDifficultyInterface.decodeFunctionResult(
            "getMiningDifficulty",
            results[1].returnData
        );

        const timePerEpoch = inflationMinedResult[3];
        const miningDifficulty = miningDifficultyResult[0];

        console.log("TimePerEpoch:", timePerEpoch);
        console.log("getMiningDifficulty:", miningDifficulty);

        // Calculate and display hashrate
        const hashrate = calculateHashrate(timePerEpoch, miningDifficulty);

        console.log("=== Hashrate Calculation ===");
        console.log(`Time Per Epoch: ${timePerEpoch} seconds`);
        console.log(`Mining Difficulty: ${miningDifficulty}`);
        console.log(`Adjusted Difficulty: ${miningDifficulty / 524_288}`);
        console.log(`Calculated Hashrate: ${hashrate.toLocaleString()} H/s`);

        formattedHashrate = formatHashrate(hashrate);

        console.log("\n=== Formatted Hashrate ===");
        console.log(formattedHashrate);

        prevHashrate = hashrate;

        // Update DOM element if it exists
        const hashrateEl = document.getElementById('hashrate');
        if (hashrateEl) {
            hashrateEl.textContent = formattedHashrate;
        }

        return hashrate;

    } catch (error) {
        console.error("Error calculating hashrate:", error.message);
        await sleep(3500);
        return null;
    }
}

// =============================================================================
// ADDITIONAL MINING STATS FUNCTIONS
// =============================================================================

/**
 * Fetch price data from CoinGecko API
 * Updates global price variables
 * @returns {Promise<{wethPriceUSD: number, oxbtcPriceUSD: number}>}
 */
export async function fetchPriceData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=weth,oxbitcoin&vs_currencies=usd');
        const data = await response.json();

        const wethPrice = data.weth.usd;
        const oxbtcPrice = data['oxbitcoin'].usd;

        console.log("Fetched WETH price USD:", wethPrice);
        console.log("Fetched 0xBTC price USD:", oxbtcPrice);

        // Update window variables for backwards compatibility
        window.wethPriceUSD = wethPrice;
        window.oxbtcPriceUSD = oxbtcPrice;

        return { wethPriceUSD: wethPrice, oxbtcPriceUSD: oxbtcPrice };
    } catch (error) {
        console.error("Error fetching CoinGecko prices:", error);
        return { wethPriceUSD: 0, oxbtcPriceUSD: 0 };
    }
}

/**
 * Calculate B0x to 0xBTC ratio and USD price
 * Uses swap contract to get exchange rate
 * @returns {Promise<{ratioB0xTo0xBTC: number, usdCostB0x: number}>}
 */
export async function calculateB0xPrice() {
    try {
        const tokenSwapperABI = [
            {
                "inputs": [
                    { "name": "tokenZeroxBTC", "type": "address" },
                    { "name": "tokenBZeroX", "type": "address" },
                    { "name": "tokenIn", "type": "address" },
                    { "name": "hookAddress", "type": "address" },
                    { "name": "amountIn", "type": "uint128" }
                ],
                "name": "getOutput",
                "outputs": [{ "name": "amountOut", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        const provider = new ethers.providers.JsonRpcProvider(customRPC);
        const tokenSwapperContract = new ethers.Contract(
            contractAddress_Swapper,
            tokenSwapperABI,
            provider
        );

        const tokenInputAddress = tokenAddresses['B0x'];
        const amountToSwap = BigInt(10 ** 18);

        const result = await tokenSwapperContract.callStatic.getOutput(
            tokenAddresses['0xBTC'],
            tokenAddresses['B0x'],
            tokenInputAddress,
            hookAddress,
            amountToSwap
        );

        // Convert to proper numbers
        const amountOutNumber = Number(result) / (10 ** 8); // 0xBTC has 8 decimals
        const amountToSwapNumber = Number(amountToSwap) / (10 ** 18); // B0x has 18 decimals
        const exchangeRate = amountOutNumber / amountToSwapNumber; // 0xBTC per B0x

        // Get current 0xBTC price
        const oxbtcPrice = window.oxbtcPriceUSD || 0;

        ratioB0xTo0xBTC = exchangeRate;
        usdCostB0x = exchangeRate * oxbtcPrice;

        console.log("B0x to 0xBTC ratio:", ratioB0xTo0xBTC);
        console.log("USD cost of B0x:", usdCostB0x);

        return { ratioB0xTo0xBTC, usdCostB0x };
    } catch (error) {
        console.error("Error calculating B0x price:", error);
        return { ratioB0xTo0xBTC: 0, usdCostB0x: 0 };
    }
}

/**
 * Get mining target from contract
 * @param {Object} provider - Ethers provider
 * @returns {Promise<string>} Mining target as string
 */
export async function getTarget(provider) {
    const contractABI = [{
        "inputs": [],
        "name": "miningTarget",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }];

    const contract = new ethers.Contract(ProofOfWorkAddresss, contractABI, provider);
    const miningTarget = await contract.miningTarget();
    return miningTarget.toString();
}

/**
 * Get mining difficulty from target
 * Formula: difficulty = (2^253 / target) / 524,288
 * @param {Object} provider - Ethers provider
 * @returns {Promise<string>} Difficulty as string
 */
export async function getDifficulty(provider) {
    const target = parseFloat(await getTarget(provider));
    const difficulty = ((2 ** 253) / target) / 524_288;

    // Update DOM if element exists
    const difficultyInput = document.getElementById("difficulty-input");
    if (difficultyInput) {
        difficultyInput.value = difficulty;
    }

    return difficulty.toString();
}

/**
 * Get epoch count from contract
 * @param {Object} provider - Ethers provider
 * @returns {Promise<string>} Epoch count as string
 */
export async function getEpochCount(provider) {
    const contractABI = [{
        "inputs": [],
        "name": "epochCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }];

    const contract = new ethers.Contract(ProofOfWorkAddresss, contractABI, provider);
    const epochCount = await contract.epochCount();
    console.log("epochCount:", epochCount);
    return epochCount.toString();
}

/**
 * Get average reward time and inflation data from contract
 * @param {Object} provider - Ethers provider
 * @returns {Promise<Object>} Inflation data object
 */
export async function getAvgRewardTime(provider) {
    const contractABI = [{
        "inputs": [],
        "name": "inflationMined",
        "outputs": [
            { "internalType": "uint256", "name": "YearlyInflation", "type": "uint256" },
            { "internalType": "uint256", "name": "EpochsPerYear", "type": "uint256" },
            { "internalType": "uint256", "name": "RewardsAtTime", "type": "uint256" },
            { "internalType": "uint256", "name": "TimePerEpoch", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }];

    const contract = new ethers.Contract(ProofOfWorkAddresss, contractABI, provider);
    const result = await contract.inflationMined();

    return {
        YearlyInflation: result[0].toString(),
        EpochsPerYear: result[1].toString(),
        RewardsAtTime: result[2].toString(),
        TimePerEpoch: result[3].toString()
    };
}

/**
 * Get reward per solve
 * @returns {Promise<number>} Reward per solve (currently uses inflationMined data)
 */
export async function getRewardPerSolve(provider) {
    try {
        const inflationData = await getAvgRewardTime(provider);
        // RewardsAtTime is the current reward per solve
        const rewardPerSolve = parseFloat(inflationData.RewardsAtTime) / 1e18;
        return rewardPerSolve;
    } catch (error) {
        console.error("Error getting reward per solve:", error);
        return 50; // Fallback value
    }
}

/**
 * Get blocks to readjust from contract
 * @param {Object} provider - Ethers provider
 * @returns {Promise<string>} Blocks to readjust as string
 */
export async function getBlocksToReadjust(provider) {
    const contractABI = [{
        "inputs": [],
        "name": "blocksToReadjust",
        "outputs": [{ "internalType": "uint256", "name": "blocks", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }];

    const contract = new ethers.Contract(ProofOfWorkAddresss, contractABI, provider);
    const blocks = await contract.blocksToReadjust();
    return blocks.toString();
}

/**
 * Get time until emergency adjustment
 * @param {Object} provider - Ethers provider
 * @returns {Promise<string>} Seconds until emergency adjustment
 */
export async function getTimeEmergency(provider) {
    const contractABI = [{
        "inputs": [],
        "name": "seconds_Until_adjustmentSwitch",
        "outputs": [{ "internalType": "uint256", "name": "secs", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }];

    const contract = new ethers.Contract(ProofOfWorkAddresss, contractABI, provider);
    const secs = await contract.seconds_Until_adjustmentSwitch();
    return secs.toString();
}

/**
 * Get reward era from contract
 * @param {Object} provider - Ethers provider
 * @returns {Promise<string>} Reward era as string
 */
export async function getRewardEra(provider) {
    const contractABI = [{
        "inputs": [],
        "name": "rewardEra",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }];

    const contract = new ethers.Contract(ProofOfWorkAddresss, contractABI, provider);
    const rewardEra = await contract.rewardEra();
    return rewardEra.toString();
}

/**
 * Get token holders count
 * @returns {Promise<number>} Token holders count (placeholder - needs API integration)
 */
export async function getTokenHolders() {
    // TODO: Integrate with token holder API
    // This is a placeholder that should be replaced with actual API call
    return 1000;
}

/**
 * Comprehensive stats update function
 * Fetches all mining and price stats and updates the display
 * @returns {Promise<Object>} Object containing all stats
 */
export async function updateAllMiningStats() {
    console.log('Updating all mining stats...');

    try {
        const provider = new ethers.providers.JsonRpcProvider(customRPC);

        // Fetch all data in parallel where possible
        const [
            priceData,
            difficulty,
            epochCount,
            inflationData,
            blocksToReadjust,
            timeEmergency,
            rewardEra,
            tokenHolders
        ] = await Promise.all([
            fetchPriceData(),
            getDifficulty(provider),
            getEpochCount(provider),
            getAvgRewardTime(provider),
            getBlocksToReadjust(provider),
            getTimeEmergency(provider),
            getRewardEra(provider),
            getTokenHolders()
        ]);

        // Calculate B0x price after we have 0xBTC price
        const b0xPriceData = await calculateB0xPrice();

        // Calculate hashrate
        await calculateAndDisplayHashrate();

        // Calculate reward per solve
        const rewardPerSolve = parseFloat(inflationData.RewardsAtTime) / 1e18;
        const avgRewardTime = parseFloat(inflationData.TimePerEpoch);

        const stats = {
            price: b0xPriceData.usdCostB0x,
            wethPriceUSD: priceData.wethPriceUSD,
            oxbtcPriceUSD: priceData.oxbtcPriceUSD,
            ratioB0xTo0xBTC: b0xPriceData.ratioB0xTo0xBTC,
            apy: window.APYFINAL || APYFINAL || 0,
            difficulty: parseFloat(difficulty),
            hashrate: formattedHashrate,
            avgRewardTime: avgRewardTime,
            rewardPerSolve: rewardPerSolve,
            epochCount: parseInt(epochCount),
            blocksToReadjust: parseInt(blocksToReadjust),
            timeEmergency: parseInt(timeEmergency),
            rewardEra: parseInt(rewardEra),
            tokenHolders: tokenHolders
        };

        // Update DOM elements
        updateMiningStatsDisplay(stats);

        console.log('✓ All mining stats updated successfully');
        return stats;

    } catch (error) {
        console.error('Error updating all mining stats:', error);
        return null;
    }
}

/**
 * Update DOM elements with mining stats
 * @param {Object} stats - Stats object from updateAllMiningStats
 */
export function updateMiningStatsDisplay(stats) {
    if (!stats) return;

    try {
        // Update price
        const priceEl = document.querySelector('.stat-value-price');
        if (priceEl && stats.price) {
            priceEl.innerHTML = `${stats.price.toFixed(4)} <span class="unit">$</span>`;
        }

        // Update APY
        const apyEl = document.querySelector('.stat-value-stakeAPY');
        if (apyEl && stats.apy) {
            apyEl.innerHTML = `${stats.apy.toFixed(2)} <span class="unit">%</span>`;
        }

        // Update difficulty
        const difficultyEl = document.querySelector('.stat-value-difficulty');
        if (difficultyEl && stats.difficulty) {
            difficultyEl.innerHTML = `${stats.difficulty.toLocaleString(undefined, {maximumFractionDigits: 2})} <span class="detail">(mining difficulty)</span>`;
        }

        // Update hashrate
        const hashrateEl = document.querySelector('.stat-value-hashrate');
        if (hashrateEl && stats.hashrate) {
            hashrateEl.innerHTML = `${stats.hashrate} <span class="detail">(network hashrate)</span>`;
        }

        // Update average reward time
        const avgRewardEl = document.querySelector('.stat-value-averageRewardTime');
        if (avgRewardEl && stats.avgRewardTime) {
            avgRewardEl.innerHTML = `${stats.avgRewardTime.toFixed(1)} <span class="detail">seconds</span>`;
        }

        // Update reward per solve
        const rewardPerSolveEl = document.querySelector('.stat-value-rewardPerSolve');
        if (rewardPerSolveEl && stats.rewardPerSolve) {
            rewardPerSolveEl.innerHTML = `${stats.rewardPerSolve.toFixed(2)} <span class="detail">B0x per solve</span>`;
        }

        // Update token holders (if element exists)
        const holdersEl = document.querySelector('.stat-value-tokenHolders');
        if (holdersEl && stats.tokenHolders) {
            holdersEl.textContent = stats.tokenHolders.toLocaleString();
        }

        console.log('✓ Mining stats display updated');

    } catch (error) {
        console.error('Error updating mining stats display:', error);
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    // Notifications
    hideNotification,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    showToast,
    showAlert,
    showSuccessMessage,

    // Loading widgets
    showLoadingWidget,
    updateLoadingStatusWidget,
    setLoadingProgress,
    hideLoadingWidget,
    updateLoadingStatus,
    showLoadingScreen,
    hideLoadingScreen,

    // Tab switching
    switchTab,
    switchTabForStats,
    switchTab2,
    updateURL,

    // Wallet UI
    updateWalletUI,
    displayWalletBalances,
    displayWalletBalancesETH,

    // Widget updates
    updateWidget,
    handleWidgetVisibility,

    // Token icons
    updateTokenIcon,
    updateTokenIconETH,
    updateTokenIconCreate,
    updateTokenSelection,

    // Token filters
    filterTokenOptionsCreate,
    filterTokenOptionsSwap,
    filterTokenOptionsSwapETH,

    // Position info
    updatePositionInfoMAIN_STAKING,
    updatePositionInfoMAIN_UNSTAKING,
    updatePositionInfo,
    updateTotalLiqIncrease,
    updatePercentage,
    updateStakePercentage,

    // Staking stats
    updateStakingStats,
    updateStakingValues,

    // Stats display
    updateStatsDisplay,

    // Formatting
    formatExactNumber,
    formatExactNumberWithCommas,
    formatNumber,
    formatBalance,
    truncateAddress,
    formatTime,

    // Dropdowns
    updatePositionDropdown,

    // Tables
    renderTable2,
    renderPagination2,
    renderTable,
    renderPagination
};
