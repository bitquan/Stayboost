/**
 * Detailed Health Check Route
 * Provides comprehensive health information for monitoring systems
 */

import { json } from "@remix-run/node";
import { healthCheck } from "../utils/health.server.js";
import { errorTracker } from "../utils/sentry.server.js";

/**
 * Detailed health check endpoint
 * GET /health/detailed
 */
export async function loader({ request }) {
  try {
    const detailedHealth = await healthCheck.getDetailedStatus();
    
    return json({
      ...detailedHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    errorTracker.captureError(error, { route: '/health/detailed' });
    
    return json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    }, { status: 500 });
  }
}
