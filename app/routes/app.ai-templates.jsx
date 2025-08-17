import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
    Badge,
    BlockStack,
    Box,
    Button,
    Card,
    FormLayout,
    Icon,
    InlineStack,
    Layout,
    Modal,
    Page,
    ProgressBar,
    Select,
    Text,
    TextField
} from "@shopify/polaris";
import { MagicIcon, MobileIcon, StarIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    // Fetch AI suggestions
    const suggestionsUrl = new URL('/api/ai-templates', new URL(request.url).origin);
    suggestionsUrl.searchParams.set('action', 'suggestions');
    
    const suggestionsResponse = await fetch(suggestionsUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });
    
    const suggestionsData = await suggestionsResponse.json();
    
    // Fetch industry templates
    const industryUrl = new URL('/api/ai-templates', new URL(request.url).origin);
    industryUrl.searchParams.set('action', 'industry-templates');
    
    const industryResponse = await fetch(industryUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });
    
    const industryData = await industryResponse.json();
    
    return json({
      suggestions: suggestionsData.suggestions || [],
      industryTemplates: industryData.templates || []
    });
    
  } catch (error) {
    console.error('Failed to load AI templates:', error);
    return json({
      suggestions: [],
      industryTemplates: []
    });
  }
};

const INDUSTRY_OPTIONS = [
  { label: "Fashion & Apparel", value: "fashion" },
  { label: "Technology & Electronics", value: "technology" },
  { label: "Food & Beverage", value: "food" },
  { label: "Health & Beauty", value: "beauty" },
  { label: "Home & Garden", value: "home" },
  { label: "Sports & Fitness", value: "sports" },
  { label: "Arts & Crafts", value: "arts" },
  { label: "Books & Education", value: "books" },
  { label: "Automotive", value: "automotive" },
  { label: "Other", value: "other" }
];

const GOAL_OPTIONS = [
  { label: "Increase Conversions", value: "conversion" },
  { label: "Capture Email Addresses", value: "email_capture" },
  { label: "Reduce Cart Abandonment", value: "cart_recovery" },
  { label: "Boost Customer Retention", value: "retention" },
  { label: "Promote New Products", value: "announcement" },
  { label: "Upsell & Cross-sell", value: "upsell" }
];

const STYLE_OPTIONS = [
  { label: "Minimal & Clean", value: "minimal" },
  { label: "Bold & Eye-catching", value: "bold" },
  { label: "Elegant & Professional", value: "elegant" },
  { label: "Playful & Fun", value: "playful" },
  { label: "Modern & Trendy", value: "modern" },
  { label: "Classic & Timeless", value: "classic" }
];

