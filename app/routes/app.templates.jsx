import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Badge, BlockStack, Box, Button, Card, InlineGrid, InlineStack, Layout, Page, Select, Text } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
import { AdvancedTemplatePreview } from "../components/AdvancedTemplatePreview";
import { CustomTemplateModal } from "../components/CustomTemplateModal";
import { TemplateImportExportModal } from "../components/TemplateImportExportModal";
import { TemplatePreview } from "../components/TemplatePreview";
import prisma from "../db.server";
import { getCachedMerchantBranding } from "../models/merchantBranding.server";
import { authenticate } from "../shopify.server";

// Loader function to fetch templates server-side
export async function loader({ request }) {
  try {
    const { shop } = await authenticate.admin(request);
    
    // Get all templates, including default templates and shop-specific ones
    const templates = await prisma.popupTemplate.findMany({
      where: {
        OR: [
          { shop: "default" }, // Built-in templates
          { shop: shop } // Shop-specific templates
        ]
      },
      include: {
        usageStats: {
          take: 1,
          orderBy: { date: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Get merchant branding for advanced preview
    const brandingResult = await getCachedMerchantBranding(request);
    
    return json({ 
      templates, 
      shopBranding: brandingResult?.branding || null 
    });
  } catch (error) {
    console.error('Error loading templates:', error);
    return json({ templates: [] });
  }
}

const TEMPLATE_CATEGORIES = {
  all: "All Templates",
  exit_intent: "Exit Intent",
  sale: "Sale & Promotions", 
  holiday: "Holiday & Seasonal",
  newsletter: "Newsletter Signup"
};

export default function Templates() {
  const { templates: loaderTemplates, shopBranding } = useLoaderData();
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  
  // Custom template modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Import/Export modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportableTemplates, setExportableTemplates] = useState([]);

  // Advanced preview state
  const [showAdvancedPreview, setShowAdvancedPreview] = useState(false);
  const [advancedPreviewTemplate, setAdvancedPreviewTemplate] = useState(null);

  // Transform database templates to match frontend format
  useEffect(() => {
    const transformedTemplates = loaderTemplates.map(template => {
      try {
        const config = JSON.parse(template.config || '{}');
        return {
          id: template.id,
          name: template.name,
          category: template.category,
          templateType: template.templateType || "built_in",
          conversionRate: template.conversionRate || 0,
          title: config.title || template.name,
          message: config.message || "",
          discountCode: config.discountCode || "",
          discountPercentage: config.discountPercentage || 0,
          preview: {
            backgroundColor: config.backgroundColor || "#ffffff",
            textColor: config.textColor || "#333333",
            buttonColor: config.buttonColor || "#5c6ac4"
          }
        };
      } catch (parseError) {
        console.error('Error parsing template config:', parseError);
        return {
          id: template.id,
          name: template.name,
          category: template.category,
          templateType: template.templateType || "built_in",
          conversionRate: 0,
          title: template.name,
          message: "Template configuration error",
          discountCode: "ERROR",
          discountPercentage: 0,
          preview: {
            backgroundColor: "#ffffff",
            textColor: "#333333",
            buttonColor: "#5c6ac4"
          }
        };
      }
    });
    
    setTemplates(transformedTemplates);
  }, [loaderTemplates]);

  const filteredTemplates = templates.filter(template =>
    selectedCategory === "all" || template.category === selectedCategory
  );

  const applyTemplate = useCallback(async (template) => {
    setIsApplying(true);
    try {
      const response = await fetch('/api/apply-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Template applied successfully:', result);
        // Optionally show success message
      } else {
        const error = await response.json();
        console.error('Error applying template:', error);
        // Optionally show error message
      }
    } catch (error) {
      console.error('Network error applying template:', error);
    } finally {
      setIsApplying(false);
      setSelectedTemplate(null);
    }
  }, []);

  const handleApplyTemplate = (template) => {
    setSelectedTemplate(template);
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  // Custom template handlers
  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch('/api/custom-templates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        // Refresh templates list
        window.location.reload();
      } else {
        console.error('Error deleting template');
      }
    } catch (error) {
      console.error('Network error deleting template:', error);
    }
  };

  const handleTemplateSubmit = async (templateData) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/custom-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        // Refresh templates list
        window.location.reload();
      } else {
        console.error('Error creating template');
      }
    } catch (error) {
      console.error('Network error creating template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateUpdate = async (templateData) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/custom-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...templateData,
          templateId: editingTemplate.id
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingTemplate(null);
        // Refresh templates list
        window.location.reload();
      } else {
        console.error('Error updating template');
      }
    } catch (error) {
      console.error('Network error updating template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Import/Export handlers
  const handleImportTemplates = () => {
    setShowImportModal(true);
  };

  const handleExportTemplates = async () => {
    try {
      // Fetch exportable templates
      const response = await fetch('/api/template-import-export?action=export-list');
      if (response.ok) {
        const data = await response.json();
        setExportableTemplates(data.templates);
        setShowExportModal(true);
      } else {
        console.error('Error fetching exportable templates');
      }
    } catch (error) {
      console.error('Network error fetching exportable templates:', error);
    }
  };

  const handleImportExportComplete = () => {
    // Refresh the page to show updated templates
    window.location.reload();
  };

  const handleAdvancedPreview = (template) => {
    setAdvancedPreviewTemplate(template);
    setShowAdvancedPreview(true);
  };

  return (
    <Page
      title="Template Library"
      primaryAction={{
        content: 'Create Custom Template',
        onAction: handleCreateTemplate,
      }}
      secondaryActions={[
        {
          content: 'Import Templates',
          onAction: handleImportTemplates,
        },
        {
          content: 'Export Templates',
          onAction: handleExportTemplates,
        }
      ]}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Filter Templates</Text>
              <Select
                label="Category"
                options={Object.entries(TEMPLATE_CATEGORIES).map(([value, label]) => ({
                  label,
                  value,
                }))}
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="twoThirds">
          <BlockStack gap="400">
            {filteredTemplates.length === 0 ? (
              <Card>
                <Text>No templates found for the selected category.</Text>
              </Card>
            ) : (
              filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <BlockStack gap="200">
                        <InlineStack gap="200">
                          <Text variant="headingMd">{template.name}</Text>
                          <Badge tone={template.templateType === 'custom' ? 'info' : 'success'}>
                            {template.templateType === 'custom' ? 'Custom' : 'Built-in'}
                          </Badge>
                          <Badge tone="subdued">
                            {TEMPLATE_CATEGORIES[template.category]}
                          </Badge>
                        </InlineStack>
                        <Text tone="subdued">
                          Conversion Rate: {template.conversionRate}%
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200">
                        {template.templateType === 'custom' && (
                          <>
                            <Button
                              variant="secondary"
                              onClick={() => handleEditTemplate(template)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              tone="critical"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => handleApplyTemplate(template)}
                          loading={isApplying && selectedTemplate?.id === template.id}
                          disabled={isApplying}
                        >
                          {isApplying && selectedTemplate?.id === template.id ? 'Applying...' : 'Apply Template'}
                        </Button>
                      </InlineStack>
                    </InlineStack>

                    <Box
                      padding="400"
                      background="bg-surface-secondary"
                      borderColor="border"
                      borderWidth="025"
                      borderRadius="200"
                    >
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Text variant="headingSm">Preview</Text>
                          <Button
                            variant="tertiary"
                            size="micro"
                            onClick={() => handleAdvancedPreview(template)}
                          >
                            Advanced Preview
                          </Button>
                        </InlineStack>
                        <div style={{
                          padding: '20px',
                          backgroundColor: template.preview.backgroundColor,
                          color: template.preview.textColor,
                          borderRadius: '8px',
                          border: '1px solid #e1e3e5'
                        }}>
                          <Text variant="headingMd" as="h3" style={{ color: template.preview.textColor, marginBottom: '10px' }}>
                            {template.title}
                          </Text>
                          <Text style={{ color: template.preview.textColor, marginBottom: '15px' }}>
                            {template.message}
                          </Text>
                          <InlineStack gap="200">
                            <div style={{
                              padding: '8px 16px',
                              backgroundColor: template.preview.buttonColor,
                              color: template.preview.buttonColor === '#ffffff' ? '#333' : '#fff',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              Claim {template.discountPercentage}% Off
                            </div>
                            <div style={{
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              color: template.preview.textColor,
                              border: `1px solid ${template.preview.textColor}`,
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}>
                              No Thanks
                            </div>
                          </InlineStack>
                        </div>
                      </BlockStack>
                    </Box>
                  </BlockStack>
                </Card>
              ))
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* Custom Template Creation Modal */}
      {showCreateModal && (
        <CustomTemplateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleTemplateSubmit}
          isLoading={isCreating}
          title="Create Custom Template"
        />
      )}

      {/* Custom Template Edit Modal */}
      {showEditModal && editingTemplate && (
        <CustomTemplateModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTemplate(null);
          }}
          onSubmit={handleTemplateUpdate}
          isLoading={isCreating}
          title="Edit Custom Template"
          initialData={editingTemplate}
        />
      )}

      {/* Template Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <BlockStack gap="400">
              <Text variant="headingLg">Template Preview</Text>
              
              <TemplatePreview
                config={{
                  title: previewTemplate.title,
                  message: previewTemplate.message,
                  discountCode: previewTemplate.discountCode,
                  discountPercentage: previewTemplate.discountPercentage,
                  backgroundColor: previewTemplate.preview.backgroundColor,
                  textColor: previewTemplate.preview.textColor,
                  buttonColor: previewTemplate.preview.buttonColor,
                  borderRadius: 8,
                  fontSize: 16
                }}
                title="Live Preview"
              />
              
              <InlineGrid columns={2} gap="400">
                <Button
                  variant="secondary"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowPreviewModal(false);
                    applyTemplate(previewTemplate);
                  }}
                  loading={isApplying}
                  disabled={isApplying}
                >
                  {isApplying ? 'Applying...' : 'Apply Template'}
                </Button>
              </InlineGrid>
            </BlockStack>
          </div>
        </div>
      )}

      {/* Import Templates Modal */}
      {showImportModal && (
        <TemplateImportExportModal
          isOpen={showImportModal}
          mode="import"
          onClose={() => setShowImportModal(false)}
          onComplete={handleImportExportComplete}
        />
      )}

      {/* Export Templates Modal */}
      {showExportModal && (
        <TemplateImportExportModal
          isOpen={showExportModal}
          mode="export"
          templates={exportableTemplates}
          onClose={() => setShowExportModal(false)}
          onComplete={handleImportExportComplete}
        />
      )}

      {/* Advanced Template Preview Modal */}
      {showAdvancedPreview && advancedPreviewTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <AdvancedTemplatePreview
              config={advancedPreviewTemplate}
              title={`Advanced Preview: ${advancedPreviewTemplate.name}`}
              shopBranding={shopBranding}
              showControls={true}
              realTimeMode={false}
            />
            <Box padding="400">
              <InlineStack gap="300" align="end">
                <Button onClick={() => setShowAdvancedPreview(false)}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setShowAdvancedPreview(false);
                    handleApplyTemplate(advancedPreviewTemplate);
                  }}
                >
                  Apply Template
                </Button>
              </InlineStack>
            </Box>
          </div>
        </div>
      )}
    </Page>
  );
}
