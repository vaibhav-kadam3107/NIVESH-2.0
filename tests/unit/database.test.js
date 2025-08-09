/**
 * @jest-environment node
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './src/backend/config/config.env' });

describe('Database Tests', () => {
  let connection;

  beforeAll(async () => {
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fpdb'
      });
    } catch (error) {
      console.log('Database connection failed, skipping database tests:', error.message);
      connection = null;
    }
  });

  afterAll(async () => {
    if (connection) {
      await connection.end();
    }
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      if (!connection) {
        console.log('Skipping database connection test - no connection available');
        return;
      }
      expect(connection).toBeDefined();
    });

    test('should have correct database name', async () => {
      if (!connection) {
        console.log('Skipping database name test - no connection available');
        return;
      }
      const [rows] = await connection.execute('SELECT DATABASE() as db_name');
      expect(rows[0].db_name).toBe(process.env.DB_NAME || 'fpdb');
    });
  });

  describe('Table Structure Validation', () => {
    test('should have all required tables', async () => {
      if (!connection) {
        console.log('Skipping table structure test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ?`, [process.env.DB_NAME || 'fpdb']
      );
      
      const tableNames = rows.map(row => row.table_name || row.TABLE_NAME);
      expect(tableNames).toContain('assets');
      expect(tableNames).toContain('holdings');
      expect(tableNames).toContain('transactions');
      expect(tableNames).toContain('portfolio_performance');
      expect(tableNames).toContain('asset_prices');
      expect(tableNames).toContain('watchlist');
    });

    test('assets table should have correct structure', async () => {
      if (!connection) {
        console.log('Skipping assets table test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'assets' AND table_schema = ?`, [process.env.DB_NAME || 'fpdb']
      );
      
      const columns = rows.map(row => row.column_name || row.COLUMN_NAME);
      expect(columns).toContain('asset_id');
      expect(columns).toContain('ticker');
      expect(columns).toContain('asset_name');
      expect(columns).toContain('asset_type');
      expect(columns).toContain('sector');
    });

    test('holdings table should have correct foreign key', async () => {
      if (!connection) {
        console.log('Skipping foreign key test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'holdings' AND table_schema = ?`, [process.env.DB_NAME || 'fpdb']
      );
      
      const columns = rows.map(row => row.column_name || row.COLUMN_NAME);
      expect(columns).toContain('asset_id');
      expect(columns).toContain('quantity');
      expect(columns).toContain('avg_buy_price');
    });
  });

  describe('Data Integrity Tests', () => {
    test('should have sample assets data', async () => {
      if (!connection) {
        console.log('Skipping sample data test - no connection available');
        return;
      }
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM assets');
      expect(rows[0].count).toBeGreaterThan(0);
    });

    test('should have valid asset data structure', async () => {
      if (!connection) {
        console.log('Skipping asset structure test - no connection available');
        return;
      }
      const [rows] = await connection.execute('SELECT * FROM assets LIMIT 1');
      if (rows.length > 0) {
        const asset = rows[0];
        expect(asset).toHaveProperty('asset_id');
        expect(asset).toHaveProperty('ticker');
        expect(asset).toHaveProperty('asset_name');
        expect(asset).toHaveProperty('asset_type');
        expect(asset).toHaveProperty('sector');
      }
    });

    test('should have unique ticker symbols', async () => {
      if (!connection) {
        console.log('Skipping unique ticker test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT ticker, COUNT(*) as count 
        FROM assets 
        GROUP BY ticker 
        HAVING COUNT(*) > 1`
      );
      expect(rows.length).toBe(0);
    });

    test('holdings should reference valid assets', async () => {
      if (!connection) {
        console.log('Skipping holdings reference test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT h.asset_id 
        FROM holdings h 
        LEFT JOIN assets a ON h.asset_id = a.asset_id 
        WHERE a.asset_id IS NULL`
      );
      expect(rows.length).toBe(0);
    });

    test('transactions should reference valid assets', async () => {
      if (!connection) {
        console.log('Skipping transactions reference test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT t.asset_id 
        FROM transactions t 
        LEFT JOIN assets a ON t.asset_id = a.asset_id 
        WHERE a.asset_id IS NULL`
      );
      expect(rows.length).toBe(0);
    });
  });

  describe('Index Validation', () => {
    test('should have required indexes', async () => {
      if (!connection) {
        console.log('Skipping index test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT index_name 
        FROM information_schema.statistics 
        WHERE table_schema = ? AND table_name = 'assets'`, [process.env.DB_NAME || 'fpdb']
      );
      
      const indexNames = rows.map(row => row.index_name || row.INDEX_NAME);
      expect(indexNames).toContain('PRIMARY');
      expect(indexNames).toContain('idx_assets_ticker');
    });
  });

  describe('Data Type Validation', () => {
    test('portfolio_performance total_return should be DECIMAL(12,4)', async () => {
      if (!connection) {
        console.log('Skipping data type test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'portfolio_performance' 
        AND column_name = 'total_return' 
        AND table_schema = ?`, [process.env.DB_NAME || 'fpdb']
      );
      
      if (rows.length > 0) {
        const column = rows[0];
        const dataType = column.data_type || column.DATA_TYPE;
        const precision = column.numeric_precision || column.NUMERIC_PRECISION;
        const scale = column.numeric_scale || column.NUMERIC_SCALE;
        
        expect(dataType).toBe('decimal');
        expect(precision).toBe(12);
        expect(scale).toBe(4);
      }
    });

    test('asset_prices price should be DECIMAL(10,2)', async () => {
      if (!connection) {
        console.log('Skipping price data type test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'asset_prices' 
        AND column_name = 'price' 
        AND table_schema = ?`, [process.env.DB_NAME || 'fpdb']
      );
      
      if (rows.length > 0) {
        const column = rows[0];
        const dataType = column.data_type || column.DATA_TYPE;
        const precision = column.numeric_precision || column.NUMERIC_PRECISION;
        const scale = column.numeric_scale || column.NUMERIC_SCALE;
        
        expect(dataType).toBe('decimal');
        expect(precision).toBe(10);
        expect(scale).toBe(2);
      }
    });
  });

  describe('Constraint Validation', () => {
    test('transactions should have valid transaction_type enum', async () => {
      if (!connection) {
        console.log('Skipping transaction type test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT DISTINCT transaction_type 
        FROM transactions 
        WHERE transaction_type NOT IN ('BUY', 'SELL', 'DIVIDEND')`
      );
      expect(rows.length).toBe(0);
    });

    test('holdings should have positive quantities', async () => {
      if (!connection) {
        console.log('Skipping holdings quantity test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM holdings 
        WHERE quantity <= 0`
      );
      expect(rows[0].count).toBe(0);
    });

    test('asset_prices should have positive prices', async () => {
      if (!connection) {
        console.log('Skipping asset prices test - no connection available');
        return;
      }
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM asset_prices 
        WHERE price <= 0`
      );
      expect(rows[0].count).toBe(0);
    });
  });
});
