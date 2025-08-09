# Portfolio Manager - HSBC Hackathon 2024 🚀

A comprehensive full-stack portfolio management application with **enhanced trading features**, real-time data updates, and an intuitive dashboard for tracking investments, executing trades, and visualizing portfolio performance.

## 🎆 Enhanced Features

### 📊 Interactive Dashboard
- **Real-time Portfolio Overview** with live value updates
- **Smart Buy/Sell Modals** with dropdown stock selection from database
- **Auto-price Fetching** - Current market price auto-populates when stock is selected
- **Live Transaction History** that updates automatically after trades
- **Performance Charts** with Chart.js interactive visualizations
- **Asset Allocation** pie charts showing portfolio distribution
- **Market Overview** with key indices (NIFTY 50, SENSEX, BANK NIFTY)

### 💰 Smart Trading Features
- **Quick Buy/Sell Buttons** with full database integration
- **Stock Dropdown Selection** - Choose from all available stocks in database
- **Intelligent Price Population** - Market price automatically fills when stock selected
- **Holdings Validation** - For sell orders, displays available quantity with average buy price
- **Real-time Total Calculation** - Automatically calculates total amount as you type
- **Transaction Confirmation** - Professional loading states and success notifications
- **Instant Portfolio Refresh** - Dashboard updates immediately after successful transactions

### 📈 Advanced Portfolio Management
- **Holdings Tracking** with real-time values and P&L calculations
- **Complete Transaction History** with detailed audit trail
- **Performance Metrics** with comprehensive gain/loss analysis
- **Asset Information Display** - Shows company name, sector, current price, and daily changes
- **Holdings Verification** - Shows available quantities for sell transactions

### 🎯 Additional Premium Features
- **Print Report Functionality** - Generate and print professional portfolio reports
- **New Investment Modal** - Multiple investment options in one place
- **Watchlist Management** - Add/remove stocks for monitoring without buying
- **Auto-refresh Data** - Portfolio data refreshes automatically every 5 minutes
- **Toast Notifications** - User-friendly success/error feedback for all actions
- **Loading States** - Professional loading overlays during API transactions
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices

## 🚀 How to Use Enhanced Trading Features

### Quick Buy Process
1. Click **"Quick Buy"** button on dashboard
2. Select stock from dropdown (populated from database)
3. Stock price automatically appears from current market data
4. Enter desired quantity
5. Total amount calculates instantly
6. Click **"Buy Stock"** to execute
7. Loading indicator shows transaction processing
8. Success notification confirms purchase
9. Dashboard refreshes with updated portfolio
10. Transaction appears in recent activity

### Quick Sell Process
1. Click **"Quick Sell"** button on dashboard
2. Select stock from dropdown
3. Current price auto-populates
4. System shows your available holdings (quantity + avg buy price)
5. Enter quantity to sell (validated against holdings)
6. Total sale amount calculates automatically
7. Click **"Sell Stock"** to execute
8. Transaction processes with loading feedback
9. Success notification confirms sale
10. Portfolio and holdings update immediately

## Original Features

- **Portfolio Overview**: Real-time dashboard showing total value, gains/losses, and holdings count
- **Asset Management**: Add, update, and track asset prices and company information
- **Trading**: Execute buy and sell transactions with automatic portfolio updates
- **Transaction History**: Complete audit trail of all buy/sell activities including dividends
- **Analytics**: Performance charts and portfolio allocation visualization
- **Watchlist**: Track assets without owning them
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Charts**: Chart.js
- **Icons**: Feather Icons

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HSBC5.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a MySQL database named `fpdb`
   - Run the schema file to create tables and sample data:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Configure environment variables**
   - Update the database credentials in `config.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=vaibhav
   DB_NAME=fpdb
   PORT=3000
   ```

5. **Start the application**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## Database Schema

The application uses six main tables:

### 1. Assets Table
- `asset_id`: Primary key
- `ticker`: Asset ticker symbol (unique)
- `asset_name`: Asset/company name
- `asset_type`: Type (STOCK, ETF, etc.)
- `sector`: Industry sector
- `currency`: Currency code (default USD)

