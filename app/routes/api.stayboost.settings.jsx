/**
 * StayBoost Popup Settings API
 * Provides public CORS-enabled endpoint for theme extension
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive API endpoint tests
 * - [ ] Test CORS configuration with different origins
 * - [ ] Create rate limiting integration tests
 * - [ ] Test error handling for invalid shop domains
 * - [ ] Add E2E tests with actual theme extension
 * - [ ] Test security validation and sanitization
 * - [ ] Validate performance under high load
 * - [ ] Test caching mechanisms
 * - [ ] Integration with monitoring and alerting
 * - [ ] Test API versioning and backward compatibility
 */

import { json } from "@remix-run/node";
import { getPopupSettings } from "../models/popupSettings.server";
import {
  applySecurity,
  detectSuspiciousInput,
  InputValidator,
  sanitizeShopDomain,
  validateRateLimitRequest,
  ValidationError,
  withInputSanitization,
  withSecurityHeaders
} from "../utils/inputValidation.server";
import {
  createTimer,
  log,
  LOG_CATEGORIES,
  logBusinessMetric,
  logError,
  logRequest,
  logSecurityEvent
} from "../utils/logger.server";
import { checkRateLimit } from "../utils/simpleRateLimit.server";

// CORS headers function
function corsHeaders(request) {
  const origin = request.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "600",
  };
}

// Internal handler function for processing settings requests
async function handleSettingsRequest({ request }) {
  const timer = createTimer('settings_api_request', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    // Apply rate limiting first
    const rateLimitResult = await checkRateLimit(request, 'public');
    if (rateLimitResult.rateLimited) {
      timer.checkpoint('rate_limit_check');
      
      // Log rate limiting event
      const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 'unknown';
      logSecurityEvent(`Rate limit exceeded for IP: ${ip}`, 'medium', {
        ip,
        endpoint: '/api/stayboost/settings',
        userAgent: request.headers.get('user-agent'),
        correlationId,
      });

      const response = json(rateLimitResult.message, { 
        status: rateLimitResult.status,
        headers: corsHeaders(request)
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    timer.checkpoint('rate_limit_passed');

    // Apply comprehensive security checks
    const securityResult = applySecurity(request);
    if (!securityResult.passed) {
      timer.checkpoint('security_check_failed');
      
      logSecurityEvent(`Security check failed: ${securityResult.errors.join(', ')}`, 'high', {
        errors: securityResult.errors,
        warnings: securityResult.warnings,
        endpoint: '/api/stayboost/settings',
        correlationId,
      });

      const response = json(
        { error: 'Security validation failed' }, 
        { 
          status: 403,
          headers: corsHeaders(request)
        }
      );
      
      logRequest(request, response, timer.end());
      return response;
    }

    timer.checkpoint('security_check_passed');

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    // Enhanced input validation
    if (!shop) {
      timer.checkpoint('validation_failed');
      
      log.warn('Settings API: Missing shop parameter', {
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        category: LOG_CATEGORIES.API,
        correlationId,
      });

      const response = json({ 
        error: "Missing shop parameter" 
      }, { 
        status: 400,
        headers: corsHeaders(request)
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    // Validate request for suspicious patterns
    const requestValidation = validateRateLimitRequest(request);
    if (!requestValidation.isValid) {
      timer.checkpoint('request_validation_failed');
      
      logSecurityEvent('Invalid request detected', 'medium', {
        errors: requestValidation.errors,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
        correlationId,
      });
    }

    // Check for suspicious input in shop parameter
    if (detectSuspiciousInput(shop, 'shop')) {
      timer.checkpoint('suspicious_input_detected');
      
      logSecurityEvent('Suspicious shop parameter detected', 'high', {
        shop: shop.substring(0, 50), // Truncate for security
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        correlationId,
      });

      const response = json({ 
        error: "Invalid shop parameter" 
      }, { 
        status: 400,
        headers: corsHeaders(request)
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    // Sanitize and validate shop domain
    let sanitizedShop;
    try {
      sanitizedShop = sanitizeShopDomain(shop);
    } catch (error) {
      timer.checkpoint('shop_validation_failed');
      
      if (error instanceof ValidationError) {
        log.warn('Invalid shop domain provided', {
          shop: shop.substring(0, 50),
          error: error.message,
          category: LOG_CATEGORIES.SECURITY,
          correlationId,
        });

        const response = json({ 
          error: "Invalid shop domain format" 
        }, { 
          status: 400,
          headers: corsHeaders(request)
        });
        
        logRequest(request, response, timer.end());
        return response;
      }
      
      throw error; // Re-throw unexpected errors
    }

    timer.checkpoint('validation_passed');

    // Log business metric - API request for shop
    logBusinessMetric('settings_api_request', 1, 'count', {
      shop: sanitizedShop,
      correlationId,
    });

    const settings = await getPopupSettings(sanitizedShop);
    timer.checkpoint('settings_retrieved');

    log.info('Settings API: Successfully retrieved settings', {
      shop: sanitizedShop,
      enabled: settings.enabled,
      category: LOG_CATEGORIES.BUSINESS,
      correlationId,
    });

    // Validate and sanitize output data
    const sanitizedSettings = InputValidator.sanitizePopupSettings(settings);
    timer.checkpoint('output_sanitized');

    // Log API response success
    log.info('API call completed successfully', {
      endpoint: '/api/stayboost/settings',
      method: 'GET',
      responseCode: 200,
      responseTime: timer.getTotal(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    const response = json(sanitizedSettings, {
      headers: corsHeaders(request)
    });
    
    // Apply security headers
    withSecurityHeaders(response);
    
    logRequest(request, response, timer.end());
    return response;
    
  } catch (error) {
    timer.checkpoint('error_occurred');
    
    logError(error, {
      endpoint: '/api/stayboost/settings',
      shop: new URL(request.url).searchParams.get("shop"),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    const response = json({ 
      error: "Internal server error" 
    }, { 
      status: 500,
      headers: corsHeaders(request)
    });
    
    logRequest(request, response, timer.end());
    return response;
  }
}

// Handle preflight OPTIONS requests and other methods
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(request)
    });
  }

  // Log unsupported method attempt
  console.warn(`Unsupported method ${request.method} attempted on settings endpoint`);

  return json(
    { error: "Method not allowed" },
    { 
      status: 405,
      headers: corsHeaders(request)
    }
  );
}

// Public endpoint: returns settings for a given shop (with input sanitization)
export async function loader({ request }) {
  // Apply input sanitization
  const sanitizedHandler = withInputSanitization(handleSettingsRequest);
  return await sanitizedHandler({ request });
}

// Cache headers for better performance
export function headers() {
  return {
    "Cache-Control": "max-age=60, s-maxage=300, stale-while-revalidate=600",
  };
}
