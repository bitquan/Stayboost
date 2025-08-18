import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Badge,
    BlockStack,
    Box,
    Button,
    Card,
    Grid,
    Icon,
    InlineStack,
    Layout,
    Modal,
    Page,
    Pagination,
    Select,
    Text,
    TextField,
    Thumbnail
} from "@shopify/polaris";
import { SearchIcon, StarIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "browse";
  const category = url.searchParams.get("category") || "all";
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "popular";
  const page = url.searchParams.get("page") || "1";
  
  try {
    // Fetch marketplace data
    const marketplaceUrl = new URL('/api/template-marketplace', new URL(request.url).origin);
    marketplaceUrl.searchParams.set('action', action);
    marketplaceUrl.searchParams.set('category', category);
    marketplaceUrl.searchParams.set('search', search);
    marketplaceUrl.searchParams.set('sort', sort);
    marketplaceUrl.searchParams.set('page', page);
    
    const marketplaceResponse = await fetch(marketplaceUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });
    
    if (!marketplaceResponse.ok) {
      throw new Error('Failed to load marketplace data');
    }
    
    const marketplaceData = await marketplaceResponse.json();
    
    // Get featured templates
    const featuredUrl = new URL('/api/template-marketplace', new URL(request.url).origin);
    featuredUrl.searchParams.set('action', 'featured');
    
    const featuredResponse = await fetch(featuredUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });
    
    const featuredData = await featuredResponse.json();
    
    return json({
      templates: marketplaceData.templates || [],
      pagination: marketplaceData.pagination || {},
      stats: marketplaceData.stats || {},
      featured: featuredData.templates || [],
      currentFilters: { action, category, search, sort, page }
    });
    
  } catch (error) {
    console.error('Failed to load marketplace:', error);
    return json({
      templates: [],
      pagination: {},
      stats: {},
      featured: [],
      currentFilters: { action, category, search, sort, page }
    });
  }
};

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "all" },
  { label: "Exit Intent", value: "exit_intent" },
  { label: "Sales & Promotions", value: "sales" },
  { label: "Holiday & Seasonal", value: "holiday" },
  { label: "Newsletter Signup", value: "newsletter" },
  { label: "Announcements", value: "announcement" },
  { label: "Cart Recovery", value: "cart_recovery" },
  { label: "Upsell & Cross-sell", value: "upsell" },
  { label: "Feedback & Survey", value: "survey" }
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular" },
  { label: "Newest First", value: "newest" },
  { label: "Highest Rated", value: "highest_rated" },
  { label: "Most Used", value: "most_used" }
];

