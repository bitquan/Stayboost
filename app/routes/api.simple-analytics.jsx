import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

/**
 * Simple Analytics API
 * Priority #2 - Basic popup analytics and conversion tracking
 * 
 * Phase 2 Implementation: Core analytics functionality
 * - GET: Retrieve analytics data for dashboard
 * - POST: Record popup impression or conversion event
 * 
 * This is a simplified version focused on core functionality
 */

export async function loader({ request }) {
  await authenticate.admin(request);
  
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const period = url.searchParams.get("period") || "7"; // days
  
  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  try {
    // Calculate date range
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic analytics from the database
    const analytics = await prisma.popupAnalytics.findMany({
      where: {
        shop,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate totals
    const totals = analytics.reduce((acc, record) => {
      acc.impressions += record.impressions || 0;
      acc.conversions += record.conversions || 0;
      acc.revenue += record.revenue || 0;
      return acc;
    }, { impressions: 0, conversions: 0, revenue: 0 });

    // Calculate conversion rate
    const conversionRate = totals.impressions > 0 
      ? (totals.conversions / totals.impressions * 100).toFixed(2)
      : 0;

    return json({
      success: true,
      period: days,
      totals: {
        ...totals,
        conversionRate: parseFloat(conversionRate)
      },
      dailyData: analytics
    });

  } catch (error) {
    console.error("Error fetching simple analytics:", error);
    return json({
      error: "Failed to fetch analytics",
      success: false,
      totals: { impressions: 0, conversions: 0, revenue: 0, conversionRate: 0 },
      dailyData: []
    }, { status: 500 });
  }
}

export async function action({ request }) {
  await authenticate.admin(request);
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const { shop, type, amount } = data;
    
    if (!shop || !type) {
      return json({ 
        error: "Shop and type parameters are required",
        success: false 
      }, { status: 400 });
    }

    // Get today's date for grouping
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find or create today's analytics record
    const existingRecord = await prisma.popupAnalytics.findFirst({
      where: {
        shop,
        date: dateKey
      }
    });

    if (existingRecord) {
      // Update existing record
      const updateData = {};
      if (type === 'impression') {
        updateData.impressions = existingRecord.impressions + 1;
      } else if (type === 'conversion') {
        updateData.conversions = existingRecord.conversions + 1;
        if (amount) {
          updateData.revenue = existingRecord.revenue + parseFloat(amount);
        }
      }

      const updated = await prisma.popupAnalytics.update({
        where: { id: existingRecord.id },
        data: updateData
      });

      return json({ success: true, record: updated });
    } else {
      // Create new record
      const newRecord = await prisma.popupAnalytics.create({
        data: {
          shop,
          date: dateKey,
          impressions: type === 'impression' ? 1 : 0,
          conversions: type === 'conversion' ? 1 : 0,
          revenue: (type === 'conversion' && amount) ? parseFloat(amount) : 0
        }
      });

      return json({ success: true, record: newRecord });
    }

  } catch (error) {
    console.error("Error recording analytics:", error);
    return json({ 
      error: "Failed to record analytics",
      success: false 
    }, { status: 500 });
  }
}
