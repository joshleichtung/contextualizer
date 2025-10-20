/**
 * Resource Registry
 *
 * This file exports all available MCP resources.
 * Resources provide read-only data access to Claude via the MCP protocol.
 */

import type { MCPResource } from '../types/mcp.js';
import { configResource } from './config-resource.js';
import { diagnosticsResource } from './diagnostics-resource.js';
import { presetsResource } from './presets-resource.js';

/**
 * Array of all registered resources
 *
 * Resources:
 * - contextualizer://config - Current configuration (placeholder)
 * - contextualizer://diagnostics - Latest diagnostic report (placeholder)
 * - contextualizer://presets - Available preset definitions (full implementation)
 */
export const RESOURCES: MCPResource[] = [
  configResource,
  diagnosticsResource,
  presetsResource,
];
