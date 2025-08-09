require('dotenv').config({ path: '../../src/backend/config/config.env' });
const { promisePool } = require('../../src/backend/database/database');

async function checkHoldings() {
    try {
        console.log('Checking holdings table...');
        
        // Check holdings count
        const [holdingsCount] = await promisePool.execute('SELECT COUNT(*) as count FROM holdings');
        console.log('Total holdings records:', holdingsCount[0].count);
        
        // Check holdings with quantity > 0
        const [activeHoldings] = await promisePool.execute('SELECT COUNT(*) as count FROM holdings WHERE quantity > 0');
        console.log('Active holdings (quantity > 0):', activeHoldings[0].count);
        
        // Get sample holdings
        const [sampleHoldings] = await promisePool.execute(`
            SELECT h.*, a.ticker, a.asset_name 
            FROM holdings h 
            JOIN assets a ON h.asset_id = a.asset_id 
            WHERE h.quantity > 0 
            ORDER BY h.holding_id 
            LIMIT 5
        `);
        console.log('Sample holdings:', sampleHoldings);
        
        // Test the full holdings query from the API
        const [fullHoldings] = await promisePool.execute(`
            SELECT 
                a.ticker,
                a.asset_name,
                a.asset_type,
                a.sector,
                SUM(h.quantity) as quantity,
                SUM(h.quantity * h.avg_buy_price) / SUM(h.quantity) as avg_buy_price,
                COALESCE(ap.price, 0) as current_price,
                SUM(h.quantity) * COALESCE(ap.price, 0) as market_value,
                (COALESCE(ap.price, 0) - (SUM(h.quantity * h.avg_buy_price) / SUM(h.quantity))) as price_change,
                CASE 
                    WHEN SUM(h.quantity * h.avg_buy_price) > 0 THEN
                        ((COALESCE(ap.price, 0) - (SUM(h.quantity * h.avg_buy_price) / SUM(h.quantity))) / (SUM(h.quantity * h.avg_buy_price) / SUM(h.quantity))) * 100
                    ELSE 0
                END as return_percentage,
                COALESCE((ap.price - ap.open_price), 0) as day_change
            FROM holdings h
            JOIN assets a ON h.asset_id = a.asset_id
            LEFT JOIN asset_prices ap ON a.asset_id = ap.asset_id 
                AND ap.price_date = (SELECT MAX(price_date) FROM asset_prices WHERE asset_id = a.asset_id)
            WHERE h.quantity > 0
            GROUP BY a.asset_id, a.ticker, a.asset_name, a.asset_type, a.sector, ap.price, ap.open_price
            HAVING SUM(h.quantity) > 0
            ORDER BY market_value DESC
        `);
        
        console.log('Full holdings API result:', fullHoldings.length, 'records');
        if (fullHoldings.length > 0) {
            console.log('First holding:', fullHoldings[0]);
        }
        
    } catch (error) {
        console.error('Error checking holdings:', error.message);
    } finally {
        process.exit(0);
    }
}

checkHoldings();
