import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Badge,
    BlockStack,
    Box,
    Card,
    DataTable,
    InlineGrid,
    Layout,
    Page,
    Text,
} from "@shopify/polaris";
import { getDashboardStats, getRecentAnalytics } from "../models/analytics.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Get comprehensive analytics
    const stats = await getDashboardStats(session.shop);
    const recentData = await getRecentAnalytics(session.shop, 7); // Last 7 days
    
    // Format recent data for display
    const chartData = recentData.map((record) => [
      record.date,
      record.impressions,
      record.conversions,
      `$${record.revenue.toFixed(2)}`,
    ]);

    return json({ analytics, chartData });
    
    return json({ stats, recentData: formattedRecentData });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return json({ 
      stats: {
        today: { impressions: 0, conversions: 0, conversionRate: 0, revenue: 0 },
        allTime: { impressions: 0, conversions: 0, conversionRate: 0, revenue: 0 },
        thirtyDays: { impressions: 0, conversions: 0, revenue: 0 },
      },
      recentData: []
    });
  }
};

export default function AnalyticsPage() {
  const { stats, recentData } = useLoaderData();

  return (
    <Page
      title="Analytics Dashboard"
      subtitle="Track your exit-intent popup performance"
      compactTitle
    >
      <BlockStack gap="500">
        {/* Performance Overview */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Performance Overview</Text>
            
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <Box>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">All-Time Impressions</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {stats.allTime.impressions.toLocaleString()}
                  </Text>
                  <Badge tone="info">Total views</Badge>
                </BlockStack>
              </Box>
              
              <Box>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">All-Time Conversions</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {stats.allTime.conversions.toLocaleString()}
                  </Text>
                  <Badge tone="success">Successful offers</Badge>
                </BlockStack>
              </Box>
              
              <Box>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">Conversion Rate</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {stats.allTime.conversionRate}%
                  </Text>
                  <Badge tone={stats.allTime.conversionRate > 10 ? "success" : "warning"}>
                    {stats.allTime.conversionRate > 10 ? "Excellent" : "Good"}
                  </Badge>
                </BlockStack>
              </Box>
              
              <Box>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">Revenue Recovered</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    ${(stats.allTime.revenue || 0).toFixed(2)}
                  </Text>
                  <Badge tone="success">Total saved</Badge>
                </BlockStack>
              </Box>
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Today's Performance */}
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Today's Performance</Text>
                
                <InlineGrid columns={2} gap="400">
                  <Box>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" tone="subdued">Impressions</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold">
                        {stats.today.impressions.toLocaleString()}
                      </Text>
                    </BlockStack>
                  </Box>
                  
                  <Box>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" tone="subdued">Conversions</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold">
                        {stats.today.conversions.toLocaleString()}
                      </Text>
                    </BlockStack>
                  </Box>
                  
                  <Box>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" tone="subdued">Conversion Rate</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold">
                        {stats.today.conversionRate}%
                      </Text>
                    </BlockStack>
                  </Box>
                  
                  <Box>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" tone="subdued">Revenue</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold">
                        ${(stats.today.revenue || 0).toFixed(2)}
                      </Text>
                    </BlockStack>
                  </Box>
                </InlineGrid>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">30-Day Summary</Text>
                
                <InlineGrid columns={1} gap="300">
                  <Box>
                    <BlockStack gap="200">
                      <Box>
                        <Text as="p" variant="bodyMd" tone="subdued">Total Impressions</Text>
                        <Text as="p" variant="headingLg" fontWeight="bold">
                          {stats.thirtyDays.impressions.toLocaleString()}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text as="p" variant="bodyMd" tone="subdued">Total Conversions</Text>
                        <Text as="p" variant="headingLg" fontWeight="bold">
                          {stats.thirtyDays.conversions.toLocaleString()}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text as="p" variant="bodyMd" tone="subdued">Revenue Recovered</Text>
                        <Text as="p" variant="headingLg" fontWeight="bold">
                          ${(stats.thirtyDays.revenue || 0).toFixed(2)}
                        </Text>
                      </Box>
                    </BlockStack>
                  </Box>
                </InlineGrid>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Recent Daily Performance */}
        {recentData.length > 0 && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Last 7 Days Performance</Text>
              
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'text', 'text']}
                headings={['Date', 'Impressions', 'Conversions', 'Conversion Rate', 'Revenue']}
                rows={recentData}
                sortable={[true, true, true, true, true]}
              />
            </BlockStack>
          </Card>
        )}

        {/* Analytics Insights */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Performance Insights</Text>
            
            <BlockStack gap="200">
              {stats.allTime.conversionRate > 15 && (
                <Box padding="300" background="bg-success-subdued" borderRadius="200">
                  <Text as="p" variant="bodyMd">
                    🎉 Excellent performance! Your conversion rate of {stats.allTime.conversionRate}% 
                    is above the industry average of 10-15%.
                  </Text>
                </Box>
              )}
              
              {stats.allTime.conversionRate >= 10 && stats.allTime.conversionRate <= 15 && (
                <Box padding="300" background="bg-warning-subdued" borderRadius="200">
                  <Text as="p" variant="bodyMd">
                    👍 Good performance! Your conversion rate of {stats.allTime.conversionRate}% 
                    is within the typical range of 10-15%.
                  </Text>
                </Box>
              )}
              
              {stats.allTime.conversionRate < 10 && stats.allTime.impressions > 100 && (
                <Box padding="300" background="bg-critical-subdued" borderRadius="200">
                  <Text as="p" variant="bodyMd">
                    💡 Consider optimizing your popup content or targeting. 
                    Current conversion rate: {stats.allTime.conversionRate}%
                  </Text>
                </Box>
              )}
              
              {stats.allTime.impressions === 0 && (
                <Box padding="300" background="bg-info-subdued" borderRadius="200">
                  <Text as="p" variant="bodyMd">
                    📊 No data yet. Make sure your popup is enabled and the theme extension is installed.
                  </Text>
                </Box>
              )}
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
