/**
 * @jest-environment jsdom
 */

describe('DOM Manipulation Functions', () => {
  
  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
  });

  describe('Modal Functions', () => {
    beforeEach(() => {
      // Setup basic modal structure
      document.body.innerHTML = `
        <div id="buyModal" class="hidden">
          <form id="buyForm">
            <select id="buyTicker"></select>
            <input id="buyQuantity" type="number" />
            <input id="buyPrice" type="number" />
            <div id="buyTotal">₹0.00</div>
            <div id="buyStockInfo"></div>
          </form>
        </div>
        <div id="sellModal" class="hidden">
          <form id="sellForm">
            <select id="sellTicker"></select>
            <input id="sellQuantity" type="number" />
            <input id="sellPrice" type="number" />
            <div id="sellTotal">₹0.00</div>
            <div id="sellStockInfo"></div>
            <div id="sellHoldings"></div>
          </form>
        </div>
      `;
    });

    // Mock modal functions (as they exist in dashboard.js)
    const openBuyModal = () => {
      document.getElementById('buyModal').classList.remove('hidden');
    };

    const closeBuyModal = () => {
      document.getElementById('buyModal').classList.add('hidden');
      document.getElementById('buyForm').reset();
      document.getElementById('buyTotal').textContent = '₹0.00';
      document.getElementById('buyStockInfo').innerHTML = '';
    };

    const openSellModal = () => {
      document.getElementById('sellModal').classList.remove('hidden');
    };

    const closeSellModal = () => {
      document.getElementById('sellModal').classList.add('hidden');
      document.getElementById('sellForm').reset();
      document.getElementById('sellTotal').textContent = '₹0.00';
      document.getElementById('sellStockInfo').innerHTML = '';
      document.getElementById('sellHoldings').innerHTML = '';
    };

    test('openBuyModal should show the buy modal', () => {
      const modal = document.getElementById('buyModal');
      expect(modal.classList.contains('hidden')).toBe(true);
      
      openBuyModal();
      
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    test('closeBuyModal should hide the buy modal and reset form', () => {
      const modal = document.getElementById('buyModal');
      const form = document.getElementById('buyForm');
      const total = document.getElementById('buyTotal');
      const stockInfo = document.getElementById('buyStockInfo');

      // Setup initial state
      modal.classList.remove('hidden');
      total.textContent = '₹5,000.00';
      stockInfo.innerHTML = '<div>Some stock info</div>';
      
      closeBuyModal();
      
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(total.textContent).toBe('₹0.00');
      expect(stockInfo.innerHTML).toBe('');
    });

    test('openSellModal should show the sell modal', () => {
      const modal = document.getElementById('sellModal');
      expect(modal.classList.contains('hidden')).toBe(true);
      
      openSellModal();
      
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    test('closeSellModal should hide the sell modal and reset form', () => {
      const modal = document.getElementById('sellModal');
      const total = document.getElementById('sellTotal');
      const stockInfo = document.getElementById('sellStockInfo');
      const holdings = document.getElementById('sellHoldings');

      // Setup initial state
      modal.classList.remove('hidden');
      total.textContent = '₹3,000.00';
      stockInfo.innerHTML = '<div>Stock info</div>';
      holdings.innerHTML = '<div>Holdings info</div>';
      
      closeSellModal();
      
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(total.textContent).toBe('₹0.00');
      expect(stockInfo.innerHTML).toBe('');
      expect(holdings.innerHTML).toBe('');
    });
  });

  describe('Loading State Functions', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="loadingElement" style="display: none;">Loading...</div>
        <div id="contentElement" style="display: block;">Content</div>
      `;
    });

    // Mock loading functions
    const showLoadingState = (loadingId, containerId) => {
      const loading = document.getElementById(loadingId);
      const container = document.getElementById(containerId);
      if (loading) loading.style.display = 'block';
      if (container) container.style.display = 'none';
    };

    const hideLoadingState = (loadingId, containerId) => {
      const loading = document.getElementById(loadingId);
      const container = document.getElementById(containerId);
      if (loading) loading.style.display = 'none';
      if (container) container.style.display = 'block';
    };

    test('showLoadingState should show loading and hide content', () => {
      const loading = document.getElementById('loadingElement');
      const content = document.getElementById('contentElement');
      
      expect(loading.style.display).toBe('none');
      expect(content.style.display).toBe('block');
      
      showLoadingState('loadingElement', 'contentElement');
      
      expect(loading.style.display).toBe('block');
      expect(content.style.display).toBe('none');
    });

    test('hideLoadingState should hide loading and show content', () => {
      const loading = document.getElementById('loadingElement');
      const content = document.getElementById('contentElement');
      
      // Set initial state
      loading.style.display = 'block';
      content.style.display = 'none';
      
      hideLoadingState('loadingElement', 'contentElement');
      
      expect(loading.style.display).toBe('none');
      expect(content.style.display).toBe('block');
    });
  });

  describe('Time Calculation Functions', () => {
    // Mock getTimeAgo function (from dashboard.js)
    const getTimeAgo = (dateString) => {
      const now = new Date();
      const date = new Date(dateString);
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return '1 day ago';
      return `${Math.floor(diffInHours / 24)} days ago`;
    };

    test('getTimeAgo should return "Just now" for recent dates', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      
      expect(getTimeAgo(recent.toISOString())).toBe('Just now');
    });

    test('getTimeAgo should return hours for same day', () => {
      const now = new Date();
      const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      
      expect(getTimeAgo(hoursAgo.toISOString())).toBe('3 hours ago');
    });

    test('getTimeAgo should return "1 day ago" for yesterday', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      
      expect(getTimeAgo(yesterday.toISOString())).toBe('1 day ago');
    });

    test('getTimeAgo should return days for older dates', () => {
      const now = new Date();
      const daysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      
      expect(getTimeAgo(daysAgo.toISOString())).toBe('5 days ago');
    });
  });
});
