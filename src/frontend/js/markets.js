// Global variables
let allAssets = [];
let filteredAssets = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    loadMarketsData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterAssets(e.target.value);
    });
}

// Load markets data
async function loadMarketsData() {
    try {
        await Promise.all([
            loadTopStocks(),
            loadSectors(),
            loadWatchlist()
        ]);
    } catch (error) {
        console.error('Error loading markets data:', error);
        toastr.error('Error loading data');
    }
}

// Load top stocks
async function loadTopStocks() {
    try {
        console.log('🔄 Loading top stocks...');
        
        // Show loading state
        showLoadingState('loadingStocks', 'stocksTableContainer');
        
        const response = await fetch('/api/assets');
        console.log('📊 Response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            hideLoadingState('loadingStocks', 'stocksTableContainer');
            showErrorInTable('topStocksTable', `API Error: ${response.status} ${response.statusText}`, 5);
            return;
        }
        
        const data = await response.json();
        console.log('📈 Assets data received:', {
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 'N/A',
            sampleData: Array.isArray(data) && data.length > 0 ? data[0] : 'No data'
        });
        
        if (Array.isArray(data) && data.length > 0) {
            allAssets = data;
            filteredAssets = [...allAssets];
            console.log('✅ Assets loaded successfully:', allAssets.length, 'stocks');
            
            // Hide loading and show table
            hideLoadingState('loadingStocks', 'stocksTableContainer');
            displayTopStocks(data);
        } else {
            console.log('ℹ️ No assets data or empty array');
            hideLoadingState('loadingStocks', 'stocksTableContainer');
            showErrorInTable('topStocksTable', 'No stocks available. Please check the database connection.', 5);
        }
    } catch (error) {
        console.error('❌ Error loading top stocks:', error);
        hideLoadingState('loadingStocks', 'stocksTableContainer');
        showErrorInTable('topStocksTable', `Network error: ${error.message}`, 5);
    }
}

