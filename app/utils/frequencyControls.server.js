/**
 * Popup Frequency Controls System
 * Priority #20 - Advanced timing controls to prevent popup fatigue and optimize user experience
 * 
 * This module provides comprehensive frequency management including:
 * - User-specific frequency limits
 * - Session-based controls
 * - Global cooldown periods
 * - Smart frequency adaptation
 * - User behavior analysis
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive unit tests for frequency calculations
 * - [ ] Test edge cases (timezone changes, clock adjustments)
 * - [ ] Create integration tests with popup system
 * - [ ] Test user behavior tracking accuracy
 * - [ ] Add E2E tests for frequency limiting
 * - [ ] Test smart adaptive algorithm effectiveness
 * - [ ] Validate performance with high traffic
 * - [ ] Integration with analytics and reporting
 * - [ ] Test session management across devices
 * - [ ] Database schema integration for frequency data
 */

// Frequency control types
export const FREQUENCY_TYPES = {
  GLOBAL: 'global',
  PER_USER: 'per_user',
  PER_SESSION: 'per_session',
  PER_PAGE: 'per_page',
  SMART_ADAPTIVE: 'smart_adaptive'
};

// Frequency rules
export const FREQUENCY_RULES = {
  MAX_PER_HOUR: 'max_per_hour',
  MAX_PER_DAY: 'max_per_day',
  MAX_PER_WEEK: 'max_per_week',
  MAX_PER_MONTH: 'max_per_month',
  MIN_INTERVAL: 'min_interval',
  COOLDOWN_PERIOD: 'cooldown_period'
};

// User behavior states
export const USER_STATES = {
  NEW_VISITOR: 'new_visitor',
  RETURNING_VISITOR: 'returning_visitor',
  ENGAGED_USER: 'engaged_user',
  CONVERTED_USER: 'converted_user',
  POPUP_DISMISSER: 'popup_dismisser',
  POPUP_BLOCKER: 'popup_blocker'
};

/**
 * Main Frequency Control Manager
 */
export class FrequencyManager {
  constructor(options = {}) {
    this.options = {
      defaultCooldown: options.defaultCooldown || 3600000, // 1 hour in ms
      maxPerDay: options.maxPerDay || 3,
      maxPerSession: options.maxPerSession || 1,
      adaptiveLearning: options.adaptiveLearning !== false,
      respectUserPreferences: options.respectUserPreferences !== false,
      ...options
    };
    
    this.userInteractions = new Map();
    this.sessionData = new Map();
    this.globalCounters = new Map();
    this.userBehaviorProfiles = new Map();
    this.frequencyRules = new Map();
  }

  /**
   * Check if a popup can be shown to a user
   */
  canShowPopup(userId, popupId, sessionId, context = {}) {
    const checks = [
      () => this.checkGlobalLimits(popupId),
      () => this.checkUserLimits(userId, popupId),
      () => this.checkSessionLimits(sessionId, popupId),
      () => this.checkCooldownPeriod(userId, popupId),
      () => this.checkUserBehavior(userId, context),
      () => this.checkPageSpecificLimits(context.page, popupId),
      () => this.checkTimeBasedRules(popupId, context.timestamp)
    ];

    for (const check of checks) {
      const result = check();
      if (!result.allowed) {
        return {
          allowed: false,
          reason: result.reason,
          nextAllowedTime: result.nextAllowedTime,
          suggestions: result.suggestions || []
        };
      }
    }

    // Record the intention to show (actual showing should call recordShown)
    this.recordShowAttempt(userId, popupId, sessionId, context);

    return {
      allowed: true,
      priority: this.calculatePriority(userId, popupId, context),
      optimizedTiming: this.suggestOptimalTiming(userId, context)
    };
  }

