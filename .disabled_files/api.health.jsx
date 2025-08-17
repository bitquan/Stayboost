import { json } from "@remix-run/node";
import { HEALTH_CONFIG, healthManager } from "../utils/healthCheck.server";
import { validateRateLimitRequest } from "../utils/inputValidation.server";
import {
    createTimer,
    log,
    LOG_CATEGORIES,
    logError,
    logRequest
} from "../utils/logger.server";
import { checkRateLimit } from "../utils/simpleRateLimit.server";

// Health Check API
export async function loader({ request }) {
  const timer = createTimer('health_check_request', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    // Apply rate limiting (more lenient for health checks)
    const rateLimitResult = await checkRateLimit(request, 'health');
    if (!rateLimitResult.success) {
      return json({ 
        error: "Rate limit exceeded",
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter.toString()
        }
      });
    }

    // Validate request (light validation for health checks)
    try {
      await validateRateLimitRequest(request, {
        maxContentLength: 1024, // 1KB limit for health check requests
        allowedMethods: ['GET']
      });
    } catch (validationError) {
      return json({ 
        error: "Invalid request",
        details: validationError.message
      }, { 
        status: 400 
      });
    }

    // Parse query parameters to determine check type
    const url = new URL(request.url);
    const checkType = url.searchParams.get('type') || 'full';
    const format = url.searchParams.get('format') || 'json';

    timer.checkpoint('starting_health_checks');

    let healthResult;
    
    switch (checkType) {
      case 'quick':
        healthResult = await getQuickHealthCheck(timer, correlationId);
        break;
        
      case 'full':
      case 'comprehensive':
        healthResult = await getFullHealthCheck(timer, correlationId);
        break;
        
      case 'status':
        healthResult = await getHealthStatus(timer, correlationId);
        break;
        
      case 'history':
        healthResult = await getHealthHistory(timer, correlationId);
        break;
        
      default:
        return json({ 
          error: "Invalid check type",
          validTypes: ['quick', 'full', 'comprehensive', 'status', 'history']
        }, { 
          status: 400 
        });
    }

    timer.checkpoint('health_check_completed');

    // Format response based on requested format
    if (format === 'text') {
      return new Response(formatHealthAsText(healthResult), {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Default JSON response
    return json(healthResult, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    timer.checkpoint('health_check_error');
    
    logError('Health check API error', {
      error: error.message,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    return json({
      status: HEALTH_CONFIG.STATUS.CRITICAL,
      error: "Health check system unavailable",
      timestamp: new Date().toISOString(),
      correlationId
    }, { 
      status: 500 
    });
  } finally {
    timer.end('Health check API request completed', {
      correlationId,
      category: LOG_CATEGORIES.API,
    });
  }
}

// POST endpoint for triggering manual health checks
export async function action({ request }) {
  const timer = createTimer('health_check_action', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, 'admin');
    if (!rateLimitResult.success) {
      return json({ 
        error: "Rate limit exceeded",
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429 
      });
    }

    // Validate request
    await validateRateLimitRequest(request, {
      maxContentLength: 2048,
      allowedMethods: ['POST']
    });

    const formData = await request.formData();
    const action = formData.get('action');

    timer.checkpoint('processing_health_action');

    switch (action) {
      case 'run_full_check':
        return await triggerFullHealthCheck(timer, correlationId);
        
      case 'run_quick_check':
        return await triggerQuickHealthCheck(timer, correlationId);
        
      case 'clear_history':
        return await clearHealthHistory(timer, correlationId);
        
      default:
        return json({ 
          error: "Invalid action",
          validActions: ['run_full_check', 'run_quick_check', 'clear_history']
        }, { 
          status: 400 
        });
    }

  } catch (error) {
    logError('Health check action error', {
      error: error.message,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    return json({
      error: "Health check action failed",
      details: error.message
    }, { 
      status: 500 
    });
  } finally {
    timer.end('Health check action completed', {
      correlationId,
      category: LOG_CATEGORIES.API,
    });
  }
}

// Get quick health check (essential services only)
async function getQuickHealthCheck(timer, correlationId) {
  timer.checkpoint('running_quick_health_check');
  
  const result = await healthManager.runQuickCheck();
  
  log.info('Quick health check requested', {
    status: result.status,
    checkTime: result.totalCheckTime,
    correlationId,
    category: LOG_CATEGORIES.API,
  });

  return {
    ...result,
    correlationId,
    endpoint: 'quick'
  };
}

// Get full comprehensive health check
async function getFullHealthCheck(timer, correlationId) {
  timer.checkpoint('running_full_health_check');
  
  const result = await healthManager.runAllChecks();
  
  log.info('Full health check requested', {
    status: result.status,
    checkTime: result.totalCheckTime,
    summary: result.summary,
    correlationId,
    category: LOG_CATEGORIES.API,
  });

  return {
    ...result,
    correlationId,
    endpoint: 'full'
  };
}

// Get last health check status
async function getHealthStatus(timer, correlationId) {
  timer.checkpoint('getting_health_status');
  
  const lastCheck = healthManager.getLastCheck();
  
  if (!lastCheck) {
    // No previous check, run a quick one
    return await getQuickHealthCheck(timer, correlationId);
  }
  
  // Check if last check is too old (> 10 minutes)
  const checkAge = Date.now() - new Date(lastCheck.timestamp).getTime();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  if (checkAge > maxAge) {
    log.info('Last health check too old, running new quick check', {
      lastCheckAge: `${Math.round(checkAge / 1000)}s`,
      maxAge: `${maxAge / 1000}s`,
      correlationId,
      category: LOG_CATEGORIES.API,
    });
    
    return await getQuickHealthCheck(timer, correlationId);
  }
  
  log.info('Health status requested (using cached)', {
    status: lastCheck.status,
    checkAge: `${Math.round(checkAge / 1000)}s`,
    correlationId,
    category: LOG_CATEGORIES.API,
  });

  return {
    ...lastCheck,
    correlationId,
    endpoint: 'status',
    cached: true,
    cacheAge: `${Math.round(checkAge / 1000)}s`
  };
}

// Get health check history
async function getHealthHistory(timer, correlationId) {
  timer.checkpoint('getting_health_history');
  
  const history = healthManager.getHistory(20); // Last 20 checks
  
  log.info('Health history requested', {
    historyCount: history.length,
    correlationId,
    category: LOG_CATEGORIES.API,
  });

  return {
    status: HEALTH_CONFIG.STATUS.HEALTHY,
    timestamp: new Date().toISOString(),
    correlationId,
    endpoint: 'history',
    history: history.map(check => ({
      status: check.status,
      timestamp: check.timestamp,
      totalCheckTime: check.totalCheckTime,
      summary: check.summary,
      correlationId: check.correlationId
    })),
    summary: {
      total: history.length,
      recent: history.slice(-5).map(h => ({
        timestamp: h.timestamp,
        status: h.status
      }))
    }
  };
}

// Trigger manual full health check
async function triggerFullHealthCheck(timer, correlationId) {
  timer.checkpoint('triggering_full_health_check');
  
  log.info('Manual full health check triggered', {
    correlationId,
    category: LOG_CATEGORIES.API,
  });
  
  const result = await healthManager.runAllChecks();
  
  return {
    success: true,
    message: "Full health check completed",
    result,
    correlationId
  };
}

// Trigger manual quick health check
async function triggerQuickHealthCheck(timer, correlationId) {
  timer.checkpoint('triggering_quick_health_check');
  
  log.info('Manual quick health check triggered', {
    correlationId,
    category: LOG_CATEGORIES.API,
  });
  
  const result = await healthManager.runQuickCheck();
  
  return {
    success: true,
    message: "Quick health check completed",
    result,
    correlationId
  };
}

// Clear health check history
async function clearHealthHistory(timer, correlationId) {
  timer.checkpoint('clearing_health_history');
  
  // Clear the history
  healthManager.checkHistory = [];
  
  log.info('Health check history cleared', {
    correlationId,
    category: LOG_CATEGORIES.API,
  });

  return {
    success: true,
    message: "Health check history cleared",
    timestamp: new Date().toISOString(),
    correlationId
  };
}

// Format health result as plain text
function formatHealthAsText(healthResult) {
  let output = '';
  
  output += `StayBoost Health Check Report\n`;
  output += `==============================\n\n`;
  output += `Overall Status: ${healthResult.status.toUpperCase()}\n`;
  output += `Timestamp: ${healthResult.timestamp}\n`;
  output += `Check Time: ${healthResult.totalCheckTime || 'N/A'}\n\n`;
  
  if (healthResult.checks) {
    output += `Individual Checks:\n`;
    output += `------------------\n`;
    
    healthResult.checks.forEach(check => {
      output += `${check.name.replace(/_/g, ' ').toUpperCase()}: ${check.status.toUpperCase()}\n`;
      output += `  Message: ${check.message}\n`;
      output += `  Response Time: ${check.responseTime}ms\n`;
      
      if (check.details && Object.keys(check.details).length > 0) {
        output += `  Details: ${JSON.stringify(check.details, null, 2).replace(/\n/g, '\n    ')}\n`;
      }
      output += `\n`;
    });
  }
  
  if (healthResult.summary) {
    output += `Summary:\n`;
    output += `--------\n`;
    output += `Total Checks: ${healthResult.summary.total}\n`;
    output += `Healthy: ${healthResult.summary.healthy}\n`;
    output += `Warnings: ${healthResult.summary.warning}\n`;
    output += `Critical: ${healthResult.summary.critical}\n`;
    output += `Unknown: ${healthResult.summary.unknown}\n\n`;
  }
  
  if (healthResult.history) {
    output += `Recent History:\n`;
    output += `--------------\n`;
    healthResult.history.slice(-5).forEach(h => {
      output += `${h.timestamp}: ${h.status.toUpperCase()}\n`;
    });
  }
  
  output += `\nGenerated: ${new Date().toISOString()}\n`;
  
  return output;
}
