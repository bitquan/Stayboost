import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    Checkbox,
    DataTable,
    EmptyState,
    FormLayout,
    Icon,
    InlineStack,
    Layout,
    Modal,
    Page,
    Select,
    Text,
    TextField
} from "@shopify/polaris";
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    EmailIcon,
    LinkIcon,
    NotificationIcon,
    XCircleIcon
} from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";

/**
 * Admin interface for real-time alerting system
 * Priority #13 - Email/webhook alerts management
 */

// Dynamic import for server-side alerting functions
async function getAlertingModule() {
  const module = await import("../utils/alerting.server.js");
  return module;
}

export async function loader({ request }) {
  await authenticate.admin(request);

  try {
    const { getAlertManager } = await getAlertingModule();
    const alertManager = getAlertManager();
    
    // Get alert statistics
    const stats = alertManager.getAlertStats();
    
    // Get recent deliveries (last 20)
    const deliveryTracker = alertManager.getDeliveryTracker();
    const recentDeliveries = Array.from(deliveryTracker.entries())
      .sort((a, b) => b[1].createdAt - a[1].createdAt)
      .slice(0, 20)
      .map(([id, data]) => ({
        id,
        ...data,
        timestamp: new Date(data.createdAt).toLocaleString()
      }));

    // Get webhook endpoints
    const webhooks = Array.from(alertManager.webhookEndpoints).map((webhook, index) => ({
      id: index,
      url: webhook.url,
      hasSecret: !!webhook.secret,
      secretPreview: webhook.secret ? `${webhook.secret.substring(0, 8)}...` : 'None'
    }));

    // Get environment configuration
    const emailConfig = {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUser: process.env.SMTP_USER || '',
      smtpFromEmail: process.env.SMTP_FROM || 'alerts@stayboost.app',
      adminEmail: process.env.ADMIN_EMAIL || '',
      securityEmail: process.env.SECURITY_EMAIL || ''
    };

    return json({
      stats,
      recentDeliveries,
      webhooks,
      emailConfig,
      alertTypes: {
        severity: ['low', 'medium', 'high', 'critical'],
        category: ['system', 'security', 'performance', 'business', 'error']
      }
    });
  } catch (error) {
    console.error('Failed to load alerting data:', error);
    return json({
      error: error.message,
      stats: { total: 0, lastHour: 0, lastDay: 0, successRate: { overall: 0 } },
      recentDeliveries: [],
      webhooks: [],
      emailConfig: {},
      alertTypes: { severity: [], category: [] }
    });
  }
}

export async function action({ request }) {
  await authenticate.admin(request);
  
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    const { getAlertManager, ALERT_SEVERITY } = await getAlertingModule();
    const alertManager = getAlertManager();

    switch (action) {
      case "test_email": {
        const title = formData.get("title") || "Test Email Alert";
        const message = formData.get("message") || "This is a test email alert from StayBoost.";
        const recipients = formData.get("recipients")?.split(',').map(r => r.trim()).filter(Boolean) || [];
        
        if (recipients.length === 0) {
          return json({ error: "Please provide at least one email recipient" });
        }

        const result = await alertManager.sendAlert({
          category: 'system',
          severity: ALERT_SEVERITY.LOW,
          title,
          message,
          emailRecipients: recipients,
          details: { testType: 'manual', source: 'admin_interface' }
        });

        return json({ success: true, message: "Test email sent", result });
      }

      case "test_webhook": {
        const title = formData.get("title") || "Test Webhook Alert";
        const message = formData.get("message") || "This is a test webhook alert from StayBoost.";
        
        if (alertManager.webhookEndpoints.size === 0) {
          return json({ error: "No webhook endpoints configured" });
        }

        const result = await alertManager.sendAlert({
          category: 'system',
          severity: ALERT_SEVERITY.LOW,
          title,
          message,
          details: { testType: 'manual', source: 'admin_interface' }
        });

        return json({ success: true, message: "Test webhook sent", result });
      }

      case "add_webhook": {
        const url = formData.get("webhook_url");
        const secret = formData.get("webhook_secret") || null;
        
        if (!url) {
          return json({ error: "Webhook URL is required" });
        }

        const success = alertManager.addWebhookEndpoint(url, secret);
        if (success) {
          return json({ success: true, message: "Webhook endpoint added successfully" });
        } else {
          return json({ error: "Invalid webhook URL" });
        }
      }

      case "send_alert": {
        const severity = formData.get("severity");
        const category = formData.get("category");
        const title = formData.get("title");
        const message = formData.get("message");
        const details = formData.get("details");
        const emailRecipients = formData.get("email_recipients")?.split(',').map(r => r.trim()).filter(Boolean) || [];

        if (!title || !message) {
          return json({ error: "Title and message are required" });
        }

        const result = await alertManager.sendAlert({
          severity,
          category,
          title,
          message,
          details: details ? { manual: details } : null,
          emailRecipients
        });

        return json({ success: true, message: "Alert sent successfully", result });
      }

      case "cleanup": {
        alertManager.cleanup();
        return json({ success: true, message: "Cleanup completed" });
      }

      default:
        return json({ error: "Unknown action" });
    }
  } catch (error) {
    console.error('Alert action failed:', error);
    return json({ error: error.message });
  }
}

