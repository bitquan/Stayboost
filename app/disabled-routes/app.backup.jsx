import { useLoaderData } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    Checkbox,
    DataTable,
    Form,
    FormLayout,
    InlineStack,
    Layout,
    Modal,
    Page,
    Select,
    Text,
    TextContainer,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

export default function BackupManagement() {
  const initialData = useLoaderData();
  
  const [backupStatus, setBackupStatus] = useState(initialData?.status || {});
  const [backups, setBackups] = useState(initialData?.backups || []);
  const [config, setConfig] = useState(initialData?.config || {});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Refresh functions
  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/backup?action=status');
      const data = await response.json();
      setBackupStatus(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh backup status:', error);
    }
  }, []);

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  const refreshBackups = useCallback(async () => {
    try {
      const response = await fetch('/api/backup?action=list');
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Failed to refresh backups:', error);
    }
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/backup?action=config');
      const data = await response.json();
      setConfig(data.config || {});
    } catch (error) {
      console.error('Failed to refresh config:', error);
    }
  }, []);

  // Create backup handler
  const handleCreateBackup = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsCreateModalOpen(false);
        await refreshBackups();
        await refreshStatus();
      } else {
        console.error('Backup creation failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshBackups, refreshStatus]);

  // Update schedule handler
  const handleUpdateSchedule = useCallback(async (scheduleConfig) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'schedule', 
          ...scheduleConfig 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsConfigModalOpen(false);
        await refreshConfig();
        await refreshStatus();
      } else {
        console.error('Schedule update failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshConfig, refreshStatus]);

  // Cleanup backups handler
  const handleCleanupBackups = useCallback(async (retentionDays = 30) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cleanup', 
          retentionDays 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await refreshBackups();
      } else {
        console.error('Cleanup failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshBackups]);

  // Format backup data for table
  const backupTableRows = backups.map((backup, index) => [
    backup.name,
    <Badge key={`status-${index}`} status={backup.metadata?.status === 'completed' ? 'success' : 'attention'}>
      {backup.metadata?.status || 'unknown'}
    </Badge>,
    backup.type === 'compressed' ? 'Compressed' : 'Directory',
    backup.sizeFormatted || formatBytes(backup.size),
    <Badge key={`validated-${index}`} status={backup.metadata?.validated ? 'success' : 'attention'}>
      {backup.metadata?.validated ? 'Validated' : 'Not Validated'}
    </Badge>,
    new Date(backup.createdAt).toLocaleString(),
  ]);

  const statusColor = backupStatus.scheduler?.isRunning ? 'success' : 'critical';
  const statusText = backupStatus.scheduler?.isRunning ? 'Running' : 'Stopped';

  return (
    <Page
      title="Backup Management"
      primaryAction={{
        content: "Create Backup",
        onAction: () => setIsCreateModalOpen(true),
        loading: isLoading,
        disabled: backupStatus.manager?.isRunning,
      }}
      secondaryActions={[
        {
          content: "Configure Schedule",
          onAction: () => setIsConfigModalOpen(true),
        },
        {
          content: "Refresh",
          onAction: () => {
            refreshStatus();
            refreshBackups();
            refreshConfig();
          },
        },
      ]}
    >
      <Layout>
        {/* Status Overview */}
        <Layout.Section>
          <Card title="Backup Status" sectioned>
            <InlineStack gap="800">
              <div style={{ flex: 1 }}>
                <BlockStack gap="300">
                  <InlineStack gap="200">
                    <Text variant="headingMd">Scheduler Status:</Text>
                    <Badge status={statusColor}>{statusText}</Badge>
                  </InlineStack>
                  
                  {backupStatus.scheduler?.lastBackupAt && (
                    <Text variant="bodyMd">
                      Last Backup: {new Date(backupStatus.scheduler.lastBackupAt).toLocaleString()}
                    </Text>
                  )}
                  
                  {backupStatus.scheduler?.nextBackupAt && (
                    <Text variant="bodyMd">
                      Next Backup: {new Date(backupStatus.scheduler.nextBackupAt).toLocaleString()}
                    </Text>
                  )}
                  
                  {backupStatus.manager?.isRunning && (
                    <Banner status="info">
                      <Text>Backup currently in progress...</Text>
                    </Banner>
                  )}
                </BlockStack>
              </div>
              
              <div>
                <BlockStack gap="300">
                  <Text variant="headingMd">Statistics</Text>
                  <Text variant="bodyMd">
                    Total Backups: {backupStatus.scheduler?.stats?.totalBackups || 0}
                  </Text>
                  <Text variant="bodyMd">
                    Successful: {backupStatus.scheduler?.stats?.successfulBackups || 0}
                  </Text>
                  <Text variant="bodyMd">
                    Failed: {backupStatus.scheduler?.stats?.failedBackups || 0}
                  </Text>
                </BlockStack>
              </div>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Configuration Overview */}
        <Layout.Section>
          <Card title="Configuration" sectioned>
            <InlineStack gap="400" distribution="equalSpacing">
              <Text variant="bodyMd">
                <strong>Frequency:</strong> {config.frequency || 'daily'}
              </Text>
              <Text variant="bodyMd">
                <strong>Retention:</strong> {config.retentionDays || 30} days
              </Text>
              <Text variant="bodyMd">
                <strong>Compression:</strong> {config.compression ? 'Enabled' : 'Disabled'}
              </Text>
              <Button onClick={() => handleCleanupBackups(config.retentionDays)}>
                Cleanup Old Backups
              </Button>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Backup List */}
        <Layout.Section>
          <Card title="Available Backups" sectioned>
            {backups.length > 0 ? (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['Name', 'Status', 'Type', 'Size', 'Validated', 'Created']}
                rows={backupTableRows}
              />
            ) : (
              <Banner status="info">
                <Text>No backups available. Create your first backup to get started.</Text>
              </Banner>
            )}
          </Card>
        </Layout.Section>

        {/* Last Updated */}
        <Layout.Section>
          <Text variant="bodySm" color="subdued">
            Last updated: {lastUpdated.toLocaleString()}
          </Text>
        </Layout.Section>
      </Layout>

      {/* Create Backup Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Backup"
        primaryAction={{
          content: "Create Backup",
          onAction: handleCreateBackup,
          loading: isLoading,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsCreateModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <Text variant="bodyMd">
              This will create a full backup of your StayBoost application including:
            </Text>
            <ul>
              <li>Database (all popup settings and configurations)</li>
              <li>Application data and metadata</li>
              <li>Backup manifest for validation</li>
            </ul>
            <Text variant="bodyMd">
              The backup will be compressed and stored in your configured backup directory.
            </Text>
          </TextContainer>
        </Modal.Section>
      </Modal>

      {/* Configure Schedule Modal */}
      <ConfigureScheduleModal
        open={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleUpdateSchedule}
        currentConfig={config}
        isLoading={isLoading}
      />
    </Page>
  );
}

// Schedule Configuration Modal Component
function ConfigureScheduleModal({ open, onClose, onSave, currentConfig, isLoading }) {
  const [frequency, setFrequency] = useState(currentConfig.frequency || 'daily');
  const [enabled, setEnabled] = useState(currentConfig.enabled !== false);
  const [retentionDays, setRetentionDays] = useState(currentConfig.retentionDays || 30);

  const frequencyOptions = [
    { label: 'Hourly', value: 'hourly' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  const handleSave = () => {
    onSave({
      frequency,
      enabled,
      retentionDays: parseInt(retentionDays),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configure Backup Schedule"
      primaryAction={{
        content: "Save Configuration",
        onAction: handleSave,
        loading: isLoading,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Form onSubmit={handleSave}>
          <FormLayout>
            <Checkbox
              label="Enable automatic backups"
              checked={enabled}
              onChange={setEnabled}
            />
            
            <Select
              label="Backup frequency"
              options={frequencyOptions}
              value={frequency}
              onChange={setFrequency}
              disabled={!enabled}
            />
            
            <Select
              label="Retention period (days)"
              options={[
                { label: '7 days', value: '7' },
                { label: '14 days', value: '14' },
                { label: '30 days', value: '30' },
                { label: '60 days', value: '60' },
                { label: '90 days', value: '90' },
              ]}
              value={retentionDays.toString()}
              onChange={(value) => setRetentionDays(parseInt(value))}
            />
          </FormLayout>
        </Form>
      </Modal.Section>
    </Modal>
  );
}

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Loader function to fetch initial data
export async function loader() {
  // In a real app, you'd fetch this data from your backup API
  // For now, return mock data structure
  return {
    status: {
      scheduler: {
        isRunning: false,
        lastBackupAt: null,
        nextBackupAt: null,
        stats: {
          totalBackups: 0,
          successfulBackups: 0,
          failedBackups: 0,
        },
      },
      manager: {
        isRunning: false,
      },
    },
    backups: [],
    config: {
      enabled: true,
      frequency: 'daily',
      retentionDays: 30,
      compression: true,
    },
  };
}
