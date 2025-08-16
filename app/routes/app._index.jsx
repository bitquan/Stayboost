import { useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Checkbox,
  Badge,
  Divider,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getPopupSettings, savePopupSettings, defaults } from "../models/popupSettings.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getPopupSettings(session.shop);
  return { settings, stats: { impressions: 0, conversions: 0, conversionRate: 0 } };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "saveSettings") {
    const settings = {
      enabled: formData.get("enabled") === "true",
      title: formData.get("title") ?? defaults.title,
      message: formData.get("message") ?? defaults.message,
      discountCode: formData.get("discountCode") ?? defaults.discountCode,
      discountPercentage: parseInt(formData.get("discountPercentage")),
      delaySeconds: parseInt(formData.get("delaySeconds")),
      showOnce: formData.get("showOnce") === "true",
    };
    const saved = await savePopupSettings(session.shop, settings);
    return { success: true, settings: saved };
  }

  return { success: false };
};

export default function Index() {
  const { data } = useFetcher();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  // Form state
  const [settings, setSettings] = useState({
    enabled: true,
    title: "Wait! Don't leave yet!",
    message: "Get 10% off your first order",
    discountCode: "SAVE10",
    discountPercentage: 10,
    delaySeconds: 2,
    showOnce: true,
  });

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
                    <Text as="p" variant="headingLg">1,250</Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">Conversions</Text>
                    <Text as="p" variant="headingLg">89</Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">Conversion Rate</Text>
                    <Text as="p" variant="headingLg">7.1%</Text>
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
                    <Text as="span" variant="bodySm">47</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Today's Conversions</Text>
                    <Text as="span" variant="bodySm">4</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Revenue Recovered</Text>
                    <Text as="span" variant="bodySm">$127.50</Text>
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
