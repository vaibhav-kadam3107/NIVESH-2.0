-- ==============================
-- Create Database & Tables
-- ==============================

DROP DATABASE IF EXISTS portfolio_db;
CREATE DATABASE portfolio_db;
USE portfolio_db;

-- 1. Assets table
CREATE TABLE assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    asset_name VARCHAR(100) NOT NULL,
    asset_type ENUM('Stock', 'ETF', 'Crypto', 'Bond') NOT NULL,
    sector VARCHAR(50),
    currency VARCHAR(10) NOT NULL
);

-- 2. Asset Prices table
CREATE TABLE asset_prices (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    price_date DATE NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    open_price DECIMAL(15,2),
    close_price DECIMAL(15,2),
    high_price DECIMAL(15,2),
    low_price DECIMAL(15,2),
    volume BIGINT,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);

-- 3. Holdings table
CREATE TABLE holdings (
    holding_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    quantity DECIMAL(18,6) NOT NULL,
    avg_buy_price DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);

-- 4. Transactions table
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    transaction_type ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(18,6) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    transaction_date DATETIME NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);

-- 5. Watchlist table
CREATE TABLE watchlist (
    watch_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);

-- 6. Dividends table
CREATE TABLE dividends (
    dividend_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    dividend_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);

-- 7. Portfolio performance table
CREATE TABLE portfolio_performance (
    perf_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_value DECIMAL(20,2) NOT NULL,
    profit_loss DECIMAL(20,2) NOT NULL
);

-- ==============================
-- Insert Sample Data
-- ==============================

-- Assets
INSERT INTO assets (ticker, asset_name, asset_type, sector, currency) VALUES
('NFLX', 'Netflix Inc.', 'Stock', 'Communication Services', 'USD'),
('META', 'Meta Platforms Inc.', 'Stock', 'Communication Services', 'USD'),
('NVDA', 'NVIDIA Corp.', 'Stock', 'Technology', 'USD'),
('SPY', 'SPDR S&P 500 ETF Trust', 'ETF', 'Index Fund', 'USD'),
('BTC', 'Bitcoin', 'Crypto', 'Cryptocurrency', 'USD'),
('ETH', 'Ethereum', 'Crypto', 'Cryptocurrency', 'USD'),
('US10Y', 'US Treasury Bond 10Y', 'Bond', 'Government', 'USD'),
('AAPL', 'Apple Inc.', 'Stock', 'Technology', 'USD');

-- Asset Prices
INSERT INTO asset_prices (asset_id, price_date, price, open_price, close_price, high_price, low_price, volume) VALUES
((SELECT asset_id FROM assets WHERE ticker = 'NFLX'), CURDATE(), 480, 475, 480, 482, 473, 7000000),
((SELECT asset_id FROM assets WHERE ticker = 'META'), CURDATE(), 320, 318, 320, 322, 317, 12000000),
((SELECT asset_id FROM assets WHERE ticker = 'NVDA'), CURDATE(), 750, 740, 750, 755, 738, 15000000),
((SELECT asset_id FROM assets WHERE ticker = 'SPY'),  CURDATE(), 450, 448, 450, 452, 447, 80000000),
((SELECT asset_id FROM assets WHERE ticker = 'BTC'),  CURDATE(), 62000, 61500, 62000, 62500, 61000, 35000),
((SELECT asset_id FROM assets WHERE ticker = 'ETH'),  CURDATE(), 3200, 3150, 3200, 3250, 3100, 50000),
((SELECT asset_id FROM assets WHERE ticker = 'US10Y'), CURDATE(), 98, 97.8, 98, 98.2, 97.5, 1000000),
((SELECT asset_id FROM assets WHERE ticker = 'AAPL'), CURDATE(), 190, 188, 190, 192, 187, 50000000);

-- Holdings
INSERT INTO holdings (asset_id, quantity, avg_buy_price) VALUES
((SELECT asset_id FROM assets WHERE ticker = 'NFLX'), 12, 470),
((SELECT asset_id FROM assets WHERE ticker = 'META'), 30, 315),
((SELECT asset_id FROM assets WHERE ticker = 'NVDA'), 5, 700),
((SELECT asset_id FROM assets WHERE ticker = 'SPY'), 20, 440),
((SELECT asset_id FROM assets WHERE ticker = 'BTC'), 0.5, 58000),
((SELECT asset_id FROM assets WHERE ticker = 'ETH'), 2, 3000),
((SELECT asset_id FROM assets WHERE ticker = 'US10Y'), 50, 97.5),
((SELECT asset_id FROM assets WHERE ticker = 'AAPL'), 40, 180);

-- Transactions
INSERT INTO transactions (asset_id, transaction_type, quantity, price, transaction_date) VALUES
((SELECT asset_id FROM assets WHERE ticker = 'NFLX'), 'BUY', 12, 470, DATE_SUB(NOW(), INTERVAL 40 DAY)),
((SELECT asset_id FROM assets WHERE ticker = 'META'), 'BUY', 30, 315, DATE_SUB(NOW(), INTERVAL 35 DAY)),
((SELECT asset_id FROM assets WHERE ticker = 'NVDA'), 'BUY', 5, 700, DATE_SUB(NOW(), INTERVAL 32 DAY)),
((SELECT asset_id FROM assets WHERE ticker = 'SPY'), 'BUY', 20, 440, DATE_SUB(NOW(), INTERVAL 28 DAY)),
((SELECT asset_id FROM assets WHERE ticker = 'BTC'), 'BUY', 0.5, 58000, DATE_SUB(NOW(), INTERVAL 25 DAY)),
((SELECT asset_id FROM assets WHERE ticker = 'ETH'), 'BUY', 2, 3000, DATE_SUB(NOW(), INTERVAL 22 DAY)),
((SELECT asset_id FROM assets WHERE ticker = 'US10Y'), 'BUY', 50, 97.5, DATE_SUB(NOW(), INTERVAL 20 DAY)),
((SELECT asset_id FROM assets WHERE ticker = 'AAPL'), 'BUY', 40, 180, DATE_SUB(NOW(), INTERVAL 15 DAY));

-- Watchlist
INSERT INTO watchlist (asset_id) VALUES
((SELECT asset_id FROM assets WHERE ticker = 'NFLX')),
((SELECT asset_id FROM assets WHERE ticker = 'BTC')),
((SELECT asset_id FROM assets WHERE ticker = 'SPY')),
((SELECT asset_id FROM assets WHERE ticker = 'AAPL'));

-- Dividends
INSERT INTO dividends (asset_id, dividend_date, amount) VALUES
((SELECT asset_id FROM assets WHERE ticker = 'AAPL'), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 0.24),
((SELECT asset_id FROM assets WHERE ticker = 'AAPL'), DATE_SUB(CURDATE(), INTERVAL 180 DAY), 0.24),
((SELECT asset_id FROM assets WHERE ticker = 'SPY'), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 1.60),
((SELECT asset_id FROM assets WHERE ticker = 'SPY'), DATE_SUB(CURDATE(), INTERVAL 150 DAY), 1.55);

-- Portfolio Performance
INSERT INTO portfolio_performance (date, total_value, profit_loss) VALUES
(DATE_SUB(CURDATE(), INTERVAL 7 DAY), 150000, 2000),
(DATE_SUB(CURDATE(), INTERVAL 6 DAY), 152000, 4000),
(DATE_SUB(CURDATE(), INTERVAL 5 DAY), 151500, 3500),
(DATE_SUB(CURDATE(), INTERVAL 4 DAY), 153000, 5000),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 154000, 6000),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 155500, 7500),
(CURDATE(), 156000, 8000);
