/**
 * Diagnostics Resource
 *
 * Provides the latest diagnostic report via contextualizer://diagnostics.
 * This is a placeholder implementation - full diagnostics functionality
 * will be implemented in Epic 5: Diagnostics & Best Practices.
 */

import type { MCPResource, ResourceContent } from '../types/mcp.js';
import { logger } from '../utils/logger.js';

/**
 * Provider function for diagnostics resource
 *
 * Returns placeholder diagnostic report indicating Epic 5 implementation.
 */
async function diagnosticsResourceProvider(): Promise<ResourceContent> {
  logger.debug({ resource: 'diagnostics' }, 'Diagnostics resource read');

  const placeholderReport = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    summary: {
      total: 0,
      passed: 0,
      warnings: 0,
      failures: 0,
      message:
        'Placeholder - full implementation coming in Epic 5: Diagnostics & Best Practices',
    },
    checks: [],
  };

  return {
    uri: 'contextualizer://diagnostics',
    mimeType: 'application/json',
    text: JSON.stringify(placeholderReport, null, 2),
  };
}

/**
 * Diagnostics resource definition
 */
export const diagnosticsResource: MCPResource = {
  uri: 'contextualizer://diagnostics',
  name: 'Diagnostics',
  description:
    'Latest diagnostic report (placeholder - full implementation in Epic 5)',
  mimeType: 'application/json',
  provider: diagnosticsResourceProvider,
};
