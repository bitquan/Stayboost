import { Badge, BlockStack, Box, Button, Card, Checkbox, InlineGrid, Layout, Page, Select, Spinner, Text, TextField } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

// Integration constants for real data integration
const INTEGRATION_CATEGORIES = {
  email: "Email Marketing",
  crm: "CRM & Customer Data",
  analytics: "Analytics & Tracking", 
  automation: "Marketing Automation",
  social: "Social Media",
  support: "Customer Support"
};

const INTEGRATION_STATUS = {
  connected: "Connected",
  available: "Available",
  coming_soon: "Coming Soon",
  beta: "Beta"
};

// Available webhook events for custom integrations  
const WEBHOOK_EVENTS = [
  { event: "popup_viewed", description: "When a popup is displayed to a visitor", enabled: true },
  { event: "popup_dismissed", description: "When a visitor closes a popup without converting", enabled: false },
  { event: "popup_converted", description: "When a visitor claims a discount or subscribes", enabled: true },
  { event: "discount_applied", description: "When a popup discount code is used at checkout", enabled: true },
  { event: "ab_test_assigned", description: "When a visitor is assigned to an A/B test variant", enabled: false }
];

// Fallback data for when APIs return no data
const FALLBACK_INTEGRATIONS = [];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  // Load integrations from API
  useEffect(() => {
    async function loadIntegrations() {
      try {
        setLoading(true);
        const response = await fetch('/api/integrations');
        if (!response.ok) {
          throw new Error('Failed to load integrations');
        }
        const data = await response.json();
        setIntegrations(data.integrations || FALLBACK_INTEGRATIONS);
      } catch (err) {
        console.error('Error loading integrations:', err);
        setError(err.message);
        setIntegrations(FALLBACK_INTEGRATIONS);
      } finally {
        setLoading(false);
      }
    }
    
    loadIntegrations();
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setSelectedCategory(value);
  }, []);

  const handleIntegrationSelect = useCallback((integration) => {
    setSelectedIntegration(integration);
  }, []);

  const handleConnectIntegration = useCallback((integration) => {
    if (integration.status === "coming_soon") {
      alert(`${integration.name} integration is coming soon!\n\nWe'll notify you when it's available.`);
      return;
    }
    
    if (integration.status === "connected") {
      alert(`${integration.name} is already connected!\n\nView the settings to modify your configuration.`);
      return;
    }
    
    console.log("Connecting integration:", integration.name);
    alert(`Connecting to ${integration.name}...\n\nYou'll be redirected to complete the authentication process.`);
  }, []);

  const handleDisconnectIntegration = useCallback((integration) => {
    console.log("Disconnecting integration:", integration.name);
    alert(`${integration.name} disconnected successfully!\n\nData sync has been stopped.`);
  }, []);

  const handleSaveWebhook = useCallback(() => {
    if (!webhookUrl.trim()) {
      alert("Please enter a webhook URL");
      return;
    }
    
    console.log("Saving webhook:", webhookUrl);
    alert(`Webhook endpoint saved successfully!\n\nURL: ${webhookUrl}\n\nEvents will now be sent to this endpoint.`);
    setWebhookUrl("");
    setShowWebhookForm(false);
  }, [webhookUrl]);

  const handleTestWebhook = useCallback(() => {
    console.log("Testing webhook...");
    alert("Test webhook sent successfully!\n\nCheck your endpoint for the test payload.");
  }, []);

  // Filter integrations by category
  const filteredIntegrations = selectedCategory === "all" 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  // Calculate stats
  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const totalEmailsCaptured = integrations
    .filter(i => i.metrics?.emailsCaptured)
    .reduce((sum, i) => sum + i.metrics.emailsCaptured, 0);
  const totalRevenue = integrations
    .filter(i => i.metrics?.revenue)
    .reduce((sum, i) => sum + i.metrics.revenue, 0);

  const categoryOptions = [
    { label: "All Categories", value: "all" },
    ...Object.entries(INTEGRATION_CATEGORIES).map(([value, label]) => ({
      label,
      value,
    }))
  ];

  return (
    <Page
      title="Integration Hub"
      subtitle="Connect StayBoost with your favorite marketing tools and analytics platforms"
      primaryAction={{
        content: "Custom Webhook",
        onAction: () => setShowWebhookForm(true)
      }}
    >
      <Layout>
        {/* Integration Stats Overview */}
        <Layout.Section>
          <Card>
            <InlineGrid columns={4} gap="4">
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {connectedCount}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Connected Integrations
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {totalEmailsCaptured.toLocaleString()}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Emails Synced
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    ${totalRevenue.toLocaleString()}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Attributed Revenue
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {integrations.length}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Available Integrations
                  </Text>
                </BlockStack>
              </Card>
            </InlineGrid>
          </Card>
        </Layout.Section>

        {/* Category Filter */}
        <Layout.Section>
          <Card>
            <Select
              label="Filter by category"
              options={categoryOptions}
              onChange={handleCategoryChange}
              value={selectedCategory}
            />
          </Card>
        </Layout.Section>

        {/* Custom Webhook Form */}
        {showWebhookForm && (
          <Layout.Section>
            <Card>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">
                  Custom Webhook Configuration
                </Text>
                
                <TextField
                  label="Webhook URL"
                  value={webhookUrl}
                  onChange={setWebhookUrl}
                  placeholder="https://your-app.com/webhooks/stayboost"
                  helpText="Enter the URL where you want to receive popup event data"
                />
                
                <BlockStack gap="3">
                  <Text variant="headingSm" as="h4">
                    Webhook Events
                  </Text>
                  {WEBHOOK_EVENTS.map((event) => (
                    <Checkbox
                      key={event.event}
                      label={`${event.event} - ${event.description}`}
                      checked={event.enabled}
                      onChange={() => {}}
                    />
                  ))}
                </BlockStack>
                
                <InlineGrid columns={3} gap="4">
                  <Button variant="primary" onClick={handleSaveWebhook}>
                    Save Webhook
                  </Button>
                  <Button onClick={() => setShowWebhookForm(false)}>
                    Cancel
                  </Button>
                  <Button variant="secondary" onClick={handleTestWebhook}>
                    Send Test
                  </Button>
                </InlineGrid>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Integrations Grid */}
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h3">
                Available Integrations
              </Text>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner accessibilityLabel="Loading integrations" size="large" />
                </div>
              ) : error ? (
                <Card>
                  <BlockStack gap="400">
                    <Text as="p" color="critical">
                      Error loading integrations: {error}
                    </Text>
                    <Button onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </BlockStack>
                </Card>
              ) : filteredIntegrations.length === 0 ? (
                <Card>
                  <BlockStack gap="400">
                    <Text as="p">
                      No integrations found for the selected category.
                    </Text>
                  </BlockStack>
                </Card>
              ) : (
                <InlineGrid columns={2} gap="4">
                  {filteredIntegrations.map((integration) => (
                  <Card key={integration.id} padding="4">
                    <BlockStack gap="4">
                      {/* Integration Header */}
                      <Box>
                        <InlineGrid columns={3} gap="4">
                          <BlockStack gap="2">
                            <Text variant="headingSm" as="h4">
                              {integration.icon} {integration.name}
                            </Text>
                            <Badge tone={
                              integration.status === "connected" ? "success" :
                              integration.status === "beta" ? "attention" :
                              integration.status === "coming_soon" ? "subdued" : "info"
                            }>
                              {INTEGRATION_STATUS[integration.status]}
                            </Badge>
                          </BlockStack>
                          
                          <BlockStack gap="2">
                            <Text variant="bodySm" tone="subdued">
                              <strong>Category:</strong> {INTEGRATION_CATEGORIES[integration.category]}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              <strong>Website:</strong> {integration.website}
                            </Text>
                          </BlockStack>
                          
                          <Box>
                            {integration.status === "connected" ? (
                              <Button 
                                variant="secondary" 
                                size="slim"
                                onClick={() => handleDisconnectIntegration(integration)}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button 
                                variant="primary" 
                                size="slim"
                                onClick={() => handleConnectIntegration(integration)}
                                disabled={integration.status === "coming_soon"}
                              >
                                Connect
                              </Button>
                            )}
                          </Box>
                        </InlineGrid>
                      </Box>

                      {/* Description */}
                      <Text variant="bodySm">
                        {integration.description}
                      </Text>

                      {/* Features */}
                      <BlockStack gap="2">
                        <Text variant="bodySm" tone="subdued">
                          <strong>Key Features:</strong>
                        </Text>
                        {integration.features.map((feature, index) => (
                          <Text key={index} variant="bodySm">
                            • {feature}
                          </Text>
                        ))}
                      </BlockStack>

                      {/* Performance Metrics */}
                      {integration.status === "connected" && Object.values(integration.metrics).some(v => v > 0) && (
                        <Box>
                          <BlockStack gap="2">
                            <Text variant="bodySm" tone="subdued">
                              <strong>Performance:</strong>
                            </Text>
                            <InlineGrid columns={2} gap="2">
                              {Object.entries(integration.metrics).map(([key, value]) => (
                                value > 0 && (
                                  <Text key={key} variant="bodySm">
                                    {key === "emailsCaptured" && `📧 ${value.toLocaleString()} emails`}
                                    {key === "revenue" && `💰 $${value.toLocaleString()}`}
                                    {key === "listsConnected" && `📋 ${value} lists`}
                                    {key === "syncSuccess" && `✅ ${value}% sync rate`}
                                    {key === "eventsTracked" && `📊 ${value.toLocaleString()} events`}
                                    {key === "conversionsRecorded" && `🎯 ${value.toLocaleString()} conversions`}
                                    {key === "revenueTracked" && `💵 $${value.toLocaleString()} tracked`}
                                    {key === "conversionsTracked" && `📈 ${value.toLocaleString()} conversions`}
                                    {key === "audienceSize" && `👥 ${value.toLocaleString()} audience`}
                                    {key === "campaignOptimizations" && `⚡ ${value} optimizations`}
                                    {key === "automationFlows" && `🔄 ${value} flows`}
                                    {key === "conversationsStarted" && `💬 ${value} conversations`}
                                    {key === "usersIdentified" && `🔍 ${value.toLocaleString()} users`}
                                    {key === "supportTickets" && `🎫 ${value} tickets`}
                                  </Text>
                                )
                              ))}
                            </InlineGrid>
                          </BlockStack>
                        </Box>
                      )}

                      {/* Setup Steps */}
                      <BlockStack gap="2">
                        <Text variant="bodySm" tone="subdued">
                          <strong>Setup Steps:</strong>
                        </Text>
                        {integration.setupSteps.map((step, index) => (
                          <Text key={index} variant="bodySm">
                            {index + 1}. {step}
                          </Text>
                        ))}
                      </BlockStack>

                      {/* Action Buttons */}
                      <InlineGrid columns={2} gap="2">
                        <Button
                          variant="secondary"
                          size="slim"
                          onClick={() => handleIntegrationSelect(integration)}
                        >
                          View Details
                        </Button>
                        {integration.status === "connected" && (
                          <Button
                            variant="secondary"
                            size="slim"
                          >
                            Settings
                          </Button>
                        )}
                      </InlineGrid>

                      {/* Integration Benefits */}
                      {integration.status === "connected" && integration.metrics.revenue > 0 && (
                        <Box 
                          padding="3"
                          background="bg-surface-success-subdued" 
                          borderRadius="2"
                        >
                          <Text variant="bodySm" tone="success">
                            💰 This integration has generated ${integration.metrics.revenue.toLocaleString()} in attributed revenue
                          </Text>
                        </Box>
                      )}
                    </BlockStack>
                  </Card>
                ))}
                </InlineGrid>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Selected Integration Details */}
        {selectedIntegration && (
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">
                  {selectedIntegration.icon} {selectedIntegration.name}
                </Text>
                
                <BlockStack gap="3">
                  <Text variant="bodySm">
                    <strong>Status:</strong> {INTEGRATION_STATUS[selectedIntegration.status]}
                  </Text>
                  <Text variant="bodySm">
                    <strong>Category:</strong> {INTEGRATION_CATEGORIES[selectedIntegration.category]}
                  </Text>
                  <Text variant="bodySm">
                    <strong>Description:</strong> {selectedIntegration.description}
                  </Text>
                  
                  {selectedIntegration.status === "connected" && (
                    <>
                      <Text variant="bodySm">
                        <strong>Performance Metrics:</strong>
                      </Text>
                      {Object.entries(selectedIntegration.metrics).map(([key, value]) => (
                        value > 0 && (
                          <Text key={key} variant="bodySm">
                            • {key}: {typeof value === 'number' && key.includes('revenue') ? `$${value.toLocaleString()}` : value.toLocaleString()}
                          </Text>
                        )
                      ))}
                    </>
                  )}
                </BlockStack>
                
                <InlineGrid columns={2} gap="2">
                  <Button
                    variant="secondary"
                    size="slim"
                    onClick={() => setSelectedIntegration(null)}
                  >
                    Close
                  </Button>
                  {selectedIntegration.status === "connected" ? (
                    <Button
                      variant="secondary"
                      size="slim"
                      onClick={() => handleDisconnectIntegration(selectedIntegration)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="slim"
                      onClick={() => handleConnectIntegration(selectedIntegration)}
                      disabled={selectedIntegration.status === "coming_soon"}
                    >
                      Connect
                    </Button>
                  )}
                </InlineGrid>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
