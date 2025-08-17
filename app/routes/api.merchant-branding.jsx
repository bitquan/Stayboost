import { json } from "@remix-run/node";
import { getCachedMerchantBranding, getThemeBranding } from "../models/merchantBranding.server";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const includeTheme = url.searchParams.get("includeTheme") === "true";

    // Get merchant branding
    const brandingResult = await getCachedMerchantBranding(request);
    
    let themeResult = null;
    if (includeTheme) {
      themeResult = await getThemeBranding(request);
    }

    return json({
      success: true,
      branding: brandingResult.branding,
      theme: themeResult?.theme || null,
      cached: brandingResult.cached,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in branding API:', error);
    return json({
      success: false,
      error: error.message,
      branding: null,
      theme: null
    }, { status: 500 });
  }
}

export async function action({ request }) {
  try {
    const method = request.method;

    if (method === "POST") {
      // Update merchant branding preferences
      const formData = await request.formData();
      const updates = JSON.parse(formData.get("updates") || "{}");

      // Here you could save custom branding preferences
      // For now, we'll just return the updated branding
      
      return json({
        success: true,
        message: "Branding preferences updated",
        updates
      });
    }

    return json({
      success: false,
      error: "Method not allowed"
    }, { status: 405 });
  } catch (error) {
    console.error('Error updating branding:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