  /**
   * Record that a popup was actually shown
   */
  recordShown(userId, popupId, sessionId, context = {}) {
    const timestamp = context.timestamp || Date.now();
    
    // Update user interactions
    if (!this.userInteractions.has(userId)) {
      this.userInteractions.set(userId, {
        totalShown: 0,
        popupHistory: [],
        lastSeen: {},
        preferences: {}
      });
    }
    
    const userStats = this.userInteractions.get(userId);
    userStats.totalShown++;
    userStats.lastSeen[popupId] = timestamp;
    userStats.popupHistory.push({
      popupId,
      timestamp,
      sessionId,
      context
    });

    // Keep history manageable
    if (userStats.popupHistory.length > 100) {
      userStats.popupHistory = userStats.popupHistory.slice(-50);
    }

    // Update session data
    if (!this.sessionData.has(sessionId)) {
      this.sessionData.set(sessionId, {
        startTime: timestamp,
        popupsShown: [],
        userInteractions: 0
      });
    }
    
    const sessionStats = this.sessionData.get(sessionId);
    sessionStats.popupsShown.push({
      popupId,
      timestamp,
      context
    });

    // Update global counters
    const today = this.getDateKey(new Date(timestamp));
    if (!this.globalCounters.has(today)) {
      this.globalCounters.set(today, {});
    }
    
    const dayCounters = this.globalCounters.get(today);
    dayCounters[popupId] = (dayCounters[popupId] || 0) + 1;

    // Trigger adaptive learning
    if (this.options.adaptiveLearning) {
      this.updateBehaviorProfile(userId, 'popup_shown', { popupId, context });
    }
  }

  /**
   * Record user interaction with popup
   */
  recordInteraction(userId, popupId, action, context = {}) {
    const timestamp = context.timestamp || Date.now();
    
    if (!this.userInteractions.has(userId)) {
      this.userInteractions.set(userId, {
        totalShown: 0,
        popupHistory: [],
        lastSeen: {},
        preferences: {}
      });
    }

    const userStats = this.userInteractions.get(userId);
    
    // Update last interaction in history
    const lastInteraction = userStats.popupHistory[userStats.popupHistory.length - 1];
    if (lastInteraction && lastInteraction.popupId === popupId) {
      lastInteraction.action = action;
      lastInteraction.actionTimestamp = timestamp;
      lastInteraction.responseTime = timestamp - lastInteraction.timestamp;
    }

    // Update behavior profile
    this.updateBehaviorProfile(userId, action, { popupId, context, responseTime: lastInteraction?.responseTime });

    // Adjust frequency based on interaction
    this.adaptFrequencyBasedOnInteraction(userId, popupId, action);
  }

  /**
   * Set custom frequency rules for specific popups
   */
  setFrequencyRule(popupId, rule, value, options = {}) {
    if (!this.frequencyRules.has(popupId)) {
      this.frequencyRules.set(popupId, {});
    }
    
    const rules = this.frequencyRules.get(popupId);
    rules[rule] = {
      value,
      enabled: options.enabled !== false,
      priority: options.priority || 1,
      conditions: options.conditions || {},
      createdAt: Date.now()
    };
  }

  /**
   * Get user's frequency preferences
   */
  getUserPreferences(userId) {
    const userStats = this.userInteractions.get(userId);
    return userStats?.preferences || {};
  }

  /**
   * Set user's frequency preferences
   */
  setUserPreferences(userId, preferences) {
    if (!this.userInteractions.has(userId)) {
      this.userInteractions.set(userId, {
        totalShown: 0,
        popupHistory: [],
        lastSeen: {},
        preferences: {}
      });
    }
    
    const userStats = this.userInteractions.get(userId);
    userStats.preferences = { ...userStats.preferences, ...preferences };
  }

