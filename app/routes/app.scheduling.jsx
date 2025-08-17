import { json } from "@remix-run/node";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
    Badge,
    BlockStack,
    Box,
    Button,
    Card,
    DataTable,
    DatePicker,
    EmptyState,
    FormLayout,
    Icon,
    InlineStack,
    Layout,
    Modal,
    Page,
    Select,
    Text,
    TextField
} from "@shopify/polaris";
import { CalendarIcon, ClockIcon, DeleteIcon, EditIcon, PlusIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import prisma from "../db.server.js";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Get all templates for scheduling
    const templates = await prisma.popupTemplate.findMany({
      where: {
        OR: [
          { shop: session.shop },
          { shop: null } // Built-in templates
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        templateType: true
      },
      orderBy: [
        { templateType: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // Get existing schedules
    const schedules = await prisma.templateSchedule.findMany({
      where: { shop: session.shop },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            templateType: true
          }
        },
        activations: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: [
        { priority: 'desc' },
        { startDate: 'asc' }
      ]
    });
    
    // Calculate schedule statistics
    const now = new Date();
    const activeSchedules = schedules.filter(schedule => 
      schedule.isActive && 
      schedule.startDate <= now && 
      (!schedule.endDate || schedule.endDate >= now)
    );
    
    const upcomingSchedules = schedules.filter(schedule => 
      schedule.isActive && schedule.startDate > now
    );
    
    const completedSchedules = schedules.filter(schedule => 
      schedule.endDate && schedule.endDate < now
    );
    
    return json({
      templates,
      schedules,
      statistics: {
        total: schedules.length,
        active: activeSchedules.length,
        upcoming: upcomingSchedules.length,
        completed: completedSchedules.length
      }
    });
  } catch (error) {
    console.error('Template scheduling loader error:', error);
    return json({ 
      templates: [], 
      schedules: [], 
      statistics: { total: 0, active: 0, upcoming: 0, completed: 0 }
    });
  }
};

// Campaign types for template scheduling
const CAMPAIGN_TYPES = {
  seasonal: 'Seasonal Campaign',
  sale: 'Sale/Promotion',
  event: 'Special Event',
  promotion: 'Marketing Promotion',
  test: 'Testing Campaign',
  holiday: 'Holiday Campaign',
  flash_sale: 'Flash Sale',
  clearance: 'Clearance Sale',
  new_product: 'New Product Launch',
  back_to_school: 'Back to School',
  black_friday: 'Black Friday',
  cyber_monday: 'Cyber Monday',
  christmas: 'Christmas',
  valentines: 'Valentine\'s Day',
  mothers_day: 'Mother\'s Day',
  fathers_day: 'Father\'s Day',
  summer: 'Summer Campaign',
  spring: 'Spring Campaign',
  fall: 'Fall Campaign',
  winter: 'Winter Campaign'
};

const SCHEDULE_TYPES = {
  one_time: 'One-time Campaign',
  recurring: 'Recurring Campaign',
  campaign: 'Campaign Period',
  event: 'Event-based'
};

const CONFLICT_RESOLUTIONS = {
  higher_priority: 'Higher Priority Wins',
  latest: 'Latest Schedule Wins',
  first: 'First Schedule Wins',
  merge: 'Merge Schedules'
};

export default function TemplateScheduling() {
  const { templates, schedules, statistics } = useLoaderData();
  const navigation = useNavigation();
  const submit = useSubmit();
  
  const [modalActive, setModalActive] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [campaignType, setCampaignType] = useState('seasonal');
  const [scheduleType, setScheduleType] = useState('one_time');
  const [startDate, setStartDate] = useState({ start: new Date(), end: new Date() });
  const [endDate, setEndDate] = useState({ start: new Date(), end: new Date() });
  const [hasEndDate, setHasEndDate] = useState(true);
  const [priority, setPriority] = useState('0');
  const [autoActivate, setAutoActivate] = useState(true);
  const [conflictResolution, setConflictResolution] = useState('higher_priority');
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(false);
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  const isLoading = navigation.state !== 'idle' || loading;

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Get status badge variant
  const getStatusBadge = (schedule) => {
    const now = new Date();
    const start = new Date(schedule.startDate);
    const end = schedule.endDate ? new Date(schedule.endDate) : null;

    if (!schedule.isActive) {
      return { status: 'attention', children: 'Inactive' };
    }
    
    if (start > now) {
      return { status: 'info', children: 'Upcoming' };
    }
    
    if (start <= now && (!end || end >= now)) {
      return { status: 'success', children: 'Active' };
    }
    
    if (end && end < now) {
      return { status: 'subdued', children: 'Completed' };
    }
    
    return { status: 'subdued', children: 'Unknown' };
  };

  // Get campaign type badge variant
  const getCampaignBadge = (campaignType) => {
    const urgentTypes = ['flash_sale', 'black_friday', 'cyber_monday'];
    const eventTypes = ['christmas', 'valentines', 'mothers_day', 'fathers_day'];
    const seasonalTypes = ['summer', 'spring', 'fall', 'winter'];
    
    if (urgentTypes.includes(campaignType)) {
      return { status: 'critical', children: CAMPAIGN_TYPES[campaignType] };
    }
    
    if (eventTypes.includes(campaignType)) {
      return { status: 'warning', children: CAMPAIGN_TYPES[campaignType] };
    }
    
    if (seasonalTypes.includes(campaignType)) {
      return { status: 'info', children: CAMPAIGN_TYPES[campaignType] };
    }
    
    return { status: 'subdued', children: CAMPAIGN_TYPES[campaignType] || campaignType };
  };

  // Reset modal form
  const resetForm = () => {
    setSelectedTemplate('');
    setScheduleName('');
    setScheduleDescription('');
    setCampaignType('seasonal');
    setScheduleType('one_time');
    setStartDate({ start: new Date(), end: new Date() });
    setEndDate({ start: new Date(), end: new Date() });
    setHasEndDate(true);
    setPriority('0');
    setAutoActivate(true);
    setConflictResolution('higher_priority');
    setTimezone('UTC');
    setEditingSchedule(null);
  };

  // Open create modal
  const handleCreateSchedule = useCallback(() => {
    resetForm();
    setModalActive(true);
  }, []);

  // Open edit modal
  const handleEditSchedule = useCallback((schedule) => {
    setEditingSchedule(schedule);
    setSelectedTemplate(schedule.templateId.toString());
    setScheduleName(schedule.name);
    setScheduleDescription(schedule.description || '');
    setCampaignType(schedule.campaignType);
    setScheduleType(schedule.scheduleType);
    setStartDate({ start: new Date(schedule.startDate), end: new Date(schedule.startDate) });
    if (schedule.endDate) {
      setEndDate({ start: new Date(schedule.endDate), end: new Date(schedule.endDate) });
      setHasEndDate(true);
    } else {
      setHasEndDate(false);
    }
    setPriority(schedule.priority.toString());
    setAutoActivate(schedule.autoActivate);
    setConflictResolution(schedule.conflictResolution);
    setTimezone(schedule.timezone);
    setModalActive(true);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!selectedTemplate || !scheduleName || !campaignType || !scheduleType) {
      return;
    }

    setLoading(true);
    
    const formData = {
      templateId: selectedTemplate,
      name: scheduleName,
      description: scheduleDescription,
      campaignType,
      scheduleType,
      startDate: startDate.start.toISOString(),
      endDate: hasEndDate ? endDate.start.toISOString() : null,
      timezone,
      priority: parseInt(priority),
      autoActivate,
      conflictResolution
    };

    if (editingSchedule) {
      formData.scheduleId = editingSchedule.id;
    }

    try {
      const response = await fetch('/api/template-scheduling', {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        setModalActive(false);
        resetForm();
        window.location.reload(); // Refresh to show updated data
      } else {
        console.error('Error saving schedule:', result.error);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [
    selectedTemplate, scheduleName, scheduleDescription, campaignType, 
    scheduleType, startDate, endDate, hasEndDate, timezone, priority, 
    autoActivate, conflictResolution, editingSchedule
  ]);

  // Handle delete
  const handleDelete = useCallback(async (schedule) => {
    setScheduleToDelete(schedule);
    setDeleteModalActive(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!scheduleToDelete) return;

    setLoading(true);
    try {
      const response = await fetch('/api/template-scheduling', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: scheduleToDelete.id })
      });

      const result = await response.json();
      if (result.success) {
        setDeleteModalActive(false);
        setScheduleToDelete(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [scheduleToDelete]);

  // Prepare data table rows
  const rows = schedules.map((schedule) => [
    schedule.name,
    <Badge {...getCampaignBadge(schedule.campaignType)} />,
    SCHEDULE_TYPES[schedule.scheduleType] || schedule.scheduleType,
    schedule.template?.name || 'Unknown Template',
    formatDate(schedule.startDate),
    schedule.endDate ? formatDate(schedule.endDate) : 'No end date',
    <Badge {...getStatusBadge(schedule)} />,
    <InlineStack gap="200">
      <Button
        icon={EditIcon}
        variant="tertiary"
        onClick={() => handleEditSchedule(schedule)}
        accessibilityLabel={`Edit ${schedule.name}`}
      />
      <Button
        icon={DeleteIcon}
        variant="tertiary"
        tone="critical"
        onClick={() => handleDelete(schedule)}
        accessibilityLabel={`Delete ${schedule.name}`}
      />
    </InlineStack>
  ]);

  const headings = [
    'Schedule Name',
    'Campaign Type',
    'Schedule Type',
    'Template',
    'Start Date',
    'End Date',
    'Status',
    'Actions'
  ];

  // Template options for select
  const templateOptions = [
    { label: 'Select a template...', value: '' },
    ...templates.map(template => ({
      label: `${template.name} (${template.category})`,
      value: template.id.toString()
    }))
  ];

  const campaignTypeOptions = Object.entries(CAMPAIGN_TYPES).map(([value, label]) => ({
    label,
    value
  }));

  const scheduleTypeOptions = Object.entries(SCHEDULE_TYPES).map(([value, label]) => ({
    label,
    value
  }));

  const conflictResolutionOptions = Object.entries(CONFLICT_RESOLUTIONS).map(([value, label]) => ({
    label,
    value
  }));

  return (
    <Page
      title="Template Scheduling"
      subtitle="Schedule template changes for campaigns and events"
      primaryAction={{
        content: 'Create Schedule',
        icon: PlusIcon,
        onAction: handleCreateSchedule
      }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            {/* Statistics Cards */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  <Icon source={CalendarIcon} /> Schedule Overview
                </Text>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text>Total Schedules</Text>
                    <Badge status="info">{statistics.total}</Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text>Currently Active</Text>
                    <Badge status="success">{statistics.active}</Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text>Upcoming</Text>
                    <Badge status="attention">{statistics.upcoming}</Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text>Completed</Text>
                    <Badge status="subdued">{statistics.completed}</Badge>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Quick Tips */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  <Icon source={ClockIcon} /> Scheduling Tips
                </Text>
                <BlockStack gap="200">
                  <Text variant="bodyMd" color="subdued">
                    • Set higher priority for urgent campaigns like flash sales
                  </Text>
                  <Text variant="bodyMd" color="subdued">
                    • Use conflict resolution to handle overlapping schedules
                  </Text>
                  <Text variant="bodyMd" color="subdued">
                    • Test your schedules with low-priority campaigns first
                  </Text>
                  <Text variant="bodyMd" color="subdued">
                    • Monitor active schedules to ensure proper activation
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="twoThirds">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h3">
                  Scheduled Campaigns
                </Text>
                <Button
                  icon={PlusIcon}
                  onClick={handleCreateSchedule}
                  disabled={isLoading}
                >
                  Create Schedule
                </Button>
              </InlineStack>

              {schedules.length === 0 ? (
                <EmptyState
                  heading="No scheduled campaigns yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  action={{
                    content: 'Create your first schedule',
                    onAction: handleCreateSchedule
                  }}
                >
                  <Text>Schedule template changes for campaigns, sales, and special events to automate your popup strategy.</Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={[
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'text'
                  ]}
                  headings={headings}
                  rows={rows}
                  pagination={{
                    hasNext: false,
                    hasPrevious: false,
                    onNext: () => {},
                    onPrevious: () => {}
                  }}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Create/Edit Schedule Modal */}
      <Modal
        open={modalActive}
        onClose={() => setModalActive(false)}
        title={editingSchedule ? 'Edit Template Schedule' : 'Create Template Schedule'}
        primaryAction={{
          content: editingSchedule ? 'Update Schedule' : 'Create Schedule',
          onAction: handleSubmit,
          loading: isLoading,
          disabled: !selectedTemplate || !scheduleName || !campaignType || !scheduleType
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setModalActive(false)
          }
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Template"
              options={templateOptions}
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              placeholder="Select a template to schedule"
            />

            <TextField
              label="Schedule Name"
              value={scheduleName}
              onChange={setScheduleName}
              placeholder="e.g., Black Friday Sale 2024"
              autoComplete="off"
            />

            <TextField
              label="Description"
              value={scheduleDescription}
              onChange={setScheduleDescription}
              placeholder="Brief description of this campaign"
              multiline={2}
              autoComplete="off"
            />

            <InlineStack gap="400">
              <Box width="50%">
                <Select
                  label="Campaign Type"
                  options={campaignTypeOptions}
                  value={campaignType}
                  onChange={setCampaignType}
                />
              </Box>
              <Box width="50%">
                <Select
                  label="Schedule Type"
                  options={scheduleTypeOptions}
                  value={scheduleType}
                  onChange={setScheduleType}
                />
              </Box>
            </InlineStack>

            <InlineStack gap="400">
              <Box width="50%">
                <DatePicker
                  month={startDate.start.getMonth()}
                  year={startDate.start.getFullYear()}
                  selected={startDate}
                  onMonthChange={(month, year) => {
                    const newDate = new Date(year, month, startDate.start.getDate());
                    setStartDate({ start: newDate, end: newDate });
                  }}
                  onChange={setStartDate}
                />
                <Text variant="bodyMd" color="subdued">
                  Start Date: {startDate.start.toLocaleDateString()}
                </Text>
              </Box>
              
              {hasEndDate && (
                <Box width="50%">
                  <DatePicker
                    month={endDate.start.getMonth()}
                    year={endDate.start.getFullYear()}
                    selected={endDate}
                    onMonthChange={(month, year) => {
                      const newDate = new Date(year, month, endDate.start.getDate());
                      setEndDate({ start: newDate, end: newDate });
                    }}
                    onChange={setEndDate}
                  />
                  <Text variant="bodyMd" color="subdued">
                    End Date: {endDate.start.toLocaleDateString()}
                  </Text>
                </Box>
              )}
            </InlineStack>

            <InlineStack gap="400">
              <TextField
                label="Priority (0-100)"
                type="number"
                value={priority}
                onChange={setPriority}
                min={0}
                max={100}
                helpText="Higher priority schedules win conflicts"
              />
              
              <Select
                label="Conflict Resolution"
                options={conflictResolutionOptions}
                value={conflictResolution}
                onChange={setConflictResolution}
                helpText="How to handle overlapping schedules"
              />
            </InlineStack>
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalActive}
        onClose={() => setDeleteModalActive(false)}
        title="Delete Schedule"
        primaryAction={{
          content: 'Delete',
          onAction: confirmDelete,
          loading: isLoading,
          destructive: true
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setDeleteModalActive(false)
          }
        ]}
      >
        <Modal.Section>
          <Text>
            Are you sure you want to delete the schedule "{scheduleToDelete?.name}"? 
            This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
