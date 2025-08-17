import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// Smart Targeting API endpoint for production behavioral targeting
export async function loader({ request }) {
  const { shop } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "list";
  const targetingRuleId = url.searchParams.get("targetingRuleId");
  
  try {
    if (action === "list") {
      // Get all targeting rules for the shop
      const rules = await prisma.targetingRule.findMany({
        where: { shop },
        include: {
          segments: true,
          executions: {
            take: 10,
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      return json({ rules });
    }
    
    if (action === "get" && targetingRuleId) {
      // Get specific targeting rule details
      const rule = await prisma.targetingRule.findUnique({
        where: { 
          id: parseInt(targetingRuleId),
          shop 
        },
        include: {
          segments: true,
          executions: {
            orderBy: { createdAt: "desc" },
            take: 100
          }
        }
      });
      
      if (!rule) {
        return json({ error: "Targeting rule not found" }, { status: 404 });
      }
      
      // Calculate performance metrics
      const performance = await calculateRulePerformance(shop, parseInt(targetingRuleId));
      
      return json({ rule, performance });
    }
    
    if (action === "evaluate") {
      // Evaluate targeting rules for a visitor
      const visitorData = {
        shop,
        userId: url.searchParams.get("userId"),
        sessionId: url.searchParams.get("sessionId"),
        pageUrl: url.searchParams.get("pageUrl"),
        referrer: url.searchParams.get("referrer"),
        userAgent: url.searchParams.get("userAgent"),
        geolocation: url.searchParams.get("geolocation"),
        visitCount: parseInt(url.searchParams.get("visitCount") || "1"),
        sessionDuration: parseInt(url.searchParams.get("sessionDuration") || "0"),
        pagesViewed: parseInt(url.searchParams.get("pagesViewed") || "1")
      };
      
      const applicableRules = await evaluateTargetingRules(visitorData);
      
      return json({ applicableRules });
    }
    
    if (action === "segments") {
      // Get customer segments analysis
      const segments = await getCustomerSegments(shop);
      return json({ segments });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Smart Targeting API error:", error);
    return json({ error: "Failed to fetch targeting data" }, { status: 500 });
  }
}

// POST endpoint for managing targeting rules
export async function action({ request }) {
  const { shop } = await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    
    if (action === "create") {
      // Create new targeting rule
      const ruleData = {
        shop,
        name: formData.get("name"),
        description: formData.get("description"),
        ruleType: formData.get("ruleType"),
        conditions: formData.get("conditions"), // JSON string
        priority: parseInt(formData.get("priority") || "0"),
        isActive: formData.get("isActive") === "true"
      };
      
      const rule = await prisma.targetingRule.create({
        data: ruleData
      });
      
      return json({ success: true, rule });
    }
    
    if (action === "update") {
      // Update existing targeting rule
      const ruleId = parseInt(formData.get("ruleId"));
      
      const rule = await prisma.targetingRule.update({
        where: { 
          id: ruleId,
          shop 
        },
        data: {
          name: formData.get("name"),
          description: formData.get("description"),
          ruleType: formData.get("ruleType"),
          conditions: formData.get("conditions"),
          priority: parseInt(formData.get("priority") || "0"),
          isActive: formData.get("isActive") === "true",
          updatedAt: new Date()
        }
      });
      
      return json({ success: true, rule });
    }
    
    if (action === "delete") {
      // Delete targeting rule
      const ruleId = parseInt(formData.get("ruleId"));
      
      await prisma.targetingRule.delete({
        where: { 
          id: ruleId,
          shop 
        }
      });
      
      return json({ success: true });
    }
    
    if (action === "trackExecution") {
      // Track rule execution for analytics
      const executionData = {
        targetingRuleId: parseInt(formData.get("targetingRuleId")),
        visitorId: formData.get("visitorId"),
        sessionId: formData.get("sessionId"),
        matched: formData.get("matched") === "true",
        executionTime: parseFloat(formData.get("executionTime") || "0"),
        conditionsEvaluated: formData.get("conditionsEvaluated"),
        resultData: formData.get("resultData")
      };
      
      await prisma.targetingExecution.create({
        data: executionData
      });
      
      return json({ success: true });
    }
    
    if (action === "createSegment") {
      // Create customer segment
      const segmentData = {
        shop,
        name: formData.get("name"),
        description: formData.get("description"),
        segmentType: formData.get("segmentType"),
        criteria: formData.get("criteria"), // JSON string
        estimatedSize: parseInt(formData.get("estimatedSize") || "0"),
        isActive: formData.get("isActive") === "true"
      };
      
      const segment = await prisma.customerSegment.create({
        data: segmentData
      });
      
      return json({ success: true, segment });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Smart Targeting action error:", error);
    return json({ error: "Failed to process targeting action" }, { status: 500 });
  }
}

// Helper functions
async function evaluateTargetingRules(visitorData) {
  try {
    const activeRules = await prisma.targetingRule.findMany({
      where: { 
        shop: visitorData.shop,
        isActive: true 
      },
      orderBy: { priority: "desc" }
    });
    
    const applicableRules = [];
    
    for (const rule of activeRules) {
      const conditions = JSON.parse(rule.conditions || "{}");
      const isMatch = await evaluateConditions(conditions, visitorData);
      
      if (isMatch) {
        applicableRules.push({
          id: rule.id,
          name: rule.name,
          ruleType: rule.ruleType,
          priority: rule.priority,
          matchScore: calculateMatchScore(conditions, visitorData)
        });
        
        // Track execution
        await prisma.targetingExecution.create({
          data: {
            targetingRuleId: rule.id,
            visitorId: visitorData.userId,
            sessionId: visitorData.sessionId,
            matched: true,
            executionTime: Date.now(),
            conditionsEvaluated: JSON.stringify(conditions),
            resultData: JSON.stringify(visitorData)
          }
        });
      }
    }
    
    return applicableRules.sort((a, b) => b.priority - a.priority);
    
  } catch (error) {
    console.error("Evaluate targeting rules error:", error);
    return [];
  }
}

async function evaluateConditions(conditions, visitorData) {
  try {
    // Geographic targeting
    if (conditions.geographic) {
      const geo = conditions.geographic;
      if (geo.countries && geo.countries.length > 0) {
        const visitorCountry = extractCountryFromGeolocation(visitorData.geolocation);
        if (!geo.countries.includes(visitorCountry)) {
          return false;
        }
      }
    }
    
    // Behavioral targeting
    if (conditions.behavioral) {
      const behavioral = conditions.behavioral;
      
      if (behavioral.minVisitCount && visitorData.visitCount < behavioral.minVisitCount) {
        return false;
      }
      
      if (behavioral.maxVisitCount && visitorData.visitCount > behavioral.maxVisitCount) {
        return false;
      }
      
      if (behavioral.minSessionDuration && visitorData.sessionDuration < behavioral.minSessionDuration) {
        return false;
      }
      
      if (behavioral.minPagesViewed && visitorData.pagesViewed < behavioral.minPagesViewed) {
        return false;
      }
    }
    
    // Device targeting
    if (conditions.device) {
      const device = conditions.device;
      const userAgent = visitorData.userAgent || "";
      
      if (device.types && device.types.length > 0) {
        const deviceType = detectDeviceType(userAgent);
        if (!device.types.includes(deviceType)) {
          return false;
        }
      }
      
      if (device.browsers && device.browsers.length > 0) {
        const browser = detectBrowser(userAgent);
        if (!device.browsers.includes(browser)) {
          return false;
        }
      }
    }
    
    // Traffic source targeting
    if (conditions.trafficSource) {
      const traffic = conditions.trafficSource;
      const referrer = visitorData.referrer || "";
      
      if (traffic.sources && traffic.sources.length > 0) {
        const source = categorizeTrafficSource(referrer);
        if (!traffic.sources.includes(source)) {
          return false;
        }
      }
      
      if (traffic.campaigns && traffic.campaigns.length > 0) {
        // Check for UTM parameters in referrer or page URL
        const campaign = extractCampaignFromUrl(visitorData.pageUrl);
        if (!traffic.campaigns.includes(campaign)) {
          return false;
        }
      }
    }
    
    // Time-based targeting
    if (conditions.timing) {
      const timing = conditions.timing;
      const now = new Date();
      
      if (timing.daysOfWeek && timing.daysOfWeek.length > 0) {
        const dayOfWeek = now.getDay();
        if (!timing.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
      }
      
      if (timing.hoursOfDay && timing.hoursOfDay.length > 0) {
        const hour = now.getHours();
        if (!timing.hoursOfDay.includes(hour)) {
          return false;
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error("Evaluate conditions error:", error);
    return false;
  }
}

function calculateMatchScore(conditions, visitorData) {
  let score = 0;
  let totalCriteria = 0;
  
  // Geographic match
  if (conditions.geographic) {
    totalCriteria++;
    const visitorCountry = extractCountryFromGeolocation(visitorData.geolocation);
    if (conditions.geographic.countries?.includes(visitorCountry)) {
      score++;
    }
  }
  
  // Behavioral match
  if (conditions.behavioral) {
    const behavioral = conditions.behavioral;
    
    if (behavioral.minVisitCount) {
      totalCriteria++;
      if (visitorData.visitCount >= behavioral.minVisitCount) score++;
    }
    
    if (behavioral.minSessionDuration) {
      totalCriteria++;
      if (visitorData.sessionDuration >= behavioral.minSessionDuration) score++;
    }
    
    if (behavioral.minPagesViewed) {
      totalCriteria++;
      if (visitorData.pagesViewed >= behavioral.minPagesViewed) score++;
    }
  }
  
  return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0;
}

async function calculateRulePerformance(shop, ruleId) {
  try {
    const executions = await prisma.targetingExecution.findMany({
      where: { targetingRuleId: ruleId },
      orderBy: { createdAt: "desc" },
      take: 1000 // Last 1000 executions
    });
    
    const totalExecutions = executions.length;
    const matchedExecutions = executions.filter(e => e.matched).length;
    const matchRate = totalExecutions > 0 ? (matchedExecutions / totalExecutions) * 100 : 0;
    
    // Calculate daily performance
    const dailyStats = {};
    executions.forEach(execution => {
      const date = execution.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, matched: 0 };
      }
      dailyStats[date].total++;
      if (execution.matched) dailyStats[date].matched++;
    });
    
    return {
      totalExecutions,
      matchedExecutions,
      matchRate,
      averageExecutionTime: executions.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions,
      dailyStats
    };
    
  } catch (error) {
    console.error("Calculate rule performance error:", error);
    return {
      totalExecutions: 0,
      matchedExecutions: 0,
      matchRate: 0,
      averageExecutionTime: 0,
      dailyStats: {}
    };
  }
}

async function getCustomerSegments(shop) {
  try {
    const segments = await prisma.customerSegment.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" }
    });
    
    // Calculate segment sizes and update them
    for (const segment of segments) {
      const criteria = JSON.parse(segment.criteria || "{}");
      const estimatedSize = await estimateSegmentSize(shop, criteria);
      
      await prisma.customerSegment.update({
        where: { id: segment.id },
        data: { 
          estimatedSize,
          lastCalculated: new Date()
        }
      });
    }
    
    return segments;
    
  } catch (error) {
    console.error("Get customer segments error:", error);
    return [];
  }
}

async function estimateSegmentSize(shop, criteria) {
  // This would typically query your customer database
  // For now, return a mock estimation based on criteria complexity
  let baseSize = 1000; // Base number of customers
  
  if (criteria.geographic) baseSize *= 0.3;
  if (criteria.behavioral) baseSize *= 0.5;
  if (criteria.device) baseSize *= 0.7;
  if (criteria.trafficSource) baseSize *= 0.4;
  
  return Math.floor(baseSize);
}

// Utility functions
function extractCountryFromGeolocation(geolocation) {
  try {
    const geo = JSON.parse(geolocation || "{}");
    return geo.country || "Unknown";
  } catch {
    return "Unknown";
  }
}

function detectDeviceType(userAgent) {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return "mobile";
  if (/Tablet|iPad/.test(userAgent)) return "tablet";
  return "desktop";
}

function detectBrowser(userAgent) {
  if (/Chrome/.test(userAgent)) return "chrome";
  if (/Firefox/.test(userAgent)) return "firefox";
  if (/Safari/.test(userAgent)) return "safari";
  if (/Edge/.test(userAgent)) return "edge";
  return "other";
}

function categorizeTrafficSource(referrer) {
  if (!referrer) return "direct";
  if (/google\.com/.test(referrer)) return "google";
  if (/facebook\.com/.test(referrer)) return "facebook";
  if (/twitter\.com/.test(referrer)) return "twitter";
  if (/instagram\.com/.test(referrer)) return "instagram";
  return "other";
}

function extractCampaignFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("utm_campaign") || "none";
  } catch {
    return "none";
  }
}
