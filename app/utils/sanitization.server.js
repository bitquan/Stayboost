import validator from 'validator';
import { reportError } from './sentry.server.js';

// Use dynamic import for JSDOM-dependent packages
let DOMPurify, xss;

async function initializeSanitizers() {
  try {
    if (typeof window === 'undefined') {
      // Server-side: Use JSDOM
      const { JSDOM } = await import('jsdom');
      const window = new JSDOM('').window;
      const DOMPurifyModule = await import('dompurify');
      DOMPurify = DOMPurifyModule.default(window);
    } else {
      // Client-side: Use window directly
      const DOMPurifyModule = await import('dompurify');
      DOMPurify = DOMPurifyModule.default;
    }
    
    const xssModule = await import('xss');
    xss = xssModule.default;
  } catch (error) {
    reportError(error, { action: 'initializeSanitizers' });
    // Fallback sanitization methods will be used
  }
}

// Initialize sanitizers
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initializeSanitizers();
    initialized = true;
  }
}

// Basic sanitization without external dependencies
function basicSanitize(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// HTML sanitization
export async function sanitizeHTML(input, options = {}) {
  try {
    await ensureInitialized();
    
    if (!input || typeof input !== 'string') {
      return input;
    }
    
    // Use DOMPurify if available
    if (DOMPurify) {
      const config = {
        ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'br', 'p'],
        ALLOWED_ATTR: options.allowedAttributes || [],
        KEEP_CONTENT: true,
        ...options.domPurifyConfig,
      };
      
      return DOMPurify.sanitize(input, config);
    }
    
    // Fallback to basic sanitization
    return basicSanitize(input);
  } catch (error) {
    reportError(error, { action: 'sanitizeHTML', input: input.substring(0, 100) });
    return basicSanitize(input);
  }
}

// XSS protection
export async function sanitizeXSS(input, options = {}) {
  try {
    await ensureInitialized();
    
    if (!input || typeof input !== 'string') {
      return input;
    }
    
    // Use xss library if available
    if (xss) {
      const xssOptions = {
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script'],
        allowCommentTag: false,
        ...options.xssConfig,
      };
      
      return xss(input, xssOptions);
    }
    
    // Fallback to basic sanitization
    return basicSanitize(input);
  } catch (error) {
    reportError(error, { action: 'sanitizeXSS', input: input.substring(0, 100) });
    return basicSanitize(input);
  }
}

// Input validation and sanitization
export const inputValidation = {
  // Email validation and sanitization
  email: (input) => {
    if (!input || typeof input !== 'string') return null;
    const normalized = validator.normalizeEmail(input);
    return validator.isEmail(normalized) ? normalized : null;
  },

  // URL validation and sanitization
  url: (input) => {
    if (!input || typeof input !== 'string') return null;
    try {
      const url = new URL(input);
      return validator.isURL(input) && ['http:', 'https:'].includes(url.protocol) ? input : null;
    } catch {
      return null;
    }
  },

  // Shopify domain validation
  shopifyDomain: (input) => {
    if (!input || typeof input !== 'string') return null;
    const sanitized = input.toLowerCase().trim();
    return /^[a-z0-9-]+\.myshopify\.com$/.test(sanitized) ? sanitized : null;
  },

  // Discount code validation (alphanumeric with some special chars)
  discountCode: (input) => {
    if (!input || typeof input !== 'string') return null;
    const sanitized = input.toUpperCase().trim();
    return /^[A-Z0-9_-]{1,50}$/.test(sanitized) ? sanitized : null;
  },

  // Numeric validation
  number: (input, options = {}) => {
    const num = Number(input);
    if (isNaN(num)) return null;
    
    const { min, max, integer = false } = options;
    
    if (integer && !Number.isInteger(num)) return null;
    if (min !== undefined && num < min) return null;
    if (max !== undefined && num > max) return null;
    
    return num;
  },

  // Boolean validation
  boolean: (input) => {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      const lower = input.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) return true;
      if (['false', '0', 'no', 'off'].includes(lower)) return false;
    }
    return null;
  },

  // Text sanitization (for user content)
  text: async (input, options = {}) => {
    if (!input || typeof input !== 'string') return '';
    
    const { maxLength = 1000, allowHTML = false } = options;
    
    let sanitized = input.trim().substring(0, maxLength);
    
    if (allowHTML) {
      sanitized = await sanitizeHTML(sanitized, options);
    } else {
      sanitized = await sanitizeXSS(sanitized, options);
    }
    
    return sanitized;
  },

  // JSON validation and sanitization
  json: (input) => {
    if (typeof input === 'object') return input;
    if (typeof input !== 'string') return null;
    
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  },
};

