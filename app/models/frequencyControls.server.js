/**
 * Frequency Controls Database Model
 * 
 * PURPOSE: Database operations for popup frequency tracking and rules
 * MATCHES: prisma/schema.prisma - PopupFrequencyTracking and FrequencyRule models
 * DEPENDENCIES: prisma client from db.server.js
 * 
 * This model provides CRUD operations for:
 * - PopupFrequencyTracking: Track user interactions with popups
 * - FrequencyRule: Store frequency limits and rules per shop
 * 
 * INTEGRATION NOTES:
 * - Used by app/routes/app.frequency-controls.jsx for UI operations
 * - Used by app/utils/frequencyControls.server.js for business logic
 * - Database schema must match prisma/schema.prisma exactly
 */

import prisma from "../db.server";

// USER BEHAVIOR STATES - must match schema enum values
export const USER_STATES = {
  NEW_VISITOR: 'new_visitor',
  RETURNING_VISITOR: 'returning_visitor', 
  ENGAGED_USER: 'engaged_user',
  CONVERTED_USER: 'converted_user',
  POPUP_DISMISSER: 'popup_dismisser',
  POPUP_BLOCKER: 'popup_blocker'
};

// FREQUENCY RULE TYPES - must match schema enum values
export const FREQUENCY_RULE_TYPES = {
  GLOBAL: 'global',
  PER_USER: 'per_user', 
  PER_SESSION: 'per_session',
  PER_PAGE: 'per_page',
  SMART_ADAPTIVE: 'smart_adaptive'
};

/**
 * Get frequency tracking for a specific user and popup
 * @param {string} shop - Shop domain
 * @param {string} userIdentifier - User ID or session ID
 * @param {number} popupSettingsId - Popup settings ID
 * @returns {Promise<Object|null>} Frequency tracking data
 */
export async function getFrequencyTracking(shop, userIdentifier, popupSettingsId) {
  try {
    const tracking = await prisma.popupFrequencyTracking.findUnique({
      where: {
        shop_userIdentifier_popupSettingsId: {
          shop,
          userIdentifier, 
          popupSettingsId
        }
      }
    });
    
    return tracking;
  } catch (error) {
    console.error('Error getting frequency tracking:', error);
    return null;
  }
}

/**
 * Update or create frequency tracking record
 * @param {string} shop - Shop domain
 * @param {string} userIdentifier - User ID or session ID  
 * @param {number} popupSettingsId - Popup settings ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated tracking record
 */
export async function updateFrequencyTracking(shop, userIdentifier, popupSettingsId, updates) {
  try {
    const tracking = await prisma.popupFrequencyTracking.upsert({
      where: {
        shop_userIdentifier_popupSettingsId: {
          shop,
          userIdentifier,
          popupSettingsId
        }
      },
      create: {
        shop,
        userIdentifier,
        popupSettingsId,
        displayCount: updates.displayCount || 0,
        lastDisplay: updates.lastDisplay || null,
        conversionCount: updates.conversionCount || 0,
        lastConversion: updates.lastConversion || null,
        dismissalCount: updates.dismissalCount || 0,
        lastDismissal: updates.lastDismissal || null,
        userState: updates.userState || USER_STATES.NEW_VISITOR,
        behaviorScore: updates.behaviorScore || 0.0,
        adaptiveFrequency: updates.adaptiveFrequency || 1.0
      },
      update: updates
    });
    
    return tracking;
  } catch (error) {
    console.error('Error updating frequency tracking:', error);
    throw error;
  }
}

/**
 * Get all frequency rules for a shop
 * @param {string} shop - Shop domain
 * @returns {Promise<Array>} Array of frequency rules
 */
export async function getFrequencyRules(shop) {
  try {
    const rules = await prisma.frequencyRule.findMany({
      where: { shop, isActive: true },
      orderBy: { priority: 'desc' }
    });
    
    return rules;
  } catch (error) {
    console.error('Error getting frequency rules:', error);
    return [];
  }
}

/**
 * Create or update a frequency rule
 * @param {string} shop - Shop domain
 * @param {Object} ruleData - Rule configuration
 * @returns {Promise<Object>} Created/updated rule
 */
export async function upsertFrequencyRule(shop, ruleData) {
  try {
    const rule = await prisma.frequencyRule.upsert({
      where: {
        shop_name: {
          shop,
          name: ruleData.name
        }
      },
      create: {
        shop,
        ...ruleData
      },
      update: ruleData
    });
    
    return rule;
  } catch (error) {
    console.error('Error upserting frequency rule:', error);
    throw error;
  }
}

/**
 * Delete a frequency rule
 * @param {string} shop - Shop domain
 * @param {string} ruleName - Rule name to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFrequencyRule(shop, ruleName) {
  try {
    await prisma.frequencyRule.delete({
      where: {
        shop_name: {
          shop,
          name: ruleName
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting frequency rule:', error);
    return false;
  }
}

/**
 * Get frequency tracking analytics for dashboard
 * @param {string} shop - Shop domain
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Analytics summary
 */
export async function getFrequencyAnalytics(shop, days = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    // Get total unique users tracked
    const totalUsers = await prisma.popupFrequencyTracking.count({
      where: { 
        shop,
        updatedAt: { gte: since }
      }
    });
    
    // Get user state distribution
    const userStates = await prisma.popupFrequencyTracking.groupBy({
      by: ['userState'],
      where: { 
        shop,
        updatedAt: { gte: since }
      },
      _count: { userState: true }
    });
    
    // Get average behavior scores
    const avgBehaviorScore = await prisma.popupFrequencyTracking.aggregate({
      where: { 
        shop,
        updatedAt: { gte: since }
      },
      _avg: { behaviorScore: true }
    });
    
    return {
      totalUsers,
      userStates: userStates.reduce((acc, state) => {
        acc[state.userState] = state._count.userState;
        return acc;
      }, {}),
      averageBehaviorScore: avgBehaviorScore._avg.behaviorScore || 0,
      period: days
    };
  } catch (error) {
    console.error('Error getting frequency analytics:', error);
    return {
      totalUsers: 0,
      userStates: {},
      averageBehaviorScore: 0,
      period: days
    };
  }
}
