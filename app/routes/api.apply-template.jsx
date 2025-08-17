import { json } from "@remix-run/node";
import prisma from "../db.server";
import { savePopupSettings } from "../models/popupSettings.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { shop } = await authenticate.admin(request);
    const { templateId } = await request.json();

    if (!templateId) {
      return json({ error: "Template ID is required" }, { status: 400 });
    }

    // Get the template from database
    const template = await prisma.popupTemplate.findFirst({
      where: {
        id: parseInt(templateId),
        OR: [
          { shop: "default" },
          { shop: shop }
        ]
      }
    });

    if (!template) {
      return json({ error: "Template not found" }, { status: 404 });
    }

    // Parse template config
    let templateConfig;
    try {
      templateConfig = JSON.parse(template.config);
    } catch (parseError) {
      return json({ error: "Invalid template configuration" }, { status: 400 });
    }

    // Prepare popup settings from template
    const popupSettings = {
      enabled: true,
      title: templateConfig.title || template.name,
      message: templateConfig.message || "",
      discountCode: templateConfig.discountCode || "",
      discountPercentage: parseInt(templateConfig.discountPercentage) || 0,
      delaySeconds: 2, // Keep existing default
      showOnce: true,  // Keep existing default
    };

    // Save the settings
    const savedSettings = await savePopupSettings(shop, popupSettings);

    // Update template usage statistics
    await prisma.popupTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      }
    });

    // Create usage stats record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create usage stats record (simplified approach)
    try {
      await prisma.templateUsageStats.create({
        data: {
          templateId: template.id,
          shop: shop,
          date: today,
          usageCount: 1,
          impressions: 0,
          conversions: 0,
          conversionRate: 0.0
        }
      });
    } catch (error) {
      // If record already exists for today, update it
      if (error.code === 'P2002') {
        await prisma.templateUsageStats.updateMany({
          where: {
            templateId: template.id,
            shop: shop,
            date: today
          },
          data: {
            usageCount: { increment: 1 }
          }
        });
      }
    }

    return json({ 
      success: true, 
      settings: savedSettings,
      template: {
        id: template.id,
        name: template.name,
        category: template.category
      }
    });

  } catch (error) {
    console.error("Error applying template:", error);
    return json({ error: "Failed to apply template" }, { status: 500 });
  }
}
