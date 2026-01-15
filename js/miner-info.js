/**
 * @module miner-info
 * @description Miner statistics, mining transactions, and rich list processing
 *
 * This module handles:
 * - Fetching mined block data from localStorage and remote sources
 * - Processing mining transactions and calculating miner statistics
 * - Updating rich lists and distribution data
 * - Rendering miner tables and pie charts
 * - Real-time mining data synchronization
 *
 * Main Functions:
 * - updateAllMinerInfoFirst() - Entry point wrapper
 * - updateAllMinerInfo() - Core mining data processing
 * - fetchTransactionsData() - Fetch transaction cost data
 * - showBlockDistributionPieChart() - Render mining distribution charts
 * - getMinerName/Color/Link() - Miner display helpers
 */

// Import dependencies
import { ProofOfWorkAddresss } from './config.js';
import { customDataSource, customBACKUPDataSource, customRPC} from './settings.js';
import { walletConnected, provider } from './wallet.js';
import { getEpochCount } from './ui.js';
// ============================================
// CONSTANTS
// ============================================

const _MINT_TOPIC = "0xcf6fbb9dcea7d07263ab4f5c3a92f53af33dffc421d9d121e1c74b307e68189d";
const _BLOCK_EXPLORER_ADDRESS_URL = 'https://basescan.org/address/';
const _BLOCK_EXPLORER_TX_URL = 'https://basescan.org/tx/';
const _BLOCK_EXPLORER_BLOCK_URL = 'https://basescan.org/block/';
const _SECONDS_PER_ETH_BLOCK = 2;

// ============================================
// POOL COLORS AND KNOWN MINERS
// ============================================

/**
 * Pool color definitions for visual identification
 */
export const pool_colors = {
    orange: "#C64500",
    purple: "#4527A0",
    blue: "#0277BD",
    green: "#2E7D32",
    yellow: "#997500",
    darkpurple: "#662354",
    darkred: "hsl(356, 48%, 30%)",
    teal: "#009688",
    red: "#f44336",
    slate: "#34495e",
    brightred: "#C62828",
    royal: "#0070bc",
    pink: "#EC407A",
    grey: "#78909c",
    lightpurple: "#9c27b0",
    lime: "#cddc39",
    brown: "#8d6e63",
};

/**
 * Known miners/pools registry
 * Format: [name, url, color]
 */
export const known_miners = {
    "0x49228d306754af5d16d477149ee50bef5ca286be": ["BWORK Mining Pool", "http://pool.basedworktoken.org/", pool_colors.orange],
    "0x98181a5f3b91117426331b54e2a47e8fa74f56b0": ["BWORK Mining Pool", "http://pool.basedworktoken.org/", pool_colors.orange],
    "0xce2e772f8bcf36901bacf31dfc67e38954e15754": ["Mineable Token Pool", "https://pool.0xmt.com/", pool_colors.orange],
    "0xeabe48908503b7efb090f35595fb8d1a4d55bd66": ["ABAS Mining Pool", "http://pool.abastoken.org/", pool_colors.orange],
    "0x53ce57325c126145de454719b4931600a0bd6fc4": ["0xPool", "http://0xPool.io", pool_colors.purple],
    "0x98b155d9a42791ce475acc336ae348a72b2e8714": ["0xBTCpool", "http://0xBTCpool.com", pool_colors.blue],
    "0x363b5534fb8b5f615583c7329c9ca8ce6edaf6e6": ["mike.rs pool", "http://mike.rs", pool_colors.green],
    "0x50212e78d96a183f415e1235e56e64416d972e93": ["mike.rs pool", "http://mike.rs", pool_colors.green],
    "0x02c8832baf93380562b0c8ce18e2f709d6514c60": ["mike.rs pool B", "http://b.mike.rs", pool_colors.green],
    "0x8dcee1c6302232c4cc5ce7b5ee8be16c1f9fd961": ["Mine0xBTC", "http://mine0xbtc.eu", pool_colors.darkpurple],
    "0x20744acca6966c0f45a80aa7baf778f4517351a4": ["PoolOfD32th", "http://0xbtc.poolofd32th.club", pool_colors.darkred],
    "0xd4ddfd51956c19f624e948abc8619e56e5dc3958": ["0xMiningPool", "http://0xminingpool.com/", pool_colors.teal],
    "0x88c2952c9e9c56e8402d1b6ce6ab986747336b30": ["0xbtc.wolfpool.io", "http://wolfpool.io/", pool_colors.red],
    "0x540d752a388b4fc1c9deeb1cd3716a2b7875d8a6": ["tosti.ro", "http://0xbtc.tosti.ro/", pool_colors.slate],
    "0xbbdf0402e51d12950bd8bbd50a25ed1aba5615ef": ["ExtremeHash", "http://0xbtc.extremehash.io/", pool_colors.brightred],
    "0x7d28994733e6dbb93fc285c01d1639e3203b54e4": ["Wutime.com", "http://wutime.com/", pool_colors.royal],
    "0x02e03db268488716c161721663501014fa031250": ["xb.veo.network", "https://xb.veo.network:2096/", pool_colors.pink],
    "0xbf39de3c506f1e809b4e10e00dd22eb331abf334": ["xb.veo.network", "https://xb.veo.network:2096/", pool_colors.pink],
    "0x5404bd6b428bb8e326880849a61f0e7443ef5381": ["666pool", "http://0xbtc.666pool.cn/", pool_colors.grey],
    "0x7d3ebd2b56651d164fc36180050e9f6f7b890e9d": ["MVIS Mining Pool", "http://mvis.ca", pool_colors.blue],
    "0xd3e89550444b7c84e18077b9cbe3d4e3920f257d": ["0xPool", "https://0xpool.me/", pool_colors.purple],
    "0x6917035f1deecc51fa475be4a2dc5528b92fd6b0": ["PiZzA pool", "http://gpu.PiZzA", pool_colors.yellow],
    "0x693d59285fefbd6e7be1b687be959eade2a4bf099": ["PiZzA pool", "http://gpu.PiZzA", pool_colors.yellow],
    "0x697f698dd492d71734bcaec77fd5065fa7a95a63": ["PiZzA pool", "http://gpu.PiZzA", pool_colors.yellow],
    "0x69ebd94944f0dba3e9416c609fbbe437b45d91ab": ["PiZzA pool", "http://gpu.PiZzA", pool_colors.yellow],
    "0x69b85604799d16d938835852e497866a7b280323": ["PiZzA pool", "http://gpu.PiZzA", pool_colors.yellow],
    "0x69ded73bd88a72bd9d9ddfce228eadd05601edd7": ["PiZzA pool", "http://gpu.PiZzA", pool_colors.yellow],
};

// ============================================
// STATE VARIABLES
// ============================================

let previousEpochCount = null;
export let lastBaseBlock = 0;
export let currentBlock = 0;
export let estHashrate = 0;
export function setEstHashrate(value) {
    estHashrate = value;
    console.log('estHashrate set to:', estHashrate);
}
export let lastDifficultyStartBlock = 0;
export let sorted_miner_block_count_recent_hash = [];
export let sorted_miner_block_count = [];

// Block pagination state
let allMinedBlocks = []; // Store all blocks
let currentlyDisplayedBlocks = 0;
const BLOCKS_PER_PAGE = 3000; // Show 3000 blocks at a time
let blockRenderContext = null; // Store context for rendering (date_of_last_mint, etc)

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sleep utility for async delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract miner address from topic
 * @param {string} topic - Ethereum log topic
 * @returns {string} Miner address
 */
export function getMinerAddressFromTopic(topic) {
    return '0x' + topic.substr(26, 41);
}

