const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../src/backend/config/config.env' });

async function addSampleStocks() {
    console.log('Adding sample stock data...');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'vaibhav',
            database: process.env.DB_NAME || 'fpdb'
        });
        
        console.log('Connected to database successfully');
        
        // Sample stocks data
        const stocks = [
            { ticker: 'AAPL', name: 'Apple Inc.', type: 'STOCK', sector: 'Technology', currency: 'USD' },
            { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'STOCK', sector: 'Technology', currency: 'USD' },
            { ticker: 'MSFT', name: 'Microsoft Corporation', type: 'STOCK', sector: 'Technology', currency: 'USD' },
            { ticker: 'AMZN', name: 'Amazon.com Inc.', type: 'STOCK', sector: 'Consumer Discretionary', currency: 'USD' },
            { ticker: 'TSLA', name: 'Tesla Inc.', type: 'STOCK', sector: 'Automotive', currency: 'USD' },
            { ticker: 'RELIANCE', name: 'Reliance Industries Limited', type: 'STOCK', sector: 'Energy', currency: 'INR' },
            { ticker: 'TCS', name: 'Tata Consultancy Services', type: 'STOCK', sector: 'Technology', currency: 'INR' },
            { ticker: 'HDFCBANK', name: 'HDFC Bank Limited', type: 'STOCK', sector: 'Banking', currency: 'INR' },
            { ticker: 'INFY', name: 'Infosys Limited', type: 'STOCK', sector: 'Technology', currency: 'INR' },
            { ticker: 'ITC', name: 'ITC Limited', type: 'STOCK', sector: 'Consumer Goods', currency: 'INR' }
        ];
        
        // Add stocks
        for (const stock of stocks) {
            try {
                await connection.execute(`
                    INSERT INTO assets (ticker, asset_name, asset_type, sector, currency) 
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    asset_name = VALUES(asset_name),
                    asset_type = VALUES(asset_type),
                    sector = VALUES(sector),
                    currency = VALUES(currency)
                `, [stock.ticker, stock.name, stock.type, stock.sector, stock.currency]);
                console.log(`Added/Updated stock: ${stock.ticker}`);
            } catch (error) {
                console.log(`Error adding ${stock.ticker}:`, error.message);
            }
        }
        
        // Add sample prices for today
        const stockPrices = [
            { ticker: 'AAPL', price: 175.50, open: 174.20, high: 176.80, low: 173.90, volume: 50000000 },
            { ticker: 'GOOGL', price: 2850.00, open: 2840.00, high: 2860.00, low: 2835.00, volume: 1500000 },
            { ticker: 'MSFT', price: 310.25, open: 308.50, high: 312.00, low: 307.75, volume: 25000000 },
            { ticker: 'AMZN', price: 3350.75, open: 3340.00, high: 3365.00, low: 3335.50, volume: 3000000 },
            { ticker: 'TSLA', price: 820.30, open: 815.00, high: 825.50, low: 812.25, volume: 15000000 },
            { ticker: 'RELIANCE', price: 2450.75, open: 2435.50, high: 2465.25, low: 2430.00, volume: 8000000 },
            { ticker: 'TCS', price: 3520.50, open: 3505.75, high: 3535.25, low: 3500.00, volume: 2500000 },
            { ticker: 'HDFCBANK', price: 1650.25, open: 1645.00, high: 1655.75, low: 1640.50, volume: 5000000 },
            { ticker: 'INFY', price: 1485.75, open: 1480.25, high: 1492.50, low: 1478.00, volume: 3500000 },
            { ticker: 'ITC', price: 415.50, open: 412.75, high: 418.25, low: 411.50, volume: 12000000 }
        ];
        
        for (const priceData of stockPrices) {
            try {
                // Get asset_id first
                const [asset] = await connection.execute('SELECT asset_id FROM assets WHERE ticker = ?', [priceData.ticker]);
                
                if (asset.length > 0) {
                    await connection.execute(`
                        INSERT INTO asset_prices (asset_id, price_date, price, open_price, high_price, low_price, volume)
                        VALUES (?, CURDATE(), ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                        price = VALUES(price),
                        open_price = VALUES(open_price),
                        high_price = VALUES(high_price),
                        low_price = VALUES(low_price),
                        volume = VALUES(volume)
                    `, [asset[0].asset_id, priceData.price, priceData.open, priceData.high, priceData.low, priceData.volume]);
                    console.log(`Added/Updated price for: ${priceData.ticker}`);
                }
            } catch (error) {
                console.log(`Error adding price for ${priceData.ticker}:`, error.message);
            }
        }
        
        // Add some sample holdings for demonstration
        const sampleHoldings = [
            { ticker: 'AAPL', quantity: 50, avg_price: 170.00 },
            { ticker: 'RELIANCE', quantity: 100, avg_price: 2400.00 },
            { ticker: 'TCS', quantity: 25, avg_price: 3450.00 },
            { ticker: 'MSFT', quantity: 30, avg_price: 305.00 }
        ];
        
        for (const holding of sampleHoldings) {
            try {
                const [asset] = await connection.execute('SELECT asset_id FROM assets WHERE ticker = ?', [holding.ticker]);
                
                if (asset.length > 0) {
                    await connection.execute(`
                        INSERT INTO holdings (asset_id, quantity, avg_buy_price, created_at)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                        quantity = VALUES(quantity),
                        avg_buy_price = VALUES(avg_buy_price),
                        updated_at = NOW()
                    `, [asset[0].asset_id, holding.quantity, holding.avg_price]);
                    console.log(`Added/Updated holding for: ${holding.ticker}`);
                }
            } catch (error) {
                console.log(`Error adding holding for ${holding.ticker}:`, error.message);
            }
        }
        
        console.log('\nSample data added successfully!');
        await connection.end();
        
    } catch (error) {
        console.error('Error adding sample data:', error);
    }
}

addSampleStocks();
