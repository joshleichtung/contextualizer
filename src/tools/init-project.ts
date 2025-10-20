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
 * Currently returns placeholder message - actual implementation in Epic 2
 */
async function initProjectHandler(
  params: InitProjectParams
): Promise<ToolResult> {
  logger.info({ tool: 'init_project', params }, 'Tool invocation started');

  try {
    let responseText = `✅ init_project tool registered successfully.\n\n`;

    // Handle preset detection if requested
    if (params.options?.detectPreset) {
      logger.info('Attempting preset detection from package.json');

      const detection = await detectPackageJson();

      if (detection.found && detection.dependencies.length > 0) {
        const frameworks = detectFrameworks(detection.dependencies);
        const recommendation = recommendPreset(frameworks, detection.dependencies);

        logger.info(
          { recommendation },
          'Preset recommendation generated'
        );

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
          responseText += `\n✅ High confidence recommendation available.\n`;
          responseText += `Consider using: \`preset: "${recommendation.preset}"\`\n\n`;
        } else {
          responseText += `\n⚠️ Low confidence recommendation.\n`;
          responseText += `Consider manual preset selection or use default.\n\n`;
        }
      } else {
        logger.info('Package.json not found or has no dependencies');
        responseText += `📦 **Package.json Detection**\n\n`;
        responseText += `No package.json found or no dependencies detected.\n`;
        responseText += `Falling back to selected preset: ${params.preset}\n\n`;
      }
    }

    responseText += `Implementation coming in Epic 2: Project Initialization\n\n`;
    responseText += `This tool will:\n`;
    responseText += `- Detect existing configuration\n`;
    responseText += `- Generate files from templates based on preset: ${params.preset}\n`;
    responseText += `- Create .claude/hooks/user-prompt-submit\n`;
    responseText += `- Create .claude/CLAUDE.md\n`;
    responseText += `- Create .contextualizer/config.yaml`;

    if (params.options?.skipConflictCheck) {
      responseText += `\n- Skip conflict checks as requested`;
    }

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      isError: false,
    };

    logger.info({ tool: 'init_project' }, 'Tool completed successfully');
    return result;
  } catch (error) {
    logger.error({ tool: 'init_project', error }, 'Tool execution failed');
    throw error;
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