export default function TemplateMarketplace() {
  const { templates, pagination, stats, featured, currentFilters } = useLoaderData();
  
  const [searchValue, setSearchValue] = useState(currentFilters.search);
  const [categoryFilter, setCategoryFilter] = useState(currentFilters.category);
  const [sortOption, setSortOption] = useState(currentFilters.sort);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingTemplate, setPublishingTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback((value) => {
    setSearchValue(value);
    // Debounced search would be implemented here
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setCategoryFilter(value);
    // Navigate to new URL with filters
    const url = new URL(window.location);
    url.searchParams.set('category', value);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  }, []);

  const handleSortChange = useCallback((value) => {
    setSortOption(value);
    const url = new URL(window.location);
    url.searchParams.set('sort', value);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  }, []);

  const handleTemplatePreview = useCallback((template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  }, []);

  const handleInstallTemplate = useCallback(async (templateId) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'install');
      formData.append('templateId', templateId.toString());
      
      const response = await fetch('/api/template-marketplace', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        shopify.toast.show('Template installed successfully!');
        // Optionally redirect to templates page
      } else {
        shopify.toast.show(result.error || 'Failed to install template', { isError: true });
      }
    } catch (error) {
      console.error('Install error:', error);
      shopify.toast.show('Failed to install template', { isError: true });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRateTemplate = useCallback(async (templateId, rating, review) => {
    try {
      const formData = new FormData();
      formData.append('action', 'rate');
      formData.append('templateId', templateId.toString());
      formData.append('rating', rating.toString());
      if (review) formData.append('review', review);
      
      const response = await fetch('/api/template-marketplace', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        shopify.toast.show('Rating submitted successfully!');
        // Refresh the page to show updated rating
        window.location.reload();
      } else {
        shopify.toast.show(result.error || 'Failed to submit rating', { isError: true });
      }
    } catch (error) {
      console.error('Rating error:', error);
      shopify.toast.show('Failed to submit rating', { isError: true });
    }
  }, []);

  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : '0.0';
  };

  const renderTemplateCard = (template) => (
    <Card key={template.id}>
      <Box padding="400">
        <BlockStack gap="300">
          {/* Template Preview Image */}
          <Box>
            {template.previewImage ? (
              <Thumbnail
                source={template.previewImage}
                alt={template.name}
                size="large"
              />
            ) : (
              <Box 
                background="bg-surface-secondary" 
                minHeight="120px" 
                padding="400"
                borderRadius="200"
              >
                <Text variant="bodyMd" tone="subdued" alignment="center">
                  No preview available
                </Text>
              </Box>
            )}
          </Box>

          {/* Template Info */}
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">
              {template.name}
            </Text>
            
            <Text variant="bodySm" tone="subdued">
              by {template.authorShop}
            </Text>
            
            {template.description && (
              <Text variant="bodySm">
                {template.description.length > 100 
                  ? `${template.description.substring(0, 100)}...`
                  : template.description
                }
              </Text>
            )}
          </BlockStack>

          {/* Template Stats */}
          <InlineStack gap="200">
            <Badge tone="info">{template.category}</Badge>
            {template.isFeatured && (
              <Badge tone="success">Featured</Badge>
            )}
          </InlineStack>

          <InlineStack gap="300" align="space-between">
            <InlineStack gap="200">
              <InlineStack gap="100">
                <Icon source={StarIcon} tone="warning" />
                <Text variant="bodySm">
                  {formatRating(template.averageRating)} ({template.ratingCount || 0})
                </Text>
              </InlineStack>
              
              <Text variant="bodySm" tone="subdued">
                {template.totalUses || 0} installs
              </Text>
            </InlineStack>
            
            <InlineStack gap="200">
              <Button size="slim" onClick={() => handleTemplatePreview(template)}>
                Preview
              </Button>
              <Button 
                variant="primary" 
                size="slim"
                loading={loading}
                onClick={() => handleInstallTemplate(template.id)}
              >
                Install
              </Button>
            </InlineStack>
          </InlineStack>
        </BlockStack>
      </Box>
    </Card>
  );

  return (
    <Page
      title="Template Marketplace"
      subtitle="Discover and share templates with the StayBoost community"
      primaryAction={{
        content: "Publish Template",
        onAction: () => setShowPublishModal(true)
      }}
    >
      <Layout>
        {/* Marketplace Stats */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack gap="400" align="space-between">
                <BlockStack gap="200">
                  <Text variant="headingSm">Community Templates</Text>
                  <Text variant="bodyLg">{stats.totalTemplates || 0}</Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text variant="headingSm">Total Installs</Text>
                  <Text variant="bodyLg">{stats.totalInstalls || 0}</Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text variant="headingSm">Average Rating</Text>
                  <InlineStack gap="100">
                    <Icon source={StarIcon} tone="warning" />
                    <Text variant="bodyLg">{formatRating(stats.averageRating)}</Text>
                  </InlineStack>
                </BlockStack>
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Featured Templates */}
        {featured.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Featured Templates
                  </Text>
                  
                  <Grid>
                    {featured.slice(0, 4).map(renderTemplateCard)}
                  </Grid>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Search and Filters */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack gap="400">
                <Box minWidth="300px">
                  <TextField
                    prefix={<Icon source={SearchIcon} />}
                    placeholder="Search templates..."
                    value={searchValue}
                    onChange={handleSearch}
                    clearButton
                    onClearButtonClick={() => handleSearch("")}
                  />
                </Box>
                
                <Select
                  label="Category"
                  options={CATEGORY_OPTIONS}
                  onChange={handleCategoryChange}
                  value={categoryFilter}
                />
                
                <Select
                  label="Sort by"
                  options={SORT_OPTIONS}
                  onChange={handleSortChange}
                  value={sortOption}
                />
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Templates Grid */}
        <Layout.Section>
          {templates.length > 0 ? (
            <BlockStack gap="400">
              <Grid>
                {templates.map(renderTemplateCard)}
              </Grid>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box padding="400">
                  <Pagination
                    onPrevious={() => {
                      const url = new URL(window.location);
                      url.searchParams.set('page', (pagination.currentPage - 1).toString());
                      window.location.href = url.toString();
                    }}
                    onNext={() => {
                      const url = new URL(window.location);
                      url.searchParams.set('page', (pagination.currentPage + 1).toString());
                      window.location.href = url.toString();
                    }}
                    hasPrevious={pagination.hasPrevious}
                    hasNext={pagination.hasNext}
                    label={`Page ${pagination.currentPage} of ${pagination.totalPages}`}
                  />
                </Box>
              )}
            </BlockStack>
          ) : (
            <Card>
              <Box padding="400">
                <Text variant="bodyMd" alignment="center">
                  No templates found. Try adjusting your search criteria.
                </Text>
              </Box>
            </Card>
          )}
        </Layout.Section>
      </Layout>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <Modal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title={selectedTemplate.name}
          primaryAction={{
            content: "Install Template",
            onAction: () => handleInstallTemplate(selectedTemplate.id)
          }}
          secondaryActions={[
            {
              content: "Close",
              onAction: () => setShowPreview(false)
            }
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text variant="bodyMd">
                {selectedTemplate.description}
              </Text>
              
              <InlineStack gap="300">
                <Text variant="bodyMd">
                  <strong>Category:</strong> {selectedTemplate.category}
                </Text>
                <Text variant="bodyMd">
                  <strong>Author:</strong> {selectedTemplate.authorShop}
                </Text>
              </InlineStack>
              
              <InlineStack gap="300">
                <InlineStack gap="100">
                  <Icon source={StarIcon} tone="warning" />
                  <Text variant="bodyMd">
                    {formatRating(selectedTemplate.averageRating)} ({selectedTemplate.ratingCount || 0} reviews)
                  </Text>
                </InlineStack>
                <Text variant="bodyMd">
                  {selectedTemplate.totalUses || 0} installs
                </Text>
              </InlineStack>

              {/* Template preview would be rendered here */}
              <Box 
                background="bg-surface-secondary" 
                padding="400" 
                borderRadius="200"
              >
                <Text variant="bodyMd" tone="subdued" alignment="center">
                  Template preview would appear here
                </Text>
              </Box>
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
