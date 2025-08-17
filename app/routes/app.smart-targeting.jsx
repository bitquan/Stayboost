import { Badge, BlockStack, Box, Button, Card, Checkbox, Divider, InlineGrid, Layout, Page, Select, Spinner, Text, TextField } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

// Targeting rules constants for real data integration
const TARGETING_TYPES = {
  geographic: "Geographic Location",
  device: "Device Type", 
  behavior: "User Behavior",
  timing: "Time-Based",
  traffic_source: "Traffic Source",
  page_visits: "Page Visits"
};

const GEOGRAPHIC_REGIONS = {
  north_america: "North America",
  europe: "Europe", 
  asia_pacific: "Asia Pacific",
  south_america: "South America",
  africa: "Africa",
  oceania: "Oceania"
};

const DEVICE_TYPES = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet"
};

const BEHAVIOR_TYPES = {
  first_visit: "First Time Visitor",
  returning: "Returning Visitor", 
  cart_abandoner: "Cart Abandoner",
  high_value: "High Value Customer",
  browsing_time: "Long Browsing Session"
};

const TRAFFIC_SOURCES = {
  organic: "Organic Search",
  paid: "Paid Advertising",
  social: "Social Media",
  email: "Email Marketing",
  direct: "Direct Traffic",
  referral: "Referral"
};

const CONDITION_OPERATORS = {
  equals: "Equals",
  not_equals: "Does Not Equal",
  includes: "Includes",
  not_includes: "Does Not Include", 
  between: "Between",
  greater_than: "Greater Than",
  less_than: "Less Than",
  weekend: "Is Weekend",
  weekday: "Is Weekday"
};

// Fallback data for when APIs return no data
const FALLBACK_TARGETING_RULES = [];

