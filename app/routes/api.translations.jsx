import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

/**
 * Translations API
 * Priority #5 - Multi-language popup support for international stores
 * 
 * Phase 2 Implementation: Core API functionality
 * - GET: Retrieve translations for a shop
 * - POST: Create/update translations
 * - DELETE: Remove translations
 */

export async function loader({ request }) {
  await authenticate.admin(request);
  
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const language = url.searchParams.get("language");
  
  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  try {
    if (language) {
      // Get specific language translation
      const translation = await prisma.popupTranslation.findFirst({
        where: {
          shop,
          language
        }
      });

      return json({ 
        translation: translation || null,
        success: true 
      });
    } else {
      // Get all translations for shop
      const translations = await prisma.popupTranslation.findMany({
        where: { shop },
        orderBy: { language: 'asc' }
      });

      return json({ 
        translations,
        success: true 
      });
    }
  } catch (error) {
    console.error("Error fetching translations:", error);
    return json({ 
      error: "Failed to fetch translations",
      success: false 
    }, { status: 500 });
  }
}

export async function action({ request }) {
  await authenticate.admin(request);
  
  const method = request.method;
  
  if (method === "POST") {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      const { shop, language, title, message, buttonText, dismissText } = data;
      
      if (!shop || !language || !title || !message) {
        return json({ 
          error: "Shop, language, title, and message are required",
          success: false 
        }, { status: 400 });
      }

      // Upsert translation
      const translation = await prisma.popupTranslation.upsert({
        where: {
          shop_language: {
            shop,
            language
          }
        },
        update: {
          title,
          message,
          buttonText: buttonText || "Get Offer",
          dismissText: dismissText || "No thanks"
        },
        create: {
          shop,
          language,
          title,
          message,
          buttonText: buttonText || "Get Offer",
          dismissText: dismissText || "No thanks"
        }
      });

      return json({ 
        translation,
        success: true 
      });
    } catch (error) {
      console.error("Error saving translation:", error);
      return json({ 
        error: "Failed to save translation",
        success: false 
      }, { status: 500 });
    }
  }
  
  if (method === "DELETE") {
    try {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop");
      const language = url.searchParams.get("language");
      
      if (!shop || !language) {
        return json({ 
          error: "Shop and language parameters are required",
          success: false 
        }, { status: 400 });
      }

      await prisma.popupTranslation.delete({
        where: {
          shop_language: {
            shop,
            language
          }
        }
      });

      return json({ 
        success: true,
        message: "Translation deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting translation:", error);
      return json({ 
        error: "Failed to delete translation",
        success: false 
      }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
