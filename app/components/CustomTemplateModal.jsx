import {
    Banner,
    BlockStack,
    Box,
    Card,
    Form,
    FormLayout,
    InlineStack,
    Modal,
    Select,
    Text,
    TextField
} from "@shopify/polaris";
import { useCallback, useState } from "react";

const TEMPLATE_CATEGORIES = [
  { label: "Exit Intent", value: "exit_intent" },
  { label: "Sale & Promotions", value: "sale" },
  { label: "Holiday & Seasonal", value: "holiday" },
  { label: "Newsletter Signup", value: "newsletter" },
  { label: "Announcement", value: "announcement" },
  { label: "Upsell & Cross-sell", value: "upsell" },
];

const DEFAULT_CONFIG = {
  title: "Don't Miss Out!",
  message: "Get special offers and discounts",
  discountCode: "SAVE10",
  discountPercentage: 10,
  delaySeconds: 2,
  showOnce: true,
  backgroundColor: "#ffffff",
  textColor: "#000000",
  buttonColor: "#008060",
  buttonTextColor: "#ffffff",
  borderRadius: 8,
  fontSize: 16,
};

export function CustomTemplateModal({ 
  open, 
  onClose, 
  onSubmit, 
  template = null, 
  isLoading = false 
}) {
  const isEditing = !!template;
  const [formData, setFormData] = useState(() => {
    if (template) {
      let config = DEFAULT_CONFIG;
      try {
        config = { ...DEFAULT_CONFIG, ...JSON.parse(template.config) };
      } catch (e) {
        console.warn("Failed to parse template config, using defaults");
      }
      
      return {
        name: template.name || "",
        description: template.description || "",
        category: template.category || "exit_intent",
        ...config,
      };
    }
    
    return {
      name: "",
      description: "",
      category: "exit_intent",
      ...DEFAULT_CONFIG,
    };
  });

  const [errors, setErrors] = useState({});

  const handleFieldChange = useCallback((field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    }
    
    if (!formData.title.trim()) {
      newErrors.title = "Popup title is required";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Popup message is required";
    }
    
    if (!formData.discountCode.trim()) {
      newErrors.discountCode = "Discount code is required";
    }
    
    if (!formData.discountPercentage || formData.discountPercentage < 1 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = "Discount percentage must be between 1 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const { name, description, category, ...config } = formData;
    
    const templateData = {
      name,
      description,
      category,
      config: JSON.stringify(config),
      tags: JSON.stringify([category]), // Simple tagging by category
    };

    if (isEditing) {
      templateData.id = template.id;
    }

    onSubmit(templateData);
  }, [formData, validateForm, onSubmit, isEditing, template]);

  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit Custom Template" : "Create Custom Template"}
      primaryAction={{
        content: isEditing ? "Update Template" : "Create Template",
        onAction: handleSubmit,
        loading: isLoading,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
        },
      ]}
      large
    >
      <Modal.Section>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <Banner status="info">
              <Text variant="bodyMd">
                Create a custom popup template with your own messaging, styling, and discount settings. 
                This template will be saved to your template library for reuse.
              </Text>
            </Banner>

            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Template Information</Text>
                  
                  <TextField
                    label="Template Name"
                    value={formData.name}
                    onChange={handleFieldChange("name")}
                    error={errors.name}
                    placeholder="e.g., Holiday Sale Popup"
                    requiredIndicator
                  />
                  
                  <TextField
                    label="Description"
                    value={formData.description}
                    onChange={handleFieldChange("description")}
                    placeholder="Describe when and how this template should be used"
                    multiline={3}
                  />
                  
                  <Select
                    label="Category"
                    options={TEMPLATE_CATEGORIES}
                    value={formData.category}
                    onChange={handleFieldChange("category")}
                  />
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Popup Content</Text>
                  
                  <TextField
                    label="Popup Title"
                    value={formData.title}
                    onChange={handleFieldChange("title")}
                    error={errors.title}
                    placeholder="e.g., Wait! Don't leave yet!"
                    requiredIndicator
                  />
                  
                  <TextField
                    label="Popup Message"
                    value={formData.message}
                    onChange={handleFieldChange("message")}
                    error={errors.message}
                    placeholder="e.g., Get 10% off your first order"
                    multiline={2}
                    requiredIndicator
                  />
                  
                  <InlineStack gap="400">
                    <TextField
                      label="Discount Code"
                      value={formData.discountCode}
                      onChange={handleFieldChange("discountCode")}
                      error={errors.discountCode}
                      placeholder="e.g., SAVE10"
                      requiredIndicator
                    />
                    
                    <TextField
                      label="Discount Percentage"
                      type="number"
                      value={formData.discountPercentage.toString()}
                      onChange={(value) => handleFieldChange("discountPercentage")(parseInt(value) || 0)}
                      error={errors.discountPercentage}
                      placeholder="10"
                      suffix="%"
                      min={1}
                      max={100}
                      requiredIndicator
                    />
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Behavior Settings</Text>
                  
                  <InlineStack gap="400">
                    <TextField
                      label="Delay (seconds)"
                      type="number"
                      value={formData.delaySeconds.toString()}
                      onChange={(value) => handleFieldChange("delaySeconds")(parseInt(value) || 0)}
                      placeholder="2"
                      min={0}
                      max={30}
                      helpText="How long to wait before popup can be triggered"
                    />
                    
                    <Select
                      label="Show Frequency"
                      options={[
                        { label: "Once per session", value: "true" },
                        { label: "Every visit", value: "false" },
                      ]}
                      value={formData.showOnce.toString()}
                      onChange={(value) => handleFieldChange("showOnce")(value === "true")}
                    />
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Styling Options</Text>
                  
                  <InlineStack gap="400">
                    <TextField
                      label="Background Color"
                      value={formData.backgroundColor}
                      onChange={handleFieldChange("backgroundColor")}
                      placeholder="#ffffff"
                      type="color"
                    />
                    
                    <TextField
                      label="Text Color"
                      value={formData.textColor}
                      onChange={handleFieldChange("textColor")}
                      placeholder="#000000"
                      type="color"
                    />
                  </InlineStack>
                  
                  <InlineStack gap="400">
                    <TextField
                      label="Button Color"
                      value={formData.buttonColor}
                      onChange={handleFieldChange("buttonColor")}
                      placeholder="#008060"
                      type="color"
                    />
                    
                    <TextField
                      label="Button Text Color"
                      value={formData.buttonTextColor}
                      onChange={handleFieldChange("buttonTextColor")}
                      placeholder="#ffffff"
                      type="color"
                    />
                  </InlineStack>
                  
                  <InlineStack gap="400">
                    <TextField
                      label="Border Radius"
                      type="number"
                      value={formData.borderRadius.toString()}
                      onChange={(value) => handleFieldChange("borderRadius")(parseInt(value) || 0)}
                      placeholder="8"
                      suffix="px"
                      min={0}
                      max={50}
                    />
                    
                    <TextField
                      label="Font Size"
                      type="number"
                      value={formData.fontSize.toString()}
                      onChange={(value) => handleFieldChange("fontSize")(parseInt(value) || 16)}
                      placeholder="16"
                      suffix="px"
                      min={12}
                      max={24}
                    />
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          </FormLayout>
        </Form>
      </Modal.Section>
    </Modal>
  );
}
