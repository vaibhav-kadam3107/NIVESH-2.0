const express = require('express');
const router = express.Router();
const { promisePool } = require('../database/database');

// Buy transaction
router.post('/buy', async (req, res) => {
    const { ticker, quantity, price } = req.body;
    
    // Get a connection from the pool for transaction
    const connection = await promisePool.getConnection();
    
    try {
        // Start transaction
        await connection.beginTransaction();
        
        // Get asset_id
        const [asset] = await connection.execute(`
            SELECT asset_id FROM assets WHERE ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        const assetId = asset[0].asset_id;
        
        // Always create a new holding entry for each buy transaction
        // This allows for better tracking of different purchase prices and dates
        
        await connection.execute(`
            INSERT INTO holdings (asset_id, quantity, avg_buy_price, created_at)
            VALUES (?, ?, ?, NOW())
        `, [assetId, quantity, price]);
        
        // Calculate total quantities for response
        const [totalHolding] = await connection.execute(`
            SELECT SUM(quantity) as total_quantity, 
                   SUM(quantity * avg_buy_price) / SUM(quantity) as weighted_avg_price
            FROM holdings WHERE asset_id = ?
        `, [assetId]);
        
        const newQuantity = totalHolding[0].total_quantity;
        const newAvgPrice = totalHolding[0].weighted_avg_price;
        
        // Record transaction
        await connection.execute(`
            INSERT INTO transactions (asset_id, transaction_type, quantity, price, transaction_date)
            VALUES (?, 'BUY', ?, ?, NOW())
        `, [assetId, quantity, price]);
        
        // Commit transaction
        await connection.commit();
        connection.release();
        
        res.json({ 
            message: 'Buy transaction completed successfully',
            ticker,
            quantity,
            price,
            totalQuantity: newQuantity,
            avgPrice: newAvgPrice
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error processing buy transaction:', error.message);
        res.status(500).json({ error: 'Failed to process buy transaction' });
    }
});

// Sell transaction
router.post('/sell', async (req, res) => {
    const { ticker, quantity, price } = req.body;
    
    // Get a connection from the pool for transaction
    const connection = await promisePool.getConnection();
    
    try {
        // Start transaction
        await connection.beginTransaction();
        
        // Get asset_id
        const [asset] = await connection.execute(`
            SELECT asset_id FROM assets WHERE ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        const assetId = asset[0].asset_id;
        
        // Check current holdings - sum all holdings for this asset
        const [holding] = await connection.execute(`
            SELECT SUM(quantity) as total_quantity, AVG(avg_buy_price) as avg_buy_price FROM holdings WHERE asset_id = ?
        `, [assetId]);
        
        const totalQuantity = holding[0]?.total_quantity || 0;
        
        if (totalQuantity === 0 || totalQuantity < quantity) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Insufficient holdings' });
        }
        
        // For simplicity, remove from the first available holding
        const [holdings] = await connection.execute(`
            SELECT holding_id, quantity FROM holdings WHERE asset_id = ? ORDER BY created_at ASC
        `, [assetId]);
        
        let remainingToSell = quantity;
        
        for (const holding of holdings) {
            if (remainingToSell <= 0) break;
            
            const holdingQuantity = holding.quantity;
            const sellFromThis = Math.min(remainingToSell, holdingQuantity);
            const newHoldingQuantity = holdingQuantity - sellFromThis;
            
            if (newHoldingQuantity === 0) {
                // Remove this holding completely
                await connection.execute(`
                    DELETE FROM holdings WHERE holding_id = ?
                `, [holding.holding_id]);
            } else {
                // Update this holding
                await connection.execute(`
                    UPDATE holdings 
                    SET quantity = ?, updated_at = NOW()
                    WHERE holding_id = ?
                `, [newHoldingQuantity, holding.holding_id]);
            }
            
            remainingToSell -= sellFromThis;
        }
        
        // Record transaction
        await connection.execute(`
            INSERT INTO transactions (asset_id, transaction_type, quantity, price, transaction_date)
            VALUES (?, 'SELL', ?, ?, NOW())
        `, [assetId, quantity, price]);
        
        // Commit transaction
        await connection.commit();
        connection.release();
        
        res.json({ 
            message: 'Sell transaction completed successfully',
            ticker,
            quantity,
            price,
            remainingQuantity: totalQuantity - quantity
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error processing sell transaction:', error.message);
        res.status(500).json({ error: 'Failed to process sell transaction' });
    }
});

// Dividend transaction
router.post('/dividend', async (req, res) => {
    const { ticker, amount } = req.body;
    
    try {
        // Get asset_id
        const [asset] = await promisePool.execute(`
            SELECT asset_id FROM assets WHERE ticker = ?
        `, [ticker]);
        
        if (asset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        const assetId = asset[0].asset_id;
        
        // Check if user has holdings
        const [holding] = await promisePool.execute(`
            SELECT quantity FROM holdings WHERE asset_id = ?
        `, [assetId]);
        
        if (holding.length === 0) {
            return res.status(400).json({ error: 'No holdings for this asset' });
        }
        
        // Record dividend transaction
        await promisePool.execute(`
            INSERT INTO transactions (asset_id, transaction_type, quantity, price, transaction_date)
            VALUES (?, 'DIVIDEND', 0, ?, NOW())
        `, [assetId, amount]);
        
        res.json({ 
            message: 'Dividend transaction recorded successfully',
            ticker,
            amount
        });
    } catch (error) {
        console.error('Error processing dividend transaction:', error.message);
        res.status(500).json({ error: 'Failed to process dividend transaction' });
    }
});

// Get transaction history for an asset
router.get('/asset/:ticker', async (req, res) => {
    const { ticker } = req.params;
    
    try {
        const [transactions] = await promisePool.execute(`
            SELECT 
                t.transaction_id,
                t.transaction_type,
                t.quantity,
                t.price,
                t.transaction_date,
                a.ticker,
                a.asset_name
            FROM transactions t
            JOIN assets a ON t.asset_id = a.asset_id
            WHERE a.ticker = ?
            ORDER BY t.transaction_date DESC
            LIMIT 50
        `, [ticker]);
        
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transaction history:', error.message);
        res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
});

// Get all recent transactions
router.get('/', async (req, res) => {
    try {
        const [transactions] = await promisePool.execute(`
            SELECT 
                t.transaction_id,
                t.transaction_type,
                t.quantity,
                t.price,
                t.transaction_date,
                a.ticker,
                a.asset_name,
                a.asset_type
            FROM transactions t
            JOIN assets a ON t.asset_id = a.asset_id
            ORDER BY t.transaction_date DESC
            LIMIT 20
        `);
        
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching recent transactions:', error.message);
        res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }
});

module.exports = router; 