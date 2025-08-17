import {
    Banner,
    BlockStack,
    Box,
    Button,
    Card,
    Checkbox,
    DropZone,
    InlineStack,
    List,
    Modal,
    Text
} from "@shopify/polaris";
import { useCallback, useState } from "react";

export function TemplateImportExportModal({ 
  isOpen, 
  onClose, 
  mode, // 'import' or 'export'
  templates = [], // For export mode
  onComplete 
}) {
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [exportResults, setExportResults] = useState(null);
  const [error, setError] = useState("");

  const handleTemplateSelection = useCallback((templateId, checked) => {
    setSelectedTemplates(prev => 
      checked 
        ? [...prev, templateId]
        : prev.filter(id => id !== templateId)
    );
  }, []);

  const handleSelectAll = useCallback((checked) => {
    setSelectedTemplates(checked ? templates.map(t => t.id) : []);
  }, [templates]);

  const handleExport = useCallback(async () => {
    if (selectedTemplates.length === 0) {
      setError("Please select at least one template to export");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("action", "export");
      formData.append("templateIds", JSON.stringify(selectedTemplates));

      const response = await fetch('/api/template-import-export', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Create and download the export file
        const blob = new Blob([JSON.stringify(result.exportPackage, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportResults({
          count: result.exportPackage.templates.length,
          filename: result.filename
        });

        if (onComplete) onComplete();
      } else {
        setError(result.error || "Export failed");
      }
    } catch (error) {
      setError("Network error during export");
      console.error("Export error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplates, onComplete]);

  const handleImport = useCallback(async () => {
    if (!importFile) {
      setError("Please select a file to import");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const fileContent = await importFile.text();
      
      const formData = new FormData();
      formData.append("action", "import");
      formData.append("importData", fileContent);
      formData.append("overwriteExisting", overwriteExisting.toString());

      const response = await fetch('/api/template-import-export', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setImportResults(result.results);
        if (onComplete) onComplete();
      } else {
        setError(result.error || "Import failed");
      }
    } catch (error) {
      setError("Error reading import file");
      console.error("Import error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [importFile, overwriteExisting, onComplete]);

  const handleFileUpload = useCallback((files) => {
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setImportFile(file);
        setError("");
      } else {
        setError("Please select a valid JSON file");
      }
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTemplates([]);
    setImportFile(null);
    setImportResults(null);
    setExportResults(null);
    setError("");
    setOverwriteExisting(false);
    onClose();
  }, [onClose]);

  const renderExportContent = () => {
    if (exportResults) {
      return (
        <BlockStack gap="400">
          <Banner status="success">
            <Text>Successfully exported {exportResults.count} templates to {exportResults.filename}</Text>
          </Banner>
          <Button variant="primary" onClick={handleCloseModal}>
            Close
          </Button>
        </BlockStack>
      );
    }

    return (
      <BlockStack gap="400">
        <Text variant="headingMd">Select Templates to Export</Text>
        
        {error && (
          <Banner status="critical">
            <Text>{error}</Text>
          </Banner>
        )}

        <Card>
          <BlockStack gap="300">
            <Checkbox
              label={`Select all (${templates.length} templates)`}
              checked={selectedTemplates.length === templates.length && templates.length > 0}
              indeterminate={selectedTemplates.length > 0 && selectedTemplates.length < templates.length}
              onChange={handleSelectAll}
            />
            
            <Box paddingInlineStart="600">
              <BlockStack gap="200">
                {templates.map(template => (
                  <Checkbox
                    key={template.id}
                    label={`${template.name} (${template.category})`}
                    checked={selectedTemplates.includes(template.id)}
                    onChange={(checked) => handleTemplateSelection(template.id, checked)}
                  />
                ))}
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>

        <InlineStack gap="200">
          <Button
            variant="primary"
            onClick={handleExport}
            loading={isLoading}
            disabled={selectedTemplates.length === 0}
          >
            {isLoading ? 'Exporting...' : `Export ${selectedTemplates.length} Templates`}
          </Button>
          <Button onClick={handleCloseModal}>Cancel</Button>
        </InlineStack>
      </BlockStack>
    );
  };

  const renderImportContent = () => {
    if (importResults) {
      return (
        <BlockStack gap="400">
          <Banner status={importResults.errors.length > 0 ? "warning" : "success"}>
            <BlockStack gap="200">
              <Text>{importResults.imported} templates imported successfully</Text>
              {importResults.skipped > 0 && (
                <Text>{importResults.skipped} templates skipped (already exist)</Text>
              )}
              {importResults.errors.length > 0 && (
                <BlockStack gap="100">
                  <Text variant="headingSm">Errors:</Text>
                  <List>
                    {importResults.errors.map((error, index) => (
                      <List.Item key={index}>{error}</List.Item>
                    ))}
                  </List>
                </BlockStack>
              )}
            </BlockStack>
          </Banner>
          <Button variant="primary" onClick={handleCloseModal}>
            Close
          </Button>
        </BlockStack>
      );
    }

    return (
      <BlockStack gap="400">
        <Text variant="headingMd">Import Templates</Text>
        
        {error && (
          <Banner status="critical">
            <Text>{error}</Text>
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text variant="headingSm">Select Template File</Text>
            <DropZone onDrop={handleFileUpload} accept=".json">
              <DropZone.FileUpload />
            </DropZone>
            
            {importFile && (
              <Text>Selected file: {importFile.name}</Text>
            )}

            <Checkbox
              label="Overwrite existing templates with same name"
              checked={overwriteExisting}
              onChange={setOverwriteExisting}
              helpText="If unchecked, templates with existing names will be skipped"
            />
          </BlockStack>
        </Card>

        <InlineStack gap="200">
          <Button
            variant="primary"
            onClick={handleImport}
            loading={isLoading}
            disabled={!importFile}
          >
            {isLoading ? 'Importing...' : 'Import Templates'}
          </Button>
          <Button onClick={handleCloseModal}>Cancel</Button>
        </InlineStack>
      </BlockStack>
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleCloseModal}
      title={mode === 'export' ? 'Export Templates' : 'Import Templates'}
      large
    >
      <Modal.Section>
        {mode === 'export' ? renderExportContent() : renderImportContent()}
      </Modal.Section>
    </Modal>
  );
}
