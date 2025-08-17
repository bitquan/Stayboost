import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { shop } = await authenticate.admin(request);
    const { event, templateId, sessionId, conversionValue } = await request.json();

    if (!event || !sessionId) {
      return json({ error: "Event and sessionId are required" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Track different types of events
    switch (event) {
      case 'impression':
        // Track popup shown
        await prisma.templateUsageStats.upsert({
          where: {
            templateId_shop_date: {
              templateId: parseInt(templateId),
              shop: shop,
              date: today
            }
          },
          update: {
            impressions: { increment: 1 }
          },
          create: {
            templateId: parseInt(templateId),
            shop: shop,
            date: today,
            usageCount: 0,
            impressions: 1,
            conversions: 0,
            dismissals: 0,
            conversionRate: 0.0,
            revenue: 0.0
          }
        });
        break;

      case 'conversion':
        // Track successful conversion (discount claimed)
        await prisma.templateUsageStats.upsert({
          where: {
            templateId_shop_date: {
              templateId: parseInt(templateId),
              shop: shop,
              date: today
            }
          },
          update: {
            conversions: { increment: 1 },
            revenue: { increment: parseFloat(conversionValue) || 0 }
          },
          create: {
            templateId: parseInt(templateId),
            shop: shop,
            date: today,
            usageCount: 0,
            impressions: 0,
            conversions: 1,
            dismissals: 0,
            conversionRate: 0.0,
            revenue: parseFloat(conversionValue) || 0
          }
        });

        // Recalculate conversion rate
        const updatedStats = await prisma.templateUsageStats.findUnique({
          where: {
            templateId_shop_date: {
              templateId: parseInt(templateId),
              shop: shop,
              date: today
            }
          }
        });

        if (updatedStats && updatedStats.impressions > 0) {
          const newConversionRate = (updatedStats.conversions / updatedStats.impressions) * 100;
          await prisma.templateUsageStats.update({
            where: { id: updatedStats.id },
            data: { conversionRate: newConversionRate }
          });
        }
        break;

      case 'dismiss':
        // Track popup dismissed without conversion
        await prisma.templateUsageStats.upsert({
          where: {
            templateId_shop_date: {
              templateId: parseInt(templateId),
              shop: shop,
              date: today
            }
          },
          update: {
            dismissals: { increment: 1 }
          },
          create: {
            templateId: parseInt(templateId),
            shop: shop,
            date: today,
            usageCount: 0,
            impressions: 0,
            conversions: 0,
            dismissals: 1,
            conversionRate: 0.0,
            revenue: 0.0
          }
        });
        break;

      default:
        return json({ error: "Invalid event type" }, { status: 400 });
    }

    return json({ success: true });

  } catch (error) {
    console.error("Error tracking performance:", error);
    return json({ error: "Failed to track performance" }, { status: 500 });
  }
}