/**
 * Get miner display name
 * @param {string} address - Miner address
 * @param {Object} known_miners - Known miners registry
 * @returns {string} Display name
 */
export function getMinerName(address, known_miners) {
    if (known_miners[address] !== undefined) {
        return known_miners[address][0];
    } else {
        return address.substr(0, 14) + '...';
    }
}

/**
 * Get miner color for visual identification
 * @param {string} address - Miner address
 * @param {Object} known_miners - Known miners registry
 * @returns {string} HSL color string
 */
export function getMinerColor(address, known_miners) {
    function simpleHash(seed, string) {
        var h = seed;
        for (var i = 0; i < string.length; i++) {
            h = ((h << 5) - h) + string[i].codePointAt();
            h &= 0xFFFFFFFF;
        }
        return h;
    }

    if (known_miners[address] !== undefined) {
        var hexcolor = known_miners[address][2];
    } else {
        var test = (simpleHash(2, address) % 360);
        if ((simpleHash(2, address) % 360) < 0) {
            test = (simpleHash(2, address) % 360) + 360;
        }
        hexcolor = 'hsl(' + test + ', 48%, 30%)';
    }
    return hexcolor;
}

/**
 * Get miner name as clickable HTML link
 * @param {string} address - Miner address
 * @param {Object} known_miners - Known miners registry
 * @returns {string} HTML string
 */
export function getMinerNameLinkHTML(address, known_miners) {
    var hexcolor = getMinerColor(address, known_miners);
    var poolstyle = '<span style="background-color: ' + hexcolor + ';" class="miner-name">';

    if (known_miners[address] !== undefined) {
        var readable_name = known_miners[address][0];
        var address_url = known_miners[address][1];
    } else {
        var readable_name = address.substr(0, 14) + '...';
        var address_url = _BLOCK_EXPLORER_ADDRESS_URL + address;
    }

    return '<a href="' + address_url + '" target="_blank">' + poolstyle + readable_name + '</span></a>';
}

/**
 * Convert hashrate to human-readable format
 * @param {number} hashratez - Hashrate in H/s
 * @returns {string} Formatted hashrate string
 */
export function convertHashRateToReadable2(hashratez) {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s'];
    let unitIndex = 0;
    let value = parseFloat(hashratez);

    while (value >= 1000 && unitIndex < units.length - 1) {
        value = value / 1000;
        unitIndex++;
    }

    return value.toFixed(2) + ' ' + units[unitIndex];
}

/**
 * Fetch transaction cost data for miners
 * @param {Array} miner_blk_cnt - Array of miner addresses
 * @returns {Promise<Array>} Combined address data
 */
export async function fetchTransactionsData(miner_blk_cnt) {
    try {
        const response = await fetch('https://raw.githubusercontent.com/BasedWorkToken/Based-Work-Token-General/main/api/CostScript/saveFiles/BWORK_transaction_analysis_cost_summary.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const enrichedArray = [];

        // Iterate through the array of addresses (miner_blk_cnt)
        for (let i = 0; i < miner_blk_cnt.length; i++) {
            const address = miner_blk_cnt[i];
            const addressData = data[address];

            if (addressData) {
                enrichedArray.push({
                    address: address,
                    totalValue: addressData.totalValue || 0,
                    totalCost: addressData.totalCost || 0,
                    transactionCount: addressData.transactionCount || 0
                });
            } else {
                enrichedArray.push({
                    address: address,
                    totalValue: 0,
                    totalCost: 0,
                    transactionCount: 0
                });
            }
        }

        return enrichedArray;

    } catch (error) {
        console.error('Error fetching the transactions data:', error);

        const fallbackArray = miner_blk_cnt.map(address => ({
            address: address,
            totalValue: 0,
            totalCost: 0,
            transactionCount: 0
        }));

        return fallbackArray;
    }
}

// ============================================
// CHART RENDERING FUNCTIONS
// ============================================

/**
 * Show block distribution pie chart (all-time stats)
 * @param {Object} piechart_dataset - Chart.js dataset
 * @param {Array} piechart_labels - Chart labels
 */
export function showBlockDistributionPieChart(piechart_dataset, piechart_labels) {
    document.querySelector('#row-miners').style.display = 'block';
    document.querySelector('#blockdistributionpiechart').innerHTML = '<canvas id="chart-block-distribution" width="3.5rem" height="3.5rem"></canvas>';

    if (piechart_dataset.length == 0 || piechart_labels.length == 0) {
        return;
    }

    Chart.defaults.elements.arc.borderColor = 'rgb(32, 34, 38)';
    Chart.defaults.elements.arc.borderWidth = 1.8;

    delete piechart_dataset.label;

    const hr_diff_chart = new Chart(document.getElementById('chart-block-distribution').getContext('2d'), {
        type: 'doughnut',
        data: {
            datasets: [piechart_dataset],
            labels: piechart_labels,
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return piechart_labels[context.dataIndex] + ': ' + context.parsed;
                        }
                    }
                }
            }
        },
    });
}

/**
 * Show block distribution pie chart (recent stats)
 * @param {Object} piechart_dataset - Chart.js dataset
 * @param {Array} piechart_labels - Chart labels
 */
export function showBlockDistributionPieChart2(piechart_dataset, piechart_labels) {
    document.querySelector('#row-miners2').style.display = 'block';
    document.querySelector('#blockdistributionpiechart2').innerHTML = '<canvas id="chart-block-distribution2" width="3.5rem" height="3.5rem"></canvas>';

    if (piechart_dataset.length == 0 || piechart_labels.length == 0) {
        return;
    }

    Chart.defaults.elements.arc.borderColor = 'rgb(32, 34, 38)';
    Chart.defaults.elements.arc.borderWidth = 1.8;

    delete piechart_dataset.label;

    const hr_diff_chart = new Chart(document.getElementById('chart-block-distribution2').getContext('2d'), {
        type: 'doughnut',
        data: {
            datasets: [piechart_dataset],
            labels: piechart_labels,
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return piechart_labels[context.dataIndex] + ': ' + context.parsed;
                        }
                    }
                }
            }
        },
    });
}

// ============================================
// BLOCK PAGINATION FUNCTIONS
// ============================================

/**
 * Renders a batch of blocks into the table
 * @param {number} startIndex - Index to start rendering from
 * @param {number} count - Number of blocks to render
 * @param {boolean} append - If true, append to existing content; if false, replace
 */
