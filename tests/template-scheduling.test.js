// StayBoost Template Scheduling Tests
import assert from 'node:assert';
import { after, before, describe, test } from 'node:test';
import prisma from '../app/db.server.js';

describe('📅 StayBoost Template Scheduling', () => {
  
  before(async () => {
    // Clean up any existing test data
    await prisma.scheduleActivation.deleteMany({
      where: { 
        schedule: { 
          shop: { contains: 'scheduling-test' } 
        } 
      }
    });
    await prisma.templateSchedule.deleteMany({
      where: { shop: { contains: 'scheduling-test' } }
    });
    await prisma.campaignTemplate.deleteMany({
      where: { shop: { contains: 'scheduling-test' } }
    });
    await prisma.popupTemplate.deleteMany({
      where: { shop: { contains: 'scheduling-test' } }
    });
  });

  after(async () => {
    // Clean up test data
    await prisma.scheduleActivation.deleteMany({
      where: { 
        schedule: { 
          shop: { contains: 'scheduling-test' } 
        } 
      }
    });
    await prisma.templateSchedule.deleteMany({
      where: { shop: { contains: 'scheduling-test' } }
    });
    await prisma.campaignTemplate.deleteMany({
      where: { shop: { contains: 'scheduling-test' } }
    });
    await prisma.popupTemplate.deleteMany({
      where: { shop: { contains: 'scheduling-test' } }
    });
  });

  describe('🏗️ Scheduling Infrastructure', () => {
    test('should have scheduling frontend route', async () => {
      const fs = await import('fs');
      const frontendFile = '/Users/incognitolab/My project/Stayboost/app/routes/app.scheduling.jsx';
      assert.ok(fs.existsSync(frontendFile), 'Scheduling frontend route should exist');
    });

    test('should have scheduling API route', async () => {
      const fs = await import('fs');
      const apiFile = '/Users/incognitolab/My project/Stayboost/app/routes/api.template-scheduling.jsx';
      assert.ok(fs.existsSync(apiFile), 'Scheduling API route should exist');
    });

    test('should support template schedules in database', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test.myshopify.com',
          name: 'Test Template for Scheduling',
          description: 'Template to test scheduling',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Black Friday Sale!',
            message: 'Get 50% off everything!',
            buttonText: 'Shop Now',
            backgroundColor: '#000000',
            textColor: '#FFFFFF'
          })
        }
      });

      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test.myshopify.com',
          templateId: template.id,
          name: 'Black Friday Campaign 2024',
          description: 'Annual Black Friday promotion',
          campaignType: 'black_friday',
          scheduleType: 'campaign',
          startDate: new Date('2024-11-29T00:00:00Z'),
          endDate: new Date('2024-12-02T23:59:59Z'),
          timezone: 'UTC',
          priority: 90,
          autoActivate: true,
          conflictResolution: 'higher_priority'
        }
      });

      assert.ok(schedule.id, 'Should create template schedule');
      assert.strictEqual(schedule.campaignType, 'black_friday', 'Schedule campaign type should be Black Friday');
      assert.strictEqual(schedule.templateId, template.id, 'Schedule should be linked to template');
      assert.strictEqual(schedule.priority, 90, 'Schedule should have high priority');
    });
  });

  describe('📅 Campaign Types & Scheduling', () => {
    test('should support various campaign types', async () => {
      const campaignTypes = [
        'black_friday', 'christmas', 'valentines', 'summer', 
        'flash_sale', 'clearance', 'new_product', 'seasonal'
      ];
      
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-campaigns.myshopify.com',
          name: 'Multi-Campaign Template',
          description: 'Template for testing multiple campaign types',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Special Offer!',
            message: 'Limited time deal'
          })
        }
      });

      const schedules = [];
      for (const campaignType of campaignTypes) {
        const schedule = await prisma.templateSchedule.create({
          data: {
            shop: 'scheduling-test-campaigns.myshopify.com',
            templateId: template.id,
            name: `${campaignType} Campaign`,
            campaignType,
            scheduleType: 'campaign',
            startDate: new Date(),
            priority: 50
          }
        });
        schedules.push(schedule);
      }

      assert.strictEqual(schedules.length, campaignTypes.length, 'Should create schedules for all campaign types');
      
      const distinctCampaignTypes = [...new Set(schedules.map(s => s.campaignType))];
      assert.strictEqual(distinctCampaignTypes.length, campaignTypes.length, 'Should have unique campaign types');
    });

    test('should support different schedule types', async () => {
      const scheduleTypes = ['one_time', 'recurring', 'campaign', 'event'];
      
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-types.myshopify.com',
          name: 'Schedule Types Template',
          description: 'Template for testing schedule types',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Schedule Test',
            message: 'Testing different schedule types'
          })
        }
      });

      for (const scheduleType of scheduleTypes) {
        const schedule = await prisma.templateSchedule.create({
          data: {
            shop: 'scheduling-test-types.myshopify.com',
            templateId: template.id,
            name: `${scheduleType} Schedule`,
            campaignType: 'test',
            scheduleType,
            startDate: new Date(),
            priority: 10
          }
        });

        assert.ok(schedule.id, `Should create ${scheduleType} schedule`);
        assert.strictEqual(schedule.scheduleType, scheduleType, `Schedule type should be ${scheduleType}`);
      }
    });

    test('should handle priority-based conflict resolution', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-priority.myshopify.com',
          name: 'Priority Test Template',
          description: 'Template for testing priority conflicts',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Priority Test',
            message: 'Testing priority conflicts'
          })
        }
      });

      const startDate = new Date();
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later

      // Create high priority schedule
      const highPrioritySchedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-priority.myshopify.com',
          templateId: template.id,
          name: 'High Priority Campaign',
          campaignType: 'flash_sale',
          scheduleType: 'campaign',
          startDate,
          endDate,
          priority: 95,
          conflictResolution: 'higher_priority'
        }
      });

      // Create low priority schedule (conflicting time)
      const lowPrioritySchedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-priority.myshopify.com',
          templateId: template.id,
          name: 'Low Priority Campaign',
          campaignType: 'seasonal',
          scheduleType: 'campaign',
          startDate,
          endDate,
          priority: 20,
          conflictResolution: 'higher_priority'
        }
      });

      assert.ok(highPrioritySchedule.priority > lowPrioritySchedule.priority, 'High priority should be greater than low priority');
      assert.strictEqual(highPrioritySchedule.conflictResolution, 'higher_priority', 'Should use priority-based resolution');
      assert.strictEqual(lowPrioritySchedule.conflictResolution, 'higher_priority', 'Should use priority-based resolution');
    });
  });

  describe('⏰ Schedule Timing & Activation', () => {
    test('should support immediate activation for current schedules', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-activation.myshopify.com',
          name: 'Immediate Activation Template',
          description: 'Template for testing immediate activation',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Active Now!',
            message: 'This campaign is live'
          })
        }
      });

      const now = new Date();
      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-activation.myshopify.com',
          templateId: template.id,
          name: 'Immediate Campaign',
          campaignType: 'promotion',
          scheduleType: 'one_time',
          startDate: new Date(now.getTime() - 1000), // 1 second ago
          endDate: new Date(now.getTime() + 60000), // 1 minute from now
          autoActivate: true,
          priority: 50
        }
      });

      // Create activation record
      const activation = await prisma.scheduleActivation.create({
        data: {
          scheduleId: schedule.id,
          activationTime: now,
          status: 'active',
          activationData: JSON.stringify({
            templateId: schedule.templateId,
            scheduleName: schedule.name,
            campaignType: schedule.campaignType
          })
        }
      });

      assert.ok(activation.id, 'Should create activation record');
      assert.strictEqual(activation.status, 'active', 'Activation should be active');
      assert.strictEqual(activation.scheduleId, schedule.id, 'Activation should be linked to schedule');
    });

    test('should support future scheduled campaigns', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-future.myshopify.com',
          name: 'Future Campaign Template',
          description: 'Template for testing future campaigns',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Coming Soon!',
            message: 'This campaign starts later'
          })
        }
      });

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-future.myshopify.com',
          templateId: template.id,
          name: 'Future Campaign',
          campaignType: 'christmas',
          scheduleType: 'event',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000), // 1 day duration
          autoActivate: true,
          priority: 75
        }
      });

      const now = new Date();
      assert.ok(schedule.startDate > now, 'Schedule should start in the future');
      assert.strictEqual(schedule.autoActivate, true, 'Should auto-activate when time comes');
    });

    test('should support timezone handling', async () => {
      const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
      
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-timezone.myshopify.com',
          name: 'Timezone Test Template',
          description: 'Template for testing timezones',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Timezone Test',
            message: 'Testing timezone support'
          })
        }
      });

      for (const timezone of timezones) {
        const schedule = await prisma.templateSchedule.create({
          data: {
            shop: 'scheduling-test-timezone.myshopify.com',
            templateId: template.id,
            name: `Campaign in ${timezone}`,
            campaignType: 'seasonal',
            scheduleType: 'campaign',
            startDate: new Date(),
            timezone,
            priority: 30
          }
        });

        assert.strictEqual(schedule.timezone, timezone, `Should support ${timezone} timezone`);
      }
    });

    test('should handle schedule end dates properly', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-enddate.myshopify.com',
          name: 'End Date Test Template',
          description: 'Template for testing end dates',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Limited Time',
            message: 'This offer expires'
          })
        }
      });

      // Schedule with end date
      const limitedSchedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-enddate.myshopify.com',
          templateId: template.id,
          name: 'Limited Time Campaign',
          campaignType: 'flash_sale',
          scheduleType: 'one_time',
          startDate: new Date(),
          endDate: new Date(Date.now() + 60000), // 1 minute from now
          priority: 80
        }
      });

      // Schedule without end date (indefinite)
      const indefiniteSchedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-enddate.myshopify.com',
          templateId: template.id,
          name: 'Indefinite Campaign',
          campaignType: 'promotion',
          scheduleType: 'recurring',
          startDate: new Date(),
          endDate: null,
          priority: 40
        }
      });

      assert.ok(limitedSchedule.endDate, 'Limited schedule should have end date');
      assert.strictEqual(indefiniteSchedule.endDate, null, 'Indefinite schedule should have no end date');
    });
  });

  describe('🔧 Schedule Management', () => {
    test('should update existing schedules', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-update.myshopify.com',
          name: 'Update Test Template',
          description: 'Template for testing updates',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Update Test',
            message: 'Testing schedule updates'
          })
        }
      });

      // Create initial schedule
      const initialSchedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-update.myshopify.com',
          templateId: template.id,
          name: 'Initial Campaign',
          campaignType: 'promotion',
          scheduleType: 'one_time',
          startDate: new Date(),
          priority: 50
        }
      });

      // Update schedule
      const updatedSchedule = await prisma.templateSchedule.update({
        where: { id: initialSchedule.id },
        data: {
          name: 'Updated Campaign',
          campaignType: 'flash_sale',
          priority: 85,
          description: 'Updated description'
        }
      });

      assert.strictEqual(updatedSchedule.id, initialSchedule.id, 'Should update same record');
      assert.strictEqual(updatedSchedule.name, 'Updated Campaign', 'Should have updated name');
      assert.strictEqual(updatedSchedule.campaignType, 'flash_sale', 'Should have updated campaign type');
      assert.strictEqual(updatedSchedule.priority, 85, 'Should have updated priority');
    });

    test('should deactivate schedules', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-deactivate.myshopify.com',
          name: 'Deactivate Test Template',
          description: 'Template for testing deactivation',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Deactivate Test',
            message: 'Testing schedule deactivation'
          })
        }
      });

      // Create active schedule
      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-deactivate.myshopify.com',
          templateId: template.id,
          name: 'Active Campaign',
          campaignType: 'seasonal',
          scheduleType: 'campaign',
          startDate: new Date(),
          isActive: true,
          priority: 60
        }
      });

      // Deactivate schedule
      const deactivatedSchedule = await prisma.templateSchedule.update({
        where: { id: schedule.id },
        data: { isActive: false }
      });

      assert.strictEqual(deactivatedSchedule.isActive, false, 'Schedule should be deactivated');
    });

    test('should delete schedules with cascade', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-delete.myshopify.com',
          name: 'Delete Test Template',
          description: 'Template for testing deletion',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Delete Test',
            message: 'Testing schedule deletion'
          })
        }
      });

      // Create schedule with activation
      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-delete.myshopify.com',
          templateId: template.id,
          name: 'To Be Deleted',
          campaignType: 'test',
          scheduleType: 'one_time',
          startDate: new Date(),
          priority: 30
        }
      });

      const activation = await prisma.scheduleActivation.create({
        data: {
          scheduleId: schedule.id,
          activationTime: new Date(),
          status: 'active'
        }
      });

      // Delete schedule (should cascade to activations)
      await prisma.templateSchedule.delete({
        where: { id: schedule.id }
      });

      // Check that activation was also deleted
      const orphanedActivation = await prisma.scheduleActivation.findUnique({
        where: { id: activation.id }
      });

      assert.strictEqual(orphanedActivation, null, 'Activation should be cascade deleted');
    });
  });

  describe('🎯 Campaign Templates', () => {
    test('should support campaign template creation', async () => {
      const campaignTemplate = await prisma.campaignTemplate.create({
        data: {
          shop: 'scheduling-test-campaign-template.myshopify.com',
          name: 'Black Friday Template',
          campaignType: 'black_friday',
          templateConfig: JSON.stringify({
            title: 'BLACK FRIDAY EXCLUSIVE!',
            message: 'Get 50% OFF everything! Limited time only!',
            buttonText: 'Shop Black Friday',
            backgroundColor: '#000000',
            textColor: '#FFFFFF',
            buttonColor: '#FF0000',
            discountPercentage: 50
          }),
          defaultSchedule: JSON.stringify({
            scheduleType: 'campaign',
            timezone: 'UTC',
            priority: 90,
            conflictResolution: 'higher_priority'
          }),
          targetAudience: JSON.stringify({
            segments: ['all_visitors'],
            excludeConverted: true
          }),
          performanceGoals: JSON.stringify({
            targetConversionRate: 15.0,
            targetRevenue: 10000
          })
        }
      });

      assert.ok(campaignTemplate.id, 'Should create campaign template');
      assert.strictEqual(campaignTemplate.campaignType, 'black_friday', 'Should have correct campaign type');
      assert.ok(campaignTemplate.templateConfig, 'Should have template configuration');
      assert.ok(campaignTemplate.defaultSchedule, 'Should have default schedule settings');
    });

    test('should track campaign template usage', async () => {
      const campaignTemplate = await prisma.campaignTemplate.create({
        data: {
          shop: 'scheduling-test-usage.myshopify.com',
          name: 'Usage Tracking Template',
          campaignType: 'summer',
          templateConfig: JSON.stringify({
            title: 'Summer Sale!',
            message: '30% off summer collection'
          }),
          usageCount: 0,
          avgConversionRate: 0.0
        }
      });

      // Simulate usage
      const updatedTemplate = await prisma.campaignTemplate.update({
        where: { id: campaignTemplate.id },
        data: {
          usageCount: { increment: 1 },
          avgConversionRate: 12.5
        }
      });

      assert.strictEqual(updatedTemplate.usageCount, 1, 'Should increment usage count');
      assert.strictEqual(updatedTemplate.avgConversionRate, 12.5, 'Should update conversion rate');
    });

    test('should link campaign templates to schedules', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-link.myshopify.com',
          name: 'Linkage Test Template',
          description: 'Template for testing campaign linkage',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Linkage Test',
            message: 'Testing campaign template linkage'
          })
        }
      });

      const campaignTemplate = await prisma.campaignTemplate.create({
        data: {
          shop: 'scheduling-test-link.myshopify.com',
          name: 'Linkage Campaign Template',
          campaignType: 'valentines',
          templateConfig: JSON.stringify({
            title: 'Valentine\'s Special',
            message: 'Love is in the air - 20% off!'
          })
        }
      });

      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-link.myshopify.com',
          templateId: template.id,
          name: 'Valentine\'s Campaign from Template',
          campaignType: 'valentines',
          scheduleType: 'event',
          startDate: new Date('2024-02-14T00:00:00Z'),
          endDate: new Date('2024-02-14T23:59:59Z'),
          priority: 80,
          metadata: JSON.stringify({
            basedOnCampaignTemplate: campaignTemplate.id,
            source: 'campaign_template'
          })
        }
      });

      assert.ok(schedule.metadata, 'Schedule should have metadata linking to campaign template');
      
      const metadata = JSON.parse(schedule.metadata);
      assert.strictEqual(metadata.basedOnCampaignTemplate, campaignTemplate.id, 'Should reference campaign template');
    });
  });

  describe('📊 Schedule Analytics', () => {
    test('should track schedule activation history', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-analytics.myshopify.com',
          name: 'Analytics Test Template',
          description: 'Template for testing analytics',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Analytics Test',
            message: 'Testing schedule analytics'
          })
        }
      });

      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: 'scheduling-test-analytics.myshopify.com',
          templateId: template.id,
          name: 'Analytics Campaign',
          campaignType: 'promotion',
          scheduleType: 'campaign',
          startDate: new Date(),
          endDate: new Date(Date.now() + 60000),
          priority: 60
        }
      });

      // Create multiple activation records
      const activations = [];
      for (let i = 0; i < 3; i++) {
        const activation = await prisma.scheduleActivation.create({
          data: {
            scheduleId: schedule.id,
            activationTime: new Date(Date.now() + i * 1000),
            status: i === 2 ? 'completed' : 'active',
            activationData: JSON.stringify({
              iteration: i + 1,
              timestamp: new Date().toISOString()
            })
          }
        });
        activations.push(activation);
      }

      assert.strictEqual(activations.length, 3, 'Should create multiple activation records');
      
      const activeActivations = activations.filter(a => a.status === 'active');
      const completedActivations = activations.filter(a => a.status === 'completed');
      
      assert.strictEqual(activeActivations.length, 2, 'Should have active activations');
      assert.strictEqual(completedActivations.length, 1, 'Should have completed activations');
    });

    test('should calculate schedule performance metrics', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'scheduling-test-performance.myshopify.com',
          name: 'Performance Test Template',
          description: 'Template for testing performance',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Performance Test',
            message: 'Testing schedule performance'
          })
        }
      });

      // Create multiple schedules for comparison
      const schedules = [];
      const campaignTypes = ['flash_sale', 'seasonal', 'promotion'];
      
      for (const campaignType of campaignTypes) {
        const schedule = await prisma.templateSchedule.create({
          data: {
            shop: 'scheduling-test-performance.myshopify.com',
            templateId: template.id,
            name: `${campaignType} Performance Test`,
            campaignType,
            scheduleType: 'campaign',
            startDate: new Date(),
            priority: campaignType === 'flash_sale' ? 95 : 50
          }
        });
        schedules.push(schedule);
      }

      // Find highest priority schedule
      const schedulesWithPriority = await prisma.templateSchedule.findMany({
        where: {
          shop: 'scheduling-test-performance.myshopify.com'
        },
        orderBy: { priority: 'desc' }
      });

      const highestPrioritySchedule = schedulesWithPriority[0];
      assert.strictEqual(highestPrioritySchedule.campaignType, 'flash_sale', 'Flash sale should have highest priority');
      assert.strictEqual(highestPrioritySchedule.priority, 95, 'Should have priority of 95');
    });
  });
});

// Helper function to check if schedule is currently active
function isScheduleActive(schedule) {
  const now = new Date();
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
  
  return schedule.isActive && 
         startDate <= now && 
         (!endDate || endDate >= now);
}

// Helper function to get schedule status
function getScheduleStatus(schedule) {
  const now = new Date();
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
  
  if (!schedule.isActive) return 'inactive';
  if (startDate > now) return 'upcoming';
  if (startDate <= now && (!endDate || endDate >= now)) return 'active';
  if (endDate && endDate < now) return 'completed';
  return 'unknown';
}
