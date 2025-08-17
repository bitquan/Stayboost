import { reportError } from "./sentry.server.js";

// Security headers configuration
export const securityHeaders = {
  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.shopify.com https://*.myshopify.com wss://*.myshopify.com",
    "frame-src https://*.myshopify.com https://cdn.shopify.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.myshopify.com",
  ].join('; '),
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

// Environment-specific security headers
export const developmentHeaders = {
  ...securityHeaders,
  // Relax CSP for development
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://cdn.jsdelivr.net http://localhost:* ws://localhost:*",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.shopify.com https://*.myshopify.com wss://*.myshopify.com http://localhost:* ws://localhost:*",
    "frame-src https://*.myshopify.com https://cdn.shopify.com http://localhost:*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.myshopify.com",
  ].join('; '),
};

// HTTPS enforcement middleware
export function enforceHTTPS(request) {
  try {
    const url = new URL(request.url);
    const proto = request.headers.get('x-forwarded-proto') || url.protocol;
    
    // Skip HTTPS enforcement in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Redirect to HTTPS if not already secure
    if (proto !== 'https:') {
      const httpsUrl = url.toString().replace(/^http:/, 'https:');
      return new Response(null, {
        status: 301,
        headers: {
          Location: httpsUrl,
          ...getSecurityHeaders(),
        },
      });
    }
    
    return null; // No redirect needed
  } catch (error) {
    reportError(error, { action: 'enforceHTTPS', url: request.url });
    return null; // Allow request on error
  }
}

// Get appropriate security headers based on environment
export function getSecurityHeaders() {
  return process.env.NODE_ENV === 'production' 
    ? securityHeaders 
    : developmentHeaders;
}

// Apply security headers to response
export function withSecurityHeaders(response) {
  try {
    const headers = getSecurityHeaders();
    const newHeaders = new Headers(response.headers);
    
    // Add security headers
    Object.entries(headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    // Return new response with security headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    reportError(error, { action: 'withSecurityHeaders' });
    return response; // Return original response on error
  }
}

// Security middleware for Remix routes
export function withSecurity() {
  return {
    enforceHTTPS,
    withSecurityHeaders,
    getSecurityHeaders,
  };
}

// Validate and sanitize request data
export function validateRequest(request) {
  try {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Block known bad user agents
    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /masscan/i,
      /python-requests/i,
      /curl/i,
      /wget/i,
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      reportError(new Error('Suspicious user agent detected'), {
        userAgent,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        url: request.url,
      });
      
      return {
        blocked: true,
        reason: 'Suspicious user agent',
      };
    }
    
    // Validate URL length
    if (url.toString().length > 2048) {
      return {
        blocked: true,
        reason: 'URL too long',
      };
    }
    
    // Check for common attack patterns in URL
    const attackPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /\.\.\/\.\.\//,
      /etc\/passwd/i,
      /wp-admin/i,
      /phpMyAdmin/i,
    ];
    
    const hasAttackPattern = attackPatterns.some(pattern => 
      pattern.test(url.toString()) || 
      pattern.test(decodeURIComponent(url.toString()))
    );
    
    if (hasAttackPattern) {
      reportError(new Error('Attack pattern detected in URL'), {
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent,
      });
      
      return {
        blocked: true,
        reason: 'Attack pattern detected',
      };
    }
    
    return { blocked: false };
  } catch (error) {
    reportError(error, { action: 'validateRequest', url: request.url });
    return { blocked: false }; // Allow request on error
  }
}

// Security response helper
export function createSecurityResponse(message = 'Access denied', status = 403) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
      },
    }
  );
}

// Combined security middleware
export async function applySecurity(request) {
  try {
    // 1. Validate request
    const validation = validateRequest(request);
    if (validation.blocked) {
      return createSecurityResponse(`Request blocked: ${validation.reason}`, 403);
    }
    
    // 2. Enforce HTTPS
    const httpsRedirect = enforceHTTPS(request);
    if (httpsRedirect) {
      return httpsRedirect;
    }
    
    return null; // Security checks passed
  } catch (error) {
    reportError(error, { action: 'applySecurity', url: request.url });
    return null; // Allow request on error
  }
}
