const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../src/backend/config/config.env' });

async function checkDatabase() {
    console.log('Checking database...');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'vaibhav',
            database: process.env.DB_NAME || 'fpdb'
        });
        
        console.log('Connected to database successfully');
        
        // Check assets
        const [assets] = await connection.execute('SELECT COUNT(*) as count FROM assets');
        console.log('Assets count:', assets[0].count);
        
        if (assets[0].count > 0) {
            const [assetList] = await connection.execute('SELECT ticker, asset_name FROM assets LIMIT 5');
            console.log('Sample assets:', assetList);
        }
        
        // Check asset prices
        const [prices] = await connection.execute('SELECT COUNT(*) as count FROM asset_prices');
        console.log('Asset prices count:', prices[0].count);
        
        if (prices[0].count > 0) {
            const [priceList] = await connection.execute('SELECT asset_id, price_date, price FROM asset_prices LIMIT 5');
            console.log('Sample prices:', priceList);
        }
        
        // Check if we have any data for today
        const [todayPrices] = await connection.execute('SELECT COUNT(*) as count FROM asset_prices WHERE price_date = CURDATE()');
        console.log('Prices for today:', todayPrices[0].count);
        
        await connection.end();
        
    } catch (error) {
        console.error('Error checking database:', error);
    }
}

checkDatabase(); 