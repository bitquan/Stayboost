import { json } from "@remix-run/node";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Box,
    Button,
    Card,
    DataTable,
    EmptyState,
    FormLayout,
    Icon,
    InlineStack,
    Layout,
    Modal,
    Page,
    Select,
    SkeletonBodyText,
    Text,
    TextField
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, PlusIcon, StarIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useState } from "react";
import prisma from "../db.server.js";
import { authenticate } from "../shopify.server.js";

// Supported languages for template localization
const SUPPORTED_LANGUAGES = {
  en: { name: "English", nativeName: "English", rtl: false },
  es: { name: "Spanish", nativeName: "Español", rtl: false },
  fr: { name: "French", nativeName: "Français", rtl: false },
  de: { name: "German", nativeName: "Deutsch", rtl: false },
  it: { name: "Italian", nativeName: "Italiano", rtl: false },
  pt: { name: "Portuguese", nativeName: "Português", rtl: false },
  ja: { name: "Japanese", nativeName: "日本語", rtl: false },
  ko: { name: "Korean", nativeName: "한국어", rtl: false },
  zh: { name: "Chinese", nativeName: "中文", rtl: false },
  ar: { name: "Arabic", nativeName: "العربية", rtl: true },
  he: { name: "Hebrew", nativeName: "עברית", rtl: true },
  ru: { name: "Russian", nativeName: "Русский", rtl: false },
  hi: { name: "Hindi", nativeName: "हिन्दी", rtl: false },
  th: { name: "Thai", nativeName: "ไทย", rtl: false },
  tr: { name: "Turkish", nativeName: "Türkçe", rtl: false },
  nl: { name: "Dutch", nativeName: "Nederlands", rtl: false },
  sv: { name: "Swedish", nativeName: "Svenska", rtl: false },
  da: { name: "Danish", nativeName: "Dansk", rtl: false },
  no: { name: "Norwegian", nativeName: "Norsk", rtl: false },
  fi: { name: "Finnish", nativeName: "Suomi", rtl: false }
};

