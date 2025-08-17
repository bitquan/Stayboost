import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// Templates API endpoint for production template management
export async function loader({ request }) {
  const { shop } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "list";
  const templateId = url.searchParams.get("templateId");
  const category = url.searchParams.get("category");
  
  try {
    if (action === "list") {
      // Get all templates, including default templates and shop-specific ones
      const whereClause = {
        OR: [
          { shop: "default" }, // Built-in templates
          { shop: shop } // Shop-specific templates
        ]
      };
      if (category && category !== "all") {
        whereClause.category = category;
      }
      
      const templates = await prisma.popupTemplate.findMany({
        where: whereClause,
        include: {
          usageStats: {
            take: 1,
            orderBy: { date: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      return json({ templates });
    }
    
    if (action === "get" && templateId) {
      // Get specific template details (default or shop-specific)
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
            orderBy: { date: "desc" },
            take: 30 // Last 30 days
          }
        }
      });
      
      if (!template) {
        return json({ error: "Template not found" }, { status: 404 });
      }
      
      return json({ template });
    }
    
    if (action === "categories") {
      // Get template categories with counts
      const categories = await prisma.popupTemplate.groupBy({
        by: ['category'],
        where: { shop },
        _count: { id: true }
      });
      
      return json({ categories });
    }
    
    if (action === "featured") {
      // Get featured/recommended templates
      const featuredTemplates = await prisma.popupTemplate.findMany({
        where: { 
          shop,
          isFeatured: true 
        },
        take: 6,
        orderBy: { usageCount: "desc" }
      });
      
      return json({ featuredTemplates });
    }
    
    if (action === "analytics") {
      // Get template performance analytics
      const analytics = await getTemplateAnalytics(shop, templateId);
      return json(analytics);
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Templates API error:", error);
    return json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

// POST endpoint for managing templates
export async function action({ request }) {
  const { shop } = await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    
    if (action === "create") {
      // Create new custom template
      const templateData = {
        shop,
        name: formData.get("name"),
        description: formData.get("description"),
        category: formData.get("category"),
        templateType: formData.get("templateType") || "custom",
        config: formData.get("config"), // JSON string
        previewImage: formData.get("previewImage"),
        isPublic: formData.get("isPublic") === "true",
        tags: formData.get("tags") // JSON string array
      };
      
      const template = await prisma.popupTemplate.create({
        data: templateData
      });
      
      return json({ success: true, template });
    }
    
    if (action === "update") {
      // Update existing template
      const templateId = parseInt(formData.get("templateId"));
      
      const template = await prisma.popupTemplate.update({
        where: { 
          id: templateId,
          shop 
        },
        data: {
          name: formData.get("name"),
          description: formData.get("description"),
          category: formData.get("category"),
          config: formData.get("config"),
          previewImage: formData.get("previewImage"),
          isPublic: formData.get("isPublic") === "true",
          tags: formData.get("tags"),
          updatedAt: new Date()
        }
      });
      
      return json({ success: true, template });
    }
    
    if (action === "delete") {
      // Delete template
      const templateId = parseInt(formData.get("templateId"));
      
      await prisma.popupTemplate.delete({
        where: { 
          id: templateId,
          shop 
        }
      });
      
      return json({ success: true });
    }
    
    if (action === "duplicate") {
      // Duplicate existing template
      const templateId = parseInt(formData.get("templateId"));
      const originalTemplate = await prisma.popupTemplate.findUnique({
        where: { 
          id: templateId,
          shop 
        }
      });
      
      if (!originalTemplate) {
        return json({ error: "Template not found" }, { status: 404 });
      }
      
      const duplicatedTemplate = await prisma.popupTemplate.create({
        data: {
          shop,
          name: `${originalTemplate.name} (Copy)`,
          description: originalTemplate.description,
          category: originalTemplate.category,
          templateType: "custom",
          config: originalTemplate.config,
          previewImage: originalTemplate.previewImage,
          tags: originalTemplate.tags
        }
      });
      
      return json({ success: true, template: duplicatedTemplate });
    }
    
    if (action === "apply") {
      // Apply template to popup settings
      const templateId = parseInt(formData.get("templateId"));
      const template = await prisma.popupTemplate.findUnique({
        where: { 
          id: templateId,
          shop 
        }
      });
      
      if (!template) {
        return json({ error: "Template not found" }, { status: 404 });
      }
      
      const config = JSON.parse(template.config || "{}");
      
      // Update popup settings with template configuration
      await prisma.popupSettings.upsert({
        where: { shop },
        update: {
          title: config.title || "Wait! Don't leave yet!",
          message: config.message || "Get 10% off your first order",
          discountCode: config.discountCode || "SAVE10",
          discountPercentage: config.discountPercentage || 10,
          delaySeconds: config.delaySeconds || 2,
          showOnce: config.showOnce !== undefined ? config.showOnce : true,
          updatedAt: new Date()
        },
        create: {
          shop,
          title: config.title || "Wait! Don't leave yet!",
          message: config.message || "Get 10% off your first order",
          discountCode: config.discountCode || "SAVE10",
          discountPercentage: config.discountPercentage || 10,
          delaySeconds: config.delaySeconds || 2,
          showOnce: config.showOnce !== undefined ? config.showOnce : true
        }
      });
      
      // Increment usage count
      await prisma.popupTemplate.update({
        where: { id: templateId },
        data: { 
          usageCount: { increment: 1 },
          lastUsed: new Date()
        }
      });
      
      // Track usage
      await trackTemplateUsage(templateId, shop);
      
      return json({ success: true });
    }
    
    if (action === "rate") {
      // Rate a template
      const templateId = parseInt(formData.get("templateId"));
      const rating = parseInt(formData.get("rating"));
      const review = formData.get("review");
      
      await prisma.templateRating.create({
        data: {
          templateId,
          shop,
          rating,
          review
        }
      });
      
      // Update template average rating
      await updateTemplateRating(templateId);
      
      return json({ success: true });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Templates action error:", error);
    return json({ error: "Failed to process template action" }, { status: 500 });
  }
}

// Helper functions
async function getTemplateAnalytics(shop, templateId) {
  try {
    let whereClause = { shop };
    if (templateId) {
      whereClause.templateId = parseInt(templateId);
    }
    
    const usageStats = await prisma.templateUsageStats.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: 30
    });
    
    const totalUsage = usageStats.reduce((sum, stat) => sum + stat.usageCount, 0);
    const avgConversionRate = usageStats.reduce((sum, stat) => sum + stat.conversionRate, 0) / usageStats.length || 0;
    const totalRevenue = usageStats.reduce((sum, stat) => sum + stat.revenue, 0);
    
    // Get template performance comparison
    const templatePerformance = await prisma.popupTemplate.findMany({
      where: { shop },
      select: {
        id: true,
        name: true,
        category: true,
        usageCount: true,
        averageRating: true,
        conversionRate: true
      },
      orderBy: { conversionRate: "desc" }
    });
    
    return {
      totalUsage,
      avgConversionRate,
      totalRevenue,
      usageStats,
      templatePerformance,
      topPerformingTemplates: templatePerformance.slice(0, 5)
    };
    
  } catch (error) {
    console.error("Get template analytics error:", error);
    return {
      totalUsage: 0,
      avgConversionRate: 0,
      totalRevenue: 0,
      usageStats: [],
      templatePerformance: [],
      topPerformingTemplates: []
    };
  }
}

async function trackTemplateUsage(templateId, shop) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.templateUsageStats.upsert({
      where: {
        templateId_shop_date: {
          templateId,
          shop,
          date: today
        }
      },
      update: {
        usageCount: { increment: 1 },
        updatedAt: new Date()
      },
      create: {
        templateId,
        shop,
        date: today,
        usageCount: 1
      }
    });
    
  } catch (error) {
    console.error("Track template usage error:", error);
  }
}

async function updateTemplateRating(templateId) {
  try {
    const ratings = await prisma.templateRating.findMany({
      where: { templateId },
      select: { rating: true }
    });
    
    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      
      await prisma.popupTemplate.update({
        where: { id: templateId },
        data: { 
          averageRating,
          ratingCount: ratings.length
        }
      });
    }
    
  } catch (error) {
    console.error("Update template rating error:", error);
  }
}

// Note: DEFAULT_TEMPLATES and initializeDefaultTemplates moved to app/models/templateUtils.server.js
