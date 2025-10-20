/**
 * Prompt Registry
 *
 * This file exports all available MCP prompts.
 */

import type { MCPPrompt } from '../types/mcp.js';
import { setupWizardPrompt } from './setup-wizard.js';
import { healthCheckPrompt } from './health-check.js';
import { optimizeContextPrompt } from './optimize-context.js';

/**
 * Array of all registered prompts
 */
export const PROMPTS: MCPPrompt[] = [
  setupWizardPrompt,
  healthCheckPrompt,
  optimizeContextPrompt,
];
