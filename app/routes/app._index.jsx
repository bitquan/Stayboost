/**
 * StayBoost Main Admin Dashboard
 * Primary interface for popup configuration and analytics
 * 
 * TODO: Missing Features and Integration
 * - [ ] Add A/B testing interface and controls
 * - [ ] Integrate popup scheduling functionality
 * - [ ] Add frequency controls configuration
 * - [ ] Implement multi-language settings
 * - [ ] Add advanced analytics dashboard
 * - [ ] Integrate visual popup designer
 * - [ ] Add popup template selector
 * - [ ] Implement real-time preview updates
 * - [ ] Add conversion rate optimization suggestions
 * - [ ] Integrate performance monitoring dashboard
 * 
 * TODO: Testing Needed
 * - [ ] Unit tests for React components
 * - [ ] Integration tests with settings API
 * - [ ] E2E tests for complete configuration workflow
 * - [ ] Accessibility testing (WCAG compliance)
 * - [ ] Mobile responsiveness testing
 * - [ ] Form validation and error handling tests
 * - [ ] Analytics data display tests
 * - [ ] Cross-browser compatibility tests
 */

import { useFetcher, useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
    Badge,
    BlockStack,
    Button,
    Card,
    Checkbox,
    Divider,
    InlineStack,
    Layout,
    Page,
    Text,
    TextField,
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { defaults, getPopupSettings, savePopupSettings } from "../models/popupSettings.server";
import { authenticate } from "../shopify.server";
import {
    detectSuspiciousInput,
    InputValidator,
    ValidationError
} from "../utils/inputValidation.server";
import {
    createTimer,
    log,
    LOG_CATEGORIES,
    logBusinessMetric,
    logError,
    logRequest
} from "../utils/logger.server";

export const loader = async ({ request }) => {
  const { getDashboardStats } = await import("../models/analytics.server");
  const { session } = await authenticate.admin(request);
  const settings = await getPopupSettings(session.shop);
  
  // Get analytics with fallback to defaults if there's an error
  let stats;
  try {
    stats = await getDashboardStats(session.shop);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    stats = { 
      allTime: { impressions: 0, conversions: 0, conversionRate: 0 }
    };
  }
  
  return { settings, stats };
};

export const action = async ({ request }) => {
  const timer = createTimer('app_settings_action', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get("action");

    if (action === "saveSettings") {
      timer.checkpoint('save_settings_start');

      // Extract and validate form data
      const rawSettings = {
        enabled: formData.get("enabled"),
        title: formData.get("title"),
        message: formData.get("message"),
        discountCode: formData.get("discountCode"),
        discountPercentage: formData.get("discountPercentage"),
        delaySeconds: formData.get("delaySeconds"),
        showOnce: formData.get("showOnce"),
      };

      // Validate all text inputs for suspicious content
      const textFields = ['title', 'message', 'discountCode'];
      for (const field of textFields) {
        const value = rawSettings[field];
        if (value && detectSuspiciousInput(value, 'content')) {
          timer.checkpoint('suspicious_input_detected');
          
          log.warn('Suspicious input detected in popup settings', {
            field,
            shop: session.shop,
            value: value.substring(0, 50),
            category: LOG_CATEGORIES.SECURITY,
            correlationId,
          });

          return { 
            success: false, 
            error: `Invalid ${field}: contains suspicious content` 
          };
        }
      }

      // Validate and sanitize numeric inputs
      let discountPercentage = parseInt(rawSettings.discountPercentage);
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        timer.checkpoint('discount_validation_failed');
        
        log.warn('Invalid discount percentage provided', {
          discountPercentage: rawSettings.discountPercentage,
          shop: session.shop,
          category: LOG_CATEGORIES.API,
          correlationId,
        });

        return { 
          success: false, 
          error: "Discount percentage must be between 0 and 100" 
        };
      }

      let delaySeconds = parseInt(rawSettings.delaySeconds);
      if (isNaN(delaySeconds) || delaySeconds < 0 || delaySeconds > 60) {
        timer.checkpoint('delay_validation_failed');
        
        log.warn('Invalid delay seconds provided', {
          delaySeconds: rawSettings.delaySeconds,
          shop: session.shop,
          category: LOG_CATEGORIES.API,
          correlationId,
        });

        return { 
          success: false, 
          error: "Delay seconds must be between 0 and 60" 
        };
      }

      // Create sanitized settings object
      const settings = {
        enabled: rawSettings.enabled === "true",
        title: rawSettings.title ?? defaults.title,
        message: rawSettings.message ?? defaults.message,
        discountCode: rawSettings.discountCode ?? defaults.discountCode,
        discountPercentage,
        delaySeconds,
        showOnce: rawSettings.showOnce === "true",
      };

      // Additional validation using InputValidator
      try {
        const validatedSettings = InputValidator.sanitizePopupSettings(settings);
        timer.checkpoint('settings_validated');

        const saved = await savePopupSettings(session.shop, validatedSettings);
        timer.checkpoint('settings_saved');

        // Log business metric
        logBusinessMetric('popup_settings_updated', 1, 'count', {
          shop: session.shop,
          enabled: validatedSettings.enabled,
          correlationId,
        });

        log.info('Popup settings successfully updated', {
          shop: session.shop,
          enabled: validatedSettings.enabled,
          category: LOG_CATEGORIES.BUSINESS,
          correlationId,
        });

        return { success: true, settings: saved };

      } catch (error) {
        timer.checkpoint('validation_error');
        
        if (error instanceof ValidationError) {
          log.warn('Settings validation failed', {
            shop: session.shop,
            error: error.message,
            category: LOG_CATEGORIES.API,
            correlationId,
          });

          return { 
            success: false, 
            error: `Validation failed: ${error.message}` 
          };
        }
        
        throw error;
      }
    }

    timer.checkpoint('invalid_action');
    log.warn('Invalid action provided', {
      action,
      shop: session.shop,
      category: LOG_CATEGORIES.API,
      correlationId,
    });

    return { success: false, error: "Invalid action" };

  } catch (error) {
    timer.checkpoint('error_occurred');
    
    logError(error, {
      endpoint: '/app',
      action: 'settings_update',
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    return { 
      success: false, 
      error: "Internal server error" 
    };
  }
};

export default function Index() {
  const { settings: initialSettings, stats } = useLoaderData();
  const fetcher = useFetcher();
  
  // Form state
  const [settings, setSettings] = useState(initialSettings);

  const isLoading = ["loading", "submitting"].includes(fetcher.state);

  const handleSaveSettings = useCallback(() => {
    const formData = new FormData();
    formData.append("action", "saveSettings");
    Object.entries(settings).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    fetcher.submit(formData, { method: "POST" });
  }, [settings, fetcher]);

  const handleFieldChange = useCallback((field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Page>
      <TitleBar title="StayBoost - Exit-Intent Popups">
        <button 
          variant="primary" 
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </button>
      </TitleBar>
      
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            {/* Status Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    StayBoost Status
                  </Text>
                  <Badge tone={settings.enabled ? "success" : "critical"}>
                    {settings.enabled ? "Active" : "Inactive"}
                  </Badge>
                </InlineStack>
                
                <InlineStack gap="600">
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">Impressions</Text>
                    <Text as="p" variant="headingLg">{(stats?.allTime?.impressions || 0).toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">Conversions</Text>
                    <Text as="p" variant="headingLg">{(stats?.allTime?.conversions || 0).toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">Conversion Rate</Text>
                    <Text as="p" variant="headingLg">{stats?.allTime?.conversionRate || 0}%</Text>
                  </div>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Settings Card */}
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                  Popup Settings
                </Text>
                
                <Checkbox
                  label="Enable exit-intent popup"
                  checked={settings.enabled}
                  onChange={(value) => handleFieldChange('enabled', value)}
                />

                <Divider />

                <BlockStack gap="400">
                  <Text as="h3" variant="headingSm">Content</Text>
                  
                  <TextField
                    label="Popup Title"
                    value={settings.title}
                    onChange={(value) => handleFieldChange('title', value)}
                    placeholder="Wait! Don't leave yet!"
                  />

                  <TextField
                    label="Message"
                    value={settings.message}
                    onChange={(value) => handleFieldChange('message', value)}
                    placeholder="Get 10% off your first order"
                    multiline={3}
                  />

                  <InlineStack gap="400">
                    <TextField
                      label="Discount Code"
                      value={settings.discountCode}
                      onChange={(value) => handleFieldChange('discountCode', value)}
                      placeholder="SAVE10"
                    />

                    <TextField
                      label="Discount Percentage"
                      type="number"
                      value={settings.discountPercentage.toString()}
                      onChange={(value) => handleFieldChange('discountPercentage', parseInt(value) || 0)}
                      suffix="%"
                    />
                  </InlineStack>
                </BlockStack>

                <Divider />

                <BlockStack gap="400">
                  <Text as="h3" variant="headingSm">Behavior</Text>
                  
                  <TextField
                    label="Trigger Delay"
                    type="number"
                    value={settings.delaySeconds.toString()}
                    onChange={(value) => handleFieldChange('delaySeconds', parseInt(value) || 0)}
                    suffix="seconds"
                    helpText="Delay before popup can be triggered when mouse leaves window"
                  />

                  <Checkbox
                    label="Show popup only once per visitor"
                    checked={settings.showOnce}
                    onChange={(value) => handleFieldChange('showOnce', value)}
                    helpText="If enabled, popup will only show once per visitor session"
                  />
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              {/* Preview Card */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Popup Preview
                  </Text>
                  
                  <div style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      maxWidth: '300px',
                      margin: '0 auto'
                    }}>
                      <Text as="h3" variant="headingSm" alignment="center">
                        {settings.title}
                      </Text>
                      <br />
                      <Text as="p" variant="bodyMd" alignment="center">
                        {settings.message}
                      </Text>
                      <br />
                      <Button variant="primary" size="large" fullWidth>
                        Get {settings.discountPercentage}% Off - {settings.discountCode}
                      </Button>
                      <br />
                      <Button variant="plain" size="small">
                        No thanks, I'll pay full price
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Card>

              {/* Quick Stats */}
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Quick Stats
                  </Text>
                  
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Today's Impressions</Text>
                    <Text as="span" variant="bodySm">{(stats?.today?.impressions || 0).toLocaleString()}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Today's Conversions</Text>
                    <Text as="span" variant="bodySm">{(stats?.today?.conversions || 0).toLocaleString()}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Revenue Recovered</Text>
                    <Text as="span" variant="bodySm">${(stats?.today?.revenue || 0).toFixed(2)}</Text>
                  </InlineStack>
                </BlockStack>
              </Card>

              {/* Help Card */}
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Getting Started
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    🎯 <strong>Step 1:</strong> Customize your popup message and discount
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    ⚡ <strong>Step 2:</strong> Enable the popup and save settings
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    📊 <strong>Step 3:</strong> Monitor performance and optimize
                  </Text>
                  
                  <Button variant="plain" fullWidth>
                    View Documentation
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
