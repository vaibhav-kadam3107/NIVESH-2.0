/**
 * @jest-environment node
 */

describe('Business Logic Tests', () => {
  
  describe('Portfolio Calculations', () => {
    
    test('should calculate total portfolio value correctly', () => {
      const holdings = [
        { ticker: 'AAPL', quantity: 10, current_price: 150.00 },
        { ticker: 'TSLA', quantity: 5, current_price: 2800.00 },
        { ticker: 'MSFT', quantity: 15, current_price: 300.00 }
      ];
      
      const totalValue = holdings.reduce((sum, holding) => {
        return sum + (holding.quantity * holding.current_price);
      }, 0);
      
      const expectedValue = (10 * 150.00) + (5 * 2800.00) + (15 * 300.00);
      expect(totalValue).toBe(expectedValue);
      expect(totalValue).toBe(20000.00); // 1500 + 14000 + 4500 = 20000
    });
    
    test('should calculate total gain/loss correctly', () => {
      const holdings = [
        { ticker: 'AAPL', quantity: 10, current_price: 155.00, avg_buy_price: 150.00 },
        { ticker: 'TSLA', quantity: 5, current_price: 2850.00, avg_buy_price: 2800.00 },
        { ticker: 'MSFT', quantity: 15, current_price: 310.00, avg_buy_price: 300.00 }
      ];
      
      const totalGainLoss = holdings.reduce((sum, holding) => {
        const gainLoss = (holding.current_price - holding.avg_buy_price) * holding.quantity;
        return sum + gainLoss;
      }, 0);
      
      const expectedGainLoss = (5.00 * 10) + (50.00 * 5) + (10.00 * 15);
      expect(totalGainLoss).toBe(expectedGainLoss);
      expect(totalGainLoss).toBe(450.00); // 50 + 250 + 150 = 450
    });
    
    test('should calculate percentage return correctly', () => {
      const totalInvested = 16600.00; // (145 * 10) + (2750 * 5) + (290 * 15)
      const totalGainLoss = 400.00;
      
      const percentageReturn = (totalGainLoss / totalInvested) * 100;
      expect(percentageReturn).toBeCloseTo(2.41, 2);
    });
    
    test('should calculate average buy price correctly', () => {
      const holdings = [
        { ticker: 'AAPL', quantity: 10, avg_buy_price: 140.00 },
        { ticker: 'TSLA', quantity: 5, avg_buy_price: 150.00 },
        { ticker: 'MSFT', quantity: 15, avg_buy_price: 145.00 }
      ];
      
      const totalValue = holdings.reduce((sum, holding) => {
        return sum + (holding.quantity * holding.avg_buy_price);
      }, 0);
      
      const totalQuantity = holdings.reduce((sum, holding) => {
        return sum + holding.quantity;
      }, 0);
      
      const avgBuyPrice = totalValue / totalQuantity;
      
      // Calculate expected: (10*140 + 5*150 + 15*145) / 30 = (1400 + 750 + 2175) / 30 = 4325 / 30 = 144.17
      expect(avgBuyPrice).toBeCloseTo(144.17, 2);
    });
  });
  
  describe('Transaction Processing', () => {
    
    test('should validate buy transaction input', () => {
      const validateBuyTransaction = (ticker, quantity, price) => {
        const errors = [];
        
        if (!ticker || ticker.trim() === '') {
          errors.push('Ticker is required');
        }
        
        if (!quantity || quantity <= 0) {
          errors.push('Quantity must be positive');
        }
        
        if (!price || price <= 0) {
          errors.push('Price must be positive');
        }
        
        if (quantity && !Number.isInteger(quantity)) {
          errors.push('Quantity must be a whole number');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      };
      
      // Valid transaction
      const validResult = validateBuyTransaction('AAPL', 10, 150.50);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      // Invalid transaction
      const invalidResult = validateBuyTransaction('', -5, 0);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Ticker is required');
      expect(invalidResult.errors).toContain('Quantity must be positive');
      expect(invalidResult.errors).toContain('Price must be positive');
    });
    
    test('should calculate transaction total correctly', () => {
      const calculateTransactionTotal = (quantity, price, fees = 0) => {
        return (quantity * price) + fees;
      };
      
      expect(calculateTransactionTotal(10, 150.50)).toBe(1505.00);
      expect(calculateTransactionTotal(5, 2800.00, 9.99)).toBe(14009.99);
    });
    
    test('should update holdings after buy transaction', () => {
      const updateHoldingsAfterBuy = (currentHolding, newQuantity, newPrice) => {
        if (!currentHolding) {
          return {
            quantity: newQuantity,
            avg_buy_price: newPrice
          };
        }
        
        const totalQuantity = currentHolding.quantity + newQuantity;
        const totalValue = (currentHolding.quantity * currentHolding.avg_buy_price) + 
                          (newQuantity * newPrice);
        const newAvgPrice = totalValue / totalQuantity;
        
        return {
          quantity: totalQuantity,
          avg_buy_price: newAvgPrice
        };
      };
      
      // New holding
      const newHolding = updateHoldingsAfterBuy(null, 10, 150.00);
      expect(newHolding.quantity).toBe(10);
      expect(newHolding.avg_buy_price).toBe(150.00);
      
      // Existing holding
      const existingHolding = { quantity: 10, avg_buy_price: 145.00 };
      const updatedHolding = updateHoldingsAfterBuy(existingHolding, 5, 155.00);
      expect(updatedHolding.quantity).toBe(15);
      expect(updatedHolding.avg_buy_price).toBeCloseTo(148.33, 2);
    });
    
    test('should validate sell transaction', () => {
      const validateSellTransaction = (currentHolding, sellQuantity) => {
        const errors = [];
        
        if (!currentHolding) {
          errors.push('No holding found for this asset');
          return { isValid: false, errors };
        }
        
        if (!sellQuantity || sellQuantity <= 0) {
          errors.push('Sell quantity must be positive');
        }
        
        if (sellQuantity > currentHolding.quantity) {
          errors.push('Cannot sell more shares than owned');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      };
      
      const holding = { quantity: 10, avg_buy_price: 150.00 };
      
      // Valid sell
      const validSell = validateSellTransaction(holding, 5);
      expect(validSell.isValid).toBe(true);
      
      // Invalid sell - too many shares
      const invalidSell = validateSellTransaction(holding, 15);
      expect(invalidSell.isValid).toBe(false);
      expect(invalidSell.errors).toContain('Cannot sell more shares than owned');
    });
  });
  
  describe('Data Validation', () => {
    
    test('should validate ticker symbol format', () => {
      const validateTicker = (ticker) => {
        if (!ticker) return false;
        
        // Ticker should be 1-10 characters, alphanumeric
        const tickerRegex = /^[A-Z0-9]{1,10}$/;
        return tickerRegex.test(ticker.toUpperCase());
      };
      
      expect(validateTicker('AAPL')).toBe(true);
      expect(validateTicker('GOOGL')).toBe(true);
      expect(validateTicker('')).toBe(false);
      expect(validateTicker('A')).toBe(true);
      expect(validateTicker('TOOLONGTICKER')).toBe(false);
      expect(validateTicker('AAPL-')).toBe(false);
    });
    
    test('should validate price format', () => {
      const validatePrice = (price) => {
        if (typeof price !== 'number' || price <= 0) return false;
        
        // Price should have max 2 decimal places
        const priceStr = price.toString();
        const decimalPlaces = priceStr.includes('.') ? 
          priceStr.split('.')[1].length : 0;
        
        return decimalPlaces <= 2;
      };
      
      expect(validatePrice(150.50)).toBe(true);
      expect(validatePrice(150.5)).toBe(true);
      expect(validatePrice(150)).toBe(true);
      expect(validatePrice(150.555)).toBe(false);
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice(-10)).toBe(false);
    });
    
    test('should validate quantity format', () => {
      const validateQuantity = (quantity) => {
        return Number.isInteger(quantity) && quantity > 0;
      };
      
      expect(validateQuantity(10)).toBe(true);
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-5)).toBe(false);
      expect(validateQuantity(10.5)).toBe(false);
    });
    
    test('should validate date format', () => {
      const validateDate = (date) => {
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj);
      };
      
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024-01-15T10:30:00')).toBe(true);
      expect(validateDate('invalid-date')).toBe(false);
      expect(validateDate('')).toBe(false);
    });
  });
  
  describe('Performance Calculations', () => {
    
    test('should calculate Sharpe ratio', () => {
      const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
        if (returns.length === 0) return 0;
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev === 0) return 0;
        
        return (avgReturn - riskFreeRate) / stdDev;
      };
      
      const returns = [0.05, 0.03, 0.07, 0.02, 0.06];
      const sharpeRatio = calculateSharpeRatio(returns);
      
      expect(sharpeRatio).toBeGreaterThan(0);
      expect(typeof sharpeRatio).toBe('number');
    });
    
    test('should calculate maximum drawdown', () => {
      const calculateMaxDrawdown = (prices) => {
        if (prices.length < 2) return 0;
        
        let maxDrawdown = 0;
        let peak = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
          if (prices[i] > peak) {
            peak = prices[i];
          } else {
            const drawdown = (peak - prices[i]) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
          }
        }
        
        return maxDrawdown;
      };
      
      const prices = [100, 110, 105, 120, 115, 125, 130, 125, 140];
      const maxDrawdown = calculateMaxDrawdown(prices);
      
      expect(maxDrawdown).toBeGreaterThan(0);
      expect(maxDrawdown).toBeLessThan(1);
    });
    
    test('should calculate volatility', () => {
      const calculateVolatility = (returns) => {
        if (returns.length < 2) return 0;
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
      };
      
      const returns = [0.05, 0.03, 0.07, 0.02, 0.06];
      const volatility = calculateVolatility(returns);
      
      expect(volatility).toBeGreaterThan(0);
      expect(typeof volatility).toBe('number');
    });
  });
  
  describe('Portfolio Allocation', () => {
    
    test('should calculate sector allocation', () => {
      const calculateSectorAllocation = (holdings) => {
        const sectorTotals = {};
        let totalValue = 0;
        
        holdings.forEach(holding => {
          const value = holding.quantity * holding.current_price;
          sectorTotals[holding.sector] = (sectorTotals[holding.sector] || 0) + value;
          totalValue += value;
        });
        
        const allocation = {};
        Object.keys(sectorTotals).forEach(sector => {
          allocation[sector] = (sectorTotals[sector] / totalValue) * 100;
        });
        
        return allocation;
      };
      
      const holdings = [
        { sector: 'Technology', quantity: 10, current_price: 150 },
        { sector: 'Technology', quantity: 5, current_price: 2800 },
        { sector: 'Healthcare', quantity: 15, current_price: 300 },
        { sector: 'Financial', quantity: 8, current_price: 150 }
      ];
      
      const allocation = calculateSectorAllocation(holdings);
      
      expect(allocation.Technology).toBeGreaterThan(0);
      expect(allocation.Healthcare).toBeGreaterThan(0);
      expect(allocation.Financial).toBeGreaterThan(0);
      
      const totalPercentage = Object.values(allocation).reduce((sum, val) => sum + val, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });
    
    test('should calculate asset type allocation', () => {
      const calculateAssetTypeAllocation = (holdings) => {
        const typeTotals = {};
        let totalValue = 0;
        
        holdings.forEach(holding => {
          const value = holding.quantity * holding.current_price;
          typeTotals[holding.asset_type] = (typeTotals[holding.asset_type] || 0) + value;
          totalValue += value;
        });
        
        const allocation = {};
        Object.keys(typeTotals).forEach(type => {
          allocation[type] = (typeTotals[type] / totalValue) * 100;
        });
        
        return allocation;
      };
      
      const holdings = [
        { asset_type: 'STOCK', quantity: 10, current_price: 150 },
        { asset_type: 'ETF', quantity: 5, current_price: 2800 },
        { asset_type: 'STOCK', quantity: 15, current_price: 300 }
      ];
      
      const allocation = calculateAssetTypeAllocation(holdings);
      
      expect(allocation.STOCK).toBeGreaterThan(0);
      expect(allocation.ETF).toBeGreaterThan(0);
      
      const totalPercentage = Object.values(allocation).reduce((sum, val) => sum + val, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });
  });
});
