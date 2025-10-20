/**
 * init_project Tool
 *
 * Initializes a new Contextualizer project with templates and configuration.
 * This is a placeholder implementation - actual functionality will be added in Epic 2.
 */

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { wrapToolHandler } from '../utils/errors.js';
import type { MCPTool, ToolResult } from '../types/mcp.js';
import {
  detectPackageJson,
  detectFrameworks,
} from '../utils/package-detector.js';
import {
  recommendPreset,
  formatRecommendation,
  isRecommendationConfident,
} from '../utils/preset-recommender.js';

/**
 * Zod schema for init_project parameters
 */
export const InitProjectSchema = z.object({
  preset: z.enum(['minimal', 'web-fullstack', 'hackathon', 'custom'], {
    description: 'Project preset template to use',
  }),
  options: z
    .object({
      skipConflictCheck: z
        .boolean()
        .optional()
        .describe('Skip checking for existing configuration'),
      customConfig: z
        .record(z.unknown())
        .optional()
        .describe('Custom configuration overrides'),
      detectPreset: z
        .boolean()
        .optional()
        .describe('Auto-detect and recommend preset based on package.json'),
    })
    .optional()
    .describe('Additional initialization options'),
});

/**
 * TypeScript type inferred from schema
 */
export type InitProjectParams = z.infer<typeof InitProjectSchema>;

/**
 * Handler for init_project tool
 */
async function initProjectHandler(
  params: InitProjectParams
): Promise<ToolResult> {
  logger.info({ tool: 'init_project', params }, 'Tool invocation started');

  try {
    const { loadPresetByName } = await import('../preset/registry.js');
    const { generateFiles, checkConflicts } = await import(
      '../generation/file-generator.js'
    );
    const { initializeRenderer } = await import('../template/renderer.js');

    let responseText = '';

    // Handle preset detection if requested
    let selectedPreset = params.preset;

    if (params.options?.detectPreset) {
      logger.info('Attempting preset detection from package.json');

      const detection = await detectPackageJson();

      if (detection.found && detection.dependencies.length > 0) {
        const frameworks = detectFrameworks(detection.dependencies);
        const recommendation = recommendPreset(
          frameworks,
          detection.dependencies
        );

        logger.info({ recommendation }, 'Preset recommendation generated');

        responseText += `📦 **Package.json Detection**\n\n`;
        responseText += `Project: ${detection.projectName || 'Unknown'}\n`;
        responseText += `Dependencies found: ${detection.dependencies.length}\n`;

        if (frameworks.length > 0) {
          responseText += `\n**Detected Frameworks**:\n`;
          frameworks.forEach((fw) => {
            responseText += `- ${fw.type} (${fw.version}) - ${fw.confidence}% confidence\n`;
          });
        }

        responseText += `\n${formatRecommendation(recommendation)}\n`;

        if (isRecommendationConfident(recommendation)) {
          responseText += `\n✅ High confidence recommendation.\n`;
          selectedPreset = recommendation.preset as any;
          responseText += `Using recommended preset: ${selectedPreset}\n\n`;
        } else {
          responseText += `\n⚠️ Low confidence recommendation.\n`;
          responseText += `Using selected preset: ${selectedPreset}\n\n`;
        }
      } else {
        logger.info('Package.json not found or has no dependencies');
        responseText += `📦 **Package.json Detection**\n\n`;
        responseText += `No package.json found or no dependencies detected.\n`;
        responseText += `Using selected preset: ${selectedPreset}\n\n`;
      }
    }

    // Load preset
    logger.info({ preset: selectedPreset }, 'Loading preset');
    const preset = await loadPresetByName(selectedPreset);

    if (!preset) {
      throw new Error(`Preset not found: ${selectedPreset}`);
    }

    responseText += `🎯 **Initializing Project**\n\n`;
    responseText += `Preset: ${preset.name}\n`;
    responseText += `Description: ${preset.description}\n`;
    responseText += `Estimated time: ${preset.installationTime}\n\n`;

    // Check for conflicts unless skipped
    if (!params.options?.skipConflictCheck) {
      const conflicts = await checkConflicts(preset);

      if (conflicts.length > 0) {
        responseText += `⚠️ **Conflicting Files Detected**\n\n`;
        responseText += `The following files already exist:\n`;
        conflicts.forEach((file) => {
          responseText += `- ${file}\n`;
        });
        responseText += `\nUse \`skipConflictCheck: true\` to force overwrite.\n`;

        const result: ToolResult = {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
          isError: true,
        };

        return result;
      }
    }

    // Initialize template renderer
    initializeRenderer();

    // Detect project name
    const detection = await detectPackageJson();
    const projectName = detection.projectName || 'my-project';

    // Generate files
    logger.info({ preset: selectedPreset }, 'Generating files');

    const generationResult = await generateFiles(preset, {
      projectName,
      forceOverwrite: params.options?.skipConflictCheck || false,
      skipGitCommit: false,
      skipBackup: false,
    });

    if (!generationResult.success) {
      responseText += `❌ **File Generation Failed**\n\n`;
      responseText += `Error: ${generationResult.error}\n`;

      if (generationResult.backup) {
        responseText += `\nBackup created at: ${generationResult.backup.backupDir}\n`;
        responseText += `Rollback was attempted.\n`;
      }

      const result: ToolResult = {
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
        isError: true,
      };

      return result;
    }

    // Success!
    responseText += `✅ **Initialization Complete**\n\n`;
    responseText += `Generated ${generationResult.files.length} files:\n\n`;

    // Group files by type
    const filesByType: Record<string, string[]> = {};
    generationResult.files.forEach((file) => {
      if (!filesByType[file.type]) {
        filesByType[file.type] = [];
      }
      filesByType[file.type].push(file.path);
    });

    Object.keys(filesByType).forEach((type) => {
      responseText += `**${type}**:\n`;
      filesByType[type].forEach((path) => {
        responseText += `- ${path}\n`;
      });
      responseText += `\n`;
    });

    if (generationResult.committed) {
      responseText += `✅ Changes committed to git\n`;
    }

    if (generationResult.backup) {
      responseText += `📦 Backup created at: ${generationResult.backup.backupDir}\n`;
    }

    responseText += `\n**Next Steps**:\n`;
    responseText += `1. Review generated files in .claude/ directory\n`;
    responseText += `2. Run \`configure-hooks\` tool to activate hooks\n`;
    responseText += `3. Customize CLAUDE.md to your project needs\n`;

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      isError: false,
    };

    logger.info(
      { tool: 'init_project', filesGenerated: generationResult.files.length },
      'Tool completed successfully'
    );
    return result;
  } catch (error) {
    logger.error({ tool: 'init_project', error }, 'Tool execution failed');

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `❌ **Initialization Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };

    return result;
  }
}

/**
 * Tool definition export
 */
export const initProject: MCPTool = {
  name: 'init_project',
  description:
    'Initialize a new Contextualizer project with templates and configuration. Supports presets: minimal, web-fullstack, hackathon, or custom.',
  inputSchema: InitProjectSchema as any,
  handler: wrapToolHandler(initProjectHandler),
};
