import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    Checkbox,
    DataTable,
    FormLayout,
    InlineStack,
    Layout,
    Modal,
    Page,
    Select,
    Tabs,
    Text,
    TextField
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";

/**
 * Popup Scheduling System Management
 * Priority #19 - Time-based popup activation for holidays, sales, and events
 */

// Dynamic import for server-side scheduling functions
async function getSchedulingModule() {
  const module = await import("../utils/scheduling.server.js");
  return module;
}

export async function loader({ request }) {
  await authenticate.admin(request);

  try {
    const { 
      createScheduleManager, 
      SCHEDULE_TYPES, 
      EVENT_CATEGORIES, 
      PREDEFINED_EVENTS,
      SCHEDULE_TEMPLATES,
      HolidayDetector
    } = await getSchedulingModule();
    
    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'overview';
    
    const scheduleManager = createScheduleManager();
    const holidayDetector = new HolidayDetector();
    
    // Get schedule statistics
    const stats = scheduleManager.getScheduleStatistics();
    
    // Get active schedules
    const activeSchedules = scheduleManager.getActiveSchedules();
    
    // Get upcoming holidays
    const upcomingHolidays = holidayDetector.getUpcomingHolidays(60);
    
    // Get schedule conflicts
    const conflicts = scheduleManager.detectConflicts();
    
    return json({
      view,
      stats,
      activeSchedules,
      upcomingHolidays,
      conflicts,
      scheduleTypes: Object.values(SCHEDULE_TYPES),
      eventCategories: Object.values(EVENT_CATEGORIES),
      predefinedEvents: Object.entries(PREDEFINED_EVENTS),
      scheduleTemplates: Object.entries(SCHEDULE_TEMPLATES),
      timezones: [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver', 
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney'
      ]
    });

  } catch (error) {
    console.error('Scheduling loader error:', error);
    return json(
      { error: 'Failed to load scheduling data' },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  await authenticate.admin(request);

  try {
    const { createScheduleManager } = await getSchedulingModule();
    const formData = await request.formData();
    const action = formData.get("action");
    
    const scheduleManager = createScheduleManager();

    switch (action) {
      case "create_schedule": {
        const scheduleConfig = {
          name: formData.get("name"),
          type: formData.get("type"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
          startTime: formData.get("startTime"),
          endTime: formData.get("endTime"),
          timezone: formData.get("timezone"),
          priority: parseInt(formData.get("priority")) || 1,
          popupConfig: {
            template: formData.get("template"),
            title: formData.get("popupTitle"),
            message: formData.get("popupMessage")
          }
        };
        
        // Handle recurrence data
        if (scheduleConfig.type !== 'one_time') {
          scheduleConfig.recurrence = {
            interval: parseInt(formData.get("interval")) || 1,
            daysOfWeek: formData.getAll("daysOfWeek").map(Number),
            daysOfMonth: formData.getAll("daysOfMonth").map(Number),
            endRecurrence: formData.get("endRecurrence") || null
          };
        }
        
        const schedule = scheduleManager.createSchedule(scheduleConfig);
        
        return json({ 
          success: true, 
          message: `Schedule "${schedule.name}" created successfully`,
          schedule 
        });
      }

      case "create_event_schedule": {
        const eventKey = formData.get("eventKey");
        const customConfig = {
          name: formData.get("name"),
          priority: parseInt(formData.get("priority")) || 5,
          popupConfig: {
            title: formData.get("popupTitle"),
            message: formData.get("popupMessage")
          }
        };
        
        const schedule = scheduleManager.createEventSchedule(eventKey, customConfig);
        
        return json({ 
          success: true, 
          message: `Event schedule created for ${schedule.name}`,
          schedule 
        });
      }

      case "preview_schedule": {
        const scheduleId = formData.get("scheduleId");
        const occurrences = parseInt(formData.get("occurrences")) || 5;
        
        const preview = scheduleManager.generateSchedulePreview(scheduleId, occurrences);
        
        return json({ 
          success: true, 
          preview 
        });
      }

      case "test_schedule": {
        const scheduleId = formData.get("scheduleId");
        const testTime = formData.get("testTime") ? 
          new Date(formData.get("testTime")) : 
          new Date();
        
        const isActive = scheduleManager.isScheduleActive(scheduleId, testTime);
        const nextActivation = scheduleManager.getNextActivation(scheduleId);
        
        return json({ 
          success: true, 
          test: {
            isActive,
            nextActivation,
            testTime: testTime.toISOString()
          }
        });
      }

      case "bulk_create": {
        const scheduleData = JSON.parse(formData.get("scheduleData"));
        const results = scheduleManager.createBulkSchedules(scheduleData);
        
        return json({ 
          success: true, 
          message: `Created ${results.created.length} schedules, ${results.errors.length} errors`,
          results 
        });
      }

      case "toggle_schedule": {
        const scheduleId = formData.get("scheduleId");
        const isActive = formData.get("isActive") === 'true';
        
        // In production, this would update the database
        return json({ 
          success: true, 
          message: `Schedule ${isActive ? 'activated' : 'deactivated'}` 
        });
      }

      default:
        return json({ error: "Unknown action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Scheduling action error:', error);
    return json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    );
  }
}

export default function PopupScheduling() {
  const data = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();

  const [selectedTab, setSelectedTab] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scheduleType, setScheduleType] = useState('one_time');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [previewData, setPreviewData] = useState(null);

  // Handle schedule creation
  const handleCreateSchedule = useCallback((formData) => {
    fetcher.submit(formData, { method: "post" });
    setShowCreateModal(false);
  }, [fetcher]);

  // Handle event schedule creation
  const handleCreateEventSchedule = useCallback((formData) => {
    fetcher.submit(formData, { method: "post" });
    setShowEventModal(false);
  }, [fetcher]);

  // Handle schedule preview
  const handlePreviewSchedule = useCallback((scheduleId) => {
    const formData = new FormData();
    formData.append("action", "preview_schedule");
    formData.append("scheduleId", scheduleId);
    formData.append("occurrences", "10");
    
    fetcher.submit(formData, { method: "post" });
    setShowPreviewModal(true);
  }, [fetcher]);

  // Update preview data when fetcher returns
  if (fetcher.data?.preview && !previewData) {
    setPreviewData(fetcher.data.preview);
  }

  // Prepare active schedules table
  const activeScheduleRows = data.activeSchedules.map((schedule, index) => [
    schedule.name,
    <Badge key={`badge-${index}`} status="success">{schedule.type}</Badge>,
    schedule.startDate,
    schedule.startTime + ' - ' + schedule.endTime,
    schedule.timezone,
    <Badge key={`priority-${index}`} status={schedule.priority > 5 ? "critical" : "info"}>
      {schedule.priority}
    </Badge>,
    <InlineStack key={`actions-${index}`} gap="200">
      <Button size="slim" onClick={() => handlePreviewSchedule(schedule.id)}>
        Preview
      </Button>
      <Button size="slim" variant="secondary">Edit</Button>
    </InlineStack>
  ]);

  // Prepare upcoming holidays table
  const holidayRows = data.upcomingHolidays.slice(0, 10).map((item, index) => [
    item.holiday.name || item.holiday.holiday?.name,
    item.date.split('T')[0],
    <Badge key={`holiday-${index}`} status="info">
      {item.holiday.category || 'Holiday'}
    </Badge>,
    <Button key={`create-${index}`} size="slim" onClick={() => {
      setSelectedEvent(item.holiday.name);
      setShowEventModal(true);
    }}>
      Create Campaign
    </Button>
  ]);

  const tabs = [
    {
      id: 'overview',
      content: 'Overview',
      panel: (
        <BlockStack gap="400">
          {/* Statistics Cards */}
          <InlineStack gap="400" distribution="fillEvenly">
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">{data.stats.total}</Text>
                <Text variant="bodyMd">Total Schedules</Text>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">{data.stats.active}</Text>
                <Text variant="bodyMd">Active Schedules</Text>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">{data.stats.upcomingCount}</Text>
                <Text variant="bodyMd">Upcoming</Text>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text variant="headingLg">{data.conflicts.length}</Text>
                <Text variant="bodyMd">Conflicts</Text>
              </div>
            </Card>
          </InlineStack>

          {/* Quick Actions */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Quick Actions</Text>
              <InlineStack gap="200">
                <Button primary onClick={() => setShowCreateModal(true)}>
                  Create Schedule
                </Button>
                <Button onClick={() => setShowEventModal(true)}>
                  Holiday Campaign
                </Button>
                <Button variant="secondary">Import Schedules</Button>
                <Button variant="secondary">Export Data</Button>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Conflicts Warning */}
          {data.conflicts.length > 0 && (
            <Banner status="warning">
              <p>
                {data.conflicts.length} schedule conflict{data.conflicts.length > 1 ? 's' : ''} detected. 
                Review your schedules to avoid overlapping campaigns.
              </p>
            </Banner>
          )}

          {/* Active Schedules */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Currently Active Schedules</Text>
              {data.activeSchedules.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Name', 'Type', 'Date', 'Time', 'Timezone', 'Priority', 'Actions']}
                  rows={activeScheduleRows}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text variant="headingMd">No active schedules</Text>
                  <Text>Create a schedule to start showing targeted popups</Text>
                </div>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      )
    },
    {
      id: 'holidays',
      content: 'Holiday Campaigns',
      panel: (
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Upcoming Holidays & Events</Text>
              <Text variant="bodyMd">
                Create targeted campaigns for upcoming holidays and special events.
              </Text>
              
              {data.upcomingHolidays.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Holiday', 'Date', 'Category', 'Action']}
                  rows={holidayRows}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text variant="headingMd">No upcoming holidays</Text>
                  <Text>Check back later for holiday campaign opportunities</Text>
                </div>
              )}
            </BlockStack>
          </Card>

          {/* Predefined Events */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Predefined Event Templates</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {data.predefinedEvents.map(([key, event]) => (
                  <div key={key} style={{ border: '1px solid #e1e3e5', borderRadius: '8px', padding: '16px' }}>
                    <Text variant="headingMd">{event.name}</Text>
                    <Text variant="bodyMd" color="subdued">{event.category}</Text>
                    <div style={{ marginTop: '12px' }}>
                      <Button size="slim" onClick={() => {
                        setSelectedEvent(key);
                        setShowEventModal(true);
                      }}>
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </BlockStack>
          </Card>
        </BlockStack>
      )
    },
    {
      id: 'templates',
      content: 'Schedule Templates',
      panel: (
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Schedule Templates</Text>
            <Text variant="bodyMd">
              Use these pre-configured templates to quickly create common scheduling patterns.
            </Text>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
              {data.scheduleTemplates.map(([key, template]) => (
                <div key={key} style={{ border: '1px solid #e1e3e5', borderRadius: '8px', padding: '20px' }}>
                  <Text variant="headingMd">{template.name}</Text>
                  <div style={{ margin: '12px 0' }}>
                    <Text variant="bodyMd">Type: {template.type}</Text>
                    <br />
                    <Text variant="bodyMd">Priority: {template.priority}</Text>
                    {template.recurrence && (
                      <>
                        <br />
                        <Text variant="bodySm" color="subdued">
                          Recurrence pattern configured
                        </Text>
                      </>
                    )}
                  </div>
                  <Button size="slim">Use Template</Button>
                </div>
              ))}
            </div>
          </BlockStack>
        </Card>
      )
    }
  ];

  return (
    <Page
      title="Popup Scheduling"
      subtitle="Manage time-based popup activation for holidays, sales, and special events"
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

      {/* Create Schedule Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Schedule"
        large
        primaryAction={{
          content: "Create Schedule",
          onAction: () => {
            // Form submission would be handled here
            console.log('Create schedule');
          }
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowCreateModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Schedule Name" placeholder="e.g., Black Friday Sale" />
            
            <Select
              label="Schedule Type"
              options={[
                { label: 'One-time', value: 'one_time' },
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' }
              ]}
              value={scheduleType}
              onChange={setScheduleType}
            />

            <InlineStack gap="400">
              <TextField label="Start Date" type="date" />
              <TextField label="End Date" type="date" />
            </InlineStack>

            <InlineStack gap="400">
              <TextField label="Start Time" type="time" value="09:00" />
              <TextField label="End Time" type="time" value="17:00" />
            </InlineStack>

            <Select
              label="Timezone"
              options={data.timezones.map(tz => ({ label: tz, value: tz }))}
              value="UTC"
            />

            <TextField label="Priority (1-10)" type="number" value="5" />

            {scheduleType !== 'one_time' && (
              <div>
                <Text variant="headingMd">Recurrence Settings</Text>
                <TextField label="Repeat every" type="number" value="1" suffix={scheduleType.slice(0, -2)} />
                
                {scheduleType === 'weekly' && (
                  <div>
                    <Text variant="bodyMd">Days of week:</Text>
                    <InlineStack gap="200">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <Checkbox key={day} label={day} />
                      ))}
                    </InlineStack>
                  </div>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '16px', marginTop: '16px' }}>
              <Text variant="headingMd">Popup Configuration</Text>
              <TextField label="Popup Title" placeholder="Special Offer!" />
              <TextField label="Popup Message" multiline placeholder="Don't miss out on our amazing deals..." />
            </div>
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Event Schedule Modal */}
      <Modal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Create Holiday Campaign"
        primaryAction={{
          content: "Create Campaign",
          onAction: () => setShowEventModal(false)
        }}
        secondaryActions={[{
          content: "Cancel",
          onAction: () => setShowEventModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Select Holiday/Event"
              options={data.predefinedEvents.map(([key, event]) => ({
                label: event.name,
                value: key
              }))}
              value={selectedEvent}
              onChange={setSelectedEvent}
            />
            
            <TextField label="Campaign Name" placeholder="e.g., Black Friday Flash Sale" />
            <TextField label="Priority (1-10)" type="number" value="8" />
            
            <TextField label="Popup Title" placeholder="Holiday Special!" />
            <TextField label="Popup Message" multiline placeholder="Celebrate with exclusive offers..." />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewData(null);
        }}
        title="Schedule Preview"
        large
      >
        <Modal.Section>
          {previewData && (
            <BlockStack gap="400">
              <Text variant="headingMd">Next 10 Occurrences</Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={['Date & Time', 'Duration (minutes)', 'Status']}
                rows={previewData.map((item, index) => [
                  new Date(item.date).toLocaleString(),
                  item.duration,
                  <Badge key={`status-${index}`} status={item.active ? "success" : "subdued"}>
                    {item.active ? 'Active' : 'Inactive'}
                  </Badge>
                ])}
              />
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
