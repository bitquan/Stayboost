/**
 * Polaris compatibility layer for Stack component
 * Temporary wrapper to fix Vite import issues
 */

// Import the LegacyStack component using the default export pattern
import polaris from '@shopify/polaris';

// Re-export Stack using the compatibility pattern
export const Stack = polaris.LegacyStack;

// Also export other commonly used components that might have similar issues
export const { 
  Badge,
  Banner,
  Button,
  Card,
  DataTable,
  Divider,
  Form,
  FormLayout,
  Layout,
  List,
  Modal,
  Page,
  ProgressBar,
  Select,
  Spinner,
  Text,
  TextContainer,
  Checkbox,
  TextField,
  EmptyState,
  Icon,
  InlineStack,
  BlockStack
} = polaris;
