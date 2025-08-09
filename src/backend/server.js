const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config/config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Simplified logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    
    console.log(`[${timestamp}] ${method} ${url}`);
    
    // Override res.end to log response status
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - req._startTime;
        console.log(`[${timestamp}] ${method} ${url} - Status: ${res.statusCode} - Time: ${responseTime}ms`);
        originalEnd.call(this, chunk, encoding);
    };
    
    req._startTime = Date.now();
    next();
});

// Database connection
const { pool } = require('./database/database');

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Database connected successfully to fpdb');
    connection.release();
});

// Import routes
const portfolioRoutes = require('./routes/portfolio');
const stockRoutes = require('./routes/stocks');
const transactionRoutes = require('./routes/transactions');

// Use routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/assets', stockRoutes);
app.use('/api/transactions', transactionRoutes);

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Serve index.html (for dashboard link)
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Serve holdings page
app.get('/holdings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/holdings.html'));
});

// Serve markets page
app.get('/markets.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/markets.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 404 - ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Portfolio Manager Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`📈 Markets: http://localhost:${PORT}/markets.html`);
    console.log(`💼 Holdings: http://localhost:${PORT}/holdings.html`);
    console.log(`🔍 API Base: http://localhost:${PORT}/api`);
}); 