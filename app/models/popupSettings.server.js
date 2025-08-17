/**
 * StayBoost Popup Settings Data Model
 * Handles popup configuration storage and retrieval
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive unit tests for all CRUD operations
 * - [ ] Test data validation and sanitization with edge cases
 * - [ ] Create integration tests with admin interface and API endpoints
 * - [ ] Test error handling for database failures and network issues
 * - [ ] Add performance tests for concurrent access and high load
 * - [ ] Test default value fallback mechanisms and inheritance
 * - [ ] Validate settings schema migrations and versioning
 * - [ ] Test shop domain validation edge cases and security
 * - [ ] Add backup and restore functionality tests
 * - [ ] Test settings versioning and rollback capabilities
 * - [ ] Add tests for A/B testing settings integration
 * - [ ] Test multi-language settings storage and retrieval
 * - [ ] Validate frequency control settings integration
 * - [ ] Add tests for settings template system
 * - [ ] Test settings export and import functionality
 * - [ ] Add monitoring for settings corruption detection
 * - [ ] Test settings caching and invalidation
 * - [ ] Validate settings history tracking
 * - [ ] Add tests for bulk settings operations
 * - [ ] Test settings validation rules engine
 */

import prisma from "../db.server.js";
import {
    sanitizePopupSettings,
    sanitizeShopDomain,
    ValidationError
} from "../utils/inputValidation.server.js";
import { log, LOG_CATEGORIES } from "../utils/logger.server.js";

const DEFAULTS = {
  enabled: true,
  title: "Wait! Don't leave yet!",
  message: "Get 10% off your first order",
  discountCode: "SAVE10",
  discountPercentage: 10,
  delaySeconds: 2,
  showOnce: true,
};

export async function getPopupSettings(shop) {
  try {
    // Sanitize and validate shop domain
    const sanitizedShop = sanitizeShopDomain(shop);
    
    log.database.query('findUnique', 'popupSettings', Date.now(), {
      shop: sanitizedShop,
    });
    
    const found = await prisma.popupSettings.findUnique({ 
      where: { shop: sanitizedShop } 
    });
    
    if (!found) {
      log.info('Popup settings not found, returning defaults', {
        shop: sanitizedShop,
        category: LOG_CATEGORIES.DATABASE,
      });
      return { shop: sanitizedShop, ...DEFAULTS };
    }
    
    return { ...DEFAULTS, ...found };
  } catch (error) {
    log.error('Failed to get popup settings', {
      shop,
      error: error.message,
      category: LOG_CATEGORIES.DATABASE,
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error('Failed to retrieve popup settings');
  }
}

export async function savePopupSettings(shop, data) {
  try {
    // Sanitize and validate shop domain
    const sanitizedShop = sanitizeShopDomain(shop);
    
    // Sanitize and validate all popup settings
    const sanitizedSettings = sanitizePopupSettings(data);
    
    // Prepare payload with validated data
    const payload = {
      enabled: sanitizedSettings.enabled ?? DEFAULTS.enabled,
      title: sanitizedSettings.title ?? DEFAULTS.title,
      message: sanitizedSettings.message ?? DEFAULTS.message,
      discountCode: sanitizedSettings.discountCode ?? DEFAULTS.discountCode,
      discountPercentage: typeof sanitizedSettings.discountPercentage === "number"
        ? sanitizedSettings.discountPercentage
        : DEFAULTS.discountPercentage,
      delaySeconds: typeof sanitizedSettings.delaySeconds === "number"
        ? sanitizedSettings.delaySeconds
        : DEFAULTS.delaySeconds,
      showOnce: sanitizedSettings.showOnce ?? DEFAULTS.showOnce,
    };

    log.database.query('upsert', 'popupSettings', Date.now(), {
      shop: sanitizedShop,
      operation: 'savePopupSettings',
    });
    
    log.business('Popup settings updated', {
      shop: sanitizedShop,
      enabled: payload.enabled,
      discountPercentage: payload.discountPercentage,
      category: LOG_CATEGORIES.BUSINESS,
    });

    const result = await prisma.popupSettings.upsert({
      where: { shop: sanitizedShop },
      update: payload,
      create: { shop: sanitizedShop, ...payload },
    });
    
    return result;
  } catch (error) {
    log.error('Failed to save popup settings', {
      shop,
      error: error.message,
      category: LOG_CATEGORIES.DATABASE,
      validationError: error instanceof ValidationError,
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error('Failed to save popup settings');
  }
}

export const defaults = DEFAULTS;
