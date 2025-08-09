// Global variables
let performanceChart = null;
let allocationChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    loadPortfolioData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Buy form submission
    document.getElementById('buyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        executeBuyTransaction();
    });

    // Sell form submission
    document.getElementById('sellForm').addEventListener('submit', function(e) {
        e.preventDefault();
        executeSellTransaction();
    });
}

// Load portfolio data
async function loadPortfolioData() {
    try {
        await Promise.all([
            loadPortfolioOverview(),
            loadHoldings(),
            loadTransactions(),
            loadPerformanceChart(),
            loadAllocationChart()
        ]);
    } catch (error) {
        console.error('Error loading portfolio data:', error);
        toastr.error('Error loading data');
    }
}

// Load portfolio overview
async function loadPortfolioOverview() {
    try {
        const response = await fetch('/api/portfolio/overview');
        const data = await response.json();
        
        if (data.success) {
            updateOverviewCards(data.data);
        }
    } catch (error) {
        console.error('Error loading portfolio overview:', error);
    }
}

// Update overview cards
function updateOverviewCards(data) {
    document.getElementById('totalValue').textContent = formatCurrency(data.totalValue);
    document.getElementById('totalInvested').textContent = formatCurrency(data.totalInvested);
    document.getElementById('holdingsCount').textContent = data.holdingsCount;
    
    const gainLossElement = document.getElementById('totalGainLoss');
    const gainLoss = data.totalGainLoss;
    gainLossElement.textContent = formatCurrency(gainLoss);
    gainLossElement.className = gainLoss >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600';
}

// Load holdings
async function loadHoldings() {
    try {
        const response = await fetch('/api/stocks');
        const data = await response.json();
        
        if (data.success) {
            displayHoldings(data.data);
        }
    } catch (error) {
        console.error('Error loading holdings:', error);
    }
}

// Display holdings in table
function displayHoldings(assets) {
    const tableBody = document.getElementById('holdingsTable');
    tableBody.innerHTML = '';
    
    assets.forEach(asset => {
        if (asset.quantity > 0) {
            const row = document.createElement('tr');
            const gainLoss = (asset.current_price - asset.avg_buy_price) * asset.quantity;
            const gainLossPercent = ((asset.current_price - asset.avg_buy_price) / asset.avg_buy_price) * 100;
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">${asset.ticker}</div>
                        <div class="text-sm text-gray-500 ml-2">${asset.asset_name}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(asset.avg_buy_price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(asset.current_price)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(gainLoss)} (${gainLossPercent.toFixed(2)}%)
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
}

// Load transactions
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        
        if (data.success) {
            displayTransactions(data.data);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Display transactions in table
function displayTransactions(transactions) {
    const tableBody = document.getElementById('transactionsTable');
    tableBody.innerHTML = '';
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        const date = new Date(transaction.transaction_date).toLocaleDateString();
        const amount = transaction.quantity * transaction.price;
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${transaction.ticker}</div>
                <div class="text-sm text-gray-500">${transaction.asset_name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.transaction_type === 'BUY' ? 'bg-green-100 text-green-800' : 
                    transaction.transaction_type === 'SELL' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }">
                    ${transaction.transaction_type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(transaction.price)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(amount)}</td>
        `;
        tableBody.appendChild(row);
    });
}


// Load performance chart
async function loadPerformanceChart() {
    try {
        const response = await fetch('/api/portfolio/performance?period=30');
        const data = await response.json();
        
        if (data.success) {
            createPerformanceChart(data.data);
        }
    } catch (error) {
        console.error('Error loading performance data:', error);
    }
}

// Create performance chart
function createPerformanceChart(data) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    const labels = data.map(item => new Date(item.date).toLocaleDateString());
    const values = data.map(item => item.daily_change);
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: values,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Load allocation chart
async function loadAllocationChart() {
    try {
        const response = await fetch('/api/portfolio/allocation');
        const data = await response.json();
        
        if (data.success) {
            createAllocationChart(data.data);
        }
    } catch (error) {
        console.error('Error loading allocation data:', error);
    }
}

// Create allocation chart
function createAllocationChart(data) {
    const ctx = document.getElementById('allocationChart').getContext('2d');
    
    if (allocationChart) {
        allocationChart.destroy();
    }
    
    const labels = data.map(item => item.sector);
    const values = data.map(item => item.value);
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
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Execute buy transaction
async function executeBuyTransaction() {
    const ticker = document.getElementById('buySymbol').value.toUpperCase();
    const quantity = parseInt(document.getElementById('buyQuantity').value);
    const price = parseFloat(document.getElementById('buyPrice').value);
    
    if (!ticker || !quantity || !price) {
        toastr.error('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/transactions/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticker,
                quantity,
                price
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            toastr.success('Buy transaction executed successfully!');
            document.getElementById('buyForm').reset();
            loadPortfolioData();
        } else {
            toastr.error(data.message || 'Error executing transaction');
        }
    } catch (error) {
        console.error('Error executing buy transaction:', error);
        toastr.error('Error executing transaction');
    }
}

// Execute sell transaction
async function executeSellTransaction() {
    const ticker = document.getElementById('sellSymbol').value.toUpperCase();
    const quantity = parseInt(document.getElementById('sellQuantity').value);
    const price = parseFloat(document.getElementById('sellPrice').value);
    
    if (!ticker || !quantity || !price) {
        toastr.error('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/transactions/sell', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticker,
                quantity,
                price
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            toastr.success('Sell transaction executed successfully!');
            document.getElementById('sellForm').reset();
            loadPortfolioData();
        } else {
            toastr.error(data.message || 'Error executing transaction');
        }
    } catch (error) {
        console.error('Error executing sell transaction:', error);
        toastr.error('Error executing transaction');
    }
}

// Show tab content
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.add('hidden'));
    
    // Remove active state from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('border-blue-500', 'text-blue-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab content
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Add active state to selected tab button
    document.getElementById(`tab-${tabName}`).classList.remove('border-transparent', 'text-gray-500');
    document.getElementById(`tab-${tabName}`).classList.add('border-blue-500', 'text-blue-600');
    
}

// Refresh data
function refreshData() {
    loadPortfolioData();
    toastr.success('Data refreshed!');
}


// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
} 