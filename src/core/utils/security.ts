/**
 * Security Hardening Utilities
 * 
 * Security middleware and utilities for production hardening.
 */

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https:', 'wss:'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_CONFIG)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': generateCSPHeader(),
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

/**
 * Input sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize string input
   */
  string(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Sanitize HTML content
   */
  html(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  /**
   * Sanitize URL
   */
  url(input: string): string {
    try {
      const url = new URL(input);
      // Only allow http, https, and mailto protocols
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  /**
   * Sanitize email
   */
  email(input: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input) ? input.toLowerCase().trim() : '';
  },

  /**
   * Sanitize number
   */
  number(input: string | number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    return isNaN(num) ? 0 : num;
  },

  /**
   * Sanitize filename
   */
  filename(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255); // Limit length
  },
};

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const record = this.requests.get(key);
    if (!record) return this.config.maxRequests;
    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static TOKEN_KEY = 'csrf_token';

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(this.TOKEN_KEY, token);
    return token;
  }

  /**
   * Get current CSRF token
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token;
  }

  /**
   * Apply CSRF token to request
   */
  static applyToRequest(headers: Headers): void {
    const token = this.getToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }
}

/**
 * Secure storage wrapper
 */
export class SecureStorage {
  private static ENCRYPTION_KEY = 'nexora_encryption_key';

  /**
   * Encrypt data
   */
  private static async encrypt(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Simple XOR encryption for demo (use proper encryption in production)
    const key = this.ENCRYPTION_KEY;
    const encrypted = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
      encrypted[i] = dataBuffer[i] ^ key.charCodeAt(i % key.length);
    }
    
    return btoa(String.fromCharCode(...encrypted));
  }

  /**
   * Decrypt data
   */
  private static async decrypt(encryptedData: string): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const key = this.ENCRYPTION_KEY;
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ key.charCodeAt(i % key.length);
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Set secure item
   */
  static async setItem(key: string, value: any): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(value));
    localStorage.setItem(`secure_${key}`, encrypted);
  }

  /**
   * Get secure item
   */
  static async getItem<T>(key: string): Promise<T | null> {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;
    
    try {
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  /**
   * Remove secure item
   */
  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  /**
   * Check if session is expired
   */
  static isSessionExpired(expiryTime: number): boolean {
    return Date.now() > expiryTime;
  }

  /**
   * Extend session
   */
  static extendSession(currentExpiry: number, extensionMs: number): number {
    return currentExpiry + extensionMs;
  }

  /**
   * Validate session integrity
   */
  static validateSession(sessionData: any): boolean {
    if (!sessionData || !sessionData.userId || !sessionData.expiry) {
      return false;
    }
    
    if (this.isSessionExpired(sessionData.expiry)) {
      return false;
    }
    
    return true;
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    sessionStorage.clear();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
}

/**
 * Password strength validator
 */
export class PasswordValidator {
  static readonly MIN_LENGTH = 12;
  static readonly REQUIRE_UPPERCASE = true;
  static readonly REQUIRE_LOWERCASE = true;
  static readonly REQUIRE_NUMBERS = true;
  static readonly REQUIRE_SPECIAL = true;

  /**
   * Validate password strength
   */
  static validate(password: string): {
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 0;

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else {
      score += 1;
    }

    if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (this.REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (this.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

    return {
      valid: errors.length === 0,
      strength,
      errors,
    };
  }

  /**
   * Check if password is in common passwords list
   */
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password1', '123456789', '12345', '1234', '111111',
      '1234567', 'dragon', '123123', 'baseball', 'iloveyou',
    ];
    return commonPasswords.includes(password.toLowerCase());
  }
}

/**
 * Audit logger for security events
 */
export class AuditLogger {
  private static LOG_KEY = 'security_audit_log';

  /**
   * Log security event
   */
  static log(event: {
    type: string;
    userId?: string;
    action: string;
    resource?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    const logs = this.getLogs();
    logs.push(logEntry);

    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
  }

  /**
   * Get audit logs
   */
  static getLogs(): any[] {
    const logs = localStorage.getItem(this.LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  }

  /**
   * Clear audit logs
   */
  static clearLogs(): void {
    localStorage.removeItem(this.LOG_KEY);
  }

  /**
   * Export audit logs
   */
  static exportLogs(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }
}

/**
 * Security check utilities
 */
export class SecurityCheck {
  /**
   * Check if running in secure context
   */
  static isSecureContext(): boolean {
    return window.isSecureContext;
  }

  /**
   * Check if cookies are enabled
   */
  static areCookiesEnabled(): boolean {
    return navigator.cookieEnabled;
  }

  /**
   * Check browser security features
   */
  static checkBrowserSecurity(): {
    secureContext: boolean;
    cookiesEnabled: boolean;
    https: boolean;
    serviceWorker: boolean;
  } {
    return {
      secureContext: this.isSecureContext(),
      cookiesEnabled: this.areCookiesEnabled(),
      https: window.location.protocol === 'https:',
      serviceWorker: 'serviceWorker' in navigator,
    };
  }
}
