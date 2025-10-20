/**
 * Setup Wizard Prompt
 *
 * Interactive project setup workflow with preset selection guidance.
 * This prompt guides users through initial project setup by helping them choose the right preset.
 */

import type { MCPPrompt, PromptMessage } from '../types/mcp.js';
import { logger } from '../utils/logger.js';

/**
 * Provider function for setup_wizard prompt
 *
 * Returns conversational message guiding user on setup, mentioning that full
 * implementation will invoke init_project tool in Epic 2.
 *
 * @param args - Optional arguments including project_type
 * @returns Promise resolving to array of prompt messages
 */
async function setupWizardProvider(
  args: Record<string, string>,
): Promise<PromptMessage[]> {
  logger.debug({ prompt: 'setup_wizard', args }, 'Setup wizard prompt invoked');

  const projectType = args.project_type;

  const messageText = `I'd like to set up this project for AI-first development with Contextualizer.

${projectType ? `This is a ${projectType} project.` : 'Please detect the project type from package.json or file structure.'}

**Setup Process (Placeholder - Full implementation in Epic 2)**:

The setup_wizard prompt will guide you through:

1. **Project Detection**: Analyze package.json and project structure
2. **Preset Selection**: Recommend preset based on project type
   - minimal: Basic context monitoring, no pre-commit hooks
   - web-fullstack: Full setup with hooks, skills, agents (Next.js/React projects)
   - hackathon: Fast iteration mode, minimal overhead
3. **Configuration**: Customize thresholds and strictness levels
4. **Tool Invocation**: Execute init_project tool with selected preset

**What will be created**:
- .claude/hooks/user-prompt-submit (context monitoring)
- .claude/hooks/pre-commit (quality gates, optional)
- .claude/CLAUDE.md (project memory)
- .claude/skills/ (framework expertise, optional)
- .claude/agents/ (specialized subagents, optional)
- .contextualizer/config.yaml (configuration)

**For now**: You can manually invoke the init_project tool with your preferred preset.

Example: "Use the init_project tool with the web-fullstack preset"`;

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
 * Setup wizard prompt definition
 */
export const setupWizardPrompt: MCPPrompt = {
  name: 'setup_wizard',
  description:
    'Interactive project setup workflow with preset selection guidance',
  arguments: [
    {
      name: 'project_type',
      description:
        "Type of project (e.g., 'nextjs', 'react', 'node', 'typescript'). If not provided, provides general setup guidance.",
      required: false,
    },
  ],
  provider: setupWizardProvider,
};
