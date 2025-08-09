const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../src/backend/config/config.env' });

async function initDatabase() {
    console.log('Initializing database...');
    
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'n3u3da!',
            database: process.env.DB_NAME || 'fpdb'
        });
        
        console.log('Connected to database successfully');
        
        // Read and execute schema
        const fs = require('fs');
        const schema = fs.readFileSync('../../src/backend/database/schema.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (let statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log('Executed statement successfully');
                } catch (error) {
                    console.log('Statement failed (might be duplicate):', error.message);
                }
            }
        }
        
        // Test the data
        console.log('\nTesting data...');
        
        const [assets] = await connection.execute('SELECT COUNT(*) as count FROM assets');
        console.log('Assets count:', assets[0].count);
        
        const [prices] = await connection.execute('SELECT COUNT(*) as count FROM asset_prices');
        console.log('Asset prices count:', prices[0].count);
        
        const [holdings] = await connection.execute('SELECT COUNT(*) as count FROM holdings');
        console.log('Holdings count:', holdings[0].count);
        
        console.log('\nDatabase initialization completed!');
        
        await connection.end();
        
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDatabase(); 