/**
 * Client-side validation utilities for StayBoost
 * Provides immediate user feedback without server round-trips
 */

import { useCallback, useState } from 'react';

/**
 * Validation error class for client-side errors
 */
export class ClientValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ClientValidationError';
    this.field = field;
  }
}

/**
 * Basic suspicious pattern detection for client-side
 * Note: This is a lightweight version of server-side detection
 */
const SUSPICIOUS_PATTERNS = {
  script: /<script[^>]*>|javascript:/i,
  xss: /<[^>]*on\w+\s*=/i,
  sql: /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\btable\b).*(\bfrom\b|\bwhere\b|\binto\b)/i,
  path: /\.\.[/\\]|[/\\]\.\./,
  protocol: /^(javascript|data|vbscript):/i,
};

/**
 * Client-side input validation rules
 */
export const CLIENT_VALIDATION_RULES = {
  popup: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-.,!?'"()&%$#@+]*$/,
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 500,
      pattern: /^[a-zA-Z0-9\s\-.,!?'"()&%$#@+\n\r]*$/,
    },
    discountCode: {
      required: false,
      maxLength: 50,
      pattern: /^[A-Z0-9\-_]*$/,
    },
    discountPercentage: {
      required: true,
      min: 0,
      max: 100,
      type: 'number',
    },
    delaySeconds: {
      required: true,
      min: 0,
      max: 60,
      type: 'number',
    },
  },
};

/**
 * Validate a single field value
 */
export function validateField(value, rules, fieldName) {
  const errors = [];

  // Required field check
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return errors;
  }

  const stringValue = value.toString().trim();

  // Type validation
  if (rules.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
      return errors;
    }

    // Number range validation
    if (rules.min !== undefined && numValue < rules.min) {
      errors.push(`${fieldName} must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && numValue > rules.max) {
      errors.push(`${fieldName} must be at most ${rules.max}`);
    }
  } else {
    // String validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors.push(`${fieldName} contains invalid characters`);
    }

    // Basic suspicious content detection
    if (detectSuspiciousContent(stringValue)) {
      errors.push(`${fieldName} contains potentially unsafe content`);
    }
  }

  return errors;
}

/**
 * Validate popup settings object
 */
export function validatePopupSettings(settings) {
  const errors = {};
  const rules = CLIENT_VALIDATION_RULES.popup;

  // Validate each field
  Object.keys(rules).forEach(field => {
    const fieldErrors = validateField(settings[field], rules[field], field);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  // Additional business logic validations
  if (settings.enabled && settings.discountPercentage === 0) {
    if (!errors.discountPercentage) errors.discountPercentage = [];
    errors.discountPercentage.push('Discount percentage should be greater than 0 when popup is enabled');
  }

  if (settings.discountCode && settings.discountPercentage === 0) {
    if (!errors.discountPercentage) errors.discountPercentage = [];
    errors.discountPercentage.push('Discount percentage is required when discount code is provided');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Basic suspicious content detection for client-side
 */
function detectSuspiciousContent(input) {
  if (typeof input !== 'string') return false;

  const lowerInput = input.toLowerCase();

  // Check for suspicious patterns
  for (const [, pattern] of Object.entries(SUSPICIOUS_PATTERNS)) {
    if (pattern.test(input) || pattern.test(lowerInput)) {
      return true;
    }
  }

  return false;
}

/**
 * Real-time validation hook for React components
 */
export function useFieldValidation(initialValue = '', rules = {}, fieldName = '') {
  const [value, setValue] = useState(initialValue);
  const [errors, setErrors] = useState([]);
  const [touched, setTouched] = useState(false);

  const validate = useCallback((val) => {
    const fieldErrors = validateField(val, rules, fieldName);
    setErrors(fieldErrors);
    return fieldErrors.length === 0;
  }, [rules, fieldName]);

  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    if (touched) {
      validate(newValue);
    }
  }, [touched, validate]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate(value);
  }, [value, validate]);

  return {
    value,
    errors,
    hasErrors: errors.length > 0,
    isValid: errors.length === 0 && touched,
    onChange: handleChange,
    onBlur: handleBlur,
    validate: () => validate(value),
  };
}

/**
 * Sanitize input for display (client-side only, not for security)
 */
export function sanitizeForDisplay(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors) {
  const formatted = {};
  
  Object.keys(errors).forEach(field => {
    if (Array.isArray(errors[field]) && errors[field].length > 0) {
      formatted[field] = errors[field][0]; // Show only first error per field
    }
  });
  
  return formatted;
}

export default {
  validateField,
  validatePopupSettings,
  useFieldValidation,
  sanitizeForDisplay,
  formatValidationErrors,
  ClientValidationError,
  CLIENT_VALIDATION_RULES,
};
