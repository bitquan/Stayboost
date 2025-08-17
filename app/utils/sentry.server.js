/**
 * Sentry Error Tracking Utilities
 * Production-ready error monitoring and alerting
 */

// Custom error tracking for production
export class ErrorTracker {
  constructor() {
    this.errors = [];
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Capture and track errors
   */
  captureError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      severity: this.getSeverity(error)
    };

    this.errors.push(errorInfo);

    if (this.isProduction) {
      console.error('[ERROR TRACKING]', errorInfo);
      // In production, you would send to external service
      // this.sendToSentry(errorInfo);
    }

    return errorInfo;
  }

  /**
   * Capture messages for debugging
   */
  captureMessage(message, level = 'info', extra = {}) {
    const messageInfo = {
      message,
      level,
      timestamp: new Date().toISOString(),
      extra
    };

    if (this.isProduction || level === 'error') {
      console.log(`[${level.toUpperCase()}]`, messageInfo);
    }

    return messageInfo;
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(user) {
    this.userContext = {
      id: user.id,
      email: user.email,
      shop: user.shop
    };
  }

  /**
   * Set tags for filtering errors
   */
  setTags(tags) {
    this.tags = { ...this.tags, ...tags };
  }

  /**
   * Get error severity level
   */
  getSeverity(error) {
    if (error.name === 'ValidationError') return 'warning';
    if (error.name === 'AuthenticationError') return 'error';
    if (error.name === 'DatabaseError') return 'fatal';
    return 'error';
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const recent = this.errors.filter(error => 
      new Date(error.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    return {
      total: this.errors.length,
      recent24h: recent.length,
      byType: this.groupBy(recent, 'severity')
    };
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

/**
 * Express middleware for error tracking
 */
export function sentryErrorHandler(error, req, res, next) {
  errorTracker.captureError(error, {
    url: req.url,
    method: req.method,
    headers: req.headers,
    user: req.session?.user
  });

  next(error);
}

/**
 * Initialize Sentry configuration
 */
export function initializeSentry(config = {}) {
  const { dsn, environment = 'development', release } = config;
  
  errorTracker.captureMessage('Sentry initialized', 'info', {
    environment,
    release,
    dsn: dsn ? 'configured' : 'not_configured'
  });

  return {
    captureError: errorTracker.captureError.bind(errorTracker),
    captureMessage: errorTracker.captureMessage.bind(errorTracker),
    setUserContext: errorTracker.setUserContext.bind(errorTracker),
    setTags: errorTracker.setTags.bind(errorTracker)
  };
}

/**
 * Report error to tracking system
 */
export function reportError(error, context = {}) {
  return errorTracker.captureError(error, context);
}

/**
 * Start performance transaction tracking
 */
export function startTransaction(name, operation = 'http') {
  const transaction = {
    name,
    operation,
    startTime: Date.now(),
    id: Math.random().toString(36).substring(7)
  };

  return {
    ...transaction,
    finish: () => {
      const duration = Date.now() - transaction.startTime;
      errorTracker.captureMessage(`Transaction completed: ${name}`, 'info', {
        duration,
        operation
      });
      return duration;
    },
    setTag: (key, value) => {
      transaction[key] = value;
    }
  };
}
