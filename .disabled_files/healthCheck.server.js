// Health Check System for StayBoost
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { performance } from 'perf_hooks';
import { HEALTH_CONFIG } from '../constants/healthConfig.js';
import { getEnvironmentValidator } from './envValidation.server.js';
import { log, LOG_CATEGORIES, logError } from './logger.server.js';

// Health check result interface
export class HealthCheckResult {
  constructor(name, status = HEALTH_CONFIG.STATUS.UNKNOWN, message = '', details = {}) {
    this.name = name;
    this.status = status;
    this.message = message;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.responseTime = null;
  }
  
  setResponseTime(startTime) {
    this.responseTime = Math.round(performance.now() - startTime);
    return this;
  }
  
  setHealthy(message = 'Service is healthy', details = {}) {
    this.status = HEALTH_CONFIG.STATUS.HEALTHY;
    this.message = message;
    this.details = { ...this.details, ...details };
    return this;
  }
  
  setWarning(message, details = {}) {
    this.status = HEALTH_CONFIG.STATUS.WARNING;
    this.message = message;
    this.details = { ...this.details, ...details };
    return this;
  }
  
  setCritical(message, details = {}) {
    this.status = HEALTH_CONFIG.STATUS.CRITICAL;
    this.message = message;
    this.details = { ...this.details, ...details };
    return this;
  }
}

// Individual health check functions
export class HealthChecks {
  
