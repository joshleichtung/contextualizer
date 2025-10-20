/**
 * Generation System Exports
 *
 * Central export point for file generation components.
 */

export {
  generateFiles,
  checkConflicts,
  type GenerateOptions,
  type GeneratedFile,
  type GenerationResult,
} from './file-generator.js';

export {
  createBackupSession,
  backupFile,
  backupFiles,
  restoreFromBackup,
  saveBackupManifest,
  loadBackupManifest,
  cleanupOldBackups,
  type BackupConfig,
} from './backup.js';

export {
  ensureGitRepository,
  createGitAttributes,
  createInitCommit,
  isWorkingDirectoryClean,
  getUncommittedFiles,
  stageFiles,
  isGitAvailable,
} from './git-integration.js';
