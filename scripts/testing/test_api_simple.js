const { promisePool } = require('./database');

async function testAPI() {
    console.log('🧪 Testing BUY API directly...\n');
    
    try {
        const response = await fetch('http://localhost:3000/api/transactions/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticker: 'AAPL',
                quantity: 5,
                price: 175.50
            })
        });

        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response:', result);

        if (!response.ok) {
            console.log('\n❌ Error occurred. Let me check database directly...');
            
            // Check if AAPL exists
            const [assets] = await promisePool.execute('SELECT * FROM assets WHERE ticker = ?', ['AAPL']);
            console.log('AAPL asset:', assets[0]);

            // Check current holdings
            const [holdings] = await promisePool.execute('SELECT * FROM holdings WHERE asset_id = 1');
            console.log('Current AAPL holdings:', holdings);

            // Try manual transaction
            console.log('\n🔧 Attempting manual transaction...');
            
            await promisePool.execute('START TRANSACTION');
            
            // Update holdings
            const [existingHolding] = await promisePool.execute('SELECT * FROM holdings WHERE asset_id = 1');
            if (existingHolding.length > 0) {
                const currentQuantity = existingHolding[0].quantity;
                const currentAvgPrice = existingHolding[0].avg_buy_price;
                const newQuantity = currentQuantity + 5;
                const newAvgPrice = ((currentQuantity * currentAvgPrice) + (5 * 175.50)) / newQuantity;
                
                await promisePool.execute(
                    'UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE asset_id = 1',
                    [newQuantity, newAvgPrice]
                );
                console.log(`Updated holdings: ${newQuantity} shares at avg ${newAvgPrice.toFixed(2)}`);
            } else {
                await promisePool.execute(
                    'INSERT INTO holdings (asset_id, quantity, avg_buy_price) VALUES (1, 5, 175.50)'
                );
                console.log('Created new holding: 5 shares at 175.50');
            }
            
            // Record transaction
            await promisePool.execute(
                'INSERT INTO transactions (asset_id, transaction_type, quantity, price) VALUES (1, "BUY", 5, 175.50)'
            );
            console.log('Transaction recorded');
            
            await promisePool.execute('COMMIT');
            console.log('✅ Manual transaction completed successfully');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        try {
            await promisePool.execute('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError.message);
        }
    } finally {
        process.exit(0);
    }
}

setTimeout(testAPI, 1000);
