// Environment Variable Validation Utilities for StayBoost
import { ENV_DEFINITIONS } from '../constants/envDefinitions.js';
import { log, LOG_CATEGORIES, logError } from './logger.server.js';

// Environment validation error class
export class EnvValidationError extends Error {
  constructor(message, variable, value, severity = 'error') {
    super(message);
    this.name = 'EnvValidationError';
    this.variable = variable;
    this.value = value;
    this.severity = severity;
  }
}

// Environment validation class
export class EnvironmentValidator {
  constructor() {
    this.validationResults = {
      valid: true,
      errors: [],
      warnings: [],
      missing: [],
      generated: [],
    };
  }

  /**
   * Validate all environment variables
   */
  validateAll() {
    log.info('Starting environment variable validation', {
      category: LOG_CATEGORIES.SYSTEM,
    });

    const startTime = Date.now();
    
    for (const [varName, definition] of Object.entries(ENV_DEFINITIONS)) {
      try {
        this.validateVariable(varName, definition);
      } catch (error) {
        this.validationResults.valid = false;
        this.validationResults.errors.push({
          variable: varName,
          error: error.message,
          severity: error.severity || 'error',
        });
        
        logError(error, {
          variable: varName,
          category: LOG_CATEGORIES.SYSTEM,
        });
      }
    }

    const validationTime = Date.now() - startTime;
    
    // Log validation summary
    log.info('Environment validation completed', {
      valid: this.validationResults.valid,
      errors: this.validationResults.errors.length,
      warnings: this.validationResults.warnings.length,
      missing: this.validationResults.missing.length,
      generated: this.validationResults.generated.length,
      validationTime,
      category: LOG_CATEGORIES.SYSTEM,
    });

    return this.validationResults;
  }

  /**
   * Validate a single environment variable
   */
  validateVariable(varName, definition) {
    const value = process.env[varName];
    
    // Check if required variable is missing
    if (definition.required && (value === undefined || value === '')) {
      if (definition.default !== undefined) {
        process.env[varName] = String(definition.default);
        this.validationResults.warnings.push({
          variable: varName,
          message: `Using default value: ${definition.sensitive ? '[REDACTED]' : definition.default}`,
          type: 'default_used',
        });
      } else if (definition.generate) {
        const generated = definition.generate();
        process.env[varName] = generated;
        this.validationResults.generated.push({
          variable: varName,
          message: 'Generated secure value',
          type: 'generated',
        });
      } else {
        this.validationResults.missing.push(varName);
        throw new EnvValidationError(
          `Required environment variable ${varName} is missing`,
          varName,
          value,
          'error'
        );
      }
      return;
    }

    // Skip validation if variable is not set and not required
    if (!definition.required && (value === undefined || value === '')) {
      return;
    }

    // Type validation
    this.validateType(varName, value, definition);
    
    // Pattern validation
    if (definition.pattern && !definition.pattern.test(value)) {
      throw new EnvValidationError(
        `${varName} does not match required pattern`,
        varName,
        definition.sensitive ? '[REDACTED]' : value,
        'error'
      );
    }
    
    // Allowed values validation
    if (definition.allowedValues && !definition.allowedValues.includes(value)) {
      throw new EnvValidationError(
        `${varName} must be one of: ${definition.allowedValues.join(', ')}`,
        varName,
        value,
        'error'
      );
    }
    
    // Length validation
    if (definition.minLength && value.length < definition.minLength) {
      throw new EnvValidationError(
        `${varName} must be at least ${definition.minLength} characters`,
        varName,
        definition.sensitive ? '[REDACTED]' : value,
        'error'
      );
    }
    
    if (definition.maxLength && value.length > definition.maxLength) {
      throw new EnvValidationError(
        `${varName} must be at most ${definition.maxLength} characters`,
        varName,
        definition.sensitive ? '[REDACTED]' : value,
        'error'
      );
    }
    
    // Numeric range validation
    if (definition.type === 'number') {
      const numValue = Number(value);
      
      if (definition.min !== undefined && numValue < definition.min) {
        throw new EnvValidationError(
          `${varName} must be at least ${definition.min}`,
          varName,
          value,
          'error'
        );
      }
      
      if (definition.max !== undefined && numValue > definition.max) {
        throw new EnvValidationError(
          `${varName} must be at most ${definition.max}`,
          varName,
          value,
          'error'
        );
      }
    }
  }

  /**
   * Validate variable type
   */
  validateType(varName, value, definition) {
    switch (definition.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new EnvValidationError(
            `${varName} must be a string`,
            varName,
            value,
            'error'
          );
        }
        break;
        
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new EnvValidationError(
            `${varName} must be a valid number`,
            varName,
            value,
            'error'
          );
        }
        process.env[varName] = String(numValue);
        break;
        
      case 'boolean':
        const lowerValue = value.toLowerCase();
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(lowerValue)) {
          throw new EnvValidationError(
            `${varName} must be a boolean value (true/false, 1/0, yes/no)`,
            varName,
            value,
            'error'
          );
        }
        process.env[varName] = ['true', '1', 'yes'].includes(lowerValue) ? 'true' : 'false';
        break;
        
      default:
        // No type validation for unknown types
        break;
    }
  }

  /**
   * Generate a configuration report
   */
  generateConfigReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      variables: {},
      summary: {
        total: 0,
        configured: 0,
        defaults: 0,
        generated: 0,
        missing: 0,
      },
    };

    for (const [varName, definition] of Object.entries(ENV_DEFINITIONS)) {
      const value = process.env[varName];
      report.summary.total++;
      
      if (value !== undefined && value !== '') {
        report.summary.configured++;
        report.variables[varName] = {
          configured: true,
          value: definition.sensitive ? '[REDACTED]' : value,
          description: definition.description,
          required: definition.required,
        };
      } else if (definition.default !== undefined) {
        report.summary.defaults++;
        report.variables[varName] = {
          configured: false,
          defaultUsed: true,
          value: definition.sensitive ? '[REDACTED]' : definition.default,
          description: definition.description,
          required: definition.required,
        };
      } else {
        report.summary.missing++;
        report.variables[varName] = {
          configured: false,
          missing: true,
          description: definition.description,
          required: definition.required,
        };
      }
    }

    return report;
  }
}

// Singleton instance
let validator = null;

/**
 * Get or create environment validator instance
 */
export function getEnvironmentValidator() {
  if (!validator) {
    validator = new EnvironmentValidator();
  }
  return validator;
}

/**
 * Validate environment on server startup
 */
export function validateEnvironmentOnStartup() {
  const validator = getEnvironmentValidator();
  const results = validator.validateAll();
  
  if (!results.valid) {
    log.error('Environment validation failed - server may not function correctly', {
      errors: results.errors,
      missing: results.missing,
      category: LOG_CATEGORIES.SYSTEM,
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production. Cannot start server.');
    }
  }
  
  return results;
}

/**
 * Main validation and utility exports
 */