  /**
   * Get frequency analytics
   */
  getFrequencyAnalytics(timeRange = 7) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (timeRange * 24 * 60 * 60 * 1000));
    
    const analytics = {
      totalPopupsShown: 0,
      uniqueUsers: new Set(),
      popupBreakdown: {},
      userBehaviorStats: {},
      frequencyDistribution: {},
      conversionByFrequency: {},
      optimalFrequencyInsights: {}
    };

    // Analyze user interactions
    for (const [userId, userData] of this.userInteractions) {
      analytics.uniqueUsers.add(userId);
      
      const relevantHistory = userData.popupHistory.filter(
        item => item.timestamp >= startDate.getTime() && item.timestamp <= endDate.getTime()
      );

      analytics.totalPopupsShown += relevantHistory.length;

      // Popup breakdown
      relevantHistory.forEach(item => {
        analytics.popupBreakdown[item.popupId] = 
          (analytics.popupBreakdown[item.popupId] || 0) + 1;
      });

      // Frequency distribution
      const userFrequency = relevantHistory.length;
      const frequencyBucket = this.getFrequencyBucket(userFrequency);
      analytics.frequencyDistribution[frequencyBucket] = 
        (analytics.frequencyDistribution[frequencyBucket] || 0) + 1;

      // User behavior analysis
      const behaviorProfile = this.userBehaviorProfiles.get(userId);
      if (behaviorProfile) {
        const userState = this.classifyUserBehavior(behaviorProfile);
        analytics.userBehaviorStats[userState] = 
          (analytics.userBehaviorStats[userState] || 0) + 1;
      }
    }

    analytics.uniqueUsers = analytics.uniqueUsers.size;
    
    // Calculate optimal frequency insights
    analytics.optimalFrequencyInsights = this.calculateOptimalFrequency(analytics);

    return analytics;
  }

  /**
   * Reset frequency data for a user
   */
  resetUserFrequency(userId, popupId = null) {
    const userStats = this.userInteractions.get(userId);
    if (!userStats) return;

    if (popupId) {
      // Reset specific popup frequency
      delete userStats.lastSeen[popupId];
      userStats.popupHistory = userStats.popupHistory.filter(
        item => item.popupId !== popupId
      );
    } else {
      // Reset all frequency data for user
      userStats.totalShown = 0;
      userStats.popupHistory = [];
      userStats.lastSeen = {};
    }
  }

  /**
   * Export frequency settings
   */
  exportSettings() {
    return {
      options: this.options,
      frequencyRules: Object.fromEntries(this.frequencyRules),
      userPreferences: Object.fromEntries(
        Array.from(this.userInteractions.entries()).map(([userId, data]) => [
          userId,
          data.preferences
        ])
      )
    };
  }

  /**
   * Import frequency settings
   */
  importSettings(settings) {
    if (settings.options) {
      this.options = { ...this.options, ...settings.options };
    }
    
    if (settings.frequencyRules) {
      this.frequencyRules = new Map(Object.entries(settings.frequencyRules));
    }
    
    if (settings.userPreferences) {
      Object.entries(settings.userPreferences).forEach(([userId, preferences]) => {
        this.setUserPreferences(userId, preferences);
      });
    }
  }

  // === Private Helper Methods ===

  checkGlobalLimits(popupId) {
    const today = this.getDateKey(new Date());
    const dayCounters = this.globalCounters.get(today) || {};
    const todayCount = dayCounters[popupId] || 0;

    // Check popup-specific rules
    const rules = this.frequencyRules.get(popupId);
    if (rules && rules[FREQUENCY_RULES.MAX_PER_DAY]) {
      const maxPerDay = rules[FREQUENCY_RULES.MAX_PER_DAY].value;
      if (todayCount >= maxPerDay) {
        return {
          allowed: false,
          reason: 'Global daily limit reached',
          nextAllowedTime: this.getNextDay()
        };
      }
    }

    return { allowed: true };
  }

  checkUserLimits(userId, popupId) {
    const userStats = this.userInteractions.get(userId);
    if (!userStats) return { allowed: true };

    // Check user preferences
    if (this.options.respectUserPreferences && userStats.preferences.maxPerDay) {
      const today = this.getDateKey(new Date());
      const todayShown = userStats.popupHistory.filter(
        item => this.getDateKey(new Date(item.timestamp)) === today
      ).length;

      if (todayShown >= userStats.preferences.maxPerDay) {
        return {
          allowed: false,
          reason: 'User daily preference limit reached',
          nextAllowedTime: this.getNextDay()
        };
      }
    }

    // Check default daily limit
    const today = this.getDateKey(new Date());
    const todayShown = userStats.popupHistory.filter(
      item => this.getDateKey(new Date(item.timestamp)) === today
    ).length;

    if (todayShown >= this.options.maxPerDay) {
      return {
        allowed: false,
        reason: 'User daily limit reached',
        nextAllowedTime: this.getNextDay()
      };
    }

    return { allowed: true };
  }

  checkSessionLimits(sessionId, popupId) {
    const sessionStats = this.sessionData.get(sessionId);
    if (!sessionStats) return { allowed: true };

    if (sessionStats.popupsShown.length >= this.options.maxPerSession) {
      return {
        allowed: false,
        reason: 'Session limit reached',
        suggestions: ['Wait for next session', 'Reduce session frequency']
      };
    }

    return { allowed: true };
  }

  checkCooldownPeriod(userId, popupId) {
    const userStats = this.userInteractions.get(userId);
    if (!userStats || !userStats.lastSeen[popupId]) return { allowed: true };

    const lastSeen = userStats.lastSeen[popupId];
    const timeSinceLastSeen = Date.now() - lastSeen;

    // Check popup-specific cooldown
    const rules = this.frequencyRules.get(popupId);
    const cooldownPeriod = rules?.[FREQUENCY_RULES.COOLDOWN_PERIOD]?.value || this.options.defaultCooldown;

    if (timeSinceLastSeen < cooldownPeriod) {
      return {
        allowed: false,
        reason: 'Cooldown period active',
        nextAllowedTime: lastSeen + cooldownPeriod
      };
    }

    return { allowed: true };
  }

  checkUserBehavior(userId, context) {
    const behaviorProfile = this.userBehaviorProfiles.get(userId);
    if (!behaviorProfile) return { allowed: true };

    const userState = this.classifyUserBehavior(behaviorProfile);

    // Adjust based on user behavior
    switch (userState) {
      case USER_STATES.POPUP_BLOCKER:
        return {
          allowed: false,
          reason: 'User frequently blocks popups',
          suggestions: ['Try different popup types', 'Reduce frequency further']
        };
        
      case USER_STATES.POPUP_DISMISSER:
        // Reduce frequency for users who frequently dismiss
        const dismissRate = behaviorProfile.dismissals / behaviorProfile.totalShown;
        if (dismissRate > 0.8) {
          return {
            allowed: Math.random() < 0.3, // 30% chance
            reason: 'High dismissal rate - reduced frequency'
          };
        }
        break;
        
      case USER_STATES.CONVERTED_USER:
        // Reduce frequency for users who already converted
        return {
          allowed: Math.random() < 0.1, // 10% chance
          reason: 'User already converted'
        };
    }

    return { allowed: true };
  }

  checkPageSpecificLimits(page, popupId) {
    // Could implement page-specific frequency rules
    return { allowed: true };
  }

  checkTimeBasedRules(popupId, timestamp) {
    const now = new Date(timestamp || Date.now());
    const hour = now.getHours();

    // Check hourly limits
    const rules = this.frequencyRules.get(popupId);
    if (rules && rules[FREQUENCY_RULES.MAX_PER_HOUR]) {
      const maxPerHour = rules[FREQUENCY_RULES.MAX_PER_HOUR].value;
      const hourKey = `${this.getDateKey(now)}_${hour}`;
      
      // This would need to be tracked separately
      // Simplified for now
    }

    return { allowed: true };
  }

  recordShowAttempt(userId, popupId, sessionId, context) {
    // Record attempt for analytics
  }

  calculatePriority(userId, popupId, context) {
    const behaviorProfile = this.userBehaviorProfiles.get(userId);
    if (!behaviorProfile) return 5; // Default priority

    // Adjust priority based on user behavior
    const userState = this.classifyUserBehavior(behaviorProfile);
    
    switch (userState) {
      case USER_STATES.NEW_VISITOR:
        return 8; // High priority for new visitors
      case USER_STATES.ENGAGED_USER:
        return 7; // High priority for engaged users
      case USER_STATES.CONVERTED_USER:
        return 2; // Low priority for converted users
      case USER_STATES.POPUP_DISMISSER:
        return 3; // Low priority for frequent dismissers
      default:
        return 5;
    }
  }

  suggestOptimalTiming(userId, context) {
    // Suggest optimal timing based on user behavior patterns
    const behaviorProfile = this.userBehaviorProfiles.get(userId);
    if (!behaviorProfile || !behaviorProfile.interactionTimes) {
      return null;
    }

    // Find peak interaction times
    const hourCounts = {};
    behaviorProfile.interactionTimes.forEach(time => {
      const hour = new Date(time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const bestHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return bestHour ? {
      suggestedHour: parseInt(bestHour),
      confidence: hourCounts[bestHour] / behaviorProfile.interactionTimes.length
    } : null;
  }

  updateBehaviorProfile(userId, action, data) {
    if (!this.userBehaviorProfiles.has(userId)) {
      this.userBehaviorProfiles.set(userId, {
        totalShown: 0,
        conversions: 0,
        dismissals: 0,
        interactions: 0,
        interactionTimes: [],
        responseTimeAvg: 0,
        lastActivity: Date.now()
      });
    }

    const profile = this.userBehaviorProfiles.get(userId);
    profile.lastActivity = Date.now();

    switch (action) {
      case 'popup_shown':
        profile.totalShown++;
        break;
      case 'converted':
        profile.conversions++;
        profile.interactions++;
        profile.interactionTimes.push(Date.now());
        break;
      case 'dismissed':
        profile.dismissals++;
        profile.interactions++;
        profile.interactionTimes.push(Date.now());
        break;
      case 'clicked':
        profile.interactions++;
        profile.interactionTimes.push(Date.now());
        if (data.responseTime) {
          profile.responseTimeAvg = (profile.responseTimeAvg + data.responseTime) / 2;
        }
        break;
    }

    // Keep interaction times manageable
    if (profile.interactionTimes.length > 50) {
      profile.interactionTimes = profile.interactionTimes.slice(-25);
    }
  }

  adaptFrequencyBasedOnInteraction(userId, popupId, action) {
    if (!this.options.adaptiveLearning) return;

    const userStats = this.userInteractions.get(userId);
    if (!userStats) return;

    // Adjust user preferences based on behavior
    switch (action) {
      case 'dismissed':
        // Reduce frequency after dismissals
        const currentMax = userStats.preferences.maxPerDay || this.options.maxPerDay;
        userStats.preferences.maxPerDay = Math.max(1, Math.floor(currentMax * 0.8));
        break;
        
      case 'converted':
        // Reduce frequency significantly after conversion
        userStats.preferences.maxPerDay = 1;
        break;
        
      case 'blocked':
        // Minimize frequency after blocking
        userStats.preferences.maxPerDay = 0;
        break;
    }
  }

  classifyUserBehavior(behaviorProfile) {
    if (behaviorProfile.totalShown === 0) {
      return USER_STATES.NEW_VISITOR;
    }

    const conversionRate = behaviorProfile.conversions / behaviorProfile.totalShown;
    const dismissalRate = behaviorProfile.dismissals / behaviorProfile.totalShown;

    if (conversionRate > 0.1) {
      return USER_STATES.CONVERTED_USER;
    }
    
    if (dismissalRate > 0.8) {
      return USER_STATES.POPUP_DISMISSER;
    }
    
    if (behaviorProfile.interactions > 5 && dismissalRate < 0.3) {
      return USER_STATES.ENGAGED_USER;
    }
    
    if (behaviorProfile.totalShown > 1) {
      return USER_STATES.RETURNING_VISITOR;
    }

    return USER_STATES.NEW_VISITOR;
  }

  getFrequencyBucket(frequency) {
    if (frequency === 0) return '0';
    if (frequency === 1) return '1';
    if (frequency <= 3) return '2-3';
    if (frequency <= 5) return '4-5';
    if (frequency <= 10) return '6-10';
    return '10+';
  }

  calculateOptimalFrequency(analytics) {
    // Analyze conversion rates by frequency to suggest optimal settings
    const insights = {};
    
    // This would be more sophisticated in practice
    insights.recommendedMaxPerDay = 3;
    insights.recommendedCooldown = 3600000; // 1 hour
    insights.suggestedImprovements = [
      'Consider reducing frequency for high-dismissal users',
      'Increase frequency for engaged new visitors',
      'Implement time-based optimization'
    ];

    return insights;
  }

  getDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  getNextDay() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
}

/**
 * Create a frequency manager instance
 */
export function createFrequencyManager(options = {}) {
  return new FrequencyManager(options);
}

/**
 * Preset frequency configurations
 */
export const FREQUENCY_PRESETS = {
  CONSERVATIVE: {
    maxPerDay: 1,
    maxPerSession: 1,
    defaultCooldown: 24 * 60 * 60 * 1000, // 24 hours
    adaptiveLearning: true
  },
  
  MODERATE: {
    maxPerDay: 3,
    maxPerSession: 2,
    defaultCooldown: 4 * 60 * 60 * 1000, // 4 hours
    adaptiveLearning: true
  },
  
  AGGRESSIVE: {
    maxPerDay: 5,
    maxPerSession: 3,
    defaultCooldown: 1 * 60 * 60 * 1000, // 1 hour
    adaptiveLearning: true
  },
  
  MINIMAL: {
    maxPerDay: 1,
    maxPerSession: 1,
    defaultCooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
    adaptiveLearning: false
  }
};

console.log('StayBoost Popup Frequency Controls loaded successfully');
