// Log Analysis Utilities for StayBoost
import fs from 'fs/promises';
import path from 'path';
import { log, LOG_CATEGORIES } from './logger.server.js';

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Log analysis metrics
export class LogAnalyzer {
  constructor() {
    this.metrics = {
      requests: new Map(),
      errors: new Map(),
      performance: new Map(),
      security: new Map(),
    };
  }

  // Parse log file and extract metrics
  async parseLogFile(filename, options = {}) {
    const { hours = 24, category = null } = options;
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

    try {
      const filePath = path.join(LOGS_DIR, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const metrics = {
        total: 0,
        categories: {},
        levels: {},
        timeRange: { start: null, end: null },
        topErrors: new Map(),
        slowRequests: [],
        securityEvents: [],
        rateLimitHits: [],
      };

      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          const timestamp = new Date(logEntry.timestamp).getTime();
          
          // Skip old entries
          if (timestamp < cutoffTime) continue;
          
          // Filter by category if specified
          if (category && logEntry.category !== category) continue;

          metrics.total++;
          
          // Track time range
          if (!metrics.timeRange.start || timestamp < metrics.timeRange.start) {
            metrics.timeRange.start = timestamp;
          }
          if (!metrics.timeRange.end || timestamp > metrics.timeRange.end) {
            metrics.timeRange.end = timestamp;
          }

          // Count by category
          const cat = logEntry.category || 'general';
          metrics.categories[cat] = (metrics.categories[cat] || 0) + 1;

          // Count by level
          metrics.levels[logEntry.level] = (metrics.levels[logEntry.level] || 0) + 1;

          // Track errors
          if (logEntry.level === 'error') {
            const errorKey = logEntry.error?.name || 'Unknown';
            metrics.topErrors.set(errorKey, (metrics.topErrors.get(errorKey) || 0) + 1);
          }

          // Track slow requests
          if (logEntry.performanceLog && logEntry.duration > 1000) {
            metrics.slowRequests.push({
              operation: logEntry.operation,
              duration: logEntry.duration,
              timestamp: logEntry.timestamp,
            });
          }

          // Track security events
          if (logEntry.securityEvent) {
            metrics.securityEvents.push({
              event: logEntry.message,
              severity: logEntry.severity,
              ip: logEntry.ip,
              timestamp: logEntry.timestamp,
            });
          }

          // Track rate limit hits
          if (logEntry.rateLimitEvent) {
            metrics.rateLimitHits.push({
              ip: logEntry.ip,
              endpoint: logEntry.endpoint,
              timestamp: logEntry.timestamp,
            });
          }

        } catch (parseError) {
          // Skip invalid JSON lines
          continue;
        }
      }

      return metrics;
    } catch (error) {
      log.error('Failed to parse log file', {
        filename,
        error: error.message,
        category: LOG_CATEGORIES.SYSTEM,
      });
      throw error;
    }
  }

  // Get comprehensive metrics for all logs
  async getComprehensiveMetrics(hours = 24) {
    const today = new Date().toISOString().split('T')[0];
    const logFiles = [
      `combined-${today}.log`,
      `error-${today}.log`,
      `api-${today}.log`,
      `security-${today}.log`,
      `performance-${today}.log`,
      `database-${today}.log`,
    ];

    const allMetrics = {
      summary: {
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        errorRate: 0,
        securityEvents: 0,
        rateLimitHits: 0,
      },
      breakdown: {},
      topErrors: new Map(),
      slowRequests: [],
      securityEvents: [],
      rateLimitHits: [],
      apiEndpoints: new Map(),
      hourlyStats: new Array(24).fill(0).map((_, i) => ({
        hour: i,
        requests: 0,
        errors: 0,
        avgDuration: 0,
      })),
    };

    for (const filename of logFiles) {
      try {
        const metrics = await this.parseLogFile(filename, { hours });
        
        // Merge metrics
        allMetrics.summary.totalRequests += metrics.total;
        allMetrics.summary.totalErrors += metrics.levels.error || 0;
        allMetrics.summary.securityEvents += metrics.securityEvents.length;
        allMetrics.summary.rateLimitHits += metrics.rateLimitHits.length;

        // Merge breakdown by category
        for (const [category, count] of Object.entries(metrics.categories)) {
          allMetrics.breakdown[category] = (allMetrics.breakdown[category] || 0) + count;
        }

        // Merge top errors
        for (const [error, count] of metrics.topErrors) {
          allMetrics.topErrors.set(error, (allMetrics.topErrors.get(error) || 0) + count);
        }

        // Merge arrays
        allMetrics.slowRequests.push(...metrics.slowRequests);
        allMetrics.securityEvents.push(...metrics.securityEvents);
        allMetrics.rateLimitHits.push(...metrics.rateLimitHits);

      } catch (error) {
        // Log file doesn't exist or can't be read, skip
        continue;
      }
    }

    // Calculate derived metrics
    allMetrics.summary.errorRate = allMetrics.summary.totalRequests > 0 
      ? (allMetrics.summary.totalErrors / allMetrics.summary.totalRequests * 100).toFixed(2)
      : 0;

    // Sort and limit arrays
    allMetrics.slowRequests.sort((a, b) => b.duration - a.duration).splice(10);
    allMetrics.securityEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).splice(20);
    allMetrics.rateLimitHits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).splice(20);

    return allMetrics;
  }

  // Get real-time metrics from recent logs
  async getRealTimeMetrics() {
    return this.getComprehensiveMetrics(1); // Last 1 hour
  }

  // Get API endpoint performance metrics
  async getApiMetrics(hours = 24) {
    const today = new Date().toISOString().split('T')[0];
    const apiMetrics = await this.parseLogFile(`api-${today}.log`, { 
      hours,
      category: LOG_CATEGORIES.API 
    });

    const endpointStats = new Map();
    
    // Process API logs to extract endpoint performance
    const filePath = path.join(LOGS_DIR, `api-${today}.log`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          if (logEntry.type === 'response' && logEntry.url) {
            const endpoint = logEntry.url.split('?')[0]; // Remove query params
            
            if (!endpointStats.has(endpoint)) {
              endpointStats.set(endpoint, {
                count: 0,
                totalDuration: 0,
                errors: 0,
                statusCodes: new Map(),
              });
            }
            
            const stats = endpointStats.get(endpoint);
            stats.count++;
            stats.totalDuration += logEntry.duration || 0;
            
            if (logEntry.statusCode >= 400) {
              stats.errors++;
            }
            
            const statusCode = logEntry.statusCode.toString();
            stats.statusCodes.set(statusCode, (stats.statusCodes.get(statusCode) || 0) + 1);
          }
        } catch (parseError) {
          continue;
        }
      }
    } catch (error) {
      // File doesn't exist, return empty stats
    }

    // Calculate averages
    const processedStats = Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
      endpoint,
      requests: stats.count,
      averageDuration: stats.count > 0 ? (stats.totalDuration / stats.count).toFixed(2) : 0,
      errorRate: stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(2) : 0,
      statusCodes: Object.fromEntries(stats.statusCodes),
    }));

    return {
      ...apiMetrics,
      endpointStats: processedStats.sort((a, b) => b.requests - a.requests),
    };
  }

  // Health check for logging system
  async getLoggingHealth() {
    const health = {
      status: 'healthy',
      issues: [],
      logFiles: {},
      diskUsage: {},
    };

    try {
      // Check log directory exists
      await fs.access(LOGS_DIR);
      
      // Check log files
      const files = await fs.readdir(LOGS_DIR);
      const logFiles = files.filter(f => f.endsWith('.log'));
      
      for (const file of logFiles) {
        const filePath = path.join(LOGS_DIR, file);
        const stats = await fs.stat(filePath);
        
        health.logFiles[file] = {
          size: stats.size,
          lastModified: stats.mtime,
          readable: true,
        };
        
        // Check if file is too large
        if (stats.size > 100 * 1024 * 1024) { // 100MB
          health.issues.push(`Log file ${file} is large (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        }
        
        // Check if file is stale
        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        if (ageHours > 24) {
          health.issues.push(`Log file ${file} is stale (${ageHours.toFixed(1)} hours old)`);
        }
      }
      
      // Calculate disk usage
      const totalSize = Object.values(health.logFiles).reduce((sum, file) => sum + file.size, 0);
      health.diskUsage = {
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        fileCount: logFiles.length,
      };
      
      if (health.issues.length > 0) {
        health.status = 'warning';
      }
      
    } catch (error) {
      health.status = 'error';
      health.issues.push(`Cannot access logs directory: ${error.message}`);
    }

    return health;
  }
}

// Singleton instance
export const logAnalyzer = new LogAnalyzer();

// Helper functions for specific metrics
export async function getErrorSummary(hours = 24) {
  return logAnalyzer.getComprehensiveMetrics(hours);
}

export async function getPerformanceSummary(hours = 24) {
  const today = new Date().toISOString().split('T')[0];
  return logAnalyzer.parseLogFile(`performance-${today}.log`, { 
    hours,
    category: LOG_CATEGORIES.PERFORMANCE 
  });
}

export async function getSecuritySummary(hours = 24) {
  const today = new Date().toISOString().split('T')[0];
  return logAnalyzer.parseLogFile(`security-${today}.log`, { 
    hours,
    category: LOG_CATEGORIES.SECURITY 
  });
}
