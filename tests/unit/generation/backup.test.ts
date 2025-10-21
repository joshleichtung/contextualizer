/**
 * Backup System Tests
 *
 * Comprehensive tests for backup creation, restoration, and management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  createBackupSession,
  backupFile,
  backupFiles,
  restoreFromBackup,
  saveBackupManifest,
  loadBackupManifest,
  cleanupOldBackups,
  type BackupConfig,
} from '../../../src/generation/backup.js';

describe('Backup System', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  describe('createBackupSession', () => {
    it('creates backup session with timestamp', async () => {
      const config = await createBackupSession(tempDir);

      expect(config).toBeDefined();
      expect(config.backupDir).toContain('.contextualizer/backup/backup-');
      expect(config.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(config.files).toEqual([]);
    });

    it('creates backup directory structure', async () => {
      const config = await createBackupSession(tempDir);

      const exists = await fs.pathExists(config.backupDir);
      expect(exists).toBe(true);
    });

    it('uses current directory by default', async () => {
      const config = await createBackupSession();

      expect(config.backupDir).toContain(process.cwd());
    });

    it('generates unique timestamps for consecutive sessions', async () => {
      const config1 = await createBackupSession(tempDir);
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const config2 = await createBackupSession(tempDir);

      expect(config1.timestamp).not.toBe(config2.timestamp);
      expect(config1.backupDir).not.toBe(config2.backupDir);
    });
  });

  describe('backupFile', () => {
    let config: BackupConfig;

    beforeEach(async () => {
      config = await createBackupSession(tempDir);
    });

    it('backs up existing file', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const backupPath = await backupFile(testFile, config);

      expect(backupPath).toBeTruthy();
      const exists = await fs.pathExists(backupPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(backupPath, 'utf-8');
      expect(content).toBe('test content');
    });

    it('records backup in config', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      await backupFile(testFile, config);

      expect(config.files).toHaveLength(1);
      expect(config.files[0].original).toBe(testFile);
      expect(config.files[0].backup).toContain('backup-');
    });

    it('handles nested file paths', async () => {
      const nestedFile = path.join(tempDir, 'nested', 'deep', 'file.txt');
      await fs.ensureDir(path.dirname(nestedFile));
      await fs.writeFile(nestedFile, 'nested content');

      const backupPath = await backupFile(nestedFile, config);

      expect(backupPath).toBeTruthy();
      const exists = await fs.pathExists(backupPath);
      expect(exists).toBe(true);
    });

    it('returns empty string for non-existent file', async () => {
      const nonExistent = path.join(tempDir, 'nonexistent.txt');

      const backupPath = await backupFile(nonExistent, config);

      expect(backupPath).toBe('');
      expect(config.files).toHaveLength(0);
    });

    it('overwrites existing backup', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'original content');

      const backupPath1 = await backupFile(testFile, config);

      // Modify and backup again
      await fs.writeFile(testFile, 'modified content');
      const backupPath2 = await backupFile(testFile, config);

      // Backup path should be the same (same file in same session)
      // But backup content should be updated and both backups recorded
      expect(backupPath1).toBe(backupPath2);
      expect(config.files).toHaveLength(2);

      // Latest backup should have modified content
      const content = await fs.readFile(backupPath2, 'utf-8');
      expect(content).toBe('modified content');
    });
  });

  describe('backupFiles', () => {
    let config: BackupConfig;

    beforeEach(async () => {
      config = await createBackupSession(tempDir);
    });

    it('backs up multiple files', async () => {
      const files = [
        path.join(tempDir, 'file1.txt'),
        path.join(tempDir, 'file2.txt'),
        path.join(tempDir, 'file3.txt'),
      ];

      for (const file of files) {
        await fs.writeFile(file, `content of ${path.basename(file)}`);
      }

      const backupPaths = await backupFiles(files, config);

      expect(backupPaths).toHaveLength(3);
      expect(config.files).toHaveLength(3);

      for (const backupPath of backupPaths) {
        const exists = await fs.pathExists(backupPath);
        expect(exists).toBe(true);
      }
    });

    it('handles mix of existing and non-existing files', async () => {
      const files = [
        path.join(tempDir, 'exists.txt'),
        path.join(tempDir, 'nonexistent.txt'),
        path.join(tempDir, 'also-exists.txt'),
      ];

      await fs.writeFile(files[0], 'content 1');
      await fs.writeFile(files[2], 'content 2');

      const backupPaths = await backupFiles(files, config);

      // Only 2 files exist, so only 2 backup paths
      expect(backupPaths).toHaveLength(2);
      expect(config.files).toHaveLength(2);
    });

    it('returns empty array for empty file list', async () => {
      const backupPaths = await backupFiles([], config);

      expect(backupPaths).toEqual([]);
      expect(config.files).toHaveLength(0);
    });
  });

  describe('restoreFromBackup', () => {
    let config: BackupConfig;

    beforeEach(async () => {
      config = await createBackupSession(tempDir);
    });

    it('restores backed up files', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'original content');

      // Backup
      await backupFile(testFile, config);

      // Modify original
      await fs.writeFile(testFile, 'modified content');

      // Restore
      await restoreFromBackup(config);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('original content');
    });

    it('restores multiple files', async () => {
      const files = [
        path.join(tempDir, 'file1.txt'),
        path.join(tempDir, 'file2.txt'),
      ];

      for (const file of files) {
        await fs.writeFile(file, `original ${path.basename(file)}`);
      }

      await backupFiles(files, config);

      // Modify all files
      for (const file of files) {
        await fs.writeFile(file, `modified ${path.basename(file)}`);
      }

      // Restore
      await restoreFromBackup(config);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).toBe(`original ${path.basename(file)}`);
      }
    });

    it('creates directory if needed during restore', async () => {
      const nestedFile = path.join(tempDir, 'new', 'dir', 'file.txt');
      await fs.ensureDir(path.dirname(nestedFile));
      await fs.writeFile(nestedFile, 'content');

      await backupFile(nestedFile, config);

      // Remove directory
      await fs.remove(path.join(tempDir, 'new'));

      // Restore should recreate directory
      await restoreFromBackup(config);

      const exists = await fs.pathExists(nestedFile);
      expect(exists).toBe(true);
    });

    it('handles missing backup files gracefully', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'content');

      await backupFile(testFile, config);

      // Delete backup
      await fs.remove(config.files[0].backup);

      // Should not throw
      await expect(restoreFromBackup(config)).resolves.not.toThrow();
    });

    it('continues restore even if individual file fails', async () => {
      const files = [
        path.join(tempDir, 'file1.txt'),
        path.join(tempDir, 'file2.txt'),
      ];

      for (const file of files) {
        await fs.writeFile(file, `original ${path.basename(file)}`);
      }

      await backupFiles(files, config);

      // Delete one backup
      await fs.remove(config.files[0].backup);

      // Modify all files
      for (const file of files) {
        await fs.writeFile(file, `modified ${path.basename(file)}`);
      }

      // Restore should succeed for file2
      await restoreFromBackup(config);

      const content2 = await fs.readFile(files[1], 'utf-8');
      expect(content2).toBe('original file2.txt');
    });
  });

  describe('saveBackupManifest', () => {
    let config: BackupConfig;

    beforeEach(async () => {
      config = await createBackupSession(tempDir);
    });

    it('saves manifest with backup information', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'content');
      await backupFile(testFile, config);

      await saveBackupManifest(config);

      const manifestPath = path.join(config.backupDir, 'manifest.json');
      const exists = await fs.pathExists(manifestPath);
      expect(exists).toBe(true);
    });

    it('includes all backup metadata', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'content');
      await backupFile(testFile, config);

      await saveBackupManifest(config);

      const manifestPath = path.join(config.backupDir, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      expect(manifest.timestamp).toBe(config.timestamp);
      expect(manifest.backupDir).toBe(config.backupDir);
      expect(manifest.files).toHaveLength(1);
      expect(manifest.createdAt).toBeTruthy();
    });

    it('formats manifest as valid JSON', async () => {
      await saveBackupManifest(config);

      const manifestPath = path.join(config.backupDir, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');

      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('loadBackupManifest', () => {
    it('loads saved manifest', async () => {
      const config = await createBackupSession(tempDir);
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'content');
      await backupFile(testFile, config);
      await saveBackupManifest(config);

      const loaded = await loadBackupManifest(config.backupDir);

      expect(loaded.timestamp).toBe(config.timestamp);
      expect(loaded.backupDir).toBe(config.backupDir);
      expect(loaded.files).toHaveLength(1);
    });

    it('preserves file records', async () => {
      const config = await createBackupSession(tempDir);
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'content');
      await backupFile(testFile, config);
      await saveBackupManifest(config);

      const loaded = await loadBackupManifest(config.backupDir);

      expect(loaded.files[0].original).toBe(config.files[0].original);
      expect(loaded.files[0].backup).toBe(config.files[0].backup);
    });

    it('throws error if manifest does not exist', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      await expect(loadBackupManifest(nonExistentDir)).rejects.toThrow();
    });
  });

  describe('cleanupOldBackups', () => {
    it('removes old backups beyond keep count', async () => {
      // Create 5 backup sessions
      const configs: BackupConfig[] = [];
      for (let i = 0; i < 5; i++) {
        const config = await createBackupSession(tempDir);
        configs.push(config);
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Keep only 3 most recent
      await cleanupOldBackups(tempDir, 3);

      // Check that oldest 2 were deleted
      const exists0 = await fs.pathExists(configs[0].backupDir);
      const exists1 = await fs.pathExists(configs[1].backupDir);
      const exists2 = await fs.pathExists(configs[2].backupDir);
      const exists3 = await fs.pathExists(configs[3].backupDir);
      const exists4 = await fs.pathExists(configs[4].backupDir);

      expect(exists0).toBe(false);
      expect(exists1).toBe(false);
      expect(exists2).toBe(true);
      expect(exists3).toBe(true);
      expect(exists4).toBe(true);
    });

    it('keeps all backups if count is below threshold', async () => {
      const configs: BackupConfig[] = [];
      for (let i = 0; i < 3; i++) {
        const config = await createBackupSession(tempDir);
        configs.push(config);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await cleanupOldBackups(tempDir, 10);

      // All should still exist
      for (const config of configs) {
        const exists = await fs.pathExists(config.backupDir);
        expect(exists).toBe(true);
      }
    });

    it('handles non-existent backup directory', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      // Should not throw
      await expect(cleanupOldBackups(nonExistentDir, 10)).resolves.not.toThrow();
    });

    it('defaults to keeping 10 backups', async () => {
      const configs: BackupConfig[] = [];
      for (let i = 0; i < 12; i++) {
        const config = await createBackupSession(tempDir);
        configs.push(config);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      await cleanupOldBackups(tempDir);

      // Oldest 2 should be deleted
      const exists0 = await fs.pathExists(configs[0].backupDir);
      const exists1 = await fs.pathExists(configs[1].backupDir);
      const exists2 = await fs.pathExists(configs[2].backupDir);
      const exists11 = await fs.pathExists(configs[11].backupDir);

      expect(exists0).toBe(false);
      expect(exists1).toBe(false);
      expect(exists2).toBe(true);
      expect(exists11).toBe(true);
    });

    it('only removes backup directories', async () => {
      // Create backup and non-backup directories
      const backupDir = path.join(tempDir, '.contextualizer', 'backup');
      await fs.ensureDir(backupDir);

      await createBackupSession(tempDir);
      await fs.ensureDir(path.join(backupDir, 'other-dir'));

      await cleanupOldBackups(tempDir, 0);

      // Non-backup directory should still exist
      const exists = await fs.pathExists(path.join(backupDir, 'other-dir'));
      expect(exists).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('supports full backup and restore cycle', async () => {
      // Create test files
      const files = [
        path.join(tempDir, 'file1.txt'),
        path.join(tempDir, 'dir', 'file2.txt'),
      ];

      await fs.ensureDir(path.dirname(files[1]));
      await fs.writeFile(files[0], 'content 1');
      await fs.writeFile(files[1], 'content 2');

      // Create backup session
      const config = await createBackupSession(tempDir);

      // Backup files
      await backupFiles(files, config);

      // Save manifest
      await saveBackupManifest(config);

      // Modify files
      await fs.writeFile(files[0], 'modified 1');
      await fs.writeFile(files[1], 'modified 2');

      // Load manifest and restore
      const loaded = await loadBackupManifest(config.backupDir);
      await restoreFromBackup(loaded);

      // Verify restoration
      const content1 = await fs.readFile(files[0], 'utf-8');
      const content2 = await fs.readFile(files[1], 'utf-8');

      expect(content1).toBe('content 1');
      expect(content2).toBe('content 2');
    });

    it.skip('handles multiple backup sessions independently', async () => {
      const file1 = path.join(tempDir, 'file.txt');

      // Session 1
      await fs.writeFile(file1, 'version 1');
      const config1 = await createBackupSession(tempDir);
      await backupFile(file1, config1);
      await saveBackupManifest(config1);

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Session 2
      await fs.writeFile(file1, 'version 2');
      const config2 = await createBackupSession(tempDir);
      await backupFile(file1, config2);
      await saveBackupManifest(config2);

      // Verify each session has different backup directories
      expect(config1.backupDir).not.toBe(config2.backupDir);

      // Verify each session backed up the correct content
      const backup1Content = await fs.readFile(config1.files[0].backup, 'utf-8');
      const backup2Content = await fs.readFile(config2.files[0].backup, 'utf-8');

      expect(backup1Content).toBe('version 1');
      expect(backup2Content).toBe('version 2');

      // Verify manifests can be loaded independently
      const loaded1 = await loadBackupManifest(config1.backupDir);
      const loaded2 = await loadBackupManifest(config2.backupDir);

      expect(loaded1.timestamp).toBe(config1.timestamp);
      expect(loaded2.timestamp).toBe(config2.timestamp);
      expect(loaded1.backupDir).not.toBe(loaded2.backupDir);
    });
  });
});
