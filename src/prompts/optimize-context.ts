/**
 * Optimize Context Prompt
 *
 * Context management optimization workflow with strategy selection.
 * This prompt guides users through context optimization based on their preferred strategy.
 */

import type { MCPPrompt, PromptMessage } from '../types/mcp.js';
import { logger } from '../utils/logger.js';

/**
 * Provider function for optimize_context prompt
 *
 * Returns conversational message about context management best practices,
 * with strategy-specific guidance.
 *
 * @param args - Optional arguments including strategy
 * @returns Promise resolving to array of prompt messages
 */
async function optimizeContextProvider(
  args: Record<string, string>,
): Promise<PromptMessage[]> {
  logger.debug(
    { prompt: 'optimize_context', args },
    'Optimize context prompt invoked',
  );

  const strategy = args.strategy || 'balanced';

  // Build strategy-specific content
  let strategyContent = '';

  if (strategy === 'aggressive') {
    strategyContent = `**Aggressive Strategy**:
- Clear context frequently (every 5-10 interactions)
- Minimize CLAUDE.md content
- Use skills for framework knowledge instead of memory
- Set context thresholds: warning 70%, critical 85%
- Prioritize speed over context continuity`;
  } else if (strategy === 'balanced') {
    strategyContent = `**Balanced Strategy** (Recommended):
- Clear context at natural task boundaries
- Comprehensive CLAUDE.md with essential patterns
- Mix of memory and skills for optimal performance
- Set context thresholds: warning 80%, critical 95%
- Balance continuity with performance`;
  } else if (strategy === 'conservative') {
    strategyContent = `**Conservative Strategy**:
- Preserve context across sessions
- Detailed CLAUDE.md with extensive documentation
- Rely on memory over skills
- Set context thresholds: warning 90%, critical 98%
- Prioritize continuity over performance`;
  } else {
    // Default to balanced if strategy is not recognized
    strategyContent = `**Balanced Strategy** (Recommended):
- Clear context at natural task boundaries
- Comprehensive CLAUDE.md with essential patterns
- Mix of memory and skills for optimal performance
- Set context thresholds: warning 80%, critical 95%
- Balance continuity with performance`;
  }

  const messageText = `I'd like to optimize my context management with Contextualizer using a ${strategy} strategy.

**Context Optimization Workflow (Placeholder - Full implementation in future epics)**:

**Your Strategy: ${strategy}**

${strategyContent}

**Context Management Best Practices**:

1. **Monitor Context Usage**: Watch for threshold warnings in hooks
2. **Task Boundaries**: Natural points to clear context:
   - Completing a feature
   - Switching domains (frontend → backend)
   - Starting a new work session
   - After major debugging sessions

3. **Memory vs Context Trade-offs**:
   - Memory (CLAUDE.md): Persistent across all sessions
   - Context: Current conversation, temporary
   - Use memory for patterns, context for current task

4. **Optimization Tools** (Future Implementation):
   - configure_hooks: Adjust thresholds for your strategy
   - manage_memory: Optimize CLAUDE.md structure
   - Task boundary detection: Automatic suggestions

**For now**: Manually adjust your context thresholds in .contextualizer/config.yaml based on your preferred strategy.`;

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
 * Optimize context prompt definition
 */
export const optimizeContextPrompt: MCPPrompt = {
  name: 'optimize_context',
  description:
    'Context management optimization workflow with strategy selection',
  arguments: [
    {
      name: 'strategy',
      description:
        "Optimization strategy: 'aggressive' (clear often, minimize context), 'balanced' (recommended, clear at task boundaries), 'conservative' (preserve context, rare clearing). Defaults to 'balanced'.",
      required: false,
    },
  ],
  provider: optimizeContextProvider,
};
