// Global variables
let allHoldings = [];
let filteredHoldings = [];
let currentTransactionType = 'BUY';
let currentAsset = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    loadHoldingsData();
    setupEventListeners();
    updateLastUpdated();
});

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    document.getElementById('lastUpdated').textContent = timeString;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterHoldings();
    });

    // Asset type filter
    document.getElementById('assetTypeFilter').addEventListener('change', function(e) {
        filterHoldings();
    });
}

// Load holdings data
async function loadHoldingsData() {
    try {
        await Promise.all([
            loadHoldings(),
            loadPortfolioSummary()
        ]);
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading holdings data:', error);
        toastr.error('Failed to load portfolio data');
        hideLoadingState();
    }
}

// Load holdings
async function loadHoldings() {
    try {
        console.log('🔄 Fetching holdings from API...');
        
        // Call the correct holdings API endpoint
        const response = await fetch('/api/portfolio/holdings');
        const data = await response.json();
        
        console.log('📊 API Response:', { 
            ok: response.ok, 
            status: response.status, 
            dataLength: Array.isArray(data) ? data.length : 'Not array',
            sampleData: Array.isArray(data) && data.length > 0 ? data[0] : data
        });
        
        if (response.ok) {
            if (Array.isArray(data) && data.length > 0) {
                // Transform the data to ensure correct data types
                allHoldings = data.map(holding => ({
                    ticker: holding.ticker,
                    asset_name: holding.asset_name,
                    asset_type: holding.asset_type || 'STOCK',
                    sector: holding.sector,
                    quantity: parseInt(holding.quantity) || 0,
                    avg_buy_price: parseFloat(holding.avg_buy_price) || 0,
                    current_price: parseFloat(holding.current_price) || 0,
                    market_value: parseFloat(holding.market_value) || 0,
                    price_change: parseFloat(holding.price_change) || 0,
                    return_percentage: parseFloat(holding.return_percentage) || 0,
                    day_change: parseFloat(holding.day_change) || 0
                }));
                
                filteredHoldings = [...allHoldings];
                displayHoldings(allHoldings);
                console.log('✅ Holdings loaded successfully:', allHoldings.length, 'positions found');
                
                // Log first holding for debugging
                if (allHoldings.length > 0) {
                    console.log('📋 First holding:', allHoldings[0]);
                }
            } else {
                console.log('ℹ️ No holdings data returned from API');
                displayNoHoldings();
            }
        } else {
            console.error('❌ API Error:', response.status, data);
            displayErrorState(`API Error: ${data.error || 'Failed to load holdings'}`);
        }
    } catch (error) {
        console.error('❌ Network error loading holdings:', error);
        displayErrorState('Network error while loading holdings');
    }
}

// Hide loading state and show table
function hideLoadingState() {
    document.getElementById('loadingHoldings').style.display = 'none';
    document.getElementById('holdingsTableContainer').style.display = 'table';
}

// Display no holdings state
function displayNoHoldings() {
    hideLoadingState();
    const tableBody = document.getElementById('holdingsTable');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-12 text-center">
                <div class="text-gray-400">
                    <i data-feather="briefcase" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p class="text-lg font-medium mb-2">No Holdings Found</p>
                    <p class="text-sm">Start by buying some assets from the Markets page or Dashboard.</p>
                    <a href="index.html" class="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Go to Dashboard</a>
                </div>
            </td>
        </tr>
    `;
    feather.replace();
}

// Display error state
function displayErrorState(errorMessage) {
    hideLoadingState();
    const tableBody = document.getElementById('holdingsTable');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-12 text-center">
                <div class="text-gray-400">
                    <i data-feather="alert-circle" class="w-12 h-12 mx-auto mb-4 text-red-400"></i>
                    <p class="text-lg font-medium mb-2 text-red-400">Error Loading Holdings</p>
                    <p class="text-sm">${errorMessage}</p>
                    <button onclick="refreshData()" class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Try Again</button>
                </div>
            </td>
        </tr>
    `;
    feather.replace();
}

