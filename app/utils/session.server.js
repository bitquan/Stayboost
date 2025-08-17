import { json } from "@remix-run/node";
import { reportError } from "./sentry.server.js";

// Session timeout configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes before expiry

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.warningTimers = new Map();
    this.timeoutTimers = new Map();
  }

  // Create or update session
  createSession(sessionId, shopify) {
    try {
      const now = Date.now();
      const expiresAt = now + SESSION_TIMEOUT;
      
      // Clear existing timers
      this.clearSessionTimers(sessionId);
      
      // Store session data
      this.sessions.set(sessionId, {
        shopify,
        createdAt: now,
        lastActivity: now,
        expiresAt,
        warningShown: false,
      });

      // Set warning timer (5 minutes before expiry)
      const warningTimer = setTimeout(() => {
        this.showTimeoutWarning(sessionId);
      }, SESSION_TIMEOUT - WARNING_TIMEOUT);
      
      this.warningTimers.set(sessionId, warningTimer);

      // Set expiry timer
      const timeoutTimer = setTimeout(() => {
        this.expireSession(sessionId);
      }, SESSION_TIMEOUT);
      
      this.timeoutTimers.set(sessionId, timeoutTimer);

      return { success: true, expiresAt };
    } catch (error) {
      reportError(error, { action: "createSession", sessionId });
      return { success: false, error: "Failed to create session" };
    }
  }

  // Update session activity
  updateActivity(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: "Session not found" };
      }

      const now = Date.now();
      session.lastActivity = now;
      session.expiresAt = now + SESSION_TIMEOUT;
      session.warningShown = false;

      // Reset timers
      this.clearSessionTimers(sessionId);
      this.createSession(sessionId, session.shopify);

      return { success: true, expiresAt: session.expiresAt };
    } catch (error) {
      reportError(error, { action: "updateActivity", sessionId });
      return { success: false, error: "Failed to update session" };
    }
  }

  // Check if session is valid
  isValidSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    const now = Date.now();
    return now < session.expiresAt;
  }

  // Get session data
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !this.isValidSession(sessionId)) {
      this.expireSession(sessionId);
      return null;
    }
    return session;
  }

  // Show timeout warning
  showTimeoutWarning(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && !session.warningShown) {
      session.warningShown = true;
      // In a real implementation, this would trigger a client-side notification
      console.log(`Session ${sessionId} will expire in 5 minutes`);
    }
  }

  // Expire session
  expireSession(sessionId) {
    try {
      this.clearSessionTimers(sessionId);
      this.sessions.delete(sessionId);
      console.log(`Session ${sessionId} has expired`);
    } catch (error) {
      reportError(error, { action: "expireSession", sessionId });
    }
  }

  // Clear session timers
  clearSessionTimers(sessionId) {
    const warningTimer = this.warningTimers.get(sessionId);
    const timeoutTimer = this.timeoutTimers.get(sessionId);
    
    if (warningTimer) {
      clearTimeout(warningTimer);
      this.warningTimers.delete(sessionId);
    }
    
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      this.timeoutTimers.delete(sessionId);
    }
  }

  // Get session status for client
  getSessionStatus(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { valid: false };
    }

    const now = Date.now();
    const timeRemaining = session.expiresAt - now;
    const showWarning = timeRemaining <= WARNING_TIMEOUT;

    return {
      valid: true,
      expiresAt: session.expiresAt,
      timeRemaining,
      showWarning,
      lastActivity: session.lastActivity,
    };
  }

  // Cleanup expired sessions (should be called periodically)
  cleanup() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now >= session.expiresAt) {
        this.expireSession(sessionId);
      }
    }
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  sessionManager.cleanup();
}, 5 * 60 * 1000);

// Session timeout middleware
export async function requireValidSession(request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session");
    
    if (!sessionId) {
      return json({ error: "No session ID provided" }, { status: 401 });
    }

    const sessionStatus = sessionManager.getSessionStatus(sessionId);
    if (!sessionStatus.valid) {
      return json({ error: "Session expired", code: "SESSION_EXPIRED" }, { status: 401 });
    }

    // Update activity
    sessionManager.updateActivity(sessionId);

    return null; // Session is valid
  } catch (error) {
    reportError(error, { action: "requireValidSession" });
    return json({ error: "Session validation failed" }, { status: 500 });
  }
}
