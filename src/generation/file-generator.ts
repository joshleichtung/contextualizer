/**
 * File Generator
 *
 * Atomic file generation with backup, rollback, and git integration.
 * Generates project files from templates based on preset configuration.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import {
  ensureDirWithRetry,
  writeFileWithRetry,
} from '../utils/fs-resilient.js';
import { logger } from '../utils/logger.js';
import type { PresetDefinition } from '../preset/types.js';
import { buildRenderContext, renderTemplateFile } from '../template/renderer.js';
import {
  createBackupSession,
  backupFiles,
  restoreFromBackup,
  saveBackupManifest,
  type BackupConfig,
} from './backup.js';
import {
  createGitAttributes,
  createInitCommit,
  isGitAvailable,
} from './git-integration.js';

/**
 * File generation options
 */
export interface GenerateOptions {
  /** Project name */
  projectName: string;

  /** Project root directory */
  projectRoot?: string;

  /** Template base directory */
  templateBaseDir?: string;

  /** Skip backup creation */
  skipBackup?: boolean;

  /** Skip git commit */
  skipGitCommit?: boolean;

  /** Force overwrite existing files */
  forceOverwrite?: boolean;

  /** Dry run (don't actually write files) */
  dryRun?: boolean;
}

/**
 * Generated file information
 */
export interface GeneratedFile {
  /** Destination path */
  path: string;

  /** File type (e.g., 'config', 'hook', 'skill', 'agent') */
  type: string;

  /** Whether file was overwritten */
  overwritten: boolean;

  /** File size in bytes */
  size: number;
}

/**
 * File generation result
 */
export interface GenerationResult {
  /** Whether generation was successful */
  success: boolean;

  /** List of generated files */
  files: GeneratedFile[];

  /** Backup configuration (if backup was created) */
  backup?: BackupConfig;

  /** Error message (if failed) */
  error?: string;

  /** Whether changes were committed to git */
  committed: boolean;
}

/**
 * Get template directory for preset
 *
 * @param presetName - Preset name
 * @param baseDir - Base template directory
 * @returns Template directory path
 */
function getTemplateDirectory(presetName: string, baseDir?: string): string {
  const base = baseDir || path.join(__dirname, '../../templates');
  return path.join(base, presetName);
}

/**
 * Set executable permissions on hook files
 *
 * @param filePath - Hook file path
 */
async function setExecutablePermissions(filePath: string): Promise<void> {
  try {
    // On Unix systems, set 755 permissions (rwxr-xr-x)
    if (process.platform !== 'win32') {
      await fs.chmod(filePath, 0o755);
      logger.debug({ filePath }, 'Set executable permissions');
    }
  } catch (error) {
    logger.warn({ filePath, error }, 'Failed to set executable permissions');
    // Non-fatal error, continue
  }
}

/**
 * Generate a single file from template
 *
 * @param templatePath - Template file path
 * @param destinationPath - Destination file path
 * @param context - Render context
 * @param options - Generation options
 * @returns Generated file information
 */
async function generateFile(
  templatePath: string,
  destinationPath: string,
  context: any,
  options: GenerateOptions
): Promise<GeneratedFile> {
  logger.debug({ templatePath, destinationPath }, 'Generating file');

  // Check if file already exists
  const exists = await fs.pathExists(destinationPath);
  const overwritten = exists;

  if (exists && !options.forceOverwrite) {
    logger.warn({ destinationPath }, 'File exists, skipping (use forceOverwrite to replace)');
    throw new Error(`File already exists: ${destinationPath}`);
  }

  // Render template
  const content = await renderTemplateFile(templatePath, context);

  if (options.dryRun) {
    logger.info({ destinationPath, length: content.length }, 'Dry run: would write file');
    return {
      path: destinationPath,
      type: getFileType(destinationPath),
      overwritten,
      size: content.length,
    };
  }

  // Ensure directory exists
  await ensureDirWithRetry(path.dirname(destinationPath));

  // Write file
  await writeFileWithRetry(destinationPath, content);

  // Set executable permissions for shell scripts
  if (destinationPath.endsWith('.sh')) {
    await setExecutablePermissions(destinationPath);
  }

  const stats = await fs.stat(destinationPath);

  logger.info(
    { destinationPath, size: stats.size, overwritten },
    'File generated'
  );

  return {
    path: destinationPath,
    type: getFileType(destinationPath),
    overwritten,
    size: stats.size,
  };
}

/**
 * Determine file type from path
 */
function getFileType(filePath: string): string {
  if (filePath.includes('/hooks/')) return 'hook';
  if (filePath.includes('/skills/')) return 'skill';
  if (filePath.includes('/agents/')) return 'agent';
  if (filePath.endsWith('CLAUDE.md')) return 'documentation';
  if (filePath.endsWith('config.yaml')) return 'config';
  return 'other';
}

/**
 * Generate all files for a preset
 *
 * @param preset - Preset definition
 * @param options - Generation options
 * @returns Generation result
 */
