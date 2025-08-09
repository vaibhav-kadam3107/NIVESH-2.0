# NIVES - Financial Portfolio Management System

## Introduction

The Financial Portfolio Management System is a comprehensive web-based application designed to help investors track, manage, and analyze their investment portfolios. Built with Node.js, Express.js, and MySQL, this system provides real-time portfolio tracking, market analysis, transaction management, and performance analytics.

### Key Features
- **Portfolio Dashboard**: Real-time overview of portfolio value, gains/losses, and performance metrics
- **Holdings Management**: Track current positions, average buy prices, and market values
- **Market Analysis**: View market data, stock information, and sector performance
- **Transaction Tracking**: Record buy/sell transactions and dividend payments
- **Performance Analytics**: Portfolio performance metrics including Sharpe ratio, volatility, and drawdown
- **Watchlist Management**: Monitor stocks without owning them

## Project Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://bitbucket.org/vaibhav310720/financialportfoliomanager.git
   cd financialportfoliomanager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database named `fpdb`
   - Update database credentials in `src/backend/config/config.env`
   - Run the database initialization script:
   ```bash
   node scripts/database/init_db.js
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The application will be available at the specified port

## Configuration

### Environment Variables
Create or modify `src/backend/config/config.env`:

```env
# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=fpdb

# Environment
NODE_ENV=development
```

### Database Configuration
- **Host**: MySQL server hostname (default: localhost)
- **User**: MySQL username (default: root)
- **Password**: MySQL password
- **Database**: Database name (default: fpdb)

## Environment Configuration

A sample environment configuration file is provided at:

```
src/backend/config/sample.config.env
```

**Instructions:**
1. **Do not edit the sample file directly.**
2. Copy `sample.config.env` and rename the copy to `config.env` in the same directory.
3. Fill in your actual credentials and configuration values in `config.env`.

**Example:**
```sh
cp src/backend/config/sample.config.env src/backend/config/config.env
```

> **Note:**  
> The `config.env` file is included in `.gitignore` and will not be committed to the repository.  
> Always keep your credentials secure and never share your real `config.env` file.

## Project Flow

### Application Workflow
1. **User Authentication**: Users access the dashboard without authentication (single-user system)
2. **Portfolio Overview**: Dashboard displays total portfolio value, gains/losses, and key metrics
3. **Holdings Management**: Users can view current holdings, add new positions, or sell existing ones
4. **Market Analysis**: Real-time market data and stock information
5. **Transaction Recording**: All buy/sell transactions are logged with timestamps
6. **Performance Tracking**: Automated calculation of portfolio performance metrics

### Data Flow
1. **Frontend**: Reacts to user interactions and displays data
2. **API Layer**: Express.js routes handle HTTP requests
3. **Database Layer**: MySQL stores all portfolio and market data
4. **Business Logic**: Calculates performance metrics and portfolio analytics

## Folder Structure

```
financialportfoliomanager/
├── src/
│   ├── backend/
│   │   ├── config/
│   │   │   └── config.env          # Environment configuration
│   │   ├── database/
│   │   │   ├── database.js         # Database connection
│   │   │   └── schema.sql          # Database schema
│   │   ├── routes/
│   │   │   ├── portfolio.js        # Portfolio management APIs
│   │   │   ├── stocks.js           # Stock/market APIs
│   │   │   ├── transactions.js     # Transaction APIs
│   │   │   └── users.js            # User management APIs
│   │   ├── utils/                  # Utility functions
│   │   └── server.js               # Main server file
│   └── frontend/
│       ├── pages/
│       │   ├── index.html          # Dashboard page
│       │   ├── holdings.html       # Holdings page
│       │   └── markets.html        # Markets page
│       ├── js/
│       │   ├── app.js              # Main application logic
│       │   ├── dashboard.js        # Dashboard functionality
│       │   ├── holdings.js         # Holdings management
│       │   └── markets.js          # Market analysis
│       └── css/                    # Stylesheets
├── scripts/
│   ├── database/                   # Database scripts
│   ├── testing/                    # Testing utilities
│   └── utilities/                  # Utility scripts
├── tests/
│   ├── unit/                       # Unit tests
│   └── setup.js                    # Test configuration
├── docs/                           # Documentation
├── package.json                    # Project configuration
└── README.md                       # This file
```

## File Roles

### Backend Files
- **`server.js`**: Main Express server, middleware setup, route configuration
- **`database.js`**: MySQL connection pool and database utilities
- **`schema.sql`**: Complete database schema with tables and sample data
- **`portfolio.js`**: Portfolio overview, holdings, and performance APIs
- **`stocks.js`**: Stock data, market information, and watchlist APIs
- **`transactions.js`**: Buy/sell transaction recording and management
- **`users.js`**: User management and authentication (if implemented)

### Frontend Files
- **`index.html`**: Main dashboard with portfolio overview
- **`holdings.html`**: Holdings management interface
- **`markets.html`**: Market analysis and stock information
- **`app.js`**: Core application logic and utilities
- **`dashboard.js`**: Dashboard-specific functionality and charts
- **`holdings.js`**: Holdings management and transaction logic
- **`markets.js`**: Market data display and stock analysis

### Configuration Files
- **`package.json`**: Project dependencies and scripts
- **`config.env`**: Environment variables and database configuration
- **`jest.config.js`**: Jest testing framework configuration

## APIs Used

### Portfolio Management APIs

#### GET `/api/portfolio/overview`
- **Purpose**: Get portfolio summary and key metrics
- **Response**: Total value, cash holdings, gains/losses, day performance
- **Database**: Queries holdings and asset_prices tables

#### GET `/api/portfolio/holdings`
- **Purpose**: Get current portfolio holdings with performance data
- **Response**: List of holdings with current prices, gains, and percentages
- **Database**: Joins holdings, assets, and asset_prices tables

#### GET `/api/portfolio/performance`
- **Purpose**: Get portfolio performance metrics over time
- **Response**: Historical performance data with returns and ratios
- **Database**: Queries portfolio_performance table

#### GET `/api/portfolio/allocation`
- **Purpose**: Get portfolio allocation by asset type and sector
- **Response**: Breakdown of portfolio by categories
- **Database**: Aggregates holdings data

### Stock/Market APIs

#### GET `/api/assets`
- **Purpose**: Get all available stocks and assets
- **Response**: List of stocks with basic information
- **Database**: Queries assets table

#### GET `/api/assets/watchlist/all`
- **Purpose**: Get watchlist items
- **Response**: Stocks in user's watchlist
- **Database**: Joins watchlist and assets tables

#### POST `/api/assets/watchlist/add`
- **Purpose**: Add stock to watchlist
- **Request**: Asset ID
- **Database**: Inserts into watchlist table

#### DELETE `/api/assets/watchlist/remove/:assetId`
- **Purpose**: Remove stock from watchlist
- **Database**: Deletes from watchlist table

### Transaction APIs

#### GET `/api/transactions`
- **Purpose**: Get transaction history
- **Response**: List of all buy/sell transactions
- **Database**: Queries transactions table

#### POST `/api/transactions`
- **Purpose**: Record new transaction
- **Request**: Transaction type, asset, quantity, price
- **Database**: Inserts into transactions and updates holdings

#### GET `/api/transactions/recent`
- **Purpose**: Get recent transactions
- **Response**: Latest transactions for dashboard
- **Database**: Queries transactions with limit

## Libraries Used

### Backend Dependencies
- **Express.js (^5.1.0)**: Web application framework for Node.js
- **MySQL2 (^3.14.3)**: MySQL client for Node.js with promise support
- **CORS (^2.8.5)**: Cross-Origin Resource Sharing middleware
- **dotenv (^17.2.1)**: Environment variable management

### Frontend Dependencies
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Feather Icons**: Lightweight, customizable SVG icons
- **Chart.js**: JavaScript charting library for data visualization
- **Toastr.js**: JavaScript library for toast notifications
- **jQuery (3.6.0)**: JavaScript library for DOM manipulation

### Development Dependencies
- **Nodemon (^3.1.10)**: Development server with auto-restart
- **Jest (^30.0.5)**: JavaScript testing framework
- **jsdom (^26.1.0)**: JavaScript implementation of DOM for testing

## Database

### Database Schema

#### Core Tables
1. **`assets`**: Master list of all trackable financial instruments
   - Primary key: `asset_id`
   - Fields: ticker, asset_name, asset_type, sector, currency
   - Indexes: ticker, sector

2. **`asset_prices`**: Daily price data for assets
   - Primary key: `price_id`
   - Foreign key: `asset_id` → assets.asset_id
   - Fields: price_date, price, open_price, close_price, high_price, low_price, volume
   - Unique constraint: (asset_id, price_date)

3. **`holdings`**: Current user portfolio positions
   - Primary key: `holding_id`
   - Foreign key: `asset_id` → assets.asset_id
   - Fields: quantity, avg_buy_price
   - Index: asset_id

4. **`transactions`**: Historical transaction records
   - Primary key: `transaction_id`
   - Foreign key: `asset_id` → assets.asset_id
   - Fields: transaction_type (BUY/SELL/DIVIDEND), quantity, price, transaction_date
   - Indexes: asset_id, transaction_date, transaction_type

5. **`portfolio_performance`**: Computed portfolio analytics
   - Primary key: `perf_id`
   - Fields: total_return, annualized_return, sharpe_ratio, max_drawdown, volatility, as_of_date
   - Unique constraint: as_of_date

6. **`watchlist`**: User's watchlist items
   - Primary key: `watchlist_id`
   - Foreign key: `asset_id` → assets.asset_id
   - Fields: added_at
   - Unique constraint: asset_id

### Data Relationships
- **Assets** → **Asset Prices**: One-to-many (one asset has many price records)
- **Assets** → **Holdings**: One-to-many (one asset can have multiple holdings)
- **Assets** → **Transactions**: One-to-many (one asset can have multiple transactions)
- **Assets** → **Watchlist**: One-to-one (one asset can be in watchlist once)

### Sample Data
The system includes sample data for:
- 13 popular stocks (AAPL, GOOGL, MSFT, etc.)
- Current market prices
- Sample holdings and transactions
- Historical performance data

## Usage

### Starting the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Accessing Different Pages
- **Dashboard**: `http://localhost:3000` or `http://localhost:3000/index.html`
- **Holdings**: `http://localhost:3000/holdings.html`
- **Markets**: `http://localhost:3000/markets.html`