export default function AITemplates() {
  const { suggestions, industryTemplates } = useLoaderData();
  const navigate = useNavigate();
  
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // AI Generation Form State
  const [prompt, setPrompt] = useState("");
  const [industry, setIndustry] = useState("other");
  const [goal, setGoal] = useState("conversion");
  const [style, setStyle] = useState("modern");

  const handleGenerateTemplate = useCallback(async () => {
    if (!prompt.trim()) {
      shopify.toast.show('Please enter a description for your template', { isError: true });
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    
    // Simulate AI generation progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('action', 'generate');
      formData.append('prompt', prompt);
      formData.append('industry', industry);
      formData.append('goal', goal);
      formData.append('style', style);
      
      const response = await fetch('/api/ai-templates', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGenerationProgress(100);
        setTimeout(() => {
          shopify.toast.show('AI template generated successfully!');
          setShowGenerator(false);
          setGenerating(false);
          setGenerationProgress(0);
          // Navigate to templates page
          navigate('/app/templates');
        }, 500);
      } else {
        throw new Error(result.error || 'Failed to generate template');
      }
    } catch (error) {
      console.error('Generation error:', error);
      shopify.toast.show(error.message || 'Failed to generate template', { isError: true });
      setGenerating(false);
      setGenerationProgress(0);
      clearInterval(progressInterval);
    }
  }, [prompt, industry, goal, style, navigate]);

  const handleApplySuggestion = useCallback(async (suggestion) => {
    try {
      // Save the suggested template
      const formData = new FormData();
      formData.append('action', 'generate');
      formData.append('prompt', suggestion.title);
      formData.append('industry', 'ai_suggestion');
      formData.append('goal', suggestion.type);
      formData.append('style', 'optimized');
      
      const response = await fetch('/api/ai-templates', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        shopify.toast.show(`Applied suggestion: ${suggestion.title}`);
        navigate('/app/templates');
      } else {
        throw new Error(result.error || 'Failed to apply suggestion');
      }
    } catch (error) {
      console.error('Apply suggestion error:', error);
      shopify.toast.show('Failed to apply suggestion', { isError: true });
    }
  }, [navigate]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.8) return 'warning';
    return 'info';
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'performance_optimization': return StarIcon;
      case 'mobile_optimization': return MobileIcon;
      case 'industry_best_practice': return StarIcon;
      default: return MagicIcon;
    }
  };

  return (
    <Page
      title="AI Template Generation"
      subtitle="Let AI create optimized popup templates based on your store data and industry best practices"
      primaryAction={{
        content: "Generate New Template",
        onAction: () => setShowGenerator(true),
        icon: MagicIcon
      }}
    >
      <Layout>
        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    🎯 AI Recommendations
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    Based on your store data and performance patterns, here are AI-powered suggestions to improve your popups.
                  </Text>
                  
                  <BlockStack gap="300">
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} background="bg-surface-secondary">
                        <Box padding="400">
                          <BlockStack gap="300">
                            <InlineStack gap="300" align="space-between">
                              <InlineStack gap="200">
                                <Icon source={getSuggestionIcon(suggestion.type)} />
                                <Text variant="headingSm" as="h3">
                                  {suggestion.title}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack gap="200">
                                <Badge tone={getConfidenceColor(suggestion.confidence)}>
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </Badge>
                                <Badge tone="info">
                                  {suggestion.expectedLift} lift
                                </Badge>
                              </InlineStack>
                            </InlineStack>
                            
                            <Text variant="bodyMd">
                              {suggestion.description}
                            </Text>
                            
                            <Text variant="bodySm" tone="subdued">
                              💡 {suggestion.recommendation}
                            </Text>
                            
                            <InlineStack gap="200">
                              <Button
                                size="slim"
                                onClick={() => {
                                  setSelectedSuggestion(suggestion);
                                  setShowPreview(true);
                                }}
                              >
                                Preview
                              </Button>
                              <Button
                                variant="primary"
                                size="slim"
                                onClick={() => handleApplySuggestion(suggestion)}
                              >
                                Apply Suggestion
                              </Button>
                            </InlineStack>
                          </BlockStack>
                        </Box>
                      </Card>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Industry Templates */}
        {industryTemplates.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    🏭 Industry-Optimized Templates
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    High-performing templates specifically optimized for your industry.
                  </Text>
                  
                  <InlineStack gap="300" wrap>
                    {industryTemplates.slice(0, 6).map((template) => (
                      <Card key={template.id} background="bg-surface-secondary">
                        <Box padding="300" width="200px">
                          <BlockStack gap="200">
                            <Text variant="headingSm" as="h4">
                              {template.name}
                            </Text>
                            
                            <Text variant="bodySm" tone="subdued">
                              {template.description?.substring(0, 60)}...
                            </Text>
                            
                            <InlineStack gap="100">
                              <Icon source={StarIcon} tone="warning" />
                              <Text variant="bodySm">
                                {template.averageRating?.toFixed(1) || '0.0'}
                              </Text>
                            </InlineStack>
                            
                            <Button size="slim" fullWidth>
                              Use Template
                            </Button>
                          </BlockStack>
                        </Box>
                      </Card>
                    ))}
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* AI Features Overview */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  🤖 AI-Powered Features
                </Text>
                
                <InlineStack gap="400" wrap>
                  <Card background="bg-surface-secondary">
                    <Box padding="300" width="250px">
                      <BlockStack gap="200">
                        <Icon source={MagicIcon} />
                        <Text variant="headingSm">Smart Generation</Text>
                        <Text variant="bodySm">
                          AI analyzes your store and creates custom templates optimized for your industry and goals.
                        </Text>
                      </BlockStack>
                    </Box>
                  </Card>
                  
                  <Card background="bg-surface-secondary">
                    <Box padding="300" width="250px">
                      <BlockStack gap="200">
                        <Icon source={StarIcon} />
                        <Text variant="headingSm">Performance Optimization</Text>
                        <Text variant="bodySm">
                          Continuously learns from your data to suggest improvements and predict performance.
                        </Text>
                      </BlockStack>
                    </Box>
                  </Card>
                  
                  <Card background="bg-surface-secondary">
                    <Box padding="300" width="250px">
                      <BlockStack gap="200">
                        <Icon source={StarIcon} />
                        <Text variant="headingSm">Best Practices</Text>
                        <Text variant="bodySm">
                          Incorporates proven strategies from high-performing stores in your industry.
                        </Text>
                      </BlockStack>
                    </Box>
                  </Card>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>

      {/* AI Template Generator Modal */}
      {showGenerator && (
        <Modal
          open={showGenerator}
          onClose={() => setShowGenerator(false)}
          title="Generate AI Template"
          primaryAction={{
            content: generating ? 'Generating...' : 'Generate Template',
            onAction: handleGenerateTemplate,
            loading: generating
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowGenerator(false)
            }
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              {generating && (
                <Box>
                  <BlockStack gap="200">
                    <Text variant="bodyMd">
                      AI is generating your template... {Math.round(generationProgress)}%
                    </Text>
                    <ProgressBar progress={generationProgress} />
                  </BlockStack>
                </Box>
              )}
              
              <FormLayout>
                <TextField
                  label="Describe your ideal popup"
                  value={prompt}
                  onChange={setPrompt}
                  placeholder="e.g., Create a summer sale popup with urgency for fashion store"
                  helpText="Be as specific as possible for better AI results"
                  multiline={3}
                  disabled={generating}
                />
                
                <Select
                  label="Industry"
                  options={INDUSTRY_OPTIONS}
                  onChange={setIndustry}
                  value={industry}
                  disabled={generating}
                />
                
                <Select
                  label="Primary Goal"
                  options={GOAL_OPTIONS}
                  onChange={setGoal}
                  value={goal}
                  disabled={generating}
                />
                
                <Select
                  label="Design Style"
                  options={STYLE_OPTIONS}
                  onChange={setStyle}
                  value={style}
                  disabled={generating}
                />
              </FormLayout>
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}

      {/* Suggestion Preview Modal */}
      {showPreview && selectedSuggestion && (
        <Modal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title={selectedSuggestion.title}
          primaryAction={{
            content: 'Apply This Suggestion',
            onAction: () => {
              handleApplySuggestion(selectedSuggestion);
              setShowPreview(false);
            }
          }}
          secondaryActions={[
            {
              content: 'Close',
              onAction: () => setShowPreview(false)
            }
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text variant="bodyMd">
                {selectedSuggestion.description}
              </Text>
              
              <Box>
                <Text variant="bodySm" tone="subdued">
                  Expected Performance Improvement: {selectedSuggestion.expectedLift}
                </Text>
              </Box>
              
              <Box>
                <Text variant="bodySm" tone="subdued">
                  AI Confidence: {Math.round(selectedSuggestion.confidence * 100)}%
                </Text>
              </Box>
              
              {selectedSuggestion.template && (
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <Text variant="bodySm" tone="subdued">
                    Template Preview:
                  </Text>
                  <Text variant="headingSm">
                    {selectedSuggestion.template.title}
                  </Text>
                  <Text variant="bodyMd">
                    {selectedSuggestion.template.message}
                  </Text>
                </Box>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
