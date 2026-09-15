/**
 * Unit Tests for Security Utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sanitize,
  RateLimiter,
  CSRFProtection,
  PasswordValidator,
  SessionSecurity,
  AuditLogger,
  SecurityCheck,
} from '../src/core/utils/security';

describe('Security Utilities', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('sanitize', () => {
    describe('string', () => {
      it('should remove HTML tags', () => {
        expect(sanitize.string('<script>alert("xss")</script>')).toBe('alert("xss")');
      });

      it('should remove javascript: protocol', () => {
        expect(sanitize.string('javascript:alert("xss")')).toBe('alert("xss")');
      });

      it('should remove event handlers', () => {
        expect(sanitize.string('<div onclick="alert()">test</div>')).toBe('<div>test</div>');
      });

      it('should trim whitespace', () => {
        expect(sanitize.string('  test  ')).toBe('test');
      });
    });

    describe('html', () => {
      it('should escape HTML entities', () => {
        expect(sanitize.html('<script>alert("xss")</script>')).toBe(
          '&lt;script&gt;alert("xss")&lt;/script&gt;'
        );
      });
    });

    describe('url', () => {
      it('should allow http URLs', () => {
        expect(sanitize.url('http://example.com')).toBe('http://example.com/');
      });

      it('should allow https URLs', () => {
        expect(sanitize.url('https://example.com')).toBe('https://example.com/');
      });

      it('should allow mailto URLs', () => {
        expect(sanitize.url('mailto:test@example.com')).toBe('mailto:test@example.com');
      });

      it('should reject javascript URLs', () => {
        expect(sanitize.url('javascript:alert()')).toBe('');
      });

      it('should reject invalid URLs', () => {
        expect(sanitize.url('not-a-url')).toBe('');
      });
    });

    describe('email', () => {
      it('should validate correct emails', () => {
        expect(sanitize.email('user@example.com')).toBe('user@example.com');
      });

      it('should convert to lowercase', () => {
        expect(sanitize.email('User@Example.COM')).toBe('user@example.com');
      });

      it('should trim whitespace', () => {
        expect(sanitize.email('  user@example.com  ')).toBe('user@example.com');
      });

      it('should reject invalid emails', () => {
        expect(sanitize.email('invalid-email')).toBe('');
        expect(sanitize.email('user@')).toBe('');
        expect(sanitize.email('@example.com')).toBe('');
      });
    });

    describe('number', () => {
      it('should parse valid numbers', () => {
        expect(sanitize.number('123')).toBe(123);
        expect(sanitize.number('123.45')).toBe(123.45);
        expect(sanitize.number(123)).toBe(123);
      });

      it('should return 0 for invalid numbers', () => {
        expect(sanitize.number('abc')).toBe(0);
        expect(sanitize.number('')).toBe(0);
      });
    });

    describe('filename', () => {
      it('should remove special characters', () => {
        expect(sanitize.filename('file<>.txt')).toBe('file.txt');
      });

      it('should remove leading dots', () => {
        expect(sanitize.filename('..file.txt')).toBe('file.txt');
      });

      it('should limit length to 255 characters', () => {
        const longName = 'a'.repeat(300) + '.txt';
        expect(sanitize.filename(longName).length).toBe(255);
      });
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 3,
        message: 'Rate limit exceeded',
      });

      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 2,
        message: 'Rate limit exceeded',
      });

      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should reset after window expires', () => {
      vi.useFakeTimers();
      
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 1,
        message: 'Rate limit exceeded',
      });

      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(false);

      vi.advanceTimersByTime(1000);

      expect(limiter.isAllowed('user1')).toBe(true);

      vi.useRealTimers();
    });

    it('should track remaining requests', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 3,
        message: 'Rate limit exceeded',
      });

      expect(limiter.getRemaining('user1')).toBe(3);
      limiter.isAllowed('user1');
      expect(limiter.getRemaining('user1')).toBe(2);
      limiter.isAllowed('user1');
      expect(limiter.getRemaining('user1')).toBe(1);
    });

    it('should reset specific user', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 1,
        message: 'Rate limit exceeded',
      });

      limiter.isAllowed('user1');
      expect(limiter.isAllowed('user1')).toBe(false);

      limiter.reset('user1');
      expect(limiter.isAllowed('user1')).toBe(true);
    });
  });

  describe('CSRFProtection', () => {
    it('should generate CSRF token', () => {
      const token = CSRFProtection.generateToken();
      expect(token).toBeTruthy();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should store token in sessionStorage', () => {
      const token = CSRFProtection.generateToken();
      expect(sessionStorage.getItem('csrf_token')).toBe(token);
    });

    it('should retrieve stored token', () => {
      const token = CSRFProtection.generateToken();
      expect(CSRFProtection.getToken()).toBe(token);
    });

    it('should validate correct token', () => {
      const token = CSRFProtection.generateToken();
      expect(CSRFProtection.validateToken(token)).toBe(true);
    });

    it('should reject incorrect token', () => {
      CSRFProtection.generateToken();
      expect(CSRFProtection.validateToken('wrong-token')).toBe(false);
    });

    it('should apply token to headers', () => {
      const token = CSRFProtection.generateToken();
      const headers = new Headers();
      
      CSRFProtection.applyToRequest(headers);
      
      expect(headers.get('X-CSRF-Token')).toBe(token);
    });
  });

  describe('PasswordValidator', () => {
    it('should validate strong password', () => {
      const result = PasswordValidator.validate('StrongP@ssw0rd!');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = PasswordValidator.validate('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should require uppercase letter', () => {
      const result = PasswordValidator.validate('lowercase123!@#');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const result = PasswordValidator.validate('UPPERCASE123!@#');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const result = PasswordValidator.validate('NoNumbers!@#');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special character', () => {
      const result = PasswordValidator.validate('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should detect common passwords', () => {
      expect(PasswordValidator.isCommonPassword('password')).toBe(true);
      expect(PasswordValidator.isCommonPassword('123456')).toBe(true);
      expect(PasswordValidator.isCommonPassword('UniqueP@ssw0rd!')).toBe(false);
    });

    it('should calculate password strength', () => {
      const weak = PasswordValidator.validate('weak');
      expect(weak.strength).toBe('weak');

      const medium = PasswordValidator.validate('Medium1!');
      expect(medium.strength).toBe('medium');

      const strong = PasswordValidator.validate('StrongP@ssw0rd!');
      expect(strong.strength).toBe('strong');
    });
  });

  describe('SessionSecurity', () => {
    it('should detect expired session', () => {
      const expiredTime = Date.now() - 1000;
      expect(SessionSecurity.isSessionExpired(expiredTime)).toBe(true);
    });

    it('should detect valid session', () => {
      const validTime = Date.now() + 1000;
      expect(SessionSecurity.isSessionExpired(validTime)).toBe(false);
    });

    it('should extend session', () => {
      const currentExpiry = Date.now();
      const extension = 3600000; // 1 hour
      const newExpiry = SessionSecurity.extendSession(currentExpiry, extension);
      
      expect(newExpiry).toBe(currentExpiry + extension);
    });

    it('should validate session data', () => {
      const validSession = {
        userId: 'user1',
        expiry: Date.now() + 1000,
      };
      expect(SessionSecurity.validateSession(validSession)).toBe(true);

      const invalidSession = {
        userId: 'user1',
        expiry: Date.now() - 1000,
      };
      expect(SessionSecurity.validateSession(invalidSession)).toBe(false);

      const missingData = {
        expiry: Date.now() + 1000,
      };
      expect(SessionSecurity.validateSession(missingData)).toBe(false);
    });

    it('should clear session data', () => {
      sessionStorage.setItem('test', 'data');
      localStorage.setItem('auth_token', 'token');
      
      SessionSecurity.clearSession();
      
      expect(sessionStorage.getItem('test')).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('AuditLogger', () => {
    it('should log security events', () => {
      AuditLogger.log({
        type: 'authentication',
        userId: 'user1',
        action: 'login_success',
      });

      const logs = AuditLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('authentication');
      expect(logs[0].userId).toBe('user1');
      expect(logs[0].action).toBe('login_success');
      expect(logs[0].timestamp).toBeTruthy();
    });

    it('should keep only last 1000 entries', () => {
      for (let i = 0; i < 1100; i++) {
        AuditLogger.log({
          type: 'test',
          action: `action_${i}`,
        });
      }

      const logs = AuditLogger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('should clear logs', () => {
      AuditLogger.log({
        type: 'test',
        action: 'test_action',
      });

      AuditLogger.clearLogs();

      expect(AuditLogger.getLogs()).toHaveLength(0);
    });

    it('should export logs as JSON', () => {
      AuditLogger.log({
        type: 'test',
        action: 'test_action',
      });

      const exported = AuditLogger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('test');
    });
  });

  describe('SecurityCheck', () => {
    it('should check secure context', () => {
      const result = SecurityCheck.isSecureContext();
      expect(typeof result).toBe('boolean');
    });

    it('should check cookies enabled', () => {
      const result = SecurityCheck.areCookiesEnabled();
      expect(typeof result).toBe('boolean');
    });

    it('should check browser security features', () => {
      const result = SecurityCheck.checkBrowserSecurity();
      
      expect(result).toHaveProperty('secureContext');
      expect(result).toHaveProperty('cookiesEnabled');
      expect(result).toHaveProperty('https');
      expect(result).toHaveProperty('serviceWorker');
    });
  });
});