### Key Features Usage

#### Portfolio Dashboard
- View total portfolio value and performance
- Monitor day's gains/losses
- Check cash holdings
- View performance charts

#### Holdings Management
- View current positions with market values
- Add new buy transactions
- Sell existing positions
- Track average buy prices and returns

#### Market Analysis
- Browse available stocks
- View current prices and changes
- Add stocks to watchlist
- Analyze sector performance

#### Transaction Recording
- Record buy transactions with quantity and price
- Record sell transactions
- View transaction history
- Track dividend payments

## Features

### Core Features
- **Real-time Portfolio Tracking**: Live updates of portfolio value and performance
- **Transaction Management**: Complete buy/sell transaction recording
- **Market Data Integration**: Stock prices and market information
- **Performance Analytics**: Sharpe ratio, volatility, and drawdown calculations
- **Watchlist Management**: Monitor stocks without ownership
- **Responsive Design**: Mobile-friendly interface

### Advanced Features
- **Portfolio Allocation**: Sector and asset type breakdown
- **Performance Charts**: Visual representation of portfolio performance
- **Export Functionality**: Download portfolio data
- **Search and Filter**: Find specific stocks or holdings
- **Real-time Updates**: Automatic data refresh

### User Interface
- **Dark Theme**: Modern, eye-friendly interface
- **Responsive Layout**: Works on desktop and mobile devices
- **Interactive Charts**: Chart.js powered visualizations
- **Toast Notifications**: User feedback for actions
- **Loading States**: Smooth user experience

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Browser)     │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                        │                        │
│  • HTML Pages         │  • Express Server      │  • Assets Table
│  • JavaScript         │  • API Routes          │  • Holdings Table
│  • CSS Styling        │  • Business Logic      │  • Transactions Table
│  • Chart.js           │  • Database Layer      │  • Performance Table
└───────────────────────┴────────────────────────┴─────────────────┘
```

### Component Interaction
1. **User Interface**: HTML pages with JavaScript for interactivity
2. **API Layer**: Express.js routes handle HTTP requests
3. **Business Logic**: Calculates portfolio metrics and analytics
4. **Data Layer**: MySQL database stores all financial data
5. **Real-time Updates**: Frontend polls APIs for live data

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- tests/unit/api.test.js
```

