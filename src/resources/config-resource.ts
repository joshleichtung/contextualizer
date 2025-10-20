/**
 * Config Resource
 *
 * Provides the current effective configuration via contextualizer://config.
 * This is a placeholder implementation - full configuration management
 * will be implemented in Epic 6: Memory Management & Configuration.
 */

import type { MCPResource, ResourceContent } from '../types/mcp.js';
import { logger } from '../utils/logger.js';

/**
 * Provider function for config resource
 *
 * Returns placeholder YAML configuration indicating Epic 6 implementation.
 */
async function configResourceProvider(): Promise<ResourceContent> {
  logger.debug({ resource: 'config' }, 'Config resource read');

  const placeholderYaml = `# Contextualizer Configuration (Placeholder)
# Full implementation coming in Epic 6: Memory Management & Configuration

version: "1.0.0"
preset: "placeholder"

# This resource will provide:
# - Current effective configuration with overrides applied
# - Merged preset defaults
# - Environment variable overrides
# - Real-time updates when configuration changes
`;

  return {
    uri: 'contextualizer://config',
    mimeType: 'application/x-yaml',
    text: placeholderYaml,
  };
}

/**
 * Config resource definition
 */
export const configResource: MCPResource = {
  uri: 'contextualizer://config',
  name: 'Configuration',
  description:
    'Current effective configuration (placeholder - full implementation in Epic 6)',
  mimeType: 'application/x-yaml',
  provider: configResourceProvider,
};