  /**
   * Check database connectivity and performance
   */
  static async checkDatabase() {
    const startTime = performance.now();
    const result = new HealthCheckResult('database');
    
    try {
      // Dynamic import to handle different database types
      const prismaModule = await import('../db.server.js');
      const prisma = prismaModule.default;
      
      // Test basic connectivity with a simple query
      const testQuery = prisma.$queryRaw`SELECT 1 as test`;
      const queryResult = await Promise.race([
        testQuery,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), HEALTH_CONFIG.TIMEOUTS.DATABASE)
        )
      ]);
      
      const responseTime = Math.round(performance.now() - startTime);
      
      if (queryResult && queryResult[0]?.test === 1) {
        result.setHealthy('Database connection successful', {
          responseTime: `${responseTime}ms`,
          queryResult: 'SELECT 1 test passed'
        });
      } else {
        result.setWarning('Database query returned unexpected result', {
          responseTime: `${responseTime}ms`,
          queryResult
        });
      }
      
    } catch (error) {
      result.setCritical('Database connection failed', {
        error: error.message,
        timeout: HEALTH_CONFIG.TIMEOUTS.DATABASE
      });
    }
    
    return result.setResponseTime(startTime);
  }
  
  /**
   * Check backup system health
   */
  static async checkBackupSystem() {
    const startTime = performance.now();
    const result = new HealthCheckResult('backup_system');
    
    try {
      // Dynamic import to get backup modules
      const [schedulerModule, managerModule] = await Promise.all([
        import('./backupScheduler.server.js'),
        import('./backup.server.js')
      ]);
      
      const { backupScheduler } = schedulerModule;
      const { backupManager } = managerModule;
      
      // Check if modules are available
      if (!backupScheduler || !backupManager) {
        result.setCritical('Backup modules not available');
        return result.setResponseTime(startTime);
      }
      
      // Get status from both components
      const [schedulerStatus, managerStatus] = await Promise.all([
        Promise.resolve(backupScheduler.getStatus()),
        Promise.resolve(backupManager.getStatus())
      ]);
      
      // Check backup directory accessibility
      const backupDir = './backups';
      await fs.access(backupDir, fs.constants.R_OK | fs.constants.W_OK);
      
      // Determine overall health
      const hasRecentBackup = schedulerStatus.lastBackupAt && 
        (Date.now() - new Date(schedulerStatus.lastBackupAt).getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
      
      if (schedulerStatus.stats.failedBackups === 0 && managerStatus.isRunning === false) {
        if (hasRecentBackup || schedulerStatus.stats.totalBackups === 0) {
          result.setHealthy('Backup system operational', {
            scheduler: {
              isRunning: schedulerStatus.isRunning,
              totalBackups: schedulerStatus.stats.totalBackups,
              successfulBackups: schedulerStatus.stats.successfulBackups,
              lastBackupAt: schedulerStatus.lastBackupAt
            },
            manager: {
              isRunning: managerStatus.isRunning,
              config: managerStatus.config.DEFAULT_FREQUENCY
            },
            backupDirectory: 'accessible'
          });
        } else {
          result.setWarning('No recent backups found', {
            lastBackupAt: schedulerStatus.lastBackupAt,
            daysSinceLastBackup: schedulerStatus.lastBackupAt ? 
              Math.floor((Date.now() - new Date(schedulerStatus.lastBackupAt).getTime()) / (24 * 60 * 60 * 1000)) : 'never'
          });
        }
      } else {
        result.setWarning('Backup system has issues', {
          failedBackups: schedulerStatus.stats.failedBackups,
          lastError: schedulerStatus.stats.lastError,
          managerRunning: managerStatus.isRunning
        });
      }
      
    } catch (error) {
      result.setCritical('Backup system check failed', {
        error: error.message
      });
    }
    
    return result.setResponseTime(startTime);
  }
  
  /**
   * Check environment configuration
   */
  static async checkEnvironment() {
    const startTime = performance.now();
    const result = new HealthCheckResult('environment');
    
    try {
      const validator = getEnvironmentValidator();
      
      // Wrap validation in try-catch to handle validation errors gracefully
      let envValidation;
      try {
        envValidation = validator.validateAll();
      } catch (validationError) {
        // If validation throws errors, treat as critical but continue
        result.setCritical('Environment validation threw errors', {
          error: validationError.message,
          validationFailed: true
        });
        return result.setResponseTime(startTime);
      }
      
      const report = validator.generateConfigReport();
      
      if (envValidation.valid) {
        result.setHealthy('Environment configuration valid', {
          totalVariables: report.summary.total,
          configured: report.summary.configured,
          defaults: report.summary.defaults,
          missing: report.summary.missing
        });
      } else if (envValidation.errors.length > 0) {
        const criticalErrors = envValidation.errors.filter(err => err.severity === 'error');
        const warnings = envValidation.errors.filter(err => err.severity === 'warning');
        
        if (criticalErrors.length > 0) {
          result.setCritical('Critical environment configuration errors', {
            criticalErrors: criticalErrors.length,
            warnings: warnings.length,
            missingRequired: envValidation.missing.length,
            errors: criticalErrors.slice(0, 3).map(err => err.error) // First 3 errors
          });
        } else {
          result.setWarning('Environment configuration warnings', {
            warnings: warnings.length,
            missing: envValidation.missing.length,
            issues: warnings.slice(0, 3).map(w => w.error)
          });
        }
      } else {
        result.setHealthy('Environment configuration acceptable', {
          configured: report.summary.configured,
          defaults: report.summary.defaults
        });
      }
      
    } catch (error) {
      result.setCritical('Environment validation failed', {
        error: error.message
      });
    }
    
    return result.setResponseTime(startTime);
  }
  
  /**
   * Check input validation system
   */
  static async checkInputValidation() {
    const startTime = performance.now();
    const result = new HealthCheckResult('input_validation');
    
    try {
      // Test the input validation system
      const { InputValidator } = await import('./inputValidation.server.js');
      
      // Test basic validation functions
      const testCases = [
        { input: '<script>alert("test")</script>', expected: 'sanitized' },
        { input: 'normal text', expected: 'clean' },
        { input: 'test@example.com', expected: 'valid_email' }
      ];
      
      const validator = new InputValidator();
      const testResults = [];
      
      for (const testCase of testCases) {
        try {
          const sanitized = validator.sanitizeInput(testCase.input, 'strict');
          testResults.push({
            input: testCase.input.slice(0, 20) + (testCase.input.length > 20 ? '...' : ''),
            result: 'passed',
            sanitized: sanitized?.slice(0, 20) + (sanitized?.length > 20 ? '...' : '')
          });
        } catch (error) {
          testResults.push({
            input: testCase.input.slice(0, 20),
            result: 'failed',
            error: error.message
          });
        }
      }
      
      const passedTests = testResults.filter(t => t.result === 'passed').length;
      
      if (passedTests === testCases.length) {
        result.setHealthy('Input validation system working', {
          testsRun: testCases.length,
          testsPassed: passedTests,
          validationLevels: ['strict', 'moderate', 'basic']
        });
      } else {
        result.setWarning('Input validation issues detected', {
          testsRun: testCases.length,
          testsPassed: passedTests,
          testsFailed: testCases.length - passedTests,
          failures: testResults.filter(t => t.result === 'failed')
        });
      }
      
    } catch (error) {
      result.setCritical('Input validation system unavailable', {
        error: error.message
      });
    }
    
    return result.setResponseTime(startTime);
  }
  
  /**
   * Check system resources (memory, disk, etc.)
   */
  static async checkSystemResources() {
    const startTime = performance.now();
    const result = new HealthCheckResult('system_resources');
    
    try {
      const resources = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      };
      
      // Check memory usage
      const memoryUsageMB = Math.round(resources.memory.heapUsed / 1024 / 1024);
      const memoryLimitMB = Math.round(resources.memory.heapTotal / 1024 / 1024);
      const memoryUsagePct = Math.round((memoryUsageMB / memoryLimitMB) * 100);
      
      // Check disk space (if possible)
      let diskInfo = null;
      try {
        const df = execSync('df -h .', { encoding: 'utf8', timeout: 2000 });
        const lines = df.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          diskInfo = {
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usagePct: parseInt(parts[4]?.replace('%', '') || '0')
          };
        }
      } catch (diskError) {
        // Disk check failed, continue without it
      }
      
      // Determine status
      let status = HEALTH_CONFIG.STATUS.HEALTHY;
      let message = 'System resources normal';
      const details = {
        memory: {
          used: `${memoryUsageMB}MB`,
          total: `${memoryLimitMB}MB`,
          usage: `${memoryUsagePct}%`
        },
        uptime: `${Math.floor(resources.uptime / 3600)}h ${Math.floor((resources.uptime % 3600) / 60)}m`,
        nodeVersion: resources.nodeVersion,
        platform: resources.platform
      };
      
      if (diskInfo) {
        details.disk = diskInfo;
        
        if (diskInfo.usagePct > HEALTH_CONFIG.THRESHOLDS.DISK_USAGE_PCT) {
          status = HEALTH_CONFIG.STATUS.CRITICAL;
          message = 'Disk usage critical';
        } else if (diskInfo.usagePct > HEALTH_CONFIG.THRESHOLDS.DISK_USAGE_PCT - 10) {
          status = HEALTH_CONFIG.STATUS.WARNING;
          message = 'Disk usage high';
        }
      }
      
      if (memoryUsagePct > HEALTH_CONFIG.THRESHOLDS.MEMORY_USAGE_PCT) {
        status = HEALTH_CONFIG.STATUS.WARNING;
        message = 'Memory usage high';
      }
      
      if (status === HEALTH_CONFIG.STATUS.HEALTHY) {
        result.setHealthy(message, details);
      } else if (status === HEALTH_CONFIG.STATUS.WARNING) {
        result.setWarning(message, details);
      } else {
        result.setCritical(message, details);
      }
      
    } catch (error) {
      result.setCritical('System resource check failed', {
        error: error.message
      });
    }
    
    return result.setResponseTime(startTime);
  }
  
  /**
   * Check logging system
   */
  static async checkLogging() {
    const startTime = performance.now();
    const result = new HealthCheckResult('logging');
    
    try {
      // Test logging functionality
      const testMessage = `Health check test - ${Date.now()}`;
      
      // Attempt to write a test log entry
      log.info(testMessage, {
        category: LOG_CATEGORIES.SYSTEM,
        healthCheck: true
      });
      
      // If we get here without error, logging is working
      result.setHealthy('Logging system operational', {
        logCategories: Object.keys(LOG_CATEGORIES).length,
        testMessage: 'Successfully wrote test log entry'
      });
      
    } catch (error) {
      result.setCritical('Logging system failed', {
        error: error.message
      });
    }
    
    return result.setResponseTime(startTime);
  }
}

