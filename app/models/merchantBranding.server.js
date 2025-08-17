import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// Fetch merchant branding information from Shopify
export async function getMerchantBranding(request) {
  try {
    const { admin, shop } = await authenticate.admin(request);
    
    // Try to get shop branding from our database first
    let shopBranding = await prisma.shopBranding?.findUnique({
      where: { shop }
    });

    // If not found in our database, fetch from Shopify API
    if (!shopBranding) {
      const shopData = await admin.rest.resources.Shop.all({
        session: await authenticate.admin(request).session,
      });

      if (shopData.data && shopData.data.length > 0) {
        const shopInfo = shopData.data[0];
        
        // Create branding data structure
        shopBranding = {
          shop,
          shopName: shopInfo.name || shop.replace('.myshopify.com', ''),
          primaryColor: shopInfo.primary_color || '#008060',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          logoUrl: shopInfo.logo_url || null,
          domain: shopInfo.primary_domain?.host || shop,
          currency: shopInfo.currency || 'USD',
          timezone: shopInfo.iana_timezone || 'UTC'
        };

        // Save to our database for future use
        try {
          await prisma.shopBranding?.create({
            data: shopBranding
          });
        } catch (error) {
          // Ignore if table doesn't exist or other DB errors
          console.log('Could not save shop branding to database:', error.message);
        }
      }
    }

    return {
      success: true,
      branding: shopBranding || getDefaultBranding(shop)
    };
  } catch (error) {
    console.error('Error fetching merchant branding:', error);
    return {
      success: false,
      branding: getDefaultBranding(shop),
      error: error.message
    };
  }
}

// Get theme information for advanced branding
export async function getThemeBranding(request) {
  try {
    const { admin } = await authenticate.admin(request);
    
    // Get the published theme
    const themes = await admin.rest.resources.Theme.all({
      session: await authenticate.admin(request).session,
      role: 'main'
    });

    if (themes.data && themes.data.length > 0) {
      const mainTheme = themes.data[0];
      
      // Try to get theme settings (this may require additional permissions)
      try {
        const themeSettings = await admin.rest.resources.Asset.all({
          session: await authenticate.admin(request).session,
          theme_id: mainTheme.id,
          key: 'config/settings_data.json'
        });

        if (themeSettings.data && themeSettings.data.length > 0) {
          const settings = JSON.parse(themeSettings.data[0].value);
          return {
            success: true,
            theme: {
              id: mainTheme.id,
              name: mainTheme.name,
              settings: settings.current || {},
              colors: extractThemeColors(settings.current || {})
            }
          };
        }
      } catch (themeError) {
        console.log('Could not access theme settings:', themeError.message);
      }

      return {
        success: true,
        theme: {
          id: mainTheme.id,
          name: mainTheme.name,
          settings: {},
          colors: {}
        }
      };
    }

    return {
      success: false,
      theme: null,
      error: 'No published theme found'
    };
  } catch (error) {
    console.error('Error fetching theme branding:', error);
    return {
      success: false,
      theme: null,
      error: error.message
    };
  }
}

// Extract color palette from theme settings
function extractThemeColors(settings) {
  const colors = {};
  
  // Common theme color setting keys
  const colorKeys = [
    'color_primary',
    'color_secondary', 
    'color_accent',
    'color_button',
    'color_button_text',
    'color_text',
    'color_background',
    'color_header',
    'color_footer'
  ];

  colorKeys.forEach(key => {
    if (settings[key]) {
      colors[key] = settings[key];
    }
  });

  return colors;
}

// Default branding fallback
function getDefaultBranding(shop) {
  return {
    shop,
    shopName: shop.replace('.myshopify.com', ''),
    primaryColor: '#008060',
    backgroundColor: '#ffffff', 
    textColor: '#000000',
    logoUrl: null,
    domain: shop,
    currency: 'USD',
    timezone: 'UTC'
  };
}

// Cache merchant branding for performance
const brandingCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedMerchantBranding(request) {
  try {
    const { shop } = await authenticate.admin(request);
    const cacheKey = `branding_${shop}`;
    const cached = brandingCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return {
        success: true,
        branding: cached.data,
        cached: true
      };
    }

    const result = await getMerchantBranding(request);
    
    if (result.success) {
      brandingCache.set(cacheKey, {
        data: result.branding,
        timestamp: Date.now()
      });
    }

    return {
      ...result,
      cached: false
    };
  } catch (error) {
    console.error('Error in cached merchant branding:', error);
    return {
      success: false,
      branding: getDefaultBranding('unknown.myshopify.com'),
      error: error.message
    };
  }
}
