// Shared health check configuration constants
// This file can be imported by both client and server code

export const HEALTH_CONFIG = {
  // Check intervals in milliseconds
  INTERVALS: {
    CRITICAL: 30 * 1000,    // 30 seconds
    STANDARD: 60 * 1000,    // 1 minute
    EXTENDED: 5 * 60 * 1000, // 5 minutes
  },
  
  // Timeout settings
  TIMEOUTS: {
    DATABASE: 5000,    // 5 seconds
    API: 3000,         // 3 seconds
    BACKUP: 10000,     // 10 seconds
    FILESYSTEM: 2000,  // 2 seconds
  },
  
  // Threshold settings
  THRESHOLDS: {
    RESPONSE_TIME_MS: 1000,    // 1 second
    MEMORY_USAGE_PCT: 80,      // 80%
    DISK_USAGE_PCT: 85,        // 85%
    CPU_USAGE_PCT: 90,         // 90%
  },
  
  // Status levels
  STATUS: {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    CRITICAL: 'critical',
    UNKNOWN: 'unknown',
  },
};

// Health check severity levels
export const HEALTH_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Health check categories
export const HEALTH_CATEGORIES = {
  SYSTEM: 'system',
  DATABASE: 'database',
  API: 'api',
  BACKUP: 'backup',
  ENVIRONMENT: 'environment',
};
