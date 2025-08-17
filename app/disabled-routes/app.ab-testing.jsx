import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    DataTable,
    Divider,
    FormLayout,
    InlineStack,
    Layout,
    Modal,
    Page,
    ProgressBar,
    Select,
    Text,
    TextField
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";

/**
 * A/B Testing Management Interface
 * Priority #16 - Split test different popup designs and messages
 */

// Dynamic import for server-side A/B testing functions
async function getABTestingModule() {
  const module = await import("../utils/abTesting.server.js");
  return module;
}

export async function loader({ request }) {
  await authenticate.admin(request);

  try {
    const { getABTestManager } = await getABTestingModule();
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shop') || 'default';
    
    const manager = getABTestManager(shopId);
    const tests = await manager.getTests();
    
    return json({
      tests,
      shopId,
      testTypes: [
        { label: 'Popup Design', value: 'popup_design' },
        { label: 'Message Content', value: 'message_content' },
        { label: 'Discount Amount', value: 'discount_amount' },
        { label: 'Timing', value: 'timing' },
        { label: 'Trigger Rules', value: 'trigger_rules' }
      ]
    });

  } catch (error) {
    console.error('A/B Testing loader error:', error);
    return json(
      { error: 'Failed to load A/B tests', tests: [], testTypes: [] },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  await authenticate.admin(request);

  try {
    const { getABTestManager, AB_TEST_STATUS } = await getABTestingModule();
    const formData = await request.formData();
    const action = formData.get("action");
    const shopId = formData.get("shopId") || 'default';
    
    const manager = getABTestManager(shopId);

    switch (action) {
      case "create_test": {
        const name = formData.get("name");
        const description = formData.get("description");
        const testType = formData.get("testType");
        const duration = parseInt(formData.get("duration")) || 14;
        
        // Parse variants (simplified - would have more complex UI)
        const variantA = {
          name: formData.get("variantAName") || "Control",
          config: JSON.parse(formData.get("variantAConfig") || '{}')
        };
        const variantB = {
          name: formData.get("variantBName") || "Test",
          config: JSON.parse(formData.get("variantBConfig") || '{}')
        };
        
        const test = await manager.createTest({
          name,
          description,
          testType,
          variants: [variantA, variantB],
          trafficSplit: [50, 50],
          duration
        });

        return json({ success: true, test });
      }

      case "start_test": {
        const testId = formData.get("testId");
        const test = await manager.startTest(testId);
        return json({ success: true, test });
      }

      case "track_impression": {
        const testId = formData.get("testId");
        const variantId = formData.get("variantId");
        const userId = formData.get("userId") || `user_${Date.now()}`;
        
        const metrics = await manager.trackImpression(testId, variantId, userId);
        return json({ success: true, metrics });
      }

      case "track_conversion": {
        const testId = formData.get("testId");
        const variantId = formData.get("variantId");
        const userId = formData.get("userId") || `user_${Date.now()}`;
        const revenue = parseFloat(formData.get("revenue")) || 0;
        
        const metrics = await manager.trackConversion(testId, variantId, userId, revenue);
        return json({ success: true, metrics });
      }

      case "generate_report": {
        const testId = formData.get("testId");
        const report = await manager.generateTestReport(testId);
        return json({ success: true, report });
      }

      default:
        return json({ error: "Unknown action" }, { status: 400 });
    }

  } catch (error) {
    console.error('A/B Testing action error:', error);
    return json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    );
  }
}

export default function ABTestingManagement() {
  const data = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testForm, setTestForm] = useState({
    name: '',
    description: '',
    testType: 'message_content',
    duration: '14',
    variantAName: 'Control',
    variantAConfig: '{"title": "Don\'t leave yet!", "message": "Get 10% off"}',
    variantBName: 'Test',
    variantBConfig: '{"title": "Wait! Special offer!", "message": "Get 15% off your order"}'
  });

  // Create test modal handlers
  const handleCreateTest = useCallback(() => {
    const formData = new FormData();
    formData.append("action", "create_test");
    formData.append("shopId", data.shopId);
    Object.entries(testForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    fetcher.submit(formData, { method: "post" });
    setShowCreateModal(false);
  }, [testForm, data.shopId, fetcher]);

  const handleStartTest = useCallback((testId) => {
    const formData = new FormData();
    formData.append("action", "start_test");
    formData.append("testId", testId);
    formData.append("shopId", data.shopId);

    fetcher.submit(formData, { method: "post" });
  }, [data.shopId, fetcher]);

  // Format test data for table
  const testRows = data.tests.map(test => [
    test.name,
    <Badge status={
      test.status === 'active' ? 'success' :
      test.status === 'completed' ? 'info' :
      test.status === 'paused' ? 'warning' : 'attention'
    }>
      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
    </Badge>,
    test.testType.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    test.variants.length,
    test.variants.reduce((sum, v) => sum + v.metrics.impressions, 0),
    `${(test.variants.reduce((sum, v) => sum + v.metrics.conversions, 0) / 
        Math.max(test.variants.reduce((sum, v) => sum + v.metrics.impressions, 0), 1) * 100).toFixed(1)}%`,
    <InlineStack gap="200">
      {test.status === 'draft' && (
        <Button size="slim" onClick={() => handleStartTest(test.id)}>
          Start
        </Button>
      )}
      <Button size="slim" onClick={() => setSelectedTest(test)}>
        View Details
      </Button>
    </InlineStack>
  ]);

  return (
    <Page
      title="A/B Testing"
      subtitle="Split test popup designs and messages to optimize conversions"
      primaryAction={{
        content: "Create Test",
        onAction: () => setShowCreateModal(true)
      }}
    >
      <Layout>
        {actionData?.error && (
          <Layout.Section>
            <Banner status="critical">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        )}

        {actionData?.success && (
          <Layout.Section>
            <Banner status="success">
              <p>Action completed successfully!</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Active Tests Overview */}
        <Layout.Section>
          <Card title="Test Overview">
            <BlockStack gap="400">
              <InlineStack gap="800" distribution="equalSpacing">
                <div>
                  <Text variant="headingMd">Active Tests</Text>
                  <Text variant="headingLg">
                    {data.tests.filter(t => t.status === 'active').length}
                  </Text>
                </div>
                <div>
                  <Text variant="headingMd">Completed Tests</Text>
                  <Text variant="headingLg">
                    {data.tests.filter(t => t.status === 'completed').length}
                  </Text>
                </div>
                <div>
                  <Text variant="headingMd">Total Impressions</Text>
                  <Text variant="headingLg">
                    {data.tests.reduce((sum, test) => 
                      sum + test.variants.reduce((vSum, v) => vSum + v.metrics.impressions, 0), 0
                    ).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text variant="headingMd">Total Conversions</Text>
                  <Text variant="headingLg">
                    {data.tests.reduce((sum, test) => 
                      sum + test.variants.reduce((vSum, v) => vSum + v.metrics.conversions, 0), 0
                    ).toLocaleString()}
                  </Text>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Tests Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">All Tests</Text>
              {data.tests.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'text', 'text']}
                  headings={['Name', 'Status', 'Type', 'Variants', 'Impressions', 'Conv. Rate', 'Actions']}
                  rows={testRows}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text variant="headingMd">No tests created yet</Text>
                  <Text>Create your first A/B test to start optimizing your popups</Text>
                </div>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Create Test Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create A/B Test"
        primaryAction={{
          content: "Create Test",
          onAction: handleCreateTest
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowCreateModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Test Name"
              value={testForm.name}
              onChange={(value) => setTestForm({...testForm, name: value})}
              placeholder="e.g., Holiday Message Test"
            />
            
            <TextField
              label="Description"
              value={testForm.description}
              onChange={(value) => setTestForm({...testForm, description: value})}
              multiline={3}
              placeholder="Describe what you're testing and why"
            />

            <Select
              label="Test Type"
              options={data.testTypes}
              value={testForm.testType}
              onChange={(value) => setTestForm({...testForm, testType: value})}
            />

            <TextField
              label="Duration (days)"
              type="number"
              value={testForm.duration}
              onChange={(value) => setTestForm({...testForm, duration: value})}
              min="1"
              max="90"
            />

            <Divider />

            <Text variant="headingMd">Variant A (Control)</Text>
            <TextField
              label="Name"
              value={testForm.variantAName}
              onChange={(value) => setTestForm({...testForm, variantAName: value})}
            />
            <TextField
              label="Configuration (JSON)"
              value={testForm.variantAConfig}
              onChange={(value) => setTestForm({...testForm, variantAConfig: value})}
              multiline={3}
              helpText="JSON configuration for this variant"
            />

            <Text variant="headingMd">Variant B (Test)</Text>
            <TextField
              label="Name"
              value={testForm.variantBName}
              onChange={(value) => setTestForm({...testForm, variantBName: value})}
            />
            <TextField
              label="Configuration (JSON)"
              value={testForm.variantBConfig}
              onChange={(value) => setTestForm({...testForm, variantBConfig: value})}
              multiline={3}
              helpText="JSON configuration for this variant"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Test Details Modal */}
      {selectedTest && (
        <Modal
          open={!!selectedTest}
          onClose={() => setSelectedTest(null)}
          title={`Test Details: ${selectedTest.name}`}
          large
        >
          <Modal.Section>
            <BlockStack gap="400">
              <InlineStack gap="400" distribution="equalSpacing">
                <div>
                  <Text variant="headingMd">Status</Text>
                  <Badge status={
                    selectedTest.status === 'active' ? 'success' :
                    selectedTest.status === 'completed' ? 'info' : 'attention'
                  }>
                    {selectedTest.status.charAt(0).toUpperCase() + selectedTest.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Text variant="headingMd">Type</Text>
                  <Text>{selectedTest.testType.replace('_', ' ')}</Text>
                </div>
                <div>
                  <Text variant="headingMd">Duration</Text>
                  <Text>{selectedTest.settings.duration} days</Text>
                </div>
              </InlineStack>

              <Divider />

              <Text variant="headingMd">Variants Performance</Text>
              {selectedTest.variants.map((variant, index) => {
                const conversionRate = variant.metrics.impressions > 0 
                  ? (variant.metrics.conversions / variant.metrics.impressions) * 100 
                  : 0;
                
                return (
                  <Card key={variant.id} sectioned>
                    <BlockStack gap="300">
                      <InlineStack distribution="spaceBetween">
                        <Text variant="headingMd">{variant.name}</Text>
                        <Text>Traffic: {variant.trafficPercentage}%</Text>
                      </InlineStack>
                      
                      <InlineStack gap="400" distribution="equalSpacing">
                        <div>
                          <Text variant="bodyMd">Impressions</Text>
                          <Text variant="headingLg">{variant.metrics.impressions.toLocaleString()}</Text>
                        </div>
                        <div>
                          <Text variant="bodyMd">Conversions</Text>
                          <Text variant="headingLg">{variant.metrics.conversions.toLocaleString()}</Text>
                        </div>
                        <div>
                          <Text variant="bodyMd">Conv. Rate</Text>
                          <Text variant="headingLg">{conversionRate.toFixed(2)}%</Text>
                        </div>
                        <div>
                          <Text variant="bodyMd">Revenue</Text>
                          <Text variant="headingLg">${variant.metrics.revenue.toFixed(2)}</Text>
                        </div>
                      </InlineStack>

                      <ProgressBar 
                        progress={Math.min((variant.metrics.impressions / 1000) * 100, 100)} 
                        size="small"
                      />
                      <Text variant="caption">
                        {variant.metrics.impressions} / 1000 minimum sample size
                      </Text>
                    </BlockStack>
                  </Card>
                );
              })}

              {selectedTest.results.isSignificant && (
                <Card sectioned>
                  <BlockStack gap="300">
                    <Text variant="headingMd">Results</Text>
                    <Text>
                      Winner: {selectedTest.results.winner} with {selectedTest.results.lift.toFixed(1)}% lift
                    </Text>
                    <Text>
                      Confidence: {(selectedTest.results.confidence * 100).toFixed(1)}%
                    </Text>
                  </BlockStack>
                </Card>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
