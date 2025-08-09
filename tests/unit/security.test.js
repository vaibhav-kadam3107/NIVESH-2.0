/**
 * @jest-environment node
 */

describe('Security Tests', () => {
  
  describe('Input Validation', () => {
    
    test('should sanitize SQL input to prevent injection', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        
        // Remove SQL injection patterns
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|--)\b)/gi,
          /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
          /(\b(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
          /(\b(OR|AND)\s+\d+\s*LIKE\s*['"]?%['"]?)/gi
        ];
        
        let sanitized = input;
        sqlPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        
        // Remove common SQL injection characters
        sanitized = sanitized.replace(/['";\\]/g, '');
        
        // Remove comments
        sanitized = sanitized.replace(/--.*$/gm, '');
        sanitized = sanitized.replace(/\/\*.*?\*\//gs, '');
        
        return sanitized.trim();
      };
      
      // Test SQL injection attempts
      const maliciousInputs = [
        "'; DROP TABLE assets; --",
        "1' OR '1'='1",
        "1 OR 1=1",
        "admin'--",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];
      
      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('INSERT');
        expect(sanitized).not.toContain('OR');
        expect(sanitized).not.toContain('--');
      });
    });
    
    test('should validate and sanitize ticker symbols', () => {
      const validateAndSanitizeTicker = (ticker) => {
        if (!ticker || typeof ticker !== 'string') {
          return { isValid: false, sanitized: null };
        }
        
        // Remove any non-alphanumeric characters
        let sanitized = ticker.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        
        // Check length - must be between 2 and 10 characters
        if (sanitized.length < 2 || sanitized.length > 10) {
          return { isValid: false, sanitized: null };
        }
        
        return { isValid: true, sanitized };
      };
      
      // Valid tickers
      expect(validateAndSanitizeTicker('AAPL')).toEqual({ isValid: true, sanitized: 'AAPL' });
      expect(validateAndSanitizeTicker('TSLA')).toEqual({ isValid: true, sanitized: 'TSLA' });
      expect(validateAndSanitizeTicker('MSFT')).toEqual({ isValid: true, sanitized: 'MSFT' });
      
      // Invalid tickers
      expect(validateAndSanitizeTicker('')).toEqual({ isValid: false, sanitized: null });
      expect(validateAndSanitizeTicker('A')).toEqual({ isValid: false, sanitized: null }); // Too short
      expect(validateAndSanitizeTicker('TOOLONGTICKER')).toEqual({ isValid: false, sanitized: null });
      expect(validateAndSanitizeTicker('AAPL-')).toEqual({ isValid: true, sanitized: 'AAPL' });
      expect(validateAndSanitizeTicker('AAPL; DROP TABLE assets;')).toEqual({ isValid: false, sanitized: null });
    });

    test('should validate numeric inputs', () => {
      const validateNumericInput = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
        if (value === '' || value === null || value === undefined) return false;
        
        const num = Number(value);
        if (isNaN(num)) return false;
        if (num < min || num > max) return false;
        
        return true;
      };
      
      // Valid numbers
      expect(validateNumericInput('100')).toBe(true);
      expect(validateNumericInput('150.50')).toBe(true);
      expect(validateNumericInput('0')).toBe(true);
      expect(validateNumericInput('1000.25')).toBe(true);

      // Invalid numbers
      expect(validateNumericInput('')).toBe(false);
      expect(validateNumericInput('abc')).toBe(false);
      expect(validateNumericInput('-10')).toBe(false);
      expect(validateNumericInput('150.50.25')).toBe(false);
    });

    test('should validate date inputs', () => {
      const validateDateInput = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return false;
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return false;
        
        // Check if date is not in the future (for transaction dates)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (date > today) return false;
        
        // Check if date is not too far in the past (e.g., not before 1900)
        const minDate = new Date('1900-01-01');
        if (date < minDate) return false;
        
        return true;
      };
      
      const currentDate = new Date();
      const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
      const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
      
      // Valid dates
      expect(validateDateInput('2024-01-15')).toBe(true);
      expect(validateDateInput('2023-12-31')).toBe(true);
      expect(validateDateInput(oneYearAgoStr)).toBe(true);
      
      // Invalid dates
      expect(validateDateInput('')).toBe(false);
      expect(validateDateInput('invalid-date')).toBe(false);
      expect(validateDateInput('2025-01-15')).toBe(false); // Future date - this should fail
      expect(validateDateInput('1899-01-01')).toBe(false); // Too old
    });
  });
  
  describe('XSS Prevention', () => {
    
    test('should escape HTML content', () => {
      const escapeHtml = (str) => {
        if (typeof str !== 'string') return str;
        
        const htmlEscapes = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '/': '&#x2F;'
        };
        
        let escaped = str.replace(/[&<>"'/]/g, match => htmlEscapes[match]);
        
        // Remove dangerous attributes even if they're escaped
        const dangerousPatterns = [
          /on\w+\s*=/gi,
          /javascript\s*:/gi,
          /vbscript\s*:/gi,
          /data\s*:/gi
        ];
        
        dangerousPatterns.forEach(pattern => {
          escaped = escaped.replace(pattern, '');
        });
        
        return escaped;
      };
      
      const testCases = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(1)">Click me</a>',
        '<div onclick="alert(1)">Click me</div>'
      ];
      
      testCases.forEach(input => {
        const escaped = escapeHtml(input);
        expect(escaped).not.toContain('<script>');
        expect(escaped).not.toContain('javascript:');
        expect(escaped).not.toContain('onerror=');
        expect(escaped).not.toContain('onclick=');
        expect(escaped).toContain('&lt;');
        expect(escaped).toContain('&gt;');
      });
    });
    
    test('should validate JSON payload structure', () => {
      const validateJsonPayload = (payload, requiredFields = []) => {
        if (!payload || typeof payload !== 'object') {
          return { isValid: false, error: 'Invalid payload structure' };
        }
        
        // Check for required fields
        for (const field of requiredFields) {
          if (!(field in payload)) {
            return { isValid: false, error: `Missing required field: ${field}` };
          }
        }
        
        // Check for unexpected fields (whitelist approach)
        const allowedFields = ['ticker', 'quantity', 'price', 'transaction_type', 'asset_id'];
        const unexpectedFields = Object.keys(payload).filter(key => !allowedFields.includes(key));
        
        if (unexpectedFields.length > 0) {
          return { isValid: false, error: `Unexpected fields: ${unexpectedFields.join(', ')}` };
        }
        
        return { isValid: true };
      };
      
      // Valid payload
      const validPayload = { ticker: 'AAPL', quantity: 10, price: 150.50 };
      expect(validateJsonPayload(validPayload, ['ticker', 'quantity', 'price'])).toEqual({ isValid: true });
      
      // Invalid payload - missing field
      const invalidPayload1 = { ticker: 'AAPL', quantity: 10 };
      expect(validateJsonPayload(invalidPayload1, ['ticker', 'quantity', 'price'])).toEqual({ 
        isValid: false, 
        error: 'Missing required field: price' 
      });
      
      // Invalid payload - unexpected field
      const invalidPayload2 = { ticker: 'AAPL', quantity: 10, price: 150.50, malicious: 'script' };
      expect(validateJsonPayload(invalidPayload2, ['ticker', 'quantity', 'price'])).toEqual({ 
        isValid: false, 
        error: 'Unexpected fields: malicious' 
      });
    });
  });
  
  describe('Rate Limiting', () => {
    
    test('should implement basic rate limiting', () => {
      const rateLimiter = {
        requests: new Map(),
        maxRequests: 10,
        windowMs: 60000 // 1 minute
      };
      
      const checkRateLimit = (ip) => {
        const now = Date.now();
        const windowStart = now - rateLimiter.windowMs;
        
        if (!rateLimiter.requests.has(ip)) {
          rateLimiter.requests.set(ip, []);
        }
        
        const requests = rateLimiter.requests.get(ip);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(time => time > windowStart);
        rateLimiter.requests.set(ip, validRequests);
        
        if (validRequests.length >= rateLimiter.maxRequests) {
          return { allowed: false, remaining: 0 };
        }
        
        validRequests.push(now);
        return { allowed: true, remaining: rateLimiter.maxRequests - validRequests.length };
      };
      
      const testIP = '192.168.1.1';
      
      // First 10 requests should be allowed
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(testIP);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9 - i);
      }
      
      // 11th request should be blocked
      const blockedResult = checkRateLimit(testIP);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });
  });
  
  describe('Authentication & Authorization', () => {
    
    test('should validate session tokens', () => {
      const validateSessionToken = (token) => {
        if (!token || typeof token !== 'string') return false;
        
        // Basic token format validation (JWT-like)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return false;
        
        // Check if token is not expired (simplified)
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          const now = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp < now) {
            return false;
          }
          
          return true;
        } catch (error) {
          return false;
        }
      };
      
      // This is a simplified test - in real implementation, you'd use proper JWT validation
      expect(validateSessionToken('')).toBe(false);
      expect(validateSessionToken('invalid.token.format')).toBe(false);
    });
    
    test('should check user permissions', () => {
      const checkPermission = (user, action, resource) => {
        if (!user || !user.permissions) return false;
        
        const requiredPermission = `${action}:${resource}`;
        return user.permissions.includes(requiredPermission);
      };
      
      const user = {
        id: 1,
        permissions: ['read:portfolio', 'write:transactions', 'read:assets']
      };
      
      expect(checkPermission(user, 'read', 'portfolio')).toBe(true);
      expect(checkPermission(user, 'write', 'transactions')).toBe(true);
      expect(checkPermission(user, 'delete', 'portfolio')).toBe(false);
      expect(checkPermission(null, 'read', 'portfolio')).toBe(false);
    });
  });
  
  describe('Data Encryption', () => {
    
    test('should hash sensitive data', () => {
      const crypto = require('crypto');
      
      const hashData = (data, salt = null) => {
        if (!salt) {
          salt = crypto.randomBytes(16).toString('hex');
        }
        
        const hash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512').toString('hex');
        return { hash, salt };
      };
      
      const verifyHash = (data, hash, salt) => {
        const testHash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512').toString('hex');
        return testHash === hash;
      };
      
      const password = 'mySecurePassword123';
      const { hash, salt } = hashData(password);
      
      expect(verifyHash(password, hash, salt)).toBe(true);
      expect(verifyHash('wrongPassword', hash, salt)).toBe(false);
    });
    
    test('should encrypt sensitive database fields', () => {
      const encryptField = (text, secretKey) => {
        const crypto = require('crypto');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey.padEnd(32, '0').slice(0, 32)), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
      };

      const decryptField = (encryptedText, secretKey) => {
        const crypto = require('crypto');
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey.padEnd(32, '0').slice(0, 32)), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      };

      const secretKey = 'my-secret-key-32-chars-long';
      const sensitiveData = 'sensitive-user-data';
      
      const encrypted = encryptField(sensitiveData, secretKey);
      const decrypted = decryptField(encrypted, secretKey);
      
      expect(encrypted).not.toBe(sensitiveData);
      expect(decrypted).toBe(sensitiveData);
      expect(encrypted).toContain(':');
    });
  });
  
  describe('Error Handling', () => {
    
    test('should not expose sensitive information in errors', () => {
      const sanitizeError = (error) => {
        let errorMessage = error.message || error.toString();
        
        // Remove sensitive patterns
        const sensitivePatterns = [
          /password\s*=\s*[^,\s]+/gi,
          /key\s*=\s*[^,\s]+/gi,
          /secret\s*=\s*[^,\s]+/gi,
          /token\s*=\s*[^,\s]+/gi
        ];
        
        sensitivePatterns.forEach(pattern => {
          errorMessage = errorMessage.replace(pattern, '[REDACTED]');
        });
        
        return errorMessage;
      };

      const errorWithSensitiveData = new Error('Database error: password=secret123, key=privateKey456');
      const sanitized = sanitizeError(errorWithSensitiveData);
      
      expect(sanitized).not.toContain('secret123');
      expect(sanitized).not.toContain('privateKey456');
      expect(sanitized).toContain('[REDACTED]');
    });
    
    test('should log security events', () => {
      const securityLogger = {
        events: [],
        logSecurityEvent: function(event) {
          this.events.push({
            timestamp: new Date(),
            event: event,
            ip: event.ip || 'unknown',
            userAgent: event.userAgent || 'unknown'
          });
        }
      };
      
      securityLogger.logSecurityEvent({
        type: 'failed_login',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        details: 'Invalid credentials'
      });
      
      expect(securityLogger.events.length).toBe(1);
      expect(securityLogger.events[0].event.type).toBe('failed_login');
      expect(securityLogger.events[0].ip).toBe('192.168.1.100');
    });
  });
});
