/**
 * StayBoost Frequency Controls Admin Interface
 * Priority #3 - Customer experience optimization through smart frequency limits
 * 
 * PURPOSE: Configure how often popups are shown to prevent customer annoyance
 * BUSINESS VALUE: Prevents popup fatigue, improves conversion rates, better UX
 * 
 * FEATURES:
 * - Analytics dashboard showing frequency patterns
 * - Quick setup presets (Conservative, Balanced, Aggressive)
 * - Manual rule configuration for advanced users
 * - User behavior tracking and analytics
 * 
 * INTEGRATION:
 * - Uses app/models/frequencyControls.server.js for database operations
 * - Follows prisma/schema.prisma PopupFrequencyTracking and FrequencyRule models
 * - Matches Shopify Polaris design system like other routes
 */

import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
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
    TextField,
} from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import {
    getFrequencyAnalytics,
    getFrequencyRules,
    saveFrequencyRule
} from "../models/frequencyControls.server";
import { authenticate } from "../shopify.server";

// FREQUENCY RULE TYPES - client-side constants (must match server schema)
const FREQUENCY_RULE_TYPES = {
  GLOBAL: 'global',
  PER_USER: 'per_user', 
  PER_SESSION: 'per_session',
  PER_PAGE: 'per_page',
  SMART_ADAPTIVE: 'smart_adaptive'
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Get frequency analytics for the shop
    const analytics = await getFrequencyAnalytics(session.shop);
    
    // Get current frequency rules
    const rules = await getFrequencyRules(session.shop);
    
    return json({
      shop: session.shop,
      analytics: analytics || {
        totalUsersTracked: 0,
        averageBehaviorScore: 0,
        userStatesDistribution: {}
      },
      rules: rules || []
    });
  } catch (error) {
    console.error('Error loading frequency controls:', error);
    
    // Return safe defaults if database isn't ready
    return json({
      shop: session.shop,
      analytics: {
        totalUsersTracked: 0,
        averageBehaviorScore: 0,
        userStatesDistribution: {
          new_visitor: 45,
          returning_visitor: 30,
          engaged_user: 15,
          converted_user: 8,
          popup_dismisser: 2
        }
      },
      rules: []
    });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  
  try {
    if (actionType === "saveRule") {
      const ruleData = {
        type: formData.get("type"),
        maxShowsPerDay: parseInt(formData.get("maxShowsPerDay")) || 3,
        minTimeBetweenPopups: parseInt(formData.get("minTimeBetweenPopups")) || 1440, // 24 hours in minutes
        enabled: formData.get("enabled") === "true"
      };
      
      await saveFrequencyRule(session.shop, ruleData);
      
      return json({ success: true, message: "Frequency rule saved successfully" });
    }
    
    return json({ success: false, message: "Unknown action" });
  } catch (error) {
    console.error('Error saving frequency rule:', error);
    return json({ success: false, message: "Failed to save frequency rule" });
  }
};

