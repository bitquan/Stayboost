import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { HEALTH_CONFIG } from "../constants/healthConfig.js";
import { authenticate } from "../shopify.server";
import {
    Badge,
    Banner,
    Button,
    Card,
    DataTable,
    Divider,
    Layout,
    List,
    Page,
    ProgressBar,
    Spinner,
    Stack,
    Text
} from "../utils/polarisCompat.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  try {
    // Import server-only health manager
    const { healthManager } = await import("../utils/healthCheck.server");
    
    // Get current health status and history
    const [currentHealth, history] = await Promise.all([
      healthManager.getLastCheck() || healthManager.runQuickCheck(),
      healthManager.getHistory(10)
    ]);

    return json({
      currentHealth,
      history,
      timestamp: new Date().toISOString(),
      config: {
        thresholds: HEALTH_CONFIG.THRESHOLDS,
        timeouts: HEALTH_CONFIG.TIMEOUTS,
        intervals: HEALTH_CONFIG.INTERVALS
      }
    });
  } catch (error) {
    return json({
      error: "Failed to load health data",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const actionType = formData.get("action");

  try {
    // Import server-only health manager
    const { healthManager } = await import("../utils/healthCheck.server");
    
    switch (actionType) {
      case "run_full_check":
        const fullResult = await healthManager.runAllChecks();
        return json({ success: true, result: fullResult });
        
      case "run_quick_check":
        const quickResult = await healthManager.runQuickCheck();
        return json({ success: true, result: quickResult });
        
      case "clear_history":
        healthManager.checkHistory = [];
        return json({ success: true, message: "History cleared" });
        
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return json({
      error: "Action failed",
      details: error.message
    }, { status: 500 });
  }
};

export default function HealthCheckPage() {
  const { currentHealth, history, config, error } = useLoaderData();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (revalidator.state === 'idle') {
        revalidator.revalidate();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [revalidator]);

  if (error) {
    return (
      <Page title="Health Check Dashboard">
        <Banner status="critical" title="Error Loading Health Data">
          <p>{error.details || error}</p>
        </Banner>
      </Page>
    );
  }

  const isLoading = fetcher.state !== 'idle' || revalidator.state === 'loading';

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case HEALTH_CONFIG.STATUS.HEALTHY:
        return <Badge status="success">Healthy</Badge>;
      case HEALTH_CONFIG.STATUS.WARNING:
        return <Badge status="warning">Warning</Badge>;
      case HEALTH_CONFIG.STATUS.CRITICAL:
        return <Badge status="critical">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Helper function to get progress color
  const getProgressColor = (status) => {
    switch (status) {
      case HEALTH_CONFIG.STATUS.HEALTHY:
        return "success";
      case HEALTH_CONFIG.STATUS.WARNING:
        return "warning";
      case HEALTH_CONFIG.STATUS.CRITICAL:
        return "critical";
      default:
        return "primary";
    }
  };

  // Prepare data table rows for individual checks
  const checkRows = currentHealth?.checks ? currentHealth.checks.map(check => [
    check.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    getStatusBadge(check.status),
    check.message,
    check.responseTime ? `${check.responseTime}ms` : 'N/A',
    check.timestamp ? new Date(check.timestamp).toLocaleTimeString() : 'N/A'
  ]) : [];

  // Prepare history data
  const historyRows = history ? history.slice(-5).reverse().map(item => [
    new Date(item.timestamp).toLocaleString(),
    getStatusBadge(item.status),
    item.totalCheckTime || 'N/A',
    item.summary ? `${item.summary.healthy}/${item.summary.total}` : 'N/A'
  ]) : [];

  // Calculate health percentage
  const healthPercentage = currentHealth?.summary ? 
    Math.round((currentHealth.summary.healthy / currentHealth.summary.total) * 100) : 0;

  return (
    <Page
      title="Health Check Dashboard"
      subtitle="Monitor system health and performance"
      primaryAction={{
        content: isLoading ? 'Checking...' : 'Run Full Check',
        loading: isLoading,
        onAction: () => {
          fetcher.submit(
            { action: 'run_full_check' },
            { method: 'POST' }
          );
        }
      }}
      secondaryActions={[
        {
          content: 'Quick Check',
          onAction: () => {
            fetcher.submit(
              { action: 'run_quick_check' },
              { method: 'POST' }
            );
          }
        },
        {
          content: 'Refresh',
          onAction: () => revalidator.revalidate()
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          {/* Overall Health Status */}
          <Card>
            <Stack vertical>
              <Stack distribution="equalSpacing" alignment="center">
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" as="h2">Overall System Health</Text>
                  <Text variant="bodyMd" color="subdued">
                    Last checked: {currentHealth?.timestamp ? 
                      new Date(currentHealth.timestamp).toLocaleString() : 'Never'}
                  </Text>
                </Stack>
                <Stack alignment="center" spacing="tight">
                  {getStatusBadge(currentHealth?.status)}
                  {isLoading && <Spinner size="small" />}
                </Stack>
              </Stack>
              
              <Divider />
              
              {/* Health Progress Bar */}
              <Stack vertical spacing="tight">
                <Stack distribution="equalSpacing">
                  <Text variant="bodyMd">Health Score</Text>
                  <Text variant="bodyMd" fontWeight="semibold">{healthPercentage}%</Text>
                </Stack>
                <ProgressBar 
                  progress={healthPercentage} 
                  color={getProgressColor(currentHealth?.status)}
                />
              </Stack>

              {/* Summary Statistics */}
              {currentHealth?.summary && (
                <Stack distribution="fillEvenly">
                  <Stack vertical spacing="tight" alignment="center">
                    <Text variant="headingMd" color="success">
                      {currentHealth.summary.healthy}
                    </Text>
                    <Text variant="bodyMd" color="subdued">Healthy</Text>
                  </Stack>
                  <Stack vertical spacing="tight" alignment="center">
                    <Text variant="headingMd" color="warning">
                      {currentHealth.summary.warning}
                    </Text>
                    <Text variant="bodyMd" color="subdued">Warnings</Text>
                  </Stack>
                  <Stack vertical spacing="tight" alignment="center">
                    <Text variant="headingMd" color="critical">
                      {currentHealth.summary.critical}
                    </Text>
                    <Text variant="bodyMd" color="subdued">Critical</Text>
                  </Stack>
                  <Stack vertical spacing="tight" alignment="center">
                    <Text variant="headingMd">
                      {currentHealth.summary.total}
                    </Text>
                    <Text variant="bodyMd" color="subdued">Total</Text>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          {/* Individual Health Checks */}
          <Card>
            <Stack vertical>
              <Text variant="headingMd" as="h2">System Components</Text>
              {checkRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Component', 'Status', 'Message', 'Response Time', 'Last Check']}
                  rows={checkRows}
                />
              ) : (
                <Banner status="info">
                  <p>No health check data available. Run a health check to see component status.</p>
                </Banner>
              )}
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          {/* Recent History */}
          <Card>
            <Stack vertical>
              <Stack distribution="equalSpacing" alignment="center">
                <Text variant="headingMd" as="h2">Recent History</Text>
                <Button
                  plain
                  onClick={() => {
                    fetcher.submit(
                      { action: 'clear_history' },
                      { method: 'POST' }
                    );
                  }}
                >
                  Clear History
                </Button>
              </Stack>
              
              {historyRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Timestamp', 'Status', 'Check Time', 'Healthy/Total']}
                  rows={historyRows}
                />
              ) : (
                <Text variant="bodyMd" color="subdued">No history available</Text>
              )}
            </Stack>
          </Card>

          {/* System Configuration */}
          <Card>
            <Stack vertical>
              <Text variant="headingMd" as="h2">Health Check Configuration</Text>
              
              <Stack vertical spacing="loose">
                <Stack vertical spacing="tight">
                  <Text variant="headingSm" as="h3">Response Time Thresholds</Text>
                  <List>
                    <List.Item>API Timeout: {config?.timeouts?.API / 1000}s</List.Item>
                    <List.Item>Database Timeout: {config?.timeouts?.DATABASE / 1000}s</List.Item>
                    <List.Item>Backup Timeout: {config?.timeouts?.BACKUP / 1000}s</List.Item>
                  </List>
                </Stack>
                
                <Stack vertical spacing="tight">
                  <Text variant="headingSm" as="h3">Performance Thresholds</Text>
                  <List>
                    <List.Item>Response Time: {config?.thresholds?.RESPONSE_TIME_MS}ms</List.Item>
                    <List.Item>Memory Usage: {config?.thresholds?.MEMORY_USAGE_PCT}%</List.Item>
                    <List.Item>Disk Usage: {config?.thresholds?.DISK_USAGE_PCT}%</List.Item>
                  </List>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Success/Error Messages */}
      {fetcher.data?.success && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <Banner status="success" onDismiss={() => {}}>
            Health check completed successfully
          </Banner>
        </div>
      )}

      {fetcher.data?.error && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <Banner status="critical" onDismiss={() => {}}>
            {fetcher.data.error}: {fetcher.data.details}
          </Banner>
        </div>
      )}
    </Page>
  );
}
