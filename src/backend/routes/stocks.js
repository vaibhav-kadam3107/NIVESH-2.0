const express = require('express');
const router = express.Router();
const { promisePool } = require('../database/database');

// Get all assets
router.get('/', async (req, res) => {
    try {
        console.log('Fetching assets...');
        const [assets] = await promisePool.execute(`
            SELECT 
                a.asset_id,
                a.ticker,
                a.asset_name,
                a.asset_type,
                a.sector,
                ap.price as current_price,
                ap.open_price,
                (ap.price - ap.open_price) as day_change,
                ((ap.price - ap.open_price) / ap.open_price * 100) as day_change_percent,
                ap.volume
            FROM assets a
            LEFT JOIN asset_prices ap ON a.asset_id = ap.asset_id 
                AND ap.price_date = (SELECT MAX(price_date) FROM asset_prices WHERE asset_id = a.asset_id)
            ORDER BY a.ticker
        `);
        
        console.log('Assets found:', assets.length);
        
        // If no assets found, provide sample data
        if (assets.length === 0) {
            console.log('No assets found, providing sample data');
            const sampleAssets = [
                {
                    asset_id: 1,
                    ticker: 'AAPL',
                    asset_name: 'Apple Inc.',
                    asset_type: 'STOCK',
                    sector: 'Technology',
                    current_price: 150.00,
                    open_price: 148.50,
                    day_change: 1.50,
                    day_change_percent: 1.01,
                    volume: 50000000
                },
                {
                    asset_id: 2,
                    ticker: 'GOOGL',
                    asset_name: 'Alphabet Inc.',
                    asset_type: 'STOCK',
                    sector: 'Technology',
                    current_price: 2800.00,
                    open_price: 2780.00,
                    day_change: 20.00,
                    day_change_percent: 0.72,
                    volume: 1500000
                },
                {
                    asset_id: 3,
                    ticker: 'MSFT',
                    asset_name: 'Microsoft Corporation',
                    asset_type: 'STOCK',
                    sector: 'Technology',
                    current_price: 300.00,
                    open_price: 298.00,
                    day_change: 2.00,
                    day_change_percent: 0.67,
                    volume: 25000000
                },
                {
                    asset_id: 4,
                    ticker: 'AMZN',
                    asset_name: 'Amazon.com Inc.',
                    asset_type: 'STOCK',
                    sector: 'Consumer Discretionary',
                    current_price: 3300.00,
                    open_price: 3280.00,
                    day_change: 20.00,
                    day_change_percent: 0.61,
                    volume: 3000000
                },
                {
                    asset_id: 5,
                    ticker: 'TSLA',
                    asset_name: 'Tesla Inc.',
                    asset_type: 'STOCK',
                    sector: 'Automotive',
                    current_price: 800.00,
                    open_price: 795.00,
                    day_change: 5.00,
                    day_change_percent: 0.63,
                    volume: 15000000
                }
            ];
            res.json(sampleAssets);
        } else {
            res.json(assets);
        }
    } catch (error) {
        console.error('Error fetching assets:', error.message);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
});

// Get price history for a specific asset
router.get('/:ticker/price-history', async (req, res) => {
    const { ticker } = req.params;
    const { period = '1M' } = req.query; // 1M, 3M, 6M, 1Y, ALL
    
    try {
        // Get asset_id first
        const [asset] = await promisePool.execute(`
            SELECT asset_id FROM assets WHERE ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        const assetId = asset[0].asset_id;
        
        // Calculate date range based on period
        let dateCondition = '';
        switch(period) {
            case '1M':
                dateCondition = 'AND ap.price_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
                break;
            case '3M':
                dateCondition = 'AND ap.price_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
                break;
            case '6M':
                dateCondition = 'AND ap.price_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
                break;
            case '1Y':
                dateCondition = 'AND ap.price_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
                break;
            case 'ALL':
            default:
                dateCondition = ''; // No date restriction for ALL
                break;
        }
        
        // Get price history
        const [priceHistory] = await promisePool.execute(`
            SELECT 
                ap.price_date,
                ap.price,
                ap.open_price,
                ap.close_price,
                ap.high_price,
                ap.low_price,
                ap.volume
            FROM asset_prices ap
            WHERE ap.asset_id = ? ${dateCondition}
            ORDER BY ap.price_date ASC
        `, [assetId]);
        
        console.log(`📊 Found ${priceHistory.length} price records for ${ticker} (period: ${period})`);
        
        // If no historical data or very few data points, generate sample data for demo
        if (priceHistory.length === 0 || priceHistory.length < 5) {
            console.log(`⚠️ Insufficient historical data found for ${ticker} (${priceHistory.length} records), generating sample data`);
            const sampleData = generateSamplePriceHistory(ticker, period);
            return res.json({
                ticker,
                period,
                data: sampleData,
                stats: calculatePriceStats(sampleData)
            });
        }
        
        console.log(`✅ Using real historical data for ${ticker} (${priceHistory.length} records)`);
        
        // Convert price_date to proper format and ensure numeric values
        const processedData = priceHistory.map(row => ({
            price_date: row.price_date.toISOString().split('T')[0],
            price: parseFloat(row.price),
            open_price: parseFloat(row.open_price),
            close_price: parseFloat(row.close_price || row.price),
            high_price: parseFloat(row.high_price),
            low_price: parseFloat(row.low_price),
            volume: parseInt(row.volume)
        }));
        
        // Calculate statistics using processed data
        const stats = calculatePriceStats(processedData);
        
        res.json({
            ticker,
            period,
            data: processedData,
            stats
        });
    } catch (error) {
        console.error('Error fetching price history:', error.message);
        res.status(500).json({ error: 'Failed to fetch price history' });
    }
});

// Get asset by ticker
router.get('/:ticker', async (req, res) => {
    const { ticker } = req.params;
    
    try {
        // First try to get asset with latest price
        const [asset] = await promisePool.execute(`
            SELECT 
                a.*,
                ap.price as current_price,
                ap.open_price,
                ap.high_price,
                ap.low_price,
                ap.volume,
                (ap.price - ap.open_price) as day_change,
                ((ap.price - ap.open_price) / ap.open_price * 100) as day_change_percent
            FROM assets a
            LEFT JOIN asset_prices ap ON a.asset_id = ap.asset_id 
                AND ap.price_date = (SELECT MAX(price_date) FROM asset_prices WHERE asset_id = a.asset_id)
            WHERE a.ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        // If no price data, provide default values
        const result = asset[0];
        if (!result.current_price) {
            // Provide fallback prices for demo
            const fallbackPrices = {
                'AAPL': 175.50,
                'GOOGL': 2850.00,
                'MSFT': 310.25,
                'AMZN': 3350.75,
                'TSLA': 820.30,
                'RELIANCE': 2450.75,
                'TCS': 3520.50,
                'HDFCBANK': 1650.25,
                'INFY': 1485.75,
                'ITC': 415.50
            };
            
            const currentPrice = fallbackPrices[ticker] || 100.00;
            const openPrice = currentPrice * 0.99; // 1% lower for demo
            
            result.current_price = currentPrice;
            result.open_price = openPrice;
            result.high_price = currentPrice * 1.02;
            result.low_price = currentPrice * 0.98;
            result.day_change = currentPrice - openPrice;
            result.day_change_percent = ((currentPrice - openPrice) / openPrice) * 100;
            result.volume = 1000000;
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching asset:', error.message);
        res.status(500).json({ error: 'Failed to fetch asset details' });
    }
});

// Add new asset
router.post('/', async (req, res) => {
    const { ticker, asset_name, asset_type, sector, currency } = req.body;
    
    try {
        const [result] = await promisePool.execute(`
            INSERT INTO assets (ticker, asset_name, asset_type, sector, currency)
            VALUES (?, ?, ?, ?, ?)
        `, [ticker, asset_name, asset_type, sector, currency]);
        
        res.status(201).json({ 
            message: 'Asset added successfully',
            asset_id: result.insertId 
        });
    } catch (error) {
        console.error('Error adding asset:', error.message);
        res.status(500).json({ error: 'Failed to add asset' });
    }
});

// Update asset price
router.put('/:ticker/price', async (req, res) => {
    const { ticker } = req.params;
    const { price, open_price, high_price, low_price, volume } = req.body;
    
    try {
        // First get the asset_id
        const [asset] = await promisePool.execute(`
            SELECT asset_id FROM assets WHERE ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        // Insert or update price data
        await promisePool.execute(`
            INSERT INTO asset_prices (asset_id, price_date, price, open_price, high_price, low_price, volume)
            VALUES (?, CURDATE(), ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                price = VALUES(price),
                open_price = VALUES(open_price),
                high_price = VALUES(high_price),
                low_price = VALUES(low_price),
                volume = VALUES(volume)
        `, [asset[0].asset_id, price, open_price, high_price, low_price, volume]);
        
        res.json({ message: 'Price updated successfully' });
    } catch (error) {
        console.error('Error updating price:', error.message);
        res.status(500).json({ error: 'Failed to update price' });
    }
});

// Get holdings for a specific asset
router.get('/:ticker/holdings', async (req, res) => {
    const { ticker } = req.params;
    
    try {
        const [holdings] = await promisePool.execute(`
            SELECT 
                h.quantity,
                h.avg_buy_price,
                ap.price as current_price,
                (h.quantity * ap.price) as market_value,
                (ap.price - h.avg_buy_price) as gain_loss,
                ((ap.price - h.avg_buy_price) / h.avg_buy_price * 100) as gain_percentage
            FROM holdings h
            JOIN assets a ON h.asset_id = a.asset_id
            LEFT JOIN asset_prices ap ON h.asset_id = ap.asset_id
                AND ap.price_date = (SELECT MAX(price_date) FROM asset_prices WHERE asset_id = h.asset_id)
            WHERE a.ticker = ?
        `, [ticker]);
        
        if (holdings.length === 0) {
            res.json({ quantity: 0 });
        } else {
            const result = holdings[0];
            // If no current price, use average buy price as fallback
            if (!result.current_price) {
                result.current_price = result.avg_buy_price;
                result.market_value = result.quantity * result.avg_buy_price;
                result.gain_loss = 0;
                result.gain_percentage = 0;
            }
            res.json(result);
        }
    } catch (error) {
        console.error('Error fetching holdings:', error.message);
        res.status(500).json({ error: 'Failed to fetch holdings' });
    }
});

// Search assets
router.get('/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const [assets] = await promisePool.execute(`
            SELECT 
                a.asset_id,
                a.ticker,
                a.asset_name,
                a.asset_type,
                a.sector,
                ap.price as current_price,
                (ap.price - ap.open_price) as day_change,
                ((ap.price - ap.open_price) / ap.open_price * 100) as day_change_percent
            FROM assets a
            JOIN asset_prices ap ON a.asset_id = ap.asset_id
            WHERE (a.ticker LIKE ? OR a.asset_name LIKE ?) AND ap.price_date = CURDATE()
            ORDER BY ap.volume DESC
            LIMIT 20
        `, [`%${query}%`, `%${query}%`]);
        
        res.json(assets);
    } catch (error) {
        console.error('Error searching assets:', error.message);
        res.status(500).json({ error: 'Failed to search assets' });
    }
});

// Get watchlist
router.get('/watchlist/all', async (req, res) => {
    try {
        const [watchlist] = await promisePool.execute(`
            SELECT 
                a.asset_id,
                a.ticker,
                a.asset_name,
                a.asset_type,
                a.sector,
                COALESCE(ap.price, 0) as current_price,
                COALESCE((ap.price - ap.open_price), 0) as day_change,
                COALESCE(((ap.price - ap.open_price) / ap.open_price * 100), 0) as day_change_percent,
                w.added_at
            FROM watchlist w
            JOIN assets a ON w.asset_id = a.asset_id
            LEFT JOIN asset_prices ap ON a.asset_id = ap.asset_id 
                AND ap.price_date = (SELECT MAX(price_date) FROM asset_prices WHERE asset_id = a.asset_id)
            ORDER BY w.added_at DESC
        `);
        
        res.json(watchlist);
    } catch (error) {
        console.error('Error fetching watchlist:', error.message);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

// Add to watchlist
router.post('/watchlist/:ticker', async (req, res) => {
    const { ticker } = req.params;
    
    try {
        // Get asset_id
        const [asset] = await promisePool.execute(`
            SELECT asset_id FROM assets WHERE ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        // Check if already in watchlist
        const [existing] = await promisePool.execute(`
            SELECT watchlist_id FROM watchlist WHERE asset_id = ?
        `, [asset[0].asset_id]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Asset already in watchlist' });
        }
        
        // Add to watchlist
        await promisePool.execute(`
            INSERT INTO watchlist (asset_id, added_at) VALUES (?, NOW())
        `, [asset[0].asset_id]);
        
        res.json({ message: 'Added to watchlist successfully' });
    } catch (error) {
        console.error('Error adding to watchlist:', error.message);
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});

// Remove from watchlist
router.delete('/watchlist/:ticker', async (req, res) => {
    const { ticker } = req.params;
    
    try {
        // Get asset_id
        const [asset] = await promisePool.execute(`
            SELECT asset_id FROM assets WHERE ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        // Remove from watchlist
        const [result] = await promisePool.execute(`
            DELETE FROM watchlist WHERE asset_id = ?
        `, [asset[0].asset_id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Asset not in watchlist' });
        }
        
        res.json({ message: 'Removed from watchlist successfully' });
    } catch (error) {
        console.error('Error removing from watchlist:', error.message);
        res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
});


// Helper function to generate sample price history
function generateSamplePriceHistory(ticker, period) {
    const basePrice = {
        'AAPL': 150,
        'GOOGL': 2800,
        'MSFT': 300,
        'AMZN': 3300,
        'TSLA': 800,
        'JPM': 150,
        'JNJ': 170,
        'V': 250,
        'WMT': 140,
        'PG': 145,
        'SPY': 450,
        'QQQ': 380,
        'VTI': 220,
        'RELIANCE': 2450,
        'TCS': 3520,
        'HDFCBANK': 1650,
        'INFY': 1485,
        'ITC': 415
    }[ticker] || 100;
    
    const days = {
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        'ALL': 730
    }[period] || 30;
    
    console.log(`🎲 Generating ${days + 1} sample data points for ${ticker} (period: ${period})`);
    
    const data = [];
    let currentPrice = basePrice;
    
    // Generate more realistic price movements with trend
    let trend = (Math.random() - 0.5) * 0.1; // Overall trend (-5% to +5%)
    let volatility = 0.02; // Daily volatility
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add trend and random movement
        const dailyChange = trend + (Math.random() - 0.5) * volatility;
        currentPrice = Math.max(currentPrice * (1 + dailyChange), 0.01); // Ensure price doesn't go negative
        
        // Generate OHLC data
        const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
        const close = currentPrice;
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);
        
        data.push({
            price_date: date.toISOString().split('T')[0],
            price: parseFloat(currentPrice.toFixed(2)),
            open_price: parseFloat(open.toFixed(2)),
            close_price: parseFloat(close.toFixed(2)),
            high_price: parseFloat(high.toFixed(2)),
            low_price: parseFloat(low.toFixed(2)),
            volume: Math.floor(Math.random() * 10000000) + 1000000
        });
    }
    
    console.log(`✅ Generated ${data.length} sample data points for ${ticker}`);
    return data;
}

// Helper function to calculate price statistics
function calculatePriceStats(priceData) {
    if (priceData.length === 0) {
        return {
            currentPrice: 0,
            periodHigh: 0,
            periodLow: 0,
            periodReturn: 0,
            periodReturnPercent: 0
        };
    }
    
    const prices = priceData.map(p => p.price || p.close_price || 0);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    
    return {
        currentPrice: lastPrice,
        periodHigh: Math.max(...prices),
        periodLow: Math.min(...prices),
        periodReturn: lastPrice - firstPrice,
        periodReturnPercent: firstPrice !== 0 ? ((lastPrice - firstPrice) / firstPrice * 100) : 0
    };
}

module.exports = router;
