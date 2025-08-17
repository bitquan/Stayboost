/**
 * Popup Scheduling System
 * Priority #19 - Advanced time-based popup activation for holidays, sales, and special events
 * 
 * This module provides comprehensive scheduling capabilities including:
 * - Date/time-based activation
 * - Holiday and event scheduling
 * - Timezone support
 * - Recurring schedules
 * - Campaign management
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive unit tests for schedule validation
 * - [ ] Test timezone conversion accuracy
 * - [ ] Create integration tests with popup system
 * - [ ] Test recurring schedule calculations
 * - [ ] Add E2E tests for scheduled popup activation
 * - [ ] Test holiday detection and automatic scheduling
 * - [ ] Validate edge cases (leap years, DST changes)
 * - [ ] Test schedule conflict resolution
 * - [ ] Integration with admin dashboard UI
 * - [ ] Database schema integration for schedule persistence
 */

import { addDays, addMonths, addWeeks, addYears, endOfDay, isAfter, isWithinInterval, startOfDay } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

// Schedule types
export const SCHEDULE_TYPES = {
  ONE_TIME: 'one_time',
  DAILY: 'daily', 
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
};

// Event categories for predefined templates
export const EVENT_CATEGORIES = {
  HOLIDAY: 'holiday',
  SALE: 'sale',
  PROMOTION: 'promotion',
  SEASONAL: 'seasonal',
  CUSTOM: 'custom'
};

// Popular holidays and events (can be expanded)
export const PREDEFINED_EVENTS = {
  // Major holidays
  NEW_YEAR: {
    name: 'New Year\'s Day',
    category: EVENT_CATEGORIES.HOLIDAY,
    dates: ['2024-01-01', '2025-01-01', '2026-01-01'],
    defaultTemplate: 'celebration'
  },
  VALENTINE: {
    name: 'Valentine\'s Day',
    category: EVENT_CATEGORIES.HOLIDAY,
    dates: ['2024-02-14', '2025-02-14', '2026-02-14'],
    defaultTemplate: 'romantic'
  },
  BLACK_FRIDAY: {
    name: 'Black Friday',
    category: EVENT_CATEGORIES.SALE,
    dates: ['2024-11-29', '2025-11-28', '2026-11-27'],
    defaultTemplate: 'urgency'
  },
  CYBER_MONDAY: {
    name: 'Cyber Monday',
    category: EVENT_CATEGORIES.SALE,
    dates: ['2024-12-02', '2025-12-01', '2026-11-30'],
    defaultTemplate: 'digital_sale'
  },
  CHRISTMAS: {
    name: 'Christmas',
    category: EVENT_CATEGORIES.HOLIDAY,
    dates: ['2024-12-25', '2025-12-25', '2026-12-25'],
    defaultTemplate: 'holiday'
  },
  
  // Seasonal events
  SPRING_SALE: {
    name: 'Spring Sale',
    category: EVENT_CATEGORIES.SEASONAL,
    dates: ['2024-03-20', '2025-03-20', '2026-03-20'],
    defaultTemplate: 'seasonal'
  },
  SUMMER_SALE: {
    name: 'Summer Sale', 
    category: EVENT_CATEGORIES.SEASONAL,
    dates: ['2024-06-21', '2025-06-21', '2026-06-21'],
    defaultTemplate: 'seasonal'
  },
  FALL_SALE: {
    name: 'Fall Sale',
    category: EVENT_CATEGORIES.SEASONAL,
    dates: ['2024-09-22', '2025-09-22', '2026-09-22'],
    defaultTemplate: 'seasonal'
  },
  WINTER_SALE: {
    name: 'Winter Sale',
    category: EVENT_CATEGORIES.SEASONAL,
    dates: ['2024-12-21', '2025-12-21', '2026-12-21'],
    defaultTemplate: 'seasonal'
  }
};

/**
 * Main Scheduling Manager
 */
