import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// Real analytics API endpoint for production data tracking
export async function loader({ request }) {
  const { shop } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const timeRange = url.searchParams.get("timeRange") || "7d";
  const metric = url.searchParams.get("metric") || "overview";
  
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    if (metric === "overview") {
      // Get overview analytics for the specified time range
      const analytics = await getAnalyticsOverview(shop, startDate, endDate);
      return json(analytics);
    }
    
    if (metric === "funnel") {
      // Get conversion funnel data
      const funnelData = await getConversionFunnel(shop, startDate, endDate);
      return json(funnelData);
    }
    
    if (metric === "segments") {
      // Get customer segmentation data
      const segmentData = await getCustomerSegments(shop, startDate, endDate);
      return json(segmentData);
    }
    
    if (metric === "attribution") {
      // Get revenue attribution data
      const attributionData = await getRevenueAttribution(shop, startDate, endDate);
      return json(attributionData);
    }
    
    return json({ error: "Invalid metric" }, { status: 400 });
    
  } catch (error) {
    console.error("Analytics API error:", error);
    return json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

// POST endpoint for tracking events
export async function action({ request }) {
  const { shop } = await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const eventType = formData.get("eventType");
    const popupId = formData.get("popupId");
    const visitorId = formData.get("visitorId");
    const metadata = JSON.parse(formData.get("metadata") || "{}");
    
    // Track the event in the database
    await trackEvent({
      shop,
      eventType,
      popupId,
      visitorId,
      metadata,
      timestamp: new Date()
    });
    
    return json({ success: true });
    
  } catch (error) {
    console.error("Event tracking error:", error);
    return json({ error: "Failed to track event" }, { status: 500 });
  }
}

// Analytics helper functions
async function getAnalyticsOverview(shop, startDate, endDate) {
  // In production, this would query actual analytics data
  // For now, we'll use the database to track real popup events
  
  try {
    // Get popup settings to know which popups are active
    const popupSettings = await prisma.popupSettings.findUnique({
      where: { shop }
    });
    
    if (!popupSettings) {
      return getDefaultAnalytics();
    }
    
    // Query analytics events from database
    const events = await prisma.analyticsEvent.findMany({
      where: {
        shop,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Calculate metrics from real events
    const impressions = events.filter(e => e.eventType === "popup_viewed").length;
    const conversions = events.filter(e => e.eventType === "popup_converted").length;
    const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;
    
    // Calculate revenue from conversion events
    const revenue = events
      .filter(e => e.eventType === "discount_applied")
      .reduce((sum, e) => sum + (e.metadata?.orderValue || 0), 0);
    
    const aov = conversions > 0 ? revenue / conversions : 0;
    
    return {
      impressions,
      conversions,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      revenue: parseFloat(revenue.toFixed(2)),
      aov: parseFloat(aov.toFixed(2)),
      ltv: parseFloat((aov * 2.4).toFixed(2)), // Estimated LTV multiplier
      roi: revenue > 0 ? parseFloat(((revenue / 100) * 100).toFixed(1)) : 0 // Simplified ROI calculation
    };
    
  } catch (error) {
    console.error("Analytics overview error:", error);
    return getDefaultAnalytics();
  }
}

async function getConversionFunnel(shop, startDate, endDate) {
  try {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        shop,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    const viewed = events.filter(e => e.eventType === "popup_viewed").length;
    const engaged = events.filter(e => e.eventType === "popup_engaged").length;
    const claimed = events.filter(e => e.eventType === "discount_claimed").length;
    const addedToCart = events.filter(e => e.eventType === "added_to_cart").length;
    const converted = events.filter(e => e.eventType === "popup_converted").length;
    
    return [
      { stage: "Popup Viewed", visitors: viewed, percentage: 100 },
      { stage: "Popup Engaged", visitors: engaged, percentage: viewed > 0 ? (engaged / viewed) * 100 : 0 },
      { stage: "Code Claimed", visitors: claimed, percentage: viewed > 0 ? (claimed / viewed) * 100 : 0 },
      { stage: "Added to Cart", visitors: addedToCart, percentage: viewed > 0 ? (addedToCart / viewed) * 100 : 0 },
      { stage: "Completed Purchase", visitors: converted, percentage: viewed > 0 ? (converted / viewed) * 100 : 0 }
    ];
    
  } catch (error) {
    console.error("Funnel data error:", error);
    return getDefaultFunnel();
  }
}

async function getCustomerSegments(shop, startDate, endDate) {
  try {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        shop,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Group events by visitor and analyze behavior
    const visitorMap = new Map();
    
    events.forEach(event => {
      const visitorId = event.visitorId;
      if (!visitorMap.has(visitorId)) {
        visitorMap.set(visitorId, {
          events: [],
          isFirstTime: event.metadata?.isFirstTime || false,
          isMobile: event.metadata?.isMobile || false,
          totalValue: 0
        });
      }
      
      const visitor = visitorMap.get(visitorId);
      visitor.events.push(event);
      
      if (event.eventType === "popup_converted") {
        visitor.totalValue += event.metadata?.orderValue || 0;
      }
    });
    
    const visitors = Array.from(visitorMap.values());
    
    const firstTime = visitors.filter(v => v.isFirstTime);
    const returning = visitors.filter(v => !v.isFirstTime);
    const mobile = visitors.filter(v => v.isMobile);
    const highValue = visitors.filter(v => v.totalValue > 100);
    
    return [
      {
        segment: "First Time Buyers",
        count: firstTime.length,
        conversionRate: calculateSegmentConversionRate(firstTime),
        averageOrderValue: calculateSegmentAOV(firstTime),
        lifetimeValue: calculateSegmentLTV(firstTime)
      },
      {
        segment: "Returning Customers", 
        count: returning.length,
        conversionRate: calculateSegmentConversionRate(returning),
        averageOrderValue: calculateSegmentAOV(returning),
        lifetimeValue: calculateSegmentLTV(returning)
      },
      {
        segment: "High Value Customers",
        count: highValue.length,
        conversionRate: calculateSegmentConversionRate(highValue),
        averageOrderValue: calculateSegmentAOV(highValue),
        lifetimeValue: calculateSegmentLTV(highValue)
      },
      {
        segment: "Mobile Users",
        count: mobile.length,
        conversionRate: calculateSegmentConversionRate(mobile),
        averageOrderValue: calculateSegmentAOV(mobile),
        lifetimeValue: calculateSegmentLTV(mobile)
      }
    ];
    
  } catch (error) {
    console.error("Segment data error:", error);
    return getDefaultSegments();
  }
}

async function getRevenueAttribution(shop, startDate, endDate) {
  try {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        shop,
        eventType: "popup_converted",
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Group by popup source/type
    const attribution = new Map();
    
    events.forEach(event => {
      const source = event.metadata?.popupType || "Unknown";
      if (!attribution.has(source)) {
        attribution.set(source, { revenue: 0, orders: 0 });
      }
      
      const data = attribution.get(source);
      data.revenue += event.metadata?.orderValue || 0;
      data.orders += 1;
    });
    
    const totalRevenue = Array.from(attribution.values()).reduce((sum, data) => sum + data.revenue, 0);
    
    return Array.from(attribution.entries()).map(([source, data]) => ({
      source,
      revenue: data.revenue,
      orders: data.orders,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }));
    
  } catch (error) {
    console.error("Attribution data error:", error);
    return getDefaultAttribution();
  }
}

async function trackEvent({ shop, eventType, popupId, visitorId, metadata, timestamp }) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        shop,
        eventType,
        popupId,
        visitorId,
        metadata,
        createdAt: timestamp
      }
    });
  } catch (error) {
    console.error("Track event error:", error);
    // Don't throw - analytics tracking shouldn't break the main flow
  }
}