// Sanitize object recursively
export async function sanitizeObject(obj, schema = {}) {
  try {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fieldSchema = schema[key] || { type: 'text' };
      
      switch (fieldSchema.type) {
        case 'email':
          sanitized[key] = inputValidation.email(value);
          break;
        case 'url':
          sanitized[key] = inputValidation.url(value);
          break;
        case 'shopifyDomain':
          sanitized[key] = inputValidation.shopifyDomain(value);
          break;
        case 'discountCode':
          sanitized[key] = inputValidation.discountCode(value);
          break;
        case 'number':
          sanitized[key] = inputValidation.number(value, fieldSchema.options);
          break;
        case 'boolean':
          sanitized[key] = inputValidation.boolean(value);
          break;
        case 'json':
          sanitized[key] = inputValidation.json(value);
          break;
        case 'text':
        default:
          sanitized[key] = await inputValidation.text(value, fieldSchema.options);
          break;
      }
    }
    
    return sanitized;
  } catch (error) {
    reportError(error, { action: 'sanitizeObject' });
    return obj;
  }
}

// Form data sanitization schema for StayBoost
export const stayBoostSchemas = {
  popupSettings: {
    enabled: { type: 'boolean' },
    title: { type: 'text', options: { maxLength: 100, allowHTML: false } },
    message: { type: 'text', options: { maxLength: 500, allowHTML: false } },
    discountCode: { type: 'discountCode' },
    discountPercentage: { type: 'number', options: { min: 1, max: 100, integer: true } },
    delaySeconds: { type: 'number', options: { min: 0, max: 60, integer: true } },
    showOnce: { type: 'boolean' },
  },
  
  analyticsData: {
    shop: { type: 'shopifyDomain' },
    event: { type: 'text', options: { maxLength: 50, allowHTML: false } },
    timestamp: { type: 'number', options: { min: 0 } },
    metadata: { type: 'json' },
  },
};

// Middleware for sanitizing request data
export async function sanitizeRequest(request, schema = {}) {
  try {
    const url = new URL(request.url);
    
    // Sanitize query parameters
    const sanitizedParams = {};
    for (const [key, value] of url.searchParams.entries()) {
      const fieldSchema = schema[key] || { type: 'text' };
      sanitizedParams[key] = await inputValidation.text(value, fieldSchema.options);
    }
    
    // Sanitize body data for POST/PUT requests
    let sanitizedBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const formData = await request.formData();
        const bodyData = Object.fromEntries(formData.entries());
        sanitizedBody = await sanitizeObject(bodyData, schema);
      } catch {
        // Try JSON
        try {
          const jsonData = await request.json();
          sanitizedBody = await sanitizeObject(jsonData, schema);
        } catch {
          // Body parsing failed, continue without sanitization
        }
      }
    }
    
    return {
      params: sanitizedParams,
      body: sanitizedBody,
    };
  } catch (error) {
    reportError(error, { action: 'sanitizeRequest', url: request.url });
    return { params: {}, body: null };
  }
}

// Validation middleware for Remix routes
export function withInputSanitization(schema = {}) {
  return async (request) => {
    try {
      const sanitized = await sanitizeRequest(request, schema);
      return sanitized;
    } catch (error) {
      reportError(error, { action: 'withInputSanitization' });
      return { params: {}, body: null };
    }
  };
}
