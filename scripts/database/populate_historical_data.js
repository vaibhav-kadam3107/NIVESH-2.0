const { promisePool } = require('../../src/backend/database/database');

async function populateHistoricalData() {
    try {
        console.log('🔄 Starting to populate historical price data...');

        // Get all assets
        const [assets] = await promisePool.execute('SELECT asset_id, ticker FROM assets');
        console.log(`📊 Found ${assets.length} assets to populate`);

        // Base prices for different stocks
        const basePrices = {
            'AAPL': 150.00,
            'GOOGL': 2800.00,
            'MSFT': 300.00,
            'AMZN': 3300.00,
            'TSLA': 800.00,
            'JPM': 150.00,
            'JNJ': 170.00,
            'V': 250.00,
            'WMT': 140.00,
            'PG': 145.00,
            'SPY': 450.00,
            'QQQ': 380.00,
            'VTI': 220.00
        };

        // Generate data for the last 365 days
        const days = 365;
        const today = new Date();

        for (const asset of assets) {
            const basePrice = basePrices[asset.ticker] || 100.00;
            let currentPrice = basePrice * 0.8; // Start 20% lower than current for growth trend

            console.log(`📈 Generating data for ${asset.ticker}...`);

            for (let i = days; i >= 1; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                // Skip weekends (basic market simulation)
                if (date.getDay() === 0 || date.getDay() === 6) {
                    continue;
                }

                // Generate realistic price movement with slight upward trend
                const trendFactor = 0.0002; // Small daily upward trend
                const randomFactor = (Math.random() - 0.5) * 0.04; // ±2% daily volatility
                const dailyChange = trendFactor + randomFactor;
                
                currentPrice = currentPrice * (1 + dailyChange);

                // Generate OHLC data
                const openPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
                const closePrice = currentPrice;
                const highPrice = Math.max(openPrice, closePrice) * (1 + Math.random() * 0.02);
                const lowPrice = Math.min(openPrice, closePrice) * (1 - Math.random() * 0.02);
                const volume = Math.floor(Math.random() * 10000000) + 1000000;

                // Insert price data
                await promisePool.execute(`
                    INSERT INTO asset_prices (asset_id, price_date, price, open_price, close_price, high_price, low_price, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        price = VALUES(price),
                        open_price = VALUES(open_price),
                        close_price = VALUES(close_price),
                        high_price = VALUES(high_price),
                        low_price = VALUES(low_price),
                        volume = VALUES(volume)
                `, [
                    asset.asset_id,
                    date.toISOString().split('T')[0],
                    parseFloat(currentPrice.toFixed(2)),
                    parseFloat(openPrice.toFixed(2)),
                    parseFloat(closePrice.toFixed(2)),
                    parseFloat(highPrice.toFixed(2)),
                    parseFloat(lowPrice.toFixed(2)),
                    volume
                ]);
            }
        }

        console.log('✅ Historical data population completed successfully!');

        // Verify the data
        const [countResult] = await promisePool.execute('SELECT COUNT(*) as total FROM asset_prices');
        console.log(`📊 Total price records in database: ${countResult[0].total}`);

        // Show sample data for AAPL
        const [sampleData] = await promisePool.execute(`
            SELECT price_date, price, open_price, high_price, low_price, volume
            FROM asset_prices ap
            JOIN assets a ON ap.asset_id = a.asset_id
            WHERE a.ticker = 'AAPL'
            ORDER BY price_date DESC
            LIMIT 5
        `);
        
        console.log('\n📈 Sample AAPL data (last 5 days):');
        console.table(sampleData.map(row => ({
            Date: row.price_date.toISOString().split('T')[0],
            Price: `$${row.price}`,
            Open: `$${row.open_price}`,
            High: `$${row.high_price}`,
            Low: `$${row.low_price}`,
            Volume: row.volume.toLocaleString()
        })));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error populating historical data:', error);
        process.exit(1);
    }
}

// Run the script
populateHistoricalData();
