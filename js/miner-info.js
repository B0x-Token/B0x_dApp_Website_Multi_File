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
import { customDataSource, customBACKUPDataSource } from './settings.js';
import { walletConnected, provider } from './wallet.js';

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
export let lastDifficultyStartBlock = 0;
export let sorted_miner_block_count_recent_hash = [];
export let sorted_miner_block_count = [];

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
// MAIN MINING INFO FUNCTIONS
// ============================================

/**
 * Entry point wrapper for updateAllMinerInfo
 * Handles connection and provider setup
 */
export async function updateAllMinerInfoFirst() {
    
    var provids = window.walletConnected ? window.provider : window.providerTempStats;

    await window.updateAllMinerInfo(provids);
}

// IMPORT THE FULL updateAllMinerInfo from script.js lines 18827-19951
// This is the massive 1100+ line function - I'll add a simplified version
// that calls out to script.js for now, then we can fully migrate it

/**
 * Core mining information update function
 * Processes all mined blocks, calculates statistics, updates displays
 * @param {Object} provider - Ethers.js provider
 */
export async function updateAllMinerInfo(providerParam) {
    // For now, call the version in script.js
    // TODO: Complete migration of this massive function
    if (window.updateAllMinerInfo) {
       // return await window.updateAllMinerInfo(providerParam);
    }

    console.warn('updateAllMinerInfo not yet fully migrated - please keep script.js loaded');
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
    pool_colors,
    known_miners
};