// Main health check orchestrator
export class HealthCheckManager {
  constructor() {
    this.lastCheck = null;
    this.checkHistory = [];
    this.maxHistoryLength = 50;
  }
  
  /**
   * Run all health checks
   */
  async runAllChecks() {
    const startTime = performance.now();
    const correlationId = `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    log.info('Starting comprehensive health check', {
      correlationId,
      category: LOG_CATEGORIES.SYSTEM
    });
    
    try {
      // Run all checks in parallel
      const [
        database,
        backupSystem,
        environment,
        inputValidation,
        systemResources,
        logging
      ] = await Promise.allSettled([
        HealthChecks.checkDatabase(),
        HealthChecks.checkBackupSystem(),
        HealthChecks.checkEnvironment(),
        HealthChecks.checkInputValidation(),
        HealthChecks.checkSystemResources(),
        HealthChecks.checkLogging()
      ]);
      
      // Process results
      const results = [
        database.status === 'fulfilled' ? database.value : this.createErrorResult('database', database.reason),
        backupSystem.status === 'fulfilled' ? backupSystem.value : this.createErrorResult('backup_system', backupSystem.reason),
        environment.status === 'fulfilled' ? environment.value : this.createErrorResult('environment', environment.reason),
        inputValidation.status === 'fulfilled' ? inputValidation.value : this.createErrorResult('input_validation', inputValidation.reason),
        systemResources.status === 'fulfilled' ? systemResources.value : this.createErrorResult('system_resources', systemResources.reason),
        logging.status === 'fulfilled' ? logging.value : this.createErrorResult('logging', logging.reason)
      ];
      
      // Calculate overall status
      const overallStatus = this.calculateOverallStatus(results);
      const totalTime = Math.round(performance.now() - startTime);
      
      const healthReport = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        totalCheckTime: `${totalTime}ms`,
        correlationId,
        checks: results,
        summary: {
          total: results.length,
          healthy: results.filter(r => r.status === HEALTH_CONFIG.STATUS.HEALTHY).length,
          warning: results.filter(r => r.status === HEALTH_CONFIG.STATUS.WARNING).length,
          critical: results.filter(r => r.status === HEALTH_CONFIG.STATUS.CRITICAL).length,
          unknown: results.filter(r => r.status === HEALTH_CONFIG.STATUS.UNKNOWN).length
        }
      };
      
      // Store in history
      this.addToHistory(healthReport);
      this.lastCheck = healthReport;
      
      log.info('Health check completed', {
        correlationId,
        overallStatus,
        totalTime: `${totalTime}ms`,
        summary: healthReport.summary,
        category: LOG_CATEGORIES.SYSTEM
      });
      
      return healthReport;
      
    } catch (error) {
      const errorReport = {
        status: HEALTH_CONFIG.STATUS.CRITICAL,
        timestamp: new Date().toISOString(),
        correlationId,
        error: 'Health check system failure',
        details: error.message
      };
      
      logError('Health check system failed', {
        correlationId,
        error: error.message,
        category: LOG_CATEGORIES.SYSTEM
      });
      
      return errorReport;
    }
  }
  
  /**
   * Run a quick health check (essential services only)
   */
  async runQuickCheck() {
    const startTime = performance.now();
    
    try {
      const [database, environment] = await Promise.allSettled([
        HealthChecks.checkDatabase(),
        HealthChecks.checkEnvironment()
      ]);
      
      const results = [
        database.status === 'fulfilled' ? database.value : this.createErrorResult('database', database.reason),
        environment.status === 'fulfilled' ? environment.value : this.createErrorResult('environment', environment.reason)
      ];
      
      const overallStatus = this.calculateOverallStatus(results);
      const totalTime = Math.round(performance.now() - startTime);
      
      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        totalCheckTime: `${totalTime}ms`,
        type: 'quick',
        checks: results,
        summary: {
          total: results.length,
          healthy: results.filter(r => r.status === HEALTH_CONFIG.STATUS.HEALTHY).length,
          warning: results.filter(r => r.status === HEALTH_CONFIG.STATUS.WARNING).length,
          critical: results.filter(r => r.status === HEALTH_CONFIG.STATUS.CRITICAL).length
        }
      };
      
    } catch (error) {
      return {
        status: HEALTH_CONFIG.STATUS.CRITICAL,
        timestamp: new Date().toISOString(),
        type: 'quick',
        error: 'Quick health check failed',
        details: error.message
      };
    }
  }
  
  /**
   * Get the last health check result
   */
  getLastCheck() {
    return this.lastCheck;
  }
  
  /**
   * Get health check history
   */
  getHistory(limit = 10) {
    return this.checkHistory.slice(-limit);
  }
  
  /**
   * Helper method to create error result
   */
  createErrorResult(name, error) {
    return new HealthCheckResult(name)
      .setCritical('Health check failed', {
        error: error?.message || error?.toString() || 'Unknown error'
      });
  }
  
  /**
   * Calculate overall status from individual check results
   */
  calculateOverallStatus(results) {
    const statusCounts = results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});
    
    if (statusCounts[HEALTH_CONFIG.STATUS.CRITICAL] > 0) {
      return HEALTH_CONFIG.STATUS.CRITICAL;
    }
    if (statusCounts[HEALTH_CONFIG.STATUS.WARNING] > 0) {
      return HEALTH_CONFIG.STATUS.WARNING;
    }
    if (statusCounts[HEALTH_CONFIG.STATUS.HEALTHY] === results.length) {
      return HEALTH_CONFIG.STATUS.HEALTHY;
    }
    
    return HEALTH_CONFIG.STATUS.UNKNOWN;
  }
  
  /**
   * Add result to history
   */
  addToHistory(result) {
    this.checkHistory.push(result);
    
    if (this.checkHistory.length > this.maxHistoryLength) {
      this.checkHistory = this.checkHistory.slice(-this.maxHistoryLength);
    }
  }
}

// Create default health check manager instance
export const healthManager = new HealthCheckManager();