### 2. Asset Prices Table
- `price_id`: Primary key
- `asset_id`: Foreign key to assets table
- `price_date`: Date of the price
- `price`: Current price
- `open_price`, `close_price`, `high_price`, `low_price`: OHLC data
- `volume`: Trading volume

### 3. Holdings Table
- `holding_id`: Primary key
- `asset_id`: Foreign key to assets table
- `quantity`: Number of shares owned
- `avg_buy_price`: Average purchase price

### 4. Transactions Table
- `transaction_id`: Primary key
- `asset_id`: Foreign key to assets table
- `transaction_type`: BUY, SELL, or DIVIDEND
- `quantity`: Number of shares
- `price`: Transaction price per share
- `transaction_date`: Date of transaction

### 5. Portfolio Performance Table
- `perf_id`: Primary key
- `annualized_return`: Annualized return percentage
- `sharpe_ratio`: Risk-adjusted return metric
- `max_drawdown`: Maximum portfolio drawdown
- `volatility`: Portfolio volatility
- `total_return`: Total return percentage
- `as_of_date`: Date of calculation

### 6. Watchlist Table
- `watchlist_id`: Primary key
- `asset_id`: Foreign key to assets table
- `added_at`: When asset was added to watchlist

## API Endpoints

### Portfolio
- `GET /api/portfolio/overview` - Get portfolio summary
- `GET /api/portfolio/performance` - Get performance data
- `GET /api/portfolio/allocation` - Get sector allocation
- `GET /api/portfolio/recent-transactions` - Get recent transactions
- `GET /api/portfolio/analytics` - Get portfolio analytics

### Assets
- `GET /api/stocks` - Get all assets with current prices
- `GET /api/stocks/:ticker` - Get specific asset
- `POST /api/stocks` - Add new asset
- `PUT /api/stocks/:ticker/price` - Update asset price
- `GET /api/stocks/search/:query` - Search assets
- `GET /api/stocks/watchlist/all` - Get watchlist
- `POST /api/stocks/watchlist/:ticker` - Add to watchlist
- `DELETE /api/stocks/watchlist/:ticker` - Remove from watchlist

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions/buy` - Execute buy transaction
- `POST /api/transactions/sell` - Execute sell transaction
- `POST /api/transactions/dividend` - Record dividend
- `GET /api/transactions/asset/:ticker` - Get asset transaction history

## Usage

### Portfolio Dashboard
- View total portfolio value, gains/losses, and holdings count
- See current holdings with individual asset performance
- View top performing assets

### Trading
- Use the Trade tab to execute buy/sell transactions
- Enter asset ticker, quantity, and price
- Transactions are automatically recorded and portfolio updated

### Analytics
- Performance chart showing portfolio value over time
- Sector allocation pie chart
- Historical transaction data

### Transaction History
- Complete list of all buy/sell/dividend transactions
- Filter by date and transaction type
- Detailed transaction information

### Watchlist
- Track assets without owning them
- Monitor price movements
- Quick access to asset information

## Sample Data

The application comes with sample data including:
- 13 popular assets (AAPL, GOOGL, MSFT, ETFs, etc.)
- Sample holdings and transactions
- Realistic price data for demonstration
- Portfolio performance metrics

## Development

### Project Structure
```
HSBC5.0/
├── server.js              # Main server file
├── database.js            # Database configuration
├── config.env             # Environment variables
├── package.json           # Dependencies and scripts
├── database/
│   └── schema.sql         # Database schema and sample data
├── routes/
│   ├── portfolio.js       # Portfolio-related routes
│   ├── stocks.js          # Asset management routes
│   └── transactions.js    # Transaction routes
└── public/
    ├── index.html         # Main HTML file
    └── js/
        └── app.js         # Frontend JavaScript
```

### Adding New Features
1. Create new route files in the `routes/` directory
2. Add corresponding frontend functionality in `public/js/app.js`
3. Update the main `server.js` to include new routes
4. Test thoroughly before deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository. 