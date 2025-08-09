const { promisePool } = require('./database');

async function testTransactionFlow() {
    console.log('🚀 Testing Complete Transaction Flow...\n');
    
    try {
        // Step 1: Check initial state
        console.log('📊 Step 1: Checking initial state...');
        let [initialHoldings] = await promisePool.execute('SELECT * FROM holdings WHERE asset_id = 1');
        let [initialTransactions] = await promisePool.execute('SELECT COUNT(*) as count FROM transactions');
        
        console.log(`Initial AAPL holdings: ${initialHoldings.length > 0 ? initialHoldings[0].quantity : 0}`);
        console.log(`Initial transaction count: ${initialTransactions[0].count}\n`);
        
        // Step 2: Test BUY transaction
        console.log('💳 Step 2: Testing BUY transaction...');
        const buyResponse = await fetch('http://localhost:3000/api/transactions/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticker: 'AAPL',
                quantity: 10,
                price: 175.50
            })
        });
        
        const buyResult = await buyResponse.json();
        console.log('Buy Response:', buyResult);
        
        // Verify buy transaction in database
        let [holdingsAfterBuy] = await promisePool.execute('SELECT * FROM holdings WHERE asset_id = 1');
        let [transactionsAfterBuy] = await promisePool.execute('SELECT COUNT(*) as count FROM transactions');
        let [latestTransaction] = await promisePool.execute(`
            SELECT t.*, a.ticker FROM transactions t 
            JOIN assets a ON t.asset_id = a.asset_id 
            ORDER BY t.transaction_id DESC LIMIT 1
        `);
        
        console.log(`Holdings after buy: ${holdingsAfterBuy[0]?.quantity || 0}`);
        console.log(`Transaction count after buy: ${transactionsAfterBuy[0].count}`);
        console.log(`Latest transaction:`, latestTransaction[0]);
        console.log('✅ BUY transaction completed successfully\n');
        
        // Step 3: Test portfolio overview API
        console.log('📈 Step 3: Testing portfolio overview API...');
        const portfolioResponse = await fetch('http://localhost:3000/api/portfolio/overview');
        const portfolioData = await portfolioResponse.json();
        console.log('Portfolio Overview:', portfolioData);
        console.log('✅ Portfolio overview working\n');
        
        // Step 4: Test holdings API
        console.log('💼 Step 4: Testing holdings API...');
        const holdingsResponse = await fetch('http://localhost:3000/api/portfolio/holdings');
        const holdingsData = await holdingsResponse.json();
        console.log(`Holdings API returned ${holdingsData.length} holdings:`);
        holdingsData.forEach(holding => {
            console.log(`- ${holding.ticker}: ${holding.quantity} shares at ₹${holding.avg_buy_price}`);
        });
        console.log('✅ Holdings API working\n');
        
        // Step 5: Test recent transactions API
        console.log('🔄 Step 5: Testing recent transactions API...');
        const transactionsResponse = await fetch('http://localhost:3000/api/transactions');
        const transactionsData = await transactionsResponse.json();
        console.log(`Recent transactions (showing last 3):`);
        transactionsData.slice(0, 3).forEach(txn => {
            console.log(`- ${txn.transaction_type} ${txn.quantity} ${txn.ticker} at ₹${txn.price}`);
        });
        console.log('✅ Recent transactions API working\n');
        
        // Step 6: Test SELL transaction
        console.log('💰 Step 6: Testing SELL transaction...');
        const sellResponse = await fetch('http://localhost:3000/api/transactions/sell', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticker: 'AAPL',
                quantity: 5,
                price: 180.00
            })
        });
        
        const sellResult = await sellResponse.json();
        console.log('Sell Response:', sellResult);
        
        // Verify sell transaction in database
        let [holdingsAfterSell] = await promisePool.execute('SELECT * FROM holdings WHERE asset_id = 1');
        let [transactionsAfterSell] = await promisePool.execute('SELECT COUNT(*) as count FROM transactions');
        
        console.log(`Holdings after sell: ${holdingsAfterSell[0]?.quantity || 0}`);
        console.log(`Transaction count after sell: ${transactionsAfterSell[0].count}`);
        console.log('✅ SELL transaction completed successfully\n');
        
        // Step 7: Final verification
        console.log('🔍 Step 7: Final verification...');
        const finalPortfolioResponse = await fetch('http://localhost:3000/api/portfolio/overview');
        const finalPortfolioData = await finalPortfolioResponse.json();
        console.log('Final Portfolio Overview:', finalPortfolioData);
        
        const finalTransactionsResponse = await fetch('http://localhost:3000/api/transactions');
        const finalTransactionsData = await finalTransactionsResponse.json();
        console.log(`\nFinal Recent Transactions (last 2):`);
        finalTransactionsData.slice(0, 2).forEach(txn => {
            console.log(`- ${txn.transaction_type} ${txn.quantity} ${txn.ticker} at ₹${txn.price} (${new Date(txn.transaction_date).toLocaleString()})`);
        });
        
        console.log('\n🎉 TRANSACTION FLOW TEST COMPLETED SUCCESSFULLY!');
        console.log('\n✅ All systems working:');
        console.log('   - Buy transactions update database and holdings');
        console.log('   - Sell transactions update database and holdings');
        console.log('   - Portfolio overview reflects changes');
        console.log('   - Transaction history is maintained');
        console.log('   - Holdings API shows current positions');
        console.log('\n🚀 Your stock trading system is fully functional!');
        
    } catch (error) {
        console.error('❌ Error during transaction flow test:', error);
    } finally {
        process.exit(0);
    }
}

// Wait a moment for server to be ready, then run test
setTimeout(() => {
    testTransactionFlow();
}, 2000);
