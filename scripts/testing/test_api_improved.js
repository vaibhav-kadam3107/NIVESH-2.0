/**
 * Improved API Testing Script
 * Tests all major API endpoints with proper error handling and validation
 */

const fetch = require('node-fetch');

class APITester {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.results = [];
  }

  async testEndpoint(endpoint, method = 'GET', body = null) {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Invalid JSON response' };
      }

      const result = {
        endpoint,
        method,
        status: response.status,
        responseTime,
        success: response.ok,
        data: data,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result = {
        endpoint,
        method,
        status: 0,
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      return result;
    }
  }

  async runAllTests() {
    console.log('🧪 Running Comprehensive API Tests...\n');

    // Test Portfolio APIs
    console.log('📊 Testing Portfolio APIs...');
    await this.testEndpoint('/api/portfolio/overview');
    await this.testEndpoint('/api/portfolio/holdings');
    await this.testEndpoint('/api/portfolio/performance');
    await this.testEndpoint('/api/portfolio/allocation');

    // Test Assets APIs
    console.log('📈 Testing Assets APIs...');
    await this.testEndpoint('/api/assets');
    await this.testEndpoint('/api/assets/watchlist/all');

    // Test Transactions APIs
    console.log('💼 Testing Transactions APIs...');
    await this.testEndpoint('/api/transactions');
    await this.testEndpoint('/api/transactions/recent');

    // Test Transaction Creation (POST requests)
    console.log('💰 Testing Transaction Creation...');
    await this.testEndpoint('/api/transactions', 'POST', {
      asset_id: 1,
      transaction_type: 'BUY',
      quantity: 10,
      price: 150.50
    });

    // Test Watchlist Management
    console.log('👀 Testing Watchlist APIs...');
    await this.testEndpoint('/api/assets/watchlist/add', 'POST', { asset_id: 2 });
    await this.testEndpoint('/api/assets/watchlist/remove/2', 'DELETE');

    // Test Error Cases
    console.log('❌ Testing Error Cases...');
    await this.testEndpoint('/api/nonexistent');
    await this.testEndpoint('/api/transactions', 'POST', { invalid: 'data' });

    this.printResults();
  }

  printResults() {
    console.log('\n📋 Test Results Summary:');
    console.log('=' .repeat(50));

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    console.log(`✅ Successful Tests: ${successful.length}`);
    console.log(`❌ Failed Tests: ${failed.length}`);
    console.log(`📊 Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);

    if (successful.length > 0) {
      console.log('\n✅ Successful Endpoints:');
      successful.forEach(result => {
        console.log(`  - ${result.method} ${result.endpoint} (${result.responseTime}ms)`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed Endpoints:');
      failed.forEach(result => {
        console.log(`  - ${result.method} ${result.endpoint} (Status: ${result.status})`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      });
    }

    // Performance Analysis
    const responseTimes = this.results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    console.log('\n⚡ Performance Analysis:');
    console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Fastest Response: ${minResponseTime}ms`);
    console.log(`  Slowest Response: ${maxResponseTime}ms`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (failed.length > 0) {
      console.log('  - Fix failed endpoints before deployment');
    }
    if (avgResponseTime > 500) {
      console.log('  - Consider optimizing slow endpoints');
    }
    if (maxResponseTime > 1000) {
      console.log('  - Investigate endpoints with response times > 1s');
    }

    console.log('\n🎉 API Testing Complete!');
  }

  async testSpecificEndpoint(endpoint, method = 'GET', body = null) {
    console.log(`\n🔍 Testing specific endpoint: ${method} ${endpoint}`);
    const result = await this.testEndpoint(endpoint, method, body);
    
    console.log(`Status: ${result.status}`);
    console.log(`Response Time: ${result.responseTime}ms`);
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.success) {
      console.log('Response Data:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('Error:', result.error || result.data);
    }
    
    return result;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  
  // Check if specific endpoint is provided as command line argument
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const endpoint = args[0];
    const method = args[1] || 'GET';
    const body = args[2] ? JSON.parse(args[2]) : null;
    
    tester.testSpecificEndpoint(endpoint, method, body);
  } else {
    tester.runAllTests();
  }
}

module.exports = APITester;