// Display holdings
function displayHoldings(holdings) {
    hideLoadingState();
    const tableBody = document.getElementById('holdingsTable');
    tableBody.innerHTML = '';
    
    if (holdings.length === 0) {
        displayNoHoldings();
        return;
    }
    
    holdings.forEach(holding => {
        const row = document.createElement('tr');
        const marketValue = holding.market_value;
        const totalReturn = holding.price_change * holding.quantity;
        const totalReturnPercent = holding.return_percentage;
        
        row.className = 'hover:bg-dark-700 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div>
                        <div class="text-sm font-medium text-white">${holding.ticker}</div>
                        <div class="text-sm text-gray-400">${holding.asset_name}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-600 text-white">
                    ${holding.asset_type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${holding.quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatIndianCurrency(holding.avg_buy_price)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${formatIndianCurrency(holding.current_price)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${formatIndianCurrency(marketValue)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${totalReturn >= 0 ? '+' : ''}${formatIndianCurrency(totalReturn)}
                    <div class="text-xs">(${totalReturnPercent.toFixed(2)}%)</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="viewAsset('${holding.ticker}')" class="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-dark-600" title="View Details">
                        <i data-feather="eye" class="w-4 h-4"></i>
                    </button>
                    <button onclick="buyMore('${holding.ticker}')" class="text-green-400 hover:text-green-300 p-1 rounded hover:bg-dark-600" title="Buy More">
                        <i data-feather="plus" class="w-4 h-4"></i>
                    </button>
                    <button onclick="sellAsset('${holding.ticker}')" class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-dark-600" title="Sell">
                        <i data-feather="minus" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    feather.replace();
}

// Load portfolio summary
async function loadPortfolioSummary() {
    try {
        console.log('🔄 Loading portfolio summary...');
        const response = await fetch('/api/portfolio/overview');
        const data = await response.json();
        
        console.log('📊 Portfolio summary response:', { 
            ok: response.ok, 
            status: response.status, 
            data: data 
        });
        
        if (response.ok) {
            updatePortfolioSummary(data);
        } else {
            console.error('Error loading portfolio summary:', data.error);
        }
    } catch (error) {
        console.error('Error loading portfolio summary:', error);
    }
}

// Update portfolio summary
function updatePortfolioSummary(data) {
    console.log('📊 Updating portfolio summary with data:', data);
    
    const totalValue = data.total_value || 0;
    const totalInvested = data.total_invested || 0;
    const gainLoss = data.total_gain_loss || 0;
    
    console.log('💰 Values:', { totalValue, totalInvested, gainLoss });
    
    document.getElementById('totalValue').textContent = formatIndianCurrency(totalValue);
    document.getElementById('totalInvested').textContent = formatIndianCurrency(totalInvested);
    
    const gainLossElement = document.getElementById('totalGainLoss');
    gainLossElement.textContent = formatIndianCurrency(gainLoss);
    gainLossElement.className = gainLoss >= 0 ? 'text-2xl font-bold text-green-400' : 'text-2xl font-bold text-red-400';
    
    // Calculate and display gain/loss percentage
    const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
    document.getElementById('totalGainLossPercent').textContent = `${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%`;
    
    document.getElementById('holdingsCount').textContent = allHoldings.length;
    
    console.log('✅ Portfolio summary updated');
}

// Filter holdings
function filterHoldings() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const assetType = document.getElementById('assetTypeFilter').value;
    
    filteredHoldings = allHoldings.filter(holding => {
        const matchesSearch = holding.ticker.toLowerCase().includes(searchTerm) ||
                            holding.asset_name.toLowerCase().includes(searchTerm) ||
                            (holding.sector && holding.sector.toLowerCase().includes(searchTerm));
        const matchesType = assetType === '' || holding.asset_type === assetType;
        
        return matchesSearch && matchesType;
    });
    
    displayHoldings(filteredHoldings);
}

// View asset details
async function viewAsset(ticker) {
    try {
        const holding = allHoldings.find(h => h.ticker === ticker);
        if (!holding) {
            toastr.error('Asset not found');
            return;
        }

        // Fetch transaction history for this asset
        const response = await fetch(`/api/transactions/asset/${ticker}`);
        const transactions = response.ok ? await response.json() : [];

        // Populate modal with asset details
        document.getElementById('assetModalTitle').textContent = `${ticker} - ${holding.asset_name}`;
        document.getElementById('assetModalContent').innerHTML = `
            <div class="space-y-6">
                <!-- Current Position -->
                <div class="bg-dark-700 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-white mb-4">Current Position</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-gray-400 text-sm">Quantity</p>
                            <p class="text-white font-medium">${holding.quantity}</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-sm">Avg Buy Price</p>
                            <p class="text-white font-medium">${formatIndianCurrency(holding.avg_buy_price)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-sm">Current Price</p>
                            <p class="text-white font-medium">${formatIndianCurrency(holding.current_price)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-sm">Market Value</p>
                            <p class="text-white font-medium">${formatIndianCurrency(holding.market_value)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-sm">Total Return</p>
                            <p class="${(holding.price_change * holding.quantity) >= 0 ? 'text-green-400' : 'text-red-400'} font-medium">
                                ${formatIndianCurrency(holding.price_change * holding.quantity)} 
                                (${holding.return_percentage.toFixed(2)}%)
                            </p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-sm">Asset Type</p>
                            <p class="text-white font-medium">${holding.asset_type}</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="bg-dark-700 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                    <div class="max-h-64 overflow-y-auto">
                        ${transactions.length > 0 ? 
                            transactions.map(tx => `
                                <div class="flex justify-between items-center py-2 border-b border-dark-600 last:border-b-0">
                                    <div>
                                        <span class="px-2 py-1 text-xs rounded ${tx.transaction_type === 'BUY' ? 'bg-green-600' : tx.transaction_type === 'SELL' ? 'bg-red-600' : 'bg-blue-600'} text-white">
                                            ${tx.transaction_type}
                                        </span>
                                        <span class="text-white ml-2">${tx.quantity} shares</span>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-white">${formatIndianCurrency(tx.price)}</p>
                                        <p class="text-gray-400 text-xs">${new Date(tx.transaction_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            `).join('') 
                            : '<p class="text-gray-400 text-center py-4">No transactions found</p>'
                        }
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex space-x-3">
                    <button onclick="closeAssetModal(); buyMore('${ticker}')" 
                            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i data-feather="plus" class="w-4 h-4 mr-2 inline"></i>
                        Buy More
                    </button>
                    <button onclick="closeAssetModal(); sellAsset('${ticker}')" 
                            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <i data-feather="minus" class="w-4 h-4 mr-2 inline"></i>
                        Sell
                    </button>
                </div>
            </div>
        `;

        // Show modal
        document.getElementById('assetModal').classList.remove('hidden');
        feather.replace();
    } catch (error) {
        console.error('Error loading asset details:', error);
        toastr.error('Error loading asset details');
    }
}

// Buy more of an asset
function buyMore(ticker) {
    const holding = allHoldings.find(h => h.ticker === ticker);
    if (!holding) {
        toastr.error('Asset not found');
        return;
    }

    currentTransactionType = 'BUY';
    currentAsset = holding;
    openTransactionModal();
}

// Sell an asset
function sellAsset(ticker) {
    const holding = allHoldings.find(h => h.ticker === ticker);
    if (!holding) {
        toastr.error('Asset not found');
        return;
    }

    currentTransactionType = 'SELL';
    currentAsset = holding;
    openTransactionModal();
}

// Export holdings to CSV
function exportHoldings() {
    const headers = ['Ticker', 'Asset Name', 'Type', 'Quantity', 'Avg Buy Price', 'Current Price', 'Market Value', 'Total Return', 'Return %'];
    const csvContent = [
        headers.join(','),
        ...filteredHoldings.map(holding => [
            holding.ticker,
            holding.asset_name,
            holding.asset_type,
            holding.quantity,
            holding.avg_buy_price,
            holding.current_price,
            holding.market_value,
            (holding.price_change * holding.quantity).toFixed(2),
            holding.return_percentage.toFixed(2)
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'holdings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toastr.success('Holdings exported to CSV');
}

// Refresh data
function refreshData() {
    // Show loading state
    document.getElementById('loadingHoldings').style.display = 'block';
    document.getElementById('holdingsTableContainer').style.display = 'none';
    
    loadHoldingsData();
    toastr.success('Portfolio data refreshed');
}


// Format Indian currency
function formatIndianCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format currency without symbol (for calculations)
function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Modal functions
function closeAssetModal() {
    document.getElementById('assetModal').classList.add('hidden');
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.add('hidden');
    // Reset form
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionTotal').textContent = '₹0';
}

// Open transaction modal
function openTransactionModal() {
    if (!currentAsset) return;

    // Set modal title and button text
    const isSupporting = currentTransactionType === 'BUY';
    document.getElementById('transactionModalTitle').textContent = 
        isSupporting ? `Buy More ${currentAsset.ticker}` : `Sell ${currentAsset.ticker}`;
    document.getElementById('transactionSubmitBtn').textContent = 
        isSupporting ? 'Buy Stock' : 'Sell Stock';
    document.getElementById('transactionSubmitBtn').className = 
        `flex-1 px-4 py-2 ${isSupporting ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg`;

    // Populate form fields
    document.getElementById('transactionTicker').value = currentAsset.ticker;
    document.getElementById('transactionCurrentPrice').value = formatCurrency(currentAsset.current_price);
    document.getElementById('transactionPrice').value = currentAsset.current_price;

    // Show/hide available quantity for sell transactions
    const availableQtyDiv = document.getElementById('availableQuantityDiv');
    if (currentTransactionType === 'SELL') {
        document.getElementById('transactionAvailableQty').value = currentAsset.quantity;
        document.getElementById('transactionQuantity').setAttribute('max', currentAsset.quantity);
        availableQtyDiv.style.display = 'block';
    } else {
        document.getElementById('transactionQuantity').removeAttribute('max');
        availableQtyDiv.style.display = 'none';
    }

    // Set up event listeners for calculation
    setupTransactionCalculation();

    // Show modal
    document.getElementById('transactionModal').classList.remove('hidden');
    feather.replace();
}

// Setup transaction calculation
function setupTransactionCalculation() {
    const quantityInput = document.getElementById('transactionQuantity');
    const priceInput = document.getElementById('transactionPrice');
    const totalElement = document.getElementById('transactionTotal');

    function updateTotal() {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        totalElement.textContent = formatIndianCurrency(total);
    }

    // Remove existing listeners to avoid duplicates
    quantityInput.removeEventListener('input', updateTotal);
    priceInput.removeEventListener('input', updateTotal);
    
    // Add new listeners
    quantityInput.addEventListener('input', updateTotal);
    priceInput.addEventListener('input', updateTotal);
    
    // Initial calculation
    updateTotal();
}

// Handle transaction form submission
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('transactionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const ticker = document.getElementById('transactionTicker').value;
        const quantity = parseInt(document.getElementById('transactionQuantity').value);
        const price = parseFloat(document.getElementById('transactionPrice').value);
        
        if (!ticker || !quantity || !price) {
            toastr.error('Please fill in all required fields');
            return;
        }

        if (currentTransactionType === 'SELL' && quantity > currentAsset.quantity) {
            toastr.error('Cannot sell more shares than you own');
            return;
        }

        // Disable submit button during transaction
        const submitBtn = document.getElementById('transactionSubmitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
            const endpoint = currentTransactionType === 'BUY' ? '/api/transactions/buy' : '/api/transactions/sell';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticker: ticker,
                    quantity: quantity,
                    price: price
                })
            });

            const result = await response.json();

            if (response.ok) {
                toastr.success(`Successfully ${currentTransactionType.toLowerCase()} ${quantity} shares of ${ticker}`);
                closeTransactionModal();
                // Refresh holdings data
                await loadHoldingsData();
            } else {
                toastr.error(result.error || 'Transaction failed');
            }
        } catch (error) {
            console.error('Transaction error:', error);
            toastr.error('Network error during transaction');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    const assetModal = document.getElementById('assetModal');
    const transactionModal = document.getElementById('transactionModal');
    
    if (e.target === assetModal) {
        closeAssetModal();
    }
    if (e.target === transactionModal) {
        closeTransactionModal();
    }
});
