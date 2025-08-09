// Global variables
let performanceChart = null;
let allocationChart = null;
let comparisonChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    loadDashboardData();
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

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadPortfolioOverview(),
            loadRecentActivity(),
            loadCharts()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        toastr.error('Error loading dashboard data');
    }
}

// Load portfolio overview
async function loadPortfolioOverview() {
    try {
        const response = await fetch('/api/portfolio/overview');
        const data = await response.json();
        
        if (response.ok) {
            updateDashboardCards(data);
        } else {
            console.error('Error loading portfolio overview:', data.error);
        }
    } catch (error) {
        console.error('Error loading portfolio overview:', error);
    }
}

// Update dashboard cards
function updateDashboardCards(data) {
    document.getElementById('totalValue').textContent = formatIndianCurrency(data.total_value);
    document.getElementById('cashHoldings').textContent = formatIndianCurrency(data.cash_holdings);
    
    // Update total gain/loss
    const gainLossElement = document.getElementById('totalGainLoss');
    const gainLoss = data.total_gain_loss;
    gainLossElement.textContent = formatIndianCurrency(gainLoss);
    gainLossElement.className = gainLoss >= 0 ? 'text-2xl font-bold text-green-500' : 'text-2xl font-bold text-red-500';
    
    // Update total gain/loss percentage
    const gainLossPercentElement = document.getElementById('totalGainLossPercent');
    const gainLossPercent = data.total_gain_loss_percent || 0;
    gainLossPercentElement.textContent = `${gainLoss >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%`;
    gainLossPercentElement.className = gainLoss >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm';
    
    // Update day's gain/loss
    const dayGainLossElement = document.getElementById('dayGainLoss');
    const dayGainLoss = data.day_gain_loss;
    dayGainLossElement.textContent = formatIndianCurrency(dayGainLoss);
    dayGainLossElement.className = dayGainLoss >= 0 ? 'text-2xl font-bold text-green-500' : 'text-2xl font-bold text-red-500';
    
    // Update day's gain/loss percentage
    const dayGainLossPercentElement = document.getElementById('dayGainLossPercent');
    const dayGainLossPercent = data.day_gain_loss_percent || 0;
    dayGainLossPercentElement.textContent = `${dayGainLoss >= 0 ? '+' : ''}${dayGainLossPercent.toFixed(2)}%`;
    dayGainLossPercentElement.className = dayGainLoss >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm';
    
    // Update total value change (placeholder for now)
    const totalValueChangeElement = document.getElementById('totalValueChange');
    if (totalValueChangeElement) {
        totalValueChangeElement.textContent = `+₹0 (+0.00%)`;
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        console.log('🔄 Fetching recent transactions from API...');
        
        const response = await fetch('/api/transactions');
        const data = await response.json();
        
        console.log('📊 Transactions API Response:', { 
            ok: response.ok, 
            status: response.status, 
            dataLength: Array.isArray(data) ? data.length : 'Not array',
            sampleData: Array.isArray(data) && data.length > 0 ? data[0] : 'No data'
        });
        
        if (response.ok) {
            if (Array.isArray(data) && data.length > 0) {
                // Show last 8 transactions for better visibility
                displayRecentActivity(data.slice(0, 8)); 
                console.log('✅ Recent activity loaded successfully:', data.length, 'transactions found');
            } else {
                console.log('ℹ️ No transactions found');
                displayRecentActivity([]);
            }
        } else {
            console.error('❌ API Error:', response.status, data);
            displayRecentActivityError(`API Error: ${data.error || 'Failed to load recent transactions'}`);
        }
    } catch (error) {
        console.error('❌ Network error loading recent activity:', error);
        displayRecentActivityError('Network error while loading transactions');
    }
}

