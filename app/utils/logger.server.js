import { AsyncLocalStorage } from 'async_hooks';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Request context storage for tracing
export const requestContext = new AsyncLocalStorage();

// Enhanced log levels with custom priorities
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
};

// Custom log categories for better organization
export const LOG_CATEGORIES = {
  API: 'api',
  AUTH: 'auth',
  DATABASE: 'database',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  USER: 'user',
  SYSTEM: 'system',
  BUSINESS: 'business',
  ERROR: 'error',
  AUDIT: 'audit'
};

// Enhanced log format with correlation IDs and context
const enhancedLogFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const context = requestContext.getStore();
    const baseLog = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      category: info.category || 'general',
      ...info
    };

    // Add request context if available
    if (context) {
      baseLog.requestId = context.requestId;
      baseLog.userId = context.userId;
      baseLog.shop = context.shop;
      baseLog.userAgent = context.userAgent;
      baseLog.ip = context.ip;
    }

    return JSON.stringify(baseLog);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');

// Transport configurations
const transports = [];

// Console transport for development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
} else {
  // Minimal console logging for production
  transports.push(
    new winston.transports.Console({
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// File transports for production and development
transports.push(
  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: enhancedLogFormat,
  }),

  // Combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: enhancedLogFormat,
  }),

  // HTTP access logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'access-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '7d',
    format: enhancedLogFormat,
    filter: (info) => info.category === LOG_CATEGORIES.API,
  }),

  // Security & audit logs (longer retention)
  new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d',
    level: 'info',
    format: enhancedLogFormat,
    filter: (info) => info.category === LOG_CATEGORIES.SECURITY || info.category === LOG_CATEGORIES.AUDIT,
  }),

  // Performance logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'performance-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: enhancedLogFormat,
    filter: (info) => info.category === LOG_CATEGORIES.PERFORMANCE,
  }),

  // Database logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'database-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: enhancedLogFormat,
    filter: (info) => info.category === LOG_CATEGORIES.DATABASE,
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: winston.config.npm.levels,
  format: enhancedLogFormat,
  transports,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: enhancedLogFormat,
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: enhancedLogFormat,
    })
  ],
  exitOnError: false,
});