export class ScheduleManager {
  constructor(timezone = 'UTC') {
    this.timezone = timezone;
    this.schedules = new Map();
    this.activeSchedules = new Set();
  }

  /**
   * Create a new schedule
   */
  createSchedule(scheduleConfig) {
    const schedule = {
      id: scheduleConfig.id || this.generateId(),
      name: scheduleConfig.name,
      type: scheduleConfig.type || SCHEDULE_TYPES.ONE_TIME,
      startDate: scheduleConfig.startDate,
      endDate: scheduleConfig.endDate,
      startTime: scheduleConfig.startTime || '00:00',
      endTime: scheduleConfig.endTime || '23:59',
      timezone: scheduleConfig.timezone || this.timezone,
      recurrence: scheduleConfig.recurrence || {},
      popupConfig: scheduleConfig.popupConfig || {},
      isActive: scheduleConfig.isActive !== false,
      priority: scheduleConfig.priority || 1,
      conditions: scheduleConfig.conditions || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate schedule
    this.validateSchedule(schedule);
    
    // Store schedule
    this.schedules.set(schedule.id, schedule);
    
    return schedule;
  }

  /**
   * Create schedule from predefined event
   */
  createEventSchedule(eventKey, customConfig = {}) {
    const event = PREDEFINED_EVENTS[eventKey];
    if (!event) {
      throw new Error(`Unknown predefined event: ${eventKey}`);
    }

    const currentYear = new Date().getFullYear();
    const eventDate = event.dates.find(date => 
      new Date(date).getFullYear() >= currentYear
    );

    if (!eventDate) {
      throw new Error(`No future dates available for event: ${event.name}`);
    }

    const scheduleConfig = {
      name: customConfig.name || `${event.name} Campaign`,
      type: SCHEDULE_TYPES.ONE_TIME,
      startDate: eventDate,
      endDate: customConfig.endDate || eventDate,
      popupConfig: {
        template: event.defaultTemplate,
        ...customConfig.popupConfig
      },
      ...customConfig
    };

    return this.createSchedule(scheduleConfig);
  }

  /**
   * Create recurring schedule
   */
  createRecurringSchedule(baseConfig, recurrenceConfig) {
    const schedule = {
      ...baseConfig,
      type: recurrenceConfig.type,
      recurrence: {
        interval: recurrenceConfig.interval || 1,
        daysOfWeek: recurrenceConfig.daysOfWeek || [],
        daysOfMonth: recurrenceConfig.daysOfMonth || [],
        monthsOfYear: recurrenceConfig.monthsOfYear || [],
        exceptions: recurrenceConfig.exceptions || [],
        endRecurrence: recurrenceConfig.endRecurrence || null,
        maxOccurrences: recurrenceConfig.maxOccurrences || null
      }
    };

    return this.createSchedule(schedule);
  }

  /**
   * Check if a schedule should be active at a given time
   */
  isScheduleActive(scheduleId, checkTime = new Date()) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.isActive) {
      return false;
    }

    // Convert check time to schedule timezone
    const zonedCheckTime = toZonedTime(checkTime, schedule.timezone);
    
    // Check date range
    if (!this.isDateInRange(zonedCheckTime, schedule)) {
      return false;
    }

    // Check time range
    if (!this.isTimeInRange(zonedCheckTime, schedule)) {
      return false;
    }

    // Check recurrence rules
    if (schedule.type !== SCHEDULE_TYPES.ONE_TIME) {
      if (!this.matchesRecurrence(zonedCheckTime, schedule)) {
        return false;
      }
    }

    // Check additional conditions
    if (!this.checkConditions(schedule.conditions, checkTime)) {
      return false;
    }

