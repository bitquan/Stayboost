import { BlockStack, Box, Card, Text } from "@shopify/polaris";

export function TemplatePreview({ config, title = "Template Preview" }) {
  if (!config) {
    return (
      <Card>
        <Box padding="400">
          <Text variant="bodyMd" tone="subdued" alignment="center">
            No preview available
          </Text>
        </Box>
      </Card>
    );
  }

  let parsedConfig;
  try {
    parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
  } catch (error) {
    return (
      <Card>
        <Box padding="400">
          <Text variant="bodyMd" tone="critical" alignment="center">
            Invalid template configuration
          </Text>
        </Box>
      </Card>
    );
  }

  const {
    title: popupTitle = "Sample Title",
    message = "Sample message",
    discountCode = "SAMPLE10",
    discountPercentage = 10,
    backgroundColor = "#ffffff",
    textColor = "#000000",
    buttonColor = "#008060",
    buttonTextColor = "#ffffff",
    borderRadius = 8,
    fontSize = 16,
  } = parsedConfig;

  const modalStyle = {
    backgroundColor: backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    fontSize: `${fontSize}px`,
    padding: '20px',
    maxWidth: '360px',
    margin: '0 auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    border: '1px solid #e1e3e5',
  };

  const buttonStyle = {
    backgroundColor: buttonColor,
    color: buttonTextColor,
    border: 'none',
    borderRadius: `${Math.max(4, borderRadius - 4)}px`,
    padding: '12px 16px',
    width: '100%',
    cursor: 'pointer',
    fontSize: `${Math.max(14, fontSize - 2)}px`,
    fontWeight: '600',
  };

  const dismissStyle = {
    background: 'none',
    border: 'none',
    color: textColor,
    opacity: 0.6,
    cursor: 'pointer',
    fontSize: `${Math.max(12, fontSize - 4)}px`,
    textDecoration: 'underline',
    marginTop: '8px',
    width: '100%',
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3" alignment="center">
            {title}
          </Text>
          
          {/* Preview Container */}
          <Box style={{ 
            backgroundColor: '#f6f6f7', 
            padding: '20px', 
            borderRadius: '8px',
            position: 'relative',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Mock Browser Background */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              bottom: '10px',
              backgroundColor: '#fff',
              borderRadius: '4px',
              opacity: 0.3,
            }} />
            
            {/* Popup Preview */}
            <div style={modalStyle}>
              <div style={{ 
                fontSize: `${Math.min(20, fontSize + 4)}px`, 
                fontWeight: '600', 
                textAlign: 'center',
                marginBottom: '10px'
              }}>
                {popupTitle}
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '16px',
                lineHeight: 1.4
              }}>
                {message}
              </div>
              
              <button style={buttonStyle}>
                Get {discountPercentage}% Off - {discountCode}
              </button>
              
              <button style={dismissStyle}>
                No thanks
              </button>
            </div>
          </Box>
          
          <Text variant="bodyMd" tone="subdued" alignment="center">
            This is how your popup will appear to customers
          </Text>
        </BlockStack>
      </Box>
    </Card>
  );
}
