/**
 * Health Check Routes
 * Production-ready health monitoring endpoints
 */

import { json } from "@remix-run/node";
import { basicHealthCheck, healthCheck } from "../utils/health.server.js";
import { errorTracker } from "../utils/sentry.server.js";

/**
 * Basic health check endpoint
 * GET /health
 */
export async function loader({ request }) {
  try {
    const health = await basicHealthCheck();
    
    if (health.status === 'healthy') {
      return json(health, { status: 200 });
    } else {
      errorTracker.captureMessage('Health check failed', 'warning', health);
      return json(health, { status: 503 });
    }
  } catch (error) {
    errorTracker.captureError(error, { route: '/health' });
    
    return json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 500 });
  }
}

/**
 * Detailed health check for monitoring systems
 * GET /health/detailed
 */
export async function action({ request }) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

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
