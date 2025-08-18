/**
 * StayBoost Help Center - Comprehensive Documentation Hub
 * Provides detailed help and documentation for all app features
 */

import {
    Badge,
    BlockStack,
    Box,
    Button,
    Card,
    Divider,
    Grid,
    InlineStack,
    Layout,
    Page,
    Text
} from "@shopify/polaris";
import { ExternalIcon } from "@shopify/polaris-icons";

export default function HelpCenter() {
  const helpSections = [
    {
      title: "🚀 Quick Setup",
      description: "Get your popup running in 5 minutes",
      url: "/app/help/quick-setup",
      priority: "high",
      estimatedTime: "5 min"
    },
    {
      title: "🎨 Template Library",
      description: "Browse and apply professional templates",
      url: "/app/help/templates",
      priority: "high",
      estimatedTime: "3 min"
    },
    {
      title: "📊 Analytics & Performance",
      description: "Understanding your popup metrics",
      url: "/app/help/analytics",
      priority: "medium",
      estimatedTime: "10 min"
    },
    {
      title: "🛠️ Theme Installation",
      description: "Add StayBoost to your Shopify theme",
      url: "/app/help/installation",
      priority: "high",
      estimatedTime: "7 min"
    },
    {
      title: "💡 Best Practices",
      description: "Optimization tips for better results",
      url: "/app/help/best-practices",
      priority: "medium",
      estimatedTime: "15 min"
    },
    {
      title: "🔧 Troubleshooting",
      description: "Fix common issues and problems",
      url: "/app/help/troubleshooting",
      priority: "low",
      estimatedTime: "As needed"
    },
    {
      title: "❓ FAQ",
      description: "50+ frequently asked questions",
      url: "/app/help/faq",
      priority: "medium",
      estimatedTime: "Browse as needed"
    },
    {
      title: "🎯 A/B Testing",
      description: "Test different popups for best results",
      url: "/app/help/ab-testing",
      priority: "low",
      estimatedTime: "20 min"
    }
  ];

  const quickActions = [
    {
      title: "My popup isn't showing",
      description: "Check installation and settings",
      action: "Troubleshoot",
      url: "/app/help/troubleshooting#popup-not-showing"
    },
    {
      title: "Low conversion rates",
      description: "Optimize your popup for better results",
      action: "Optimize",
      url: "/app/help/best-practices#increasing-conversions"
    },
    {
      title: "Mobile not working",
      description: "Fix mobile popup issues",
      action: "Fix Mobile",
      url: "/app/help/troubleshooting#mobile-issues"
    },
    {
      title: "Set up discount codes",
      description: "Create Shopify discount codes",
      action: "Setup Codes",
      url: "/app/help/quick-setup#discount-codes"
    }
  ];

  const features = [
    {
      title: "Exit-Intent Detection",
      description: "Automatically detect when visitors are about to leave",
      status: "Active"
    },
    {
      title: "22+ Professional Templates",
      description: "Pre-designed templates for every occasion",
      status: "Active"
    },
    {
      title: "A/B Testing",
      description: "Test different versions to optimize performance",
      status: "Active"
    },
    {
      title: "Advanced Analytics",
      description: "Track impressions, conversions, and revenue",
      status: "Active"
    },
    {
      title: "Mobile Optimization",
      description: "Perfect popup experience on all devices",
      status: "Active"
    },
    {
      title: "Custom Templates",
      description: "Create your own custom popup designs",
      status: "Active"
    }
  ];

  return (
    <Page 
      title="StayBoost Help Center"
      subtitle="Everything you need to succeed with exit-intent popups"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            
            {/* Quick Actions */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  🚨 Need Help Right Now?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Common issues and quick solutions
                </Text>
                
                <Grid columns={2}>
                  {quickActions.map((action, index) => (
                    <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">
                          {action.title}
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {action.description}
                        </Text>
                        <Button 
                          variant="primary" 
                          size="slim"
                          url={action.url}
                          external
                        >
                          {action.action}
                        </Button>
                      </BlockStack>
                    </Box>
                  ))}
                </Grid>
              </BlockStack>
            </Card>

            {/* Main Help Sections */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  📚 Complete Documentation
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Comprehensive guides for all StayBoost features
                </Text>

                <Grid columns={3}>
                  {helpSections.map((section, index) => (
                    <Card key={index} sectioned>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <Text as="h3" variant="headingSm">
                            {section.title}
                          </Text>
                          <Badge tone={
                            section.priority === "high" ? "success" :
                            section.priority === "medium" ? "warning" : "info"
                          }>
                            {section.priority}
                          </Badge>
                        </InlineStack>
                        
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {section.description}
                        </Text>
                        
                        <Text as="p" variant="bodySm" tone="subdued">
                          ⏱️ {section.estimatedTime}
                        </Text>
                        
                        <Button 
                          variant="plain" 
                          url={section.url}
                          external
                          icon={ExternalIcon}
                        >
                          Read Guide
                        </Button>
                      </BlockStack>
                    </Card>
                  ))}
                </Grid>
              </BlockStack>
            </Card>

            {/* Video Tutorials */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  🎥 Video Tutorials
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Watch step-by-step video guides
                </Text>

                <Grid columns={3}>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="200">
                      <Box 
                        background="bg-surface-tertiary" 
                        borderRadius="200" 
                        padding="800"
                        style={{ textAlign: "center" }}
                      >
                        <Text as="p" variant="bodyLg">
                          ▶️ Setup Tutorial
                        </Text>
                      </Box>
                      <Text as="h3" variant="headingSm">
                        Complete Setup (5 min)
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        From installation to first conversion
                      </Text>
                      <Button variant="plain" size="slim">
                        Watch Now
                      </Button>
                    </BlockStack>
                  </Box>

                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="200">
                      <Box 
                        background="bg-surface-tertiary" 
                        borderRadius="200" 
                        padding="800"
                        style={{ textAlign: "center" }}
                      >
                        <Text as="p" variant="bodyLg">
                          ▶️ Template Guide
                        </Text>
                      </Box>
                      <Text as="h3" variant="headingSm">
                        Using Templates (3 min)
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Browse, customize, and apply templates
                      </Text>
                      <Button variant="plain" size="slim">
                        Watch Now
                      </Button>
                    </BlockStack>
                  </Box>

                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="200">
                      <Box 
                        background="bg-surface-tertiary" 
                        borderRadius="200" 
                        padding="800"
                        style={{ textAlign: "center" }}
                      >
                        <Text as="p" variant="bodyLg">
                          ▶️ Analytics Deep Dive
                        </Text>
                      </Box>
                      <Text as="h3" variant="headingSm">
                        Understanding Analytics (7 min)
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Optimize based on performance data
                      </Text>
                      <Button variant="plain" size="slim">
                        Watch Now
                      </Button>
                    </BlockStack>
                  </Box>
                </Grid>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            
            {/* Contact Support */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  💬 Still Need Help?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Our support team typically responds within 24 hours
                </Text>
                <Button variant="primary" fullWidth external url="mailto:support@stayboost.com">
                  Email Support
                </Button>
                <Button variant="plain" fullWidth external url="https://stayboost.com/contact">
                  Live Chat
                </Button>
              </BlockStack>
            </Card>

            {/* Feature Status */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  ✅ Your Features
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  All active features in your plan
                </Text>
                
                {features.map((feature, index) => (
                  <div key={index}>
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd">
                        {feature.title}
                      </Text>
                      <Badge tone="success">{feature.status}</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {feature.description}
                    </Text>
                    {index < features.length - 1 && <Divider />}
                  </div>
                ))}
              </BlockStack>
            </Card>

            {/* App Info */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  📱 App Information
                </Text>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Version</Text>
                  <Text as="p" variant="bodyMd" tone="subdued">2.1.0</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Last Updated</Text>
                  <Text as="p" variant="bodyMd" tone="subdued">Dec 2024</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Total Templates</Text>
                  <Text as="p" variant="bodyMd" tone="subdued">22</Text>
                </InlineStack>
                <Button variant="plain" fullWidth external url="https://stayboost.com/changelog">
                  View Changelog
                </Button>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
