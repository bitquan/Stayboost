/**
 * Enhanced StayBoost Dashboard with Contextual Help
 * Integrates help components directly into the interface for better UX
 */

import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
    Badge,
    BlockStack,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Form,
    FormLayout,
    InlineGrid,
    InlineStack,
    Layout,
    Page,
    Text,
    TextField
} from "@shopify/polaris";
import { SaveIcon } from "@shopify/polaris-icons";
import { useState } from "react";

// Import our help components
import {
    AnalyticsHelp,
    FieldHelp,
    HelpNavigation,
    HelpTooltip,
    QuickSetupHelp,
    SettingsHelp,
    SuccessTips,
    ThemeIntegrationHelp
} from "../components/HelpComponents";

import { getPopupSettings, savePopupSettings } from "../models/popupSettings.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getPopupSettings(session.shop);
  
  return json({
    settings,
    shop: session.shop,
    // Mock analytics data - replace with real data later
    analytics: {
      impressions: 1247,
      conversions: 89,
      revenue: 2340.50,
      conversionRate: 7.1
    }
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const settings = {
    enabled: formData.get("enabled") === "true",
    title: formData.get("title"),
    message: formData.get("message"),
    discountCode: formData.get("discountCode"),
    discountPercentage: parseInt(formData.get("discountPercentage")),
    delaySeconds: parseInt(formData.get("delaySeconds")),
    showOnce: formData.get("showOnce") === "true"
  };

  await savePopupSettings(session.shop, settings);
  
  return json({ success: true, message: "Settings saved successfully!" });
};

export default function Dashboard() {
  const { settings, shop, analytics } = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();
  
  const [formSettings, setFormSettings] = useState(settings);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(true);

  // Check if this might be a first-time user
  const isFirstTime = !settings.title || settings.title === "Wait! Don't leave yet!";

  const handleInputChange = (field, value) => {
    setFormSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    const formData = new FormData();
    Object.entries(formSettings).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Page title="StayBoost Dashboard" subtitle={`Exit-intent popups for ${shop}`}>
      <BlockStack gap="500">
        
        {/* Help Navigation */}
        <HelpNavigation />
        
        {/* First-time Setup Help */}
        {isFirstTime && showFirstTimeHelp && (
          <QuickSetupHelp />
        )}

        {/* Theme Integration Alert */}
        {!settings.enabled && (
          <ThemeIntegrationHelp />
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                
                {/* Settings Section with Help */}
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Popup Settings
                  </Text>
                  <SettingsHelp />
                </InlineStack>

                <Form onSubmit={handleSubmit}>
                  <FormLayout>
                    
                    {/* Enable/Disable Toggle */}
                    <HelpTooltip content={FieldHelp.enabled}>
                      <Checkbox
                        label="Enable popup"
                        checked={formSettings.enabled}
                        onChange={(value) => handleInputChange("enabled", value)}
                      />
                    </HelpTooltip>

                    <Divider />

                    {/* Popup Content */}
                    <Text as="h3" variant="headingSm">Popup Content</Text>
                    
                    <HelpTooltip content={FieldHelp.title}>
                      <TextField
                        label="Popup Title"
                        value={formSettings.title}
                        onChange={(value) => handleInputChange("title", value)}
                        placeholder="Wait! Don't leave yet!"
                        helpText="Keep it short and attention-grabbing (5-8 words max)"
                      />
                    </HelpTooltip>

                    <HelpTooltip content={FieldHelp.message}>
                      <TextField
                        label="Popup Message"
                        value={formSettings.message}
                        onChange={(value) => handleInputChange("message", value)}
                        placeholder="Get 10% off your first order with code SAVE10"
                        multiline={2}
                        helpText="Clear value proposition - what's in it for them?"
                      />
                    </HelpTooltip>

                    <Divider />

                    {/* Discount Settings */}
                    <Text as="h3" variant="headingSm">Discount Offer</Text>
                    
                    <InlineGrid columns={2} gap="400">
                      <HelpTooltip content={FieldHelp.discountCode}>
                        <TextField
                          label="Discount Code"
                          value={formSettings.discountCode}
                          onChange={(value) => handleInputChange("discountCode", value)}
                          placeholder="SAVE10"
                          helpText="Must exist in Shopify admin"
                        />
                      </HelpTooltip>

                      <HelpTooltip content={FieldHelp.discountPercentage}>
                        <TextField
                          label="Discount Percentage"
                          type="number"
                          value={formSettings.discountPercentage}
                          onChange={(value) => handleInputChange("discountPercentage", value)}
                          suffix="%"
                          helpText="10-15% works well"
                        />
                      </HelpTooltip>
                    </InlineGrid>

                    <Divider />

                    {/* Behavior Settings */}
                    <Text as="h3" variant="headingSm">Popup Behavior</Text>
                    
                    <InlineGrid columns={2} gap="400">
                      <HelpTooltip content={FieldHelp.delaySeconds}>
                        <TextField
                          label="Delay (seconds)"
                          type="number"
                          value={formSettings.delaySeconds}
                          onChange={(value) => handleInputChange("delaySeconds", value)}
                          helpText="2-3 seconds recommended"
                        />
                      </HelpTooltip>

                      <Box paddingBlockStart="600">
                        <HelpTooltip content={FieldHelp.showOnce}>
                          <Checkbox
                            label="Show only once per visitor"
                            checked={formSettings.showOnce}
                            onChange={(value) => handleInputChange("showOnce", value)}
                          />
                        </HelpTooltip>
                      </Box>
                    </InlineGrid>

                    <Button
                      variant="primary"
                      size="large"
                      icon={SaveIcon}
                      onClick={handleSubmit}
                      loading={fetcher.state === "submitting"}
                    >
                      Save Settings
                    </Button>

                    {actionData?.success && (
                      <Badge tone="success">Settings saved successfully!</Badge>
                    )}

                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>

            {/* Success Tips */}
            <Card>
              <SuccessTips />
            </Card>

          </Layout.Section>

          <Layout.Section variant="oneThird">
            
            {/* Analytics with Help */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Performance Analytics
                  </Text>
                  <AnalyticsHelp />
                </InlineStack>

                <InlineGrid columns={2} gap="300">
                  <Box>
                    <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                      Impressions
                    </Text>
                    <Text as="p" variant="heading2xl" alignment="center">
                      {analytics.impressions.toLocaleString()}
                    </Text>
                  </Box>

                  <Box>
                    <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                      Conversions
                    </Text>
                    <Text as="p" variant="heading2xl" alignment="center" tone="success">
                      {analytics.conversions}
                    </Text>
                  </Box>

                  <Box>
                    <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                      Conversion Rate
                    </Text>
                    <Text as="p" variant="heading2xl" alignment="center" tone="success">
                      {analytics.conversionRate}%
                    </Text>
                    <HelpTooltip content="3-7% is good, 5%+ is excellent">
                      <Badge tone={analytics.conversionRate >= 5 ? "success" : analytics.conversionRate >= 3 ? "warning" : "critical"}>
                        {analytics.conversionRate >= 5 ? "Excellent" : analytics.conversionRate >= 3 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </HelpTooltip>
                  </Box>

                  <Box>
                    <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                      Revenue
                    </Text>
                    <Text as="p" variant="heading2xl" alignment="center" tone="success">
                      ${analytics.revenue.toFixed(2)}
                    </Text>
                  </Box>
                </InlineGrid>

                <Button fullWidth variant="plain">
                  View Detailed Analytics →
                </Button>
              </BlockStack>
            </Card>

            {/* Live Preview */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Live Preview
                </Text>
                <Box 
                  padding="400" 
                  background="bg-surface-secondary"
                  borderRadius="200"
                  style={{ position: "relative", minHeight: "200px" }}
                >
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    Popup preview will appear here when enabled
                  </Text>
                  
                  {formSettings.enabled && (
                    <Box
                      padding="300"
                      background="bg"
                      borderRadius="200"
                      shadow="200"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        border: "1px solid #e1e3e5",
                        minWidth: "250px"
                      }}
                    >
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">
                          {formSettings.title}
                        </Text>
                        <Text as="p" variant="bodyMd">
                          {formSettings.message}
                        </Text>
                        <InlineStack gap="200">
                          <Button size="slim" variant="primary">
                            Claim Offer
                          </Button>
                          <Button size="slim" variant="plain">
                            No Thanks
                          </Button>
                        </InlineStack>
                      </BlockStack>
                    </Box>
                  )}
                </Box>
              </BlockStack>
            </Card>

          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
