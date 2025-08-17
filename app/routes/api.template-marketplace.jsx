import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// Template Marketplace API - Community template sharing
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "browse";
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "popular"; // popular, newest, highest_rated
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  
  try {
    if (action === "browse") {
      // Browse public marketplace templates
      let whereClause = {
        isPublic: true,
        templateType: "community" // Distinguish from built-in templates
      };
      
      if (category && category !== "all") {
        whereClause.category = category;
      }
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { contains: search, mode: "insensitive" } }
        ];
      }
      
      let orderBy = {};
      switch (sort) {
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
        case "highest_rated":
          orderBy = { averageRating: "desc" };
          break;
        case "most_used":
          orderBy = { usageCount: "desc" };
          break;
        default: // popular
          orderBy = [
            { isFeatured: "desc" },
            { usageCount: "desc" },
            { averageRating: "desc" }
          ];
      }
      
      const templates = await prisma.popupTemplate.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              ratings: true,
              usageStats: true
            }
          }
        }
      });
      
      const totalCount = await prisma.popupTemplate.count({ where: whereClause });
      
      // Get marketplace statistics
      const stats = await getMarketplaceStats();
      
      return json({
        templates: templates.map(template => ({
          ...template,
          authorShop: maskShopDomain(template.shop), // Privacy protection
          ratingCount: template._count.ratings,
          totalUses: template._count.usageStats
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrevious: page > 1
        },
        stats
      });
    }
    
    if (action === "my-published") {
      // Get templates published by the current shop
      const templates = await prisma.popupTemplate.findMany({
        where: {
          shop: session.shop,
          isPublic: true,
          templateType: "community"
        },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              ratings: true,
              usageStats: true
            }
          }
        }
      });
      
      return json({ templates });
    }
    
    if (action === "featured") {
      // Get featured marketplace templates
      const templates = await prisma.popupTemplate.findMany({
        where: {
          isPublic: true,
          isFeatured: true,
          templateType: "community"
        },
        orderBy: [
          { averageRating: "desc" },
          { usageCount: "desc" }
        ],
        take: 12,
        include: {
          _count: {
            select: {
              ratings: true,
              usageStats: true
            }
          }
        }
      });
      
      return json({ templates });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Template Marketplace API error:", error);
    return json({ error: "Failed to load marketplace templates" }, { status: 500 });
  }
}

// POST endpoint for marketplace actions
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    
    if (action === "publish") {
      const templateId = parseInt(formData.get("templateId"));
      const makePublic = formData.get("isPublic") === "true";
      const tags = formData.get("tags");
      const description = formData.get("description");
      
      // Validate template ownership
      const template = await prisma.popupTemplate.findUnique({
        where: { 
          id: templateId,
          shop: session.shop
        }
      });
      
      if (!template) {
        return json({ error: "Template not found" }, { status: 404 });
      }
      
      // Update template for marketplace
      const updatedTemplate = await prisma.popupTemplate.update({
        where: { id: templateId },
        data: {
          isPublic: makePublic,
          templateType: makePublic ? "community" : "custom",
          description: description || template.description,
          tags: tags || template.tags
        }
      });
      
      return json({ success: true, template: updatedTemplate });
    }
    
    if (action === "install") {
      const sourceTemplateId = parseInt(formData.get("templateId"));
      
      // Get the source template
      const sourceTemplate = await prisma.popupTemplate.findUnique({
        where: { 
          id: sourceTemplateId,
          isPublic: true
        }
      });
      
      if (!sourceTemplate) {
        return json({ error: "Template not found" }, { status: 404 });
      }
      
      // Create a copy for the current shop
      const installedTemplate = await prisma.popupTemplate.create({
        data: {
          shop: session.shop,
          name: `${sourceTemplate.name} (Installed)`,
          description: sourceTemplate.description,
          category: sourceTemplate.category,
          templateType: "installed", // Mark as installed from marketplace
          config: sourceTemplate.config,
          tags: sourceTemplate.tags,
          isPublic: false // Private copy
        }
      });
      
      // Track installation in usage stats
      await prisma.templateUsageStats.upsert({
        where: {
          templateId_shop_date: {
            templateId: sourceTemplateId,
            shop: "marketplace", // Special shop for marketplace tracking
            date: new Date(new Date().toDateString())
          }
        },
        update: {
          usageCount: { increment: 1 }
        },
        create: {
          templateId: sourceTemplateId,
          shop: "marketplace",
          date: new Date(new Date().toDateString()),
          usageCount: 1
        }
      });
      
      // Update source template usage count
      await prisma.popupTemplate.update({
        where: { id: sourceTemplateId },
        data: {
          usageCount: { increment: 1 }
        }
      });
      
      return json({ success: true, template: installedTemplate });
    }
    
    if (action === "rate") {
      const templateId = parseInt(formData.get("templateId"));
      const rating = parseInt(formData.get("rating"));
      const review = formData.get("review");
      
      if (rating < 1 || rating > 5) {
        return json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }
      
      // Create or update rating
      await prisma.templateRating.upsert({
        where: {
          templateId_shop: {
            templateId,
            shop: session.shop
          }
        },
        update: {
          rating,
          review
        },
        create: {
          templateId,
          shop: session.shop,
          rating,
          review
        }
      });
      
      // Recalculate average rating
      const ratings = await prisma.templateRating.findMany({
        where: { templateId }
      });
      
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      const ratingCount = ratings.length;
      
      await prisma.popupTemplate.update({
        where: { id: templateId },
        data: {
          averageRating,
          ratingCount
        }
      });
      
      return json({ success: true, averageRating, ratingCount });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Template Marketplace action error:", error);
    return json({ error: "Failed to perform marketplace action" }, { status: 500 });
  }
}

// Helper function to get marketplace statistics
async function getMarketplaceStats() {
  const totalTemplates = await prisma.popupTemplate.count({
    where: { isPublic: true, templateType: "community" }
  });
  
  const totalInstalls = await prisma.templateUsageStats.count({
    where: { shop: "marketplace" }
  });
  
  const avgRating = await prisma.popupTemplate.aggregate({
    where: { 
      isPublic: true, 
      templateType: "community",
      ratingCount: { gt: 0 }
    },
    _avg: { averageRating: true }
  });
  
  const topCategories = await prisma.popupTemplate.groupBy({
    by: ["category"],
    where: { isPublic: true, templateType: "community" },
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
    take: 5
  });
  
  return {
    totalTemplates,
    totalInstalls,
    averageRating: avgRating._avg.averageRating || 0,
    topCategories: topCategories.map(cat => ({
      category: cat.category,
      count: cat._count.category
    }))
  };
}

// Helper function to mask shop domain for privacy
function maskShopDomain(shop) {
  if (!shop) return "Anonymous";
  
  const parts = shop.split(".");
  if (parts.length > 0) {
    const domain = parts[0];
    if (domain.length <= 3) {
      return domain + "***";
    }
    return domain.substring(0, 3) + "*".repeat(domain.length - 3);
  }
  return "Anonymous";
}
