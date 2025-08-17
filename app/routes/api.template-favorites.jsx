import { PrismaClient } from "@prisma/client";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      return json({ error: "Shop not found" }, { status: 401 });
    }

    const method = request.method;
    const url = new URL(request.url);
    const templateId = url.searchParams.get("templateId");

    switch (method) {
      case "POST": {
        // Add template to favorites
        if (!templateId) {
          return json({ error: "Template ID is required" }, { status: 400 });
        }

        const templateIdNum = parseInt(templateId);
        if (isNaN(templateIdNum)) {
          return json({ error: "Invalid template ID" }, { status: 400 });
        }

        // Check if template exists
        const template = await prisma.popupTemplate.findUnique({
          where: { id: templateIdNum }
        });

        if (!template) {
          return json({ error: "Template not found" }, { status: 404 });
        }

        // Check if already favorited
        const existingFavorite = await prisma.templateFavorites.findUnique({
          where: {
            shop_templateId: {
              shop: shop,
              templateId: templateIdNum
            }
          }
        });

        if (existingFavorite) {
          return json({ error: "Template already favorited" }, { status: 409 });
        }

        // Create favorite
        const favorite = await prisma.templateFavorites.create({
          data: {
            shop: shop,
            templateId: templateIdNum
          },
          include: {
            template: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        });

        return json({
          success: true,
          message: "Template added to favorites",
          favorite
        });
      }

      case "DELETE": {
        // Remove template from favorites
        if (!templateId) {
          return json({ error: "Template ID is required" }, { status: 400 });
        }

        const templateIdNum = parseInt(templateId);
        if (isNaN(templateIdNum)) {
          return json({ error: "Invalid template ID" }, { status: 400 });
        }

        // Find and delete the favorite
        const existingFavorite = await prisma.templateFavorites.findUnique({
          where: {
            shop_templateId: {
              shop: shop,
              templateId: templateIdNum
            }
          }
        });

        if (!existingFavorite) {
          return json({ error: "Template not in favorites" }, { status: 404 });
        }

        await prisma.templateFavorites.delete({
          where: {
            shop_templateId: {
              shop: shop,
              templateId: templateIdNum
            }
          }
        });

        return json({
          success: true,
          message: "Template removed from favorites"
        });
      }

      default:
        return json({ error: "Method not allowed" }, { status: 405 });
    }
  } catch (error) {
    console.error("Template favorites API error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      return json({ error: "Shop not found" }, { status: 401 });
    }

    // Get all favorited templates for the shop
    const favorites = await prisma.templateFavorites.findMany({
      where: { shop: shop },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            templateType: true,
            config: true,
            previewImage: true,
            usageCount: true,
            averageRating: true,
            conversionRate: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Also get template IDs that are favorited for quick lookup
    const favoritedTemplateIds = favorites.map(fav => fav.templateId);

    return json({
      success: true,
      favorites,
      favoritedTemplateIds
    });
  } catch (error) {
    console.error("Template favorites loader error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
