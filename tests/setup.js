// Global test setup

// Mock fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment the next lines to silence console output during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};

// Mock Feather icons
global.feather = {
  replace: jest.fn(),
  icons: {}
};

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
  data: {},
  options: {}
}));

// Mock toastr
global.toastr = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  options: {}
};

// Setup DOM globals only if window exists (jsdom environment)
if (typeof window !== 'undefined') {
  // Only set location if it's not already defined or if we can safely modify it
  try {
    if (!window.location.hostname) {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          port: '3000',
          protocol: 'http:',
          href: 'http://localhost:3000/',
          origin: 'http://localhost:3000'
        },
        writable: true,
        configurable: true
      });
    }
  } catch (error) {
    // If we can't modify location, just set individual properties
    if (window.location) {
      window.location.hostname = 'localhost';
      window.location.port = '3000';
      window.location.protocol = 'http:';
    }
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  // Reset fetch mock
  fetch.mockClear();
});
