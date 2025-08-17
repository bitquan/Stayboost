// Environment configuration management for StayBoost
import { log } from './logger.server.js';

// Default configuration values
const defaults = {
  // Application
  NODE_ENV: 'development',
  LOG_LEVEL: 'debug',
  
  // Security
  HTTPS_ONLY: false,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  
  // Rate Limiting
  RATE_LIMIT_ENABLED: true,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Monitoring
  SENTRY_ENABLED: false,
  APM_ENABLED: false,
  HEALTH_CHECK_ENABLED: true,
  
  // Analytics
  ANALYTICS_ENABLED: true,
  ANALYTICS_RETENTION_DAYS: 90,
  
  // Caching
  CACHE_ENABLED: false,
  CACHE_TTL_SECONDS: 300, // 5 minutes
  
  // Features
  FEATURE_A_B_TESTING: false,
  FEATURE_ADVANCED_ANALYTICS: false,
  FEATURE_MULTI_LANGUAGE: false,
};

// Environment variable type definitions
const envTypes = {
  // String values
  string: [
    'NODE_ENV', 'SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'DATABASE_URL',
    'SESSION_SECRET', 'SENTRY_DSN', 'LOG_LEVEL', 'REDIS_URL',
    'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM',
    'NEW_RELIC_LICENSE_KEY', 'DATADOG_API_KEY', 'WEBHOOK_SECRET',
    'DEV_TUNNEL_URL', 'APM_SERVICE_NAME'
  ],
  
  // Boolean values
  boolean: [
    'HTTPS_ONLY', 'RATE_LIMIT_ENABLED', 'SENTRY_ENABLED', 'APM_ENABLED',
    'HEALTH_CHECK_ENABLED', 'ANALYTICS_ENABLED', 'CACHE_ENABLED',
    'FEATURE_A_B_TESTING', 'FEATURE_ADVANCED_ANALYTICS', 'FEATURE_MULTI_LANGUAGE',
    'DEV_HTTPS'
  ],
  
  // Number values
  number: [
    'SESSION_TIMEOUT_MS', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS',
    'ANALYTICS_RETENTION_DAYS', 'CACHE_TTL_SECONDS', 'SMTP_PORT',
    'DEV_SERVER_PORT'
  ],
};

// Parse environment variable based on type
function parseEnvValue(key, value, type) {
  if (value === undefined || value === null || value === '') {
    return defaults[key];
  }
  
  switch (type) {
    case 'boolean':
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    case 'number':
      const num = Number(value);
      return isNaN(num) ? defaults[key] : num;
    case 'string':
    default:
      return value;
  }
}

// Get environment variable type
function getEnvType(key) {
  for (const [type, keys] of Object.entries(envTypes)) {
    if (keys.includes(key)) {
      return type;
    }
  }
  return 'string';
}

// Configuration object
class Configuration {
  constructor() {
    this.config = {};
    this.loadConfiguration();
    this.validateConfiguration();
  }
  
  // Load configuration from environment variables
  loadConfiguration() {
    // Load all defined environment variables
    const allKeys = Object.values(envTypes).flat();
    
    for (const key of allKeys) {
      const type = getEnvType(key);
      const value = parseEnvValue(key, process.env[key], type);
      this.config[key] = value;
    }
    
    // Add computed values
    this.config.IS_PRODUCTION = this.config.NODE_ENV === 'production';
    this.config.IS_DEVELOPMENT = this.config.NODE_ENV === 'development';
    this.config.IS_TEST = this.config.NODE_ENV === 'test';
    
    log.info('Configuration loaded', { 
      environment: this.config.NODE_ENV,
      configKeys: Object.keys(this.config).length 
    });
  }
  
  // Validate required configuration
  validateConfiguration() {
    const required = ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'DATABASE_URL', 'SESSION_SECRET'];
    const missing = [];
    
    for (const key of required) {
      if (!this.config[key] || this.config[key] === defaults[key]) {
        missing.push(key);
      }
    }
    
    if (missing.length > 0) {
      const message = `Missing required environment variables: ${missing.join(', ')}`;
      log.error('Configuration validation failed', { missingVars: missing });
      throw new Error(message);
    }
    
