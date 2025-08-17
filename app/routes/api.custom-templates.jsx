import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    const { shop } = await authenticate.admin(request);
    const formData = await request.formData();
    const method = request.method;

    if (method === "POST") {
      // Create new custom template
      const templateData = {
        name: formData.get("name"),
        description: formData.get("description"),
        category: formData.get("category"),
        config: formData.get("config"), // JSON string
        tags: formData.get("tags"), // JSON string array
      };

      // Validate required fields
      if (!templateData.name || !templateData.category || !templateData.config) {
        return json({ error: "Name, category, and configuration are required" }, { status: 400 });
      }

      // Validate JSON config
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(templateData.config);
      } catch (error) {
        return json({ error: "Invalid configuration JSON" }, { status: 400 });
      }

      // Validate that config has required fields
      const requiredConfigFields = ['title', 'message', 'discountCode', 'discountPercentage'];
      const missingFields = requiredConfigFields.filter(field => !parsedConfig[field]);
      if (missingFields.length > 0) {
        return json({ 
          error: `Missing required configuration fields: ${missingFields.join(', ')}` 
        }, { status: 400 });
      }

      const template = await prisma.popupTemplate.create({
        data: {
          shop: shop,
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          templateType: "custom",
          config: templateData.config,
          tags: templateData.tags || "[]",
          isPublic: false,
          isFeatured: false,
        }
      });

      return json({ template, success: true });
    }

    if (method === "PUT") {
      // Update existing template
      const templateId = parseInt(formData.get("id"));
      const templateData = {
        name: formData.get("name"),
        description: formData.get("description"),
        category: formData.get("category"),
        config: formData.get("config"),
        tags: formData.get("tags"),
      };

      // Verify template belongs to this shop
      const existingTemplate = await prisma.popupTemplate.findFirst({
        where: {
          id: templateId,
          shop: shop,
          templateType: "custom" // Only allow editing custom templates
        }
      });

      if (!existingTemplate) {
        return json({ error: "Template not found or not editable" }, { status: 404 });
      }

      // Validate JSON config if provided
      if (templateData.config) {
        try {
          const parsedConfig = JSON.parse(templateData.config);
          const requiredConfigFields = ['title', 'message', 'discountCode', 'discountPercentage'];
          const missingFields = requiredConfigFields.filter(field => !parsedConfig[field]);
          if (missingFields.length > 0) {
            return json({ 
              error: `Missing required configuration fields: ${missingFields.join(', ')}` 
            }, { status: 400 });
          }
        } catch (error) {
          return json({ error: "Invalid configuration JSON" }, { status: 400 });
        }
      }

      const updatedTemplate = await prisma.popupTemplate.update({
        where: { id: templateId },
        data: {
          ...(templateData.name && { name: templateData.name }),
          ...(templateData.description && { description: templateData.description }),
          ...(templateData.category && { category: templateData.category }),
          ...(templateData.config && { config: templateData.config }),
          ...(templateData.tags && { tags: templateData.tags }),
          updatedAt: new Date(),
        }
      });

      return json({ template: updatedTemplate, success: true });
    }

    if (method === "DELETE") {
      // Delete custom template
      const templateId = parseInt(formData.get("id"));

      // Verify template belongs to this shop and is custom
      const existingTemplate = await prisma.popupTemplate.findFirst({
        where: {
          id: templateId,
          shop: shop,
          templateType: "custom"
        }
      });

      if (!existingTemplate) {
        return json({ error: "Template not found or not deletable" }, { status: 404 });
      }

      await prisma.popupTemplate.delete({
        where: { id: templateId }
      });

      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, { status: 405 });

  } catch (error) {
    console.error("Template operation error:", error);
    return json({ error: "Failed to process template operation" }, { status: 500 });
  }
}

// GET endpoint to fetch templates (can also be used for filtering)
export async function loader({ request }) {
  try {
    const { shop } = await authenticate.admin(request);
    const url = new URL(request.url);
    const templateType = url.searchParams.get("type") || "all";
    const category = url.searchParams.get("category");
    
    let whereClause = {
      OR: [
        { shop: "default" }, // Built-in templates
        { shop: shop } // Shop-specific templates
      ]
    };

    // Filter by template type
    if (templateType !== "all") {
      whereClause.templateType = templateType;
    }

    // Filter by category
    if (category && category !== "all") {
      whereClause.category = category;
    }

    const templates = await prisma.popupTemplate.findMany({
      where: whereClause,
      include: {
        usageStats: {
          where: { shop: shop },
          take: 1,
          orderBy: { date: "desc" }
        }
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" }
      ]
    });

    return json({ templates });
  } catch (error) {
    console.error("Error loading templates:", error);
    return json({ templates: [] });
  }
}
