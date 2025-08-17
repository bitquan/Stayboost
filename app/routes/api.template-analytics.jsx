import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { shop } = await authenticate.admin(request);
    
    const url = new URL(request.url);
    const templateId = url.searchParams.get("templateId");
    const timeframe = url.searchParams.get("timeframe") || "30"; // days
    const action = url.searchParams.get("action") || "overview";

    const daysBack = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    if (action === "overview") {
      // Get overall performance summary for all templates with TemplateUsageStats aggregation
      const templates = await prisma.popupTemplate.findMany({
        where: {
          OR: [
            { shop: "default" },
            { shop: shop }
          ]
        },
        include: {
          usageStats: {
            where: {
              shop: shop,
              date: { gte: startDate }
            },
            orderBy: { date: "desc" }
          }
        }
      });

      const analytics = templates.map(template => {
        // Group by template (groupBy template) - each iteration processes one template's statistics
        const stats = template.usageStats; // TemplateUsageStats records
        // Sum all statistics using reduce (equivalent to _sum aggregation)
        const totalImpressions = stats.reduce((sum, stat) => sum + stat.impressions, 0);
        const totalConversions = stats.reduce((sum, stat) => sum + stat.conversions, 0);
        const totalDismissals = stats.reduce((sum, stat) => sum + stat.dismissals, 0);
        const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);
        const totalUsage = stats.reduce((sum, stat) => sum + stat.usageCount, 0);
        
        const conversionRate = totalImpressions > 0 ? (totalConversions / totalImpressions) : 0;
        const revenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;

        return {
          id: template.id,
          name: template.name,
          category: template.category,
          totalImpressions,
          totalConversions,
          totalDismissals,
          conversionRate: Math.round(conversionRate * 10000) / 10000, // More precision for small rates
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          revenuePerConversion: Math.round(revenuePerConversion * 100) / 100,
          usageCount: totalUsage,
          lastUsed: template.lastUsed,
          trend: calculateTrend(stats)
        };
      });

      // Sort by conversion rate descending
      analytics.sort((a, b) => b.conversionRate - a.conversionRate);

      return json({ analytics, timeframe: daysBack });
    }

    if (action === "detail" && templateId) {
      // Get detailed performance for specific template
      const template = await prisma.popupTemplate.findFirst({
        where: {
          id: parseInt(templateId),
          OR: [
            { shop: "default" },
            { shop: shop }
          ]
        },
        include: {
          usageStats: {
            where: {
              shop: shop,
              date: { gte: startDate }
            },
            orderBy: { date: "asc" }
          }
        }
      });

      if (!template) {
        return json({ error: "Template not found" }, { status: 404 });
      }

      const dailyStats = template.usageStats.map(stat => ({
        date: stat.date.toISOString().split('T')[0],
        impressions: stat.impressions,
        conversions: stat.conversions,
        conversionRate: stat.conversionRate,
        revenue: stat.revenue,
        usageCount: stat.usageCount
      }));

      const totalStats = {
        totalImpressions: template.usageStats.reduce((sum, stat) => sum + stat.impressions, 0),
        totalConversions: template.usageStats.reduce((sum, stat) => sum + stat.conversions, 0),
        totalRevenue: template.usageStats.reduce((sum, stat) => sum + stat.revenue, 0),
        totalUsage: template.usageStats.reduce((sum, stat) => sum + stat.usageCount, 0)
      };

      totalStats.overallConversionRate = totalStats.totalImpressions > 0 
        ? (totalStats.totalConversions / totalStats.totalImpressions) * 100 
        : 0;

      return json({
        template: {
          id: template.id,
          name: template.name,
          category: template.category,
          lastUsed: template.lastUsed
        },
        dailyStats,
        totalStats,
        timeframe: daysBack
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

function calculateTrend(stats) {
  if (stats.length < 2) return "stable";
  
  // Compare last 7 days vs previous 7 days conversion rates
  const recent = stats.slice(0, 7);
  const previous = stats.slice(7, 14);
  
  const recentAvg = recent.reduce((sum, stat) => sum + stat.conversionRate, 0) / recent.length;
  const previousAvg = previous.reduce((sum, stat) => sum + stat.conversionRate, 0) / previous.length;
  
  if (recentAvg > previousAvg * 1.1) return "up";
  if (recentAvg < previousAvg * 0.9) return "down";
  return "stable";
}
