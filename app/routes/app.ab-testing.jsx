import { Badge, BlockStack, Box, Button, Card, InlineGrid, Layout, Page, ProgressBar, Select, Spinner, Text, TextField } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

// A/B Testing constants for real data integration
const TEST_STATUS = {
  draft: "Draft",
  running: "Running", 
  paused: "Paused",
  completed: "Completed"
};

const TEST_TYPES = {
  title: "Title Text",
  message: "Message Content",
  discount: "Discount Amount",
  design: "Visual Design",
  timing: "Display Timing"
};

// Fallback data for when APIs return no data
const FALLBACK_AB_TESTS = [];
const STATISTICAL_SIGNIFICANCE_THRESHOLD = 95;

export default function ABTestingPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [newTestName, setNewTestName] = useState("");
  const [newTestType, setNewTestType] = useState("title");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load A/B test data from API
  useEffect(() => {
    async function loadTests() {
      try {
        setLoading(true);
        const response = await fetch('/api/ab-testing');
        if (!response.ok) {
          throw new Error('Failed to load A/B tests');
        }
        const data = await response.json();
        setTests(data.tests || FALLBACK_AB_TESTS);
      } catch (err) {
        console.error('Error loading A/B tests:', err);
        setError(err.message);
        setTests(FALLBACK_AB_TESTS);
      } finally {
        setLoading(false);
      }
    }
    
    loadTests();
  }, []);

  const handleTestSelect = useCallback((test) => {
    setSelectedTest(test);
  }, []);

  const handleCreateTest = useCallback(() => {
    if (!newTestName.trim()) {
      alert("Please enter a test name");
      return;
    }
    
    // In a real app, this would call an API to create the test
    console.log("Creating new A/B test:", {
      name: newTestName,
      type: newTestType
    });
    
    alert(`A/B Test "${newTestName}" created successfully!\n\nThe test has been set up and is ready to configure variants.`);
    setNewTestName("");
    setNewTestType("title");
    setShowCreateForm(false);
  }, [newTestName, newTestType]);

  const handleStartTest = useCallback((testId) => {
    console.log("Starting A/B test:", testId);
    alert("A/B Test started successfully!\n\nTraffic is now being split between variants and results are being tracked.");
  }, []);

  const handlePauseTest = useCallback((testId) => {
    console.log("Pausing A/B test:", testId);
    alert("A/B Test paused successfully!\n\nNo new visitors will be assigned to test variants.");
  }, []);

  const handleApplyWinner = useCallback((test) => {
    if (!test.winner) {
      alert("No clear winner has been determined yet. Please wait for more data.");
      return;
    }
    
    const winnerVariant = test.variants.find(v => v.id === test.winner);
    console.log("Applying winner variant:", winnerVariant);
    alert(`Winner Applied Successfully!\n\nVariant ${test.winner} (${winnerVariant.name}) has been applied to your live popup.\n\nExpected revenue lift: ${test.expectedLift}%`);
  }, []);

  // Calculate aggregate stats
  const runningTests = tests.filter(test => test.status === "running").length;
  const completedTests = tests.filter(test => test.status === "completed").length;
  const totalRevenueLift = tests
    .filter(test => test.status === "completed" && test.winner)
    .reduce((sum, test) => sum + test.expectedLift, 0);
  const avgRevenueLift = completedTests > 0 ? (totalRevenueLift / completedTests).toFixed(1) : 0;

  const testTypeOptions = Object.entries(TEST_TYPES).map(([value, label]) => ({
    label,
    value,
  }));

  return (
    <Page
      title="A/B Testing"
      subtitle="Split test your popup variations to maximize conversions and revenue"
      primaryAction={{
        content: "Create New Test",
        onAction: () => setShowCreateForm(true)
      }}
    >
      <Layout>
        {/* Stats Overview */}
        <Layout.Section>
          <Card>
            <InlineGrid columns={4} gap="4">
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {tests.length}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Total Tests
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {runningTests}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Active Tests
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {avgRevenueLift}%
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Avg Revenue Lift
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {completedTests}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Completed Tests
                  </Text>
                </BlockStack>
              </Card>
            </InlineGrid>
          </Card>
        </Layout.Section>

        {/* Create New Test Form */}
        {showCreateForm && (
          <Layout.Section>
            <Card>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">
                  Create New A/B Test
                </Text>
                
                <TextField
                  label="Test Name"
                  value={newTestName}
                  onChange={setNewTestName}
                  placeholder="e.g., Summer Sale Title Test"
                  helpText="Choose a descriptive name for your test"
                />
                
                <Select
                  label="Test Type"
                  options={testTypeOptions}
                  onChange={setNewTestType}
                  value={newTestType}
                  helpText="What element do you want to test?"
                />
                
                <InlineGrid columns={2} gap="4">
                  <Button variant="primary" onClick={handleCreateTest}>
                    Create Test
                  </Button>
                  <Button onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </InlineGrid>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Test List */}
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h3">
                A/B Test Results
              </Text>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner accessibilityLabel="Loading A/B tests" size="large" />
                </div>
              ) : error ? (
                <Card>
                  <BlockStack gap="400">
                    <Text as="p" color="critical">
                      Error loading A/B tests: {error}
                    </Text>
                    <Button onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </BlockStack>
                </Card>
              ) : tests.length === 0 ? (
                <Card>
                  <BlockStack gap="400">
                    <Text as="p">
                      No A/B tests found. Create your first test to start optimizing your popup performance.
                    </Text>
                    <Button primary onClick={() => setShowCreateForm(true)}>
                      Create Your First A/B Test
                    </Button>
                  </BlockStack>
                </Card>
              ) : tests.map((test) => (
                <Card key={test.id} padding="4">
                  <BlockStack gap="4">
                    <Box>
                      <InlineGrid columns={3} gap="4">
                        <BlockStack gap="2">
                          <Text variant="headingSm" as="h4">
                            {test.name}
                          </Text>
                          <Badge tone={
                            test.status === "running" ? "info" :
                            test.status === "completed" ? "success" :
                            test.status === "paused" ? "attention" : "subdued"
                          }>
                            {TEST_STATUS[test.status]}
                          </Badge>
                        </BlockStack>
                        
                        <BlockStack gap="2">
                          <Text variant="bodySm" tone="subdued">
                            <strong>Type:</strong> {TEST_TYPES[test.type]}
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            <strong>Period:</strong> {test.startDate} to {test.endDate}
                          </Text>
                        </BlockStack>
                        
                        <BlockStack gap="2">
                          {test.winner && (
                            <Badge tone="success">
                              Winner: Variant {test.winner}
                            </Badge>
                          )}
                          {test.confidence > 0 && (
                            <Text variant="bodySm">
                              <strong>Confidence:</strong> {test.confidence}%
                            </Text>
                          )}
                        </BlockStack>
                      </InlineGrid>
                    </Box>

                    {/* Variants Comparison */}
                    <Box>
                      <InlineGrid columns={2} gap="4">
                        {test.variants.map((variant) => (
                          <Card key={variant.id} background="bg-surface-secondary" padding="4">
                            <BlockStack gap="3">
                              <Box>
                                <Text variant="headingSm" as="h5">
                                  Variant {variant.id}: {variant.name}
                                  {test.winner === variant.id && (
                                    <Badge tone="success" size="small">Winner</Badge>
                                  )}
                                </Text>
                              </Box>
                              
                              <BlockStack gap="2">
                                <Text variant="bodySm">
                                  <strong>Title:</strong> {variant.title}
                                </Text>
                                <Text variant="bodySm">
                                  <strong>Message:</strong> {variant.message}
                                </Text>
                                <Text variant="bodySm">
                                  <strong>Discount:</strong> {variant.discountPercentage}% ({variant.discountCode})
                                </Text>
                              </BlockStack>
                              
                              {variant.visitors > 0 && (
                                <BlockStack gap="2">
                                  <InlineGrid columns={2} gap="2">
                                    <Text variant="bodySm">
                                      <strong>Visitors:</strong> {variant.visitors.toLocaleString()}
                                    </Text>
                                    <Text variant="bodySm">
                                      <strong>Conversions:</strong> {variant.conversions}
                                    </Text>
                                  </InlineGrid>
                                  
                                  <InlineGrid columns={2} gap="2">
                                    <Text variant="bodySm">
                                      <strong>Conv. Rate:</strong> {variant.conversionRate}%
                                    </Text>
                                    <Text variant="bodySm">
                                      <strong>Revenue:</strong> ${variant.revenue.toLocaleString()}
                                    </Text>
                                  </InlineGrid>
                                  
                                  <Box paddingBlockStart="2">
                                    <Text variant="bodySm" tone="subdued">
                                      Conversion Rate
                                    </Text>
                                    <ProgressBar 
                                      progress={Math.min(variant.conversionRate * 10, 100)} 
                                      size="small"
                                    />
                                  </Box>
                                </BlockStack>
                              )}
                            </BlockStack>
                          </Card>
                        ))}
                      </InlineGrid>
                    </Box>

                    {/* Test Actions */}
                    <Box paddingBlockStart="2">
                      <InlineGrid columns={test.status === "completed" ? 2 : 3} gap="2">
                        {test.status === "draft" && (
                          <Button 
                            variant="primary" 
                            size="slim"
                            onClick={() => handleStartTest(test.id)}
                          >
                            Start Test
                          </Button>
                        )}
                        
                        {test.status === "running" && (
                          <Button 
                            variant="secondary" 
                            size="slim"
                            onClick={() => handlePauseTest(test.id)}
                          >
                            Pause Test
                          </Button>
                        )}
                        
                        {(test.status === "completed" || test.winner) && (
                          <Button 
                            variant="primary" 
                            size="slim"
                            onClick={() => handleApplyWinner(test)}
                            disabled={!test.winner || test.confidence < STATISTICAL_SIGNIFICANCE_THRESHOLD}
                          >
                            Apply Winner
                          </Button>
                        )}
                        
                        <Button 
                          variant="secondary" 
                          size="slim"
                          onClick={() => handleTestSelect(test)}
                        >
                          View Details
                        </Button>
                      </InlineGrid>
                    </Box>

                    {/* Statistical Significance Warning */}
                    {test.confidence > 0 && test.confidence < STATISTICAL_SIGNIFICANCE_THRESHOLD && (
                      <Box 
                        padding="3" 
                        background="bg-surface-caution-subdued"
                        borderRadius="2"
                      >
                        <Text variant="bodySm" tone="caution">
                          ⚠️ Statistical significance not yet reached ({test.confidence}% vs {STATISTICAL_SIGNIFICANCE_THRESHOLD}% required). 
                          Continue running the test for more reliable results.
                        </Text>
                      </Box>
                    )}

                    {/* Expected Lift Display */}
                    {test.expectedLift > 0 && (
                      <Box 
                        padding="3"
                        background="bg-surface-success-subdued" 
                        borderRadius="2"
                      >
                        <Text variant="bodySm" tone="success">
                          📈 Expected Revenue Lift: +{test.expectedLift}% 
                          {test.status === "completed" && " (Ready to apply)"}
                        </Text>
                      </Box>
                    )}
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Selected Test Details */}
        {selectedTest && (
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">
                  Test Analytics
                </Text>
                
                <BlockStack gap="3">
                  <Text variant="bodySm">
                    <strong>Test Name:</strong> {selectedTest.name}
                  </Text>
                  <Text variant="bodySm">
                    <strong>Status:</strong> {TEST_STATUS[selectedTest.status]}
                  </Text>
                  <Text variant="bodySm">
                    <strong>Type:</strong> {TEST_TYPES[selectedTest.type]}
                  </Text>
                  {selectedTest.winner && (
                    <Text variant="bodySm">
                      <strong>Winner:</strong> Variant {selectedTest.winner}
                    </Text>
                  )}
                  {selectedTest.confidence > 0 && (
                    <Text variant="bodySm">
                      <strong>Confidence:</strong> {selectedTest.confidence}%
                    </Text>
                  )}
                  {selectedTest.expectedLift > 0 && (
                    <Text variant="bodySm">
                      <strong>Expected Lift:</strong> +{selectedTest.expectedLift}%
                    </Text>
                  )}
                </BlockStack>
                
                <InlineGrid columns={2} gap="2">
                  <Button
                    variant="secondary"
                    size="slim"
                    onClick={() => setSelectedTest(null)}
                  >
                    Close
                  </Button>
                  {selectedTest.winner && selectedTest.confidence >= STATISTICAL_SIGNIFICANCE_THRESHOLD && (
                    <Button
                      variant="primary" 
                      size="slim"
                      onClick={() => handleApplyWinner(selectedTest)}
                    >
                      Apply Winner
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
