// Shared environment variable definitions for both client and server
// This file can be imported by both client and server code

// Environment variable definitions with validation rules
export const ENV_DEFINITIONS = {
  // Required Shopify App Configuration
  SHOPIFY_API_KEY: {
    required: true,
    type: 'string',
    pattern: /^[a-f0-9]{32}$/,
    description: 'Shopify app API key (32 character hex)',
    sensitive: true,
  },
  
  SHOPIFY_API_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'Shopify app secret key',
    sensitive: true,
  },
  
  SCOPES: {
    required: true,
    type: 'string',
    pattern: /^[a-z_,\s]+$/,
    description: 'Shopify app scopes (comma-separated)',
    default: 'write_products,read_customers',
  },
  
  // Database Configuration
  DATABASE_URL: {
    required: true,
    type: 'string',
    pattern: /^(file:|postgres:|postgresql:|sqlite:)/,
    description: 'Database connection URL',
    sensitive: true,
  },
  
  // Server Configuration
  PORT: {
    required: false,
    type: 'number',
    min: 1000,
    max: 65535,
    default: 3000,
    description: 'Server port number',
  },
  
  HOST: {
    required: false,
    type: 'string',
    pattern: /^[a-zA-Z0-9.-]+$/,
    default: 'localhost',
    description: 'Server host address',
  },
  
  // Environment Type
  NODE_ENV: {
    required: true,
    type: 'string',
    allowedValues: ['development', 'production', 'test'],
    default: 'development',
    description: 'Node.js environment',
  },
  
  // Session Management
  SHOPIFY_APP_URL: {
    required: true,
    type: 'string',
    pattern: /^https:\/\/[a-zA-Z0-9.-]+/,
    description: 'Public app URL (HTTPS required)',
  },
  
  // Optional Security Configuration
  SESSION_SECRET: {
    required: false,
    type: 'string',
    minLength: 32,
    description: 'Session encryption secret',
    sensitive: true,
    generate: () => require('crypto').randomBytes(32).toString('hex'),
  },
  
  // Logging Configuration
  LOG_LEVEL: {
    required: false,
    type: 'string',
    allowedValues: ['error', 'warn', 'info', 'debug'],
    default: 'info',
    description: 'Logging level',
  },
  
  // Sentry Configuration (Optional)
  SENTRY_DSN: {
    required: false,
    type: 'string',
    pattern: /^https:\/\/[a-f0-9]+@[a-zA-Z0-9.-]+\/\d+$/,
    description: 'Sentry error tracking DSN',
    sensitive: true,
  },
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    type: 'number',
    min: 1000,
    max: 3600000,
    default: 900000,
    description: 'Rate limit window in milliseconds (default: 15 minutes)',
  },
  
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: 'number',
    min: 1,
    max: 10000,
    default: 100,
    description: 'Maximum requests per window',
  },
  
  // Backup Configuration
  BACKUP_ENABLED: {
    required: false,
    type: 'boolean',
    default: true,
    description: 'Enable automated backups',
  },
  
  BACKUP_RETENTION_DAYS: {
    required: false,
    type: 'number',
    min: 1,
    max: 365,
    default: 30,
    description: 'Backup retention period in days',
  },
};

// Environment variable severity levels
export const SEVERITY_LEVELS = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Environment variable types
export const ENV_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  URL: 'url',
};
