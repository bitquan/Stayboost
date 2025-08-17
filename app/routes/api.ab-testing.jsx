import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// A/B Testing API endpoint for production testing management
export async function loader({ request }) {
  const { shop } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "list";
  const testId = url.searchParams.get("testId");
  
  try {
    if (action === "list") {
      // Get all A/B tests for the shop
      const tests = await prisma.aBTest.findMany({
        where: { shop },
        include: {
          results: true,
          statistics: true
        },
        orderBy: { createdAt: "desc" }
      });
      
      return json({ tests });
    }
    
    if (action === "get" && testId) {
      // Get specific test details
      const test = await prisma.aBTest.findUnique({
        where: { 
          id: parseInt(testId),
          shop 
        },
        include: {
          results: true,
          statistics: true
        }
      });
      
      if (!test) {
        return json({ error: "Test not found" }, { status: 404 });
      }
      
      return json({ test });
    }
    
    if (action === "results" && testId) {
      // Get test results and statistics
      const results = await getTestResults(shop, parseInt(testId));
      return json(results);
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("A/B Testing API error:", error);
    return json({ error: "Failed to fetch A/B tests" }, { status: 500 });
  }
}

// POST endpoint for managing A/B tests
export async function action({ request }) {
  const { shop } = await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    
    if (action === "create") {
      // Create new A/B test
      const testData = {
        shop,
        name: formData.get("name"),
        description: formData.get("description"),
        testType: formData.get("testType"),
        trafficAllocation: parseFloat(formData.get("trafficAllocation") || "50"),
        variants: formData.get("variants"), // JSON string
        startDate: formData.get("startDate") ? new Date(formData.get("startDate")) : null,
        endDate: formData.get("endDate") ? new Date(formData.get("endDate")) : null
      };
      
      const test = await prisma.aBTest.create({
        data: testData
      });
      
      return json({ success: true, test });
    }
    
    if (action === "start") {
      // Start an A/B test
      const testId = parseInt(formData.get("testId"));
      
      const test = await prisma.aBTest.update({
        where: { 
          id: testId,
          shop 
        },
        data: {
          status: "active",
          startDate: new Date()
        }
      });
      
      return json({ success: true, test });
    }
    
    if (action === "pause") {
      // Pause an A/B test
      const testId = parseInt(formData.get("testId"));
      
      const test = await prisma.aBTest.update({
        where: { 
          id: testId,
          shop 
        },
        data: {
          status: "paused"
        }
      });
      
      return json({ success: true, test });
    }
    
    if (action === "complete") {
      // Complete an A/B test and apply winner
      const testId = parseInt(formData.get("testId"));
      const winnerVariantId = formData.get("winnerVariantId");
      
      const test = await prisma.aBTest.update({
        where: { 
          id: testId,
          shop 
        },
        data: {
          status: "completed",
          endDate: new Date(),
          winnerVariantId
        }
      });
      
      // Apply winner to popup settings if specified
      if (test.popupSettingsId && winnerVariantId) {
        await applyWinnerVariant(test.popupSettingsId, winnerVariantId, test.variants);
      }
      
      return json({ success: true, test });
    }
    
    if (action === "trackResult") {
      // Track A/B test result/event
      const resultData = {
        abTestId: parseInt(formData.get("abTestId")),
        variantId: formData.get("variantId"),
        userId: formData.get("userId"),
        sessionId: formData.get("sessionId"),
        eventType: formData.get("eventType"),
        conversionValue: parseFloat(formData.get("conversionValue") || "0"),
        userAgent: formData.get("userAgent"),
        ipAddress: formData.get("ipAddress"),
        geographicData: formData.get("geographicData")
      };
      
      await prisma.aBTestResult.create({
        data: resultData
      });
      
      // Update statistics
      await updateTestStatistics(resultData.abTestId, resultData.variantId);
      
      return json({ success: true });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("A/B Testing action error:", error);
    return json({ error: "Failed to process A/B test action" }, { status: 500 });
  }
}

// Helper functions
async function getTestResults(shop, testId) {
  try {
    const test = await prisma.aBTest.findUnique({
      where: { 
        id: testId,
        shop 
      },
      include: {
        results: true,
        statistics: {
          orderBy: { date: "desc" },
          take: 30 // Last 30 days
        }
      }
    });
    
    if (!test) {
      return { error: "Test not found" };
    }
    
    const variants = JSON.parse(test.variants || "[]");
    
    // Calculate current performance for each variant
    const variantPerformance = {};
    
    for (const variant of variants) {
      const variantResults = test.results.filter(r => r.variantId === variant.id);
      
      const impressions = variantResults.filter(r => r.eventType === "impression").length;
      const conversions = variantResults.filter(r => r.eventType === "conversion").length;
      const revenue = variantResults
        .filter(r => r.eventType === "conversion")
        .reduce((sum, r) => sum + r.conversionValue, 0);
      
      variantPerformance[variant.id] = {
        ...variant,
        impressions,
        conversions,
        conversionRate: impressions > 0 ? (conversions / impressions) * 100 : 0,
        revenue
      };
    }
    
    // Calculate statistical significance
    const significance = calculateStatisticalSignificance(variantPerformance);
    
    return {
      test: {
        ...test,
        variants: undefined // Remove raw variants
      },
      variantPerformance,
      significance,
      dailyStats: test.statistics
    };
    
  } catch (error) {
    console.error("Get test results error:", error);
    return { error: "Failed to get test results" };
  }
}

async function updateTestStatistics(abTestId, variantId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's results for this variant
    const results = await prisma.aBTestResult.findMany({
      where: {
        abTestId,
        variantId,
        timestamp: {
          gte: today
        }
      }
    });
    
    const impressions = results.filter(r => r.eventType === "impression").length;
    const conversions = results.filter(r => r.eventType === "conversion").length;
    const revenue = results
      .filter(r => r.eventType === "conversion")
      .reduce((sum, r) => sum + r.conversionValue, 0);
    
    const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;
    
    // Upsert daily statistics
    await prisma.aBTestStatistic.upsert({
      where: {
        abTestId_variantId_date: {
          abTestId,
          variantId,
          date: today
        }
      },
      update: {
        impressions,
        conversions,
        conversionRate,
        revenue,
        updatedAt: new Date()
      },
      create: {
        abTestId,
        variantId,
        date: today,
        impressions,
        conversions,
        conversionRate,
        revenue
      }
    });
    
  } catch (error) {
    console.error("Update test statistics error:", error);
  }
}