    return true;
  }

  /**
   * Get all active schedules for a given time
   */
  getActiveSchedules(checkTime = new Date()) {
    const activeSchedules = [];
    
    for (const [scheduleId, schedule] of this.schedules) {
      if (this.isScheduleActive(scheduleId, checkTime)) {
        activeSchedules.push(schedule);
      }
    }

    // Sort by priority (higher priority first)
    return activeSchedules.sort((a, b) => (b.priority || 1) - (a.priority || 1));
  }

  /**
   * Get next scheduled activation
   */
  getNextActivation(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const now = new Date();
    const startDate = new Date(schedule.startDate);
    
    // For one-time schedules
    if (schedule.type === SCHEDULE_TYPES.ONE_TIME) {
      if (isAfter(startDate, now)) {
        return this.combineDateTime(startDate, schedule.startTime, schedule.timezone);
      }
      return null;
    }

    // For recurring schedules
    return this.calculateNextRecurrence(schedule, now);
  }

  /**
   * Generate schedule preview for next N occurrences
   */
  generateSchedulePreview(scheduleId, numberOfOccurrences = 10) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return [];

    const preview = [];
    let currentDate = new Date();
    
    // For one-time schedules
    if (schedule.type === SCHEDULE_TYPES.ONE_TIME) {
      const scheduledTime = this.combineDateTime(
        new Date(schedule.startDate), 
        schedule.startTime, 
        schedule.timezone
      );
      
      if (isAfter(scheduledTime, currentDate)) {
        preview.push({
          date: scheduledTime,
          duration: this.calculateDuration(schedule),
          active: this.isScheduleActive(scheduleId, scheduledTime)
        });
      }
      return preview;
    }

    // For recurring schedules
    let occurrences = 0;
    const maxIterations = 1000; // Prevent infinite loops
    let iterations = 0;

    while (occurrences < numberOfOccurrences && iterations < maxIterations) {
      const nextOccurrence = this.getNextActivation(scheduleId);
      if (!nextOccurrence) break;

      preview.push({
        date: nextOccurrence,
        duration: this.calculateDuration(schedule),
        active: true
      });

      occurrences++;
      iterations++;
      
      // Move to next potential occurrence
      currentDate = this.getNextPotentialDate(currentDate, schedule);
    }

    return preview;
  }

  /**
   * Bulk schedule management
   */
  createBulkSchedules(scheduleConfigs) {
    const results = {
      created: [],
      errors: []
    };

    scheduleConfigs.forEach((config, index) => {
      try {
        const schedule = this.createSchedule(config);
        results.created.push(schedule);
      } catch (error) {
        results.errors.push({
          index,
          config,
          error: error.message
        });
      }
    });

    return results;
  }

  /**
   * Schedule conflict detection
   */
  detectConflicts(scheduleId = null) {
    const conflicts = [];
    const schedulesToCheck = scheduleId ? 
      [this.schedules.get(scheduleId)] : 
      Array.from(this.schedules.values());

    schedulesToCheck.forEach(schedule => {
      if (!schedule) return;

      // Check for overlapping schedules with same priority
      const overlapping = this.findOverlappingSchedules(schedule);
      if (overlapping.length > 0) {
        conflicts.push({
          schedule,
          type: 'overlap',
          conflictsWith: overlapping
        });
      }

      // Check for resource conflicts (if applicable)
      const resourceConflicts = this.findResourceConflicts(schedule);
      if (resourceConflicts.length > 0) {
        conflicts.push({
          schedule,
          type: 'resource',
          conflictsWith: resourceConflicts
        });
      }
    });

    return conflicts;
  }

  /**
   * Schedule statistics and analytics
   */
  getScheduleStatistics() {
    const stats = {
      total: this.schedules.size,
      active: 0,
      byType: {},
      byCategory: {},
      upcomingCount: 0,
      pastCount: 0
    };

    const now = new Date();

    for (const schedule of this.schedules.values()) {
      // Active count
      if (schedule.isActive) {
        stats.active++;
      }

      // By type
      stats.byType[schedule.type] = (stats.byType[schedule.type] || 0) + 1;

      // By category (if available)
      const category = schedule.popupConfig?.category || 'uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Timing stats
      const startDate = new Date(schedule.startDate);
      if (isAfter(startDate, now)) {
        stats.upcomingCount++;
      } else {
        stats.pastCount++;
      }
    }

    return stats;
  }

  // === Private Helper Methods ===

  generateId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateSchedule(schedule) {
    if (!schedule.name) {
      throw new Error('Schedule name is required');
    }

    if (!schedule.startDate) {
      throw new Error('Start date is required');
    }

    if (schedule.endDate && isAfter(new Date(schedule.startDate), new Date(schedule.endDate))) {
      throw new Error('End date must be after start date');
    }

    if (!Object.values(SCHEDULE_TYPES).includes(schedule.type)) {
      throw new Error(`Invalid schedule type: ${schedule.type}`);
    }
  }

  isDateInRange(checkDate, schedule) {
    const startDate = startOfDay(new Date(schedule.startDate));
    const endDate = schedule.endDate ? 
      endOfDay(new Date(schedule.endDate)) : 
      endOfDay(new Date('2099-12-31'));

    return isWithinInterval(checkDate, { start: startDate, end: endDate });
  }

  isTimeInRange(checkTime, schedule) {
    const timeStr = formatInTimeZone(checkTime, schedule.timezone, 'HH:mm');
    return timeStr >= schedule.startTime && timeStr <= schedule.endTime;
  }

  matchesRecurrence(checkTime, schedule) {
    const { recurrence } = schedule;
    
    switch (schedule.type) {
      case SCHEDULE_TYPES.DAILY:
        return this.matchesDailyRecurrence(checkTime, recurrence);
      case SCHEDULE_TYPES.WEEKLY:
        return this.matchesWeeklyRecurrence(checkTime, recurrence);
      case SCHEDULE_TYPES.MONTHLY:
        return this.matchesMonthlyRecurrence(checkTime, recurrence);
      case SCHEDULE_TYPES.YEARLY:
        return this.matchesYearlyRecurrence(checkTime, recurrence);
      default:
        return true;
    }
  }

  matchesDailyRecurrence(checkTime, recurrence) {
    const startDate = new Date(checkTime);
    const daysDiff = Math.floor((startDate - new Date()) / (1000 * 60 * 60 * 24));
    return daysDiff % (recurrence.interval || 1) === 0;
  }

  matchesWeeklyRecurrence(checkTime, recurrence) {
    const dayOfWeek = checkTime.getDay();
    return recurrence.daysOfWeek?.includes(dayOfWeek) || false;
  }

  matchesMonthlyRecurrence(checkTime, recurrence) {
    const dayOfMonth = checkTime.getDate();
    return recurrence.daysOfMonth?.includes(dayOfMonth) || false;
  }

  matchesYearlyRecurrence(checkTime, recurrence) {
    const month = checkTime.getMonth() + 1;
    return recurrence.monthsOfYear?.includes(month) || false;
  }

  checkConditions(conditions, checkTime) {
    // Implement custom condition checking
    // This could include weather, user behavior, inventory levels, etc.
    return true;
  }

  combineDateTime(date, time, timezone) {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    
    // Convert to UTC using fromZonedTime
    return fromZonedTime(combined, 'UTC');
  }

  calculateDuration(schedule) {
    const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
    
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    return endMinutesTotal - startMinutesTotal;
  }

  calculateNextRecurrence(schedule, fromDate) {
    // Implementation depends on schedule type
    // This is a simplified version
    const startDate = new Date(schedule.startDate);
    
    switch (schedule.type) {
      case SCHEDULE_TYPES.DAILY:
        return addDays(fromDate, schedule.recurrence.interval || 1);
      case SCHEDULE_TYPES.WEEKLY:
        return addWeeks(fromDate, schedule.recurrence.interval || 1);
      case SCHEDULE_TYPES.MONTHLY:
        return addMonths(fromDate, schedule.recurrence.interval || 1);
      case SCHEDULE_TYPES.YEARLY:
        return addYears(fromDate, schedule.recurrence.interval || 1);
      default:
        return null;
    }
  }

  getNextPotentialDate(currentDate, schedule) {
    switch (schedule.type) {
      case SCHEDULE_TYPES.DAILY:
        return addDays(currentDate, 1);
      case SCHEDULE_TYPES.WEEKLY:
        return addDays(currentDate, 1);
      case SCHEDULE_TYPES.MONTHLY:
        return addDays(currentDate, 1);
      case SCHEDULE_TYPES.YEARLY:
        return addDays(currentDate, 1);
      default:
        return addDays(currentDate, 1);
    }
  }

  findOverlappingSchedules(targetSchedule) {
    const overlapping = [];
    
    for (const schedule of this.schedules.values()) {
      if (schedule.id === targetSchedule.id) continue;
      
      // Check if schedules overlap in time
      if (this.schedulesOverlap(targetSchedule, schedule)) {
        overlapping.push(schedule);
      }
    }
    
    return overlapping;
  }

  schedulesOverlap(schedule1, schedule2) {
    // Simplified overlap detection
    const start1 = new Date(schedule1.startDate);
    const end1 = schedule1.endDate ? new Date(schedule1.endDate) : new Date('2099-12-31');
    const start2 = new Date(schedule2.startDate);
    const end2 = schedule2.endDate ? new Date(schedule2.endDate) : new Date('2099-12-31');

    return !(isAfter(start1, end2) || isAfter(start2, end1));
  }

  findResourceConflicts(schedule) {
    // Implementation would depend on resource management requirements
    return [];
  }
}

