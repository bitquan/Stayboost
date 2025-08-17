/**
 * Liveness Health Check Route
 * Checks if the app is still alive and functioning
 */

import { json } from "@remix-run/node";
import { livenessCheck } from "../utils/health.server.js";
import { errorTracker } from "../utils/sentry.server.js";

/**
 * Liveness check endpoint
 * GET /health/live
 */
export async function loader({ request }) {
  try {
    const liveness = await livenessCheck();
    
    if (liveness.alive) {
      return json(liveness, { status: 200 });
    } else {
      errorTracker.captureMessage('Liveness check failed', 'critical', liveness);
      return json(liveness, { status: 503 });
    }
  } catch (error) {
    errorTracker.captureError(error, { route: '/health/live' });
    
    return json({
      alive: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed'
    }, { status: 500 });
  }
}