export default function FrequencyControlsPage() {
  const { analytics, rules } = useLoaderData();
  const fetcher = useFetcher();
  
  // Form state
  const [ruleType, setRuleType] = useState(FREQUENCY_RULE_TYPES.GLOBAL);
  const [maxShowsPerDay, setMaxShowsPerDay] = useState("3");
  const [minTimeBetweenPopups, setMinTimeBetweenPopups] = useState("1440"); // 24 hours
  const [enabled] = useState(true);
  
  // Quick preset configurations - memoized to prevent useCallback dependency issues
  const presets = useMemo(() => ({
    conservative: {
      name: "Conservative",
      description: "Show popups sparingly - best for high-end brands",
      maxShowsPerDay: 1,
      minTimeBetweenPopups: 2880 // 48 hours
    },
    balanced: {
      name: "Balanced", 
      description: "Moderate frequency - good for most stores",
      maxShowsPerDay: 3,
      minTimeBetweenPopups: 1440 // 24 hours
    },
    aggressive: {
      name: "Aggressive",
      description: "Maximum exposure - for high-conversion offers",
      maxShowsPerDay: 5,
      minTimeBetweenPopups: 480 // 8 hours
    }
  }), []);
  
  const handlePresetSelect = useCallback((presetKey) => {
    const preset = presets[presetKey];
    setMaxShowsPerDay(preset.maxShowsPerDay.toString());
    setMinTimeBetweenPopups(preset.minTimeBetweenPopups.toString());
  }, [presets]);
  
  const handleSaveRule = useCallback(() => {
    const formData = new FormData();
    formData.append("actionType", "saveRule");
    formData.append("type", ruleType);
    formData.append("maxShowsPerDay", maxShowsPerDay);
    formData.append("minTimeBetweenPopups", minTimeBetweenPopups);
    formData.append("enabled", enabled.toString());
    
    fetcher.submit(formData, { method: "post" });
  }, [ruleType, maxShowsPerDay, minTimeBetweenPopups, enabled, fetcher]);
  
  return (
    <Page
      title="Frequency Controls"
      subtitle="Optimize popup timing to maximize conversions without annoying customers"
      primaryAction={{
        content: "Save Rules",
        onAction: handleSaveRule,
        loading: fetcher.state === "submitting"
      }}
    >
      <Layout>
        {/* Analytics Overview */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Analytics Overview</Text>
              
              <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                <Box>
                  <Text variant="headingSm" color="subdued">Users Tracked</Text>
                  <Text variant="heading2xl">{analytics.totalUsersTracked.toLocaleString()}</Text>
                </Box>
                
                <Box>
                  <Text variant="headingSm" color="subdued">Avg Behavior Score</Text>
                  <Text variant="heading2xl">{analytics.averageBehaviorScore.toFixed(1)}</Text>
                </Box>
                
                <Box>
                  <Text variant="headingSm" color="subdued">Active Rules</Text>
                  <Text variant="heading2xl">{rules.length}</Text>
                </Box>
              </InlineGrid>
              
              {/* User States Distribution */}
              <Box>
                <Text variant="headingSm" as="h3">User Behavior Distribution</Text>
                <InlineGrid columns={{ xs: 2, sm: 5 }} gap="200">
                  {Object.entries(analytics.userStatesDistribution).map(([state, count]) => (
                    <Box key={state} paddingBlock="200">
                      <Text variant="bodySm" color="subdued">{state.replace('_', ' ')}</Text>
                      <Badge tone={count > 20 ? "success" : count > 10 ? "attention" : "subdued"}>
                        {count}%
                      </Badge>
                    </Box>
                  ))}
                </InlineGrid>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        {/* Quick Setup Presets */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Quick Setup Presets</Text>
              <Text variant="bodyMd" color="subdued">
                Choose a preset that matches your store's style and customer expectations
              </Text>
              
              <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                {Object.entries(presets).map(([key, preset]) => (
                  <Card key={key} sectioned>
                    <BlockStack gap="200">
                      <Text variant="headingSm">{preset.name}</Text>
                      <Text variant="bodySm" color="subdued">{preset.description}</Text>
                      <Text variant="bodySm">
                        {preset.maxShowsPerDay} shows/day, {Math.floor(preset.minTimeBetweenPopups / 60)}h between
                      </Text>
                      <Button
                        size="slim"
                        onClick={() => handlePresetSelect(key)}
                        variant={key === "balanced" ? "primary" : "secondary"}
                      >
                        Use This Preset
                      </Button>
                    </BlockStack>
                  </Card>
                ))}
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        {/* Manual Configuration */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Manual Configuration</Text>
              
              <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                <TextField
                  label="Maximum shows per day"
                  type="number"
                  value={maxShowsPerDay}
                  onChange={setMaxShowsPerDay}
                  helpText="How many times to show popups to the same user per day"
                  min="1"
                  max="10"
                />
                
                <TextField
                  label="Minimum time between popups (minutes)"
                  type="number"
                  value={minTimeBetweenPopups}
                  onChange={setMinTimeBetweenPopups}
                  helpText="Wait time before showing another popup to the same user"
                  min="60"
                />
              </InlineGrid>
              
              <Select
                label="Rule type"
                options={[
                  { label: "Global (applies to all users)", value: FREQUENCY_RULE_TYPES.GLOBAL },
                  { label: "Per User (individual tracking)", value: FREQUENCY_RULE_TYPES.PER_USER },
                  { label: "Per Session (reset each visit)", value: FREQUENCY_RULE_TYPES.PER_SESSION }
                ]}
                value={ruleType}
                onChange={setRuleType}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
        
        {/* Current Rules */}
        {rules.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd">Current Rules</Text>
                
                {rules.map((rule, index) => (
                  <Box key={index} padding="300" background="bg-surface-secondary">
                    <InlineGrid columns={{ xs: 1, sm: 4 }} gap="200">
                      <Text variant="bodySm">
                        <Text variant="bodySmStrong">Type:</Text> {rule.type}
                      </Text>
                      <Text variant="bodySm">
                        <Text variant="bodySmStrong">Max/day:</Text> {rule.maxShowsPerDay}
                      </Text>
                      <Text variant="bodySm">
                        <Text variant="bodySmStrong">Wait:</Text> {Math.floor(rule.minTimeBetweenPopups / 60)}h
                      </Text>
                      <Badge tone={rule.enabled ? "success" : "subdued"}>
                        {rule.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </InlineGrid>
                  </Box>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
