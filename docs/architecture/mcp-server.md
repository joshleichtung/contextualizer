# MCP Server Architecture

**Component**: MCP Server Core
**Phase**: 1 - Foundation
**Epic Reference**: Epic 1 - MCP Server Foundation

---

## Overview

The MCP Server is the central coordination layer that implements the Model Context Protocol (MCP) to enable Claude to interact with Contextualizer's tools, resources, and prompts via stdio transport.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude (Sonnet 4.5)                       │
│  User: "Set up this project for AI development"             │
│  User: "Run diagnostics"                                     │
└────────────────────┬──────────────────────────────────────────┘
                     │ MCP Protocol (stdio)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Contextualizer MCP Server                       │
│              (TypeScript/Node.js 18+)                        │
│                                                               │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   Tools (5)   │  │  Resources (3) │  │  Prompts (2)   │ │
│  ├───────────────┤  ├────────────────┤  ├────────────────┤ │
│  │ init_project  │  │ config         │  │ setup_wizard   │ │
│  │ run_doctor    │  │ diagnostics    │  │ health_check   │ │
│  │ configure_    │  │ presets        │  │                │ │
│  │   hooks       │  │                │  │                │ │
│  │ manage_memory │  │                │  │                │ │
│  │ get_config    │  │                │  │                │ │
│  └───────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## MCP Protocol Interface

### Communication Pattern

**Request-Response over stdio**:
```typescript
// MCP Protocol Message Flow
Claude → stdin  → MCP Server
MCP Server → stdout → Claude

// Message Types
1. initialize: Handshake, capabilities exchange
2. tools/list: Claude discovers available tools
3. tools/call: Execute tool with parameters
4. resources/list: Claude discovers available resources
5. resources/read: Fetch resource content
6. prompts/list: Claude discovers available prompts
7. prompts/get: Fetch prompt template
```

### Tool System Interface

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema; // Zod-generated schema
  handler: (params: unknown) => Promise<ToolResult>;
}

interface ToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
```

**Tool Registry Pattern**:
```typescript
// src/tools/index.ts
import { initProject } from './init-project';
import { runDoctor } from './run-doctor';
import { configureHooks } from './configure-hooks';
import { manageMemory } from './manage-memory';
import { getConfig } from './get-config';

export const TOOLS: MCPTool[] = [
  initProject,
  runDoctor,
  configureHooks,
  manageMemory,
  getConfig,
];

// Tool discovery
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = TOOLS.find(t => t.name === request.params.name);
  if (!tool) throw new Error(`Unknown tool: ${request.params.name}`);

  return tool.handler(request.params.arguments);
});
```

### Resource System Interface

```typescript
interface MCPResource {
  uri: string; // contextualizer://config, contextualizer://diagnostics
  name: string;
  description: string;
  mimeType: string;
  provider: () => Promise<ResourceContent>;
}

interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}
```

**Resource Providers**:

1. **Config Resource** (`contextualizer://config`)
   - Current effective configuration with overrides applied
   - MIME type: `application/x-yaml`
   - Real-time updates when configuration changes

2. **Diagnostics Resource** (`contextualizer://diagnostics`)
   - Latest doctor run results
   - MIME type: `application/json`
   - Cached for performance (5-minute TTL)

3. **Presets Resource** (`contextualizer://presets`)
   - Available preset definitions
   - MIME type: `application/json`
   - Static (loaded at server start)

### Prompt System Interface

```typescript
interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
  provider: (args: Record<string, string>) => Promise<PromptMessage[]>;
}

interface PromptMessage {
  role: "user" | "assistant";
  content: {
    type: "text" | "image" | "resource";
    text?: string;
  };
}
```

**Prompt Templates**:

1. **Setup Wizard** (`setup_wizard`)
   - Interactive project initialization
   - Detects project type, suggests preset
   - Generates natural language setup command

2. **Health Check** (`health_check`)
   - Comprehensive diagnostics request
   - Triggers complete project validation
   - Returns formatted report

## Server Lifecycle