// Display top stocks
function displayTopStocks(assets) {
    const tableBody = document.getElementById('topStocksTable');
    tableBody.innerHTML = '';
    
    assets.forEach(asset => {
        const row = document.createElement('tr');
        const dailyChange = asset.day_change || 0;
        const changePercent = asset.day_change_percent || 0;
        
        row.className = 'hover:bg-dark-700 transition-colors cursor-pointer';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap" onclick="showPriceHistory('${asset.ticker}')">
                <div class="text-sm font-medium text-white hover:text-blue-400">${asset.ticker}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" onclick="showPriceHistory('${asset.ticker}')">
                <div class="text-sm text-white hover:text-blue-400">${asset.asset_name}</div>
                <div class="text-sm text-gray-400">${asset.sector || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white" onclick="showPriceHistory('${asset.ticker}')">
                ${formatIndianCurrency(asset.current_price)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap" onclick="showPriceHistory('${asset.ticker}')">
                <div class="text-sm ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${dailyChange >= 0 ? '+' : ''}${formatIndianCurrency(dailyChange)} (${Number(changePercent).toFixed(2)}%)
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="event.stopPropagation(); showPriceHistory('${asset.ticker}')" class="text-yellow-400 hover:text-yellow-300 p-1 rounded hover:bg-dark-600" title="Price History">
                        <i data-feather="trending-up" class="w-4 h-4"></i>
                    </button>
                    <button onclick="event.stopPropagation(); buyStock('${asset.ticker}')" class="text-green-400 hover:text-green-300 p-1 rounded hover:bg-dark-600" title="Buy Stock">
                        <i data-feather="plus-circle" class="w-4 h-4"></i>
                    </button>
                    <button onclick="event.stopPropagation(); addToWatchlist('${asset.ticker}')" class="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-dark-600" title="Add to Watchlist">
                        <i data-feather="eye" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    feather.replace();
}

// Load sectors
async function loadSectors() {
    try {
        console.log('🔄 Loading sectors...');
        
        // Show loading state
        showLoadingState('loadingSectors', 'sectorsTableContainer');
        
        const response = await fetch('/api/portfolio/allocation');
        console.log('📊 Sectors API response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Sectors API error:', response.status, response.statusText);
            hideLoadingState('loadingSectors', 'sectorsTableContainer');
            showErrorInTable('sectorsTable', `API Error: ${response.status} ${response.statusText}`, 4);
            return;
        }
        
        const data = await response.json();
        console.log('📈 Sectors data received:', {
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 'N/A',
            sampleData: Array.isArray(data) && data.length > 0 ? data[0] : 'No data'
        });
        
        if (Array.isArray(data) && data.length > 0) {
            hideLoadingState('loadingSectors', 'sectorsTableContainer');
            displaySectors(data);
            console.log('✅ Sectors loaded successfully:', data.length, 'sectors found');
        } else {
            console.log('ℹ️ No sectors data available');
            hideLoadingState('loadingSectors', 'sectorsTableContainer');
            showErrorInTable('sectorsTable', 'No sector allocation data available. Please buy some assets first.', 4);
        }
    } catch (error) {
        console.error('❌ Error loading sectors:', error);
        hideLoadingState('loadingSectors', 'sectorsTableContainer');
        showErrorInTable('sectorsTable', `Network error: ${error.message}`, 4);
    }
}

// Display sectors
function displaySectors(sectors) {
    const tableBody = document.getElementById('sectorsTable');
    tableBody.innerHTML = '';
    
    sectors.forEach(sector => {
        const row = document.createElement('tr');
        const totalValue = sector.total_value;
        const numAssets = sector.num_assets || sector.asset_count || 0;
        
        row.className = 'hover:bg-dark-700 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-white">${sector.asset_type}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                ${formatIndianCurrency(totalValue)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${numAssets} assets
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewSector('${sector.asset_type}')" class="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-dark-600" title="View Sector Details">
                    <i data-feather="eye" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    feather.replace();
}

// Load watchlist
async function loadWatchlist() {
    try {
        console.log('🔄 Loading watchlist...');
        
        // Show loading state
        showLoadingState('loadingWatchlist', 'watchlistTableContainer');
        
        const response = await fetch('/api/assets/watchlist/all');
        console.log('📊 Watchlist API response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Watchlist API error:', response.status, response.statusText);
            hideLoadingState('loadingWatchlist', 'watchlistTableContainer');
            showErrorInTable('watchlistTable', `API Error: ${response.status} ${response.statusText}`, 5);
            return;
        }
        
        const data = await response.json();
        console.log('📈 Watchlist data received:', {
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 'N/A',
            sampleData: Array.isArray(data) && data.length > 0 ? data[0] : 'No data'
        });
        
        if (Array.isArray(data) && data.length > 0) {
            hideLoadingState('loadingWatchlist', 'watchlistTableContainer');
            displayWatchlist(data);
            console.log('✅ Watchlist loaded successfully:', data.length, 'items found');
        } else {
            console.log('ℹ️ No watchlist items available');
            hideLoadingState('loadingWatchlist', 'watchlistTableContainer');
            showErrorInTable('watchlistTable', 'Your watchlist is empty. Add stocks to your watchlist to see them here.', 5);
        }
    } catch (error) {
        console.error('❌ Error loading watchlist:', error);
        hideLoadingState('loadingWatchlist', 'watchlistTableContainer');
        showErrorInTable('watchlistTable', `Network error: ${error.message}`, 5);
    }
}

// Display watchlist
function displayWatchlist(assets) {
    console.log('📊 Displaying watchlist with', assets.length, 'assets:', assets);
    const tableBody = document.getElementById('watchlistTable');
    if (!tableBody) {
        console.error('❌ watchlistTable element not found!');
        return;
    }
    tableBody.innerHTML = '';
    
    assets.forEach(asset => {
        const row = document.createElement('tr');
        const dailyChange = asset.day_change || 0;
        const changePercent = asset.day_change_percent || 0;
        
        row.className = 'hover:bg-dark-700 transition-colors cursor-pointer';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap" onclick="showPriceHistory('${asset.ticker}')">
                <div class="text-sm font-medium text-white hover:text-blue-400">${asset.ticker}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" onclick="showPriceHistory('${asset.ticker}')">
                <div class="text-sm text-white hover:text-blue-400">${asset.asset_name}</div>
                <div class="text-sm text-gray-400">${asset.sector || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white" onclick="showPriceHistory('${asset.ticker}')">
                ${formatIndianCurrency(asset.current_price)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap" onclick="showPriceHistory('${asset.ticker}')">
                <div class="text-sm ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${dailyChange >= 0 ? '+' : ''}${formatIndianCurrency(dailyChange)} (${Number(changePercent).toFixed(2)}%)
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="event.stopPropagation(); showPriceHistory('${asset.ticker}')" class="text-yellow-400 hover:text-yellow-300 p-1 rounded hover:bg-dark-600" title="Price History">
                        <i data-feather="trending-up" class="w-4 h-4"></i>
                    </button>
                    <button onclick="event.stopPropagation(); buyStock('${asset.ticker}')" class="text-green-400 hover:text-green-300 p-1 rounded hover:bg-dark-600" title="Buy Stock">
                        <i data-feather="plus-circle" class="w-4 h-4"></i>
                    </button>
                    <button onclick="event.stopPropagation(); removeFromWatchlist('${asset.ticker}')" class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-dark-600" title="Remove from Watchlist">
                        <i data-feather="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    feather.replace();
}

// Filter assets based on search term
function filterAssets(searchTerm) {
    if (!searchTerm.trim()) {
        filteredAssets = [...allAssets];
    } else {
        filteredAssets = allAssets.filter(asset => 
            asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    displayTopStocks(filteredAssets);
}

// Show different tabs
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons (dark theme)
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('bg-red-600', 'text-white', 'hover:bg-red-700');
        button.classList.add('bg-dark-600', 'text-gray-300', 'hover:bg-dark-500');
    });
    
    // Show selected tab content
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    
    // Add active class to selected tab button (dark theme)
    const activeTab = document.querySelector('[onclick="showTab(\'' + tabName + '\')"');
    if (activeTab) {
        activeTab.classList.remove('bg-dark-600', 'text-gray-300', 'hover:bg-dark-500');
        activeTab.classList.add('bg-red-600', 'text-white', 'hover:bg-red-700');
    }
    
    // Load data for specific tabs
    if (tabName === 'watchlist') {
        console.log('🔄 Switching to watchlist tab, loading data...');
        loadWatchlist();
    } else if (tabName === 'sectors') {
        console.log('🔄 Switching to sectors tab, loading data...');
        loadSectors();
    }
}

// Global variable to store selected stock for buying
let selectedStockForBuy = null;

// Debug function to track selectedStockForBuy changes
function debugSelectedStock(action, value) {
    console.log(`🔍 selectedStockForBuy ${action}:`, value);
    console.log('🔍 Stack trace:', new Error().stack);
}

// Buy stock function
function buyStock(ticker) {
    console.log('🛒 Buy stock called for:', ticker);
    console.log('📊 allAssets length:', allAssets.length);
    
    // Find the stock from allAssets
    const stock = allAssets.find(asset => asset.ticker === ticker);
    console.log('🔍 Stock found:', stock ? 'Yes' : 'No');
    
    if (!stock) {
        console.error('❌ Stock not found in allAssets');
        toastr.error('Stock not found');
        return;
    }
    
    console.log('✅ Stock found, opening buy modal...');
    selectedStockForBuy = stock;
    debugSelectedStock('SET', stock);
    openBuyModal(stock);
}

// Open buy modal with stock info
function openBuyModal(stock) {
    const modal = document.getElementById('buyModal');
    const selectedStockDiv = document.getElementById('selectedStock');
    const stockInfo = document.getElementById('buyStockInfo');
    const priceInput = document.getElementById('buyPrice');
    
    // Store stock data in modal data attribute for safety
    modal.setAttribute('data-selected-ticker', stock.ticker);
    modal.setAttribute('data-selected-stock', JSON.stringify(stock));
    
    // Populate stock information
    selectedStockDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <div class="font-medium">${stock.ticker}</div>
                <div class="text-sm text-gray-400">${stock.asset_name}</div>
            </div>
            <div class="text-right">
                <div class="font-bold">${formatIndianCurrency(stock.current_price)}</div>
                <div class="text-xs ${(stock.day_change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${(stock.day_change || 0) >= 0 ? '+' : ''}${formatIndianCurrency(stock.day_change || 0)}
                </div>
            </div>
        </div>
    `;
    
    // Auto-fill current price
    priceInput.value = parseFloat(stock.current_price || 0).toFixed(2);
    
    // Show sector information
    stockInfo.innerHTML = `<strong>Sector:</strong> ${stock.sector || 'N/A'}`;
    
    // Reset form
    document.getElementById('buyQuantity').value = '';
    document.getElementById('buyTotal').textContent = '₹0.00';
    
    // Show modal
    modal.classList.remove('hidden');
    feather.replace();
    
    // Setup event listeners for total calculation
    setupBuyModalListeners();
}

// Close buy modal
function closeBuyModal() {
    console.log('🚪 Closing buy modal...');
    const modal = document.getElementById('buyModal');
    modal.classList.add('hidden');
    debugSelectedStock('CLEAR', selectedStockForBuy);
    selectedStockForBuy = null;
    
    // Clear modal data attributes
    modal.removeAttribute('data-selected-ticker');
    modal.removeAttribute('data-selected-stock');
    
    console.log('🚪 Buy modal closed, selectedStockForBuy cleared');
}

// Setup buy modal event listeners
function setupBuyModalListeners() {
    const quantityInput = document.getElementById('buyQuantity');
    const priceInput = document.getElementById('buyPrice');
    
    function updateTotal() {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        document.getElementById('buyTotal').textContent = formatIndianCurrency(total);
    }
    
    // Remove existing listeners
    quantityInput.removeEventListener('input', updateTotal);
    priceInput.removeEventListener('input', updateTotal);
    
    // Add new listeners
    quantityInput.addEventListener('input', updateTotal);
    priceInput.addEventListener('input', updateTotal);
}

// Execute buy order
async function executeBuyOrder(event) {
    event.preventDefault();
    console.log('🔄 Execute buy order called');
    
    // Get stock data from modal data attributes as backup
    const modal = document.getElementById('buyModal');
    const ticker = modal.getAttribute('data-selected-ticker');
    const stockData = modal.getAttribute('data-selected-stock');
    
    console.log('📊 Modal ticker:', ticker);
    console.log('📊 Modal stock data:', stockData);
    console.log('📊 selectedStockForBuy:', selectedStockForBuy);
    
    // Use modal data if global variable is null
    let stockToUse = selectedStockForBuy;
    if (!stockToUse && ticker && stockData) {
        try {
            stockToUse = JSON.parse(stockData);
            console.log('🔄 Using stock data from modal attributes');
        } catch (e) {
            console.error('❌ Error parsing stock data from modal:', e);
        }
    }
    
    if (!stockToUse) {
        console.error('❌ No stock selected for buy');
        console.error('❌ Modal hidden:', modal.classList.contains('hidden'));
        toastr.error('No stock selected');
        return;
    }
    
    const quantity = parseInt(document.getElementById('buyQuantity').value);
    const price = parseFloat(document.getElementById('buyPrice').value);
    console.log('📈 Buy details:', { ticker: stockToUse.ticker, quantity, price });
    
    if (!quantity || !price) {
        console.error('❌ Invalid quantity or price');
        toastr.error('Please fill in all fields');
        return;
    }
    
    console.log('⏳ Showing loading overlay...');
    showLoading(true);
    
    try {
        console.log('🌐 Making API request to /api/transactions/buy');
        const requestBody = {
            ticker: stockToUse.ticker,
            quantity: quantity,
            price: price
        };
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch('/api/transactions/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response ok:', response.ok);
        
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (response.ok) {
            console.log('✅ Buy transaction successful');
            closeBuyModal();
            toastr.success(`Successfully bought ${quantity} shares of ${stockToUse.ticker}`);
        } else {
            console.error('❌ Buy transaction failed:', result.error);
            toastr.error(result.error || 'Transaction failed');
        }
    } catch (error) {
        console.error('❌ Error executing buy order:', error);
        console.error('❌ Error details:', error.message);
        toastr.error('Network error occurred');
    } finally {
        console.log('🏁 Hiding loading overlay...');
        showLoading(false);
    }
}

// Add to watchlist
async function addToWatchlist(ticker) {
    try {
        const response = await fetch(`/api/assets/watchlist/${ticker}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            toastr.success(`Added ${ticker} to watchlist`);
            loadWatchlist(); // Refresh watchlist
        } else {
            toastr.error(data.error || 'Failed to add to watchlist');
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        toastr.error('Error adding to watchlist');
    }
}

// Remove from watchlist
async function removeFromWatchlist(ticker) {
    try {
        const response = await fetch(`/api/assets/watchlist/${ticker}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            toastr.success(`Removed ${ticker} from watchlist`);
            loadWatchlist(); // Refresh watchlist
        } else {
            toastr.error(data.error || 'Failed to remove from watchlist');
        }
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        toastr.error('Error removing from watchlist');
    }
}

// Refresh data
function refreshData() {
    loadMarketsData();
    toastr.success('Data refreshed!');
}


// Show loading state
function showLoadingState(loadingId, containerId) {
    const loading = document.getElementById(loadingId);
    const container = document.getElementById(containerId);
    if (loading) loading.style.display = 'block';
    if (container) container.style.display = 'none';
}

// Hide loading state
function hideLoadingState(loadingId, containerId) {
    const loading = document.getElementById(loadingId);
    const container = document.getElementById(containerId);
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'block';
}

// Show error in table
function showErrorInTable(tableId, message, colspan) {
    const tableBody = document.getElementById(tableId);
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="px-6 py-12 text-center">
                    <div class="text-gray-400">
                        <i data-feather="alert-circle" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                        <p class="text-lg font-medium mb-2">${message}</p>
                        <button onclick="loadMarketsData()" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Try Again
                        </button>
                    </div>
                </td>
            </tr>
        `;
        feather.replace();
    }
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    const element = document.getElementById('lastUpdated');
    if (element) {
        element.textContent = timeString;
    }
}

// Format Indian currency
function formatIndianCurrency(amount) {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// View sector function (placeholder)
function viewSector(assetType) {
    toastr.info(`Viewing ${assetType} sector details`);
    // In a real app, this would show sector-specific stocks or detailed analysis
}

// Format currency without symbol (for calculations)
function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Price History Modal Functions
let currentPriceHistoryTicker = null;
let currentPriceHistoryPeriod = '1M';
let priceChart = null;

// Show price history modal
async function showPriceHistory(ticker) {
    currentPriceHistoryTicker = ticker;
    currentPriceHistoryPeriod = '1M';
    
    // Find stock information
    const stock = allAssets.find(asset => asset.ticker === ticker);
    if (!stock) {
        toastr.error('Stock information not found');
        return;
    }
    
    // Update modal title and subtitle
    document.getElementById('priceHistoryTitle').textContent = `${ticker} Price History`;
    document.getElementById('priceHistorySubtitle').textContent = `${stock.asset_name} - ${stock.sector || 'N/A'}`;
    
    // Reset period buttons
    resetPeriodButtons();
    document.getElementById('period-1M').classList.remove('bg-dark-600', 'text-gray-300');
    document.getElementById('period-1M').classList.add('bg-red-600', 'text-white');
    
    // Show modal
    document.getElementById('priceHistoryModal').classList.remove('hidden');
    
    // Load price history data
    await loadPriceHistory();
    
    feather.replace();
}

// Close price history modal
function closePriceHistoryModal() {
    document.getElementById('priceHistoryModal').classList.add('hidden');
    currentPriceHistoryTicker = null;
    
    // Destroy existing chart
    if (priceChart) {
        priceChart.destroy();
        priceChart = null;
    }
}

// Set price history period
async function setPriceHistoryPeriod(period) {
    currentPriceHistoryPeriod = period;
    
    // Reset all period buttons
    resetPeriodButtons();
    
    // Set active period button
    const activeButton = document.getElementById(`period-${period}`);
    activeButton.classList.remove('bg-dark-600', 'text-gray-300');
    activeButton.classList.add('bg-red-600', 'text-white');
    
    // Reload price history
    await loadPriceHistory();
}

// Reset period buttons
function resetPeriodButtons() {
    const periods = ['1M', '3M', '6M', '1Y', 'ALL'];
    periods.forEach(period => {
        const button = document.getElementById(`period-${period}`);
        button.classList.remove('bg-red-600', 'text-white');
        button.classList.add('bg-dark-600', 'text-gray-300');
    });
}

// Load price history data
async function loadPriceHistory() {
    if (!currentPriceHistoryTicker) return;
    
    try {
        // Show loading state
        document.getElementById('priceChartLoading').classList.remove('hidden');
        document.getElementById('priceChartContainer').classList.add('hidden');
        document.getElementById('priceChartError').classList.add('hidden');
        
        const response = await fetch(`/api/assets/${currentPriceHistoryTicker}/price-history?period=${currentPriceHistoryPeriod}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Received price history data:', data);
        console.log('📈 Data points:', data.data?.length || 0);
        
        // Update current price info
        updatePriceInfo(data);
        
        // Create or update chart
        console.log('🎯 About to create chart with data length:', data.data?.length);
        createPriceChart(data.data);
        
        // Hide loading, show chart
        document.getElementById('priceChartLoading').classList.add('hidden');
        document.getElementById('priceChartContainer').classList.remove('hidden');
        console.log('✅ Chart creation completed');
        
    } catch (error) {
        console.error('Error loading price history:', error);
        console.error('Error details:', error.message);
        
        // Hide loading, show error
        document.getElementById('priceChartLoading').classList.add('hidden');
        document.getElementById('priceChartError').classList.remove('hidden');
    }
}

// Update price info display
function updatePriceInfo(data) {
    const stats = data.stats || {};
    
    // Current price
    document.getElementById('currentPrice').textContent = formatIndianCurrency(stats.currentPrice || 0);
    
    // Day change
    const dayChange = stats.periodReturn || 0;
    const dayChangePercent = stats.periodReturnPercent || 0;
    const dayChangeElement = document.getElementById('dayChange');
    
    dayChangeElement.textContent = `${dayChange >= 0 ? '+' : ''}${formatIndianCurrency(dayChange)} (${dayChangePercent.toFixed(2)}%)`;
    dayChangeElement.className = `font-bold ${dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`;
    
    // Period high and low
    document.getElementById('periodHigh').textContent = formatIndianCurrency(stats.periodHigh || 0);
    document.getElementById('periodLow').textContent = formatIndianCurrency(stats.periodLow || 0);
}

// Create price chart
function createPriceChart(priceData) {
    console.log('🎨 Creating price chart with data:', priceData);
    console.log('📊 Data length:', priceData?.length || 0);
    
    if (!priceData || priceData.length === 0) {
        console.error('❌ No price data available for chart');
        document.getElementById('priceChartError').classList.remove('hidden');
        return;
    }
    
    // Destroy existing chart
    if (priceChart) {
        priceChart.destroy();
    }
    
    const ctx = document.getElementById('priceHistoryChart').getContext('2d');
    console.log('🎨 Chart context obtained:', ctx);
    console.log('📊 Chart.js available:', typeof Chart !== 'undefined');
    
    // Prepare data for Chart.js
    const labels = priceData.map(d => {
        const date = new Date(d.price_date);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    });
    
    const prices = priceData.map(d => d.price || d.close_price || 0);
    
    console.log('📅 Labels:', labels.slice(0, 5), '... (total:', labels.length, ')');
    console.log('💰 Prices:', prices.slice(0, 5), '... (total:', prices.length, ')');
    
    // Determine chart color based on overall trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPositive = lastPrice >= firstPrice;
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
                data: prices,
                borderColor: isPositive ? '#10B981' : '#EF4444', // green or red
                backgroundColor: isPositive 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointBackgroundColor: isPositive ? '#10B981' : '#EF4444',
                pointBorderColor: '#1F2937',
                pointBorderWidth: 1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F9FAFB',
                    bodyColor: '#F9FAFB',
                    borderColor: '#374151',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Price: ${formatIndianCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        callback: function(value) {
                            return formatIndianCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Buy stock from chart
function buyStockFromChart() {
    if (currentPriceHistoryTicker) {
        closePriceHistoryModal();
        buyStock(currentPriceHistoryTicker);
    }
}

// Test function to verify chart creation
function testChartCreation() {
    console.log('🧪 Testing chart creation...');
    
    // Test data
    const testData = [
        { price_date: '2025-08-01', price: 150.00 },
        { price_date: '2025-08-02', price: 152.50 },
        { price_date: '2025-08-03', price: 151.75 },
        { price_date: '2025-08-04', price: 153.25 },
        { price_date: '2025-08-05', price: 154.00 }
    ];
    
    console.log('📊 Test data:', testData);
    createPriceChart(testData);
    console.log('✅ Test chart creation completed');
}

// Add to watchlist from chart
function addToWatchlistFromChart() {
    if (currentPriceHistoryTicker) {
        addToWatchlist(currentPriceHistoryTicker);
    }
}
