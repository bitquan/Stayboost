import { PrismaClient } from "@prisma/client";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      return json({ error: "Shop not found" }, { status: 401 });
    }

    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q");
    const category = url.searchParams.get("category");
    const templateType = url.searchParams.get("type");
    const sortBy = url.searchParams.get("sort") || "name";
    const sortOrder = url.searchParams.get("order") || "asc";

    // Build where clause for search
    const whereClause = {
      OR: [
        { shop: "default" }, // Built-in templates
        { shop: shop } // Shop-specific templates
      ]
    };

    // Add search query filter
    if (searchQuery && searchQuery.trim()) {
      const searchTerms = searchQuery.trim().toLowerCase();
      whereClause.AND = [
        {
          OR: [
            {
              name: {
                contains: searchTerms,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: searchTerms,
                mode: 'insensitive'
              }
            },
            {
              category: {
                contains: searchTerms,
                mode: 'insensitive'
              }
            },
            {
              tags: {
                contains: searchTerms,
                mode: 'insensitive'
              }
            },
            {
              config: {
                contains: searchTerms,
                mode: 'insensitive'
              }
            }
          ]
        }
      ];
    }

    // Add category filter
    if (category && category !== "all") {
      if (!whereClause.AND) whereClause.AND = [];
      whereClause.AND.push({
        category: category
      });
    }

    // Add template type filter
    if (templateType && templateType !== "all") {
      if (!whereClause.AND) whereClause.AND = [];
      whereClause.AND.push({
        templateType: templateType
      });
    }

    // Build order by clause
    const orderBy = {};
    switch (sortBy) {
      case "name":
        orderBy.name = sortOrder;
        break;
      case "created":
        orderBy.createdAt = sortOrder;
        break;
      case "updated":
        orderBy.updatedAt = sortOrder;
        break;
      case "usage":
        orderBy.usageCount = sortOrder;
        break;
      case "rating":
        orderBy.averageRating = sortOrder;
        break;
      case "conversion":
        orderBy.conversionRate = sortOrder;
        break;
      default:
        orderBy.name = "asc";
    }

    // Execute search query
    const templates = await prisma.popupTemplate.findMany({
      where: whereClause,
      include: {
        usageStats: {
          take: 1,
          orderBy: { date: "desc" }
        },
        ratings: {
          take: 5,
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: orderBy
    });

    // Get total count for pagination info
    const totalCount = await prisma.popupTemplate.count({
      where: whereClause
    });

    // Get search suggestions if no results
    let suggestions = [];
    if (templates.length === 0 && searchQuery) {
      // Find similar templates by fuzzy matching
      const similarTemplates = await prisma.popupTemplate.findMany({
        where: {
          OR: [
            { shop: "default" },
            { shop: shop }
          ]
        },
        select: {
          name: true,
          category: true,
          tags: true
        },
        take: 5
      });

      // Simple fuzzy matching suggestions
      suggestions = similarTemplates
        .filter(template => {
          const searchLower = searchQuery.toLowerCase();
          const nameLower = template.name.toLowerCase();
          const categoryLower = template.category.toLowerCase();
          
          // Check for partial matches
          return nameLower.includes(searchLower.substring(0, 3)) ||
                 categoryLower.includes(searchLower.substring(0, 3)) ||
                 (template.tags && template.tags.toLowerCase().includes(searchLower.substring(0, 3)));
        })
        .map(template => template.name)
        .slice(0, 3);
    }

    return json({
      success: true,
      templates,
      totalCount,
      searchQuery: searchQuery || "",
      category: category || "all",
      templateType: templateType || "all",
      sortBy,
      sortOrder,
      suggestions
    });

  } catch (error) {
    console.error("Template search error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
