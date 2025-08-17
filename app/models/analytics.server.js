/**
 * StayBoost Analytics Data Model
 * Handles popup performance tracking and reporting
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive unit tests for all analytics functions
 * - [ ] Test data aggregation accuracy across time periods and timezones
 * - [ ] Create performance tests for high-volume data processing
 * - [ ] Test edge cases (timezone boundaries, leap years, DST changes)
 * - [ ] Add integration tests with popup system and API endpoints
 * - [ ] Test database optimization and indexing performance
 * - [ ] Validate analytics dashboard integration and real-time updates
 * - [ ] Test real-time analytics updates and WebSocket integration
 * - [ ] Add comprehensive data export functionality tests
 * - [ ] Test analytics data cleanup and archival processes
 * - [ ] Add tests for A/B testing analytics integration
 * - [ ] Test multi-language analytics tracking
 * - [ ] Validate frequency control analytics accuracy
 * - [ ] Add tests for revenue attribution calculations
 * - [ ] Test analytics data privacy and GDPR compliance
 * - [ ] Add monitoring for analytics data quality
 * - [ ] Test analytics API performance under load
 * - [ ] Validate conversion funnel analytics
 * - [ ] Add tests for cohort analysis calculations
 * - [ ] Test geographic analytics tracking
 */

import prisma from "../db.server.js";

// Analytics data model for StayBoost popup tracking

/**
 * Record an impression when popup is displayed
 * @param {string} shop - Shop domain
 * @param {number} popupSettingsId - ID of popup settings (optional)
 * @returns {Promise<Object>} Analytics record
 */
export async function recordImpression(shop, popupSettingsId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  // Try to find existing record for today
  let analytics = await prisma.popupAnalytics.findFirst({
    where: {
      shop,
      date: today,
    },
  });

  if (analytics) {
    // Update existing record
    analytics = await prisma.popupAnalytics.update({
      where: { id: analytics.id },
      data: { 
        impressions: analytics.impressions + 1,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new record for today
    analytics = await prisma.popupAnalytics.create({
      data: {
        shop,
        date: today,
        impressions: 1,
        conversions: 0,
        revenue: 0.0,
        popupSettingsId,
      },
    });
  }

  // Calculate conversion rate
  const conversionRate = analytics.impressions > 0 
    ? (analytics.conversions / analytics.impressions) * 100 
    : 0;

  return {
    ...analytics,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
  };
}

/**
 * Record a conversion when user uses popup offer
 * @param {string} shop - Shop domain
 * @param {number} revenue - Revenue from conversion (optional)
 * @param {number} popupSettingsId - ID of popup settings (optional)
 * @returns {Promise<Object>} Analytics record
 */
export async function recordConversion(shop, revenue = 0, popupSettingsId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  // Try to find existing record for today
  let analytics = await prisma.popupAnalytics.findFirst({
    where: {
      shop,
      date: today,
    },
  });

  if (analytics) {
    // Update existing record
    analytics = await prisma.popupAnalytics.update({
      where: { id: analytics.id },
      data: { 
        conversions: analytics.conversions + 1,
        revenue: analytics.revenue + revenue,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new record for today (with conversion but no impression - edge case)
    analytics = await prisma.popupAnalytics.create({
      data: {
        shop,
        date: today,
        impressions: 0,
        conversions: 1,
        revenue: revenue,
        popupSettingsId,
      },
    });
  }

  // Calculate conversion rate
  const conversionRate = analytics.impressions > 0 
    ? (analytics.conversions / analytics.impressions) * 100 
    : 0;

  return {
    ...analytics,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
  };
}

/**
 * Get analytics data for a shop within a date range
 * @param {string} shop - Shop domain
 * @param {Object} dateRange - Date range {start, end}
 * @returns {Promise<Array>} Analytics records
 */
export async function getAnalytics(shop, dateRange = null) {
  const where = { shop };

  if (dateRange && dateRange.start && dateRange.end) {
    where.date = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end),
    };
  }

  const analytics = await prisma.popupAnalytics.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  // Add calculated conversion rates
  return analytics.map(record => ({
    ...record,
    conversionRate: record.impressions > 0 
      ? parseFloat(((record.conversions / record.impressions) * 100).toFixed(2))
      : 0,
  }));
}

/**
 * Get dashboard stats for admin interface
 * @param {string} shop - Shop domain
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function getDashboardStats(shop) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get today's stats
  const todayStats = await prisma.popupAnalytics.findFirst({
    where: {
      shop,
      date: today,
    },
  });

  // Get all-time totals
  const allTimeStats = await prisma.popupAnalytics.aggregate({
    where: { shop },
    _sum: {
      impressions: true,
      conversions: true,
      revenue: true,
    },
  });

  // Get last 30 days for trends
  const thirtyDayStats = await prisma.popupAnalytics.aggregate({
    where: {
      shop,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    _sum: {
      impressions: true,
      conversions: true,
      revenue: true,
    },
  });

  const totalImpressions = allTimeStats._sum.impressions || 0;
  const totalConversions = allTimeStats._sum.conversions || 0;
  const totalRevenue = allTimeStats._sum.revenue || 0;

  const overallConversionRate = totalImpressions > 0 
    ? parseFloat(((totalConversions / totalImpressions) * 100).toFixed(2))
    : 0;

  return {
    today: {
      impressions: todayStats?.impressions || 0,
      conversions: todayStats?.conversions || 0,
      revenue: todayStats?.revenue || 0,
      conversionRate: todayStats && todayStats.impressions > 0 
        ? parseFloat(((todayStats.conversions / todayStats.impressions) * 100).toFixed(2))
        : 0,
    },
    allTime: {
      impressions: totalImpressions,
      conversions: totalConversions,
      revenue: totalRevenue,
      conversionRate: overallConversionRate,
    },
    thirtyDays: {
      impressions: thirtyDayStats._sum.impressions || 0,
      conversions: thirtyDayStats._sum.conversions || 0,
      revenue: thirtyDayStats._sum.revenue || 0,
    },
  };
}

/**
 * Get recent analytics records for charts/trends
 * @param {string} shop - Shop domain
 * @param {number} days - Number of days to fetch (default 30)
 * @returns {Promise<Array>} Recent analytics records
 */
export async function getRecentAnalytics(shop, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return await getAnalytics(shop, {
    start: startDate,
    end: new Date(),
  });
}