// Default translations for common popup elements
const DEFAULT_TRANSLATIONS = {
  en: {
    title: "Wait! Don't leave yet!",
    message: "Get 10% off your first order",
    buttonText: "Claim Offer",
    closeText: "No Thanks"
  },
  es: {
    title: "¡Espera! ¡No te vayas aún!",
    message: "Obtén 10% de descuento en tu primer pedido",
    buttonText: "Reclamar Oferta",
    closeText: "No Gracias"
  },
  fr: {
    title: "Attendez ! Ne partez pas encore !",
    message: "Obtenez 10% de réduction sur votre première commande",
    buttonText: "Réclamer l'Offre",
    closeText: "Non Merci"
  },
  de: {
    title: "Warten Sie! Gehen Sie noch nicht!",
    message: "Erhalten Sie 10% Rabatt auf Ihre erste Bestellung",
    buttonText: "Angebot Einlösen",
    closeText: "Nein Danke"
  },
  ja: {
    title: "待って！まだ離れないでください！",
    message: "初回注文で10%オフ",
    buttonText: "オファーを受け取る",
    closeText: "結構です"
  }
};

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  // Get all templates for the shop
  const templates = await prisma.popupTemplate.findMany({
    where: {
      OR: [
        { shop: session.shop },
        { isPublic: true }
      ]
    },
    include: {
      translations: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return json({
    templates,
    languages: SUPPORTED_LANGUAGES,
    initialTranslations: DEFAULT_TRANSLATIONS.en
  });
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "save_translation") {
      const templateId = parseInt(formData.get("templateId"));
      const language = formData.get("language");
      const key = formData.get("key");
      const value = formData.get("value");

      const translation = await prisma.templateTranslation.upsert({
        where: {
          templateId_language_key: {
            templateId,
            language,
            key
          }
        },
        create: {
          templateId,
          language,
          key,
          value,
          shop: session.shop
        },
        update: {
          value
        }
      });

      return json({ success: true, translation });
    }

    if (action === "auto_translate") {
      const templateId = parseInt(formData.get("templateId"));
      const targetLanguage = formData.get("targetLanguage");

      // Use default translations as auto-translation base
      const targetTranslations = DEFAULT_TRANSLATIONS[targetLanguage] || DEFAULT_TRANSLATIONS.en;

      const savedTranslations = [];
      for (const [key, value] of Object.entries(targetTranslations)) {
        const translation = await prisma.templateTranslation.upsert({
          where: {
            templateId_language_key: {
              templateId,
              language: targetLanguage,
              key
            }
          },
          create: {
            templateId,
            language: targetLanguage,
            key,
            value,
            shop: session.shop
          },
          update: {
            value
          }
        });
        savedTranslations.push(translation);
      }

      return json({ success: true, translations: savedTranslations });
    }

    if (action === "bulk_translate") {
      const templateId = parseInt(formData.get("templateId"));
      const language = formData.get("language");
      const translations = JSON.parse(formData.get("translations"));

      const savedTranslations = [];
      for (const [key, value] of Object.entries(translations)) {
        const translation = await prisma.templateTranslation.upsert({
          where: {
            templateId_language_key: {
              templateId,
              language,
              key
            }
          },
          create: {
            templateId,
            language,
            key,
            value,
            shop: session.shop
          },
          update: {
            value
          }
        });
        savedTranslations.push(translation);
      }

      return json({ success: true, translations: savedTranslations });
    }

    if (action === "delete_translation") {
      const templateId = parseInt(formData.get("templateId"));
      const language = formData.get("language");
      const key = formData.get("key");

      await prisma.templateTranslation.deleteMany({
        where: {
          templateId,
          language,
          key,
          shop: session.shop
        }
      });

      return json({ success: true });
    }

    return json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Localization action error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export default function TemplateLocalization() {
  const { templates, languages, initialTranslations } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id || null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [translations, setTranslations] = useState(initialTranslations || {});
  const [editModalActive, setEditModalActive] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [autoTranslateModalActive, setAutoTranslateModalActive] = useState(false);
  const [bulkEditModalActive, setBulkEditModalActive] = useState(false);

  const isLoading = navigation.state !== "idle";

  const loadTranslations = useCallback(() => {
    // Find template's existing translations
    const template = templates.find(t => t.id === selectedTemplate);
    if (template && template.translations) {
      const templateTranslations = {};
      template.translations
        .filter(t => t.language === selectedLanguage)
        .forEach(t => {
          templateTranslations[t.key] = t.value;
        });
      
      // Merge with defaults if empty
      const defaultTranslations = DEFAULT_TRANSLATIONS[selectedLanguage] || DEFAULT_TRANSLATIONS.en;
      setTranslations({ ...defaultTranslations, ...templateTranslations });
    } else {
      setTranslations(DEFAULT_TRANSLATIONS[selectedLanguage] || DEFAULT_TRANSLATIONS.en);
    }
  }, [selectedTemplate, selectedLanguage, templates]);

  // Load translations when template or language changes
  useEffect(() => {
    if (selectedTemplate && selectedLanguage) {
      loadTranslations();
    }
  }, [selectedTemplate, selectedLanguage, loadTranslations]);

  const handleSaveTranslation = useCallback((key, value) => {
    const formData = new FormData();
    formData.append("action", "save_translation");
    formData.append("templateId", selectedTemplate);
    formData.append("language", selectedLanguage);
    formData.append("key", key);
    formData.append("value", value);

    submit(formData, { method: "post" });
    
    // Update local state
    setTranslations(prev => ({
      ...prev,
      [key]: value
    }));
  }, [selectedTemplate, selectedLanguage, submit]);

  const handleAutoTranslate = useCallback((targetLanguage) => {
    const formData = new FormData();
    formData.append("action", "auto_translate");
    formData.append("templateId", selectedTemplate);
    formData.append("targetLanguage", targetLanguage);

    submit(formData, { method: "post" });
    
    // Update local state with defaults
    const defaultTranslations = DEFAULT_TRANSLATIONS[targetLanguage] || DEFAULT_TRANSLATIONS.en;
    setTranslations(defaultTranslations);
  }, [selectedTemplate, submit]);

  const handleBulkEdit = useCallback((bulkTranslations) => {
    const formData = new FormData();
    formData.append("action", "bulk_translate");
    formData.append("templateId", selectedTemplate);
    formData.append("language", selectedLanguage);
    formData.append("translations", JSON.stringify(bulkTranslations));

    submit(formData, { method: "post" });
    
    // Update local state
    setTranslations(prev => ({
      ...prev,
      ...bulkTranslations
    }));
  }, [selectedTemplate, selectedLanguage, submit]);

  const handleDeleteTranslation = useCallback((key) => {
    const formData = new FormData();
    formData.append("action", "delete_translation");
    formData.append("templateId", selectedTemplate);
    formData.append("language", selectedLanguage);
    formData.append("key", key);

    submit(formData, { method: "post" });
    
    // Update local state
    setTranslations(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, [selectedTemplate, selectedLanguage, submit]);

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const selectedLanguageData = languages[selectedLanguage];

  // Prepare template options
  const templateOptions = templates.map(template => ({
    label: template.name,
    value: template.id.toString()
  }));

  // Prepare language options
  const languageOptions = Object.entries(languages).map(([code, lang]) => ({
    label: `${lang.nativeName} (${lang.name})`,
    value: code
  }));

  // Prepare translations table data
  const translationRows = Object.entries(translations).map(([key, value]) => [
    <Text key={key} fontWeight="bold">{key}</Text>,
    <TextField
      key={`${key}-field`}
      value={value || ""}
      onChange={(newValue) => setTranslations(prev => ({ ...prev, [key]: newValue }))}
      onBlur={() => handleSaveTranslation(key, value)}
      placeholder={`Enter ${key} translation`}
      autoComplete="off"
    />,
    <InlineStack key={`${key}-actions`} gap="200">
      <Button
        size="micro"
        icon={EditIcon}
        onClick={() => {
          setEditingTranslation({ key, value });
          setEditModalActive(true);
        }}
      />
      <Button
        size="micro"
        icon={DeleteIcon}
        variant="primary"
        tone="critical"
        onClick={() => handleDeleteTranslation(key)}
      />
    </InlineStack>
  ]);

  const completionRate = Object.keys(translations).length > 0 
    ? Math.round((Object.values(translations).filter(v => v && v.trim()).length / Object.keys(translations).length) * 100)
    : 0;

  return (
    <Page
      title="Template Localization"
      subtitle="Translate your templates for international markets"
      primaryAction={{
        content: "Auto Translate",
        icon: StarIcon,
        onAction: () => setAutoTranslateModalActive(true),
        disabled: !selectedTemplate || selectedLanguage === "en"
      }}
      secondaryActions={[
        {
          content: "Bulk Edit",
          icon: EditIcon,
          onAction: () => setBulkEditModalActive(true),
          disabled: !selectedTemplate
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg">Translation Settings</Text>
              
              <InlineStack gap="400">
                <Box width="50%">
                  <Select
                    label="Select Template"
                    options={templateOptions}
                    value={selectedTemplate?.toString() || ""}
                    onChange={(value) => setSelectedTemplate(parseInt(value))}
                    placeholder="Choose a template to translate"
                  />
                </Box>
                
                <Box width="50%">
                  <Select
                    label="Target Language"
                    options={languageOptions}
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    placeholder="Choose target language"
                  />
                </Box>
              </InlineStack>

              {selectedTemplateData && selectedLanguageData && (
                <InlineStack gap="200" align="center">
                  <Badge tone={selectedLanguageData.rtl ? "info" : "success"}>
                    {selectedLanguageData.rtl ? "RTL Language" : "LTR Language"}
                  </Badge>
                  <Badge tone={completionRate === 100 ? "success" : completionRate > 50 ? "attention" : "critical"}>
                    {completionRate}% Complete
                  </Badge>
                  <Text>
                    Translating <Text fontWeight="bold" as="span">{selectedTemplateData.name}</Text> to{" "}
                    <Text fontWeight="bold" as="span">{selectedLanguageData.nativeName}</Text>
                  </Text>
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          {selectedTemplate && selectedLanguage ? (
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd">Translations</Text>
                  <Button
                    size="slim"
                    icon={PlusIcon}
                    onClick={() => {
                      setEditingTranslation({ key: "", value: "" });
                      setEditModalActive(true);
                    }}
                  >
                    Add Translation
                  </Button>
                </InlineStack>

                {selectedLanguage !== "en" && completionRate < 100 && (
                  <Banner title="Translation Incomplete" tone="warning">
                    <p>
                      Some translations are missing. Use the "Auto Translate" button to generate 
                      translations based on the English version, or add them manually.
                    </p>
                  </Banner>
                )}

                {isLoading ? (
                  <Card>
                    <SkeletonBodyText lines={5} />
                  </Card>
                ) : translationRows.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text"]}
                    headings={["Translation Key", "Value", "Actions"]}
                    rows={translationRows}
                  />
                ) : (
                  <EmptyState
                    heading="No translations found"
                    action={{
                      content: "Auto Translate",
                      icon: StarIcon,
                      onAction: () => setAutoTranslateModalActive(true)
                    }}
                    image="/images/empty-translations.svg"
                  >
                    <p>Start by auto-translating from English or adding translations manually.</p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>
          ) : (
            <Card>
              <EmptyState
                heading="Select a template to translate"
                image="/images/select-template.svg"
              >
                <p>Choose a template and target language to start translating.</p>
              </EmptyState>
            </Card>
          )}
        </Layout.Section>

        <Layout.Section secondary>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Supported Languages</Text>
              <BlockStack gap="200">
                {Object.entries(languages).slice(0, 8).map(([code, lang]) => (
                  <InlineStack key={code} align="space-between">
                    <InlineStack gap="200" align="center">
                      <Icon source={StarIcon} tone="subdued" />
                      <BlockStack gap="100">
                        <Text fontWeight="bold">{lang.nativeName}</Text>
                        <Text tone="subdued">{lang.name}</Text>
                      </BlockStack>
                    </InlineStack>
                    {lang.rtl && <Badge>RTL</Badge>}
                  </InlineStack>
                ))}
                {Object.keys(languages).length > 8 && (
                  <Text tone="subdued">
                    + {Object.keys(languages).length - 8} more languages supported
                  </Text>
                )}
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Translation Tips</Text>
              <BlockStack gap="200">
                <Text><Text fontWeight="bold" as="span">Auto Translation:</Text> Use the auto-translate feature for quick translations based on default templates.</Text>
                <Text><Text fontWeight="bold" as="span">Cultural Context:</Text> Consider cultural differences when translating marketing messages.</Text>
                <Text><Text fontWeight="bold" as="span">RTL Languages:</Text> Arabic and Hebrew are right-to-left languages that may need layout adjustments.</Text>
                <Text><Text fontWeight="bold" as="span">Testing:</Text> Always test your translated popups with native speakers.</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Edit Translation Modal */}
      <Modal
        open={editModalActive}
        onClose={() => setEditModalActive(false)}
        title="Edit Translation"
        primaryAction={{
          content: "Save",
          onAction: () => {
            if (editingTranslation?.key && editingTranslation?.value) {
              handleSaveTranslation(editingTranslation.key, editingTranslation.value);
              setEditModalActive(false);
            }
          }
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setEditModalActive(false)
          }
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Translation Key"
              value={editingTranslation?.key || ""}
              onChange={(value) => setEditingTranslation(prev => ({ ...prev, key: value }))}
              placeholder="e.g., title, message, buttonText"
            />
            <TextField
              label="Translated Value"
              value={editingTranslation?.value || ""}
              onChange={(value) => setEditingTranslation(prev => ({ ...prev, value }))}
              placeholder="Enter the translated text"
              multiline={3}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Auto Translate Modal */}
      <Modal
        open={autoTranslateModalActive}
        onClose={() => setAutoTranslateModalActive(false)}
        title="Auto Translate Template"
        primaryAction={{
          content: "Generate Translations",
          onAction: () => {
            handleAutoTranslate(selectedLanguage);
            setAutoTranslateModalActive(false);
          }
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setAutoTranslateModalActive(false)
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text>
              Auto-translate the template from English to{" "}
              <Text fontWeight="bold" as="span">{selectedLanguageData?.nativeName}</Text>.
            </Text>
            <Text>
              This will use default translations for common popup elements. 
              You can manually edit the translations afterward.
            </Text>
            
            <Banner title="Note" tone="info">
              <p>Auto translations are based on common e-commerce patterns and may need cultural adjustments.</p>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        open={bulkEditModalActive}
        onClose={() => setBulkEditModalActive(false)}
        title="Bulk Edit Translations"
        large
        primaryAction={{
          content: "Save All",
          onAction: () => {
            handleBulkEdit(translations);
            setBulkEditModalActive(false);
          }
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setBulkEditModalActive(false)
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text>Edit multiple translations at once for faster localization.</Text>
            
            <Card>
              <BlockStack gap="200">
                {Object.entries(translations).map(([key, value]) => (
                  <TextField
                    key={key}
                    label={key}
                    value={value || ""}
                    onChange={(newValue) => setTranslations(prev => ({ ...prev, [key]: newValue }))}
                    placeholder={`Enter ${key} translation`}
                  />
                ))}
              </BlockStack>
            </Card>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
