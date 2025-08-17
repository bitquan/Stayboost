// Automated Backup System for StayBoost
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { db } from '../db.server.js';
import { log, LOG_CATEGORIES, logError } from './logger.server.js';

// Backup configuration
export const BACKUP_CONFIG = {
  // Backup frequency options
  FREQUENCIES: {
    HOURLY: 'hourly',
    DAILY: 'daily', 
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
  },
  
  // Backup types
  TYPES: {
    DATABASE: 'database',
    APPLICATION: 'application',
    FULL: 'full',
  },
  
  // Default settings
  DEFAULT_RETENTION_DAYS: 30,
  DEFAULT_FREQUENCY: 'daily',
  DEFAULT_COMPRESSION: true,
  
  // Backup paths
  BACKUP_DIR: process.env.BACKUP_DIR || './backups',
  MAX_BACKUP_SIZE: 1024 * 1024 * 1024, // 1GB limit
};

// Backup error types
export class BackupError extends Error {
  constructor(message, type, details) {
    super(message);
    this.name = 'BackupError';
    this.type = type;
    this.details = details;
  }
}

// Main backup class
export class BackupManager {
  constructor(options = {}) {
    this.config = {
      ...BACKUP_CONFIG,
      ...options,
    };
    this.isRunning = false;
  }

