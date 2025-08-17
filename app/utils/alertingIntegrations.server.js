/**
 * Alerting Integration Helpers
 * Connects the alerting system with existing application components
 */

import {
    ALERT_SEVERITY,
    getAlertManager,
    sendErrorAlert,
    sendPerformanceAlert,
    sendSecurityAlert,
    sendSystemAlert
} from './alerting.server.js';

/**
 * Integration with health check system
 */
export async function integrateWithHealthCheck() {
  // This function would be called from healthCheck.server.js
  // to send alerts when health checks fail
  
  return {
    onHealthCheckFail: async (checkName, result, context = {}) => {
      await sendSystemAlert(
        `Health Check Failed: ${checkName}`,
        `Health check "${checkName}" has failed with status: ${result.status}`,
        {
          checkName,
          result,
          context,
          timestamp: new Date().toISOString()
        },
        result.status === 'critical' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH
      );
    },
    
    onSystemOverload: async (metrics) => {
      await sendPerformanceAlert(
        'System Performance Alert',
        'System is experiencing high load or performance issues',
        metrics
      );
    },
    
    onDatabaseIssue: async (error, query = null) => {
      await sendSystemAlert(
        'Database Issue Detected',
        `Database operation failed: ${error.message}`,
        {
          error: error.stack,
          query,
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.HIGH
      );
    }
  };
}

/**
 * Integration with rate limiting system
 */
export async function integrateWithRateLimit() {
  return {
    onRateLimitExceeded: async (context) => {
      await sendSecurityAlert(
        'Rate Limit Exceeded',
        `Rate limit exceeded for ${context.endpoint || 'unknown endpoint'}`,
        {
          endpoint: context.endpoint,
          ip: context.ip,
          userAgent: context.userAgent,
          attempts: context.attempts,
          timeWindow: context.timeWindow,
          timestamp: new Date().toISOString(),
          sourceIP: context.ip
        }
      );
    },
    
    onSuspiciousActivity: async (context) => {
      await sendSecurityAlert(
        'Suspicious Activity Detected',
        `Unusual activity pattern detected from ${context.ip}`,
        {
          pattern: context.pattern,
          details: context.details,
          riskScore: context.riskScore,
          sourceIP: context.ip,
          userAgent: context.userAgent
        }
      );
    }
  };
}

/**
 * Integration with error tracking system
 */
export async function integrateWithErrorTracking() {
  return {
    onCriticalError: async (error, context = {}) => {
      await sendErrorAlert(error, {
        ...context,
        severity: 'critical',
        requiresImmedateAction: true
      });
    },
    
    onRecurringError: async (errorSignature, count, timeframe) => {
      await sendSystemAlert(
        'Recurring Error Pattern',
        `Error "${errorSignature}" has occurred ${count} times in ${timeframe}`,
        {
          errorSignature,
          count,
          timeframe,
          pattern: 'recurring',
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.MEDIUM
      );
    }
  };
}

/**
 * Integration with analytics system
 */
export async function integrateWithAnalytics() {
  return {
    onAnalyticsThreshold: async (metric, value, threshold, shop) => {
      await sendSystemAlert(
        `Analytics Threshold Alert: ${metric}`,
        `Metric "${metric}" has reached ${value}, exceeding threshold of ${threshold}`,
        {
          metric,
          value,
          threshold,
          shop,
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.LOW
      );
    },
    
    onConversionDrop: async (currentRate, previousRate, shop) => {
      const dropPercentage = ((previousRate - currentRate) / previousRate * 100).toFixed(1);
      
      await sendSystemAlert(
        'Conversion Rate Drop Alert',
        `Conversion rate has dropped by ${dropPercentage}% (${currentRate}% vs ${previousRate}%)`,
        {
          currentRate,
          previousRate,
          dropPercentage,
          shop,
          timestamp: new Date().toISOString()
        },
        dropPercentage > 50 ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM
      );
    }
  };
}

/**
 * Integration with backup system
 */
export async function integrateWithBackups() {
  return {
    onBackupFailure: async (backupType, error) => {
      await sendSystemAlert(
        `Backup Failure: ${backupType}`,
        `Automated backup of type "${backupType}" has failed`,
        {
          backupType,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.HIGH
      );
    },
    
    onBackupSuccess: async (backupType, size, duration) => {
      // Only send success alerts for critical backups or if requested
      if (process.env.ALERT_BACKUP_SUCCESS === 'true') {
        await sendSystemAlert(
          `Backup Completed: ${backupType}`,
          `Backup of type "${backupType}" completed successfully`,
          {
            backupType,
            size,
            duration,
            timestamp: new Date().toISOString()
          },
          ALERT_SEVERITY.LOW
        );
      }
    },
    
    onBackupStorageLow: async (available, total) => {
      const usagePercentage = ((total - available) / total * 100).toFixed(1);
      
      await sendSystemAlert(
        'Backup Storage Low',
        `Backup storage is ${usagePercentage}% full (${available}MB available)`,
        {
          available,
          total,
          usagePercentage,
          timestamp: new Date().toISOString()
        },
        usagePercentage > 90 ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM
      );
    }
  };
}

/**
 * Integration with environment validation
 */
export async function integrateWithEnvironment() {
  return {
    onConfigurationDrift: async (driftDetails) => {
      await sendSystemAlert(
        'Configuration Drift Detected',
        'Environment configuration has drifted from expected values',
        driftDetails,
        ALERT_SEVERITY.MEDIUM
      );
    },
    
    onMissingEnvironmentVar: async (varName, impact) => {
      await sendSystemAlert(
        `Missing Environment Variable: ${varName}`,
        `Required environment variable "${varName}" is missing`,
        {
          variable: varName,
          impact,
          timestamp: new Date().toISOString()
        },
        impact === 'critical' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH
      );
    },
    
    onConfigurationValidationFailure: async (failures) => {
      await sendSystemAlert(
        'Configuration Validation Failed',
        `${failures.length} configuration validation(s) failed`,
        {
          failures,
          count: failures.length,
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.HIGH
      );
    }
  };
}

/**
 * Integration with Shopify app lifecycle
 */
export async function integrateWithShopify() {
  return {
    onAppInstalled: async (shop) => {
      await sendSystemAlert(
        'App Installation',
        `StayBoost has been installed on shop: ${shop}`,
        {
          shop,
          event: 'app_installed',
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.LOW
      );
    },
    
    onAppUninstalled: async (shop) => {
      await sendSystemAlert(
        'App Uninstallation',
        `StayBoost has been uninstalled from shop: ${shop}`,
        {
          shop,
          event: 'app_uninstalled',
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.MEDIUM
      );
    },
    
    onWebhookFailure: async (webhookType, shop, error) => {
      await sendSystemAlert(
        `Webhook Failure: ${webhookType}`,
        `Failed to process webhook "${webhookType}" from shop: ${shop}`,
        {
          webhookType,
          shop,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.MEDIUM
      );
    },
    
    onApiRateLimit: async (shop, endpoint, limit) => {
      await sendSystemAlert(
        'Shopify API Rate Limit',
        `Approaching Shopify API rate limit for shop: ${shop}`,
        {
          shop,
          endpoint,
          limit,
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.MEDIUM
      );
    }
  };
}

/**
 * Convenience function to initialize all integrations
 */
export async function initializeAlertingIntegrations() {
  const integrations = {
    health: await integrateWithHealthCheck(),
    rateLimit: await integrateWithRateLimit(),
    errorTracking: await integrateWithErrorTracking(),
    analytics: await integrateWithAnalytics(),
    backups: await integrateWithBackups(),
    environment: await integrateWithEnvironment(),
    shopify: await integrateWithShopify()
  };

  // Set up webhook endpoints from environment
  const alertManager = getAlertManager();
  
  // Add webhook endpoints from environment variables
  const webhookUrls = process.env.ALERT_WEBHOOK_URLS?.split(',') || [];
  const webhookSecrets = process.env.ALERT_WEBHOOK_SECRETS?.split(',') || [];
  
  webhookUrls.forEach((url, index) => {
    if (url.trim()) {
      const secret = webhookSecrets[index]?.trim() || null;
      alertManager.addWebhookEndpoint(url.trim(), secret);
    }
  });

  console.log('✅ Alerting system integrations initialized');
  
  return integrations;
}

/**
 * Test function to verify alerting system is working
 */
export async function testAlertingSystem() {
  try {
    const result = await sendSystemAlert(
      'Alerting System Test',
      'This is a test alert to verify the alerting system is working correctly',
      {
        testType: 'system_verification',
        timestamp: new Date().toISOString(),
        source: 'alerting_integration'
      },
      ALERT_SEVERITY.LOW
    );

    console.log('✅ Alerting system test completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Alerting system test failed:', error);
    throw error;
  }
}