    // Warn about using defaults
    const usingDefaults = [];
    Object.keys(defaults).forEach(key => {
      if (this.config[key] === defaults[key] && !required.includes(key)) {
        usingDefaults.push(key);
      }
    });
    
    if (usingDefaults.length > 0) {
      log.warn('Using default values for configuration', { 
        defaultKeys: usingDefaults 
      });
    }
    
    log.info('Configuration validation passed');
  }
  
  // Get configuration value
  get(key) {
    return this.config[key];
  }
  
  // Check if feature is enabled
  isFeatureEnabled(featureName) {
    const key = `FEATURE_${featureName.toUpperCase()}`;
    return Boolean(this.config[key]);
  }
  
  // Get database configuration
  getDatabaseConfig() {
    return {
      url: this.config.DATABASE_URL,
      pool: {
        min: this.config.IS_PRODUCTION ? 2 : 1,
        max: this.config.IS_PRODUCTION ? 10 : 5,
      },
    };
  }
  
  // Get rate limiting configuration
  getRateLimitConfig() {
    return {
      enabled: this.config.RATE_LIMIT_ENABLED,
      windowMs: this.config.RATE_LIMIT_WINDOW_MS,
      max: this.config.RATE_LIMIT_MAX_REQUESTS,
    };
  }
  
  // Get caching configuration
  getCacheConfig() {
    return {
      enabled: this.config.CACHE_ENABLED,
      url: this.config.REDIS_URL,
      ttl: this.config.CACHE_TTL_SECONDS,
    };
  }
  
  // Get monitoring configuration
  getMonitoringConfig() {
    return {
      sentry: {
        enabled: this.config.SENTRY_ENABLED && Boolean(this.config.SENTRY_DSN),
        dsn: this.config.SENTRY_DSN,
      },
      apm: {
        enabled: this.config.APM_ENABLED,
        serviceName: this.config.APM_SERVICE_NAME || 'stayboost',
        newRelic: {
          licenseKey: this.config.NEW_RELIC_LICENSE_KEY,
        },
        datadog: {
          apiKey: this.config.DATADOG_API_KEY,
        },
      },
      healthCheck: {
        enabled: this.config.HEALTH_CHECK_ENABLED,
        secret: this.config.HEALTH_CHECK_SECRET,
      },
    };
  }
  
  // Get email configuration
  getEmailConfig() {
    return {
      smtp: {
        host: this.config.SMTP_HOST,
        port: this.config.SMTP_PORT,
        secure: this.config.SMTP_PORT === 465,
        auth: {
          user: this.config.SMTP_USER,
          pass: this.config.SMTP_PASS,
        },
      },
      from: this.config.EMAIL_FROM,
    };
  }
  
  // Get security configuration
  getSecurityConfig() {
    return {
      httpsOnly: this.config.HTTPS_ONLY,
      sessionTimeout: this.config.SESSION_TIMEOUT_MS,
      webhookSecret: this.config.WEBHOOK_SECRET,
    };
  }
  
  // Export configuration for debugging (without secrets)
  toSafeObject() {
    const safe = { ...this.config };
    
    // Remove sensitive information
    const sensitiveKeys = [
      'SHOPIFY_API_SECRET', 'SESSION_SECRET', 'SENTRY_DSN',
      'DATABASE_URL', 'REDIS_URL', 'SMTP_PASS', 'NEW_RELIC_LICENSE_KEY',
      'DATADOG_API_KEY', 'WEBHOOK_SECRET', 'HEALTH_CHECK_SECRET'
    ];
    
    sensitiveKeys.forEach(key => {
      if (safe[key]) {
        safe[key] = '[REDACTED]';
      }
    });
    
    return safe;
  }
}

// Create and export singleton instance
export const config = new Configuration();

// Export utility functions
export { defaults };

// Export configuration groups
export const security = config.getSecurityConfig();
export const database = config.getDatabaseConfig();
export const rateLimit = config.getRateLimitConfig();
export const cache = config.getCacheConfig();
export const monitoring = config.getMonitoringConfig();
export const email = config.getEmailConfig();

// Feature flags
export const features = {
  abTesting: config.isFeatureEnabled('A_B_TESTING'),
  advancedAnalytics: config.isFeatureEnabled('ADVANCED_ANALYTICS'),
  multiLanguage: config.isFeatureEnabled('MULTI_LANGUAGE'),
};

export default config;
