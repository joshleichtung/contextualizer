# MCP Tools Implementation

**Component**: MCP Tools
**Phase**: 1 - Foundation
**Epic Reference**: Epics 1-6

---

## Overview

MCP Tools are the primary interface for Claude to invoke Contextualizer functionality. Each tool performs a specific operation and returns structured results.

## Tool Catalog

### 1. init_project

**Purpose**: Interactive project initialization with preset selection

**Parameters**:
```typescript
{
  preset: 'minimal' | 'web-fullstack' | 'hackathon' | 'custom';
  options?: {
    skipConflictCheck?: boolean;
    customConfig?: Partial<Config>;
  };
}
```

**Behavior**:
1. Detects existing configuration
2. Prompts for conflict resolution if needed
3. Generates files from templates:
   - `.claude/hooks/user-prompt-submit`
   - `.claude/CLAUDE.md`
   - `.contextualizer/config.yaml`
   - `.claude/agents/*.md` (web-fullstack preset)
   - `.claude/skills/*.md` (web-fullstack preset)
4. Makes hooks executable
5. Creates git backup commit
6. Returns success status with file list

**Returns**:
```typescript
{
  content: [{
    type: "text",
    text: "✅ Setup complete! Created:\n- .claude/hooks/user-prompt-submit\n- .claude/CLAUDE.md\n..."
  }],
  isError: false
}
```

**Epic Reference**: Epic 2 - Project Initialization

---

### 2. run_doctor

**Purpose**: Validate project against best practices and detect issues

**Parameters**:
```typescript
{
  category?: 'all' | 'setup' | 'hooks' | 'memory' | 'mcp' | 'testing' | 'workflow';
  autofix?: boolean;
  checkIds?: string[]; // Run specific checks only
}
```

**Behavior**:
1. Load and execute diagnostic checks (15+ checks)
2. Generate structured report with pass/warn/fail status
3. If `autofix: true`, apply automatic fixes to failing checks
4. Cache results for 5 minutes
5. Log diagnostic run to `.contextualizer/mcp.log`

**Returns**:
```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify({
      timestamp: "2025-10-19T10:00:00Z",
      summary: {
        total: 15,
        passed: 12,
        warnings: 2,
        failures: 1
      },
      checks: [...]
    }, null, 2)
  }],
  isError: false
}
```

**Epic Reference**: Epic 5 - Diagnostics & Best Practices

---

### 3. configure_hooks

**Purpose**: Modify hook configuration and behavior

**Parameters**:
```typescript
{
  hookType: 'user-prompt-submit' | 'pre-commit';
  action: 'update' | 'disable' | 'enable';
  config?: {
    strictness?: 'strict' | 'balanced' | 'relaxed';
    thresholds?: {
      warning: number;
      critical: number;
    };
    checks?: Array<{
      name: string;
      failOn: 'errors' | 'warnings' | 'never';
    }>;
  };
}
```

**Behavior**:
1. Load current hook configuration
2. Validate new configuration
3. Regenerate hook from template
4. Update `.contextualizer/config.yaml`
5. Make hook executable
6. Create git backup commit

**Returns**:
```typescript
{
  content: [{
    type: "text",
    text: "✅ Hook configuration updated:\n- Strictness: balanced → strict\n- Warning threshold: 80% → 75%"
  }]
}
```

**Epic Reference**: Epic 4 - Context Management Hooks

---

### 4. manage_memory

**Purpose**: Update CLAUDE.md memory sections

**Parameters**:
```typescript
{
  action: 'read' | 'update' | 'append' | 'merge';
  section?: string; // Section title (required for update/append/merge)
  content?: string; // New content (required for update/append/merge)
  mode?: 'replace' | 'append' | 'merge'; // Update mode
}
```

**Behavior**:
1. **Read**: Parse and return all memory sections
2. **Update**: Replace or append to specific section
3. **Merge**: Intelligently merge lists without duplicates
4. Preserve user vs managed sections (via `@contextualizer-managed` markers)
5. Create git backup before modifications

**Returns**:
```typescript
{
  content: [{
    type: "text",
    text: "✅ Memory updated: Added framework versions to 'Project Setup' section"
  }]
}
```

**Epic Reference**: Epic 6 - Memory Management & Configuration

---

### 5. get_config

**Purpose**: Read effective configuration with all overrides applied

**Parameters**:
```typescript
{
  format?: 'yaml' | 'json';
  includeDefaults?: boolean;
}
```

**Behavior**:
1. Load `.contextualizer/config.yaml`
2. Apply preset defaults
3. Merge with environment overrides
4. Return in requested format

**Returns**:
```typescript
{
  content: [{
    type: "text",
    text: "version: 1.0.0\npreset: web-fullstack\n..."
  }]
}
```

**Epic Reference**: Epic 6 - Memory Management & Configuration

---

## Tool Implementation Pattern

### Standard Tool Structure

```typescript
// src/tools/example-tool.ts
import { z } from 'zod';
import { wrapToolHandler } from '../utils/errors';

// 1. Define input schema
const ExampleToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});

type ExampleToolParams = z.infer<typeof ExampleToolSchema>;

// 2. Implement handler
async function exampleToolHandler(params: ExampleToolParams): Promise<ToolResult> {
  // Validate parameters (already done by Zod)

  // Execute logic
  const result = await doSomething(params.param1);

  // Return structured result
  return {
    content: [{
      type: "text",
      text: `✅ Success: ${result}`,
    }],
    isError: false,
  };
}

// 3. Export tool definition
export const exampleTool: MCPTool = {
  name: 'example_tool',
  description: 'Description of what this tool does',
  inputSchema: ExampleToolSchema,
  handler: wrapToolHandler(exampleToolHandler),
};
```

## Common Patterns

### File Operations
All tools that modify files must:
1. Validate paths to prevent directory traversal
2. Create backups before destructive operations
3. Use atomic file writes
4. Create git commits for tracking changes

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  throw new FileOperationError(
    'Failed to write configuration',
    { path, error: error.message }
  );
}
```

### Logging
```typescript
import { logger } from '../utils/logger';

logger.info({ tool: 'init_project', preset }, 'Starting project initialization');
logger.warn({ issue: 'conflict detected' }, 'Existing configuration found');
logger.error({ error }, 'Operation failed');
```

## Performance Optimization

### Caching Strategy
- **Configuration**: Cache for 60 seconds (frequently read)
- **Diagnostics**: Cache for 5 minutes (expensive to run)
- **Presets**: Load once at startup (static data)

### Parallel Operations
```typescript
// Run independent operations in parallel
await Promise.all([
  writeFile('.claude/CLAUDE.md', content),
  writeFile('.contextualizer/config.yaml', config),
  chmod('.claude/hooks/user-prompt-submit', 0o755),
]);
```

## Testing Strategy

### Unit Tests
Each tool must have:
- ✅ Happy path test
- ✅ Parameter validation tests
- ✅ Error handling tests
- ✅ Idempotency tests (safe to re-run)

### Integration Tests
- ✅ End-to-end tool execution
- ✅ File system state verification
- ✅ Git commit creation
- ✅ Conflict handling scenarios

## Cross-References

- **PRD**: FR1-FR16 for detailed functional requirements
- **Epic Files**: `docs/epics/*.md` for story-level implementation details
- **Architecture**: `mcp-server.md` for server-level integration
- **Data Models**: `data-models.md` for schema definitions
