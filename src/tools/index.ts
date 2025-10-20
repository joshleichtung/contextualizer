/**
 * Tool Registry
 *
 * This file exports all available MCP tools.
 * All tools are registered in the TOOLS array for MCP server discovery.
 */

import type { MCPTool } from '../types/mcp.js';
import { initProject } from './init-project.js';
import { runDoctor } from './run-doctor.js';
import { configureHooks } from './configure-hooks.js';
import { manageMemory } from './manage-memory.js';
import { getConfig } from './get-config.js';

/**
 * Array of all registered tools
 * Story 1.2: 5 core tools with placeholder implementations
 */
export const TOOLS: MCPTool[] = [
  initProject,
  runDoctor,
  configureHooks,
  manageMemory,
  getConfig,
];
