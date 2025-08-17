import {
    Badge,
    BlockStack,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    InlineStack,
    Select,
    Text
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

export function AdvancedTemplatePreview({ 
  config, 
  title = "Advanced Template Preview",
  shopBranding = null,
  onConfigChange = null,
  showControls = true,
  realTimeMode = true
}) {
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showBranding, setShowBranding] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [currentConfig, setCurrentConfig] = useState(config);

  // Real-time config updates
  useEffect(() => {
    if (realTimeMode && config !== currentConfig) {
      setCurrentConfig(config);
    }
  }, [config, realTimeMode, currentConfig]);

  if (!currentConfig) {
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
    parsedConfig = typeof currentConfig === 'string' ? JSON.parse(currentConfig) : currentConfig;
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
    delaySeconds = 2,
    showOnce = true,
  } = parsedConfig;

  // Apply merchant branding if available
  const brandedConfig = showBranding && shopBranding ? {
    ...parsedConfig,
    buttonColor: shopBranding.primaryColor || parsedConfig.buttonColor,
    backgroundColor: shopBranding.backgroundColor || parsedConfig.backgroundColor,
    textColor: shopBranding.textColor || parsedConfig.textColor,
  } : parsedConfig;

  // Preview device dimensions
  const deviceDimensions = {
    desktop: { width: '400px', height: '300px', scale: 1 },
    tablet: { width: '320px', height: '240px', scale: 0.9 },
    mobile: { width: '280px', height: '200px', scale: 0.8 }
  };

  const device = deviceDimensions[previewMode];

  const previewContainerStyle = {
    position: 'relative',
    width: device.width,
    height: device.height,
    margin: '0 auto',
    backgroundColor: '#f6f6f7',
    borderRadius: '8px',
    overflow: 'hidden',
    transform: `scale(${device.scale})`,
    transition: animationEnabled ? 'all 0.3s ease' : 'none',
    border: '1px solid #e1e3e5'
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: brandedConfig.backgroundColor || backgroundColor,
    color: brandedConfig.textColor || textColor,
    borderRadius: `${borderRadius}px`,
    fontSize: `${fontSize * device.scale}px`,
    padding: `${16 * device.scale}px`,
    maxWidth: `${280 * device.scale}px`,
    minWidth: `${200 * device.scale}px`,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    animation: animationEnabled ? 'popupAppear 0.3s ease-out' : 'none',
  };

  const buttonStyle = {
    backgroundColor: brandedConfig.buttonColor || buttonColor,
    color: brandedConfig.buttonTextColor || buttonTextColor,
    border: 'none',
    borderRadius: `${borderRadius * 0.5}px`,
    padding: `${8 * device.scale}px ${16 * device.scale}px`,
    fontSize: `${(fontSize - 2) * device.scale}px`,
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginBottom: `${8 * device.scale}px`,
    transition: animationEnabled ? 'all 0.2s ease' : 'none',
  };

  const dismissStyle = {
    backgroundColor: 'transparent',
    color: brandedConfig.textColor || textColor,
    border: `1px solid ${brandedConfig.textColor || textColor}`,
    borderRadius: `${borderRadius * 0.5}px`,
    padding: `${6 * device.scale}px ${12 * device.scale}px`,
    fontSize: `${(fontSize - 4) * device.scale}px`,
    cursor: 'pointer',
    width: '100%',
    transition: animationEnabled ? 'all 0.2s ease' : 'none',
  };

  const previewModeOptions = [
    { label: 'Desktop', value: 'desktop' },
    { label: 'Tablet', value: 'tablet' },
    { label: 'Mobile', value: 'mobile' }
  ];

  const handleConfigUpdate = useCallback((updates) => {
    if (onConfigChange) {
      const newConfig = { ...parsedConfig, ...updates };
      onConfigChange(newConfig);
      setCurrentConfig(newConfig);
    }
  }, [parsedConfig, onConfigChange]);

  return (
    <Card>
      <BlockStack gap="400">
        {/* Preview Controls */}
        {showControls && (
          <Box padding="400" paddingBlockEnd="200">
            <BlockStack gap="300">
              <Text variant="headingMd">{title}</Text>
              
              <InlineStack gap="300" align="space-between">
                <InlineStack gap="200">
                  <Select
                    label="Device"
                    labelHidden
                    options={previewModeOptions}
                    value={previewMode}
                    onChange={setPreviewMode}
                  />
                  
                  {shopBranding && (
                    <Checkbox
                      label="Apply store branding"
                      checked={showBranding}
                      onChange={setShowBranding}
                    />
                  )}
                  
                  <Checkbox
                    label="Animations"
                    checked={animationEnabled}
                    onChange={setAnimationEnabled}
                  />
                </InlineStack>
                
                <InlineStack gap="200">
                  <Badge tone={realTimeMode ? 'success' : 'info'}>
                    {realTimeMode ? 'Live Preview' : 'Static Preview'}
                  </Badge>
                  <Badge tone="info">{previewMode}</Badge>
                </InlineStack>
              </InlineStack>
            </BlockStack>
          </Box>
        )}

        <Divider />

        {/* Preview Display */}
        <Box padding="400">
          <BlockStack gap="300" align="center">
            {/* Mock browser/device frame */}
            <div style={previewContainerStyle}>
              {/* Mock website background */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#fff',
                backgroundImage: `
                  linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
                  linear-gradient(#f0f0f0 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                opacity: 0.3,
              }} />
              
              {/* Mock navigation bar for desktop */}
              {previewMode === 'desktop' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40px',
                  backgroundColor: shopBranding?.primaryColor || '#008060',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {shopBranding?.shopName || 'Your Store'}
                </div>
              )}
              
              {/* Popup Preview */}
              <div style={modalStyle}>
                <div style={{ 
                  fontSize: `${Math.min(18 * device.scale, (fontSize + 2) * device.scale)}px`, 
                  fontWeight: '600', 
                  textAlign: 'center',
                  marginBottom: `${10 * device.scale}px`,
                  lineHeight: 1.2
                }}>
                  {popupTitle}
                </div>
                
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: `${16 * device.scale}px`,
                  lineHeight: 1.4,
                  fontSize: `${(fontSize - 1) * device.scale}px`
                }}>
                  {message}
                </div>
                
                <button 
                  style={buttonStyle}
                  onMouseOver={(e) => {
                    if (animationEnabled) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (animationEnabled) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  Get {discountPercentage}% Off - {discountCode}
                </button>
                
                <button 
                  style={dismissStyle}
                  onMouseOver={(e) => {
                    if (animationEnabled) {
                      e.target.style.backgroundColor = `${brandedConfig.textColor || textColor}15`;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (animationEnabled) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  No thanks
                </button>
              </div>
              
              {/* Exit intent indicator */}
              {previewMode === 'desktop' && (
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#ff6b6b',
                  borderRadius: '50%',
                  animation: animationEnabled ? 'pulse 2s infinite' : 'none',
                  opacity: 0.7
                }} />
              )}
            </div>
            
            {/* Preview Info */}
            <BlockStack gap="200" align="center">
              <Text variant="bodyMd" tone="subdued" alignment="center">
                {previewMode === 'mobile' ? 'Mobile experience' : 
                 previewMode === 'tablet' ? 'Tablet experience' : 
                 'Desktop experience'} - This is how your popup will appear to customers
              </Text>
              
              {showBranding && shopBranding && (
                <Text variant="bodySm" tone="success" alignment="center">
                  Preview includes your store's branding colors
                </Text>
              )}
              
              <InlineStack gap="200">
                <Badge tone="info">Delay: {delaySeconds}s</Badge>
                <Badge tone={showOnce ? 'success' : 'warning'}>
                  {showOnce ? 'Show once per session' : 'Show multiple times'}
                </Badge>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Box>

        {/* Advanced Settings Preview */}
        {showControls && (
          <Box padding="400" paddingBlockStart="200">
            <BlockStack gap="300">
              <Text variant="headingSm">Preview Settings</Text>
              
              <InlineStack gap="300" wrap>
                <Button 
                  size="micro" 
                  variant="secondary"
                  onClick={() => handleConfigUpdate({ borderRadius: borderRadius + 2 })}
                >
                  + Border Radius
                </Button>
                <Button 
                  size="micro" 
                  variant="secondary"
                  onClick={() => handleConfigUpdate({ fontSize: fontSize + 1 })}
                >
                  + Font Size
                </Button>
                <Button 
                  size="micro" 
                  variant="secondary"
                  onClick={() => handleConfigUpdate({ delaySeconds: Math.max(1, delaySeconds - 1) })}
                >
                  - Delay
                </Button>
                <Button 
                  size="micro" 
                  variant="secondary"
                  onClick={() => handleConfigUpdate({ showOnce: !showOnce })}
                >
                  Toggle Show Once
                </Button>
              </InlineStack>
            </BlockStack>
          </Box>
        )}
      </BlockStack>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes popupAppear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
        }
      `}</style>
    </Card>
  );
}