```typescript
// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TOOLS } from './tools/index.js';
import { RESOURCES } from './resources/index.js';
import { PROMPTS } from './prompts/index.js';
import { logger } from './utils/logger.js';

async function main() {
  // Initialize server
  const server = new Server(
    {
      name: "contextualizer",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = TOOLS.find(t => t.name === request.params.name);
    if (!tool) throw new Error(`Unknown tool: ${request.params.name}`);

    logger.info({ tool: tool.name, params: request.params.arguments }, 'Tool invocation');

    try {
      const result = await tool.handler(request.params.arguments);
      logger.info({ tool: tool.name }, 'Tool success');
      return result;
    } catch (error) {
      logger.error({ tool: tool.name, error }, 'Tool error');
      throw error;
    }
  });

  // Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES.map(r => ({ uri: r.uri, name: r.name, description: r.description, mimeType: r.mimeType })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = RESOURCES.find(r => r.uri === request.params.uri);
    if (!resource) throw new Error(`Unknown resource: ${request.params.uri}`);

    return await resource.provider();
  });

  // Register prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS.map(p => ({ name: p.name, description: p.description, arguments: p.arguments })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS.find(p => p.name === request.params.name);
    if (!prompt) throw new Error(`Unknown prompt: ${request.params.name}`);

    const messages = await prompt.provider(request.params.arguments || {});
    return { messages };
  });

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Contextualizer MCP Server started');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
```

## Error Handling Strategy

### Error Hierarchy

```typescript
// src/utils/errors.ts
export class ContextualizerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ContextualizerError';
  }
}

export class ValidationError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details, true);
    this.name = 'ValidationError';
  }
}

export class FileOperationError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'FILE_OPERATION_ERROR', details, true);
    this.name = 'FileOperationError';
  }
}

export class ConflictError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT_ERROR', details, true);
    this.name = 'ConflictError';
  }
}
```

### Tool Wrapper with Error Handling

```typescript
export function wrapToolHandler<T>(
  handler: (params: T) => Promise<ToolResult>
): (params: unknown) => Promise<ToolResult> {
  return async (params: unknown) => {
    try {
      // Schema validation happens here
      const validatedParams = params as T; // After Zod validation
      return await handler(validatedParams);
    } catch (error) {
      if (error instanceof ContextualizerError) {
        return {
          content: [{
            type: "text",
            text: `❌ ${error.message}\n\n${error.details ? JSON.stringify(error.details, null, 2) : ''}`,
          }],
          isError: true,
        };
      }

      // Unexpected errors
      logger.error({ error }, 'Unexpected error');
      return {
        content: [{
          type: "text",
          text: `❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  };
}
```

## Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Node.js 18+ | LTS, MCP SDK compatibility, wide ecosystem |
| **Language** | TypeScript 5.x | Type safety, developer experience, tooling |
| **MCP SDK** | @modelcontextprotocol/sdk | Official Anthropic SDK, protocol compliance |
| **Transport** | stdio | Standard for Claude integration, simple, reliable |
| **Logging** | pino | Fast, structured, low overhead |

## Performance Targets

- **Server startup**: < 500ms
- **Tool invocation**: < 2s (NFR1)
- **Resource read**: < 100ms
- **Prompt generation**: < 200ms

## Security Considerations

- **Input validation**: All tool parameters validated via Zod schemas
- **Sandboxed execution**: No network access from server
- **Path validation**: Prevent directory traversal attacks
- **Error sanitization**: No sensitive data in error messages

## Integration Points

### MCP SDK Integration
```typescript
// src/integration/mcp-client.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class MCPServerWrapper {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'contextualizer',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  registerTool(tool: MCPTool): void {
    // Tool registration logic
  }

  registerResource(resource: MCPResource): void {
    // Resource registration logic
  }

  registerPrompt(prompt: MCPPrompt): void {
    // Prompt registration logic
  }
}
```

## Testing Strategy

### Unit Tests
- Tool handler execution
- Error handling paths
- Schema validation
- Resource providers

### Integration Tests
- MCP protocol handshake
- Tool invocation end-to-end
- Resource reading
- Prompt generation

### E2E Tests
- Full MCP conversation flow
- Multiple tool invocations in sequence
- Error recovery scenarios

## Cross-References

- **Tools Specification**: See `tools.md` for tool implementations
- **PRD**: Epic 1 (FR1-FR4) - MCP Server Foundation
- **Testing**: `testing-strategy.md` for complete test coverage
- **Security**: `security-performance.md` for security validations
