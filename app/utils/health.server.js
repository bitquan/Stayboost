/**
 * Health Check Utilities
 * Production-ready health monitoring system
 */

import prisma from "../db.server.js";

class HealthCheck {
  constructor() {
    this.startTime = new Date();
    this.checks = new Map();
  }

  /**
   * Get basic health status
   */
  async getStatus() {
    try {
      const dbHealth = await this.checkDatabase();
      const uptime = this.getUptime();
      
      const status = dbHealth.healthy ? 'healthy' : 'unhealthy';
      
      return {
        status,
        timestamp: new Date().toISOString(),
        uptime: uptime,
        database: dbHealth,
        checks: {
          database: dbHealth.healthy,
          uptime: uptime > 0
        }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get detailed health status for monitoring
   */
  async getDetailedStatus() {
    const basicStatus = await this.getStatus();
    
    return {
      ...basicStatus,
      details: {
        memory: this.getMemoryInfo(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        platform: process.platform,
        nodeVersion: process.version
      }
    };
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        healthy: true,
        message: 'Database connection successful',
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Database connection failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get application uptime
   */
  getUptime() {
    return Math.floor((new Date() - this.startTime) / 1000);
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100
    };
  }

  /**
   * Register a custom health check
   */
  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  /**
   * Run all registered health checks
   */
  async runAllChecks() {
    const results = {};
    
    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = {
          healthy: false,
          error: error.message
        };
      }
    }
    
    return results;
  }
}

// Singleton instance
export const healthCheck = new HealthCheck();

/**
 * Health check levels for monitoring
 */
export const HEALTH_LEVELS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  CRITICAL: 'critical'
};

/**
 * Basic health check - minimal functionality test
 */
export async function basicHealthCheck() {
  try {
    const dbCheck = await healthCheck.checkDatabase();
    const uptime = healthCheck.getUptime();
    
    return {
      status: dbCheck.healthy ? HEALTH_LEVELS.HEALTHY : HEALTH_LEVELS.UNHEALTHY,
      timestamp: new Date().toISOString(),
      uptime,
      database: dbCheck.healthy
    };
  } catch (error) {
    return {
      status: HEALTH_LEVELS.CRITICAL,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Readiness check - can the app accept requests?
 */
export async function readinessCheck() {
  try {
    const dbReady = await healthCheck.checkDatabase();
    const memoryOk = process.memoryUsage().heapUsed < 500 * 1024 * 1024; // 500MB limit
    
    const ready = dbReady.healthy && memoryOk;
    
    return {
      ready,
      status: ready ? HEALTH_LEVELS.HEALTHY : HEALTH_LEVELS.DEGRADED,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbReady.healthy,
        memory: memoryOk
      }
    };
  } catch (error) {
    return {
      ready: false,
      status: HEALTH_LEVELS.UNHEALTHY,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Liveness check - is the app still running?
 */
export async function livenessCheck() {
  try {
    const uptime = healthCheck.getUptime();
    const alive = uptime > 0;
    
    return {
      alive,
      status: alive ? HEALTH_LEVELS.HEALTHY : HEALTH_LEVELS.CRITICAL,
      timestamp: new Date().toISOString(),
      uptime
    };
  } catch (error) {
    return {
      alive: false,
      status: HEALTH_LEVELS.CRITICAL,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Simple ping endpoint function
 */
export function ping() {
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
}