/**
 * get_config Tool
 *
 * Retrieves the current Contextualizer configuration.
 * This is a placeholder implementation - actual functionality will be added in Epic 6.
 */

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { wrapToolHandler } from '../utils/errors.js';
import type { MCPTool, ToolResult } from '../types/mcp.js';

/**
 * Zod schema for get_config parameters
 */
export const GetConfigSchema = z.object({
  format: z
    .enum(['yaml', 'json'], {
      description: 'Output format for configuration',
    })
    .optional()
    .default('yaml'),
  includeDefaults: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include default values in output'),
});

/**
 * TypeScript type inferred from schema
 */
export type GetConfigParams = z.infer<typeof GetConfigSchema>;

/**
 * Handler for get_config tool
 * Currently returns placeholder message - actual implementation in Epic 6
 */
async function getConfigHandler(
  params: GetConfigParams
): Promise<ToolResult> {
  logger.info({ tool: 'get_config', params }, 'Tool invocation started');

  try {
    // Placeholder implementation
    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `✅ get_config tool registered successfully.

Implementation coming in Epic 6: Memory Management & Configuration

This tool will:
- Load .contextualizer/config.yaml
- Apply preset defaults
- Merge environment overrides
- Return in ${params.format} format${
            params.includeDefaults
              ? '\n- Include default values in output'
              : ''
          }`,
        },
      ],
      isError: false,
    };

    logger.info({ tool: 'get_config' }, 'Tool completed successfully');
    return result;
  } catch (error) {
    logger.error({ tool: 'get_config', error }, 'Tool execution failed');
    throw error;
  }
}

/**
 * Tool definition export
 */
export const getConfig: MCPTool = {
  name: 'get_config',
  description:
    'Retrieve current Contextualizer configuration. Supports yaml or json output format with optional default values.',
  inputSchema: GetConfigSchema as any,
  handler: wrapToolHandler(getConfigHandler),
};
