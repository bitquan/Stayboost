import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    Filters,
    InlineStack,
    Layout,
    Modal,
    Page,
    Select,
    Text,
    TextField
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";

/**
 * Popup Templates Library Management
 * Priority #17 - Pre-designed popup templates for merchants
 */

// Dynamic import for server-side template functions
async function getTemplatesModule() {
  const module = await import("../utils/popupTemplates.server.js");
  return module;
}

export async function loader({ request }) {
  await authenticate.admin(request);

  try {
    const { getTemplateManager } = await getTemplatesModule();
    const url = new URL(request.url);
    
    const category = url.searchParams.get('category');
    const style = url.searchParams.get('style');
    const search = url.searchParams.get('search');
    
    const manager = getTemplateManager();
    
    let templates;
    if (search) {
      templates = manager.searchTemplates(search);
    } else if (category) {
      templates = manager.getTemplatesByCategory(category);
    } else if (style) {
      templates = manager.getTemplatesByStyle(style);
    } else {
      templates = manager.getAllTemplates();
    }

    const categories = manager.getCategoriesWithCounts();
    const styles = manager.getStylesWithCounts();

    return json({
      templates,
      categories,
      styles,
      filters: { category, style, search }
    });

  } catch (error) {
    console.error('Templates loader error:', error);
    return json(
      { error: 'Failed to load templates', templates: [], categories: [], styles: [] },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  await authenticate.admin(request);

  try {
    const { getTemplateManager } = await getTemplatesModule();
    const formData = await request.formData();
    const action = formData.get("action");
    
    const manager = getTemplateManager();

    switch (action) {
      case "apply_template": {
        const templateId = formData.get("templateId");
        const existingSettings = JSON.parse(formData.get("existingSettings") || '{}');
        
        const newSettings = manager.applyTemplate(templateId, existingSettings);
        
        // In a real implementation, this would save to the database
        // For now, we'll return the settings to be applied by the client
        return json({ 
          success: true, 
          settings: newSettings,
          message: `Template applied successfully!` 
        });
      }

      case "preview_template": {
        const templateId = formData.get("templateId");
        const template = manager.getTemplate(templateId);
        
        if (!template) {
          return json({ error: "Template not found" }, { status: 404 });
        }
        
        const css = manager.generateTemplateCSS(template);
        
        return json({ 
          success: true, 
          template,
          css,
          previewHtml: generatePreviewHTML(template)
        });
      }

      case "validate_template": {
        const templateData = JSON.parse(formData.get("templateData"));
        const validation = manager.validateTemplate(templateData);
        
        return json({ 
          success: true, 
          validation 
        });
      }

      default:
        return json({ error: "Unknown action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Templates action error:', error);
    return json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    );
  }
}

function generatePreviewHTML(template) {
  const config = template.config;
  
  return `
    <div class="stayboost-popup template-${template.id}" style="
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
      border-radius: ${config.borderRadius};
      padding: 30px;
      max-width: 400px;
      text-align: center;
      font-family: ${config.fontFamily || 'Arial, sans-serif'};
    ">
      <h2 style="
        font-size: ${config.fontSize?.title || '24px'};
        color: ${config.textColor};
        margin: 0 0 15px 0;
      ">${config.title}</h2>
      
      <p style="
        font-size: ${config.fontSize?.message || '16px'};
        color: ${config.textColor};
        margin: 0 0 20px 0;
        line-height: 1.5;
      ">${config.message}</p>
      
      ${config.showEmailField ? `
        <input type="email" placeholder="${config.emailPlaceholder || 'Enter your email'}" style="
          width: 100%;
          padding: 12px;
          margin: 0 0 15px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        ">
      ` : ''}
      
      ${config.showTimer ? `
        <div style="
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 15px 0;
          color: ${config.textColor};
        ">⏰ Limited Time: 29:59</div>
      ` : ''}
      
      ${config.showStars ? `
        <div style="margin: 0 0 15px 0;">
          <span style="color: #ffd700; font-size: 18px;">★★★★★</span>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            ${config.starRating}/5 from ${config.reviewCount?.toLocaleString()} reviews
          </div>
        </div>
      ` : ''}
      
      <button style="
        background-color: ${config.buttonColor};
        color: ${config.buttonTextColor};
        font-size: ${config.fontSize?.button || '16px'};
        border: none;
        border-radius: ${config.borderRadius};
        padding: 12px 24px;
        cursor: pointer;
        font-weight: 600;
      ">
        ${config.discountCode ? `Get ${config.discountPercentage}% Off` : 'Learn More'}
      </button>
      
      ${config.discountCode ? `
        <div style="
          font-size: 12px;
          color: ${config.textColor};
          margin-top: 10px;
          opacity: 0.8;
        ">Code: ${config.discountCode}</div>
      ` : ''}
    </div>
  `;
}

export default function PopupTemplates() {
  const data = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchValue, setSearchValue] = useState(data.filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(data.filters.category || '');
  const [selectedStyle, setSelectedStyle] = useState(data.filters.style || '');

  // Filter handlers
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setSelectedCategory(value);
    // Update URL to trigger reload with new filters
    const url = new URL(window.location);
    if (value) {
      url.searchParams.set('category', value);
    } else {
      url.searchParams.delete('category');
    }
    window.location.href = url.toString();
  }, []);

  const handleStyleChange = useCallback((value) => {
    setSelectedStyle(value);
    const url = new URL(window.location);
    if (value) {
      url.searchParams.set('style', value);
    } else {
      url.searchParams.delete('style');
    }
    window.location.href = url.toString();
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const url = new URL(window.location);
    if (searchValue) {
      url.searchParams.set('search', searchValue);
    } else {
      url.searchParams.delete('search');
    }
    window.location.href = url.toString();
  }, [searchValue]);

  const handleClearFilters = useCallback(() => {
    const url = new URL(window.location);
    url.searchParams.delete('category');
    url.searchParams.delete('style');
    url.searchParams.delete('search');
    window.location.href = url.toString();
  }, []);

  // Template actions
  const handlePreviewTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
    
    const formData = new FormData();
    formData.append("action", "preview_template");
    formData.append("templateId", template.id);
    
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  const handleApplyTemplate = useCallback((template) => {
    const formData = new FormData();
    formData.append("action", "apply_template");
    formData.append("templateId", template.id);
    formData.append("existingSettings", JSON.stringify({})); // Could get from current popup settings
    
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  // Filter options
  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...data.categories.map(cat => ({
      label: `${cat.label} (${cat.count})`,
      value: cat.value
    }))
  ];

  const styleOptions = [
    { label: 'All Styles', value: '' },
    ...data.styles.map(style => ({
      label: `${style.label} (${style.count})`,
      value: style.value
    }))
  ];

  const filters = [
    {
      key: 'category',
      label: 'Category',
      filter: (
        <Select
          options={categoryOptions}
          value={selectedCategory}
          onChange={handleCategoryChange}
        />
      )
    },
    {
      key: 'style',
      label: 'Style',
      filter: (
        <Select
          options={styleOptions}
          value={selectedStyle}
          onChange={handleStyleChange}
        />
      )
    }
  ];

  return (
    <Page
      title="Popup Templates"
      subtitle="Choose from professionally designed popup templates"
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

        {/* Search and Filters */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" distribution="equalSpacing">
                <div style={{ flex: 1 }}>
                  <TextField
                    placeholder="Search templates..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  />
                </div>
                <Button onClick={handleSearchSubmit}>Search</Button>
                <Button variant="secondary" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </InlineStack>

              <Filters
                filters={filters}
                onClearAll={handleClearFilters}
                appliedFilters={[
                  ...(selectedCategory ? [{ key: 'category', label: `Category: ${selectedCategory}` }] : []),
                  ...(selectedStyle ? [{ key: 'style', label: `Style: ${selectedStyle}` }] : [])
                ]}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Templates Grid */}
        <Layout.Section>
          <Text variant="headingMd">
            {data.templates.length} Template{data.templates.length !== 1 ? 's' : ''} Found
          </Text>
          
          {data.templates.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px',
              marginTop: '20px'
            }}>
              {data.templates.map(template => (
                <Card key={template.id}>
                  <BlockStack gap="400">
                    {/* Template Thumbnail */}
                    <div style={{ 
                      height: '200px', 
                      backgroundColor: '#f6f6f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px'
                    }}>
                      <Text variant="bodyMd" color="subdued">
                        Template Preview
                      </Text>
                    </div>
                    
                    {/* Template Info */}
                    <BlockStack gap="200">
                      <InlineStack distribution="spaceBetween" align="center">
                        <Text variant="headingMd">{template.name}</Text>
                        <Badge status="info">
                          {template.style.charAt(0).toUpperCase() + template.style.slice(1)}
                        </Badge>
                      </InlineStack>
                      
                      <Text variant="bodyMd" color="subdued">
                        {template.description}
                      </Text>
                      
                      <InlineStack gap="100">
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} status="attention" size="small">
                            {tag}
                          </Badge>
                        ))}
                      </InlineStack>
                    </BlockStack>
                    
                    {/* Actions */}
                    <InlineStack gap="200" distribution="equalSpacing">
                      <Button 
                        variant="secondary" 
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        Preview
                      </Button>
                      <Button 
                        variant="primary"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Card>
              ))}
            </div>
          ) : (
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text variant="headingMd">No templates found</Text>
                <Text>Try adjusting your search or filter criteria</Text>
              </div>
            </Card>
          )}
        </Layout.Section>
      </Layout>

      {/* Preview Modal */}
      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={selectedTemplate ? `Preview: ${selectedTemplate.name}` : "Template Preview"}
        large
      >
        <Modal.Section>
          {selectedTemplate && (
            <BlockStack gap="400">
              <InlineStack gap="400" distribution="equalSpacing">
                <div>
                  <Text variant="headingMd">Category</Text>
                  <Text>{selectedTemplate.category.replace('_', ' ')}</Text>
                </div>
                <div>
                  <Text variant="headingMd">Style</Text>
                  <Text>{selectedTemplate.style}</Text>
                </div>
                <div>
                  <Text variant="headingMd">Tags</Text>
                  <InlineStack gap="100">
                    {selectedTemplate.tags.map(tag => (
                      <Badge key={tag} size="small">{tag}</Badge>
                    ))}
                  </InlineStack>
                </div>
              </InlineStack>
              
              <Text variant="bodyMd">{selectedTemplate.description}</Text>
              
              {/* Live Preview */}
              <div style={{
                border: '1px solid #e1e1e1',
                borderRadius: '8px',
                padding: '40px',
                backgroundColor: '#f9f9f9',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '300px'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: generatePreviewHTML(selectedTemplate) 
                  }} 
                />
              </div>
              
              <InlineStack distribution="center">
                <Button 
                  variant="primary"
                  onClick={() => {
                    handleApplyTemplate(selectedTemplate);
                    setShowPreviewModal(false);
                  }}
                >
                  Use This Template
                </Button>
              </InlineStack>
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
