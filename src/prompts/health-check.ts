/**
 * Health Check Prompt
 *
 * Comprehensive project health check and diagnostics workflow.
 * This prompt guides users through diagnostic process to identify configuration issues.
 */

import type { MCPPrompt, PromptMessage } from '../types/mcp.js';
import { logger } from '../utils/logger.js';

/**
 * Provider function for health_check prompt
 *
 * Returns conversational message explaining diagnostics process, mentioning that full
 * implementation will invoke run_doctor tool in Epic 5.
 *
 * @param args - No arguments required (empty object)
 * @returns Promise resolving to array of prompt messages
 */
async function healthCheckProvider(
  args: Record<string, string>,
): Promise<PromptMessage[]> {
  logger.debug({ prompt: 'health_check', args }, 'Health check prompt invoked');

  const messageText = `Please run a comprehensive health check on this project to identify any configuration issues or areas for improvement.

**Health Check Process (Placeholder - Full implementation in Epic 5)**:

The health_check prompt will guide you through:

1. **Configuration Validation**: Verify .contextualizer/config.yaml exists and is valid
2. **Hook Health**: Check that hooks are present, executable, and functioning
3. **Memory Structure**: Validate CLAUDE.md structure and completeness
4. **MCP Server Status**: Verify Contextualizer MCP server is accessible
5. **Best Practices Compliance**: Compare against Anthropic's Claude Code best practices
6. **Performance Checks**: Verify hooks execute within performance targets

**15+ Diagnostic Checks** (Epic 5):
- Setup checks (config exists, valid YAML, version compatibility)
- Hook checks (files exist, executable, syntax valid, performance)
- Memory checks (CLAUDE.md exists, structure valid, sections complete)
- MCP checks (server accessible, tools registered, resources available)
- Testing checks (test commands configured, passing)
- Workflow checks (git hooks working, commit flow smooth)

**Report Format**:
- Summary: X/15 checks passed
- Pass ✅: Check passed
- Warn ⚠️: Non-critical issue, recommendation provided
- Fail ❌: Critical issue, requires fix

**For now**: You can manually invoke the run_doctor tool to see placeholder output.

Example: "Use the run_doctor tool to check project health"`;

  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: messageText,
      },
    },
  ];
}

/**
 * Health check prompt definition
 */
export const healthCheckPrompt: MCPPrompt = {
  name: 'health_check',
  description:
    'Comprehensive project health check and diagnostics workflow',
  arguments: [],
  provider: healthCheckProvider,
};