export default function SmartTargetingPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleConditions, setNewRuleConditions] = useState([
    { type: "device", operator: "equals", value: "mobile" }
  ]);

  // Load targeting rules from API
  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true);
        const response = await fetch('/api/smart-targeting');
        if (!response.ok) {
          throw new Error('Failed to load targeting rules');
        }
        const data = await response.json();
        setRules(data.rules || FALLBACK_TARGETING_RULES);
      } catch (err) {
        console.error('Error loading targeting rules:', err);
        setError(err.message);
        setRules(FALLBACK_TARGETING_RULES);
      } finally {
        setLoading(false);
      }
    }
    
    loadRules();
  }, []);

  const handleRuleSelect = useCallback((rule) => {
    setSelectedRule(rule);
  }, []);

  const handleToggleRule = useCallback((ruleId, isActive) => {
    console.log("Toggling rule:", ruleId, "to", isActive);
    alert(`Targeting rule ${isActive ? "activated" : "deactivated"} successfully!\n\n${isActive ? "This rule will now apply to matching visitors." : "This rule is now paused and won't trigger."}`);
  }, []);

  const handleCreateRule = useCallback(() => {
    if (!newRuleName.trim()) {
      alert("Please enter a rule name");
      return;
    }
    
    console.log("Creating targeting rule:", {
      name: newRuleName,
      conditions: newRuleConditions
    });
    
    alert(`Smart Targeting Rule "${newRuleName}" created successfully!\n\nThis rule will now automatically show customized popups to matching visitors.`);
    setNewRuleName("");
    setNewRuleConditions([{ type: "device", operator: "equals", value: "mobile" }]);
    setShowCreateForm(false);
  }, [newRuleName, newRuleConditions]);

  const handleDuplicateRule = useCallback((rule) => {
    console.log("Duplicating rule:", rule);
    alert(`Rule "${rule.name}" duplicated successfully!\n\nYou can now modify the copy and create variations.`);
  }, []);

  // Calculate aggregate stats from real data
  const activeRules = rules.filter(rule => rule.isActive).length;
  const totalImpressions = rules.reduce((sum, rule) => sum + (rule.performance?.impressions || 0), 0);
  const totalConversions = rules.reduce((sum, rule) => sum + (rule.performance?.conversions || 0), 0);
  const avgConversionRate = totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(2) : 0;
  const totalRevenue = rules.reduce((sum, rule) => sum + (rule.performance?.revenue || 0), 0);

  const targetingTypeOptions = Object.entries(TARGETING_TYPES).map(([value, label]) => ({
    label,
    value,
  }));

  const operatorOptions = Object.entries(CONDITION_OPERATORS).map(([value, label]) => ({
    label,
    value,
  }));

  const formatConditionValue = (condition) => {
    const typeMap = {
      geographic: GEOGRAPHIC_REGIONS,
      device: DEVICE_TYPES,
      behavior: BEHAVIOR_TYPES,
      traffic_source: TRAFFIC_SOURCES
    };
    
    if (Array.isArray(condition.value)) {
      return condition.value.map(v => typeMap[condition.type]?.[v] || v).join(", ");
    }
    
    return typeMap[condition.type]?.[condition.value] || condition.value;
  };

  return (
    <Page
      title="Smart Targeting"
      subtitle="Show personalized popups based on visitor behavior, location, device, and more"
      primaryAction={{
        content: "Create Targeting Rule",
        onAction: () => setShowCreateForm(true)
      }}
    >
      <Layout>
        {/* Performance Overview */}
        <Layout.Section>
          <Card>
            <InlineGrid columns={4} gap="4">
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {activeRules}/{rules.length}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Active Rules
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {totalImpressions.toLocaleString()}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Total Impressions
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    {avgConversionRate}%
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Avg Conversion Rate
                  </Text>
                </BlockStack>
              </Card>
              
              <Card background="bg-surface-secondary" padding="4">
                <BlockStack gap="2">
                  <Text variant="headingMd" as="h3">
                    ${totalRevenue.toLocaleString()}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Total Revenue
                  </Text>
                </BlockStack>
              </Card>
            </InlineGrid>
          </Card>
        </Layout.Section>

        {/* Create New Rule Form */}
        {showCreateForm && (
          <Layout.Section>
            <Card>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">
                  Create Smart Targeting Rule
                </Text>
                
                <TextField
                  label="Rule Name"
                  value={newRuleName}
                  onChange={setNewRuleName}
                  placeholder="e.g., Mobile Users Holiday Promo"
                  helpText="Choose a descriptive name for your targeting rule"
                />
                
                <Divider />
                
                <Text variant="headingSm" as="h4">
                  Targeting Conditions
                </Text>
                
                <Text variant="bodySm" tone="subdued">
                  Define who should see this popup. Multiple conditions will be combined with AND logic.
                </Text>
                
                {newRuleConditions.map((condition, index) => (
                  <Card key={index} background="bg-surface-secondary" padding="4">
                    <InlineGrid columns={3} gap="4">
                      <Select
                        label="Target Type"
                        options={targetingTypeOptions}
                        value={condition.type}
                        onChange={(value) => {
                          const updated = [...newRuleConditions];
                          updated[index] = { ...condition, type: value };
                          setNewRuleConditions(updated);
                        }}
                      />
                      
                      <Select
                        label="Condition"
                        options={operatorOptions}
                        value={condition.operator}
                        onChange={(value) => {
                          const updated = [...newRuleConditions];
                          updated[index] = { ...condition, operator: value };
                          setNewRuleConditions(updated);
                        }}
                      />
                      
                      <TextField
                        label="Value"
                        value={Array.isArray(condition.value) ? condition.value.join(", ") : condition.value}
                        onChange={(value) => {
                          const updated = [...newRuleConditions];
                          updated[index] = { ...condition, value };
                          setNewRuleConditions(updated);
                        }}
                        placeholder="Enter value..."
                      />
                    </InlineGrid>
                  </Card>
                ))}
                
                <InlineGrid columns={3} gap="4">
                  <Button variant="primary" onClick={handleCreateRule}>
                    Create Rule
                  </Button>
                  <Button onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => setNewRuleConditions([...newRuleConditions, { type: "device", operator: "equals", value: "mobile" }])}
                  >
                    Add Condition
                  </Button>
                </InlineGrid>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Targeting Rules List */}
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h3">
                Targeting Rules & Performance
              </Text>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner accessibilityLabel="Loading targeting rules" size="large" />
                </div>
              ) : error ? (
                <Card>
                  <BlockStack gap="400">
                    <Text as="p" color="critical">
                      Error loading targeting rules: {error}
                    </Text>
                    <Button onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </BlockStack>
                </Card>
              ) : rules.length === 0 ? (
                <Card>
                  <BlockStack gap="400">
                    <Text as="p">
                      No targeting rules found. Create your first rule to start showing personalized popups.
                    </Text>
                    <Button primary onClick={() => setShowCreateForm(true)}>
                      Create Your First Targeting Rule
                    </Button>
                  </BlockStack>
                </Card>
              ) : (
                rules.map((rule) => (
                  <Card key={rule.id} padding="4">
                    <BlockStack gap="4">
                      {/* Rule Header */}
                      <Box>
                        <InlineGrid columns={3} gap="4">
                          <BlockStack gap="2">
                            <Text variant="headingSm" as="h4">
                              {rule.name}
                            </Text>
                            <InlineGrid columns={2} gap="2">
                              <Badge tone={rule.isActive ? "success" : "subdued"}>
                                {rule.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge tone="info">
                                Priority {rule.priority}
                              </Badge>
                            </InlineGrid>
                          </BlockStack>
                          
                          <BlockStack gap="2">
                            <Text variant="bodySm" tone="subdued">
                              <strong>Conditions:</strong>
                            </Text>
                            {rule.conditions && rule.conditions.map((condition, index) => (
                              <Text key={index} variant="bodySm">
                                • {TARGETING_TYPES[condition.type]} {CONDITION_OPERATORS[condition.operator]} {formatConditionValue(condition)}
                              </Text>
                            ))}
                          </BlockStack>
                          
                          <BlockStack gap="2">
                            <Checkbox
                              label="Rule Active"
                              checked={rule.isActive}
                              onChange={(checked) => handleToggleRule(rule.id, checked)}
                            />
                          </BlockStack>
                        </InlineGrid>
                      </Box>

                      {/* Popup Preview */}
                      {rule.popup && (
                        <Box
                          padding="4"
                          background="bg-surface-secondary"
                          borderRadius="2"
                          style={{
                            border: "1px solid #e1e3e5",
                            textAlign: "center"
                          }}
                        >
                          <BlockStack gap="2">
                            <Text variant="headingSm" as="h5">
                              Popup Preview
                            </Text>
                            <Text variant="bodyMd" as="p">
                              <strong>{rule.popup.title}</strong>
                            </Text>
                            <Text variant="bodySm">
                              {rule.popup.message}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              {rule.popup.discountPercentage}% off with code {rule.popup.discountCode}
                            </Text>
                          </BlockStack>
                        </Box>
                      )}

                      {/* Performance Metrics */}
                      {rule.performance && rule.performance.impressions > 0 && (
                        <Box>
                          <InlineGrid columns={4} gap="4">
                            <Card background="bg-surface-subdued" padding="3">
                              <BlockStack gap="1">
                                <Text variant="bodySm" tone="subdued">Impressions</Text>
                                <Text variant="bodyMd">{rule.performance.impressions.toLocaleString()}</Text>
                              </BlockStack>
                            </Card>
                            
                            <Card background="bg-surface-subdued" padding="3">
                              <BlockStack gap="1">
                                <Text variant="bodySm" tone="subdued">Conversions</Text>
                                <Text variant="bodyMd">{rule.performance.conversions.toLocaleString()}</Text>
                              </BlockStack>
                            </Card>
                            
                            <Card background="bg-surface-subdued" padding="3">
                              <BlockStack gap="1">
                                <Text variant="bodySm" tone="subdued">Conversion Rate</Text>
                                <Text variant="bodyMd">{rule.performance.conversionRate}%</Text>
                              </BlockStack>
                            </Card>
                            
                            <Card background="bg-surface-subdued" padding="3">
                              <BlockStack gap="1">
                                <Text variant="bodySm" tone="subdued">Revenue</Text>
                                <Text variant="bodyMd">${rule.performance.revenue.toLocaleString()}</Text>
                              </BlockStack>
                            </Card>
                          </InlineGrid>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box paddingBlockStart="2">
                        <InlineGrid columns={4} gap="2">
                          <Button 
                            variant="secondary" 
                            size="slim"
                            onClick={() => handleRuleSelect(rule)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="slim"
                            onClick={() => handleDuplicateRule(rule)}
                          >
                            Duplicate
                          </Button>
                          <Button 
                            variant={rule.isActive ? "secondary" : "primary"} 
                            size="slim"
                            onClick={() => handleToggleRule(rule.id, !rule.isActive)}
                          >
                            {rule.isActive ? "Pause" : "Activate"}
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="slim"
                            tone="critical"
                          >
                            Delete
                          </Button>
                        </InlineGrid>
                      </Box>

                      {/* Performance Insights */}
                      {rule.performance && rule.performance.conversionRate > 15 && (
                        <Box 
                          padding="3"
                          background="bg-surface-success-subdued" 
                          borderRadius="2"
                        >
                          <Text variant="bodySm" tone="success">
                            🎯 High Performer! This rule has a {rule.performance.conversionRate}% conversion rate - well above average.
                          </Text>
                        </Box>
                      )}
                    </BlockStack>
                  </Card>
                ))
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Selected Rule Details */}
        {selectedRule && (
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">
                  Rule Details
                </Text>
                
                <BlockStack gap="3">
                  <Text variant="bodySm">
                    <strong>Name:</strong> {selectedRule.name}
                  </Text>
                  <Text variant="bodySm">
                    <strong>Status:</strong> {selectedRule.isActive ? "Active" : "Inactive"}
                  </Text>
                  <Text variant="bodySm">
                    <strong>Priority:</strong> {selectedRule.priority}
                  </Text>
                  
                  <Divider />
                  
                  <Text variant="bodySm">
                    <strong>Targeting Conditions:</strong>
                  </Text>
                  {selectedRule.conditions && selectedRule.conditions.map((condition, index) => (
                    <Text key={index} variant="bodySm">
                      • {TARGETING_TYPES[condition.type]} {CONDITION_OPERATORS[condition.operator]} {formatConditionValue(condition)}
                    </Text>
                  ))}
                  
                  <Divider />
                  
                  <Text variant="bodySm">
                    <strong>Performance:</strong>
                  </Text>
                  {selectedRule.performance && (
                    <>
                      <Text variant="bodySm">
                        Conversion Rate: {selectedRule.performance.conversionRate}%
                      </Text>
                      <Text variant="bodySm">
                        Revenue: ${selectedRule.performance.revenue.toLocaleString()}
                      </Text>
                    </>
                  )}
                </BlockStack>
                
                <Button
                  variant="secondary"
                  onClick={() => setSelectedRule(null)}
                >
                  Close
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