export async function generateFiles(
  preset: PresetDefinition,
  options: GenerateOptions
): Promise<GenerationResult> {
  const projectRoot = options.projectRoot || process.cwd();
  const result: GenerationResult = {
    success: false,
    files: [],
    committed: false,
  };

  let backup: BackupConfig | undefined;

  try {
    logger.info(
      { preset: preset.name, projectName: options.projectName },
      'Starting file generation'
    );

    // Build render context
    const context = await buildRenderContext(
      preset,
      options.projectName,
      projectRoot
    );

    // Get template directory
    const templateDir = getTemplateDirectory(
      preset.name,
      options.templateBaseDir
    );

    // Verify template directory exists
    const templateDirExists = await fs.pathExists(templateDir);
    if (!templateDirExists) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    // Build list of files to generate
    const filesToGenerate: Array<{
      template: string;
      destination: string;
    }> = [];

    // CLAUDE.md
    const claudeMdTemplate = path.join(templateDir, 'CLAUDE.md.hbs');
    if (await fs.pathExists(claudeMdTemplate)) {
      filesToGenerate.push({
        template: claudeMdTemplate,
        destination: path.join(projectRoot, '.claude', 'CLAUDE.md'),
      });
    }

    // Hooks
    const hooksDir = path.join(templateDir, 'hooks');
    if (await fs.pathExists(hooksDir)) {
      const hookFiles = await fs.readdir(hooksDir);
      for (const hookFile of hookFiles) {
        if (hookFile.endsWith('.hbs')) {
          const hookName = hookFile.replace('.hbs', '');
          filesToGenerate.push({
            template: path.join(hooksDir, hookFile),
            destination: path.join(projectRoot, '.claude', 'hooks', hookName),
          });
        }
      }
    }

    // Skills
    if (preset.skills && preset.skills.length > 0) {
      const skillsDir = path.join(templateDir, 'skills');
      if (await fs.pathExists(skillsDir)) {
        const skillFiles = await fs.readdir(skillsDir);
        for (const skillFile of skillFiles) {
          if (skillFile.endsWith('.hbs')) {
            const skillName = skillFile.replace('.hbs', '');
            filesToGenerate.push({
              template: path.join(skillsDir, skillFile),
              destination: path.join(projectRoot, '.claude', 'skills', skillName),
            });
          }
        }
      }
    }

    // Subagents
    if (preset.subagents && preset.subagents.length > 0) {
      const agentsDir = path.join(templateDir, 'agents');
      if (await fs.pathExists(agentsDir)) {
        const agentFiles = await fs.readdir(agentsDir);
        for (const agentFile of agentFiles) {
          if (agentFile.endsWith('.hbs')) {
            const agentName = agentFile.replace('.hbs', '');
            filesToGenerate.push({
              template: path.join(agentsDir, agentFile),
              destination: path.join(projectRoot, '.claude', 'agents', agentName),
            });
          }
        }
      }
    }

    logger.info({ fileCount: filesToGenerate.length }, 'Files to generate');

    // Create backup if not skipped
    if (!options.skipBackup && !options.dryRun) {
      backup = await createBackupSession(projectRoot);
      await backupFiles(
        filesToGenerate.map((f) => f.destination),
        backup
      );
      result.backup = backup;
    }

    // Generate files
    for (const { template, destination } of filesToGenerate) {
      try {
        const fileInfo = await generateFile(template, destination, context, options);
        result.files.push(fileInfo);
      } catch (error) {
        logger.error({ template, destination, error }, 'Failed to generate file');
        throw error;
      }
    }

    // Create .gitattributes for LF line endings
    if (!options.dryRun) {
      await createGitAttributes(projectRoot);
    }

    // Save backup manifest
    if (backup && !options.dryRun) {
      await saveBackupManifest(backup);
    }

    // Create git commit if not skipped
    if (!options.skipGitCommit && !options.dryRun && (await isGitAvailable())) {
      try {
        const filesToCommit = [
          ...result.files.map((f) => f.path),
          path.join(projectRoot, '.gitattributes'),
        ];

        await createInitCommit(projectRoot, preset.name, filesToCommit);
        result.committed = true;
      } catch (error) {
        logger.warn({ error }, 'Failed to create git commit (non-fatal)');
        // Non-fatal error, continue
      }
    }

    result.success = true;

    logger.info(
      {
        preset: preset.name,
        fileCount: result.files.length,
        committed: result.committed,
      },
      'File generation completed successfully'
    );

    return result;
  } catch (error) {
    logger.error({ error }, 'File generation failed');

    result.success = false;
    result.error =
      error instanceof Error ? error.message : String(error);

    // Attempt rollback if we have a backup
    if (backup && !options.dryRun) {
      logger.warn('Attempting rollback from backup');
      try {
        await restoreFromBackup(backup);
        logger.info('Rollback successful');
      } catch (rollbackError) {
        logger.error({ rollbackError }, 'Rollback failed');
      }
    }

    return result;
  }
}

/**
 * Check for conflicting files
 *
 * @param preset - Preset definition
 * @param projectRoot - Project root directory
 * @returns List of conflicting file paths
 */
export async function checkConflicts(
  _preset: PresetDefinition,
  projectRoot: string = process.cwd()
): Promise<string[]> {
  const conflicts: string[] = [];

  // Check CLAUDE.md
  const claudeMdPath = path.join(projectRoot, '.claude', 'CLAUDE.md');
  if (await fs.pathExists(claudeMdPath)) {
    conflicts.push(claudeMdPath);
  }

  // Check config.yaml
  const configPath = path.join(projectRoot, '.contextualizer', 'config.yaml');
  if (await fs.pathExists(configPath)) {
    conflicts.push(configPath);
  }

  logger.debug({ conflictCount: conflicts.length }, 'Conflict check complete');

  return conflicts;
}
