// Environment Configuration Admin Route
import { json } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Card,
    DataTable,
    InlineStack,
    Layout,
    Page,
    Text,
    TextContainer,
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { ENV_DEFINITIONS } from "../constants/envDefinitions.js";
import {
    createTimer,
    log,
    LOG_CATEGORIES,
    logError,
    logRequest
} from "../utils/logger.server";

// Loader to get environment validation status
export async function loader({ request }) {
    // Import server-only functions dynamically in the loader
    const { getEnvironmentValidator } = await import("../utils/envValidation.server");
    
    const timer = createTimer('env_config_loader', LOG_CATEGORIES.API);
    const correlationId = logRequest(request);

    try {
        timer.checkpoint('validation_start');
        
        const validator = getEnvironmentValidator();
        const validationResults = validator.validateAll();
        const configReport = validator.generateConfigReport();
        
        timer.checkpoint('validation_complete');

        log.info('Environment configuration accessed', {
            valid: validationResults.valid,
            errors: validationResults.errors.length,
            warnings: validationResults.warnings.length,
            correlationId,
            category: LOG_CATEGORIES.SYSTEM,
        });

        return json({
            validation: validationResults,
            config: configReport,
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
        });

    } catch (error) {
        timer.checkpoint('error');
        
        logError(error, {
            operation: 'env_config_loader',
            correlationId,
            category: LOG_CATEGORIES.ERROR,
        });

        return json(
            { error: 'Failed to load environment configuration' },
            { status: 500 }
        );
    } finally {
        timer.end();
    }
}

// Action to re-validate environment
export async function action({ request }) {
    // Import server-only functions dynamically in the action
    const { validateEnvironmentOnStartup } = await import("../utils/envValidation.server");
    
    const timer = createTimer('env_config_action', LOG_CATEGORIES.API);
    const correlationId = logRequest(request);

    try {
        if (request.method !== 'POST') {
            return json({ error: 'Method not allowed' }, { status: 405 });
        }

        timer.checkpoint('revalidation_start');
        
        // Force re-validation
        const results = validateEnvironmentOnStartup();
        
        timer.checkpoint('revalidation_complete');

        log.info('Environment re-validation completed', {
            valid: results.valid,
            errors: results.errors.length,
            correlationId,
            category: LOG_CATEGORIES.SYSTEM,
        });

        return json({
            success: true,
            validation: results,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        timer.checkpoint('error');
        
        logError(error, {
            operation: 'env_config_action',
            correlationId,
            category: LOG_CATEGORIES.ERROR,
        });

        return json(
            { error: 'Failed to re-validate environment' },
            { status: 500 }
        );
    } finally {
        timer.end();
    }
}

// Environment Configuration Page Component
export default function EnvironmentConfig() {
    const data = useLoaderData();
    const revalidator = useRevalidator();
    const [isRevalidating, setIsRevalidating] = useState(false);

    const handleRevalidate = useCallback(async () => {
        setIsRevalidating(true);
        try {
            const response = await fetch('/app/env-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (response.ok) {
                revalidator.revalidate();
            }
        } catch (error) {
            console.error('Failed to revalidate environment:', error);
        } finally {
            setIsRevalidating(false);
        }
    }, [revalidator]);

    const { validation, config } = data;

    // Create table rows for environment variables
    const configRows = Object.entries(config.variables).map(([varName, varConfig]) => {
        const definition = ENV_DEFINITIONS[varName];
        
        return [
            varName,
            varConfig.description || 'No description',
            varConfig.required ? 'Yes' : 'No',
            varConfig.configured ? (
                <Badge status="success">Configured</Badge>
            ) : varConfig.defaultUsed ? (
                <Badge status="warning">Default Used</Badge>
            ) : (
                <Badge status="critical">Missing</Badge>
            ),
            varConfig.configured || varConfig.defaultUsed ? 
                (definition?.sensitive ? '[REDACTED]' : (varConfig.value || 'N/A')) : 
                'Not Set',
        ];
    });

    const validationRows = validation.errors.map((error, index) => [
        error.variable,
        error.error,
        <Badge key={`badge-${index}`} status="critical">{error.severity}</Badge>,
        'Fix Required',
    ]);

    return (
        <Page
            title="Environment Configuration"
            subtitle="Validate and manage environment variables"
            primaryAction={{
                content: 'Re-validate',
                onAction: handleRevalidate,
                loading: isRevalidating,
            }}
        >
            <Layout>
                <Layout.Section>
                    {/* Validation Status Banner */}
                    {!validation.valid && (
                        <Banner
                            status="critical"
                            title="Environment validation failed"
                        >
                            <Text>
                                {validation.errors.length} error(s) found in environment configuration. 
                                Please fix these issues for optimal operation.
                            </Text>
                        </Banner>
                    )}

                    {validation.valid && validation.warnings.length > 0 && (
                        <Banner
                            status="warning"
                            title="Environment warnings"
                        >
                            <Text>
                                {validation.warnings.length} warning(s) found. Using default values 
                                where configuration is missing.
                            </Text>
                        </Banner>
                    )}

                    {validation.valid && validation.warnings.length === 0 && (
                        <Banner
                            status="success"
                            title="Environment validation passed"
                        >
                            <Text>All environment variables are properly configured.</Text>
                        </Banner>
                    )}
                </Layout.Section>

                <Layout.Section>
                    {/* Configuration Summary */}
                    <Card title="Configuration Summary">
                        <InlineStack gap="4" distribution="equalSpacing">
                            <BlockStack gap="2">
                                <Text variant="headingMd">Total Variables</Text>
                                <Text variant="bodyLg" tone="subdued">
                                    {config.summary.total}
                                </Text>
                            </BlockStack>
                            <BlockStack gap="2">
                                <Text variant="headingMd">Configured</Text>
                                <Text variant="bodyLg" tone="success">
                                    {config.summary.configured}
                                </Text>
                            </BlockStack>
                            <BlockStack gap="2">
                                <Text variant="headingMd">Using Defaults</Text>
                                <Text variant="bodyLg" tone="warning">
                                    {config.summary.defaults}
                                </Text>
                            </BlockStack>
                            <BlockStack gap="2">
                                <Text variant="headingMd">Missing</Text>
                                <Text variant="bodyLg" tone="critical">
                                    {config.summary.missing}
                                </Text>
                            </BlockStack>
                        </InlineStack>
                    </Card>
                </Layout.Section>

                {/* Validation Errors */}
                {validation.errors.length > 0 && (
                    <Layout.Section>
                        <Card title="Validation Errors">
                            <DataTable
                                columnContentTypes={['text', 'text', 'text', 'text']}
                                headings={['Variable', 'Error', 'Severity', 'Action Required']}
                                rows={validationRows}
                            />
                        </Card>
                    </Layout.Section>
                )}

                {/* Environment Variables Table */}
                <Layout.Section>
                    <Card title="Environment Variables">
                        <DataTable
                            columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                            headings={['Variable', 'Description', 'Required', 'Status', 'Value']}
                            rows={configRows}
                        />
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card title="Environment Information">
                        <TextContainer>
                            <Text variant="bodyMd">
                                <strong>Environment:</strong> {config.environment}
                            </Text>
                            <Text variant="bodyMd">
                                <strong>Last Validation:</strong> {new Date(data.timestamp).toLocaleString()}
                            </Text>
                            <Text variant="bodyMd">
                                <strong>Node.js Version:</strong> {data.nodeVersion}
                            </Text>
                        </TextContainer>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
