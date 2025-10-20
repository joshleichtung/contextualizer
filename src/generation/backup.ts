/**
 * Backup System
 *
 * Creates timestamped backups before file generation operations.
 * Enables rollback on failure.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { ensureDirWithRetry, writeFileWithRetry } from '../utils/fs-resilient.js';
import { logger } from '../utils/logger.js';

/**
 * Backup configuration
 */
export interface BackupConfig {
  /** Base backup directory */
  backupDir: string;

  /** Timestamp for this backup session */
  timestamp: string;

  /** List of backed up files */
  files: Array<{ original: string; backup: string }>;
}

/**
 * Create a backup directory for a session
 *
 * @param projectRoot - Project root directory
 * @returns Backup configuration
 */
export async function createBackupSession(
  projectRoot: string = process.cwd()
): Promise<BackupConfig> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(
    projectRoot,
    '.contextualizer',
    'backup',
    `backup-${timestamp}`
  );

  await ensureDirWithRetry(backupDir);

  logger.info({ backupDir, timestamp }, 'Backup session created');

  return {
    backupDir,
    timestamp,
    files: [],
  };
}

/**
 * Backup a file before modification
 *
 * @param filePath - File to backup
 * @param config - Backup configuration
 * @returns Backup file path
 */
export async function backupFile(
  filePath: string,
  config: BackupConfig
): Promise<string> {
  try {
    // Check if file exists
    const exists = await fs.pathExists(filePath);

    if (!exists) {
      logger.debug({ filePath }, 'File does not exist, skipping backup');
      return '';
    }

    // Create relative path for backup
    const relativePath = path.relative(process.cwd(), filePath);
    const backupPath = path.join(config.backupDir, relativePath);

    // Ensure backup directory exists
    await ensureDirWithRetry(path.dirname(backupPath));

    // Copy file to backup
    await fs.copy(filePath, backupPath, { overwrite: true });

    // Record backup
    config.files.push({
      original: filePath,
      backup: backupPath,
    });

    logger.debug({ filePath, backupPath }, 'File backed up');

    return backupPath;
  } catch (error) {
    logger.error({ filePath, error }, 'Failed to backup file');
    throw new Error(
      `Failed to backup file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Backup multiple files
 *
 * @param filePaths - Files to backup
 * @param config - Backup configuration
 * @returns Array of backup file paths
 */
export async function backupFiles(
  filePaths: string[],
  config: BackupConfig
): Promise<string[]> {
  logger.info({ fileCount: filePaths.length }, 'Backing up multiple files');

  const backupPaths: string[] = [];

  for (const filePath of filePaths) {
    const backupPath = await backupFile(filePath, config);
    if (backupPath) {
      backupPaths.push(backupPath);
    }
  }

  logger.info(
    { fileCount: filePaths.length, backedUp: backupPaths.length },
    'Files backed up'
  );

  return backupPaths;
}

/**
 * Restore files from backup
 *
 * @param config - Backup configuration
 */
export async function restoreFromBackup(config: BackupConfig): Promise<void> {
  logger.info(
    { backupDir: config.backupDir, fileCount: config.files.length },
    'Restoring from backup'
  );

  for (const { original, backup } of config.files) {
    try {
      // Check if backup exists
      const exists = await fs.pathExists(backup);

      if (!exists) {
        logger.warn({ backup }, 'Backup file not found, skipping restore');
        continue;
      }

      // Ensure target directory exists
      await ensureDirWithRetry(path.dirname(original));

      // Copy backup back to original location
      await fs.copy(backup, original, { overwrite: true });

      logger.debug({ original, backup }, 'File restored from backup');
    } catch (error) {
      logger.error({ original, backup, error }, 'Failed to restore file');
      // Continue with other files even if one fails
    }
  }

  logger.info({ fileCount: config.files.length }, 'Restore complete');
}

/**
 * Save backup manifest
 *
 * @param config - Backup configuration
 */
export async function saveBackupManifest(config: BackupConfig): Promise<void> {
  const manifestPath = path.join(config.backupDir, 'manifest.json');

  const manifest = {
    timestamp: config.timestamp,
    backupDir: config.backupDir,
    files: config.files,
    createdAt: new Date().toISOString(),
  };

  await writeFileWithRetry(manifestPath, JSON.stringify(manifest, null, 2));

  logger.debug({ manifestPath }, 'Backup manifest saved');
}

/**
 * Load backup manifest
 *
 * @param backupDir - Backup directory
 * @returns Backup configuration
 */
export async function loadBackupManifest(
  backupDir: string
): Promise<BackupConfig> {
  const manifestPath = path.join(backupDir, 'manifest.json');

  const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);

  logger.debug({ backupDir }, 'Backup manifest loaded');

  return {
    backupDir: manifest.backupDir,
    timestamp: manifest.timestamp,
    files: manifest.files,
  };
}

/**
 * Clean up old backups
 *
 * @param projectRoot - Project root directory
 * @param keepCount - Number of recent backups to keep (default: 10)
 */
export async function cleanupOldBackups(
  projectRoot: string = process.cwd(),
  keepCount: number = 10
): Promise<void> {
  const backupBaseDir = path.join(projectRoot, '.contextualizer', 'backup');

  try {
    const exists = await fs.pathExists(backupBaseDir);
    if (!exists) {
      return;
    }

    const entries = await fs.readdir(backupBaseDir);
    const backupDirs = entries
      .filter((entry) => entry.startsWith('backup-'))
      .sort()
      .reverse();

    if (backupDirs.length <= keepCount) {
      return;
    }

    const toDelete = backupDirs.slice(keepCount);

    logger.info(
      { total: backupDirs.length, keeping: keepCount, deleting: toDelete.length },
      'Cleaning up old backups'
    );

    for (const dir of toDelete) {
      const dirPath = path.join(backupBaseDir, dir);
      await fs.remove(dirPath);
      logger.debug({ dirPath }, 'Old backup deleted');
    }

    logger.info({ deletedCount: toDelete.length }, 'Old backups cleaned up');
  } catch (error) {
    logger.warn({ error }, 'Failed to clean up old backups');
    // Non-fatal error, just log and continue
  }
}
