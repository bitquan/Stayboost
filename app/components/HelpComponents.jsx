/**
 * StayBoost In-App Help Components
 * Provides contextual help directly in the interface for better user experience
 */

import {
    Banner,
    Button,
    Collapsible,
    Icon,
    InlineStack,
    Link,
    Text,
    Tooltip
} from "@shopify/polaris";
import { InfoIcon, QuestionCircleIcon } from "@shopify/polaris-icons";
import { useState } from "react";

// Quick Help Tooltip Component
export function HelpTooltip({ content, children }) {
  return (
    <Tooltip content={content} preferredPosition="above">
      <InlineStack gap="100" blockAlign="center">
        {children}
        <Icon source={QuestionCircleIcon} tone="subdued" />
      </InlineStack>
    </Tooltip>
  );
}

// Expandable Help Section
export function HelpSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <Button
        variant="plain"
        size="slim"
        onClick={() => setOpen(!open)}
        icon={InfoIcon}
      >
        {title}
      </Button>
      <Collapsible open={open}>
        <div style={{ padding: '12px 0' }}>
          {children}
        </div>
      </Collapsible>
    </>
  );
}

// Quick Setup Help Banner
export function QuickSetupHelp() {
  return (
    <Banner tone="info" title="New to StayBoost? Get set up in 5 minutes!">
      <Text as="p">
        1. Enable your popup below • 2. Customize your offer • 3. Add to your theme • 4. Start recovering sales!
      </Text>
      <div style={{ marginTop: '8px' }}>
        <Link url="/app/help/quick-setup" external>
          View detailed setup guide →
        </Link>
      </div>
    </Banner>
  );
}

// Settings Section Help
export function SettingsHelp() {
  return (
    <HelpSection title="How to configure your popup settings">
      <Text as="p" variant="bodyMd" tone="subdued">
        <strong>Title:</strong> Keep it short and attention-grabbing (5-8 words max)
        <br />
        <strong>Message:</strong> Clear value proposition - what's in it for them?
        <br />
        <strong>Discount:</strong> 10-15% works well for most stores
        <br />
        <strong>Delay:</strong> 2-3 seconds gives visitors time to see your content first
      </Text>
      <div style={{ marginTop: '8px' }}>
        <Link url="/app/help/best-practices" external>
          See optimization tips →
        </Link>
      </div>
    </HelpSection>
  );
}

// Analytics Help
export function AnalyticsHelp() {
  return (
    <HelpSection title="Understanding your popup performance">
      <Text as="p" variant="bodyMd" tone="subdued">
        <strong>Good conversion rate:</strong> 3-7% (5%+ is excellent)
        <br />
        <strong>Low conversions?</strong> Try different templates or better offers
        <br />
        <strong>High impressions, low conversions?</strong> Check your discount codes
        <br />
        <strong>Revenue tracking:</strong> Shows actual sales from popup users
      </Text>
      <div style={{ marginTop: '8px' }}>
        <Link url="/app/help/analytics" external>
          Learn analytics optimization →
        </Link>
      </div>
    </HelpSection>
  );
}

// Template Selection Help
export function TemplateHelp() {
  return (
    <HelpSection title="Choosing the right template">
      <Text as="p" variant="bodyMd" tone="subdued">
        <strong>First time?</strong> Start with "Classic Exit Intent" (5-7% avg conversion)
        <br />
        <strong>Sales events?</strong> Try "Urgency Timer" or "Flash Sale" templates
        <br />
        <strong>Mobile traffic?</strong> All templates are mobile-optimized
        <br />
        <strong>A/B testing:</strong> Test 2-3 templates to find your best performer
      </Text>
      <div style={{ marginTop: '8px' }}>
        <Link url="/app/help/templates" external>
          Browse all templates →
        </Link>
      </div>
    </HelpSection>
  );
}

// Theme Integration Help
export function ThemeIntegrationHelp() {
  return (
    <Banner tone="warning" title="Important: Add StayBoost to your theme">
      <Text as="p">
        Your popup won't show until you add the StayBoost block to your theme.
      </Text>
      <div style={{ marginTop: '8px' }}>
        <Text as="p" variant="bodyMd">
          <strong>Quick steps:</strong> Shopify Admin → Online Store → Themes → Customize → Add section → StayBoost Popup
        </Text>
      </div>
      <div style={{ marginTop: '8px' }}>
        <Link url="/app/help/installation" external>
          View detailed installation guide →
        </Link>
      </div>
    </Banner>
  );
}

// Success Tips Component
export function SuccessTips() {
  return (
    <HelpSection title="💡 Pro tips for better results">
      <Text as="p" variant="bodyMd" tone="subdued">
        ✅ <strong>Test on mobile:</strong> 60%+ of traffic is mobile
        <br />
        ✅ <strong>A/B testing:</strong> Can improve results by 2-3x
        <br />
        ✅ <strong>Monitor weekly:</strong> Check analytics and optimize
        <br />
        ✅ <strong>Seasonal updates:</strong> Update templates for holidays
        <br />
        ✅ <strong>Be patient:</strong> Give popups 1-2 weeks for meaningful data
      </Text>
    </HelpSection>
  );
}

// Field-specific help tooltips
export const FieldHelp = {
  title: "Keep it short and attention-grabbing. 'Wait! Don't leave yet!' works well.",
  message: "Clear value proposition. What's in it for them? Be specific about the benefit.",
  discountCode: "Must match a discount code in your Shopify admin. Create the code first, then enter it here.",
  discountPercentage: "10-15% works well for most stores. Higher percentages increase conversion but reduce margins.",
  delaySeconds: "2-3 seconds recommended. Gives visitors time to see your content before showing popup.",
  showOnce: "Prevents annoying repeat visitors. Recommended for better user experience.",
  enabled: "Toggle this to turn your popup on/off without changing settings."
};

// Main Help Navigation Component
export function HelpNavigation() {
  return (
    <div style={{ 
      padding: '16px', 
      backgroundColor: '#f6f6f7', 
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <Text as="h3" variant="headingSm" tone="subdued">
        📚 Need Help?
      </Text>
      <InlineStack gap="300" blockAlign="center">
        <Link url="/app/help" external>Quick Setup Guide</Link>
        <Link url="/app/help/faq" external>FAQ</Link>
        <Link url="/app/help/templates" external>Templates</Link>
        <Link url="/app/help/troubleshooting" external>Troubleshooting</Link>
        <Link url="mailto:support@stayboost.com" external>Contact Support</Link>
      </InlineStack>
    </div>
  );
}
