import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Badge,
    Banner,
    Button,
    Card,
    DataTable,
    Layout,
    Page,
    Text,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { logAnalyzer } from "../utils/logAnalysis.server";
import { log, LOG_CATEGORIES } from "../utils/logger.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    // Get comprehensive logging metrics
    const metrics = await logAnalyzer.getComprehensiveMetrics(24);
    const apiMetrics = await logAnalyzer.getApiMetrics(24);
    const loggingHealth = await logAnalyzer.getLoggingHealth();
    
    // Log dashboard access
    log.audit('dashboard_access', 'admin', 'logging_dashboard', {
      category: LOG_CATEGORIES.AUDIT,
      userAgent: request.headers.get('user-agent'),
    });
    
    return json({
      metrics,
      apiMetrics,
      loggingHealth,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Failed to load logging dashboard', {
      error: error.message,
      category: LOG_CATEGORIES.ERROR,
    });
    
    return json({
      error: 'Failed to load logging metrics',
      metrics: null,
      apiMetrics: null,
      loggingHealth: { status: 'error', issues: ['Unable to load metrics'] },
    }, { status: 500 });
  }
};

export default function LoggingDashboard() {
  const { metrics, apiMetrics, loggingHealth, error, lastUpdated } = useLoaderData();

  if (error) {
    return (
      <Page title="Logging Dashboard">
        <Banner status="critical" title="Error Loading Metrics">
          <p>{error}</p>
        </Banner>
      </Page>
    );
  }

  // Prepare summary stats
  const summaryStats = [
    {
      label: "Total Requests (24h)",
      value: metrics?.summary?.totalRequests?.toLocaleString() || "0",
      trend: "neutral",
    },
    {
      label: "Error Rate",
      value: `${metrics?.summary?.errorRate || 0}%`,
      trend: parseFloat(metrics?.summary?.errorRate || 0) > 5 ? "negative" : "positive",
    },
    {
      label: "Security Events",
      value: metrics?.summary?.securityEvents?.toString() || "0",
      trend: (metrics?.summary?.securityEvents || 0) > 0 ? "negative" : "positive",
    },
    {
      label: "Rate Limit Hits",
      value: metrics?.summary?.rateLimitHits?.toString() || "0",
      trend: (metrics?.summary?.rateLimitHits || 0) > 0 ? "negative" : "positive",
    },
  ];

  // Prepare error table data
  const errorTableRows = Array.from(metrics?.topErrors || []).map(([error, count]) => [
    error,
    count.toString(),
    count > 10 ? "High" : "Medium",
  ]);

  // Prepare API endpoint table data
  const apiTableRows = (apiMetrics?.endpointStats || []).slice(0, 10).map(endpoint => [
    endpoint.endpoint,
    endpoint.requests.toString(),
    `${endpoint.averageDuration}ms`,
    `${endpoint.errorRate}%`,
    parseFloat(endpoint.errorRate) > 5 ? "Poor" : "Good",
  ]);

  // Prepare slow requests table data
  const slowRequestsRows = (metrics?.slowRequests || []).slice(0, 10).map(request => [
    request.operation,
    `${request.duration.toFixed(2)}ms`,
    new Date(request.timestamp).toLocaleString(),
    "Slow",
  ]);

  // Prepare security events table data
  const securityTableRows = (metrics?.securityEvents || []).slice(0, 10).map(event => [
    event.event,
    event.severity,
    event.ip || "Unknown",
    new Date(event.timestamp).toLocaleString(),
  ]);

  return (
    <Page
      title="Logging Dashboard"
      subtitle={`Last updated: ${new Date(lastUpdated).toLocaleString()}`}
      primaryAction={
        <Button
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      }
    >
      <Layout>
        {/* System Health Banner */}
        <Layout.Section>
          {loggingHealth.status === 'error' && (
            <Banner status="critical" title="Logging System Issues">
              <ul>
                {loggingHealth.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </Banner>
          )}
          {loggingHealth.status === 'warning' && (
            <Banner status="warning" title="Logging System Warnings">
              <ul>
                {loggingHealth.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </Banner>
          )}
        </Layout.Section>

        {/* Summary Statistics */}
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">System Overview (24 hours)</Text>
            <div style={{ marginTop: "16px" }}>
              <Layout>
                {summaryStats.map((stat, index) => (
                  <Layout.Section oneThird key={index}>
                    <Card>
                      <Stack vertical spacing="tight">
                        <Text variant="bodyMd" color="subdued">
                          {stat.label}
                        </Text>
                        <Text variant="headingLg" as="p">
                          {stat.value}
                        </Text>
                        <Badge
                          status={
                            stat.trend === "positive" ? "success" :
                            stat.trend === "negative" ? "critical" : "info"
                          }
                        >
                          {stat.trend === "positive" ? "Good" :
                           stat.trend === "negative" ? "Attention Needed" : "Stable"}
                        </Badge>
                      </Stack>
                    </Card>
                  </Layout.Section>
                ))}
              </Layout>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            {/* Top Errors */}
            <Layout.Section oneHalf>
              <Card>
                <Text variant="headingMd" as="h2">Top Errors</Text>
                <div style={{ marginTop: "16px" }}>
                  {errorTableRows.length > 0 ? (
                    <DataTable
                      columnContentTypes={['text', 'numeric', 'text']}
                      headings={['Error Type', 'Count', 'Severity']}
                      rows={errorTableRows}
                    />
                  ) : (
                    <Text color="subdued">No errors recorded in the last 24 hours</Text>
                  )}
                </div>
              </Card>
            </Layout.Section>

            {/* Security Events */}
            <Layout.Section oneHalf>
              <Card>
                <Text variant="headingMd" as="h2">Recent Security Events</Text>
                <div style={{ marginTop: "16px" }}>
                  {securityTableRows.length > 0 ? (
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'text']}
                      headings={['Event', 'Severity', 'IP Address', 'Time']}
                      rows={securityTableRows}
                    />
                  ) : (
                    <Text color="subdued">No security events in the last 24 hours</Text>
                  )}
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* API Performance */}
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">API Endpoint Performance</Text>
            <div style={{ marginTop: "16px" }}>
              {apiTableRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'numeric', 'text', 'text', 'text']}
                  headings={['Endpoint', 'Requests', 'Avg Duration', 'Error Rate', 'Status']}
                  rows={apiTableRows}
                />
              ) : (
                <Text color="subdued">No API requests recorded in the last 24 hours</Text>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Slow Requests */}
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Slow Operations</Text>
            <div style={{ marginTop: "16px" }}>
              {slowRequestsRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Operation', 'Duration', 'Time', 'Status']}
                  rows={slowRequestsRows}
                />
              ) : (
                <Text color="subdued">No slow operations detected in the last 24 hours</Text>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Log Files Status */}
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Log Files Status</Text>
            <div style={{ marginTop: "16px" }}>
              <Stack vertical spacing="loose">
                <Text variant="bodyMd">
                  <strong>Total Disk Usage:</strong> {loggingHealth.diskUsage?.totalSizeMB || 0} MB 
                  ({loggingHealth.diskUsage?.fileCount || 0} files)
                </Text>
                
                {Object.entries(loggingHealth.logFiles || {}).map(([filename, fileInfo]) => (
                  <Stack key={filename} alignment="center" distribution="equalSpacing">
                    <Text variant="bodyMd">{filename}</Text>
                    <Text variant="bodyMd" color="subdued">
                      {(fileInfo.size / 1024).toFixed(1)} KB
                    </Text>
                    <Text variant="bodyMd" color="subdued">
                      {new Date(fileInfo.lastModified).toLocaleString()}
                    </Text>
                    <Badge status="success">Active</Badge>
                  </Stack>
                ))}
              </Stack>
            </div>
          </Card>
        </Layout.Section>

        {/* Category Breakdown */}
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Log Categories Breakdown</Text>
            <div style={{ marginTop: "16px" }}>
              <Stack vertical spacing="loose">
                {Object.entries(metrics?.breakdown || {}).map(([category, count]) => {
                  const total = metrics?.summary?.totalRequests || 1;
                  const percentage = ((count / total) * 100).toFixed(1);
                  
                  return (
                    <Stack key={category} alignment="center" distribution="equalSpacing">
                      <Text variant="bodyMd">{category}</Text>
                      <Text variant="bodyMd">{count.toLocaleString()} logs</Text>
                      <div style={{ width: "200px" }}>
                        <ProgressBar progress={parseFloat(percentage)} size="small" />
                      </div>
                      <Text variant="bodyMd" color="subdued">{percentage}%</Text>
                    </Stack>
                  );
                })}
              </Stack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