/**
 * Create a schedule manager instance
 */
export function createScheduleManager(timezone = 'UTC') {
  return new ScheduleManager(timezone);
}

/**
 * Holiday Detection Utilities
 */
export class HolidayDetector {
  constructor(countryCode = 'US') {
    this.countryCode = countryCode;
    this.customHolidays = new Map();
  }

  addCustomHoliday(name, date, recurring = true) {
    this.customHolidays.set(name, { date, recurring });
  }

  isHoliday(date) {
    // Check predefined events
    const dateStr = date.toISOString().split('T')[0];
    
    for (const event of Object.values(PREDEFINED_EVENTS)) {
      if (event.category === EVENT_CATEGORIES.HOLIDAY && event.dates.includes(dateStr)) {
        return event;
      }
    }

    // Check custom holidays
    for (const [name, holiday] of this.customHolidays) {
      if (holiday.date === dateStr) {
        return { name, custom: true };
      }
    }

    return null;
  }

  getUpcomingHolidays(daysAhead = 30) {
    const upcoming = [];
    const today = new Date();
    
    for (let i = 0; i < daysAhead; i++) {
      const checkDate = addDays(today, i);
      const holiday = this.isHoliday(checkDate);
      
      if (holiday) {
        upcoming.push({
          date: checkDate,
          holiday
        });
      }
    }
    
    return upcoming;
  }
}

// Export schedule templates for common use cases
export const SCHEDULE_TEMPLATES = {
  FLASH_SALE: {
    name: 'Flash Sale',
    type: SCHEDULE_TYPES.ONE_TIME,
    priority: 10,
    popupConfig: {
      template: 'urgency',
      urgencyTimer: true
    }
  },
  
  WEEKEND_PROMOTION: {
    name: 'Weekend Promotion',
    type: SCHEDULE_TYPES.WEEKLY,
    recurrence: {
      daysOfWeek: [5, 6, 0], // Friday, Saturday, Sunday
      interval: 1
    },
    priority: 5
  },
  
  MONTHLY_NEWSLETTER: {
    name: 'Monthly Newsletter Signup',
    type: SCHEDULE_TYPES.MONTHLY,
    recurrence: {
      daysOfMonth: [1],
      interval: 1
    },
    priority: 3
  },
  
  HOLIDAY_CAMPAIGN: {
    name: 'Holiday Campaign',
    type: SCHEDULE_TYPES.ONE_TIME,
    priority: 8,
    popupConfig: {
      template: 'holiday'
    }
  }
};

console.log('StayBoost Popup Scheduling System loaded successfully');
