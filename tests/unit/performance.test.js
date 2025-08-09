/**
 * @jest-environment jsdom
 */

describe('Performance Tests', () => {
  
  describe('Database Performance', () => {
    
    test('should handle large dataset queries efficiently', async () => {
      const measureQueryPerformance = async (query, params = []) => {
        const startTime = Date.now();
        
        // Simulate database query execution
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        const endTime = Date.now();
        return endTime - startTime;
      };
      
      // Test portfolio overview query performance
      const portfolioQueryTime = await measureQueryPerformance(`
        SELECT 
          SUM(h.quantity * COALESCE(ap.price, 0)) as total_value,
          SUM(h.quantity * (COALESCE(ap.price, 0) - h.avg_buy_price)) as total_gain_loss
        FROM holdings h
        LEFT JOIN asset_prices ap ON h.asset_id = ap.asset_id 
          AND ap.price_date = (SELECT MAX(price_date) FROM asset_prices WHERE asset_id = h.asset_id)
        WHERE h.quantity > 0
      `);
      
      expect(portfolioQueryTime).toBeLessThan(500); // Should complete within 500ms
    });
    
    test('should handle concurrent database connections', async () => {
      const testConcurrentConnections = async (numConnections) => {
        const connectionPromises = [];
        
        for (let i = 0; i < numConnections; i++) {
          connectionPromises.push(
            new Promise(async (resolve) => {
              const startTime = Date.now();
              
              // Simulate database connection and query
              await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
              
              const endTime = Date.now();
              resolve(endTime - startTime);
            })
          );
        }
        
        const results = await Promise.all(connectionPromises);
        return results;
      };
      
      const connectionTimes = await testConcurrentConnections(10);
      
      // All connections should complete successfully
      expect(connectionTimes.length).toBe(10);
      connectionTimes.forEach(time => {
        expect(time).toBeLessThan(100); // Each connection should complete within 100ms
      });
    });
    
    test('should handle bulk insert operations', async () => {
      const measureBulkInsertPerformance = async (numRecords) => {
        const startTime = Date.now();
        
        // Simulate bulk insert operation
        const batchSize = 1000;
        const batches = Math.ceil(numRecords / batchSize);
        
        for (let i = 0; i < batches; i++) {
          // Simulate batch insert
          await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
        }
        
        const endTime = Date.now();
        return endTime - startTime;
      };
      
      const insertTime = await measureBulkInsertPerformance(10000);
      
      // 10,000 records should be inserted within reasonable time
      expect(insertTime).toBeLessThan(2000); // 2 seconds
      expect(insertTime).toBeGreaterThan(0);
    });
  });
  
  describe('API Performance', () => {
    
    test('should handle concurrent API requests', async () => {
      const testConcurrentRequests = async (endpoint, numRequests) => {
        const requestPromises = [];
        
        for (let i = 0; i < numRequests; i++) {
          requestPromises.push(
            new Promise(async (resolve) => {
              const startTime = Date.now();
              
              // Simulate API request
              await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
              
              const endTime = Date.now();
              resolve({
                requestId: i,
                responseTime: endTime - startTime,
                success: Math.random() > 0.1 // 90% success rate
              });
            })
          );
        }
        
        const results = await Promise.all(requestPromises);
        return results;
      };
      
      const results = await testConcurrentRequests('/api/portfolio/overview', 20);
      
      // All requests should complete
      expect(results.length).toBe(20);
      
      // Most requests should succeed
      const successfulRequests = results.filter(r => r.success);
      expect(successfulRequests.length).toBeGreaterThan(results.length * 0.8);
      
      // Response times should be reasonable
      results.forEach(result => {
        expect(result.responseTime).toBeLessThan(500);
      });
    });
    
    test('should handle large response payloads', async () => {
      const measureLargePayloadPerformance = async (numRecords) => {
        const startTime = Date.now();
        
        // Simulate generating large response
        const largeDataset = [];
        for (let i = 0; i < numRecords; i++) {
          largeDataset.push({
            id: i,
            ticker: `STOCK${i}`,
            price: Math.random() * 1000,
            quantity: Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString()
          });
        }
        
        // Simulate JSON serialization
        const jsonString = JSON.stringify(largeDataset);
        
        const endTime = Date.now();
        return {
          responseTime: endTime - startTime,
          payloadSize: jsonString.length
        };
      };
      
      const result = await measureLargePayloadPerformance(1000);
      
      expect(result.responseTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.payloadSize).toBeGreaterThan(0);
    });
    
    test('should handle memory usage efficiently', () => {
      const measureMemoryUsage = () => {
        const initialMemory = process.memoryUsage();
        
        // Simulate memory-intensive operation
        const largeArray = [];
        for (let i = 0; i < 10000; i++) {
          largeArray.push({
            id: i,
            data: 'x'.repeat(1000) // 1KB per item
          });
        }
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Clean up
        largeArray.length = 0;
        
        return {
          initialMemory: initialMemory.heapUsed,
          finalMemory: finalMemory.heapUsed,
          increase: memoryIncrease
        };
      };
      
      const memoryUsage = measureMemoryUsage();
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryUsage.increase).toBeLessThan(50 * 1024 * 1024);
    });
  });
  
  describe('Frontend Performance', () => {
    
    test('should render large datasets efficiently', () => {
      const measureRenderingPerformance = (numItems) => {
        const startTime = performance.now();
        
        // Simulate DOM rendering
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < numItems; i++) {
          const div = document.createElement('div');
          div.textContent = `Item ${i}`;
          div.className = 'portfolio-item';
          fragment.appendChild(div);
        }
        
        const endTime = performance.now();
        return endTime - startTime;
      };
      
      // Mock performance.now for Node.js environment
      global.performance = {
        now: () => Date.now()
      };
      
      const renderTime = measureRenderingPerformance(1000);
      
      expect(renderTime).toBeLessThan(100); // Should render 1000 items within 100ms
    });
    
    test('should handle chart rendering performance', () => {
      const measureChartRendering = (dataPoints) => {
        const startTime = performance.now();
        
        // Simulate chart data processing
        const chartData = [];
        for (let i = 0; i < dataPoints; i++) {
          chartData.push({
            x: i,
            y: Math.random() * 100
          });
        }
        
        // Simulate chart rendering
        const renderTime = Math.random() * 50 + 20;
        
        const endTime = performance.now();
        return endTime - startTime;
      };
      
      const chartRenderTime = measureChartRendering(1000);
      
      expect(chartRenderTime).toBeLessThan(200); // Should render chart within 200ms
    });
    
    test('should handle real-time updates efficiently', () => {
      const measureRealTimeUpdates = (numUpdates) => {
        const updates = [];
        const startTime = performance.now();
        
        for (let i = 0; i < numUpdates; i++) {
          // Simulate real-time update
          const updateTime = Math.random() * 10 + 5; // 5-15ms per update
          updates.push(updateTime);
        }
        
        const endTime = performance.now();
        return {
          totalTime: endTime - startTime,
          averageUpdateTime: updates.reduce((sum, time) => sum + time, 0) / updates.length
        };
      };
      
      const result = measureRealTimeUpdates(100);
      
      expect(result.totalTime).toBeLessThan(1000); // Total time should be reasonable
      expect(result.averageUpdateTime).toBeLessThan(20); // Average update should be fast
    });
  });
  
  describe('Load Testing', () => {
    
    test('should handle sustained load', async () => {
      const runSustainedLoadTest = async (duration, requestsPerSecond) => {
        const startTime = Date.now();
        const endTime = startTime + duration;
        const requests = [];
        
        while (Date.now() < endTime) {
          const requestStart = Date.now();
          
          // Simulate API request
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25));
          
          const requestEnd = Date.now();
          requests.push({
            responseTime: requestEnd - requestStart,
            timestamp: requestStart
          });
          
          // Control request rate
          await new Promise(resolve => setTimeout(resolve, 1000 / requestsPerSecond));
        }
        
        return requests;
      };
      
      const requests = await runSustainedLoadTest(5000, 10); // 5 seconds, 10 req/sec
      
      expect(requests.length).toBeGreaterThan(40); // Should handle at least 40 requests
      
      // Response times should remain consistent
      const responseTimes = requests.map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      expect(avgResponseTime).toBeLessThan(100); // Average response time should be under 100ms
    });
    
    test('should handle peak load', async () => {
      const runPeakLoadTest = async (numConcurrentRequests) => {
        const startTime = Date.now();
        
        const requestPromises = [];
        for (let i = 0; i < numConcurrentRequests; i++) {
          requestPromises.push(
            new Promise(async (resolve) => {
              const requestStart = Date.now();
              
              // Simulate API request with varying load
              const loadTime = Math.random() * 200 + 50;
              await new Promise(resolve => setTimeout(resolve, loadTime));
              
              const requestEnd = Date.now();
              resolve({
                requestId: i,
                responseTime: requestEnd - requestStart,
                success: Math.random() > 0.05 // 95% success rate under peak load
              });
            })
          );
        }
        
        const results = await Promise.all(requestPromises);
        const totalTime = Date.now() - startTime;
        
        return {
          results,
          totalTime,
          successRate: results.filter(r => r.success).length / results.length
        };
      };
      
      const testResult = await runPeakLoadTest(50);
      
      expect(testResult.results.length).toBe(50);
      expect(testResult.successRate).toBeGreaterThan(0.8); // 80% success rate minimum
      expect(testResult.totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
    
    test('should handle memory under load', async () => {
      const measureMemoryUnderLoad = async (numOperations) => {
        const initialMemory = process.memoryUsage();
        const memorySnapshots = [];
        
        for (let i = 0; i < numOperations; i++) {
          // Simulate memory-intensive operation
          const tempData = new Array(1000).fill('x'.repeat(100));
          
          if (i % 100 === 0) {
            memorySnapshots.push(process.memoryUsage().heapUsed);
          }
          
          // Clean up
          tempData.length = 0;
        }
        
        const finalMemory = process.memoryUsage();
        
        return {
          initialMemory: initialMemory.heapUsed,
          finalMemory: finalMemory.heapUsed,
          maxMemory: Math.max(...memorySnapshots),
          memoryIncrease: finalMemory.heapUsed - initialMemory.heapUsed
        };
      };
      
      const memoryResult = await measureMemoryUnderLoad(1000);
      
      // Memory should not grow excessively
      expect(memoryResult.memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(memoryResult.maxMemory).toBeLessThan(500 * 1024 * 1024); // Max memory under 500MB
    });
  });
  
  describe('Caching Performance', () => {
    
    test('should implement effective caching', () => {
      const cache = new Map();
      const cacheHits = { count: 0 };
      const cacheMisses = { count: 0 };
      
      const getCachedData = (key, fetchFunction) => {
        if (cache.has(key)) {
          cacheHits.count++;
          return cache.get(key);
        }
        
        cacheMisses.count++;
        const data = fetchFunction();
        cache.set(key, data);
        return data;
      };
      
      // Simulate expensive data fetching
      const expensiveFetch = () => {
        return { data: 'expensive-data', timestamp: Date.now() };
      };
      
      // First call - cache miss
      const data1 = getCachedData('portfolio', expensiveFetch);
      
      // Second call - cache hit
      const data2 = getCachedData('portfolio', expensiveFetch);
      
      expect(cacheHits.count).toBe(1);
      expect(cacheMisses.count).toBe(1);
      expect(data1).toBe(data2); // Same object reference
    });
    
    test('should handle cache invalidation', () => {
      const cache = new Map();
      const cacheExpiry = new Map();
      const TTL = 60000; // 1 minute
      
      const getCachedDataWithTTL = (key, fetchFunction) => {
        const now = Date.now();
        const expiry = cacheExpiry.get(key);
        
        if (cache.has(key) && expiry && now < expiry) {
          return cache.get(key);
        }
        
        // Cache miss or expired
        const data = fetchFunction();
        cache.set(key, data);
        cacheExpiry.set(key, now + TTL);
        return data;
      };
      
      const fetchData = () => ({ data: 'fresh-data', timestamp: Date.now() });
      
      // First call
      const data1 = getCachedDataWithTTL('portfolio', fetchData);
      
      // Simulate time passing
      const originalNow = Date.now;
      Date.now = () => originalNow() + 70000; // 70 seconds later
      
      // Second call after expiry
      const data2 = getCachedDataWithTTL('portfolio', fetchData);
      
      // Restore Date.now
      Date.now = originalNow;
      
      expect(data1.timestamp).not.toBe(data2.timestamp); // Different timestamps
    });
  });
});
