const fetch = require('node-fetch');

async function testAPI() {
    console.log('Testing API endpoints...\n');
    
    try {
        // Test assets endpoint
        console.log('1. Testing /api/assets...');
        const assetsResponse = await fetch('http://localhost:3000/api/assets');
        const assetsData = await assetsResponse.json();
        console.log('Status:', assetsResponse.status);
        console.log('Data length:', assetsData.length);
        console.log('First asset:', assetsData[0]);
        console.log('');
        
        // Test portfolio overview
        console.log('2. Testing /api/portfolio/overview...');
        const overviewResponse = await fetch('http://localhost:3000/api/portfolio/overview');
        const overviewData = await overviewResponse.json();
        console.log('Status:', overviewResponse.status);
        console.log('Overview data:', overviewData);
        console.log('');
        
        // Test transactions
        console.log('3. Testing /api/transactions...');
        const transactionsResponse = await fetch('http://localhost:3000/api/transactions');
        const transactionsData = await transactionsResponse.json();
        console.log('Status:', transactionsResponse.status);
        console.log('Transactions length:', transactionsData.length);
        console.log('');
        
    } catch (error) {
        console.error('Error testing API:', error.message);
    }
}

testAPI(); 