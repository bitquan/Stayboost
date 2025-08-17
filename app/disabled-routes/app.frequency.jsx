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
    FormLayout,
    InlineStack,
    Layout,
    Modal,
    Page,
    RangeSlider,
    Tabs,
    Text,
    TextField
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";

/**
 * Popup Frequency Controls Management
 * Priority #20 - Advanced timing controls to prevent popup fatigue
 */

// Dynamic import for server-side frequency functions
async function getFrequencyModule() {
  const module = await import("../utils/frequencyControls.server.js");
  return module;
}

export async function loader({ request }) {
  await authenticate.admin(request);

  try {
    const { 
      createFrequencyManager, 
      FREQUENCY_TYPES, 
      FREQUENCY_RULES,
      USER_STATES,
      FREQUENCY_PRESETS
    } = await getFrequencyModule();
    
    const frequencyManager = createFrequencyManager();
    
    // Get frequency analytics
    const analytics = frequencyManager.getFrequencyAnalytics(7);
    
    // Get current settings
    const settings = frequencyManager.exportSettings();
    
    return json({
      analytics,
      settings,
      frequencyTypes: Object.values(FREQUENCY_TYPES),
      frequencyRules: Object.values(FREQUENCY_RULES),
      userStates: Object.values(USER_STATES),
      presets: Object.entries(FREQUENCY_PRESETS)
    });

  } catch (error) {
    console.error('Frequency controls loader error:', error);
    return json(
      { error: 'Failed to load frequency data' },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  await authenticate.admin(request);

  try {
    const { createFrequencyManager } = await getFrequencyModule();
    const formData = await request.formData();
    const action = formData.get("action");
    
    const frequencyManager = createFrequencyManager();

    switch (action) {
      case "update_global_settings": {
        const settings = {
          maxPerDay: parseInt(formData.get("maxPerDay")),
          maxPerSession: parseInt(formData.get("maxPerSession")),
          defaultCooldown: parseInt(formData.get("defaultCooldown")),
          adaptiveLearning: formData.get("adaptiveLearning") === 'true'
        };
        
        const newManager = createFrequencyManager(settings);
        
        return json({ 
          success: true, 
          message: "Global frequency settings updated",
          settings 
        });
      }

      case "apply_preset": {
        const presetName = formData.get("preset");
        // In production, this would apply the preset settings
        
        return json({ 
          success: true, 
          message: `Applied ${presetName} frequency preset` 
        });
      }

      case "set_popup_rules": {
        const popupId = formData.get("popupId");
        const rule = formData.get("rule");
        const value = formData.get("value");
        
        frequencyManager.setFrequencyRule(popupId, rule, parseInt(value));
        
        return json({ 
          success: true, 
          message: `Frequency rule updated for popup ${popupId}` 
        });
      }

      case "reset_user_frequency": {
        const userId = formData.get("userId");
        const popupId = formData.get("popupId") || null;
        
        frequencyManager.resetUserFrequency(userId, popupId);
        
        return json({ 
          success: true, 
          message: `Frequency data reset for user ${userId}` 
        });
      }

      case "test_frequency": {
        const userId = formData.get("userId");
        const popupId = formData.get("popupId");
        const sessionId = formData.get("sessionId");
        
        const result = frequencyManager.canShowPopup(userId, popupId, sessionId);
        
        return json({ 
          success: true, 
          testResult: result 
        });
      }

      default:
        return json({ error: "Unknown action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Frequency controls action error:', error);
    return json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    );
  }
}

export default function FrequencyControls() {
  const data = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();

  const [selectedTab, setSelectedTab] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [maxPerDay, setMaxPerDay] = useState(3);
  const [maxPerSession, setMaxPerSession] = useState(2);
  const [cooldownHours, setCooldownHours] = useState(4);
  const [adaptiveLearning, setAdaptiveLearning] = useState(true);

  // Handle settings update
  const handleUpdateSettings = useCallback(() => {
    const formData = new FormData();
    formData.append("action", "update_global_settings");
    formData.append("maxPerDay", maxPerDay.toString());
    formData.append("maxPerSession", maxPerSession.toString());
    formData.append("defaultCooldown", (cooldownHours * 60 * 60 * 1000).toString());
    formData.append("adaptiveLearning", adaptiveLearning.toString());
    
    fetcher.submit(formData, { method: "post" });
    setShowSettingsModal(false);
  }, [fetcher, maxPerDay, maxPerSession, cooldownHours, adaptiveLearning]);

  // Handle preset application
  const handleApplyPreset = useCallback((presetName) => {
    const formData = new FormData();
    formData.append("action", "apply_preset");
    formData.append("preset", presetName);
    
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  // Prepare frequency distribution data
  const distributionRows = Object.entries(data.analytics.frequencyDistribution || {}).map(([bucket, count]) => [
    bucket,
    count,
    <div key={bucket} style={{ width: '100px', height: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px' }}>
      <div style={{ 
        width: `${(count / Math.max(...Object.values(data.analytics.frequencyDistribution))) * 100}%`, 
        height: '100%', 
        backgroundColor: '#008060', 
        borderRadius: '10px' 
      }} />
    </div>
  ]);

  // Prepare user behavior stats
  const behaviorRows = Object.entries(data.analytics.userBehaviorStats || {}).map(([state, count]) => [
    state.replace('_', ' ').toUpperCase(),
    count,
    <Badge key={state} status={count > 10 ? "warning" : "info"}>
      {((count / data.analytics.uniqueUsers) * 100).toFixed(1)}%
    </Badge>
  ]);

  const tabs = [
    {
      id: 'overview',
      content: 'Overview',
      panel: (
        <BlockStack gap="400">
          {/* Key Metrics */}
          <InlineStack gap="400" distribution="fillEvenly">
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">{data.analytics.totalPopupsShown}</Text>
                <Text variant="bodyMd">Total Popups Shown</Text>
                <Text variant="bodySm" color="subdued">Last 7 days</Text>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">{data.analytics.uniqueUsers}</Text>
                <Text variant="bodyMd">Unique Users</Text>
                <Text variant="bodySm" color="subdued">With frequency data</Text>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">
                  {data.analytics.totalPopupsShown > 0 ? 
                    (data.analytics.totalPopupsShown / data.analytics.uniqueUsers).toFixed(1) : '0'}
                </Text>
                <Text variant="bodyMd">Avg per User</Text>
                <Text variant="bodySm" color="subdued">Frequency ratio</Text>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">{data.settings.options.maxPerDay || 3}</Text>
                <Text variant="bodyMd">Max per Day</Text>
                <Text variant="bodySm" color="subdued">Current limit</Text>
              </div>
            </Card>
          </InlineStack>

          {/* Quick Actions */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Quick Actions</Text>
              <InlineStack gap="200">
                <Button primary onClick={() => setShowSettingsModal(true)}>
                  Update Settings
                </Button>
                <Button onClick={() => setShowTestModal(true)}>
                  Test Frequency
                </Button>
                <Button variant="secondary">Export Analytics</Button>
                <Button variant="secondary">Reset All Data</Button>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Current Settings Summary */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Current Frequency Settings</Text>
              <InlineStack gap="400" distribution="equalSpacing">
                <div>
                  <Text variant="bodyMd">Max per Day</Text>
                  <Text variant="headingMd">{data.settings.options.maxPerDay || 3}</Text>
                </div>
                <div>
                  <Text variant="bodyMd">Max per Session</Text>
                  <Text variant="headingMd">{data.settings.options.maxPerSession || 2}</Text>
                </div>
                <div>
                  <Text variant="bodyMd">Cooldown Period</Text>
                  <Text variant="headingMd">
                    {Math.round((data.settings.options.defaultCooldown || 3600000) / (60 * 60 * 1000))}h
                  </Text>
                </div>
                <div>
                  <Text variant="bodyMd">Adaptive Learning</Text>
                  <Badge status={data.settings.options.adaptiveLearning ? "success" : "subdued"}>
                    {data.settings.options.adaptiveLearning ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      )
    },
    {
      id: 'analytics',
      content: 'Analytics',
      panel: (
        <BlockStack gap="400">
          {/* Frequency Distribution */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Frequency Distribution</Text>
              <Text variant="bodyMd">
                How often users see popups (last 7 days)
              </Text>
              
              {distributionRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'numeric', 'text']}
                  headings={['Frequency Range', 'User Count', 'Distribution']}
                  rows={distributionRows}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text variant="headingMd">No frequency data available</Text>
                  <Text>Data will appear once users interact with popups</Text>
                </div>
              )}
            </BlockStack>
          </Card>

          {/* User Behavior Analysis */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">User Behavior Analysis</Text>
              <Text variant="bodyMd">
                Classification of users based on their popup interactions
              </Text>
              
              {behaviorRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'numeric', 'text']}
                  headings={['Behavior Type', 'User Count', 'Percentage']}
                  rows={behaviorRows}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text variant="headingMd">No behavior data available</Text>
                  <Text>User behavior patterns will be analyzed over time</Text>
                </div>
              )}
            </BlockStack>
          </Card>

          {/* Optimization Insights */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Optimization Insights</Text>
              <div style={{ backgroundColor: '#f6f6f7', padding: '16px', borderRadius: '8px' }}>
                <Text variant="bodyMd">
                  🎯 <strong>Recommended Settings:</strong>
                </Text>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Max per day: {data.analytics.optimalFrequencyInsights?.recommendedMaxPerDay || 3}</li>
                  <li>Cooldown: {Math.round((data.analytics.optimalFrequencyInsights?.recommendedCooldown || 3600000) / (60 * 60 * 1000))} hours</li>
                  <li>Enable adaptive learning for better user experience</li>
                </ul>
              </div>
              
              {data.analytics.optimalFrequencyInsights?.suggestedImprovements && (
                <div>
                  <Text variant="bodyMd">💡 <strong>Suggestions:</strong></Text>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    {data.analytics.optimalFrequencyInsights.suggestedImprovements.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      )
    },
    {
      id: 'presets',
      content: 'Presets',
      panel: (
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Frequency Presets</Text>
              <Text variant="bodyMd">
                Choose from predefined frequency configurations based on your store's needs.
              </Text>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {data.presets.map(([presetName, preset]) => (
                  <div key={presetName} style={{ 
                    border: '1px solid #e1e3e5', 
                    borderRadius: '8px', 
                    padding: '20px',
                    backgroundColor: '#fafbfb'
                  }}>
                    <Text variant="headingMd">{presetName.charAt(0) + presetName.slice(1).toLowerCase()}</Text>
                    <div style={{ margin: '12px 0' }}>
                      <Text variant="bodyMd">Max per day: {preset.maxPerDay}</Text>
                      <br />
                      <Text variant="bodyMd">Max per session: {preset.maxPerSession}</Text>
                      <br />
                      <Text variant="bodyMd">
                        Cooldown: {Math.round(preset.defaultCooldown / (60 * 60 * 1000))} hours
                      </Text>
                      <br />
                      <Text variant="bodySm" color="subdued">
                        Adaptive learning: {preset.adaptiveLearning ? 'Enabled' : 'Disabled'}
                      </Text>
                    </div>
                    <Button size="slim" onClick={() => handleApplyPreset(presetName)}>
                      Apply Preset
                    </Button>
                  </div>
                ))}
              </div>
            </BlockStack>
          </Card>

          {/* Custom Configuration */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Custom Configuration</Text>
              <Text variant="bodyMd">
                Create your own frequency settings tailored to your specific needs.
              </Text>
              <Button onClick={() => setShowSettingsModal(true)}>
                Create Custom Settings
              </Button>
            </BlockStack>
          </Card>
        </BlockStack>
      )
    }
  ];

  return (
    <Page
      title="Frequency Controls"
      subtitle="Manage popup timing and prevent user fatigue with smart frequency controls"
    >
      <Layout>
        {actionData?.error && (
          <Layout.Section>
            <Banner status="critical">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        )}

        {actionData?.success && actionData.message && (
          <Layout.Section>
            <Banner status="success">
              <p>{actionData.message}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
            <div style={{ marginTop: '20px' }}>
              {tabs[selectedTab].panel}
            </div>
          </Tabs>
        </Layout.Section>
      </Layout>

      {/* Settings Modal */}
      <Modal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Frequency Settings"
        primaryAction={{
          content: "Update Settings",
          onAction: handleUpdateSettings
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowSettingsModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <div>
              <Text variant="headingMd">Daily Limits</Text>
              <RangeSlider
                label={`Maximum popups per day: ${maxPerDay}`}
                value={maxPerDay}
                onChange={setMaxPerDay}
                output
                min={1}
                max={10}
              />
            </div>

            <div>
              <Text variant="headingMd">Session Limits</Text>
              <RangeSlider
                label={`Maximum popups per session: ${maxPerSession}`}
                value={maxPerSession}
                onChange={setMaxPerSession}
                output
                min={1}
                max={5}
              />
            </div>

            <div>
              <Text variant="headingMd">Cooldown Period</Text>
              <RangeSlider
                label={`Cooldown between popups: ${cooldownHours} hours`}
                value={cooldownHours}
                onChange={setCooldownHours}
                output
                min={1}
                max={24}
              />
            </div>

            <Checkbox
              label="Enable adaptive learning"
              checked={adaptiveLearning}
              onChange={setAdaptiveLearning}
              helpText="Automatically adjust frequency based on user behavior"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Test Modal */}
      <Modal
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Test Frequency Rules"
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="User ID" placeholder="test-user-123" />
            <TextField label="Popup ID" placeholder="popup-1" />
            <TextField label="Session ID" placeholder="session-abc" />
            <Button>Run Test</Button>
          </FormLayout>
          
          {actionData?.testResult && (
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
              <Text variant="headingMd">Test Results:</Text>
              <Text>Allowed: {actionData.testResult.allowed ? 'Yes' : 'No'}</Text>
              {actionData.testResult.reason && (
                <Text>Reason: {actionData.testResult.reason}</Text>
              )}
            </div>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
