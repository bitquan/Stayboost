import { json } from "@remix-run/node";
import { getAnalytics, getDashboardStats, recordConversion, recordImpression } from "../models/analytics.server";
import {
  detectSuspiciousInput,
  InputValidator,
  sanitizeShopDomain,
  validateRateLimitRequest,
  ValidationError
} from "../utils/inputValidation.server";
import {
  createTimer,
  log,
  LOG_CATEGORIES,
  logApiCall,
  logBusinessMetric,
  logError,
  logRequest,
  logSecurityEvent
} from "../utils/logger.server";
import { checkRateLimit } from "../utils/simpleRateLimit.server";

// Analytics API endpoint for StayBoost popup tracking

/**
 * Handle analytics data collection and retrieval
 */
export async function loader({ request }) {
  const timer = createTimer('analytics_api_request', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    // Apply rate limiting first
    const rateLimitResult = await checkRateLimit(request, 'public');
    if (rateLimitResult.rateLimited) {
      timer.checkpoint('rate_limit_check');
      
      const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 'unknown';
      logSecurityEvent(`Rate limit exceeded for IP: ${ip}`, 'medium', {
        ip,
        endpoint: '/api/analytics',
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

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const action = url.searchParams.get("action");

    // Enhanced input validation
    if (!shop) {
      timer.checkpoint('validation_failed');
      
      log.warn('Analytics API: Missing shop parameter', {
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
        shop: shop.substring(0, 50),
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
      
      throw error;
    }

    // Validate action parameter if provided
    if (action && detectSuspiciousInput(action, 'general')) {
      timer.checkpoint('action_validation_failed');
      
      logSecurityEvent('Suspicious action parameter detected', 'medium', {
        action: action.substring(0, 50),
        shop: sanitizedShop,
        correlationId,
      });

      const response = json({ 
        error: "Invalid action parameter" 
      }, { 
        status: 400,
        headers: corsHeaders(request)
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    timer.checkpoint('validation_passed');

        // Log business metric - analytics API request
    logBusinessMetric('analytics_api_request', 1, 'count', {
      shop: sanitizedShop,
      action: action || 'default',
      correlationId,
    });

    let result;
    
    try {
      switch (action) {
        case "dashboard":
          // Get dashboard statistics
          const dashboardStats = await getDashboardStats(sanitizedShop);
          timer.checkpoint('dashboard_stats_retrieved');
          
          result = { shop: sanitizedShop, stats: dashboardStats };
          break;

        case "history":
          // Get analytics history with input validation
          const daysParam = url.searchParams.get("days");
          let days = 30; // Default value
          
          if (daysParam) {
            // Validate days parameter
            if (detectSuspiciousInput(daysParam, 'numeric')) {
              logSecurityEvent('Suspicious days parameter detected', 'low', {
                days: daysParam,
                shop: sanitizedShop,
                correlationId,
              });
              
              const response = json({ 
                error: "Invalid days parameter" 
              }, { 
                status: 400,
                headers: corsHeaders(request)
              });
              
              logRequest(request, response, timer.end());
              return response;
            }
            
            days = parseInt(daysParam);
            if (isNaN(days) || days < 1 || days > 365) {
              const response = json({ 
                error: "Days parameter must be between 1 and 365" 
              }, { 
                status: 400,
                headers: corsHeaders(request)
              });
              
              logRequest(request, response, timer.end());
              return response;
            }
          }
          
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          
          const analytics = await getAnalytics(sanitizedShop, {
            start: startDate,
            end: new Date(),
          });
          
          timer.checkpoint('analytics_history_retrieved');
          result = { shop: sanitizedShop, analytics };
          break;

        default:
          // Default: return dashboard stats
          const stats = await getDashboardStats(sanitizedShop);
          timer.checkpoint('default_stats_retrieved');
          
          result = { shop: sanitizedShop, stats };
          break;
      }

      // Sanitize output data
      const sanitizedResult = InputValidator.sanitizeData(result, 'strict');
      timer.checkpoint('output_sanitized');

      log.info('Analytics API: Successfully retrieved data', {
        shop: sanitizedShop,
        action: action || 'default',
        category: LOG_CATEGORIES.BUSINESS,
        correlationId,
      });

      // Log API response success
      logApiCall({
        endpoint: '/api/analytics',
        method: 'GET',
        responseCode: 200,
        responseTime: timer.getTotal(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        correlationId,
      });

      const response = json(sanitizedResult, { 
        headers: corsHeaders(request) 
      });
      
      logRequest(request, response, timer.end());
      return response;

    } catch (error) {
      timer.checkpoint('error_occurred');
      
      logError(error, {
        endpoint: '/api/analytics',
        shop: sanitizedShop,
        action: action || 'default',
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

  } catch (error) {
    timer.checkpoint('validation_error');
    
    logError(error, {
      endpoint: '/api/analytics',
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

/**
 * Handle analytics data recording (POST requests)
 */
export async function action({ request }) {
  const timer = createTimer('analytics_api_action', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    if (request.method !== "POST") {
      timer.checkpoint('method_not_allowed');
      
      const response = json({ error: "Method not allowed" }, { 
        status: 405, 
        headers: corsHeaders(request) 
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, 'analytics');
    if (rateLimitResult.rateLimited) {
      timer.checkpoint('rate_limit_check');
      
      const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 'unknown';
      logSecurityEvent(`Rate limit exceeded for analytics POST: ${ip}`, 'medium', {
        ip,
        endpoint: '/api/analytics',
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

    const body = await request.json();
    timer.checkpoint('body_parsed');
    
    const { shop, type, revenue, popupSettingsId } = body;

    // Enhanced input validation
    if (!shop || !type) {
      timer.checkpoint('validation_failed');
      
      log.warn('Analytics API: Missing required fields', {
        hasShop: !!shop,
        hasType: !!type,
        category: LOG_CATEGORIES.API,
        correlationId,
      });

      const response = json({ 
        error: "Missing required fields: shop, type" 
      }, { 
        status: 400, 
        headers: corsHeaders(request) 
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    // Validate shop domain
    let sanitizedShop;
    try {
      sanitizedShop = sanitizeShopDomain(shop);
    } catch (error) {
      timer.checkpoint('shop_validation_failed');
      
      if (error instanceof ValidationError) {
        log.warn('Invalid shop domain in analytics request', {
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
      
      throw error;
    }

    // Validate type parameter
    const validTypes = ['impression', 'conversion'];
    if (!validTypes.includes(type)) {
      timer.checkpoint('type_validation_failed');
      
      log.warn('Invalid analytics type provided', {
        type,
        shop: sanitizedShop,
        category: LOG_CATEGORIES.API,
        correlationId,
      });

      const response = json({ 
        error: "Invalid type. Use 'impression' or 'conversion'" 
      }, { 
        status: 400, 
        headers: corsHeaders(request) 
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    // Validate revenue for conversion events
    let sanitizedRevenue = 0;
    if (type === 'conversion' && revenue !== undefined) {
      if (typeof revenue !== 'number' || isNaN(revenue) || revenue < 0) {
        timer.checkpoint('revenue_validation_failed');
        
        log.warn('Invalid revenue value in conversion', {
          revenue,
          shop: sanitizedShop,
          category: LOG_CATEGORIES.API,
          correlationId,
        });

        const response = json({ 
          error: "Invalid revenue value" 
        }, { 
          status: 400,
          headers: corsHeaders(request)
        });
        
        logRequest(request, response, timer.end());
        return response;
      }
      sanitizedRevenue = parseFloat(revenue);
    }

    // Validate popupSettingsId if provided
    if (popupSettingsId && (typeof popupSettingsId !== 'string' || popupSettingsId.length > 50)) {
      timer.checkpoint('popup_id_validation_failed');
      
      log.warn('Invalid popupSettingsId provided', {
        popupSettingsId: typeof popupSettingsId === 'string' ? popupSettingsId.substring(0, 20) : popupSettingsId,
        shop: sanitizedShop,
        category: LOG_CATEGORIES.API,
        correlationId,
      });

      const response = json({ 
        error: "Invalid popupSettingsId" 
      }, { 
        status: 400,
        headers: corsHeaders(request)
      });
      
      logRequest(request, response, timer.end());
      return response;
    }

    timer.checkpoint('validation_passed');

    // Log business metric - analytics recording
    logBusinessMetric('analytics_event_recorded', 1, 'count', {
      shop: sanitizedShop,
      type,
      revenue: sanitizedRevenue,
      correlationId,
    });

    let result;

    switch (type) {
      case "impression":
        result = await recordImpression(sanitizedShop, popupSettingsId);
        timer.checkpoint('impression_recorded');
        break;

      case "conversion":
        result = await recordConversion(sanitizedShop, sanitizedRevenue, popupSettingsId);
        timer.checkpoint('conversion_recorded');
        break;
    }

    // Sanitize output data
    const sanitizedResult = {
      success: true,
      shop: sanitizedShop,
      type,
      analytics: InputValidator.sanitizeData(result, 'moderate')
    };
    timer.checkpoint('output_sanitized');

    log.info('Analytics API: Successfully recorded analytics', {
      shop: sanitizedShop,
      type,
      revenue: sanitizedRevenue,
      category: LOG_CATEGORIES.BUSINESS,
      correlationId,
    });

    // Log API response success
    logApiCall({
      endpoint: '/api/analytics',
      method: 'POST',
      responseCode: 200,
      responseTime: timer.getTotal(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      correlationId,
    });

    const response = json(sanitizedResult, { 
      headers: corsHeaders(request) 
    });
    
    logRequest(request, response, timer.end());
    return response;

  } catch (error) {
    timer.checkpoint('error_occurred');
    
    logError(error, {
      endpoint: '/api/analytics',
      method: 'POST',
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

/**
 * CORS headers for cross-origin requests from theme extensions
 */
function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
  };
}

/**
 * Handle preflight OPTIONS requests
 */
export async function options({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

/**
 * Cache control headers for analytics data
 */
export function headers() {
  return {
    // Analytics data can be cached briefly
    "Cache-Control": "max-age=60, s-maxage=120, stale-while-revalidate=300",
  };
}
