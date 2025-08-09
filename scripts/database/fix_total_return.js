require('dotenv').config({ path: '../../src/backend/config/config.env' });
const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database successfully');
    
    // Run the ALTER TABLE command
    const alterQuery = "ALTER TABLE portfolio_performance MODIFY COLUMN total_return DECIMAL(12,4)";
    
    connection.query(alterQuery, (err, result) => {
        if (err) {
            console.error('Error modifying table:', err);
        } else {
            console.log('Successfully modified total_return column to DECIMAL(12,4)');
        }
        
        connection.end();
    });
});
