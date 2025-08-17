// Enhanced Input Validation and Sanitization Utilities
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { log, LOG_CATEGORIES } from './logger.server.js';

// Initialize DOMPurify for server-side use
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

// Validation error types
export class ValidationError extends Error {
  constructor(message, field, value, code) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.code = code;
  }
}

// Sanitization options
export const SANITIZATION_LEVELS = {
  STRICT: 'strict',
  MODERATE: 'moderate',
  MINIMAL: 'minimal',
};

// Input validation rules
export const VALIDATION_RULES = {
  // Shop domain validation
  SHOP_DOMAIN: {
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}\.myshopify\.com$/,
    maxLength: 70,
    minLength: 10,
    required: true,
  },
  
  // Popup title validation
  POPUP_TITLE: {
    maxLength: 100,
    minLength: 1,
    required: true,
    allowedChars: /^[a-zA-Z0-9\s!?.,'"()-]+$/,
  },
  
  // Popup message validation
  POPUP_MESSAGE: {
    maxLength: 500,
    minLength: 1,
    required: true,
    allowedChars: /^[a-zA-Z0-9\s!?.,'"()%$+=:;-]+$/,
  },
  
  // Discount code validation
  DISCOUNT_CODE: {
    maxLength: 20,
    minLength: 2,
    required: true,
    pattern: /^[A-Z0-9]+$/,
  },
  
  // Percentage validation
  PERCENTAGE: {
    min: 1,
    max: 99,
    required: true,
    type: 'number',
  },
  
  // Delay seconds validation
  DELAY_SECONDS: {
    min: 0,
    max: 30,
    required: true,
    type: 'number',
  },
  
  // Boolean validation
  BOOLEAN: {
    required: true,
    type: 'boolean',
  },
  
  // Email validation
  EMAIL: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    maxLength: 254,
    required: false,
  },
  
  // URL validation
  URL: {
    pattern: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?$/,
    maxLength: 2000,
    required: false,
  },
  
  // IP Address validation (IPv4 and IPv6 - simplified)
  IP_ADDRESS: {
    pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[0-9a-fA-F:]+$/,
    required: false,
  },
  
  // User Agent validation (more permissive for legitimate browsers/apps)
  USER_AGENT: {
    maxLength: 1000,
    minLength: 1,
    required: false,
    allowedChars: /^[a-zA-Z0-9\s();,./+=:[\]_-]+$/,
  },
  
  // API Key validation
  API_KEY: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 10,
    maxLength: 100,
    required: true,
  },
  
  // Session ID validation
  SESSION_ID: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 16,
    maxLength: 128,
    required: true,
  },
};

// Enhanced validator class
export class InputValidator {
  constructor(options = {}) {
    this.strict = options.strict || false;
    this.logValidationErrors = options.logValidationErrors !== false;
    this.sanitizationLevel = options.sanitizationLevel || SANITIZATION_LEVELS.MODERATE;
  }

  // Validate a single field
  validateField(value, rule, fieldName) {
    const errors = [];
    
    // Handle null/undefined values
    if (value === null || value === undefined || value === '') {
      if (rule.required) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !rule.required, errors, sanitizedValue: value };
    }

    let sanitizedValue = value;