// Display recent activity
function displayRecentActivity(transactions) {
    const activityList = document.getElementById('recentActivityList');
    activityList.innerHTML = '';
    
    if (transactions.length === 0) {
        activityList.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i data-feather="activity" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                <p class="text-lg font-medium mb-2">No Recent Activity</p>
                <p class="text-sm">Your transactions will appear here</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    transactions.forEach(transaction => {
        const activityItem = document.createElement('div');
        activityItem.className = 'flex justify-between items-center p-3 hover:bg-dark-700 rounded-lg transition-colors border-l-4 border-transparent hover:border-blue-500';
        
        const date = new Date(transaction.transaction_date).toLocaleDateString('en-IN');
        const timeAgo = getTimeAgo(transaction.transaction_date);
        const amount = transaction.quantity * transaction.price;
        
        // Enhanced action text with colors
        const actionConfig = {
            'BUY': { text: 'Bought', color: 'text-green-400', icon: 'trending-up' },
            'SELL': { text: 'Sold', color: 'text-red-400', icon: 'trending-down' },
            'DIVIDEND': { text: 'Dividend', color: 'text-blue-400', icon: 'dollar-sign' }
        };
        
        const config = actionConfig[transaction.transaction_type] || 
                      { text: transaction.transaction_type, color: 'text-gray-400', icon: 'activity' };
        
        activityItem.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <i data-feather="${config.icon}" class="w-5 h-5 ${config.color}"></i>
                </div>
                <div>
                    <p class="text-white font-medium">
                        ${config.text} <span class="${config.color}">${transaction.ticker}</span>
                    </p>
                    <p class="text-gray-400 text-sm">
                        ${transaction.quantity} shares at ${formatIndianCurrency(transaction.price)}
                        <span class="text-xs text-gray-500 ml-2">• Total: ${formatIndianCurrency(amount)}</span>
                    </p>
                </div>
            </div>
            <div class="text-right">
                <div class="text-gray-400 text-sm">${timeAgo}</div>
                <div class="text-xs text-gray-500">${date}</div>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
    
    // Replace feather icons
    feather.replace();
}

// Display error state for recent activity
function displayRecentActivityError(errorMessage) {
    const activityList = document.getElementById('recentActivityList');
    activityList.innerHTML = `
        <div class="text-center text-gray-400 py-8">
            <i data-feather="alert-circle" class="w-12 h-12 mx-auto mb-3 text-red-400"></i>
            <p class="text-lg font-medium mb-2 text-red-400">Error Loading Transactions</p>
            <p class="text-sm">${errorMessage}</p>
            <button onclick="loadRecentActivity()" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Try Again
            </button>
        </div>
    `;
    feather.replace();
}

// Get time ago string
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
}

// Load charts
async function loadCharts() {
    try {
        await Promise.all([
            loadPerformanceChart(),
            loadAllocationChart(),
            loadComparisonChart()
        ]);
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

// Load performance chart
async function loadPerformanceChart() {
    try {
        const response = await fetch('/api/portfolio/performance');
        const data = await response.json();
        
        if (response.ok) {
            createPerformanceChart(data);
            updatePortfolioSummary(data);
        } else {
            console.error('Error loading performance data:', data.error);
        }
    } catch (error) {
        console.error('Error loading performance data:', error);
    }
}

// Update portfolio summary with real data
function updatePortfolioSummary(performanceData) {
    if (!performanceData || performanceData.length === 0) return;
    
    // Get the latest performance data
    const latestData = performanceData[performanceData.length - 1];
    const previousData = performanceData.length > 1 ? performanceData[performanceData.length - 2] : null;
    
    // Calculate current portfolio value and change
    const currentValue = latestData.total_return || 0;
    const previousValue = previousData ? previousData.total_return : currentValue;
    const change = currentValue - previousValue;
    const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
    
    // Update the DOM elements using IDs
    const valueElement = document.getElementById('portfolioValue');
    const changeElement = document.getElementById('portfolioChange');
    
    if (valueElement) {
        valueElement.textContent = formatIndianCurrency(currentValue);
    }
    
    if (changeElement) {
        const changeText = `${change >= 0 ? '+' : ''}${formatIndianCurrency(change)} (${changePercent.toFixed(2)}%)`;
        changeElement.textContent = changeText;
        changeElement.className = change >= 0 ? 'text-green-500' : 'text-red-500';
    }
}

// Create performance chart
function createPerformanceChart(data) {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Format dates for better readability
    const labels = data.map(item => {
        const date = new Date(item.as_of_date);
        return date.toLocaleDateString('en-IN', { 
            month: 'short', 
            day: 'numeric' 
        });
    });
    
    // Use total_return as the actual portfolio value
    const values = data.map(item => {
        return item.total_return || 0;
    });
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: values,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return 'Portfolio Value: ' + formatIndianCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return formatIndianCurrency(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxTicksLimit: 10
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}


// Load allocation chart
async function loadAllocationChart() {
    try {
        const response = await fetch('/api/portfolio/allocation');
        const data = await response.json();
        
        if (response.ok) {
            createAllocationChart(data);
        } else {
            console.error('Error loading allocation data:', data.error);
            // Fallback to sample data if API fails
            const sampleData = [
                { asset_type: 'STOCK', total_value: 750000 },
                { asset_type: 'ETF', total_value: 300000 },
                { asset_type: 'MUTUAL_FUND', total_value: 200000 },
                { asset_type: 'BOND', total_value: 100000 }
            ];
            createAllocationChart(sampleData);
        }
    } catch (error) {
        console.error('Error loading allocation data:', error);
        // Fallback to sample data if API fails
        const sampleData = [
            { asset_type: 'STOCK', total_value: 750000 },
            { asset_type: 'ETF', total_value: 300000 },
            { asset_type: 'MUTUAL_FUND', total_value: 200000 },
            { asset_type: 'BOND', total_value: 100000 }
        ];
        createAllocationChart(sampleData);
    }
}

// Create allocation chart
function createAllocationChart(data) {
    const canvas = document.getElementById('allocationChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (allocationChart) {
        allocationChart.destroy();
    }
    
    const labels = data.map(item => item.asset_type);
    const values = data.map(item => item.total_value);
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    
    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });
}

// Load comparison chart
async function loadComparisonChart() {
    try {
        const response = await fetch('/api/portfolio/overview');
        const data = await response.json();
        
        if (response.ok) {
            createComparisonChart(data);
        } else {
            console.error('Error loading comparison data:', data.error);
        }
    } catch (error) {
        console.error('Error loading comparison data:', error);
    }
}

// Create comparison chart
function createComparisonChart(data) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    const invested = data.totalInvested || 1000000;
    const current = data.totalValue || 1245670;
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Invested Value', 'Current Value'],
            datasets: [{
                label: 'Portfolio Value',
                data: [invested, current],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });
}

// Refresh data
function refreshData() {
    loadDashboardData();
    updateLastUpdated();
    toastr.success('Data refreshed!');
}


// Modal Functions
async function openBuyModal() {
    document.getElementById('buyModal').classList.remove('hidden');
    await loadStockDropdown('buyTicker');
    feather.replace();
}

function closeBuyModal() {
    document.getElementById('buyModal').classList.add('hidden');
    document.getElementById('buyForm').reset();
    document.getElementById('buyTotal').textContent = '₹0.00';
    document.getElementById('buyStockInfo').innerHTML = '';
}

async function openSellModal() {
    document.getElementById('sellModal').classList.remove('hidden');
    await loadStockDropdown('sellTicker');
    feather.replace();
}

function closeSellModal() {
    document.getElementById('sellModal').classList.add('hidden');
    document.getElementById('sellForm').reset();
    document.getElementById('sellTotal').textContent = '₹0.00';
    document.getElementById('sellStockInfo').innerHTML = '';
    document.getElementById('sellHoldings').innerHTML = '';
}

function openNewInvestmentModal() {
    document.getElementById('newInvestmentModal').classList.remove('hidden');
    feather.replace();
}

function closeNewInvestmentModal() {
    document.getElementById('newInvestmentModal').classList.add('hidden');
}

// Load stocks into dropdown
async function loadStockDropdown(selectId) {
    try {
        const response = await fetch('/api/assets');
        const stocks = await response.json();
        
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select a stock...</option>';
        
        if (response.ok && stocks.length > 0) {
            stocks.forEach(stock => {
                const option = document.createElement('option');
                option.value = stock.ticker;
                option.textContent = `${stock.ticker} - ${stock.asset_name}`;
                option.dataset.price = stock.current_price || 0;
                option.dataset.sector = stock.sector || '';
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading stocks:', error);
        toastr.error('Error loading stock list');
    }
}

// Auto-fetch stock price and info
async function onStockSelect(selectId, infoId, priceId) {
    const select = document.getElementById(selectId);
    const selectedOption = select.options[select.selectedIndex];
    const ticker = select.value;
    
    if (!ticker) {
        document.getElementById(infoId).innerHTML = '';
        document.getElementById(priceId).value = '';
        return;
    }
    
    // Show loading state
    document.getElementById(infoId).innerHTML = `
        <div class="text-blue-400">
            <i data-feather="loader" class="w-4 h-4 animate-spin inline mr-2"></i>
            Loading stock data...
        </div>
    `;
    feather.replace();
    
    try {
        const response = await fetch(`/api/assets/${ticker}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const stockData = await response.json();
        
        // Validate that we have the required data
        if (!stockData || !stockData.asset_name) {
            throw new Error('Invalid stock data received');
        }
        
        // Update stock info display
        const currentPrice = parseFloat(stockData.current_price) || 0;
        const dayChange = parseFloat(stockData.day_change) || 0;
        const dayChangePercent = parseFloat(stockData.day_change_percent) || 0;
        
        const changeClass = dayChange >= 0 ? 'text-green-400' : 'text-red-400';
        const changeSymbol = dayChange >= 0 ? '+' : '';
        
        document.getElementById(infoId).innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <span class="font-medium">${stockData.asset_name}</span>
                    <span class="text-gray-500 ml-2">${stockData.sector || 'N/A'}</span>
                </div>
                <div class="text-right">
                    <div class="font-bold">₹${formatCurrency(currentPrice)}</div>
                    <div class="${changeClass} text-xs">
                        ${changeSymbol}₹${formatCurrency(Math.abs(dayChange))} (${dayChangePercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
        `;
        
        // Auto-fill price
        document.getElementById(priceId).value = currentPrice.toFixed(2);
        
        // Trigger total calculation
        if (selectId === 'buyTicker') {
            const quantity = parseFloat(document.getElementById('buyQuantity').value) || 0;
            document.getElementById('buyTotal').textContent = formatIndianCurrency(quantity * currentPrice);
        } else if (selectId === 'sellTicker') {
            const quantity = parseFloat(document.getElementById('sellQuantity').value) || 0;
            document.getElementById('sellTotal').textContent = formatIndianCurrency(quantity * currentPrice);
            await checkHoldings(ticker);
        }
        
    } catch (error) {
        console.error('Error fetching stock data:', error);
        document.getElementById(infoId).innerHTML = `
            <div class="text-red-400">
                <i data-feather="alert-circle" class="w-4 h-4 inline mr-2"></i>
                Error: ${error.message}
            </div>
        `;
        feather.replace();
        
        // Clear price field on error
        document.getElementById(priceId).value = '';
    }
}

// Calculate totals for buy/sell modals
document.addEventListener('DOMContentLoaded', function() {
    // Wait for elements to be available
    setTimeout(() => {
        // Buy modal calculations
        const buyQuantity = document.getElementById('buyQuantity');
        const buyPrice = document.getElementById('buyPrice');
        const buyTotal = document.getElementById('buyTotal');
        const buyTicker = document.getElementById('buyTicker');
        
        function updateBuyTotal() {
            const quantity = parseFloat(buyQuantity.value) || 0;
            const price = parseFloat(buyPrice.value) || 0;
            const total = quantity * price;
            buyTotal.textContent = formatIndianCurrency(total);
        }
        
        if (buyQuantity) buyQuantity.addEventListener('input', updateBuyTotal);
        if (buyPrice) buyPrice.addEventListener('input', updateBuyTotal);
        
        // Buy ticker selection
        if (buyTicker) {
            buyTicker.addEventListener('change', function() {
                onStockSelect('buyTicker', 'buyStockInfo', 'buyPrice');
                updateBuyTotal();
            });
        }
        
        // Sell modal calculations
        const sellQuantity = document.getElementById('sellQuantity');
        const sellPrice = document.getElementById('sellPrice');
        const sellTotal = document.getElementById('sellTotal');
        const sellTicker = document.getElementById('sellTicker');
        
        function updateSellTotal() {
            const quantity = parseFloat(sellQuantity.value) || 0;
            const price = parseFloat(sellPrice.value) || 0;
            const total = quantity * price;
            sellTotal.textContent = formatIndianCurrency(total);
        }
        
        if (sellQuantity) sellQuantity.addEventListener('input', updateSellTotal);
        if (sellPrice) sellPrice.addEventListener('input', updateSellTotal);
        
        // Sell ticker selection
        if (sellTicker) {
            sellTicker.addEventListener('change', function() {
                onStockSelect('sellTicker', 'sellStockInfo', 'sellPrice');
                updateSellTotal();
            });
        }
    }, 100);
});

// Check holdings for sell modal
async function checkHoldings(ticker) {
    try {
        const response = await fetch(`/api/assets/${ticker}/holdings`);
        const data = await response.json();
        
        const holdingsDiv = document.getElementById('sellHoldings');
        if (response.ok && data.quantity > 0) {
            holdingsDiv.innerHTML = `
                <div class="text-green-400">
                    Available: ${data.quantity} shares at avg price ₹${data.avg_buy_price.toFixed(2)}
                </div>
            `;
            document.getElementById('sellQuantity').max = data.quantity;
        } else {
            holdingsDiv.innerHTML = `
                <div class="text-red-400">
                    No holdings found for ${ticker}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error checking holdings:', error);
        document.getElementById('sellHoldings').innerHTML = `
            <div class="text-yellow-400">
                Could not verify holdings
            </div>
        `;
    }
}

// Execute buy order
async function executeBuyOrder(event) {
    event.preventDefault();
    
    const ticker = document.getElementById('buyTicker').value;
    const quantity = parseInt(document.getElementById('buyQuantity').value);
    const price = parseFloat(document.getElementById('buyPrice').value);
    
    if (!ticker || !quantity || !price) {
        toastr.error('Please fill in all fields');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/transactions/buy', {
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
            closeBuyModal();
            toastr.success(`Successfully bought ${quantity} shares of ${ticker}`);
            
            console.log('✅ Buy transaction successful, refreshing data...');
            
            // Add a small delay to ensure database has updated
            setTimeout(async () => {
                try {
                    // Refresh all dashboard data including recent activity
                    await Promise.all([
                        loadPortfolioOverview(),
                        loadRecentActivity(),
                        loadCharts()
                    ]);
                    console.log('✅ Dashboard data refreshed after buy transaction');
                } catch (refreshError) {
                    console.error('Error refreshing dashboard after buy:', refreshError);
                    // Try refreshing recent activity specifically
                    await loadRecentActivity();
                }
            }, 500); // 500ms delay to ensure database consistency
            
        } else {
            toastr.error(result.error || 'Transaction failed');
        }
    } catch (error) {
        console.error('Error executing buy order:', error);
        toastr.error('Network error occurred');
    } finally {
        showLoading(false);
    }
}

// Execute sell order
async function executeSellOrder(event) {
    event.preventDefault();
    
    const ticker = document.getElementById('sellTicker').value;
    const quantity = parseInt(document.getElementById('sellQuantity').value);
    const price = parseFloat(document.getElementById('sellPrice').value);
    
    if (!ticker || !quantity || !price) {
        toastr.error('Please fill in all fields');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/transactions/sell', {
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
            closeSellModal();
            toastr.success(`Successfully sold ${quantity} shares of ${ticker}`);
            
            console.log('✅ Sell transaction successful, refreshing data...');
            
            // Add a small delay to ensure database has updated
            setTimeout(async () => {
                try {
                    // Refresh all dashboard data including recent activity
                    await Promise.all([
                        loadPortfolioOverview(),
                        loadRecentActivity(),
                        loadCharts()
                    ]);
                    console.log('✅ Dashboard data refreshed after sell transaction');
                } catch (refreshError) {
                    console.error('Error refreshing dashboard after sell:', refreshError);
                    // Try refreshing recent activity specifically
                    await loadRecentActivity();
                }
            }, 500); // 500ms delay to ensure database consistency
            
        } else {
            toastr.error(result.error || 'Transaction failed');
        }
    } catch (error) {
        console.error('Error executing sell order:', error);
        toastr.error('Network error occurred');
    } finally {
        showLoading(false);
    }
}

// Print report functionality
function printReport() {
    // Create a new window with the portfolio report
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
        <head>
            <title>Portfolio Report - ${new Date().toLocaleDateString()}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Nivesh Portfolio Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <div class="section">
                <h2>Portfolio Overview</h2>
                <div class="metric">
                    <strong>Total Value:</strong><br>
                    ${document.getElementById('totalValue').textContent}
                </div>
                <div class="metric">
                    <strong>Cash Holdings:</strong><br>
                    ${document.getElementById('cashHoldings').textContent}
                </div>
                <div class="metric">
                    <strong>Day's Gain/Loss:</strong><br>
                    ${document.getElementById('dayGainLoss').textContent}
                </div>
                <div class="metric">
                    <strong>Total Gain/Loss:</strong><br>
                    ${document.getElementById('totalGainLoss').textContent}
                </div>
            </div>
            
            <div class="section">
                <h2>Market Overview</h2>
                <p><strong>NIFTY 50:</strong> 19,850.25 (+125.50)</p>
                <p><strong>SENSEX:</strong> 66,750.45 (+450.75)</p>
                <p><strong>BANK NIFTY:</strong> 44,125.80 (-123.46)</p>
            </div>
            
            <div class="section">
                <h2>Disclaimer</h2>
                <p>This report is generated for informational purposes only. Past performance is not indicative of future results.</p>
            </div>
        </body>
        </html>
    `);
    reportWindow.document.close();
    reportWindow.print();
}

// Add to watchlist functionality
function addToWatchlist() {
    const ticker = prompt('Enter stock ticker to add to watchlist:');
    if (ticker) {
        addTickerToWatchlist(ticker.trim().toUpperCase());
    }
    closeNewInvestmentModal();
}

async function addTickerToWatchlist(ticker) {
    try {
        const response = await fetch(`/api/assets/watchlist/${ticker}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            toastr.success(`${ticker} added to watchlist`);
        } else {
            toastr.error(result.error || 'Failed to add to watchlist');
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        toastr.error('Network error occurred');
    }
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


// Auto-refresh data every 5 minutes
setInterval(() => {
    loadDashboardData();
    updateLastUpdated();
}, 5 * 60 * 1000);

// Format Indian currency
function formatIndianCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format currency without symbol (for display in modals)
function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
