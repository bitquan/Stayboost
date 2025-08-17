// StayBoost Template Scheduling API
import { PrismaClient } from '@prisma/client';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server.js';

const prisma = new PrismaClient();

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

// Schedule types
const SCHEDULE_TYPES = {
  one_time: 'One-time Campaign',
  recurring: 'Recurring Campaign',
  campaign: 'Campaign Period',
  event: 'Event-based'
};

// Conflict resolution strategies
const CONFLICT_RESOLUTIONS = {
  higher_priority: 'Higher Priority Wins',
  latest: 'Latest Schedule Wins',
  first: 'First Schedule Wins',
  merge: 'Merge Schedules'
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const method = request.method;
  const url = new URL(request.url);
  
  try {
    if (method === 'GET') {
      // Get schedule types and campaign types
      if (url.searchParams.get('action') === 'types') {
        return json({ 
          campaignTypes: CAMPAIGN_TYPES,
          scheduleTypes: SCHEDULE_TYPES,
          conflictResolutions: CONFLICT_RESOLUTIONS
        });
      }
      
      // Get all schedules for shop
      const schedules = await prisma.templateSchedule.findMany({
        where: { shop: session.shop },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              templateType: true,
              config: true
            }
          },
          activations: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy: [
          { priority: 'desc' },
          { startDate: 'asc' }
        ]
      });
      
      // Get active schedules (currently running)
      const now = new Date();
      const activeSchedules = schedules.filter(schedule => 
        schedule.isActive && 
        schedule.startDate <= now && 
        (!schedule.endDate || schedule.endDate >= now)
      );
      
      // Get upcoming schedules
      const upcomingSchedules = schedules.filter(schedule => 
        schedule.isActive && schedule.startDate > now
      ).slice(0, 10);
      
      return json({
        schedules,
        activeSchedules,
        upcomingSchedules,
        summary: {
          total: schedules.length,
          active: activeSchedules.length,
          upcoming: upcomingSchedules.length,
          completed: schedules.filter(s => s.endDate && s.endDate < now).length
        }
      });
    }
    
    if (method === 'POST') {
      const body = await request.json();
      const { 
        templateId, 
        name, 
        description, 
        campaignType, 
        scheduleType,
        startDate,
        endDate,
        timezone = 'UTC',
        priority = 0,
        autoActivate = true,
        conflictResolution = 'higher_priority',
        metadata
      } = body;
      
      if (!templateId || !name || !campaignType || !scheduleType || !startDate) {
        return json({ 
          error: 'Template ID, name, campaign type, schedule type, and start date are required' 
        }, { status: 400 });
      }
      
      // Verify template exists and belongs to shop
      const template = await prisma.popupTemplate.findFirst({
        where: {
          id: parseInt(templateId),
          OR: [
            { shop: session.shop },
            { shop: null } // Built-in templates
          ]
        }
      });
      
      if (!template) {
        return json({ error: 'Template not found' }, { status: 404 });
      }
      
      // Check for schedule conflicts
      const conflictingSchedules = await prisma.templateSchedule.findMany({
        where: {
          shop: session.shop,
          isActive: true,
          OR: [
            // New schedule starts during existing schedule
            {
              AND: [
                { startDate: { lte: new Date(startDate) } },
                { endDate: { gte: new Date(startDate) } }
              ]
            },
            // New schedule ends during existing schedule
            endDate ? {
              AND: [
                { startDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(endDate) } }
              ]
            } : {},
            // New schedule encompasses existing schedule
            endDate ? {
              AND: [
                { startDate: { gte: new Date(startDate) } },
                { endDate: { lte: new Date(endDate) } }
              ]
            } : {}
          ]
        }
      });
      
      let warnings = [];
      if (conflictingSchedules.length > 0) {
        warnings.push(`This schedule conflicts with ${conflictingSchedules.length} existing schedule(s). Conflict resolution: ${CONFLICT_RESOLUTIONS[conflictResolution]}`);
      }
      
      // Create template schedule
      const schedule = await prisma.templateSchedule.create({
        data: {
          shop: session.shop,
          templateId: parseInt(templateId),
          name,
          description,
          campaignType,
          scheduleType,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          timezone,
          priority: parseInt(priority),
          autoActivate,
          conflictResolution,
          metadata: metadata ? JSON.stringify(metadata) : null
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });
      
      // Create initial activation if schedule should start immediately
      const now = new Date();
      if (autoActivate && new Date(startDate) <= now) {
        await prisma.scheduleActivation.create({
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
      }
      
      return json({ 
        success: true, 
        schedule,
        warnings,
        message: `Template schedule "${name}" created successfully`
      });
    }
    
    if (method === 'PUT') {
      const body = await request.json();
      const { scheduleId, ...updateData } = body;
      
      if (!scheduleId) {
        return json({ error: 'Schedule ID is required' }, { status: 400 });
      }
      
      // Verify schedule belongs to shop
      const existingSchedule = await prisma.templateSchedule.findFirst({
        where: {
          id: parseInt(scheduleId),
          shop: session.shop
        }
      });
      
      if (!existingSchedule) {
        return json({ error: 'Schedule not found' }, { status: 404 });
      }
      
      // Prepare update data
      const updates = {};
      if (updateData.name) updates.name = updateData.name;
      if (updateData.description !== undefined) updates.description = updateData.description;
      if (updateData.campaignType) updates.campaignType = updateData.campaignType;
      if (updateData.scheduleType) updates.scheduleType = updateData.scheduleType;
      if (updateData.startDate) updates.startDate = new Date(updateData.startDate);
      if (updateData.endDate !== undefined) {
        updates.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
      }
      if (updateData.timezone) updates.timezone = updateData.timezone;
      if (updateData.priority !== undefined) updates.priority = parseInt(updateData.priority);
      if (updateData.autoActivate !== undefined) updates.autoActivate = updateData.autoActivate;
      if (updateData.conflictResolution) updates.conflictResolution = updateData.conflictResolution;
      if (updateData.isActive !== undefined) updates.isActive = updateData.isActive;
      if (updateData.metadata !== undefined) {
        updates.metadata = updateData.metadata ? JSON.stringify(updateData.metadata) : null;
      }
      
      const updatedSchedule = await prisma.templateSchedule.update({
        where: { id: parseInt(scheduleId) },
        data: updates,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });
      
      return json({ 
        success: true, 
        schedule: updatedSchedule,
        message: 'Schedule updated successfully'
      });
    }
    
    if (method === 'DELETE') {
      const body = await request.json();
      const { scheduleId } = body;
      
      if (!scheduleId) {
        return json({ error: 'Schedule ID is required' }, { status: 400 });
      }
      
      // Verify schedule belongs to shop
      const existingSchedule = await prisma.templateSchedule.findFirst({
        where: {
          id: parseInt(scheduleId),
          shop: session.shop
        }
      });
      
      if (!existingSchedule) {
        return json({ error: 'Schedule not found' }, { status: 404 });
      }
      
      // Delete schedule (cascades to activations)
      await prisma.templateSchedule.delete({
        where: { id: parseInt(scheduleId) }
      });
      
      return json({ 
        success: true, 
        message: `Schedule "${existingSchedule.name}" deleted successfully`
      });
    }
    
    return json({ error: 'Method not allowed' }, { status: 405 });
    
  } catch (error) {
    console.error('Template scheduling API error:', error);
    return json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  return action({ request });
};

// Helper function to get active template for current time
export async function getActiveTemplate(shop) {
  const now = new Date();
  
  try {
    const activeSchedule = await prisma.templateSchedule.findFirst({
      where: {
        shop,
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        template: true
      },
      orderBy: [
        { priority: 'desc' },
        { startDate: 'desc' }
      ]
    });
    
    return activeSchedule?.template || null;
  } catch (error) {
    console.error('Error getting active template:', error);
    return null;
  }
}

// Helper function to check for schedule conflicts
export async function checkScheduleConflicts(shop, startDate, endDate, excludeScheduleId = null) {
  const whereClause = {
    shop,
    isActive: true,
    OR: [
      // New schedule starts during existing schedule
      {
        AND: [
          { startDate: { lte: new Date(startDate) } },
          { endDate: { gte: new Date(startDate) } }
        ]
      },
      // New schedule ends during existing schedule (if endDate provided)
      endDate ? {
        AND: [
          { startDate: { lte: new Date(endDate) } },
          { endDate: { gte: new Date(endDate) } }
        ]
      } : {},
      // New schedule encompasses existing schedule (if endDate provided)
      endDate ? {
        AND: [
          { startDate: { gte: new Date(startDate) } },
          { endDate: { lte: new Date(endDate) } }
        ]
      } : {}
    ]
  };
  
  if (excludeScheduleId) {
    whereClause.id = { not: parseInt(excludeScheduleId) };
  }
  
  return await prisma.templateSchedule.findMany({ where: whereClause });
}

// Helper function to get campaign template suggestions
export function getCampaignTemplateSuggestions(campaignType) {
  const suggestions = {
    black_friday: {
      title: "BLACK FRIDAY EXCLUSIVE!",
      message: "Get 50% OFF everything! Limited time only!",
      buttonText: "Shop Black Friday",
      discountPercentage: 50,
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
      buttonColor: "#FF0000"
    },
    christmas: {
      title: "🎄 Holiday Special! 🎄",
      message: "Spread joy with 25% off your Christmas shopping",
      buttonText: "Get Holiday Discount",
      discountPercentage: 25,
      backgroundColor: "#00AA00",
      textColor: "#FFFFFF",
      buttonColor: "#FF0000"
    },
    valentines: {
      title: "💕 Valentine's Day Sale 💕",
      message: "Share the love with 20% off romantic gifts",
      buttonText: "Find Perfect Gift",
      discountPercentage: 20,
      backgroundColor: "#FF69B4",
      textColor: "#FFFFFF",
      buttonColor: "#8B0000"
    },
    summer: {
      title: "☀️ Summer Sale! ☀️",
      message: "Beat the heat with hot summer deals - 30% off!",
      buttonText: "Shop Summer Sale",
      discountPercentage: 30,
      backgroundColor: "#FFD700",
      textColor: "#000000",
      buttonColor: "#FF8C00"
    },
    flash_sale: {
      title: "⚡ FLASH SALE! ⚡",
      message: "Lightning deals - 40% off for the next 24 hours!",
      buttonText: "Grab Deal Now",
      discountPercentage: 40,
      backgroundColor: "#FF4500",
      textColor: "#FFFFFF",
      buttonColor: "#8B0000"
    },
    new_product: {
      title: "🚀 New Arrival! 🚀",
      message: "Be the first to try our latest product - 15% off!",
      buttonText: "Try New Product",
      discountPercentage: 15,
      backgroundColor: "#4169E1",
      textColor: "#FFFFFF",
      buttonColor: "#00CED1"
    }
  };
  
  return suggestions[campaignType] || {
    title: "Special Offer!",
    message: "Don't miss out on this exclusive deal",
    buttonText: "Get Offer",
    discountPercentage: 15,
    backgroundColor: "#6366F1",
    textColor: "#FFFFFF",
    buttonColor: "#059669"
  };
}
