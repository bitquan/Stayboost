// Backup Scheduler for StayBoost
import { BACKUP_CONFIG, backupManager } from './backup.server.js';
import { log, LOG_CATEGORIES, logError } from './logger.server.js';

// Scheduler configuration
export const SCHEDULER_CONFIG = {
  // Intervals in milliseconds
  INTERVALS: {
    HOURLY: 60 * 60 * 1000,        // 1 hour
    DAILY: 24 * 60 * 60 * 1000,    // 24 hours
    WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days
    MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  
  // Default settings
  DEFAULT_FREQUENCY: BACKUP_CONFIG.FREQUENCIES.DAILY,
  DEFAULT_ENABLED: true,
  MAX_CONCURRENT_BACKUPS: 1,
};

// Backup scheduler class
export class BackupScheduler {
  constructor(options = {}) {
    this.config = {
      ...SCHEDULER_CONFIG,
      ...options,
    };
    
    this.intervalId = null;
    this.isRunning = false;
    this.lastBackupAt = null;
    this.nextBackupAt = null;
    this.backupQueue = [];
    this.stats = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      lastError: null,
    };
  }

  /**
   * Start the backup scheduler
   */
  start(frequency = this.config.DEFAULT_FREQUENCY) {
    if (this.intervalId) {
      log.warn('Backup scheduler already running', {
        frequency,
        category: LOG_CATEGORIES.SYSTEM,
      });
      return;
    }

    const interval = this.getInterval(frequency);
    if (!interval) {
      log.error('Invalid backup frequency', {
        frequency,
        category: LOG_CATEGORIES.ERROR,
      });
      return;
    }

    this.intervalId = setInterval(async () => {
      await this.executeScheduledBackup();
    }, interval);

    this.isRunning = true;
    this.calculateNextBackupTime(frequency);

    log.info('Backup scheduler started', {
      frequency,
      interval,
      nextBackupAt: this.nextBackupAt,
      category: LOG_CATEGORIES.SYSTEM,
    });

    // Run initial backup if none exists
    this.scheduleInitialBackup();
  }

  /**
   * Stop the backup scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      this.nextBackupAt = null;

      log.info('Backup scheduler stopped', {
        category: LOG_CATEGORIES.SYSTEM,
      });
    }
  }

  /**
   * Execute a scheduled backup
   */
  async executeScheduledBackup() {
    if (backupManager.isRunning) {
      log.warn('Backup already in progress, skipping scheduled backup', {
        category: LOG_CATEGORIES.SYSTEM,
      });
      return;
    }

    try {
      log.info('Starting scheduled backup', {
        scheduledAt: new Date().toISOString(),
        category: LOG_CATEGORIES.SYSTEM,
      });

      const backupResult = await backupManager.createFullBackup();
      
      this.lastBackupAt = new Date();
      this.stats.totalBackups++;
      this.stats.successfulBackups++;

      log.info('Scheduled backup completed successfully', {
        backupId: backupResult.id,
        size: backupResult.size,
        files: backupResult.files.length,
        category: LOG_CATEGORIES.SYSTEM,
      });

      // Clean up old backups after successful backup
      await this.cleanupAfterBackup();

    } catch (error) {
      this.stats.totalBackups++;
      this.stats.failedBackups++;
      this.stats.lastError = {
        message: error.message,
        timestamp: new Date().toISOString(),
      };

      logError(error, {
        operation: 'executeScheduledBackup',
        category: LOG_CATEGORIES.ERROR,
      });
    }
  }

  /**
   * Schedule initial backup if none exists
   */
  async scheduleInitialBackup() {
    try {
      const existingBackups = await backupManager.listBackups();
      
      if (existingBackups.length === 0) {
        log.info('No existing backups found, scheduling initial backup', {
          category: LOG_CATEGORIES.SYSTEM,
        });
        
        // Schedule initial backup in 30 seconds
        setTimeout(async () => {
          await this.executeScheduledBackup();
        }, 30000);
      }
    } catch (error) {
      logError(error, {
        operation: 'scheduleInitialBackup',
        category: LOG_CATEGORIES.ERROR,
      });
    }
  }

  /**
   * Clean up old backups after successful backup
   */
  async cleanupAfterBackup() {
    try {
      const retentionDays = process.env.BACKUP_RETENTION_DAYS || 
                          BACKUP_CONFIG.DEFAULT_RETENTION_DAYS;
      
      const cleanupResult = await backupManager.cleanupOldBackups(retentionDays);
      
      log.info('Backup cleanup completed', {
        retentionDays,
        deletedCount: cleanupResult.deletedCount,
        remainingCount: cleanupResult.remainingCount,
        category: LOG_CATEGORIES.SYSTEM,
      });

    } catch (error) {
      logError(error, {
        operation: 'cleanupAfterBackup',
        category: LOG_CATEGORIES.ERROR,
      });
    }
  }

  /**
   * Get interval in milliseconds for frequency
   */
  getInterval(frequency) {
    switch (frequency) {
      case BACKUP_CONFIG.FREQUENCIES.HOURLY:
        return SCHEDULER_CONFIG.INTERVALS.HOURLY;
      case BACKUP_CONFIG.FREQUENCIES.DAILY:
        return SCHEDULER_CONFIG.INTERVALS.DAILY;
      case BACKUP_CONFIG.FREQUENCIES.WEEKLY:
        return SCHEDULER_CONFIG.INTERVALS.WEEKLY;
      case BACKUP_CONFIG.FREQUENCIES.MONTHLY:
        return SCHEDULER_CONFIG.INTERVALS.MONTHLY;
      default:
        return null;
    }
  }

  /**
   * Calculate next backup time
   */
  calculateNextBackupTime(frequency) {
    const interval = this.getInterval(frequency);
    if (interval) {
      this.nextBackupAt = new Date(Date.now() + interval);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastBackupAt: this.lastBackupAt,
      nextBackupAt: this.nextBackupAt,
      stats: this.stats,
      config: this.config,
      backupManagerStatus: backupManager.getStatus(),
    };
  }

  /**
   * Force backup now (outside of schedule)
   */
  async forceBackup() {
    if (backupManager.isRunning) {
      throw new Error('Backup already in progress');
    }

    log.info('Force backup requested', {
      requestedAt: new Date().toISOString(),
      category: LOG_CATEGORIES.SYSTEM,
    });

    return await this.executeScheduledBackup();
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig) {
    const oldConfig = { ...this.config };
    this.config = {
      ...this.config,
      ...newConfig,
    };

    log.info('Backup scheduler configuration updated', {
      oldConfig: {
        frequency: oldConfig.DEFAULT_FREQUENCY,
        enabled: oldConfig.DEFAULT_ENABLED,
      },
      newConfig: {
        frequency: this.config.DEFAULT_FREQUENCY,
        enabled: this.config.DEFAULT_ENABLED,
      },
      category: LOG_CATEGORIES.SYSTEM,
    });

    // Restart scheduler if frequency changed and scheduler is running
    if (this.isRunning && oldConfig.DEFAULT_FREQUENCY !== this.config.DEFAULT_FREQUENCY) {
      this.stop();
      this.start(this.config.DEFAULT_FREQUENCY);
    }
  }

  /**
   * Get backup history
   */
  async getBackupHistory() {
    try {
      const backups = await backupManager.listBackups();
      return {
        backups,
        total: backups.length,
        stats: this.stats,
      };
    } catch (error) {
      logError(error, {
        operation: 'getBackupHistory',
        category: LOG_CATEGORIES.ERROR,
      });
      return {
        backups: [],
        total: 0,
        stats: this.stats,
        error: error.message,
      };
    }
  }
}

// Create default scheduler instance
export const backupScheduler = new BackupScheduler();

// Auto-start scheduler if enabled in environment
if (process.env.BACKUP_ENABLED !== 'false') {
  const frequency = process.env.BACKUP_FREQUENCY || SCHEDULER_CONFIG.DEFAULT_FREQUENCY;
  
  // Start scheduler after a short delay to allow app initialization
  setTimeout(() => {
    backupScheduler.start(frequency);
  }, 5000);
  
  log.info('Backup scheduler auto-started', {
    frequency,
    autoStart: true,
    category: LOG_CATEGORIES.SYSTEM,
  });
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  log.info('Received SIGTERM, stopping backup scheduler', {
    category: LOG_CATEGORIES.SYSTEM,
  });
  backupScheduler.stop();
});

process.on('SIGINT', () => {
  log.info('Received SIGINT, stopping backup scheduler', {
    category: LOG_CATEGORIES.SYSTEM,
  });
  backupScheduler.stop();
});