async function applyWinnerVariant(popupSettingsId, winnerVariantId, variantsJson) {
  try {
    const variants = JSON.parse(variantsJson || "[]");
    const winnerVariant = variants.find(v => v.id === winnerVariantId);
    
    if (!winnerVariant) {
      throw new Error("Winner variant not found");
    }
    
    // Apply winner variant settings to popup
    await prisma.popupSettings.update({
      where: { id: popupSettingsId },
      data: {
        title: winnerVariant.title || undefined,
        message: winnerVariant.message || undefined,
        discountCode: winnerVariant.discountCode || undefined,
        discountPercentage: winnerVariant.discountPercentage || undefined,
        updatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Apply winner variant error:", error);
  }
}

function calculateStatisticalSignificance(variantPerformance) {
  const variants = Object.values(variantPerformance);
  
  if (variants.length < 2) {
    return { significance: 0, confidenceLevel: 0 };
  }
  
  // Simple statistical significance calculation
  // In production, you'd use proper statistical tests like Chi-square or Z-test
  const [variantA, variantB] = variants;
  
  const n1 = variantA.impressions;
  const x1 = variantA.conversions;
  const n2 = variantB.impressions;
  const x2 = variantB.conversions;
  
  if (n1 < 30 || n2 < 30) {
    return { significance: 0, confidenceLevel: 0, message: "Insufficient sample size" };
  }
  
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPooled = (x1 + x2) / (n1 + n2);
  
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
  const zScore = Math.abs(p1 - p2) / se;
  
  // Approximate confidence level based on z-score
  let confidenceLevel = 0;
  if (zScore >= 1.96) confidenceLevel = 95;
  if (zScore >= 2.576) confidenceLevel = 99;
  if (zScore >= 3.291) confidenceLevel = 99.9;
  
  return {
    significance: zScore,
    confidenceLevel,
    pValue: 2 * (1 - normalCDF(Math.abs(zScore))),
    recommendation: confidenceLevel >= 95 ? "significant" : "continue_testing"
  };
}

// Simplified normal CDF approximation
function normalCDF(x) {
  return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
}

function erf(x) {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}
