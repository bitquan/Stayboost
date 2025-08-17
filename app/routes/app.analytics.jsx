import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Badge,
    BlockStack,
    Box,
    Card,
    DataTable,
    InlineStack,
    Layout,
    Page,
    Text,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Fetch analytics overview
    const analyticsUrl = new URL('/api/template-analytics', new URL(request.url).origin);
    analyticsUrl.searchParams.set('shop', session.shop);
    
    const analyticsResponse = await fetch(analyticsUrl.toString());
    const analyticsData = await analyticsResponse.json();
    
    return json({
      analytics: analyticsData.analytics || [],
      summary: {
        totalImpressions: analyticsData.analytics?.reduce((sum, t) => sum + t.totalImpressions, 0) || 0,
        totalConversions: analyticsData.analytics?.reduce((sum, t) => sum + t.totalConversions, 0) || 0,
        averageConversionRate: analyticsData.analytics?.length > 0 
          ? analyticsData.analytics.reduce((sum, t) => sum + t.conversionRate, 0) / analyticsData.analytics.length 
          : 0,
      },
    });
  } catch (error) {
    console.error('Failed to load analytics:', error);
    return json({
      analytics: [],
      summary: {},
    });
  }
};

export default function Analytics() {
  const { analytics, summary } = useLoaderData();

  const formatRate = (rate) => {
    return rate ? `${(rate * 100).toFixed(1)}%` : '0.0%';
  };

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  const getBadgeStatus = (rate) => {
    if (rate >= 0.1) return 'success'; // 10%+ conversion rate
    if (rate >= 0.05) return 'warning'; // 5-10% conversion rate
    return 'critical'; // <5% conversion rate
  };

  const tableRows = analytics.map((template, index) => [
    template.name || `Template ${template.id}`,
    formatNumber(template.totalImpressions),
    formatNumber(template.totalConversions),
    formatNumber(template.totalDismissals),
    <Badge key={`badge-${index}`} status={getBadgeStatus(template.conversionRate)}>
      {formatRate(template.conversionRate)}
    </Badge>,
    formatNumber(template.usageCount),
  ]);

  return (
    <Page
      title="Template Performance Analytics"
      subtitle="Track how your popup templates are performing"
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Summary Cards */}
            <InlineStack gap="400">
              <Card>
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">
                      Total Impressions
                    </Text>
                    <Text variant="heading2xl" as="p">
                      {formatNumber(summary.totalImpressions)}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
              
              <Card>
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">
                      Total Conversions
                    </Text>
                    <Text variant="heading2xl" as="p">
                      {formatNumber(summary.totalConversions)}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
              
              <Card>
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">
                      Average Conversion Rate
                    </Text>
                    <Text variant="heading2xl" as="p">
                      {formatRate(summary.averageConversionRate)}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            </InlineStack>

            {/* Performance Table */}
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Template Performance Breakdown
                  </Text>
                  
                  {analytics.length > 0 ? (
                    <DataTable
                      columnContentTypes={[
                        'text',
                        'numeric',
                        'numeric', 
                        'numeric',
                        'text',
                        'numeric',
                      ]}
                      headings={[
                        'Template',
                        'Impressions',
                        'Conversions',
                        'Dismissals',
                        'Conversion Rate',
                        'Times Used',
                      ]}
                      rows={tableRows}
                    />
                  ) : (
                    <Box padding="400">
                      <Text variant="bodyMd" tone="subdued" alignment="center">
                        No analytics data available yet. Apply some templates and they'll start tracking performance automatically.
                      </Text>
                    </Box>
                  )}
                </BlockStack>
              </Box>
            </Card>

            {/* Performance Tips */}
            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">
                    Performance Tips
                  </Text>
                  <Text variant="bodyMd">
                    • Templates with conversion rates above 10% are performing excellently
                  </Text>
                  <Text variant="bodyMd">
                    • Conversion rates between 5-10% are good and can be optimization targets
                  </Text>
                  <Text variant="bodyMd">
                    • Templates below 5% conversion rate may need different messaging or timing
                  </Text>
                  <Text variant="bodyMd">
                    • High dismissal rates might indicate the popup appears too frequently or at the wrong time
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