    // Type validation
    if (rule.type) {
      if (rule.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`${fieldName} must be a valid number`);
        } else {
          sanitizedValue = numValue;
        }
      } else if (rule.type === 'boolean') {
        if (typeof value === 'string') {
          sanitizedValue = value.toLowerCase() === 'true';
        } else if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
        }
      }
    }

    // String validations
    if (typeof value === 'string') {
      // Length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }

      // Character allowlist validation
      if (rule.allowedChars && !rule.allowedChars.test(value)) {
        errors.push(`${fieldName} contains invalid characters`);
      }

      // Sanitize string
      sanitizedValue = this.sanitizeString(value, fieldName);
    }

    // Number validations
    if (rule.type === 'number' && typeof sanitizedValue === 'number') {
      if (rule.min !== undefined && sanitizedValue < rule.min) {
        errors.push(`${fieldName} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && sanitizedValue > rule.max) {
        errors.push(`${fieldName} must be no more than ${rule.max}`);
      }
    }

    // Custom validation function
    if (rule.customValidator) {
      try {
        const customResult = rule.customValidator(sanitizedValue, fieldName);
        if (customResult !== true) {
          errors.push(customResult || `${fieldName} failed custom validation`);
        }
      } catch (error) {
        errors.push(`${fieldName} validation error: ${error.message}`);
      }
    }

    const isValid = errors.length === 0;

    // Log validation errors if enabled
    if (!isValid && this.logValidationErrors) {
      log.warn('Input validation failed', {
        field: fieldName,
        value: value,
        errors: errors,
        category: LOG_CATEGORIES.SECURITY,
        validationFailure: true,
      });
    }

    return { isValid, errors, sanitizedValue };
  }

  // Validate multiple fields
  validateFields(data, rules) {
    const results = {};
    const allErrors = [];
    const sanitizedData = {};
    let isValid = true;

    for (const [fieldName, rule] of Object.entries(rules)) {
      const value = data[fieldName];
      const result = this.validateField(value, rule, fieldName);
      
      results[fieldName] = result;
      sanitizedData[fieldName] = result.sanitizedValue;
      
      if (!result.isValid) {
        isValid = false;
        allErrors.push(...result.errors.map(error => ({ field: fieldName, message: error })));
      }
    }

    return {
      isValid,
      errors: allErrors,
      fieldResults: results,
      sanitizedData,
    };
  }

  // Sanitize string based on level
  sanitizeString(input, fieldName) {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    // Basic sanitization
    sanitized = sanitized.trim();

    // Apply DOMPurify based on sanitization level
    switch (this.sanitizationLevel) {
      case SANITIZATION_LEVELS.STRICT:
        // Strip all HTML and special characters
        sanitized = domPurify.sanitize(sanitized, { 
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true,
        });
        // Remove any remaining HTML entities
        sanitized = sanitized.replace(/&[#\w]+;/g, '');
        break;

      case SANITIZATION_LEVELS.MODERATE:
        // Allow safe text formatting but remove scripts and dangerous elements
        sanitized = domPurify.sanitize(sanitized, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true,
        });
        break;

      case SANITIZATION_LEVELS.MINIMAL:
        // Only remove obviously dangerous content
        sanitized = domPurify.sanitize(sanitized, {
          FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
          FORBID_ATTR: ['onerror', 'onload', 'onclick'],
        });
        break;
    }

    // Additional specific sanitizations
    if (fieldName === 'discountCode') {
      sanitized = sanitized.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (fieldName === 'shop') {
      sanitized = sanitized.toLowerCase();
    }

    return sanitized;
  }

  // Validate popup settings specifically
  validatePopupSettings(data) {
    const rules = {
      enabled: VALIDATION_RULES.BOOLEAN,
      title: VALIDATION_RULES.POPUP_TITLE,
      message: VALIDATION_RULES.POPUP_MESSAGE,
      discountCode: VALIDATION_RULES.DISCOUNT_CODE,
      discountPercentage: VALIDATION_RULES.PERCENTAGE,
      delaySeconds: VALIDATION_RULES.DELAY_SECONDS,
      showOnce: VALIDATION_RULES.BOOLEAN,
    };

    return this.validateFields(data, rules);
  }

  // Validate shop domain
  validateShopDomain(shop) {
    return this.validateField(shop, VALIDATION_RULES.SHOP_DOMAIN, 'shop');
  }

  // Validate API request data
  validateApiRequest(data, rules) {
    // Add common API validation rules
    const apiRules = {
      ...rules,
      // Add request-specific validations
      userAgent: VALIDATION_RULES.USER_AGENT,
    };

    return this.validateFields(data, apiRules);
  }
}

// Pre-configured validators for different contexts
export const strictValidator = new InputValidator({
  strict: true,
  sanitizationLevel: SANITIZATION_LEVELS.STRICT,
  logValidationErrors: true,
});

export const moderateValidator = new InputValidator({
  strict: false,
  sanitizationLevel: SANITIZATION_LEVELS.MODERATE,
  logValidationErrors: true,
});

export const minimalValidator = new InputValidator({
  strict: false,
  sanitizationLevel: SANITIZATION_LEVELS.MINIMAL,
  logValidationErrors: true,
});

// Utility functions for common validations
export function sanitizeShopDomain(shop) {
  if (!shop || typeof shop !== 'string') return null;
  
  const sanitized = shop.toLowerCase().trim();
  const result = strictValidator.validateShopDomain(sanitized);
  
  if (!result.isValid) {
    throw new ValidationError(
      `Invalid shop domain: ${result.errors.join(', ')}`,
      'shop',
      shop,
      'INVALID_SHOP_DOMAIN'
    );
  }
  
  return result.sanitizedValue;
}

export function sanitizePopupSettings(settings) {
  const result = moderateValidator.validatePopupSettings(settings);
  
  if (!result.isValid) {
    const errorMessage = result.errors.map(e => `${e.field}: ${e.message}`).join(', ');
    throw new ValidationError(
      `Invalid popup settings: ${errorMessage}`,
      'settings',
      settings,
      'INVALID_POPUP_SETTINGS'
    );
  }
  
  return result.sanitizedData;
}

// Rate limiting specific validation
export function validateRateLimitRequest(request) {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            request.headers.get('cf-connecting-ip') || 'unknown';
  
  const userAgent = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  
  const data = {
    ip,
    userAgent,
    method: request.method,
    pathname: url.pathname,
  };
  
  const rules = {
    ip: { ...VALIDATION_RULES.IP_ADDRESS, required: false },
    userAgent: VALIDATION_RULES.USER_AGENT,
    method: { pattern: /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/, required: true },
    pathname: { maxLength: 1000, required: true },
  };
  
  return minimalValidator.validateFields(data, rules);
}

// Security-focused validation for suspicious patterns
export function detectSuspiciousInput(input, fieldName) {
  if (typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /import\s*\(/gi,
    /eval\s*\(/gi,
    /function\s*\(/gi,
    /\${.*}/gi, // Template literals
    /<%.*%>/gi, // Server-side includes
    /__.*__/gi, // Magic methods
    /\.\.\//gi, // Path traversal
    /\/etc\/passwd/gi,
    /\/proc\//gi,
    /cmd\s*=/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      log.security('Suspicious input detected', {
        field: fieldName,
        input: input.substring(0, 100), // Truncate for security
        pattern: pattern.toString(),
        category: LOG_CATEGORIES.SECURITY,
        severity: 'high',
      });
      return true;
    }
  }
  
  return false;
}

// SQL injection detection
export function detectSQLInjection(input) {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(\b(or|and)\s+\d+\s*=\s*\d+)/gi,
    /('|(\\x27)|(\\x2D\\x2D)|(\\')|(\\"))/gi,
    /(\b(sleep|benchmark|waitfor)\s*\()/gi,
    /(\/\*.*?\*\/)/gi,
    /(-{2,})/gi,
    /(\bxp_\w+)/gi,
    /(\bsp_\w+)/gi,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      log.security('Potential SQL injection detected', {
        input: input.substring(0, 100),
        pattern: pattern.toString(),
        category: LOG_CATEGORIES.SECURITY,
        severity: 'critical',
      });
      return true;
    }
  }
  
  return false;
}

// XSS detection
export function detectXSS(input) {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>.*?<\/form>/gi,
    /on\w+\s*=\s*["'].*?["']/gi,
    /javascript:\s*[^\s]*/gi,
    /vbscript:\s*[^\s]*/gi,
    /data:text\/html/gi,
    /expression\s*\(/gi,
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      log.security('Potential XSS attack detected', {
        input: input.substring(0, 100),
        pattern: pattern.toString(),
        category: LOG_CATEGORIES.SECURITY,
        severity: 'high',
      });
      return true;
    }
  }
  
  return false;
}

// Comprehensive security validation
export function validateAndSanitizeSecurely(input, fieldName, rules) {
  // First check for obviously malicious content
  if (detectSuspiciousInput(input, fieldName) || 
      detectSQLInjection(input) || 
      detectXSS(input)) {
    throw new ValidationError(
      `Potentially malicious input detected in ${fieldName}`,
      fieldName,
      'REDACTED',
      'SECURITY_VIOLATION'
    );
  }
  
  // Then apply normal validation and sanitization
  return strictValidator.validateField(input, rules, fieldName);
}

/**
 * Enhanced security middleware functions for API routes
 */

/**
 * General input sanitization function
 * @param {string} input - Input to sanitize
 * @param {string} level - Sanitization level
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, level = SANITIZATION_LEVELS.MODERATE) {
  if (!input || typeof input !== 'string') {
    return input;
  }

  let sanitized = input.trim();

  switch (level) {
    case SANITIZATION_LEVELS.STRICT:
      sanitized = domPurify.sanitize(sanitized, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
      break;
    case SANITIZATION_LEVELS.MODERATE:
      sanitized = domPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
      break;
    case SANITIZATION_LEVELS.MINIMAL:
      sanitized = domPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: ['class'],
        KEEP_CONTENT: true
      });
      break;
  }

  return sanitized;
}

/**
 * Add security headers to response
 * @param {Response} response - The response object
 * @param {Object} options - Security header options
 * @returns {Response} Response with security headers
 */
export function withSecurityHeaders(response, options = {}) {
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    ...options.customHeaders
  };

  // Apply security headers to the response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Apply comprehensive security checks to request
 * @param {Request} request - The incoming request
 * @param {Object} options - Security options
 * @returns {Object} Security check results
 */
export function applySecurity(request, options = {}) {
  const securityResults = {
    passed: true,
    checks: {},
    warnings: [],
    errors: []
  };

  try {
    // Check request headers for security issues
    const userAgent = request.headers.get('user-agent') || '';
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    // Detect suspicious user agents
    if (userAgent.length === 0 || userAgent.length > 1000) {
      securityResults.warnings.push('Suspicious user agent');
    }

    // Check for common attack patterns
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /burp/i,
      /nessus/i,
      /masscan/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      securityResults.errors.push('Potential security scanner detected');
      securityResults.passed = false;
    }

    // Validate origin if provided
    if (origin && !isValidOrigin(origin)) {
      securityResults.warnings.push('Suspicious origin header');
    }

    securityResults.checks = {
      userAgent: { status: 'checked', value: userAgent.substring(0, 100) },
      origin: { status: 'checked', value: origin },
      referer: { status: 'checked', value: referer.substring(0, 100) }
    };

    return securityResults;
  } catch (error) {
    securityResults.passed = false;
    securityResults.errors.push(`Security check failed: ${error.message}`);
    return securityResults;
  }
}

/**
 * Enhanced input sanitization wrapper
 * @param {Function} handler - The route handler function
 * @returns {Function} Wrapped handler with input sanitization
 */
export function withInputSanitization(handler) {
  return async (request, ...args) => {
    try {
      // Apply input sanitization to common request data
      const url = new URL(request.url);
      const searchParams = new URLSearchParams();

      // Sanitize URL parameters
      for (const [key, value] of url.searchParams.entries()) {
        const sanitizedValue = sanitizeInput(value, SANITIZATION_LEVELS.MODERATE);
        searchParams.append(key, sanitizedValue);
      }

      // Create sanitized request-like object
      const sanitizedRequest = {
        ...request,
        url: `${url.origin}${url.pathname}?${searchParams.toString()}`,
        headers: request.headers,
        method: request.method
      };

      // Call original handler with sanitized request
      return await handler(sanitizedRequest, ...args);
    } catch (error) {
      log.error('Input sanitization failed', {
        error: error.message,
        url: request.url,
        category: LOG_CATEGORIES.SECURITY
      });
      throw error;
    }
  };
}

/**
 * Validate origin header
 * @param {string} origin - Origin header value
 * @returns {boolean} True if origin is valid
 */
function isValidOrigin(origin) {
  try {
    const url = new URL(origin);
    // Allow local development and HTTPS origins
    return url.protocol === 'https:' || 
           url.hostname === 'localhost' || 
           url.hostname.startsWith('127.0.0.1') ||
           url.hostname.endsWith('.myshopify.com');
  } catch {
    return false;
  }
}

export default InputValidator;
