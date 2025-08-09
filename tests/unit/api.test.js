/**
 * @jest-environment jsdom
 */

describe('API Functions', () => {
  
  beforeEach(() => {
    fetch.mockClear();
    toastr.success.mockClear();
    toastr.error.mockClear();
  });

  describe('Portfolio API Functions', () => {
    
    test('loadPortfolioOverview should handle successful API response', async () => {
      // Mock successful API response
      const mockData = {
        totalValue: 1245670,
        cashHoldings: 50000,
        totalGainLoss: 245670,
        dayGainLoss: 12500
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      // Mock loadPortfolioOverview function
      const loadPortfolioOverview = async () => {
        try {
          const response = await fetch('/api/portfolio/overview');
          const data = await response.json();
          
          if (response.ok) {
            return data;
          }
        } catch (error) {
          console.error('Error loading portfolio overview:', error);
          return null;
        }
      };

      const result = await loadPortfolioOverview();
      
      expect(fetch).toHaveBeenCalledWith('/api/portfolio/overview');
      expect(result).toEqual(mockData);
    });

    test('loadPortfolioOverview should handle API error', async () => {
      // Mock API error response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const loadPortfolioOverview = async () => {
        try {
          const response = await fetch('/api/portfolio/overview');
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API Error');
          }
          
          return await response.json();
        } catch (error) {
          console.error('Error loading portfolio overview:', error);
          return null;
        }
      };

      const result = await loadPortfolioOverview();
      
      expect(fetch).toHaveBeenCalledWith('/api/portfolio/overview');
      expect(result).toBeNull();
    });
  });

  describe('Transaction API Functions', () => {
    
    test('executeBuyOrder should handle successful transaction', async () => {
      const mockResponse = {
        success: true,
        message: 'Transaction successful',
        transactionId: 123
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const executeBuyOrder = async (ticker, quantity, price) => {
        try {
          const response = await fetch('/api/transactions/buy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ticker: ticker,
              quantity: quantity,
              price: price
            })
          });

          const result = await response.json();
          
          if (response.ok) {
            toastr.success(`Successfully bought ${quantity} shares of ${ticker}`);
            return result;
          } else {
            toastr.error(result.error || 'Transaction failed');
            return null;
          }
        } catch (error) {
          console.error('Error executing buy order:', error);
          toastr.error('Network error occurred');
          return null;
        }
      };

      const result = await executeBuyOrder('RELIANCE', 10, 2500);
      
      expect(fetch).toHaveBeenCalledWith('/api/transactions/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker: 'RELIANCE',
          quantity: 10,
          price: 2500
        })
      });
      
      expect(toastr.success).toHaveBeenCalledWith('Successfully bought 10 shares of RELIANCE');
      expect(result).toEqual(mockResponse);
    });

    test('executeSellOrder should handle transaction failure', async () => {
      const mockErrorResponse = {
        error: 'Insufficient holdings'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      });

      const executeSellOrder = async (ticker, quantity, price) => {
        try {
          const response = await fetch('/api/transactions/sell', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ticker: ticker,
              quantity: quantity,
              price: price
            })
          });

          const result = await response.json();
          
          if (response.ok) {
            toastr.success(`Successfully sold ${quantity} shares of ${ticker}`);
            return result;
          } else {
            toastr.error(result.error || 'Transaction failed');
            return null;
          }
        } catch (error) {
          console.error('Error executing sell order:', error);
          toastr.error('Network error occurred');
          return null;
        }
      };

      const result = await executeSellOrder('TCS', 5, 3500);
      
      expect(fetch).toHaveBeenCalledWith('/api/transactions/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker: 'TCS',
          quantity: 5,
          price: 3500
        })
      });
      
      expect(toastr.error).toHaveBeenCalledWith('Insufficient holdings');
      expect(result).toBeNull();
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const loadHoldings = async () => {
        try {
          const response = await fetch('/api/portfolio/holdings');
          return await response.json();
        } catch (error) {
          console.error('Network error:', error);
          toastr.error('Network error while loading holdings');
          return null;
        }
      };

      const result = await loadHoldings();
      
      expect(fetch).toHaveBeenCalledWith('/api/portfolio/holdings');
      expect(toastr.error).toHaveBeenCalledWith('Network error while loading holdings');
      expect(result).toBeNull();
    });
  });

  describe('Asset API Functions', () => {
    
    test('loadStockData should handle successful response', async () => {
      const mockStockData = {
        ticker: 'RELIANCE',
        asset_name: 'Reliance Industries Ltd',
        current_price: 2500.00,
        day_change: 25.00,
        day_change_percent: 1.01,
        sector: 'Oil & Gas'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStockData
      });

      const loadStockData = async (ticker) => {
        try {
          const response = await fetch(`/api/assets/${ticker}`);
          
          if (response.ok) {
            return await response.json();
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Error fetching stock data:', error);
          return null;
        }
      };

      const result = await loadStockData('RELIANCE');
      
      expect(fetch).toHaveBeenCalledWith('/api/assets/RELIANCE');
      expect(result).toEqual(mockStockData);
    });

    test('addToWatchlist should handle successful addition', async () => {
      const mockResponse = { success: true, message: 'Added to watchlist' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const addToWatchlist = async (ticker) => {
        try {
          const response = await fetch(`/api/assets/watchlist/${ticker}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();

          if (response.ok) {
            toastr.success(`Added ${ticker} to watchlist`);
            return data;
          } else {
            toastr.error(data.error || 'Failed to add to watchlist');
            return null;
          }
        } catch (error) {
          console.error('Error adding to watchlist:', error);
          toastr.error('Error adding to watchlist');
          return null;
        }
      };

      const result = await addToWatchlist('TCS');
      
      expect(fetch).toHaveBeenCalledWith('/api/assets/watchlist/TCS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(toastr.success).toHaveBeenCalledWith('Added TCS to watchlist');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Data Validation', () => {
    
    test('should validate transaction input data', () => {
      const validateTransactionInput = (ticker, quantity, price) => {
        const errors = [];
        
        if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
          errors.push('Ticker is required');
        }
        
        if (!quantity || isNaN(quantity) || quantity <= 0) {
          errors.push('Quantity must be a positive number');
        }
        
        if (!price || isNaN(price) || price <= 0) {
          errors.push('Price must be a positive number');
        }
        
        return {
          isValid: errors.length === 0,
          errors: errors
        };
      };

      // Test valid input
      const validResult = validateTransactionInput('RELIANCE', 10, 2500.50);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test invalid ticker
      const invalidTicker = validateTransactionInput('', 10, 2500);
      expect(invalidTicker.isValid).toBe(false);
      expect(invalidTicker.errors).toContain('Ticker is required');

      // Test invalid quantity
      const invalidQuantity = validateTransactionInput('TCS', -5, 3500);
      expect(invalidQuantity.isValid).toBe(false);
      expect(invalidQuantity.errors).toContain('Quantity must be a positive number');

      // Test invalid price
      const invalidPrice = validateTransactionInput('INFY', 8, 0);
      expect(invalidPrice.isValid).toBe(false);
      expect(invalidPrice.errors).toContain('Price must be a positive number');

      // Test multiple invalid inputs
      const multipleInvalid = validateTransactionInput('', -1, -100);
      expect(multipleInvalid.isValid).toBe(false);
      expect(multipleInvalid.errors).toHaveLength(3);
    });

    test('should validate portfolio data structure', () => {
      const validatePortfolioData = (data) => {
        if (!data || typeof data !== 'object') {
          return { isValid: false, error: 'Data must be an object' };
        }

        const requiredFields = ['totalValue', 'totalInvested', 'totalGainLoss'];
        const missingFields = requiredFields.filter(field => 
          data[field] === undefined || data[field] === null
        );

        if (missingFields.length > 0) {
          return { 
            isValid: false, 
            error: `Missing required fields: ${missingFields.join(', ')}` 
          };
        }

        const numericFields = ['totalValue', 'totalInvested', 'totalGainLoss'];
        const invalidFields = numericFields.filter(field => 
          isNaN(parseFloat(data[field]))
        );

        if (invalidFields.length > 0) {
          return { 
            isValid: false, 
            error: `Invalid numeric values for: ${invalidFields.join(', ')}` 
          };
        }

        return { isValid: true };
      };

      // Test valid data
      const validData = {
        totalValue: 1000000,
        totalInvested: 800000,
        totalGainLoss: 200000
      };
      
      const validResult = validatePortfolioData(validData);
      expect(validResult.isValid).toBe(true);

      // Test missing fields
      const missingFields = { totalValue: 1000000 };
      const missingResult = validatePortfolioData(missingFields);
      expect(missingResult.isValid).toBe(false);
      expect(missingResult.error).toContain('Missing required fields');

      // Test invalid data types
      const invalidData = {
        totalValue: 'invalid',
        totalInvested: 800000,
        totalGainLoss: 200000
      };
      
      const invalidResult = validatePortfolioData(invalidData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('Invalid numeric values');
    });
  });
});
