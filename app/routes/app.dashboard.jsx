import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Badge,
    BlockStack,
    Box,
    Button,
    Card,
    InlineGrid,
    Layout,
    Page,
    Select,
    Text,
} from "@shopify/polaris";
import { useState } from "react";
import prisma from "../db.server.js";
import { getDashboardStats, getRecentAnalytics } from "../models/analytics.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  // Real analytics
  let stats;
  let recent = [];
  try {
    stats = await getDashboardStats(session.shop);
    // Default to last 7 days for the initial dashboard view
    recent = await getRecentAnalytics(session.shop, 7);
  } catch (e) {
    // Safe fallback to zeros
    stats = {
      today: { impressions: 0, conversions: 0, revenue: 0, conversionRate: 0 },
      allTime: { impressions: 0, conversions: 0, revenue: 0, conversionRate: 0 },
      thirtyDays: { impressions: 0, conversions: 0, revenue: 0 },
    };
    recent = [];
  }

  const analyticsData = {
    period: 7,
    totals: {
      impressions: stats.allTime.impressions || 0,
      conversions: stats.allTime.conversions || 0,
      revenue: stats.allTime.revenue || 0,
      conversionRate: stats.allTime.conversionRate || 0,
    },
    dailyData: recent.map((r) => ({
      date: r.date,
      impressions: r.impressions,
      conversions: r.conversions,
      revenue: r.revenue,
      conversionRate: r.conversionRate,
    })),
  };

  // Translations via relation on PopupSettings
  let translations = [];
  try {
    const settingsWithTranslations = await prisma.popupSettings.findUnique({
      where: { shop: session.shop },
      include: { translations: true },
    });
    if (settingsWithTranslations?.translations?.length) {
      translations = settingsWithTranslations.translations.map((t) => ({
        language: t.languageCode,
        title: t.title || settingsWithTranslations.title,
        message: t.message || settingsWithTranslations.message,
      }));
    }
  } catch (e) {
    // Leave translations empty on error
    translations = [];
  }

  return json({
    shop: session.shop,
    analytics: analyticsData,
    translations: { translations },
  });
};

export default function DashboardPage() {
  const { shop, analytics, translations } = useLoaderData();
  const [selectedPeriod, setSelectedPeriod] = useState("7");

  const periodOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
  ];

  return (
    <Page
      title="StayBoost Dashboard"
      subtitle={`Overview of your exit-intent popup performance for ${shop}`}
      compactTitle
    >
      <Layout>
        <Layout.Section>
          {/* Analytics Overview Card */}
          <Card>
            <BlockStack gap="400">
              <Box paddingBlockEnd="200">
                <InlineGrid columns={2} gap="400" alignItems="center">
                  <Text as="h2" variant="headingMd">Performance Analytics</Text>
                  <Box textAlign="end">
                    <Select
                      options={periodOptions}
                      value={selectedPeriod}
                      onChange={setSelectedPeriod}
                    />
                  </Box>
                </InlineGrid>
              </Box>
              
              <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                <Box>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" tone="subdued">Total Impressions</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {analytics.totals.impressions.toLocaleString()}
                    </Text>
                    <Badge tone="info">Views</Badge>
                  </BlockStack>
                </Box>
                
                <Box>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" tone="subdued">Conversions</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {analytics.totals.conversions.toLocaleString()}
                    </Text>
                    <Badge tone="success">Sales</Badge>
                  </BlockStack>
                </Box>
                
                <Box>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" tone="subdued">Revenue</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      ${analytics.totals.revenue.toFixed(2)}
                    </Text>
                    <Badge tone="success">Earned</Badge>
                  </BlockStack>
                </Box>
                
                <Box>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" tone="subdued">Conversion Rate</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {analytics.totals.conversionRate}%
                    </Text>
                    <Badge tone={analytics.totals.conversionRate > 3 ? "success" : "attention"}>
                      Rate
                    </Badge>
                  </BlockStack>
                </Box>
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          {/* Features Status Card */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Feature Status</Text>
              
              <BlockStack gap="300">
                <Box>
                  <InlineGrid columns={2} gap="200" alignItems="center">
                    <Text as="p" variant="bodyMd">Core Popup System</Text>
                    <Badge tone="success">Active</Badge>
                  </InlineGrid>
                </Box>
                
                <Box>
                  <InlineGrid columns={2} gap="200" alignItems="center">
                    <Text as="p" variant="bodyMd">Analytics API</Text>
                    <Badge tone="success">Implemented</Badge>
                  </InlineGrid>
                </Box>
                
                <Box>
                  <InlineGrid columns={2} gap="200" alignItems="center">
                    <Text as="p" variant="bodyMd">Translations API</Text>
                    <Badge tone="success">Implemented</Badge>
                  </InlineGrid>
                </Box>
                
                <Box>
                  <InlineGrid columns={2} gap="200" alignItems="center">
                    <Text as="p" variant="bodyMd">Advanced Features</Text>
                    <Badge tone="info">In Development</Badge>
                  </InlineGrid>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          {/* Multi-language Support Card */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Multi-language Support</Text>
              
              <BlockStack gap="300">
                {translations.translations.map((translation, index) => (
                  <Box key={translation.language}>
                    <BlockStack gap="100">
                      <InlineGrid columns={2} gap="200" alignItems="center">
                        <Text as="p" variant="bodyMd" fontWeight="medium">
                          {translation.language.toUpperCase()}
                        </Text>
                        <Badge tone="success">Ready</Badge>
                      </InlineGrid>
                      <Text as="p" variant="bodySm" tone="subdued">
                        "{translation.title}"
                      </Text>
                    </BlockStack>
                  </Box>
                ))}
              </BlockStack>
              
              <Button variant="plain">
                Manage Translations
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