function renderBlocksBatch(startIndex, count, append = false) {
    if (!blockRenderContext) {
        console.error('Block render context not initialized');
        return;
    }

    const { get_date_from_eth_block, known_miners, _BLOCK_EXPLORER_TX_URL, _BLOCK_EXPLORER_BLOCK_URL } = blockRenderContext;

    const endIndex = Math.min(startIndex + count, allMinedBlocks.length);
    let innerhtml_buffer = '';

    // Add header only if not appending
    if (!append) {
        innerhtml_buffer = '<tr><th>Time (Approx)</th><th>Base Block #</th>'
            + '<th>Transaction Hash</th><th style="width: 200px;">Miner</th><th>Reward Amount</th></tr>';
    }

    let totalzkBTCMinted = 0.0;
    let index = startIndex;

    for (let i = startIndex; i < endIndex; i++) {
        const block_info = allMinedBlocks[i];
        const eth_block = parseInt(block_info[0]);
        const tx_hash = block_info[1];
        const addr = block_info[2];
        const dataF = block_info[3].toFixed(4);
        const epochCnt = block_info[4];

        // Get the next block's epoch count
        let nextEpochCnt = null;
        if (i + 1 < allMinedBlocks.length) {
            nextEpochCnt = allMinedBlocks[i + 1][4];
        }

        let epochCount;
        if (nextEpochCnt !== null) {
            epochCount = epochCnt - nextEpochCnt;
        } else {
            epochCount = epochCnt;
        }

        const formattedNumberfffff = new Intl.NumberFormat(navigator.language).format(dataF);
        const miner_name_link = getMinerNameLinkHTML(addr, known_miners);
        const transaction_url = _BLOCK_EXPLORER_TX_URL + tx_hash;
        const block_url = _BLOCK_EXPLORER_BLOCK_URL + eth_block;

        if (epochCnt) {
            totalzkBTCMinted += parseFloat(epochCount);
        }

        if (formattedNumberfffff == -1) {
            const parzedint = parseInt(totalzkBTCMinted);
            totalzkBTCMinted = 0.0;

            const formattedNumberparzedint = new Intl.NumberFormat(navigator.language).format(parzedint);

            // Update the PREVIOUS "New Challenge" row with this period's count
            const searchString = "PeriodNumberperiod";
            const str = innerhtml_buffer;
            const lastIndex = str.lastIndexOf(searchString);

            if (lastIndex !== -1) {
                const before = str.substring(0, lastIndex);
                const after = str.substring(lastIndex + searchString.length);
                innerhtml_buffer = before + formattedNumberparzedint + after;
            }

            // Add the new period row with placeholder for next update
            if (eth_block > 36415630) {
                innerhtml_buffer += '<tr><td id="statsTime"">'
                    + get_date_from_eth_block(eth_block) + '</td><td>'
                    + '<b>New difficulty period</b>' + '</td><td>'
                    + '<b>New Challenge</b>'
                    + '</td><td><b> Previous Period had</b></td><td class="stat-value"><b>PeriodNumberperiod Mints</b></td></tr>';
            } else {
                innerhtml_buffer += '<tr><td id="statsTime">'
                    + get_date_from_eth_block(eth_block) + '</td><td>'
                    + '<b>New difficulty period</b>' + '</td><td>'
                    + '<b>New Challenge</b>'
                    + '</td><td><b> Previous Period had</b></td><td class="stat-value"><b>2016 Mints</b></td></tr>';
            }
        } else {
            innerhtml_buffer += '<tr><td id="statsTime">'
                + get_date_from_eth_block(eth_block) + '</td><td class="hash2">'
                + '<a href="' + block_url + '" target="_blank">' + eth_block + '</a></td><td class="hash">'
                + '<a href="' + transaction_url + '" title="' + tx_hash + '" target="_blank">'
                + tx_hash.substr(0, 16) + '...</a></td><td align="right" style="text-overflow:ellipsis;white-space: nowrap;overflow: hidden;">'
                + '<span class="miner-cell">' + miner_name_link + '</span></td><td class="stat-value">'
                + formattedNumberfffff + " B0x</td></tr>";
        }
    }

    // Update DOM
    const blockstatsEl = document.querySelector('#blockstats');
    if (append) {
        blockstatsEl.innerHTML += innerhtml_buffer;
    } else {
        blockstatsEl.innerHTML = innerhtml_buffer;
    }

    currentlyDisplayedBlocks = endIndex;

    // Update status and button visibility
    updateBlocksPaginationUI();
}

/**
 * Updates the pagination UI (status text and button visibility)
 */
function updateBlocksPaginationUI() {
    const container = document.getElementById('blocks-load-more-container');
    const statusEl = document.getElementById('blocks-status');
    const btnEl = document.getElementById('blocks-load-more-btn');

    if (!container || !statusEl || !btnEl) return;

    const totalBlocks = allMinedBlocks.length;
    const remaining = totalBlocks - currentlyDisplayedBlocks;

    if (remaining > 0) {
        container.style.display = 'block';
        statusEl.textContent = `Showing ${currentlyDisplayedBlocks.toLocaleString()} of ${totalBlocks.toLocaleString()} blocks (${remaining.toLocaleString()} remaining)`;
        btnEl.style.display = 'inline-block';
        btnEl.textContent = `Load ${Math.min(BLOCKS_PER_PAGE, remaining).toLocaleString()} More Blocks`;
    } else if (totalBlocks > 0) {
        container.style.display = 'block';
        statusEl.textContent = `Showing all ${totalBlocks.toLocaleString()} blocks`;
        btnEl.style.display = 'none';
    } else {
        container.style.display = 'none';
    }
}

/**
 * Handler for "Load More" button click
 */
export function loadMoreBlocks() {
    if (currentlyDisplayedBlocks < allMinedBlocks.length) {
        renderBlocksBatch(currentlyDisplayedBlocks, BLOCKS_PER_PAGE, true);
    }
}

// ============================================
// MAIN MINING INFO FUNCTIONS
// ============================================

/**
 * Entry point wrapper for updateAllMinerInfo
 * Handles connection and provider setup
 */
export async function updateAllMinerInfoFirst() {
    var provids = window.walletConnected ? window.provider : window.providerTempStats;
   if (!provids) {
        provids = new ethers.providers.JsonRpcProvider(customRPC);
    }
    // Use block number from cachedContractStats if available (from super multicall in staking.js)
    let blockNumber = null;
    if (window.cachedContractStats && window.cachedContractStats.blockNumber) {
        blockNumber = parseInt(window.cachedContractStats.blockNumber);
        console.log("Using cached block number from super multicall:", blockNumber);
    } else {
        console.warn("window.cachedContractStats or blockNumber not available");
        console.log("window.cachedContractStats:", window.cachedContractStats);
    }

    // Use lastDifficultyStartBlock from cachedContractStats (from super multicall in staking.js)
    // latestDiffPeriod = latestDifficultyPeriodStarted (block number, not timestamp)
    let lastBaseBlock = null;
    if (window.cachedContractStats && window.cachedContractStats.latestDiffPeriod) {
        lastBaseBlock = parseInt(window.cachedContractStats.latestDiffPeriod);
        console.log("Using cached latestDiffPeriod (lastDifficultyStartBlock) from super multicall:", lastBaseBlock);
    } else {
        console.warn("window.cachedContractStats or latestDiffPeriod not available");
        console.log("window.cachedContractStats:", window.cachedContractStats);
    }

    await updateAllMinerInfo(provids, blockNumber, lastBaseBlock);
}

// IMPORT THE FULL updateAllMinerInfo from script.js lines 18827-19951
// This is the massive 1100+ line function - I'll add a simplified version
// that calls out to script.js for now, then we can fully migrate it

/**
 * Core mining information update function
 * Processes all mined blocks, calculates statistics, updates displays
 * @param {Object} providerParam - Ethers.js provider
 * @param {number} blockNumberParam - Optional block number from multicall (avoids separate RPC call)
 */