  /**
   * Create a full system backup
   */
  async createFullBackup(options = {}) {
    const backupId = this.generateBackupId();
    const backupPath = await this.createBackupDirectory(backupId);
    
    log.info('Starting full system backup', {
      backupId,
      backupPath,
      category: LOG_CATEGORIES.SYSTEM,
    });

    try {
      this.isRunning = true;
      const backupMetadata = {
        id: backupId,
        type: BACKUP_CONFIG.TYPES.FULL,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        status: 'in_progress',
        files: [],
        size: 0,
      };

      // 1. Backup database
      log.info('Creating database backup', { backupId, category: LOG_CATEGORIES.SYSTEM });
      const dbBackupPath = await this.backupDatabase(backupPath, backupId);
      backupMetadata.files.push({
        type: 'database',
        path: dbBackupPath,
        timestamp: new Date().toISOString(),
      });

      // 2. Backup application data
      log.info('Creating application data backup', { backupId, category: LOG_CATEGORIES.SYSTEM });
      const appBackupPath = await this.backupApplicationData(backupPath, backupId);
      backupMetadata.files.push({
        type: 'application',
        path: appBackupPath,
        timestamp: new Date().toISOString(),
      });

      // 3. Create backup manifest
      const manifestPath = await this.createBackupManifest(backupPath, backupMetadata);
      backupMetadata.files.push({
        type: 'manifest',
        path: manifestPath,
        timestamp: new Date().toISOString(),
      });

      // 4. Calculate total backup size
      backupMetadata.size = await this.calculateBackupSize(backupPath);
      backupMetadata.status = 'completed';
      backupMetadata.completedAt = new Date().toISOString();

      // 5. Validate backup integrity
      const isValid = await this.validateBackup(backupPath, backupMetadata);
      backupMetadata.validated = isValid;

      // 6. Update manifest with final metadata
      await this.updateBackupManifest(manifestPath, backupMetadata);

      // 7. Compress backup if enabled
      if (this.config.DEFAULT_COMPRESSION) {
        log.info('Compressing backup', { backupId, category: LOG_CATEGORIES.SYSTEM });
        const compressedPath = await this.compressBackup(backupPath, backupId);
        backupMetadata.compressed = true;
        backupMetadata.compressedPath = compressedPath;
      }

      log.info('Full system backup completed successfully', {
        backupId,
        size: backupMetadata.size,
        files: backupMetadata.files.length,
        compressed: backupMetadata.compressed,
        category: LOG_CATEGORIES.SYSTEM,
      });

      return backupMetadata;

    } catch (error) {
      logError(error, {
        operation: 'createFullBackup',
        backupId,
        category: LOG_CATEGORIES.ERROR,
      });
      throw new BackupError('Failed to create full backup', 'BACKUP_FAILED', {
        backupId,
        error: error.message,
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Create database backup using Prisma
   */
  async backupDatabase(backupPath, backupId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbBackupFile = `database-${backupId}-${timestamp}.sql`;
    const dbBackupPath = join(backupPath, dbBackupFile);

    try {
      // Get database URL from Prisma
      const databaseUrl = process.env.DATABASE_URL || 'file:./dev.sqlite';
      
      if (databaseUrl.startsWith('file:')) {
        // SQLite backup
        await this.backupSQLite(databaseUrl, dbBackupPath);
      } else if (databaseUrl.startsWith('postgresql:')) {
        // PostgreSQL backup
        await this.backupPostgreSQL(databaseUrl, dbBackupPath);
      } else {
        throw new BackupError('Unsupported database type', 'UNSUPPORTED_DB', {
          databaseUrl: databaseUrl.substring(0, 20) + '...',
        });
      }

      log.info('Database backup completed', {
        backupFile: dbBackupFile,
        path: dbBackupPath,
        category: LOG_CATEGORIES.SYSTEM,
      });

      return dbBackupPath;

    } catch (error) {
      logError(error, {
        operation: 'backupDatabase',
        backupId,
        category: LOG_CATEGORIES.ERROR,
      });
      throw new BackupError('Database backup failed', 'DB_BACKUP_FAILED', {
        backupId,
        error: error.message,
      });
    }
  }

  /**
   * Backup SQLite database
   */
  async backupSQLite(databaseUrl, backupPath) {
    const dbPath = databaseUrl.replace('file:', '');
    
    try {
      // Use SQLite's .backup command for consistent backup
      const command = `sqlite3 "${dbPath}" ".backup '${backupPath}'"`;
      execSync(command, { encoding: 'utf8' });
      
      log.info('SQLite backup completed', {
        sourcePath: dbPath,
        backupPath,
        category: LOG_CATEGORIES.SYSTEM,
      });
      
    } catch (error) {
      // Fallback to file copy if sqlite3 command not available
      log.warn('SQLite command failed, using file copy fallback', {
        error: error.message,
        category: LOG_CATEGORIES.SYSTEM,
      });
      
      await fs.copyFile(dbPath, backupPath);
    }
  }

  /**
   * Backup PostgreSQL database
   */
  async backupPostgreSQL(databaseUrl, backupPath) {
    try {
      const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;
      execSync(command, { encoding: 'utf8' });
      
      log.info('PostgreSQL backup completed', {
        backupPath,
        category: LOG_CATEGORIES.SYSTEM,
      });
      
    } catch (error) {
      throw new BackupError('PostgreSQL backup failed', 'PG_BACKUP_FAILED', {
        error: error.message,
        command: 'pg_dump',
      });
    }
  }

  /**
   * Backup application data (settings, configurations, etc.)
   */
  async backupApplicationData(backupPath, backupId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const appBackupFile = `application-${backupId}-${timestamp}.json`;
    const appBackupPath = join(backupPath, appBackupFile);

    try {
      // Collect application data
      const applicationData = {
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        settings: await this.exportApplicationSettings(),
        analytics: await this.exportAnalyticsData(),
        metadata: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };

      // Write application data to file
      await fs.writeFile(
        appBackupPath,
        JSON.stringify(applicationData, null, 2),
        'utf8'
      );

      log.info('Application data backup completed', {
        backupFile: appBackupFile,
        path: appBackupPath,
        settingsCount: applicationData.settings.totalSettings || 0,
        category: LOG_CATEGORIES.SYSTEM,
      });

      return appBackupPath;

    } catch (error) {
      logError(error, {
        operation: 'backupApplicationData',
        backupId,
        category: LOG_CATEGORIES.ERROR,
      });
      throw new BackupError('Application data backup failed', 'APP_BACKUP_FAILED', {
        backupId,
        error: error.message,
      });
    }
  }

  /**
   * Export application settings
   */
  async exportApplicationSettings() {
    try {
      // Get all popup settings from database
      const popupSettings = await db.popupSettings.findMany({
        select: {
          id: true,
          shop: true,
          enabled: true,
          title: true,
          message: true,
          discountCode: true,
          discountPercentage: true,
          delaySeconds: true,
          showOnce: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        popupSettings,
        totalSettings: popupSettings.length,
        exportedAt: new Date().toISOString(),
      };

    } catch (error) {
      logError(error, {
        operation: 'exportApplicationSettings',
        category: LOG_CATEGORIES.ERROR,
      });
      return {
        popupSettings: [],
        totalSettings: 0,
        exportedAt: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData() {
    try {
      // Note: This would include analytics data if we had analytics tables
      // For now, return placeholder structure
      return {
        totalAnalytics: 0,
        exportedAt: new Date().toISOString(),
        note: 'Analytics export will be implemented when analytics tables are added',
      };

    } catch (error) {
      logError(error, {
        operation: 'exportAnalyticsData',
        category: LOG_CATEGORIES.ERROR,
      });
      return {
        totalAnalytics: 0,
        exportedAt: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Create backup manifest file
   */
  async createBackupManifest(backupPath, metadata) {
    const manifestPath = join(backupPath, 'backup-manifest.json');
    
    await fs.writeFile(
      manifestPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    return manifestPath;
  }

  /**
   * Update backup manifest with final metadata
   */
  async updateBackupManifest(manifestPath, metadata) {
    await fs.writeFile(
      manifestPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupPath, metadata) {
    try {
      // Check if all expected files exist
      for (const file of metadata.files) {
        const filePath = file.path;
        try {
          await fs.access(filePath);
          const stats = await fs.stat(filePath);
          
          if (stats.size === 0) {
            log.warn('Backup file is empty', {
              filePath,
              type: file.type,
              category: LOG_CATEGORIES.SYSTEM,
            });
            return false;
          }
        } catch (error) {
          log.error('Backup file missing or inaccessible', {
            filePath,
            type: file.type,
            error: error.message,
            category: LOG_CATEGORIES.ERROR,
          });
          return false;
        }
      }

      // Additional validation for database backups
      const dbBackup = metadata.files.find(f => f.type === 'database');
      if (dbBackup) {
        const isValidDb = await this.validateDatabaseBackup(dbBackup.path);
        if (!isValidDb) {
          return false;
        }
      }

      log.info('Backup validation passed', {
        backupId: metadata.id,
        filesValidated: metadata.files.length,
        category: LOG_CATEGORIES.SYSTEM,
      });

      return true;

    } catch (error) {
      logError(error, {
        operation: 'validateBackup',
        backupId: metadata.id,
        category: LOG_CATEGORIES.ERROR,
      });
      return false;
    }
  }

  /**
   * Validate database backup file
   */
  async validateDatabaseBackup(dbBackupPath) {
    try {
      const stats = await fs.stat(dbBackupPath);
      
      // Check file size is reasonable
      if (stats.size < 1024) { // Less than 1KB is suspicious
        log.warn('Database backup file too small', {
          path: dbBackupPath,
          size: stats.size,
          category: LOG_CATEGORIES.SYSTEM,
        });
        return false;
      }

      // Check if file contains expected database content
      const content = await fs.readFile(dbBackupPath, 'utf8');
      const hasTableStructure = content.includes('CREATE TABLE') || 
                               content.includes('PRAGMA') || 
                               content.includes('INSERT INTO');

      if (!hasTableStructure) {
        log.warn('Database backup does not contain expected content', {
          path: dbBackupPath,
          category: LOG_CATEGORIES.SYSTEM,
        });
        return false;
      }

      return true;

    } catch (error) {
      logError(error, {
        operation: 'validateDatabaseBackup',
        path: dbBackupPath,
        category: LOG_CATEGORIES.ERROR,
      });
      return false;
    }
  }

  /**
   * Compress backup directory
   */
  async compressBackup(backupPath, backupId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const compressedFile = `backup-${backupId}-${timestamp}.tar.gz`;
    const compressedPath = join(dirname(backupPath), compressedFile);

    try {
      const command = `tar -czf "${compressedPath}" -C "${dirname(backupPath)}" "${backupId}"`;
      execSync(command, { encoding: 'utf8' });

      // Remove uncompressed directory
      await fs.rm(backupPath, { recursive: true, force: true });

      log.info('Backup compression completed', {
        backupId,
        compressedFile,
        compressedPath,
        category: LOG_CATEGORIES.SYSTEM,
      });

      return compressedPath;

    } catch (error) {
      logError(error, {
        operation: 'compressBackup',
        backupId,
        category: LOG_CATEGORIES.ERROR,
      });
      throw new BackupError('Backup compression failed', 'COMPRESSION_FAILED', {
        backupId,
        error: error.message,
      });
    }
  }

  /**
   * Calculate total backup size
   */
  async calculateBackupSize(backupPath) {
    try {
      const files = await fs.readdir(backupPath, { recursive: true });
      let totalSize = 0;

      for (const file of files) {
        const filePath = join(backupPath, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }

      return totalSize;

    } catch (error) {
      logError(error, {
        operation: 'calculateBackupSize',
        path: backupPath,
        category: LOG_CATEGORIES.ERROR,
      });
      return 0;
    }
  }

  /**
   * Generate unique backup ID
   */
  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `backup-${timestamp}-${random}`;
  }

  /**
   * Create backup directory
   */
  async createBackupDirectory(backupId) {
    const backupPath = join(this.config.BACKUP_DIR, backupId);
    
    try {
      await fs.mkdir(backupPath, { recursive: true });
      return backupPath;
    } catch (error) {
      throw new BackupError('Failed to create backup directory', 'DIRECTORY_CREATION_FAILED', {
        backupId,
        path: backupPath,
        error: error.message,
      });
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const backupDir = this.config.BACKUP_DIR;
      
      // Ensure backup directory exists
      try {
        await fs.access(backupDir);
      } catch (error) {
        return [];
      }

      const entries = await fs.readdir(backupDir, { withFileTypes: true });
      const backups = [];

      for (const entry of entries) {
        if (entry.isDirectory() || entry.name.endsWith('.tar.gz')) {
          const backupPath = join(backupDir, entry.name);
          const manifestPath = entry.isDirectory() 
            ? join(backupPath, 'backup-manifest.json')
            : null;

          try {
            let metadata = null;
            if (manifestPath) {
              const manifestContent = await fs.readFile(manifestPath, 'utf8');
              metadata = JSON.parse(manifestContent);
            }

            const stats = await fs.stat(backupPath);
            backups.push({
              name: entry.name,
              path: backupPath,
              type: entry.isDirectory() ? 'directory' : 'compressed',
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              metadata,
            });
          } catch (error) {
            // Skip backups that can't be read
            continue;
          }
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.createdAt - a.createdAt);

      return backups;

    } catch (error) {
      logError(error, {
        operation: 'listBackups',
        category: LOG_CATEGORIES.ERROR,
      });
      return [];
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(retentionDays = BACKUP_CONFIG.DEFAULT_RETENTION_DAYS) {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const backupsToDelete = backups.filter(backup => 
        backup.createdAt < cutoffDate
      );

      let deletedCount = 0;
      for (const backup of backupsToDelete) {
        try {
          if (backup.type === 'directory') {
            await fs.rm(backup.path, { recursive: true, force: true });
          } else {
            await fs.unlink(backup.path);
          }
          deletedCount++;
          
          log.info('Deleted old backup', {
            backupName: backup.name,
            createdAt: backup.createdAt,
            category: LOG_CATEGORIES.SYSTEM,
          });
        } catch (error) {
          logError(error, {
            operation: 'deleteOldBackup',
            backupName: backup.name,
            category: LOG_CATEGORIES.ERROR,
          });
        }
      }

      log.info('Backup cleanup completed', {
        retentionDays,
        totalBackups: backups.length,
        deletedCount,
        remainingCount: backups.length - deletedCount,
        category: LOG_CATEGORIES.SYSTEM,
      });

      return {
        totalBackups: backups.length,
        deletedCount,
        remainingCount: backups.length - deletedCount,
      };

    } catch (error) {
      logError(error, {
        operation: 'cleanupOldBackups',
        retentionDays,
        category: LOG_CATEGORIES.ERROR,
      });
      throw new BackupError('Failed to cleanup old backups', 'CLEANUP_FAILED', {
        retentionDays,
        error: error.message,
      });
    }
  }

  /**
   * Get backup status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
    };
  }
}

// Create default backup manager instance
export const backupManager = new BackupManager();