### Test Structure
- **Unit Tests**: Located in `tests/unit/`
- **API Tests**: Test API endpoints and responses
- **Database Tests**: Test database operations
- **Frontend Tests**: Test JavaScript functionality

### Testing Framework
- **Jest**: Primary testing framework
- **jsdom**: DOM simulation for frontend tests
- **Coverage**: Code coverage reporting

## Contribution Guidelines

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

### Coding Standards
- **JavaScript**: Use ES6+ features, consistent indentation
- **SQL**: Use prepared statements, proper indexing
- **HTML/CSS**: Semantic HTML, responsive design
- **Documentation**: Comment complex logic, update README

### Pull Request Process
1. Ensure code follows project standards
2. Include tests for new features
3. Update documentation if needed
4. Provide clear description of changes
5. Request review from maintainers

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed

## Acknowledgments

### Libraries and Frameworks
- **Express.js**: Web application framework
- **MySQL2**: Database connectivity
- **Tailwind CSS**: Styling framework
- **Chart.js**: Data visualization
- **Feather Icons**: Icon library

### Development Tools
- **Node.js**: JavaScript runtime
- **Nodemon**: Development server
- **Jest**: Testing framework
- **Git**: Version control

### Inspiration
- Modern portfolio management systems
- Real-time financial data platforms
- User-friendly investment interfaces

---

**Note**: This is a development version of the Financial Portfolio Management System. For production use, additional security measures, user authentication, and data validation should be implemented.