// Helper functions for segment calculations
function calculateSegmentConversionRate(visitors) {
  if (visitors.length === 0) return 0;
  const converted = visitors.filter(v => v.events.some(e => e.eventType === "popup_converted")).length;
  return parseFloat(((converted / visitors.length) * 100).toFixed(2));
}

function calculateSegmentAOV(visitors) {
  const convertedVisitors = visitors.filter(v => v.totalValue > 0);
  if (convertedVisitors.length === 0) return 0;
  const totalValue = convertedVisitors.reduce((sum, v) => sum + v.totalValue, 0);
  return parseFloat((totalValue / convertedVisitors.length).toFixed(2));
}

function calculateSegmentLTV(visitors) {
  const aov = calculateSegmentAOV(visitors);
  return parseFloat((aov * 2.4).toFixed(2)); // Estimated LTV multiplier
}

// Default/fallback data for when no real data exists
function getDefaultAnalytics() {
  return {
    impressions: 0,
    conversions: 0,
    conversionRate: 0,
    revenue: 0,
    aov: 0,
    ltv: 0,
    roi: 0
  };
}

function getDefaultFunnel() {
  return [
    { stage: "Popup Viewed", visitors: 0, percentage: 0 },
    { stage: "Popup Engaged", visitors: 0, percentage: 0 },
    { stage: "Code Claimed", visitors: 0, percentage: 0 },
    { stage: "Added to Cart", visitors: 0, percentage: 0 },
    { stage: "Completed Purchase", visitors: 0, percentage: 0 }
  ];
}

function getDefaultSegments() {
  return [
    { segment: "First Time Buyers", count: 0, conversionRate: 0, averageOrderValue: 0, lifetimeValue: 0 },
    { segment: "Returning Customers", count: 0, conversionRate: 0, averageOrderValue: 0, lifetimeValue: 0 },
    { segment: "High Value Customers", count: 0, conversionRate: 0, averageOrderValue: 0, lifetimeValue: 0 },
    { segment: "Mobile Users", count: 0, conversionRate: 0, averageOrderValue: 0, lifetimeValue: 0 }
  ];
}

function getDefaultAttribution() {
  return [
    { source: "No Data", revenue: 0, orders: 0, percentage: 0 }
  ];
}
