import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    const { shop } = await authenticate.admin(request);
    const method = request.method;

    if (method === "POST") {
      const formData = await request.formData();
      const action = formData.get("action");

      if (action === "export") {
        // Export templates
        const templateIds = JSON.parse(formData.get("templateIds") || "[]");
        
        if (templateIds.length === 0) {
          return json({ error: "No templates selected for export" }, { status: 400 });
        }

        const templates = await prisma.popupTemplate.findMany({
          where: {
            id: { in: templateIds.map(id => parseInt(id)) },
            OR: [
              { shop: shop }, // User's custom templates
              { shop: "default" } // Built-in templates (for sharing)
            ]
          },
          select: {
            name: true,
            description: true,
            category: true,
            templateType: true,
            config: true,
            tags: true,
            conversionRate: true
          }
        });

        if (templates.length === 0) {
          return json({ error: "No templates found to export" }, { status: 404 });
        }

        // Create export package
        const exportPackage = {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          exportedBy: shop,
          templates: templates.map(template => ({
            ...template,
            // Parse config to ensure it's valid JSON
            config: JSON.parse(template.config || '{}'),
            // Parse tags if they exist
            tags: template.tags ? JSON.parse(template.tags) : []
          }))
        };

        return json({ 
          success: true, 
          exportPackage,
          filename: `stayboost-templates-${new Date().toISOString().split('T')[0]}.json`
        });

      } else if (action === "import") {
        // Import templates
        const importData = formData.get("importData");
        const overwriteExisting = formData.get("overwriteExisting") === "true";

        if (!importData) {
          return json({ error: "No import data provided" }, { status: 400 });
        }

        let importPackage;
        try {
          importPackage = JSON.parse(importData);
        } catch (error) {
          return json({ error: "Invalid import file format" }, { status: 400 });
        }

        // Validate import package structure
        if (!importPackage.templates || !Array.isArray(importPackage.templates)) {
          return json({ error: "Invalid import file: missing templates array" }, { status: 400 });
        }

        const results = {
          imported: 0,
          skipped: 0,
          errors: []
        };

        for (const templateData of importPackage.templates) {
          try {
            // Validate template data
            if (!templateData.name || !templateData.category || !templateData.config) {
              results.errors.push(`Template "${templateData.name || 'Unknown'}" missing required fields`);
              continue;
            }

            // Check if template with same name exists
            const existingTemplate = await prisma.popupTemplate.findFirst({
              where: {
                shop: shop,
                name: templateData.name
              }
            });

            if (existingTemplate && !overwriteExisting) {
              results.skipped++;
              continue;
            }

            // Prepare template data for database
            const dbTemplateData = {
              shop: shop,
              name: templateData.name,
              description: templateData.description || "",
              category: templateData.category,
              templateType: "custom", // Imported templates are always custom
              config: JSON.stringify(templateData.config),
              tags: JSON.stringify(templateData.tags || []),
              conversionRate: templateData.conversionRate || 0
            };

            if (existingTemplate && overwriteExisting) {
              // Update existing template
              await prisma.popupTemplate.update({
                where: { id: existingTemplate.id },
                data: dbTemplateData
              });
            } else {
              // Create new template
              await prisma.popupTemplate.create({
                data: dbTemplateData
              });
            }

            results.imported++;

          } catch (error) {
            results.errors.push(`Error importing template "${templateData.name}": ${error.message}`);
          }
        }

        return json({ 
          success: true, 
          results,
          message: `Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`
        });

      } else {
        return json({ error: "Invalid action. Use 'export' or 'import'" }, { status: 400 });
      }
    }

    return json({ error: "Method not allowed" }, { status: 405 });

  } catch (error) {
    console.error("Template import/export error:", error);
    return json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}

export async function loader({ request }) {
  try {
    const { shop } = await authenticate.admin(request);
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "export-list") {
      // Get list of exportable templates
      const templates = await prisma.popupTemplate.findMany({
        where: {
          OR: [
            { shop: shop }, // User's custom templates
            { shop: "default", templateType: "built_in" } // Built-in templates
          ]
        },
        select: {
          id: true,
          name: true,
          category: true,
          templateType: true,
          description: true
        },
        orderBy: { name: "asc" }
      });

      return json({ templates });
    }

    return json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Template import/export loader error:", error);
    return json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}