export async function updateAllMinerInfo(providerParam, blockNumberParam = null, lastBaseBlock = null) {
    console.log('updateAllMinerInfo');

    var previousChallenge = "0x0";
    var totalZKBTC_Mined = [];
    /* array of arrays of type [eth_block, txhash, miner_addr] */
    var mined_blocks = [];
    var totalZKTC_Calculated = 0;
    var totalZKBTC_Mined_HASH = {};
    /* dict where key=miner_addr and value=total_mined_block_count */
    var miner_block_count = {};
    var miner_block_count2 = {};
    var miner_block_countHASH = {};
    /* total number of blocks mined since last difficulty adjustment */
    var total_mint_count_HASH = {};
    var total_block_count = 0;
    var total_tx_count = 0;
    var last_imported_mint_block = 0;
    var total_TOTAL_mint_count_HASH = 0;

    var provids = providerParam;

    console.log("Connect done");

    // Use block number from multicall if provided, otherwise fetch from provider
    let current_eth_block;
    if (blockNumberParam !== null) {
        current_eth_block = blockNumberParam - 2; // Subtract 2 to get current available block
        console.log("Using block number from multicall:", blockNumberParam, "Adjusted:", current_eth_block);
    } else {
        const latestBlockNumber = await provids.getBlockNumber();
        current_eth_block = latestBlockNumber - 2; // Subtract 2 to get current available block
        console.log("Fetched block number from provider:", latestBlockNumber, "Adjusted:", current_eth_block);
    }

    //get last rewarded eth block please thank u

    var last_reward_eth_block = current_eth_block;
    var estimated_network_hashrate = estHashrate;
    var last_difficulty_start_block = lastBaseBlock;
    console.log("last_difficulty_start_block: ", last_difficulty_start_block);

    // check to see if the browser has any data in localStorage we can use.
    // don't use the data, though, if it's from an old difficulty period
    try {
        // Load local storage data first
        var last_diff_block_storage = Number(localStorage.getItem('lastDifficultyStartBlock_EraBitcoin2_afbRAFFABC_B0x1'));
        last_imported_mint_block = Number(localStorage.getItem('lastMintBlock_EraBitcoin2_afbRAFFABC_B0x1'));
        previousChallenge = JSON.parse(localStorage.getItem('mintData_GreekWedding2_B0x1'));
        console.log("previous ended challenge is this, starting here");
        var mint_data = localStorage.getItem('mintData_EraBitcoin2_afbRAFFABC_B0x1');

        console.log('last_imported_mint_block: ', last_imported_mint_block);
        let localMinedBlocks = [];
        let localLatestBlock = 0;

        if (mint_data !== null) {
            localMinedBlocks = JSON.parse(mint_data);
            // Find the highest block number in local data
            localLatestBlock = last_imported_mint_block;
            console.log('Local storage has', localMinedBlocks.length, 'blocks, latest:', localLatestBlock);
        }

        // Fetch remote data
        let remoteMinedBlocks = [];
        let remoteLatestBlock = 0;

        // Primary and backup URLs
        const primaryUrl = customDataSource + 'mined_blocks_mainnet.json';
        const backupUrl = customBACKUPDataSource + 'mined_blocks_mainnet.json';

        try {
            console.log('Attempting to fetch from primary source...');
            const response = await fetch(primaryUrl);

            if (response.ok) {
                const remoteData = await response.json();
                remoteMinedBlocks = remoteData.mined_blocks;
                remoteLatestBlock = remoteData.latest_block_number;
                console.log('✅ Primary source: Remote data has', remoteMinedBlocks.length, 'blocks, latest:', remoteLatestBlock);

                // Update previousChallenge if available in remote data
                if (remoteData.previous_challenge) {
                    previousChallenge = remoteData.previous_challenge;
                }
            } else {
                throw new Error(`Primary source failed with status: ${response.status}`);
            }
        } catch (primaryError) {
            console.warn('⚠️ Primary source failed:', primaryError.message);
            console.log('🔄 Falling back to GitHub backup...');

            try {
                const backupResponse = await fetch(backupUrl);

                if (backupResponse.ok) {
                    const remoteData = await backupResponse.json();
                    remoteMinedBlocks = remoteData.mined_blocks;
                    remoteLatestBlock = remoteData.latest_block_number;
                    console.log('✅ Backup source: Remote data has', remoteMinedBlocks.length, 'blocks, latest:', remoteLatestBlock);

                    // Update previousChallenge if available in remote data
                    if (remoteData.previous_challenge) {
                        previousChallenge = remoteData.previous_challenge;
                    }
                } else {
                    throw new Error(`Backup source failed with status: ${backupResponse.status}`);
                }
            } catch (backupError) {
                console.error('❌ Both primary and backup sources failed!');
                console.error('Primary error:', primaryError.message);
                console.error('Backup error:', backupError.message);

                // Handle the case when both sources fail
                throw new Error('All data sources unavailable');
            }
        }

        // Compare and choose the best dataset
        if (remoteLatestBlock > localLatestBlock) {
            console.log('Using REMOTE data (more recent)');
            mined_blocks = remoteMinedBlocks;
            last_imported_mint_block = remoteLatestBlock;

            // Update localStorage with remote data
            localStorage.setItem('mintData_EraBitcoin2_afbRAFFABC_B0x1', JSON.stringify(remoteMinedBlocks));
            localStorage.setItem('lastMintBlock_EraBitcoin2_afbRAFFABC_B0x1', remoteLatestBlock.toString());
            if (previousChallenge) {
                localStorage.setItem('mintData_GreekWedding2_B0x1', JSON.stringify(previousChallenge));
            }
        } else {
            console.log('Using LOCAL data');
            mined_blocks = localMinedBlocks;
            last_imported_mint_block = localLatestBlock;
        }

        // Process the chosen mined_blocks array
        console.log('imported', mined_blocks.length, 'transactions');

        var index2 = 0;
        var allepochs = 0;
        var maxMinedBlocksEpoch = 0;

        // Remove duplicates based on mintData[1], but only if mintData[3] != -1
        const seen = new Set();
        mined_blocks = mined_blocks.filter(mintData => {
            // If mintData[3] is -1, always keep it (don't check for duplicates)
            if (mintData[3] == -1) {
                return true;
            }

            // For non -1 entries, check if it's a duplicate
            if (seen.has(mintData[1])) {
                return false; // Remove this duplicate
            }

            seen.add(mintData[1]);
            return true; // Keep this item
        });
        let epochCount;

let epchCount;
        mined_blocks.forEach(function (mintData) {
            if (mintData[0] < 37615331) {
                return; // This skips to the next iteration in forEach
            }

            maxMinedBlocksEpoch = mined_blocks[0][4];
            // Get the next block's epoch count
            epochCount = mintData[4];
            var nextEpochCnt = null;
            if (index2 + 1 < mined_blocks.length && mined_blocks[index2 + 1][4] != undefined) {
                nextEpochCnt = mined_blocks[index2 + 1][4];
            } else {
                console.log("Mint data stuff mined_blocks[index + 1][4]: No next element, mined_blocks[index2]: ", mined_blocks[index2]);
            }

            if (nextEpochCnt !== null) {
                // Use next transaction's epoch count
                epchCount = epochCount - nextEpochCnt;
            } else {
                epchCount = epochCount;
            }

            index2 = index2 + 1;

            var epochsMined = epchCount;
            if(epochsMined <0){
                epochsMined = 1;
            }

            allepochs = allepochs + epochsMined;

            try {
                miner_block_count[mintData[2]]
            } catch (err) {
                console.log('err: ', err);
            }

            if (mintData[3] == -1) {
                // Challenge change marker
            } else {
                // Regular mining transaction
                if (mintData[0] > last_difficulty_start_block) {
                    if (miner_block_countHASH[mintData[2]] === undefined) {
                        miner_block_countHASH[mintData[2]] = mintData[3];
                    } else {
                        miner_block_countHASH[mintData[2]] += mintData[3];
                    }
                    if (total_mint_count_HASH[mintData[2]] === undefined) {
                        total_mint_count_HASH[mintData[2]] = 1;
                    } else {
                        total_mint_count_HASH[mintData[2]] += 1;
                    }
                    total_TOTAL_mint_count_HASH += epochsMined;

                    if (totalZKBTC_Mined_HASH[mintData[2]] === undefined) {
                        totalZKBTC_Mined_HASH[mintData[2]] = epochsMined;
                    } else {
                        totalZKBTC_Mined_HASH[mintData[2]] += epochsMined;
                    }
                } else if (mintData[3] == 0 && mintData[0] > last_difficulty_start_block) {
                    // FIX: Handle zero-value regular transactions
                    if (miner_block_countHASH[mintData[2]] === undefined) {
                        miner_block_countHASH[mintData[2]] = 0;
                    }

                    if (total_mint_count_HASH[mintData[2]] === undefined) {
                        total_mint_count_HASH[mintData[2]] = 1;
                    } else {
                        total_mint_count_HASH[mintData[2]] += 1;
                    }

                    if (totalZKBTC_Mined_HASH[mintData[2]] === undefined) {
                        totalZKBTC_Mined_HASH[mintData[2]] = epochsMined;
                    } else {
                        totalZKBTC_Mined_HASH[mintData[2]] += epochsMined;
                    }
                }

                // Rest of the regular transaction processing...
                if (miner_block_count[mintData[2]] === undefined) {
                    miner_block_count[mintData[2]] = epochsMined;
                    if (miner_block_count2[mintData[2]] === undefined && mintData[3] != -1) {
                        miner_block_count2[mintData[2]] = 1;
                    } else if (mintData[3] != -1) {
                        miner_block_count2[mintData[2]] += 1;
                    }
                } else {
                    miner_block_count[mintData[2]] += epochsMined;
                    if (miner_block_count2[mintData[2]] === undefined && mintData[3] != -1) {
                        miner_block_count2[mintData[2]] = 1;
                    } else if (mintData[3] != -1) {
                        miner_block_count2[mintData[2]] += 1;
                    }
                }
                if (mintData[3] != -1) {
                    total_tx_count += 1;
                }

                if (total_block_count == 0) {
                    total_block_count = epochsMined;
                } else {
                    total_block_count += epochsMined;
                }

                if (totalZKBTC_Mined[mintData[2]] === undefined) {
                    totalZKBTC_Mined[mintData[2]] = mintData[3];
                    totalZKTC_Calculated += mintData[3];
                } else {
                    totalZKBTC_Mined[mintData[2]] += mintData[3];
                    totalZKTC_Calculated += mintData[3];
                }
            }
        });

    } catch (err) {
        console.log('error reading from localStorage:', err.message);
        last_imported_mint_block = 0;
        mined_blocks.length = 0;
    }

    let ethblockstartB0x = 35930446;
    var start_log_search_at = Math.max(ethblockstartB0x + 1, last_imported_mint_block + 1);
    last_reward_eth_block = last_reward_eth_block

    console.log("searching lastlast_difficulty_start_block", last_difficulty_start_block, "blocks");
    console.log("searching last_imported_mint_block", last_imported_mint_block, "blocks");
    console.log("searching start_log_search_at", start_log_search_at, "blocks");
    console.log("searching last_reward_eth_block", last_reward_eth_block, "blocks");
    console.log("searching last", last_reward_eth_block - start_log_search_at, "blocks");

    var blocks_to_search = (current_eth_block - start_log_search_at);
    console.log('blocks to search', blocks_to_search);

    if (blocks_to_search < 1) {
        console.log("Only 1 block or less to search abandoning");
    }

    var iterations = Math.ceil((blocks_to_search / 500));
    if (iterations <= 0) {
        iterations = 1;
    }

    console.log('do', iterations, 'runs');

    let lastProcessedEpochCount = 0;
    previousEpochCount = mined_blocks[0] ? mined_blocks[0][4] : 0;
    console.log("Epoch Count before Log call", previousEpochCount);

    var run = 0;
    let runInProgress = false;
    var getLogs = false;
    var lastrun = 0;

    while (run < iterations) {
        let gotLogs = false;  // ✅ guard to ensure only one getLogs call
        const runId = `Run-${run + 1}`;
        lastrun = run;
        const start = start_log_search_at + (run * 500);
        const stop = start + 499;

        if (runInProgress) {
            console.log('Previous run still in progress, waiting...');
            await sleep(100);
            continue; // Skip this iteration and check again
        }

        runInProgress = true; // Lock the run

        if (run + 1 == iterations) {
            console.log("Last run call EpochCount");
        }

        // Calculate block range for this run
        var start_log_search_at_loop = start_log_search_at + (run * 500);
        var stop_log_search_at_loop = start_log_search_at_loop + 499;

        if (stop_log_search_at_loop > current_eth_block) {
            console.log("Search too long trimmed");
            stop_log_search_at_loop = current_eth_block;
        }

        console.log('searching from block', start_log_search_at_loop, 'to block', stop_log_search_at_loop);

        // Retry logic for this specific run
        let success = false;
        let runAttempts = 0;
        const maxAttemptsPerRun = 5;

        while (!success && runAttempts < maxAttemptsPerRun && lastrun == run) {
            try {
                if (!getLogs) {
                    getLogs = true;
                    console.log(`${runId}: About to call getLogs`);
                    const result = await provids.getLogs({
                        fromBlock: start_log_search_at_loop,
                        toBlock: stop_log_search_at_loop,
                        address: ProofOfWorkAddresss,
                        topics: [_MINT_TOPIC],
                    });

                    console.log(`${runId}: Processing results`);

                    runInProgress = false;
                    lastrun = run + 1;
                    getLogs = false; // Reset for next run
                    run = run + 1;
                    success = true;

                    console.log("got filter results:", result.length, "transactions");

                    for (const [index, transaction] of result.entries()) {
                        var tx_hash = transaction['transactionHash'];
                        var block_number = parseInt(transaction['blockNumber'].toString());
                        var miner_address = getMinerAddressFromTopic(transaction['topics'][1].toString());
                        var data3345345 = transaction['data'];
                        var dataAmt = parseInt(data3345345.substring(2, 66), 16) / (10.0 ** 18);

                        // epochCount (next 64 chars)
                        var epochCount = parseInt(data3345345.substring(66, 130), 16);

                        var epochsMined = epochCount; // Default value

                        // Calculate epochs mined
                        if (index === 0) {
                            // First transaction in this batch
                            if (previousEpochCount !== null && previousEpochCount !== undefined) {
                                epochsMined = epochCount - previousEpochCount;
                            } else {
                                // Very first transaction ever
                                epochsMined = epochCount;
                            }
                        } else {
                            // Not the first transaction, use previous transaction in this batch
                            var prevTransaction = result[index - 1];
                            var prevData = prevTransaction['data'];
                            var prevEpochCount = parseInt(prevData.substring(66, 130), 16);
                            epochsMined = epochCount - prevEpochCount;
                        }

                        if (epochsMined < 0) {
                            console.log("THIS HASH:", tx_hash);
                            console.log("NEGATIVE EPOCHS MINED:", epochsMined);
                        }

                        var savePrevoiusCount = previousEpochCount;

                        // Update previous epoch count for next iteration
                        previousEpochCount = epochCount;
                        lastProcessedEpochCount += epochsMined;

                        // One shift to define a challenge change then another for the actual amount mined after the chal change
                        var Challengerz = data3345345.substring(130, 194);
                        if (previousChallenge != Challengerz) {
                            var previousChallenge2 = previousChallenge;
                            console.log("Old challenge:", previousChallenge, "new challenge:", Challengerz);
                            previousChallenge = Challengerz;
                            if (previousChallenge2 !== undefined && previousChallenge2 !== null) {
                                var newBlock = [
                                    mined_blocks[0] && mined_blocks[0][0] !== undefined ? mined_blocks[0][0] : block_number,
                                    mined_blocks[0] && mined_blocks[0][1] !== undefined ? mined_blocks[0][1] : tx_hash,
                                    mined_blocks[0] && mined_blocks[0][2] !== undefined ? mined_blocks[0][2] : miner_address,
                                    -1,
                                    mined_blocks[0] && mined_blocks[0][4] !== undefined ? mined_blocks[0][4] : 0
                                ];
                                mined_blocks.unshift(newBlock);
                            }
                        }
                        mined_blocks.unshift([block_number, tx_hash, miner_address, dataAmt, previousEpochCount]);

                        if(block_number > 37615331) {
                            if (dataAmt != 0 && block_number > last_difficulty_start_block) {
                                total_TOTAL_mint_count_HASH += epochsMined;
                                if (miner_block_countHASH[miner_address] === undefined) {
                                    miner_block_countHASH[miner_address] = dataAmt;
                                } else {
                                    miner_block_countHASH[miner_address] += dataAmt;
                                }

                                if (total_mint_count_HASH[miner_address] === undefined) {
                                    total_mint_count_HASH[miner_address] = 1;
                                } else {
                                    total_mint_count_HASH[miner_address] += 1;
                                }

                                if (totalZKBTC_Mined_HASH[miner_address] === undefined) {
                                    totalZKBTC_Mined_HASH[miner_address] = epochsMined;
                                } else {
                                    totalZKBTC_Mined_HASH[miner_address] += epochsMined;
                                }
                            } else if (dataAmt == 0 && block_number > last_difficulty_start_block) {
                                // FIX: Initialize miner_block_countHASH for zero-value transactions
                                if (miner_block_countHASH[miner_address] === undefined) {
                                    miner_block_countHASH[miner_address] = 0; // Initialize to 0
                                }

                                // FIX: Initialize total_mint_count_HASH for zero-value transactions
                                if (total_mint_count_HASH[miner_address] === undefined) {
                                    total_mint_count_HASH[miner_address] = 1; // Count the transaction
                                } else {
                                    total_mint_count_HASH[miner_address] += 1;
                                }

                                if (totalZKBTC_Mined_HASH[miner_address] === undefined) {
                                    totalZKBTC_Mined_HASH[miner_address] = epochsMined;
                                } else {
                                    totalZKBTC_Mined_HASH[miner_address] += epochsMined;
                                }
                                console.log("miner_block_count[miner_address]", miner_block_count[miner_address], "vs epochsMined", epochsMined);
                            }

                            if (miner_block_count[miner_address] === undefined) {
                                miner_block_count[miner_address] = epochsMined;
                                if (dataAmt != -1) {
                                    miner_block_count2[miner_address] = 1;
                                } else {
                                    miner_block_count2[miner_address] = 0;
                                }
                                totalZKBTC_Mined[miner_address] = dataAmt;
                                totalZKTC_Calculated += dataAmt;
                            } else {
                                miner_block_count[miner_address] += epochsMined;
                                if (dataAmt != -1) {
                                    miner_block_count2[miner_address] += 1;
                                }
                                totalZKBTC_Mined[miner_address] += dataAmt;
                                totalZKTC_Calculated += dataAmt;
                            }

                            if (dataAmt != -1) {
                                total_tx_count += 1;
                                total_block_count += epochsMined;
                            }
                        }

                        // Add a small yield every 10 transactions to prevent blocking
                        if (index % 10 === 0 && index > 0) {
                            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to event loop
                        }
                    }

                    success = true; // Mark as successful
                } else {
                    console.log("Dup log detected");
                    run++;
                    continue;
                }

            } catch (error) {
                console.log('=== ERROR CAUGHT ===');
                console.log('Error message:', error ? error.message : 'No error message');
                console.log('Run:', run + 1, 'Attempt:', runAttempts + 1);
                console.log('==================');

                runAttempts++;
                run = run - 1;

                if (runAttempts < maxAttemptsPerRun) {
                    console.log('Retrying in', 1000 * runAttempts, 'ms...');
                    await sleep(1000 * runAttempts); // Exponential backoff
                }
            } finally {
            }

            // Only increment after this run is COMPLETELY finished
            console.log(`=== COMPLETED ${runId} ===`);
            runInProgress = false; // Always unlock, even on error
        }

        runInProgress = false;
        success = true;

        if (!success) {
            console.log('Failed after', maxAttemptsPerRun, 'attempts, skipping this range and continuing to next');
        }

        // Add delay between runs
        if (run < iterations) {
            await sleep(200);
        }
    }

    console.log("lastProcessedEpochCount: ", lastProcessedEpochCount);
    console.log("RUn = ", run);

    if (run > 0) {
        localStorage.setItem('mintData_EraBitcoin2_afbRAFFABC_B0x1', JSON.stringify(mined_blocks));
        localStorage.setItem('mintData_GreekWedding2_B0x1', JSON.stringify(previousChallenge));
        if (mined_blocks[0] !== undefined) {
            console.log("RUNWorked");
            console.log("Setting Currentethblock to it: ", current_eth_block);
            localStorage.setItem('lastMintBlock_EraBitcoin2_afbRAFFABC_B0x1', current_eth_block);
        }
        localStorage.setItem('lastDifficultyStartBlock_EraBitcoin2_afbRAFFABC_B0x1', last_difficulty_start_block.toString());
    }

    console.log("processed blocks:",
        Object.keys(miner_block_count).length,
        "unique miners");
    var gotthis = {};

    // Get the addresses as an array
    const addresses = Object.keys(miner_block_count);
    var combinedAddresses = await fetchTransactionsData(addresses);

    console.log("Combined Known Miners: ", combinedAddresses);

    // Combine known miners
    for (var m1 = 0; m1 < combinedAddresses.length; m1++) {
        const addressData1 = combinedAddresses[m1].address;

        // Skip if m1 is not a known miner
        if (known_miners[combinedAddresses[m1].address] === undefined) continue;

        for (var m2 = m1; m2 < combinedAddresses.length; m2++) {
            if (m1 === m2) continue; // Skip self-comparison

            const addressData2 = combinedAddresses[m2].address;

            // Skip if m2 is not a known miner
            if (known_miners[combinedAddresses[m2].address] === undefined) continue;

            // Check if the miners are in the same group
            if (known_miners[combinedAddresses[m1].address][0] === known_miners[combinedAddresses[m2].address][0]) {
                // Combine values
                console.log("known miner match");
                combinedAddresses[m2].totalValue += combinedAddresses[m1].totalValue;
                combinedAddresses[m2].totalCost += combinedAddresses[m1].totalCost;
                combinedAddresses[m2].transactionCount += combinedAddresses[m1].transactionCount;

                console.log("combining  : ", addressData1, addressData2);
                // Reset m2's values to indicate it's been combined
                combinedAddresses[m1].totalValue = 0
                combinedAddresses[m1].totalCost = 0
                combinedAddresses[m1].transactionCount = 0
            }
        }
    }

    // Filter out the combined entries (where totalCost is 0)
    combinedAddresses = combinedAddresses.filter(addressData => addressData.totalCost > 0);

    console.log("Combined Addresses: ", combinedAddresses);

    /* collapse miner_block_count using known_miners who have multiple
    address into a single address */
    for (var m1 in miner_block_count) {
        for (var m2 in miner_block_count) {
            if (m1 === m2) {
                continue;
            }
            if (known_miners[m1] !== undefined
                && known_miners[m2] !== undefined
                && known_miners[m1][0] == known_miners[m2][0]) {
                miner_block_count[m1] += miner_block_count[m2];
                miner_block_count2[m1] += miner_block_count2[m2];
                // Use -1 to mark as consolidated (instead of 0)
                miner_block_count[m2] = -1;
                miner_block_count2[m2] = -1;
                totalZKBTC_Mined[m1] += totalZKBTC_Mined[m2];
                totalZKBTC_Mined[m2] = -1;
            }
        }
    }

    /* delete miners marked as consolidated (look for -1, not 0) */
    Object.keys(miner_block_count).forEach((miner_addr) => {
        if (miner_block_count[miner_addr] == -1) {
            delete miner_block_count[miner_addr]
        }
    });

    console.log("processed Recent miner blocks:",
        Object.keys(miner_block_countHASH).length,
        "unique miners");

    /* collapse miner_block_countHASH using known_miners who have multiple
    address into a single address */
    for (var m1 in miner_block_countHASH) {
        for (var m2 in miner_block_countHASH) {
            if (m1 === m2) {
                continue;
            }
            if (known_miners[m1] !== undefined
                && known_miners[m2] !== undefined
                && known_miners[m1][0] == known_miners[m2][0]) {
                miner_block_countHASH[m1] += miner_block_countHASH[m2];
                total_mint_count_HASH[m1] += total_mint_count_HASH[m2];
                totalZKBTC_Mined_HASH[m1] += totalZKBTC_Mined_HASH[m2];

                // Use -1 to mark as consolidated (instead of 0)
                total_mint_count_HASH[m2] = -1;
                miner_block_countHASH[m2] = -1;
                totalZKBTC_Mined_HASH[m2] = -1;
            }
        }
    }

    /* delete miners marked as consolidated (look for -1, not 0) */
    Object.keys(miner_block_countHASH).forEach((miner_addr) => {
        if (miner_block_countHASH[miner_addr] == -1) {
            delete miner_block_countHASH[miner_addr]
        }
    });
    Object.keys(total_mint_count_HASH).forEach((miner_addr) => {
        if (total_mint_count_HASH[miner_addr] == -1) {
            delete total_mint_count_HASH[miner_addr]
        }
    });
    Object.keys(totalZKBTC_Mined_HASH).forEach((miner_addr) => {
        if (totalZKBTC_Mined_HASH[miner_addr] == -1) {
            delete totalZKBTC_Mined_HASH[miner_addr]
        }
    });

    /* delete miners marked as consolidated from other arrays */
    Object.keys(miner_block_count2).forEach((miner_addr) => {
        if (miner_block_count2[miner_addr] == -1) {
            delete miner_block_count2[miner_addr]
        }
    });

    Object.keys(totalZKBTC_Mined).forEach((miner_addr) => {
        if (totalZKBTC_Mined[miner_addr] == -1) {
            delete totalZKBTC_Mined[miner_addr]
        }
    });

    console.log("=== POST-DELETION DEBUGGING ===");
    console.log("miner_block_countHASH keys:", Object.keys(miner_block_countHASH));
    console.log("totalZKBTC_Mined_HASH keys:", Object.keys(totalZKBTC_Mined_HASH));
    console.log("total_mint_count_HASH keys:", Object.keys(total_mint_count_HASH));

    // Check for mismatches
    const hashKeys = Object.keys(miner_block_countHASH);
    const epochKeys = Object.keys(totalZKBTC_Mined_HASH);
    const countKeys = Object.keys(total_mint_count_HASH);

    hashKeys.forEach(miner => {
        if (!epochKeys.includes(miner)) {
            console.error("❌ MISMATCH: " + miner + " exists in miner_block_countHASH but NOT in totalZKBTC_Mined_HASH");
        }
        if (!countKeys.includes(miner)) {
            console.error("❌ MISMATCH: " + miner + " exists in miner_block_countHASH but NOT in total_mint_count_HASH");
        }
    });

    epochKeys.forEach(miner => {
        if (!hashKeys.includes(miner)) {
            console.error("❌ MISMATCH: " + miner + " exists in totalZKBTC_Mined_HASH but NOT in miner_block_countHASH");
        }
    });

    countKeys.forEach(miner => {
        if (!hashKeys.includes(miner)) {
            console.error("❌ MISMATCH: " + miner + " exists in total_mint_count_HASH but NOT in miner_block_countHASH");
        }
    });

    console.log("=== END POST-DELETION DEBUGGING ===");

    /* create sorted list of RECENT miners */
    sorted_miner_block_count_recent_hash = []
    for (var m in miner_block_countHASH) {
        console.log("m: ", m, " totalZKBTC_Mined_HASH", totalZKBTC_Mined_HASH[m]);
        console.log("m: ", m, "  miner_block_countHASH[m]", miner_block_countHASH[m]);
        sorted_miner_block_count_recent_hash.push([m, totalZKBTC_Mined_HASH[m], miner_block_countHASH[m], total_mint_count_HASH[m]]);
    }

    sorted_miner_block_count_recent_hash.sort((a, b) => { return b[1] - a[1]; });

    console.log('done sorting Recent miner info');

    var totalBlockszzz = 0;
    var a_formattedNumberfffff2 = 0;
    var totalblockz = 0;

    /* fill in miner info */
    var piechart_labels2 = [];
    var piechart_dataset2 = {
        data: [],
        backgroundColor: [],
        label: 'miner-data2'
    };

    var innerhtml_buffer2 = '<tr><th style="font-size: 1.75em;">Miner</th><th>Recent Epochs Minted Count</th>'
        + '<th>% of Minted</th><th>Recent Miner Hashrate</th><th>Transaction Count</th><th>Recent B0x Mined By User</th></tr>';

    sorted_miner_block_count_recent_hash.forEach(function (miner_info) {
        var addr = miner_info[0];
        var blocks = miner_info[1];
        var RewardAmount = miner_info[2].toFixed(0);
        var TotalBlocksPerReward = miner_info[3].toFixed(0);

        var miner_name_link = getMinerNameLinkHTML(addr, known_miners);
        console.log("t1000: blocks: ",blocks);
        console.log("t1000: total_TOTAL_mint_count_HASH: ",total_TOTAL_mint_count_HASH);
        var percent_of_total_blocks = blocks / total_TOTAL_mint_count_HASH;
        console.log("t1000 percent_of_total_blocks: ",percent_of_total_blocks);
        var test = getMinerColor(addr, known_miners);

        piechart_dataset2.data.push(blocks);
        piechart_dataset2.backgroundColor.push(test);
        piechart_labels2.push(getMinerName(addr, known_miners));

        totalBlockszzz += parseFloat(TotalBlocksPerReward);
        totalblockz += parseFloat(blocks);
        a_formattedNumberfffff2 += parseFloat(RewardAmount);

        const formattedNumberfffff2 = new Intl.NumberFormat(navigator.language).format(RewardAmount);

        var minerColorClass = getMinerColor(addr, known_miners);
        var minerName = getMinerName(addr, known_miners);

        innerhtml_buffer2 += '<tr class="miner-row"><td class="miner-col">'
            + '<span class="miner-indicator ' + minerColorClass + '"></span>'
            + '<span class="miner-name">' + miner_name_link + '</span>'
            + '</td><td class="stat-value">'
            + blocks + '</td><td class="stat-value">'
            + (100 * percent_of_total_blocks).toFixed(2) + '%' + '</td><td class="stat-secondary" style="white-space: nowrap;">'
            + convertHashRateToReadable2(percent_of_total_blocks * estimated_network_hashrate) + '</td><td class="stat-value">'
            + TotalBlocksPerReward + '</td><td class="stat-value">' + formattedNumberfffff2 + ' B0x</td></tr>';
    });

    const formattedNumberfffff2FFFF = new Intl.NumberFormat(navigator.language).format(a_formattedNumberfffff2);

    innerhtml_buffer2 += '<tr class="miner-row"><td style="border-bottom: 0rem;">TOTAL:'
        + '</td><td class="stat-value" style="border-bottom: 0rem;">'
        + totalblockz + '</td><td class="stat-value" style="border-bottom: 0rem;">'
        + '100%' + '</td><td class="stat-secondary" style="border-bottom: 0rem;">'
        + convertHashRateToReadable2(estimated_network_hashrate) + '</td><td class="stat-value" style="border-bottom: 0rem;">'
        + totalBlockszzz + '</td><td class="stat-value" style="border-bottom: 0rem;">'
        + formattedNumberfffff2FFFF + ' B0x</td></tr>';

    document.querySelector('#row-miners2').style.display = 'block';
    document.querySelector('#minerstats2').style.display = 'block';
    document.querySelector('#minerstats2').innerHTML = innerhtml_buffer2;

    console.log('done populating RECENT miner stats');
    showBlockDistributionPieChart2(piechart_dataset2, piechart_labels2);

    /* create sorted list of ALL MINTS of miners */
    sorted_miner_block_count = []
    for (var m in miner_block_count) {
        sorted_miner_block_count.push([m, miner_block_count[m], totalZKBTC_Mined[m], miner_block_count2[m]]);
    }
    sorted_miner_block_count.sort((a, b) => { return b[1] - a[1]; });

    console.log('done sorting miner info');

    /* fill in miner info */
    var piechart_labels = [];
    var piechart_dataset = {
        data: [],
        backgroundColor: [],
        label: 'miner-data'
    };

    var totalSpentINUSD = 0;

    var innerhtml_buffer = '<tr><th style="font-size: 1.75em;">Miner</th><th>Total Epochs Minted Count</th>'
        + '<th>% of Minted</th><th>Transaction Count</th><th>TOTAL B0x Mined</th></tr>';

    sorted_miner_block_count.forEach(function (miner_info) {
        var addr = miner_info[0];

        // Find the matching address in combinedAddresses
        const matchingAddressData = combinedAddresses.find(addressData => addressData.address === addr);
        var totalCostForUser = 0;
        if (matchingAddressData) {
            const totalCost = matchingAddressData.totalCost;
            totalCostForUser = totalCost / 1e18;
        }

        var total_WETH_USD_Price = 0.01;
        totalCostForUser = totalCostForUser * total_WETH_USD_Price;
        totalSpentINUSD += totalCostForUser;

        var blocks = miner_info[1];
        //console.log("t2000: blocks: ",blocks);
        var RewardAmount = miner_info[2].toFixed(0);
        var TotalBlocksPerReward = (miner_info[3] || 0).toFixed(0);
        var miner_name_link = getMinerNameLinkHTML(addr, known_miners);
        //console.log("t2000: total_block_count: ",total_block_count);
        var percent_of_total_blocks = blocks / total_block_count;
       // console.log("t2000: percent_of_total_blocks: ",percent_of_total_blocks);

        piechart_dataset.data.push(blocks);
        piechart_dataset.backgroundColor.push(getMinerColor(addr, known_miners));
        piechart_labels.push(getMinerName(addr, known_miners));

        const formattedNumberfffff2 = new Intl.NumberFormat(navigator.language).format(RewardAmount);

        var minerColorClass = getMinerColor(addr, known_miners);
        var minerName = getMinerName(addr, known_miners);

        innerhtml_buffer += '<tr class="miner-row"><td class="miner-col">'
            + '<span class="miner-indicator ' + minerColorClass + '"></span>'
            + '<span class="miner-name">' + miner_name_link + '</span>'
            + '</td><td class="stat-value">'
            + blocks + '</td><td class="stat-value">'
            + (100 * percent_of_total_blocks).toFixed(2) + '%' + '</td><td class="stat-value">'
            + TotalBlocksPerReward + '</td><td class="stat-value" style="white-space: nowrap">'
            + formattedNumberfffff2 + ' B0x</td></tr>';
    });

    const formattedNumberfffff23 = new Intl.NumberFormat(navigator.language).format(totalZKTC_Calculated.toFixed(0));

    document.querySelector('.SuccessfulMintTransactions').innerHTML = (total_tx_count).toLocaleString() + ' <span class="unit">txs</span>';

    innerhtml_buffer += '<tr class="miner-row"><td style="border-bottom: 0rem;">TOTAL:</td><td class="stat-value" style="border-bottom: 0rem;">'
        + total_block_count + '</td><td class="stat-value" style="border-bottom: 0rem;">100%</td><td class="stat-value" style="border-bottom: 0rem;">'
        + total_tx_count + '</td><td class="stat-value" style="border-bottom: 0rem;">'
        + formattedNumberfffff23 + ' B0x</td></tr>';

    document.querySelector('#minerstats').innerHTML = innerhtml_buffer;
    document.querySelector('#row-miners').style.display = 'block';

    console.log('done populating miner stats');
    showBlockDistributionPieChart(piechart_dataset, piechart_labels);

    var blocks_since_last_reward = current_eth_block - last_reward_eth_block;
    var date_now = new Date();
    var date_of_last_mint = new Date(date_now.getTime() - blocks_since_last_reward * _SECONDS_PER_ETH_BLOCK * 1000)

    function get_date_from_eth_block(eth_block) {
        const blockTime = new Date(
            date_of_last_mint.getTime() - ((last_reward_eth_block - eth_block) * _SECONDS_PER_ETH_BLOCK * 1000)
        );

        const now = new Date();
        const diffMs = now - blockTime;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        const diffYr = Math.floor(diffDay / 365);

        let result;
        if (diffYr >= 1) {
            result = diffYr === 1 ? "1 year ago" : `${diffYr} years ago`;
        } else if (diffDay >= 1) {
            result = diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;
        } else if (diffHr >= 1) {
            result = diffHr === 1 ? "1 hr ago" : `${diffHr} hrs ago`;
        } else if (diffMin >= 1) {
            result = diffMin === 1 ? "1 min ago" : `${diffMin} mins ago`;
        } else {
            result = "just now";
        }

        return result;
    }

    // Store blocks for pagination
    allMinedBlocks = mined_blocks;
    currentlyDisplayedBlocks = 0;

    // Store context needed for rendering
    blockRenderContext = {
        get_date_from_eth_block,
        known_miners,
        _BLOCK_EXPLORER_TX_URL,
        _BLOCK_EXPLORER_BLOCK_URL
    };

    // Render first batch of blocks (3000 by default)
    document.querySelector('#row-blocks').style.display = 'block';
    document.querySelector('#blockstats').style.display = 'block';

    console.log(`Rendering first ${BLOCKS_PER_PAGE} of ${mined_blocks.length} total blocks`);
    renderBlocksBatch(0, BLOCKS_PER_PAGE, false);

    console.log('done populating block stats');

    document.querySelectorAll('#stats .blocks-table th:nth-child(2), #stats .blocks-table td:nth-child(2)').forEach(element => {
        element.style.width = '10%';
        element.style.maxWidth = '10%';
        element.style.overflow = 'hidden';
        element.style.textOverflow = 'ellipsis';
        element.style.whiteSpace = 'nowrap';
    });
}

// Export all functions
export default {
    updateAllMinerInfoFirst,
    updateAllMinerInfo,
    fetchTransactionsData,
    showBlockDistributionPieChart,
    showBlockDistributionPieChart2,
    getMinerName,
    getMinerColor,
    getMinerNameLinkHTML,
    getMinerAddressFromTopic,
    convertHashRateToReadable2,
    loadMoreBlocks,
    pool_colors,
    known_miners
};
