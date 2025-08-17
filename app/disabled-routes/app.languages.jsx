import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    DataTable,
    FormLayout,
    InlineStack,
    Layout,
    Modal,
    Page,
    Select,
    Tabs,
    Text
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";

/**
 * Multi-language Support Management
 * Priority #18 - Internationalization for global stores
 */

// Dynamic import for server-side i18n functions
async function getI18nModule() {
  const module = await import("../utils/i18n.server.js");
  return module;
}

export async function loader({ request }) {
  await authenticate.admin(request);

  try {
    const { createI18nManager, SUPPORTED_LANGUAGES, TRANSLATION_NAMESPACES } = await getI18nModule();
    const url = new URL(request.url);
    const currentLang = url.searchParams.get('lang') || 'en';
    
    const i18n = createI18nManager(currentLang);
    const availableLanguages = i18n.getAvailableLanguages();
    const languageSwitcherData = i18n.getLanguageSwitcherData();
    
    // Get translations for current language
    const translations = i18n.exportTranslations(currentLang);
    
    return json({
      currentLanguage: currentLang,
      availableLanguages,
      languageSwitcherData,
      translations,
      supportedLanguages: Object.values(SUPPORTED_LANGUAGES),
      namespaces: Object.values(TRANSLATION_NAMESPACES)
    });

  } catch (error) {
    console.error('I18n loader error:', error);
    return json(
      { error: 'Failed to load language data' },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  await authenticate.admin(request);

  try {
    const { createI18nManager } = await getI18nModule();
    const formData = await request.formData();
    const action = formData.get("action");
    
    const i18n = createI18nManager();

    switch (action) {
      case "update_translation": {
        const languageCode = formData.get("languageCode");
        const namespace = formData.get("namespace");
        const key = formData.get("key");
        const value = formData.get("value");
        
        // In production, this would update the database
        // For now, we'll simulate the update
        console.log(`Updating translation: ${languageCode}.${namespace}.${key} = ${value}`);
        
        return json({ 
          success: true, 
          message: `Translation updated for ${languageCode}` 
        });
      }

      case "add_language": {
        const languageCode = formData.get("languageCode");
        
        // Check if language is supported
        if (!i18n.isLanguageSupported(languageCode)) {
          return json({ 
            error: `Language ${languageCode} is not supported` 
          }, { status: 400 });
        }
        
        // In production, this would enable the language for the store
        return json({ 
          success: true, 
          message: `Language ${languageCode} added successfully` 
        });
      }

      case "set_default_language": {
        const languageCode = formData.get("languageCode");
        
        // In production, this would update the store's default language
        return json({ 
          success: true, 
          message: `Default language set to ${languageCode}` 
        });
      }

      case "export_translations": {
        const languageCode = formData.get("languageCode");
        const namespace = formData.get("namespace");
        
        const translations = i18n.exportTranslations(languageCode, namespace ? [namespace] : null);
        
        return json({ 
          success: true, 
          translations,
          filename: `translations_${languageCode}_${namespace || 'all'}.json`
        });
      }

      case "test_popup_translation": {
        const languageCode = formData.get("languageCode");
        const i18nTest = createI18nManager(languageCode);
        
        const testPopup = {
          title: i18nTest.t('defaultTitle', {}, 'popup'),
          message: i18nTest.t('defaultMessage', {}, 'popup'),
          claimButton: i18nTest.t('claimOffer', {}, 'popup'),
          dismissButton: i18nTest.t('dismiss', {}, 'popup'),
          emailPlaceholder: i18nTest.t('emailPlaceholder', {}, 'popup')
        };
        
        return json({ 
          success: true, 
          testPopup,
          language: i18nTest.getLanguageConfig()
        });
      }

      default:
        return json({ error: "Unknown action" }, { status: 400 });
    }

  } catch (error) {
    console.error('I18n action error:', error);
    return json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    );
  }
}

export default function LanguageManagement() {
  const data = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();

  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(data.currentLanguage);
  const [selectedNamespace, setSelectedNamespace] = useState('popup');
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Language selection handler
  const handleLanguageChange = useCallback((languageCode) => {
    setSelectedLanguage(languageCode);
    const url = new URL(window.location);
    url.searchParams.set('lang', languageCode);
    window.location.href = url.toString();
  }, []);

  // Test popup translation
  const handleTestPopup = useCallback((languageCode) => {
    const formData = new FormData();
    formData.append("action", "test_popup_translation");
    formData.append("languageCode", languageCode);
    
    fetcher.submit(formData, { method: "post" });
    setShowTestModal(true);
  }, [fetcher]);

  // Set default language
  const handleSetDefault = useCallback((languageCode) => {
    const formData = new FormData();
    formData.append("action", "set_default_language");
    formData.append("languageCode", languageCode);
    
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  // Add new language
  const handleAddLanguage = useCallback((languageCode) => {
    const formData = new FormData();
    formData.append("action", "add_language");
    formData.append("languageCode", languageCode);
    
    fetcher.submit(formData, { method: "post" });
    setShowAddLanguageModal(false);
  }, [fetcher]);

  // Update test results when fetcher data changes
  if (fetcher.data?.testPopup && !testResults) {
    setTestResults(fetcher.data);
  }

  // Prepare languages table data
  const languageRows = data.supportedLanguages.map((lang, index) => [
    <InlineStack key={`lang-${index}-name`} gap="200">
      <Text>{lang.flag}</Text>
      <div>
        <Text variant="bodyMd">{lang.name}</Text>
        <br />
        <Text variant="bodySm" color="subdued">{lang.nativeName}</Text>
      </div>
    </InlineStack>,
    lang.code,
    <Badge key={`lang-${index}-badge`} status={lang.rtl ? "info" : "success"}>
      {lang.rtl ? "RTL" : "LTR"}
    </Badge>,
    lang.dateFormat,
    <InlineStack key={`lang-${index}-actions`} gap="200">
      <Button size="slim" onClick={() => handleTestPopup(lang.code)}>
        Test
      </Button>
      <Button size="slim" onClick={() => handleSetDefault(lang.code)}>
        Set Default
      </Button>
    </InlineStack>
  ]);

  // Prepare translations data for current namespace
  const currentTranslations = data.translations[selectedNamespace] || {};
  const translationRows = Object.entries(currentTranslations).map(([key, value], index) => [
    key,
    <Text key={`trans-${index}-value`} truncate>{value}</Text>,
    <InlineStack key={`trans-${index}-actions`} gap="200">
      <Button size="slim">Edit</Button>
    </InlineStack>
  ]);

  const tabs = [
    {
      id: 'overview',
      content: 'Language Overview',
      panel: (
        <BlockStack gap="400">
          {/* Current Language Status */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Current Language Settings</Text>
              <InlineStack gap="800" distribution="equalSpacing">
                <div>
                  <Text variant="bodyMd">Active Language</Text>
                  <Text variant="headingLg">
                    {data.languageSwitcherData.find(l => l.active)?.flag} {' '}
                    {data.languageSwitcherData.find(l => l.active)?.name}
                  </Text>
                </div>
                <div>
                  <Text variant="bodyMd">Available Languages</Text>
                  <Text variant="headingLg">{data.availableLanguages.length}</Text>
                </div>
                <div>
                  <Text variant="bodyMd">Translation Coverage</Text>
                  <Text variant="headingLg">85%</Text>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Language Switcher Preview */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Language Switcher</Text>
              <InlineStack gap="200">
                {data.languageSwitcherData.map(lang => (
                  <Button
                    key={lang.code}
                    variant={lang.active ? "primary" : "secondary"}
                    size="slim"
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    {lang.flag} {lang.name}
                  </Button>
                ))}
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Quick Actions */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Quick Actions</Text>
              <InlineStack gap="200">
                <Button onClick={() => setShowAddLanguageModal(true)}>
                  Add Language
                </Button>
                <Button variant="secondary">Export Translations</Button>
                <Button variant="secondary">Import Translations</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      )
    },
    {
      id: 'languages',
      content: 'Manage Languages',
      panel: (
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Supported Languages</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['Language', 'Code', 'Direction', 'Date Format', 'Actions']}
              rows={languageRows}
            />
          </BlockStack>
        </Card>
      )
    },
    {
      id: 'translations',
      content: 'Edit Translations',
      panel: (
        <BlockStack gap="400">
          {/* Namespace Selector */}
          <Card>
            <InlineStack gap="400" distribution="equalSpacing">
              <Select
                label="Namespace"
                options={data.namespaces.map(ns => ({ label: ns, value: ns }))}
                value={selectedNamespace}
                onChange={setSelectedNamespace}
              />
              <Select
                label="Language"
                options={data.availableLanguages.map(lang => ({ 
                  label: `${lang.flag} ${lang.name}`, 
                  value: lang.code 
                }))}
                value={selectedLanguage}
                onChange={handleLanguageChange}
              />
            </InlineStack>
          </Card>

          {/* Translations Table */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">
                Translations: {selectedNamespace} ({selectedLanguage})
              </Text>
              {translationRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={['Key', 'Translation', 'Actions']}
                  rows={translationRows}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text variant="headingMd">No translations found</Text>
                  <Text>Add translations for this namespace and language</Text>
                </div>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      )
    }
  ];

  return (
    <Page
      title="Language Management"
      subtitle="Manage multi-language support for your popup"
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

      {/* Add Language Modal */}
      <Modal
        open={showAddLanguageModal}
        onClose={() => setShowAddLanguageModal(false)}
        title="Add New Language"
        primaryAction={{
          content: "Add Language",
          onAction: () => handleAddLanguage('de') // This would be dynamic
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowAddLanguageModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Select Language"
              options={data.supportedLanguages
                .filter(lang => !data.availableLanguages.find(al => al.code === lang.code))
                .map(lang => ({
                  label: `${lang.flag} ${lang.name} (${lang.nativeName})`,
                  value: lang.code
                }))}
              placeholder="Choose a language to add"
            />
            <Text variant="bodyMd">
              Adding a new language will create translation entries that you can customize.
            </Text>
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Test Results Modal */}
      <Modal
        open={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setTestResults(null);
        }}
        title="Popup Translation Test"
        large
      >
        <Modal.Section>
          {testResults && (
            <BlockStack gap="400">
              <InlineStack gap="400" distribution="equalSpacing">
                <div>
                  <Text variant="headingMd">Language</Text>
                  <Text>{testResults.language.flag} {testResults.language.name}</Text>
                </div>
                <div>
                  <Text variant="headingMd">Direction</Text>
                  <Text>{testResults.language.rtl ? 'Right-to-Left' : 'Left-to-Right'}</Text>
                </div>
              </InlineStack>

              {/* Popup Preview */}
              <Card>
                <div style={{
                  padding: '30px',
                  backgroundColor: '#f6f6f7',
                  borderRadius: '8px',
                  textAlign: 'center',
                  direction: testResults.language.rtl ? 'rtl' : 'ltr'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '24px' }}>
                    {testResults.testPopup.title}
                  </h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>
                    {testResults.testPopup.message}
                  </p>
                  <input 
                    type="email" 
                    placeholder={testResults.testPopup.emailPlaceholder}
                    style={{
                      width: '100%',
                      padding: '12px',
                      margin: '0 0 15px 0',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '4px'
                    }}>
                      {testResults.testPopup.claimButton}
                    </button>
                    <button style={{
                      backgroundColor: '#fff',
                      color: '#000',
                      padding: '12px 24px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}>
                      {testResults.testPopup.dismissButton}
                    </button>
                  </div>
                </div>
              </Card>
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