// Enhanced logging utility functions with categories and context
export const log = {
  // Error logging with enhanced context
  error: (message, meta = {}) => {
    logger.error(message, {
      ...meta,
      category: meta.category || LOG_CATEGORIES.ERROR,
      timestamp: new Date().toISOString(),
      level: 'error',
    });
  },

  // Warning logging
  warn: (message, meta = {}) => {
    logger.warn(message, {
      ...meta,
      category: meta.category || 'general',
      timestamp: new Date().toISOString(),
      level: 'warn',
    });
  },

  // Info logging
  info: (message, meta = {}) => {
    logger.info(message, {
      ...meta,
      category: meta.category || 'general',
      timestamp: new Date().toISOString(),
      level: 'info',
    });
  },

  // HTTP request logging
  http: (message, meta = {}) => {
    logger.http(message, {
      ...meta,
      category: LOG_CATEGORIES.API,
      timestamp: new Date().toISOString(),
      level: 'http',
    });
  },

  // Debug logging
  debug: (message, meta = {}) => {
    logger.debug(message, {
      ...meta,
      category: meta.category || 'general',
      timestamp: new Date().toISOString(),
      level: 'debug',
    });
  },

  // Performance logging with timing
  performance: (operation, duration, meta = {}) => {
    logger.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...meta,
      operation,
      duration,
      category: LOG_CATEGORIES.PERFORMANCE,
      performanceLog: true,
      timestamp: new Date().toISOString(),
    });
  },

  // Security event logging (high priority)
  security: (event, meta = {}) => {
    logger.warn(`Security Event: ${event}`, {
      ...meta,
      category: LOG_CATEGORIES.SECURITY,
      securityEvent: true,
      severity: meta.severity || 'medium',
      timestamp: new Date().toISOString(),
      level: 'warn',
    });
  },

  // Audit logging for compliance
  audit: (action, user, resource, meta = {}) => {
    logger.info(`Audit: ${action} by ${user} on ${resource}`, {
      ...meta,
      category: LOG_CATEGORIES.AUDIT,
      action,
      user,
      resource,
      auditLog: true,
      timestamp: new Date().toISOString(),
    });
  },

  // Business logic logging
  business: (event, meta = {}) => {
    logger.info(`Business Event: ${event}`, {
      ...meta,
      category: LOG_CATEGORIES.BUSINESS,
      businessEvent: true,
      timestamp: new Date().toISOString(),
    });
  },

  // User activity logging
  user: (action, userId, meta = {}) => {
    logger.info(`User Activity: ${action} by ${userId}`, {
      ...meta,
      category: LOG_CATEGORIES.USER,
      action,
      userId,
      userActivity: true,
      timestamp: new Date().toISOString(),
    });
  },

  // System events
  system: (event, meta = {}) => {
    logger.info(`System: ${event}`, {
      ...meta,
      category: LOG_CATEGORIES.SYSTEM,
      systemEvent: true,
      timestamp: new Date().toISOString(),
    });
  },

  // API request/response logging with correlation IDs
  api: {
    request: (method, url, meta = {}) => {
      logger.http(`API Request: ${method} ${url}`, {
        ...meta,
        method,
        url,
        type: 'request',
        category: LOG_CATEGORIES.API,
        timestamp: new Date().toISOString(),
      });
    },

    response: (method, url, statusCode, duration, meta = {}) => {
      const level = statusCode >= 500 ? 'error' : 
                   statusCode >= 400 ? 'warn' : 'http';
      
      logger[level](`API Response: ${method} ${url} ${statusCode} (${duration}ms)`, {
        ...meta,
        method,
        url,
        statusCode,
        duration,
        type: 'response',
        category: LOG_CATEGORIES.API,
        timestamp: new Date().toISOString(),
      });
    },

    rateLimited: (ip, endpoint, meta = {}) => {
      logger.warn(`Rate Limit Exceeded: ${ip} on ${endpoint}`, {
        ...meta,
        ip,
        endpoint,
        type: 'rate_limit',
        category: LOG_CATEGORIES.SECURITY,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Database operation logging with performance tracking
  database: {
    query: (operation, table, duration, meta = {}) => {
      const level = duration > 1000 ? 'warn' : 'debug'; // Warn if query takes >1s
      
      logger[level](`Database: ${operation} on ${table} (${duration}ms)`, {
        ...meta,
        operation,
        table,
        duration,
        type: 'database_query',
        category: LOG_CATEGORIES.DATABASE,
        timestamp: new Date().toISOString(),
      });
    },

    error: (operation, table, error, meta = {}) => {
      logger.error(`Database Error: ${operation} on ${table}`, {
        ...meta,
        operation,
        table,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
        type: 'database_error',
        category: LOG_CATEGORIES.DATABASE,
        timestamp: new Date().toISOString(),
      });
    },

    connection: (event, meta = {}) => {
      logger.info(`Database Connection: ${event}`, {
        ...meta,
        event,
        type: 'database_connection',
        category: LOG_CATEGORIES.DATABASE,
        timestamp: new Date().toISOString(),
      });
    },

    migration: (migration, status, meta = {}) => {
      logger.info(`Database Migration: ${migration} ${status}`, {
        ...meta,
        migration,
        status,
        type: 'database_migration',
        category: LOG_CATEGORIES.DATABASE,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Shopify API logging with shop context
  shopify: {
    request: (endpoint, shop, meta = {}) => {
      logger.info(`Shopify API: ${endpoint} for ${shop}`, {
        ...meta,
        endpoint,
        shop,
        type: 'shopify_api_request',
        category: LOG_CATEGORIES.API,
        timestamp: new Date().toISOString(),
      });
    },

    response: (endpoint, shop, statusCode, duration, meta = {}) => {
      const level = statusCode >= 400 ? 'warn' : 'info';
      
      logger[level](`Shopify API Response: ${endpoint} for ${shop} ${statusCode} (${duration}ms)`, {
        ...meta,
        endpoint,
        shop,
        statusCode,
        duration,
        type: 'shopify_api_response',
        category: LOG_CATEGORIES.API,
        timestamp: new Date().toISOString(),
      });
    },

    webhook: (topic, shop, meta = {}) => {
      logger.info(`Shopify Webhook: ${topic} from ${shop}`, {
        ...meta,
        topic,
        shop,
        type: 'shopify_webhook',
        category: LOG_CATEGORIES.API,
        timestamp: new Date().toISOString(),
      });
    },

    error: (operation, shop, error, meta = {}) => {
      logger.error(`Shopify Error: ${operation} for ${shop}`, {
        ...meta,
        operation,
        shop,
        error: {
          message: error.message,
          status: error.status,
          stack: error.stack,
        },
        type: 'shopify_error',
        category: LOG_CATEGORIES.ERROR,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Authentication and authorization logging
  auth: {
    login: (userId, method, meta = {}) => {
      logger.info(`Authentication: Login ${userId} via ${method}`, {
        ...meta,
        userId,
        method,
        type: 'auth_login',
        category: LOG_CATEGORIES.AUTH,
        timestamp: new Date().toISOString(),
      });
    },

    logout: (userId, meta = {}) => {
      logger.info(`Authentication: Logout ${userId}`, {
        ...meta,
        userId,
        type: 'auth_logout',
        category: LOG_CATEGORIES.AUTH,
        timestamp: new Date().toISOString(),
      });
    },

    failed: (identifier, reason, meta = {}) => {
      logger.warn(`Authentication Failed: ${identifier} - ${reason}`, {
        ...meta,
        identifier,
        reason,
        type: 'auth_failed',
        category: LOG_CATEGORIES.SECURITY,
        timestamp: new Date().toISOString(),
      });
    },

    sessionExpired: (userId, meta = {}) => {
      logger.info(`Authentication: Session expired for ${userId}`, {
        ...meta,
        userId,
        type: 'auth_session_expired',
        category: LOG_CATEGORIES.AUTH,
        timestamp: new Date().toISOString(),
      });
    },
  },
};

// Enhanced request logging middleware for Remix with correlation IDs
export function logRequest(request, response = null, duration = null) {
  const url = new URL(request.url);
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 'unknown';
  const shop = url.searchParams.get('shop') || 'unknown';
  const correlationId = request.headers.get('x-correlation-id') || 
                        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const logData = {
    method,
    url: url.pathname + url.search,
    userAgent,
    ip,
    shop,
    correlationId,
    requestSize: request.headers.get('content-length') || 0,
    contentType: request.headers.get('content-type') || 'unknown',
    origin: request.headers.get('origin') || 'unknown',
    referer: request.headers.get('referer') || 'unknown',
  };

  // Set request context for tracing
  const context = {
    requestId: correlationId,
    userId: null, // Will be set by auth middleware
    shop,
    userAgent,
    ip,
  };

  if (response) {
    const responseSize = response.headers?.get?.('content-length') || 0;
    log.api.response(method, url.pathname, response.status, duration, {
      ...logData,
      responseSize,
      cacheStatus: response.headers?.get?.('x-cache') || 'unknown',
    });
  } else {
    // Store context for request
    requestContext.enterWith(context);
    log.api.request(method, url.pathname, logData);
  }

  return correlationId;
}

// Enhanced error logging with structured data and context
export function logError(error, context = {}) {
  const errorData = {
    ...context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      cause: error.cause,
    },
    category: context.category || LOG_CATEGORIES.ERROR,
  };

  // Add request context if available
  const reqContext = requestContext.getStore();
  if (reqContext) {
    errorData.requestId = reqContext.requestId;
    errorData.shop = reqContext.shop;
  }

  log.error(error.message || 'Unknown error', errorData);
}

// Enhanced performance timing utility with categorization
export function createTimer(operation = 'unknown', category = LOG_CATEGORIES.PERFORMANCE) {
  const start = process.hrtime.bigint();
  const startTime = Date.now();
  
  return {
    end: (meta = {}) => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      // Log slow operations as warnings
      const level = duration > 5000 ? 'warn' : 'info';
      const message = duration > 5000 ? 
        `Slow Operation: ${operation} took ${duration}ms` :
        `${operation} completed`;
      
      log[level](message, {
        ...meta,
        operation,
        duration,
        startTime,
        endTime: Date.now(),
        category,
        performanceLog: true,
      });
      
      return duration;
    },
    
    checkpoint: (checkpointName, meta = {}) => {
      const checkpoint = process.hrtime.bigint();
      const duration = Number(checkpoint - start) / 1000000;
      
      log.debug(`Checkpoint: ${operation} - ${checkpointName}`, {
        ...meta,
        operation,
        checkpoint: checkpointName,
        duration,
        category,
        checkpointLog: true,
      });
      
      return duration;
    },
  };
}

// Request context utilities for correlation tracking
export function withRequestContext(requestId, shop, userAgent, ip, fn) {
  const context = { requestId, shop, userAgent, ip };
  return requestContext.run(context, fn);
}

export function getCurrentRequestContext() {
  return requestContext.getStore();
}

export function generateCorrelationId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Security logging helpers
export function logSecurityEvent(event, severity = 'medium', meta = {}) {
  log.security(event, {
    ...meta,
    severity,
    securityEvent: true,
    timestamp: new Date().toISOString(),
  });
}

export function logSuspiciousActivity(activity, ip, meta = {}) {
  logSecurityEvent(`Suspicious Activity: ${activity} from ${ip}`, 'high', {
    ...meta,
    ip,
    activity,
    suspiciousActivity: true,
  });
}

// Business metrics logging
export function logBusinessMetric(metric, value, unit = '', meta = {}) {
  log.business(`Metric: ${metric} = ${value}${unit}`, {
    ...meta,
    metric,
    value,
    unit,
    businessMetric: true,
    timestamp: new Date().toISOString(),
  });
}

// Rate limiting logging
export function logRateLimitEvent(event, ip, endpoint, meta = {}) {
  log.api.rateLimited(ip, endpoint, {
    ...meta,
    event,
    rateLimitEvent: true,
    timestamp: new Date().toISOString(),
  });
}

// Database query logging helper
export function logDatabaseQuery(operation, table, startTime) {
  const duration = Date.now() - startTime;
  log.database.query(operation, table, duration, {
    slowQuery: duration > 1000,
    queryTime: startTime,
  });
  return duration;
}

// Context logging for request tracing
export class LogContext {
  constructor(requestId, shop = null) {
    this.requestId = requestId;
    this.shop = shop;
    this.context = { requestId, shop };
  }

  log(level, message, meta = {}) {
    log[level](message, { ...this.context, ...meta });
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  addContext(additionalContext) {
    this.context = { ...this.context, ...additionalContext };
  }
}

export default logger;
