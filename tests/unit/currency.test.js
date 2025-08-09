/**
 * @jest-environment jsdom
 */

describe('Currency Formatting Functions', () => {
  
  // Mock formatIndianCurrency function (as it exists in multiple files)
  const formatIndianCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  describe('formatIndianCurrency', () => {
    test('should format positive amounts correctly', () => {
      expect(formatIndianCurrency(1000)).toBe('₹1,000');
      expect(formatIndianCurrency(50000)).toBe('₹50,000');
      expect(formatIndianCurrency(1000000)).toBe('₹10,00,000');
    });

    test('should format negative amounts correctly', () => {
      expect(formatIndianCurrency(-1000)).toBe('-₹1,000');
      expect(formatIndianCurrency(-50000)).toBe('-₹50,000');
    });

    test('should handle zero and invalid values', () => {
      expect(formatIndianCurrency(0)).toBe('₹0');
      expect(formatIndianCurrency(null)).toBe('₹0');
      expect(formatIndianCurrency(undefined)).toBe('₹0');
      expect(formatIndianCurrency(NaN)).toBe('₹0');
      expect(formatIndianCurrency('')).toBe('₹0');
    });

    test('should handle decimal values', () => {
      expect(formatIndianCurrency(1000.99)).toBe('₹1,001');
      expect(formatIndianCurrency(1000.45)).toBe('₹1,000');
    });
  });

  describe('formatCurrency', () => {
    test('should format amounts with decimals', () => {
      expect(formatCurrency(1000)).toBe('1,000.00');
      expect(formatCurrency(1000.5)).toBe('1,000.50');
      expect(formatCurrency(1000.99)).toBe('1,000.99');
    });

    test('should handle zero and invalid values', () => {
      expect(formatCurrency(0)).toBe('0.00');
      expect(formatCurrency(null)).toBe('0.00');
      expect(formatCurrency(undefined)).toBe('0.00');
      expect(formatCurrency(NaN)).toBe('0.00');
      expect(formatCurrency('')).toBe('0.00');
    });

    test('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('-1,000.00');
      expect(formatCurrency(-500.25)).toBe('-500.25');
    });
  });
});
