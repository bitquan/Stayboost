/**
 * Readiness Health Check Route
 * Checks if the app is ready to accept requests
 */

import { json } from "@remix-run/node";
import { readinessCheck } from "../utils/health.server.js";
import { errorTracker } from "../utils/sentry.server.js";

/**
 * Readiness check endpoint
 * GET /health/ready
 */
export async function loader({ request }) {
  try {
    const readiness = await readinessCheck();
    
    if (readiness.ready) {
      return json(readiness, { status: 200 });
    } else {
      errorTracker.captureMessage('Readiness check failed', 'warning', readiness);
      return json(readiness, { status: 503 });
    }
  } catch (error) {
    errorTracker.captureError(error, { route: '/health/ready' });
    
    return json({
      ready: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    }, { status: 500 });
  }
}
