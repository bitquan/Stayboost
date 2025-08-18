// StayBoost Template API v2 Demo Interface
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    Checkbox,
    DataTable,
    Layout,
    Modal,
    Page,
    Select,
    SkeletonBodyText,
    SkeletonPage,
    Tabs,
    Text,
    TextField
} from '@shopify/polaris';
import { useEffect, useState } from 'react';
import { authenticate } from '../shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function TemplateAPIv2Demo() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [apiMetrics, setApiMetrics] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [bulkSelection, setBulkSelection] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadApiMetrics();
    loadCategories();
  }, []);

  const loadApiMetrics = async () => {
    try {
      const response = await fetch('/api/templates-v2?action=metrics');
      const data = await response.json();
      setApiMetrics(data.metrics);
    } catch (err) {
      setError('Failed to load API metrics');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/templates-v2?action=categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      setError('Failed to load categories');
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'search',
        q: searchQuery,
        sort: sortBy,
        limit: '20'
      });
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);
      if (minRating) params.append('minRating', minRating);
      
      const response = await fetch(`/api/templates-v2?${params}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (context = 'general') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/templates-v2?action=recommendations&context=${context}&limit=10`);
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (period = '30d') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/templates-v2?action=analytics&period=${period}`);
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const performBulkOperation = async (operation) => {
    if (bulkSelection.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/templates-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk',
          templateIds: bulkSelection,
          operation
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setBulkSelection([]);
        setShowBulkModal(false);
        // Refresh search results
        if (searchResults) performSearch();
      }
    } catch (err) {
      setError('Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'overview',
      content: 'API Overview',
      accessibilityLabel: 'API Overview',
      panelID: 'overview-panel'
    },
    {
      id: 'search',
      content: 'Enhanced Search',
      accessibilityLabel: 'Enhanced Search',
      panelID: 'search-panel'
    },
    {
      id: 'recommendations',
      content: 'AI Recommendations',
      accessibilityLabel: 'AI Recommendations',
      panelID: 'recommendations-panel'
    },
    {
      id: 'analytics',
      content: 'Advanced Analytics',
      accessibilityLabel: 'Advanced Analytics',
      panelID: 'analytics-panel'
    }
  ];

  // Overview Tab Content
  const OverviewTab = () => (
    <Layout>
      <Layout.Section>
        <Banner
          title="Template API v2 - Enhanced Performance & Features"
          status="success"
        >
          <p>Experience the next generation of template management with improved performance, intelligent caching, and AI-powered features.</p>
        </Banner>
      </Layout.Section>
      
      {apiMetrics && (
        <Layout.Section>
          <Card title="API Performance Metrics" sectioned>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <Text variant="headingMd">Performance Overview</Text>
                <div style={{ marginTop: '12px' }}>
                  <Text>Total Requests: <strong>{apiMetrics.totalRequests.toLocaleString()}</strong></Text>
                  <br />
                  <Text>Average Response Time: <strong>{Math.round(apiMetrics.averageResponseTime)}ms</strong></Text>
                  <br />
                  <Text>Cache Hit Rate: <strong>{Math.round(apiMetrics.cacheHitRate)}%</strong></Text>
                  <br />
                  <Text>Error Rate: <strong>{Math.round(apiMetrics.errorRate)}%</strong></Text>
                  <br />
                  <Text>Cache Size: <strong>{apiMetrics.cacheSize} entries</strong></Text>
                  <br />
                  <Text>Uptime: <strong>{Math.round(apiMetrics.uptime / 3600)}h</strong></Text>
                </div>
              </div>
              
              <div>
                <Text variant="headingMd">New Features</Text>
                <div style={{ marginTop: '12px' }}>
                  {apiMetrics.features.map((feature, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <Badge status="success">{feature}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>
      )}
      
      {categories && (
        <Layout.Section>
          <Card title="Enhanced Categories" sectioned>
            <DataTable
              columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'text']}
              headings={['Category', 'Templates', 'Avg Rating', 'Avg Conversion', 'Usage']}
              rows={categories.map(cat => [
                cat.name,
                cat.templateCount,
                cat.avgRating.toFixed(1),
                `${(cat.avgConversion * 100).toFixed(1)}%`,
                <Badge key={cat.key} status={cat.usage === 'high' ? 'success' : cat.usage === 'medium' ? 'attention' : 'info'}>
                  {cat.usage}
                </Badge>
              ])}
            />
          </Card>
        </Layout.Section>
      )}
    </Layout>
  );

  // Enhanced Search Tab Content
  const SearchTab = () => (
    <Layout>
      <Layout.Section>
        <Card sectioned>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <TextField
                label="Search Templates"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, description, category, or tags..."
                helpText="Use AI-powered search with weighted relevance scoring"
              />
            </div>
            <div>
              <Button primary onClick={performSearch} loading={loading}>
                Search
              </Button>
            </div>
          </div>
          
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Select
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { label: 'All Categories', value: '' },
                ...(categories || []).map(cat => ({ 
                  label: cat.name, 
                  value: cat.key 
                }))
              ]}
            />
            
            <Select
              label="Template Type"
              value={selectedType}
              onChange={setSelectedType}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Built-in', value: 'built_in' },
                { label: 'Custom', value: 'custom' }
              ]}
            />
            
            <Select
              label="Min Rating"
              value={minRating}
              onChange={setMinRating}
              options={[
                { label: 'Any Rating', value: '' },
                { label: '4+ Stars', value: '4' },
                { label: '4.5+ Stars', value: '4.5' }
              ]}
            />
            
            <Select
              label="Sort By"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { label: 'Relevance', value: 'relevance' },
                { label: 'Quality Score', value: 'quality' },
                { label: 'Rating', value: 'rating' },
                { label: 'Usage', value: 'usage' },
                { label: 'Recent', value: 'recent' },
                { label: 'Name', value: 'name' }
              ]}
            />
          </div>
        </Card>
      </Layout.Section>
      
      {searchResults && (
        <Layout.Section>
          <Card 
            title={`Search Results (${searchResults.pagination.total} found)`}
            sectioned
            actions={bulkSelection.length > 0 ? [
              {
                content: `Bulk Actions (${bulkSelection.length} selected)`,
                onAction: () => setShowBulkModal(true)
              }
            ] : []}
          >
            {searchResults.searchMeta && (
              <div style={{ marginBottom: '16px' }}>
                <Text variant="bodyMd" color="subdued">
                  Search executed in {searchResults.searchMeta.executionTime}ms
                  {Object.keys(searchResults.searchMeta.filters).length > 0 && 
                    ` • Filters: ${Object.entries(searchResults.searchMeta.filters).map(([k, v]) => `${k}=${v}`).join(', ')}`
                  }
                </Text>
              </div>
            )}
            
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'text']}
              headings={['Select', 'Template', 'Category', 'Quality Score', 'Rating', 'Performance']}
              rows={searchResults.templates.map(template => [
                <Checkbox
                  key={template.id}
                  checked={bulkSelection.includes(template.id)}
                  onChange={(checked) => {
                    if (checked) {
                      setBulkSelection([...bulkSelection, template.id]);
                    } else {
                      setBulkSelection(bulkSelection.filter(id => id !== template.id));
                    }
                  }}
                />,
                template.name,
                template.category,
                <Badge key={`quality-${template.id}`} status={template.qualityScore > 80 ? 'success' : template.qualityScore > 60 ? 'attention' : 'critical'}>
                  {template.qualityScore}/100
                </Badge>,
                `${template.averageRating.toFixed(1)} ⭐`,
                template.recentPerformance ? 
                  `${(template.recentPerformance.conversionRate * 100).toFixed(1)}% conv.` : 
                  'No data'
              ])}
            />
            
            {searchResults.pagination.hasNext && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Button onClick={() => {
                  // Load more logic would go here
                }}>
                  Load More Results
                </Button>
              </div>
            )}
          </Card>
        </Layout.Section>
      )}
    </Layout>
  );

  // AI Recommendations Tab Content
  const RecommendationsTab = () => (
    <Layout>
      <Layout.Section>
        <Card sectioned>
          <div>
            <Text variant="headingMd">AI-Powered Template Recommendations</Text>
            <Text variant="bodyMd" color="subdued">
              Get personalized template suggestions based on your shop's performance data and industry trends.
            </Text>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button onClick={() => loadRecommendations('general')}>
              General Recommendations
            </Button>
            <Button onClick={() => loadRecommendations('seasonal')}>
              Seasonal Campaigns
            </Button>
            <Button onClick={() => loadRecommendations('sales')}>
              Sales & Promotions
            </Button>
            <Button onClick={() => loadRecommendations('engagement')}>
              Customer Engagement
            </Button>
          </div>
        </Card>
      </Layout.Section>
      
      {recommendations && (
        <Layout.Section>
          <Card title="Recommended Templates" sectioned>
            <BlockStack gap="400">
              {recommendations.map((template, index) => (
                <Card key={template.id} sectioned>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">{template.name}</Text>
                    <BlockStack gap="200">
                      <Text as="p"><strong>Category:</strong> {template.category}</Text>
                      <Text as="p"><strong>Quality Score:</strong> {template.recommendationScore}/100</Text>
                      <Text as="p"><strong>Why recommended:</strong> {template.reason}</Text>
                      {template.averageRating > 0 && (
                        <Text as="p"><strong>Rating:</strong> {template.averageRating.toFixed(1)} ⭐</Text>
                      )}
                    </BlockStack>
                    <Button 
                      variant="primary"
                      url={`/app/templates?apply=${template.id}`}
                    >
                      Apply Template
                    </Button>
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </Card>
        </Layout.Section>
      )}
    </Layout>
  );

  // Advanced Analytics Tab Content
  const AnalyticsTab = () => (
    <Layout>
      <Layout.Section>
        <Card sectioned>
          <div>
            <Text variant="headingMd">Advanced Analytics & Predictions</Text>
            <Text variant="bodyMd" color="subdued">
              View detailed performance metrics with predictive insights and trend analysis.
            </Text>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button onClick={() => loadAnalytics('7d')}>Last 7 Days</Button>
            <Button onClick={() => loadAnalytics('30d')}>Last 30 Days</Button>
            <Button onClick={() => loadAnalytics('90d')}>Last 90 Days</Button>
            <Button onClick={() => loadAnalytics('1y')}>Last Year</Button>
          </div>
        </Card>
      </Layout.Section>
      
      {analytics && (
        <>
          <Layout.Section>
            <Card title="Performance Summary" sectioned>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <Text variant="headingMd">
                    {analytics.summary.totalImpressions.toLocaleString()} Impressions
                  </Text>
                  <Text variant="bodyMd" color="subdued">Total views</Text>
                </div>
                <div>
                  <Text variant="headingMd">
                    {analytics.summary.totalConversions.toLocaleString()} Conversions
                  </Text>
                  <Text variant="bodyMd" color="subdued">Successful actions</Text>
                </div>
                <div>
                  <Text variant="headingMd">
                    {(analytics.summary.averageConversionRate * 100).toFixed(2)}%
                  </Text>
                  <Text variant="bodyMd" color="subdued">Conversion rate</Text>
                </div>
                <div>
                  <Text variant="headingMd">
                    ${analytics.summary.totalRevenue.toFixed(2)}
                  </Text>
                  <Text variant="bodyMd" color="subdued">Generated revenue</Text>
                </div>
              </div>
            </Card>
          </Layout.Section>
          
          {analytics.predictions && (
            <Layout.Section>
              <Card title="Predictive Insights" sectioned>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <Text variant="headingMd">Trend Analysis</Text>
                    <Badge status={
                      analytics.predictions.trend === 'improving' ? 'success' :
                      analytics.predictions.trend === 'declining' ? 'critical' : 'info'
                    }>
                      {analytics.predictions.trend}
                    </Badge>
                    {analytics.predictions.trendPercentage && (
                      <Text> ({analytics.predictions.trendPercentage > 0 ? '+' : ''}{analytics.predictions.trendPercentage}%)</Text>
                    )}
                  </div>
                  
                  {analytics.predictions.predictedConversionRate && (
                    <div>
                      <Text variant="bodyMd">
                        <strong>Predicted Conversion Rate:</strong> {(analytics.predictions.predictedConversionRate * 100).toFixed(2)}%
                      </Text>
                      <Text variant="bodyMd" color="subdued">
                        Confidence: {analytics.predictions.confidence}
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Layout.Section>
          )}
          
          {analytics.insights && analytics.insights.length > 0 && (
            <Layout.Section>
              <Card title="Actionable Insights" sectioned>
                {analytics.insights.map((insight, index) => (
                  <Banner
                    key={index}
                    title={insight.message}
                    status={insight.type === 'positive' ? 'success' : 'warning'}
                  >
                    <p><strong>Recommended Action:</strong> {insight.action}</p>
                  </Banner>
                ))}
              </Card>
            </Layout.Section>
          )}
        </>
      )}
    </Layout>
  );

  // Bulk Actions Modal
  const BulkActionsModal = () => (
    <Modal
      open={showBulkModal}
      onClose={() => setShowBulkModal(false)}
      title="Bulk Actions"
      primaryAction={{
        content: 'Execute',
        onAction: () => {
          // Would implement bulk action selection
        }
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: () => setShowBulkModal(false)
        }
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p">Select an action to perform on {bulkSelection.length} selected templates:</Text>
          <BlockStack gap="200">
            <Button onClick={() => performBulkOperation('favorite')}>
              Add to Favorites
            </Button>
            <Button onClick={() => performBulkOperation('unfavorite')}>
              Remove from Favorites
            </Button>
            <Button destructive onClick={() => performBulkOperation('delete')}>
              Delete (Custom Templates Only)
            </Button>
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );

  if (loading && !apiMetrics) {
    return <SkeletonPage primaryAction><SkeletonBodyText /></SkeletonPage>;
  }

  if (error) {
    return (
      <Page title="Template API v2">
        <Banner title="Error" status="critical">
          {error}
        </Banner>
      </Page>
    );
  }

  return (
    <Page
      title="Template API v2 Demo"
      subtitle="Experience enhanced performance and AI-powered features"
      compactTitle
      backAction={{ url: '/app' }}
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        <Card.Section>
          {selectedTab === 0 && <OverviewTab />}
          {selectedTab === 1 && <SearchTab />}
          {selectedTab === 2 && <RecommendationsTab />}
          {selectedTab === 3 && <AnalyticsTab />}
        </Card.Section>
      </Tabs>
      
      <BulkActionsModal />
    </Page>
  );
}
