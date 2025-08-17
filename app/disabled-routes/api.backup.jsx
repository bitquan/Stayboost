import { json } from "@remix-run/node";
import { validateRateLimitRequest } from "../utils/inputValidation.server";
import {
    createTimer,
    log,
    LOG_CATEGORIES,
    logError,
    logRequest
} from "../utils/logger.server";
import { checkRateLimit } from "../utils/simpleRateLimit.server";

// Helper functions to get backup modules with proper error handling
async function getBackupModules() {
  try {
    const [schedulerModule, managerModule] = await Promise.all([
      import("../utils/backupScheduler.server"),
      import("../utils/backup.server")
    ]);
    
    return {
      backupScheduler: schedulerModule.backupScheduler,
      backupManager: managerModule.backupManager
    };
  } catch (error) {
    logError.error('Failed to load backup modules', {
      error: error.message,
      category: LOG_CATEGORIES.SYSTEM,
    });
    throw new Error('Backup system not available');
  }
}

// Backup Management API
export async function loader({ request }) {
  const timer = createTimer('backup_api_request', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, 'admin');
    if (rateLimitResult.rateLimited) {
      timer.checkpoint('rate_limit_exceeded');
      return json(rateLimitResult.message, { 
        status: rateLimitResult.status 
      });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "status":
        return await getBackupStatus(timer, correlationId);
      
      case "list":
        return await listBackups(timer, correlationId);
      
      case "history":
        return await getBackupHistory(timer, correlationId);
      
      case "config":
        return await getBackupConfig(timer, correlationId);
      
      default:
        return await getBackupStatus(timer, correlationId);
    }

  } catch (error) {
    timer.checkpoint('error_occurred');
    
    logError(error, {
      endpoint: '/api/backup',
      action: new URL(request.url).searchParams.get("action"),
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    const response = json({ 
      error: "Internal server error",
      message: "Failed to process backup request"
    }, { 
      status: 500 
    });
    
    logRequest(request, response, timer.end());
    return response;
  }
}

export async function action({ request }) {
  const timer = createTimer('backup_api_action', LOG_CATEGORIES.API);
  const correlationId = logRequest(request);

  try {
    // Apply rate limiting for actions
    const rateLimitResult = await checkRateLimit(request, 'admin');
    if (rateLimitResult.rateLimited) {
      timer.checkpoint('rate_limit_exceeded');
      return json(rateLimitResult.message, { 
        status: rateLimitResult.status 
      });
    }

    const body = await request.json();
    const { action, ...params } = body;

    // Validate request
    const requestValidation = validateRateLimitRequest(request);
    if (!requestValidation.isValid) {
      timer.checkpoint('request_validation_failed');
      return json({ 
        error: "Invalid request",
        details: requestValidation.errors
      }, { 
        status: 400 
      });
    }

    switch (action) {
      case "create":
        return await createBackup(params, timer, correlationId);
      
      case "schedule":
        return await updateSchedule(params, timer, correlationId);
      
      case "cleanup":
        return await cleanupBackups(params, timer, correlationId);
      
      case "restore":
        return await restoreBackup(params, timer, correlationId);
      
      default:
        return json({ 
          error: "Invalid action",
          validActions: ["create", "schedule", "cleanup", "restore"]
        }, { 
          status: 400 
        });
    }

  } catch (error) {
    timer.checkpoint('error_occurred');
    
    logError(error, {
      endpoint: '/api/backup',
      method: 'POST',
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    const response = json({ 
      error: "Internal server error",
      message: "Failed to process backup action"
    }, { 
      status: 500 
    });
    
    logRequest(request, response, timer.end());
    return response;
  }
}

// Get backup status
async function getBackupStatus(timer, correlationId) {
  timer.checkpoint('getting_backup_status');
  
  try {
    // Get backup modules with proper initialization
    const { backupScheduler, backupManager } = await getBackupModules();
    
    const status = backupScheduler.getStatus();
    const managerStatus = backupManager.getStatus();
  
    log.info('Backup status requested', {
      isRunning: status.isRunning,
      lastBackupAt: status.lastBackupAt,
      nextBackupAt: status.nextBackupAt,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    const response = json({
      scheduler: {
        isRunning: status.isRunning,
        lastBackupAt: status.lastBackupAt,
        nextBackupAt: status.nextBackupAt,
        stats: status.stats,
      },
      manager: {
        isRunning: managerStatus.isRunning,
        config: managerStatus.config,
      },
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    logError('Failed to get backup status', {
      error: error.message,
      correlationId,
      category: LOG_CATEGORIES.API,
    });
    
    throw json({ error: 'Failed to get backup status' }, { status: 500 });
  }
}

// List available backups
async function listBackups(timer, correlationId) {
  timer.checkpoint('listing_backups');
  
  try {
    const { backupManager } = await getBackupModules();
    const backups = await backupManager.listBackups();
    
    log.info('Backup list requested', {
      backupCount: backups.length,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    const response = json({
      backups: backups.map(backup => ({
        name: backup.name,
        type: backup.type,
        size: backup.size,
        sizeFormatted: formatBytes(backup.size),
        createdAt: backup.createdAt,
        modifiedAt: backup.modifiedAt,
        metadata: backup.metadata ? {
          id: backup.metadata.id,
          type: backup.metadata.type,
          status: backup.metadata.status,
          validated: backup.metadata.validated,
          compressed: backup.metadata.compressed,
          filesCount: backup.metadata.files?.length || 0,
        } : null,
      })),
      total: backups.length,
      timestamp: new Date().toISOString(),
    });

    return response;

  } catch (error) {
    logError(error, {
      operation: 'listBackups',
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    return json({ 
      error: "Failed to list backups",
      backups: [],
      total: 0
    }, { 
      status: 500 
    });
  }
}

// Get backup history with stats
async function getBackupHistory(timer, correlationId) {
  timer.checkpoint('getting_backup_history');
  
  try {
    const { backupScheduler } = await getBackupModules();
    const history = await backupScheduler.getBackupHistory();
    
    log.info('Backup history requested', {
      totalBackups: history.total,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    const response = json({
      history: history.backups.map(backup => ({
        name: backup.name,
        type: backup.type,
        size: backup.size,
        sizeFormatted: formatBytes(backup.size),
        createdAt: backup.createdAt,
        status: backup.metadata?.status || 'unknown',
        validated: backup.metadata?.validated || false,
      })),
      stats: history.stats,
      total: history.total,
      timestamp: new Date().toISOString(),
    });

    return response;

  } catch (error) {
    logError(error, {
      operation: 'getBackupHistory',
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    return json({ 
      error: "Failed to get backup history",
      history: [],
      stats: {},
      total: 0
    }, { 
      status: 500 
    });
  }
}

// Get backup configuration
async function getBackupConfig(timer, correlationId) {
  timer.checkpoint('getting_backup_config');
  
  const config = {
    enabled: process.env.BACKUP_ENABLED !== 'false',
    frequency: process.env.BACKUP_FREQUENCY || 'daily',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    compression: process.env.BACKUP_COMPRESSION !== 'false',
    backupDir: process.env.BACKUP_DIR || './backups',
    availableFrequencies: ['hourly', 'daily', 'weekly', 'monthly'],
  };

  log.info('Backup config requested', {
    enabled: config.enabled,
    frequency: config.frequency,
    correlationId,
    category: LOG_CATEGORIES.API,
  });

  return json({
    config,
    timestamp: new Date().toISOString(),
  });
}

// Create a new backup
async function createBackup(params, timer, correlationId) {
  timer.checkpoint('creating_backup');
  
  const { backupManager } = await getBackupModules();
  
  if (backupManager.isRunning) {
    return json({ 
      error: "Backup already in progress",
      isRunning: true
    }, { 
      status: 409 
    });
  }

  try {
    log.info('Manual backup requested', {
      params,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    const backupResult = await backupManager.createFullBackup(params);
    
    timer.checkpoint('backup_completed');

    log.info('Manual backup completed', {
      backupId: backupResult.id,
      size: backupResult.size,
      files: backupResult.files.length,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    return json({
      success: true,
      backup: {
        id: backupResult.id,
        type: backupResult.type,
        status: backupResult.status,
        size: backupResult.size,
        sizeFormatted: formatBytes(backupResult.size),
        files: backupResult.files.length,
        validated: backupResult.validated,
        compressed: backupResult.compressed,
        timestamp: backupResult.timestamp,
      },
      message: "Backup created successfully"
    });

  } catch (error) {
    timer.checkpoint('backup_failed');
    
    logError(error, {
      operation: 'createBackup',
      params,
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    return json({ 
      error: "Failed to create backup",
      message: error.message
    }, { 
      status: 500 
    });
  }
}

// Update backup schedule
async function updateSchedule(params, timer, correlationId) {
  timer.checkpoint('updating_schedule');
  
  try {
    const { backupScheduler } = await getBackupModules();
    const { frequency, enabled } = params;
    
    if (frequency && !['hourly', 'daily', 'weekly', 'monthly'].includes(frequency)) {
      return json({ 
        error: "Invalid frequency",
        validFrequencies: ['hourly', 'daily', 'weekly', 'monthly']
      }, { 
        status: 400 
      });
    }

    // Update environment variables (this would typically be done through a config management system)
    if (frequency) {
      process.env.BACKUP_FREQUENCY = frequency;
    }
    
    if (enabled !== undefined) {
      process.env.BACKUP_ENABLED = enabled.toString();
    }

    // Update scheduler configuration
    backupScheduler.updateConfig({
      DEFAULT_FREQUENCY: frequency || backupScheduler.config.DEFAULT_FREQUENCY,
      DEFAULT_ENABLED: enabled !== undefined ? enabled : backupScheduler.config.DEFAULT_ENABLED,
    });

    log.info('Backup schedule updated', {
      frequency,
      enabled,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    return json({
      success: true,
      config: {
        frequency: frequency || backupScheduler.config.DEFAULT_FREQUENCY,
        enabled: enabled !== undefined ? enabled : backupScheduler.config.DEFAULT_ENABLED,
      },
      message: "Schedule updated successfully"
    });

  } catch (error) {
    timer.checkpoint('schedule_update_failed');
    
    logError(error, {
      operation: 'updateSchedule',
      params,
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    return json({ 
      error: "Failed to update schedule",
      message: error.message
    }, { 
      status: 500 
    });
  }
}

// Cleanup old backups
async function cleanupBackups(params, timer, correlationId) {
  timer.checkpoint('cleaning_backups');
  
  try {
    const { backupManager } = await getBackupModules();
    const { retentionDays = 30 } = params;
    
    if (retentionDays < 1 || retentionDays > 365) {
      return json({ 
        error: "Invalid retention days",
        message: "Retention days must be between 1 and 365"
      }, { 
        status: 400 
      });
    }

    const cleanupResult = await backupManager.cleanupOldBackups(retentionDays);
    
    timer.checkpoint('cleanup_completed');

    log.info('Manual cleanup completed', {
      retentionDays,
      deletedCount: cleanupResult.deletedCount,
      correlationId,
      category: LOG_CATEGORIES.API,
    });

    return json({
      success: true,
      cleanup: {
        retentionDays,
        deletedCount: cleanupResult.deletedCount,
        remainingCount: cleanupResult.remainingCount,
        totalBackups: cleanupResult.totalBackups,
      },
      message: `Cleaned up ${cleanupResult.deletedCount} old backups`
    });

  } catch (error) {
    timer.checkpoint('cleanup_failed');
    
    logError(error, {
      operation: 'cleanupBackups',
      params,
      correlationId,
      category: LOG_CATEGORIES.ERROR,
    });

    return json({ 
      error: "Failed to cleanup backups",
      message: error.message
    }, { 
      status: 500 
    });
  }
}

// Restore backup (placeholder - implement based on needs)
async function restoreBackup(params, timer, correlationId) {
  timer.checkpoint('restore_requested');
  
  // For now, return not implemented
  // Full restore functionality would require careful planning and testing
  
  log.warn('Backup restore requested but not implemented', {
    params,
    correlationId,
    category: LOG_CATEGORIES.API,
  });

  return json({ 
    error: "Restore functionality not implemented",
    message: "Backup restore requires manual process for safety"
  }, { 
    status: 501 
  });
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
