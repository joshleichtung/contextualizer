/**
 * Presets Resource
 *
 * Provides available preset definitions via contextualizer://presets.
 * This is a full implementation with actual preset data.
 */

import type { MCPResource, ResourceContent } from '../types/mcp.js';
import { logger } from '../utils/logger.js';
import { PRESETS } from '../config/presets.js';

/**
 * Provider function for presets resource
 *
 * Returns actual preset definitions for minimal, web-fullstack, and hackathon presets.
 */
async function presetsResourceProvider(): Promise<ResourceContent> {
  logger.debug({ resource: 'presets' }, 'Presets resource read');

  const presetsData = {
    presets: PRESETS,
  };

  return {
    uri: 'contextualizer://presets',
    mimeType: 'application/json',
    text: JSON.stringify(presetsData, null, 2),
  };
}

/**
 * Presets resource definition
 */
export const presetsResource: MCPResource = {
  uri: 'contextualizer://presets',
  name: 'Presets',
  description: 'Available preset configurations for different development scenarios',
  mimeType: 'application/json',
  provider: presetsResourceProvider,
};