export default function AlertingDashboard() {
  const data = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();
  
  // Modal states
  const [showTestModal, setShowTestModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showSendAlertModal, setShowSendAlertModal] = useState(false);
  
  // Form states
  const [testForm, setTestForm] = useState({
    type: 'email',
    title: 'Test Alert',
    message: 'This is a test alert from StayBoost',
    recipients: data.emailConfig.adminEmail || ''
  });
  
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    secret: '',
    generateSecret: true
  });
  
  const [alertForm, setAlertForm] = useState({
    severity: 'medium',
    category: 'system',
    title: '',
    message: '',
    details: '',
    emailRecipients: data.emailConfig.adminEmail || ''
  });

  // Generate webhook secret if needed
  useEffect(() => {
    if (webhookForm.generateSecret && !webhookForm.secret) {
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setWebhookForm(prev => ({ ...prev, secret }));
    }
  }, [webhookForm.generateSecret, webhookForm.secret]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Prepare delivery table data
  const deliveryRows = data.recentDeliveries.map(delivery => [
    delivery.id.substring(0, 8),
    delivery.timestamp,
    delivery.email ? (delivery.email.success ? 
      <Badge status="success">Sent</Badge> : 
      <Badge status="critical">Failed</Badge>
    ) : <Badge>N/A</Badge>,
    delivery.webhooks.length > 0 ? (
      delivery.webhooks.every(w => w.success) ? 
        <Badge status="success">All Sent</Badge> :
        delivery.webhooks.some(w => w.success) ?
          <Badge status="attention">Partial</Badge> :
          <Badge status="critical">All Failed</Badge>
    ) : <Badge>N/A</Badge>,
    delivery.success ? 
      <Icon source={CheckCircleIcon} tone="success" /> : 
      <Icon source={XCircleIcon} tone="critical" />
  ]);

  // Prepare webhook table data
  const webhookRows = data.webhooks.map((webhook, index) => [
    webhook.url,
    webhook.hasSecret ? 
      <Badge key={`security-${index}`} status="success">Secured</Badge> : 
      <Badge key={`security-${index}`} status="attention">No Secret</Badge>,
    webhook.secretPreview,
    <Button key={`action-${index}`} size="slim" tone="critical">Remove</Button>
  ]);

  const emailConfigured = data.emailConfig.smtpHost && data.emailConfig.smtpUser;
  const webhooksConfigured = data.webhooks.length > 0;

  return (
    <Page
      title="Real-time Alerting"
      subtitle="Manage email and webhook notifications for critical events"
      primaryAction={{
        content: "Send Test Alert",
        icon: NotificationIcon,
        onAction: () => setShowTestModal(true)
      }}
      secondaryActions={[
        {
          content: "Add Webhook",
          icon: LinkIcon,
          onAction: () => setShowWebhookModal(true)
        },
        {
          content: "Send Alert",
          icon: AlertTriangleIcon,
          onAction: () => setShowSendAlertModal(true)
        }
      ]}
    >
      <Layout>
        {/* Status Banner */}
        {actionData?.error && (
          <Layout.Section>
            <Banner status="critical" title="Error">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        )}
        
        {actionData?.success && (
          <Layout.Section>
            <Banner status="success" title="Success">
              <p>{actionData.message}</p>
            </Banner>
          </Layout.Section>
        )}

        {data.error && (
          <Layout.Section>
            <Banner status="critical" title="System Error">
              <p>{data.error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Configuration Status */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Configuration Status</Text>
              <InlineStack distribution="equalSpacing">
                <InlineStack gap="200" align="center">
                  <Icon source={EmailIcon} />
                  <Text>Email Alerts</Text>
                  {emailConfigured ? (
                    <Badge status="success">Configured</Badge>
                  ) : (
                    <Badge status="critical">Not Configured</Badge>
                  )}
                </InlineStack>
                <InlineStack gap="200" align="center">
                  <Icon source={LinkIcon} />
                  <Text>Webhook Alerts</Text>
                  {webhooksConfigured ? (
                    <Badge status="success">{data.webhooks.length} endpoint(s)</Badge>
                  ) : (
                    <Badge status="attention">No Endpoints</Badge>
                  )}
                </InlineStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Alert Statistics */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">Alert Volume</Text>
                  <InlineStack distribution="equalSpacing">
                    <Text>Last Hour: <Text variant="headingXl">{data.stats.lastHour}</Text></Text>
                    <Text>Last Day: <Text variant="headingXl">{data.stats.lastDay}</Text></Text>
                  </InlineStack>
                  <Text>Total Alerts: {data.stats.total}</Text>
                </BlockStack>
              </Card>
            </Layout.Section>
            
            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">Success Rates</Text>
                  <Text>Email: {data.stats.successRate.email?.toFixed(1) || 0}%</Text>
                  <Text>Webhooks: {data.stats.successRate.webhooks?.toFixed(1) || 0}%</Text>
                  <Text>Overall: {data.stats.successRate.overall?.toFixed(1) || 0}%</Text>
                </BlockStack>
              </Card>
            </Layout.Section>
            
            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">Rate Limiting</Text>
                  <Text>Active Limits: {data.stats.rateLimits?.active || 0}</Text>
                  <Button 
                    size="slim" 
                    onClick={() => {
                      fetcher.submit({ action: "cleanup" }, { method: "post" });
                    }}
                  >
                    Clean Up Old Data
                  </Button>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Recent Deliveries */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Recent Alert Deliveries</Text>
              {data.recentDeliveries.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Alert ID', 'Timestamp', 'Email', 'Webhooks', 'Status']}
                  rows={deliveryRows}
                />
              ) : (
                <EmptyState
                  heading="No alerts sent yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Send your first test alert to see delivery tracking here.</p>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Webhook Configuration */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Webhook Endpoints</Text>
              {data.webhooks.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['URL', 'Security', 'Secret Preview', 'Actions']}
                  rows={webhookRows}
                />
              ) : (
                <EmptyState
                  heading="No webhook endpoints configured"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Add webhook endpoints to receive real-time alert notifications.</p>
                  <Button primary onClick={() => setShowWebhookModal(true)}>
                    Add Webhook Endpoint
                  </Button>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Email Configuration Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Email Configuration</Text>
              {emailConfigured ? (
                <BlockStack gap="200">
                  <Text>SMTP Host: {data.emailConfig.smtpHost}</Text>
                  <Text>SMTP Port: {data.emailConfig.smtpPort}</Text>
                  <Text>From Email: {data.emailConfig.smtpFromEmail}</Text>
                  <Text>Admin Email: {data.emailConfig.adminEmail || 'Not set'}</Text>
                  <Text>Security Email: {data.emailConfig.securityEmail || 'Not set'}</Text>
                </BlockStack>
              ) : (
                <Banner status="info">
                  <p>Configure SMTP settings via environment variables to enable email alerts:</p>
                  <ul>
                    <li>SMTP_HOST - SMTP server hostname</li>
                    <li>SMTP_PORT - SMTP server port (default: 587)</li>
                    <li>SMTP_USER - SMTP username</li>
                    <li>SMTP_PASS - SMTP password</li>
                    <li>SMTP_FROM - From email address</li>
                    <li>ADMIN_EMAIL - Admin email for notifications</li>
                    <li>SECURITY_EMAIL - Email for security alerts</li>
                  </ul>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Test Alert Modal */}
      <Modal
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Send Test Alert"
        primaryAction={{
          content: "Send Test",
          onAction: () => {
            const formData = new FormData();
            formData.append("action", testForm.type === 'email' ? "test_email" : "test_webhook");
            formData.append("title", testForm.title);
            formData.append("message", testForm.message);
            if (testForm.type === 'email') {
              formData.append("recipients", testForm.recipients);
            }
            fetcher.submit(formData, { method: "post" });
            setShowTestModal(false);
          }
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowTestModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Test Type"
              options={[
                { label: 'Email Alert', value: 'email' },
                { label: 'Webhook Alert', value: 'webhook' }
              ]}
              value={testForm.type}
              onChange={(value) => setTestForm(prev => ({ ...prev, type: value }))}
            />
            
            <TextField
              label="Alert Title"
              value={testForm.title}
              onChange={(value) => setTestForm(prev => ({ ...prev, title: value }))}
            />
            
            <TextField
              label="Alert Message"
              value={testForm.message}
              onChange={(value) => setTestForm(prev => ({ ...prev, message: value }))}
              multiline={3}
            />
            
            {testForm.type === 'email' && (
              <TextField
                label="Email Recipients"
                value={testForm.recipients}
                onChange={(value) => setTestForm(prev => ({ ...prev, recipients: value }))}
                helpText="Comma-separated email addresses"
              />
            )}
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Add Webhook Modal */}
      <Modal
        open={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        title="Add Webhook Endpoint"
        primaryAction={{
          content: "Add Webhook",
          onAction: () => {
            const formData = new FormData();
            formData.append("action", "add_webhook");
            formData.append("webhook_url", webhookForm.url);
            if (webhookForm.secret) {
              formData.append("webhook_secret", webhookForm.secret);
            }
            fetcher.submit(formData, { method: "post" });
            setShowWebhookModal(false);
            setWebhookForm({ url: '', secret: '', generateSecret: true });
          }
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowWebhookModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Webhook URL"
              value={webhookForm.url}
              onChange={(value) => setWebhookForm(prev => ({ ...prev, url: value }))}
              placeholder="https://your-server.com/webhook/stayboost"
              helpText="The endpoint that will receive webhook notifications"
            />
            
            <Checkbox
              label="Generate webhook secret"
              checked={webhookForm.generateSecret}
              onChange={(checked) => setWebhookForm(prev => ({ 
                ...prev, 
                generateSecret: checked,
                secret: checked ? prev.secret : ''
              }))}
              helpText="Recommended for security - verifies webhook authenticity"
            />
            
            {webhookForm.generateSecret && (
              <TextField
                label="Webhook Secret"
                value={webhookForm.secret}
                onChange={(value) => setWebhookForm(prev => ({ ...prev, secret: value }))}
                helpText="Used to sign webhook payloads for verification"
              />
            )}
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Send Alert Modal */}
      <Modal
        open={showSendAlertModal}
        onClose={() => setShowSendAlertModal(false)}
        title="Send Manual Alert"
        primaryAction={{
          content: "Send Alert",
          onAction: () => {
            const formData = new FormData();
            formData.append("action", "send_alert");
            formData.append("severity", alertForm.severity);
            formData.append("category", alertForm.category);
            formData.append("title", alertForm.title);
            formData.append("message", alertForm.message);
            formData.append("details", alertForm.details);
            formData.append("email_recipients", alertForm.emailRecipients);
            fetcher.submit(formData, { method: "post" });
            setShowSendAlertModal(false);
          }
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowSendAlertModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Severity"
              options={data.alertTypes.severity.map(s => ({ 
                label: s.charAt(0).toUpperCase() + s.slice(1), 
                value: s 
              }))}
              value={alertForm.severity}
              onChange={(value) => setAlertForm(prev => ({ ...prev, severity: value }))}
            />
            
            <Select
              label="Category"
              options={data.alertTypes.category.map(c => ({ 
                label: c.charAt(0).toUpperCase() + c.slice(1), 
                value: c 
              }))}
              value={alertForm.category}
              onChange={(value) => setAlertForm(prev => ({ ...prev, category: value }))}
            />
            
            <TextField
              label="Alert Title"
              value={alertForm.title}
              onChange={(value) => setAlertForm(prev => ({ ...prev, title: value }))}
              required
            />
            
            <TextField
              label="Alert Message"
              value={alertForm.message}
              onChange={(value) => setAlertForm(prev => ({ ...prev, message: value }))}
              multiline={3}
              required
            />
            
            <TextField
              label="Additional Details"
              value={alertForm.details}
              onChange={(value) => setAlertForm(prev => ({ ...prev, details: value }))}
              multiline={2}
              helpText="Optional additional context for the alert"
            />
            
            <TextField
              label="Email Recipients"
              value={alertForm.emailRecipients}
              onChange={(value) => setAlertForm(prev => ({ ...prev, emailRecipients: value }))}
              helpText="Comma-separated email addresses (optional)"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
