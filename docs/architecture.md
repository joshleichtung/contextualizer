# Contextualizer Architecture Document

**Version**: 1.0.0
**Date**: 2025-10-19
**Status**: Phase 1 Foundation
**Phase**: MVP (8-12 weeks)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [MCP Server Architecture](#mcp-server-architecture)
3. [Core Components](#core-components)
4. [Data Models](#data-models)
5. [Integration Layer](#integration-layer)
6. [Security & Performance](#security--performance)
7. [Testing Architecture](#testing-architecture)
8. [Extensibility](#extensibility)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Claude Code                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Claude (Sonnet 4.5)                       │   │
│  │                                                               │   │
│  │  User: "Set up this project for AI development"             │   │
│  │  User: "Run diagnostics"                                     │   │
│  │  User: "Make hooks less strict"                             │   │
│  └────────────────────┬──────────────────────────────────────────┘   │
│                       │                                              │
│                       │ MCP Protocol (stdio)                         │
│                       ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Contextualizer MCP Server                       │   │
│  │              (TypeScript/Node.js 18+)                        │   │
│  │                                                               │   │
│  │  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │   │
│  │  │   Tools (5)   │  │  Resources (3) │  │  Prompts (2)   │ │   │
│  │  ├───────────────┤  ├────────────────┤  ├────────────────┤ │   │
│  │  │ init_project  │  │ config         │  │ setup_wizard   │ │   │
│  │  │ run_doctor    │  │ diagnostics    │  │ health_check   │ │   │
│  │  │ configure_    │  │ presets        │  │                │ │   │
│  │  │   hooks       │  │                │  │                │ │   │
│  │  │ manage_       │  │                │  │                │ │   │
│  │  │   memory      │  │                │  │                │ │   │
│  │  │ get_config    │  │                │  │                │ │   │
│  │  └───────────────┘  └────────────────┘  └────────────────┘ │   │
│  │                                                               │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │              Core Engine Layer                         │  │   │
│  │  │                                                         │  │   │
│  │  │  Template    Preset      Conflict    Diagnostics       │  │   │
│  │  │  Engine      System      Resolver    Engine            │  │   │
│  │  │                                                         │  │   │
│  │  │  Hook        Memory      Config      Cache             │  │   │
│  │  │  Generator   Manager     Manager     System            │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │              Integration Layer                         │  │   │
│  │  │                                                         │  │   │
│  │  │  MCP SDK    Git Ops    File I/O    Package.json        │  │   │
│  │  │  Client     Manager    Manager     Parser              │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  └──────────────────────┬────────────────────────────────────────┘   │
│                         │                                            │
│                         │ File Operations (Atomic, Safe)             │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Project Files                            │   │
│  │                                                               │   │
│  │  .claude/                    .contextualizer/                │   │
│  │  ├─ hooks/                   ├─ config.yaml                 │   │
│  │  │  ├─ user-prompt-submit    ├─ state-{PID}.json          │   │
│  │  │  └─ pre-commit            ├─ mcp.log                    │   │
│  │  ├─ agents/                  ├─ hook-errors.log            │   │
│  │  │  ├─ code-reviewer.md      ├─ cache/                     │   │
│  │  │  ├─ test-architect.md     │  └─ best-practices.json    │   │
│  │  │  └─ doc-writer.md         └─ backup-{timestamp}/        │   │
│  │  ├─ skills/                                                 │   │
│  │  │  ├─ nextjs-expert.md                                    │   │
│  │  │  ├─ react-expert.md                                     │   │
│  │  │  └─ typescript-expert.md                                │   │
│  │  └─ CLAUDE.md                                              │   │
│  │                                                               │   │
│  │  package.json (read for version detection)                  │   │
│  │  .git/ (for commits, backups, monorepo detection)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                    Request Flow                               │
└──────────────────────────────────────────────────────────────┘

User Input → Claude Natural Language Processing
                    ↓
          MCP Tool Invocation Decision
                    ↓
          Tool Parameter Extraction
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                MCP Server Tool Handler                       │
│                                                               │
│  1. Validate Parameters (Schema + Business Rules)           │
│  2. Load Configuration (.contextualizer/config.yaml)        │
│  3. Execute Core Engine Logic                               │
│  4. Perform File Operations (Atomic, with Backups)          │
│  5. Log Operations (.contextualizer/mcp.log)               │
│  6. Return Results (Structured JSON)                        │
└─────────────────────────────────────────────────────────────┘
                    ↓
          Claude Result Processing
                    ↓
          Natural Language Response to User
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js 18+ | LTS, MCP SDK compatibility, wide ecosystem |
| **Language** | TypeScript 5.x | Type safety, developer experience, tooling |
| **MCP SDK** | @modelcontextprotocol/sdk | Official Anthropic SDK, protocol compliance |
| **Transport** | stdio | Standard for Claude integration, simple, reliable |
| **Build** | tsup | Fast bundling, minimal config, ESM/CJS output |
| **Testing** | Vitest | Fast, TypeScript native, jest-compatible |
| **File Ops** | fs-extra | Atomic writes, safe operations, promisified |
| **Git** | simple-git | Repository operations, commits, detection |
| **Templates** | Handlebars | Widely used, safe, powerful helpers |
| **YAML** | js-yaml | Standard parser, schema validation support |
| **Validation** | Zod | Runtime type validation, error messages |
| **Logging** | pino | Fast, structured, low overhead |

**Rationale for Key Choices**:
- **TypeScript**: Reduces runtime errors, improves maintainability, better IDE support
- **stdio transport**: Simplest MCP integration, no network complexity
- **fs-extra**: Atomic operations critical for reliability (NFR6)
- **Handlebars**: Safer than template literals, better error messages
- **Zod**: Schema validation doubles as TypeScript types, excellent DX

---

## MCP Server Architecture

### MCP Protocol Interface

**Communication Pattern**: Request-Response over stdio

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

### Tool System Design

**Tool Interface**:
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

### Resource System Design

**Resource Interface**:
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
```typescript
// src/resources/config.ts
export const configResource: MCPResource = {
  uri: "contextualizer://config",
  name: "Configuration",
  description: "Current project configuration with overrides applied",
  mimeType: "application/x-yaml",
  provider: async () => {
    const config = await loadEffectiveConfig();
    return {
      uri: "contextualizer://config",
      mimeType: "application/x-yaml",
      text: yaml.dump(config),
    };
  },
};

// src/resources/diagnostics.ts
export const diagnosticsResource: MCPResource = {
  uri: "contextualizer://diagnostics",
  name: "Latest Diagnostics",
  description: "Most recent doctor run results",
  mimeType: "application/json",
  provider: async () => {
    const results = await loadCachedDiagnostics();
    return {
      uri: "contextualizer://diagnostics",
      mimeType: "application/json",
      text: JSON.stringify(results, null, 2),
    };
  },
};

// src/resources/presets.ts
export const presetsResource: MCPResource = {
  uri: "contextualizer://presets",
  name: "Available Presets",
  description: "List of all available project presets",
  mimeType: "application/json",
  provider: async () => {
    const presets = await loadPresets();
    return {
      uri: "contextualizer://presets",
      mimeType: "application/json",
      text: JSON.stringify(presets, null, 2),
    };
  },
};
```

### Prompt System Design

**Prompt Interface**:
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
```typescript
// src/prompts/setup-wizard.ts
export const setupWizardPrompt: MCPPrompt = {
  name: "setup_wizard",
  description: "Interactive project setup with preset selection",
  arguments: [
    {
      name: "project_type",
      description: "Type of project (detected or manual)",
      required: false,
    },
  ],
  provider: async (args) => {
    const projectType = args.project_type || await detectProjectType();
    const suggestedPreset = suggestPreset(projectType);

    return [
      {
        role: "user",
        content: {
          type: "text",
          text: `Set up this ${projectType} project with the ${suggestedPreset} preset`,
        },
      },
    ];
  },
};

// src/prompts/health-check.ts
export const healthCheckPrompt: MCPPrompt = {
  name: "health_check",
  description: "Comprehensive project health check and diagnostics",
  provider: async () => {
    return [
      {
        role: "user",
        content: {
          type: "text",
          text: "Run comprehensive diagnostics on this project and report any issues",
        },
      },
    ];
  },
};
```

### Server Lifecycle

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

### Error Handling Strategy

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

// Tool wrapper with error handling
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

---

## Core Components

### 1. Template Engine

**Purpose**: Generate files from templates with variable substitution, conditionals, and loops

**Architecture**:
```typescript
// src/templates/engine.ts
import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface TemplateContext {
  preset: string;
  framework?: {
    name: string;
    version: string;
  };
  strictness: 'strict' | 'balanced' | 'relaxed';
  contextThresholds: {
    warning: number;
    critical: number;
  };
  enabledChecks: string[];
  customVars: Record<string, unknown>;
}

export class TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private templatesDir: string) {
    this.registerHelpers();
  }

  private registerHelpers() {
    // Custom Handlebars helpers
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('ne', (a, b) => a !== b);
    Handlebars.registerHelper('gte', (a, b) => a >= b);
    Handlebars.registerHelper('lte', (a, b) => a <= b);
    Handlebars.registerHelper('join', (arr, sep) => arr.join(sep));
    Handlebars.registerHelper('default', (value, defaultValue) => value || defaultValue);
  }

  async loadTemplate(name: string): Promise<void> {
    const content = await readFile(join(this.templatesDir, name), 'utf-8');
    this.templates.set(name, Handlebars.compile(content));
  }

  async render(templateName: string, context: TemplateContext): Promise<string> {
    if (!this.templates.has(templateName)) {
      await this.loadTemplate(templateName);
    }

    const template = this.templates.get(templateName)!;
    return template(context);
  }

  async renderAll(preset: string, context: TemplateContext): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const presetDir = join(this.templatesDir, preset);

    // Template file mapping
    const templateMap = {
      'user-prompt-submit.sh.hbs': '.claude/hooks/user-prompt-submit',
      'pre-commit.sh.hbs': '.claude/hooks/pre-commit',
      'CLAUDE.md.hbs': '.claude/CLAUDE.md',
      'config.yaml.hbs': '.contextualizer/config.yaml',
      'code-reviewer.md.hbs': '.claude/agents/code-reviewer.md',
      'test-architect.md.hbs': '.claude/agents/test-architect.md',
      'nextjs-expert.md.hbs': '.claude/skills/nextjs-expert.md',
    };

    for (const [template, outputPath] of Object.entries(templateMap)) {
      const content = await this.render(join(preset, template), context);
      files.set(outputPath, content);
    }

    return files;
  }
}
```

**Template Structure**:
```
src/templates/
├── minimal/
│   ├── user-prompt-submit.sh.hbs
│   ├── CLAUDE.md.hbs
│   └── config.yaml.hbs
├── web-fullstack/
│   ├── user-prompt-submit.sh.hbs
│   ├── pre-commit.sh.hbs
│   ├── CLAUDE.md.hbs
│   ├── config.yaml.hbs
│   ├── code-reviewer.md.hbs
│   ├── test-architect.md.hbs
│   ├── doc-writer.md.hbs
│   ├── nextjs-expert.md.hbs
│   ├── react-expert.md.hbs
│   └── typescript-expert.md.hbs
└── hackathon/
    ├── user-prompt-submit.sh.hbs
    ├── pre-commit.sh.hbs
    ├── CLAUDE.md.hbs
    └── config.yaml.hbs
```

**Template Example** (user-prompt-submit.sh.hbs):
```handlebars
#!/usr/bin/env bash
# .claude/hooks/user-prompt-submit
# Generated by Contextualizer v{{version}}
# Preset: {{preset}}
# Purpose: Context monitoring and task boundary detection

set -euo pipefail

# Configuration
CONFIG_FILE=".contextualizer/config.yaml"
STATE_FILE=".contextualizer/state-$$.json"
LOG_FILE=".contextualizer/hook-errors.log"

# Read configuration (if exists)
WARNING_THRESHOLD={{contextThresholds.warning}}
CRITICAL_THRESHOLD={{contextThresholds.critical}}

# Read prompt from stdin
PROMPT=$(cat)

# Estimate tokens (characters ÷ 4)
CHARS=$(echo -n "$PROMPT" | wc -c | tr -d ' ')
ESTIMATED_TOKENS=$((CHARS / 4))

# Load or initialize state
if [ -f "$STATE_FILE" ]; then
  PREV_TOKENS=$(jq -r '.tokens // 0' "$STATE_FILE" 2>/dev/null || echo "0")
  LAST_WARNING=$(jq -r '.last_warning // 0' "$STATE_FILE" 2>/dev/null || echo "0")
else
  PREV_TOKENS=0
  LAST_WARNING=0
fi

# Calculate cumulative context (simplified heuristic)
TOTAL_TOKENS=$((PREV_TOKENS + ESTIMATED_TOKENS))

# Calculate percentage (assume 200K token limit)
PERCENT=$((TOTAL_TOKENS * 100 / 200000))

# Rate limiting: Only warn if >5 minutes since last warning
CURRENT_TIME=$(date +%s)
TIME_SINCE_WARNING=$((CURRENT_TIME - LAST_WARNING))

# Warning logic
if [ $PERCENT -ge $CRITICAL_THRESHOLD ] && [ $TIME_SINCE_WARNING -ge 300 ]; then
  echo "🚨 Context usage at ${PERCENT}%. Clear soon to avoid overflow." >&2
  LAST_WARNING=$CURRENT_TIME
elif [ $PERCENT -ge $WARNING_THRESHOLD ] && [ $TIME_SINCE_WARNING -ge 300 ]; then
  echo "⚠️  Context at ${PERCENT}%. Consider clearing if starting new task." >&2
  LAST_WARNING=$CURRENT_TIME
fi

# Update state
jq -n \
  --arg tokens "$TOTAL_TOKENS" \
  --arg last_warning "$LAST_WARNING" \
  '{tokens: ($tokens | tonumber), last_warning: ($last_warning | tonumber)}' \
  > "$STATE_FILE" 2>> "$LOG_FILE" || true

# Always exit 0 (never block prompt submission)
exit 0
```

### 2. Preset System

**Architecture**:
```typescript
// src/presets/types.ts
export interface PresetDefinition {
  name: string;
  description: string;
  installationTime: string;

  contextMonitoring: {
    warningThreshold: number;
    criticalThreshold: number;
    boundaryDetection: 'aggressive' | 'balanced' | 'conservative';
  };

  hooks: {
    preCommit?: {
      enabled: boolean;
      strictness: 'strict' | 'balanced' | 'relaxed';
      checks: Array<{
        name: string;
        failOn: 'errors' | 'warnings' | 'never';
        timeout?: number;
      }>;
    };
  };

  memory: {
    sections: Array<{
      title: string;
      content: string;
    }>;
    context7Libraries?: string[];
  };

  skills?: string[];
  subagents?: string[];

  codingStandards?: string[];
}

// src/presets/registry.ts
import minimalPreset from './minimal.json';
import webFullstackPreset from './web-fullstack.json';
import hackathonPreset from './hackathon.json';

export const PRESETS: Map<string, PresetDefinition> = new Map([
  ['minimal', minimalPreset],
  ['web-fullstack', webFullstackPreset],
  ['hackathon', hackathonPreset],
]);

export function getPreset(name: string): PresetDefinition | undefined {
  return PRESETS.get(name);
}

export function listPresets(): Array<{ name: string; description: string }> {
  return Array.from(PRESETS.entries()).map(([name, preset]) => ({
    name,
    description: preset.description,
  }));
}
```

**Preset Definitions** (web-fullstack.json):
```json
{
  "name": "Web Fullstack",
  "description": "Next.js + React + TypeScript + Tailwind full-stack development",
  "installationTime": "< 30 seconds",

  "contextMonitoring": {
    "warningThreshold": 75,
    "criticalThreshold": 90,
    "boundaryDetection": "balanced"
  },

  "hooks": {
    "preCommit": {
      "enabled": true,
      "strictness": "strict",
      "checks": [
        {
          "name": "eslint",
          "failOn": "errors",
          "timeout": 60
        },
        {
          "name": "typescript",
          "failOn": "errors",
          "timeout": 90
        },
        {
          "name": "vitest",
          "failOn": "errors",
          "timeout": 120
        }
      ]
    }
  },

  "memory": {
    "sections": [
      {
        "title": "Framework Versions",
        "content": "This project uses:\n- Next.js 15 (App Router)\n- React 19 (Server Components)\n- TypeScript 5 (strict mode)\n- Tailwind CSS 3"
      },
      {
        "title": "Architecture Patterns",
        "content": "- Use App Router for all routing\n- Prefer Server Components by default\n- Use 'use client' directive only when needed\n- Server Actions for mutations"
      }
    ],
    "context7Libraries": [
      "/vercel/next.js/v15.0.0",
      "/facebook/react/v19.0.0",
      "/tailwindlabs/tailwindcss/v3.4.0"
    ]
  },

  "skills": [
    "nextjs-expert",
    "react-expert",
    "typescript-expert",
    "testing-expert"
  ],

  "subagents": [
    "code-reviewer",
    "test-architect",
    "doc-writer"
  ],

  "codingStandards": [
    "Use App Router for routing",
    "Prefer Server Components by default",
    "TypeScript strict mode enabled",
    "Prettier for formatting",
    "Vitest for testing"
  ]
}
```

### 3. Conflict Resolution System

**Purpose**: Safely merge Contextualizer configuration into existing projects

**Architecture**:
```typescript
// src/core/conflict-resolver.ts
import { diff } from 'jest-diff';
import simpleGit from 'simple-git';

export interface ConflictDetection {
  file: string;
  exists: boolean;
  isContextualizerManaged: boolean;
  hasUserModifications: boolean;
  action: 'create' | 'update' | 'merge' | 'skip';
}

export interface ConflictResolution {
  file: string;
  strategy: 'backup-replace' | 'merge' | 'skip' | 'view-diff';
  backup?: string;
}

export class ConflictResolver {
  private git = simpleGit();

  async detectConflicts(
    targetFiles: Map<string, string>
  ): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = [];

    for (const [file, content] of targetFiles.entries()) {
      const exists = await this.fileExists(file);

      if (!exists) {
        conflicts.push({
          file,
          exists: false,
          isContextualizerManaged: false,
          hasUserModifications: false,
          action: 'create',
        });
        continue;
      }

      const existingContent = await readFile(file, 'utf-8');
      const isManaged = this.isContextualizerManaged(existingContent);
      const hasUserMods = isManaged && this.hasUserModifications(existingContent);

      conflicts.push({
        file,
        exists: true,
        isContextualizerManaged: isManaged,
        hasUserModifications: hasUserMods,
        action: isManaged ? 'update' : 'merge',
      });
    }

    return conflicts;
  }

  private isContextualizerManaged(content: string): boolean {
    // Check for Contextualizer marker comments
    return content.includes('Generated by Contextualizer') ||
           content.includes('@contextualizer-managed');
  }

  private hasUserModifications(content: string): boolean {
    // Check for user modification markers
    return content.includes('@contextualizer-end') &&
           !content.includes('@contextualizer-pristine');
  }

  async createBackup(file: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `.contextualizer/backup-${timestamp}`;
    const backupFile = join(backupDir, file);

    await ensureDir(dirname(backupFile));
    await copyFile(file, backupFile);

    // Git commit backup
    await this.git.add(backupFile);
    await this.git.commit(`Backup before Contextualizer update: ${file}`);

    return backupFile;
  }

  async merge(
    file: string,
    newContent: string,
    strategy: 'preserve-user' | 'sections'
  ): Promise<string> {
    const existingContent = await readFile(file, 'utf-8');

    if (strategy === 'preserve-user') {
      return this.mergePreservingUser(existingContent, newContent);
    } else {
      return this.mergeBySections(existingContent, newContent);
    }
  }

  private mergePreservingUser(existing: string, incoming: string): string {
    // Extract user sections (outside @contextualizer markers)
    const userSections = this.extractUserSections(existing);

    // Replace Contextualizer sections in incoming content
    let merged = incoming;
    for (const [marker, content] of userSections.entries()) {
      merged = merged.replace(
        new RegExp(`<!-- @contextualizer-${marker} -->.*?<!-- @contextualizer-${marker}-end -->`, 's'),
        content
      );
    }

    return merged;
  }

  private mergeBySections(existing: string, incoming: string): string {
    // Intelligent section-based merging for CLAUDE.md
    // Preserve user sections, update Contextualizer sections

    const existingSections = this.parseSections(existing);
    const incomingSections = this.parseSections(incoming);

    const merged = new Map(existingSections);

    // Update or add Contextualizer sections
    for (const [key, value] of incomingSections.entries()) {
      if (key.startsWith('contextualizer:')) {
        merged.set(key, value);
      }
    }

    return this.assembleSections(merged);
  }

  async showDiff(file: string, newContent: string): Promise<string> {
    const existingContent = await readFile(file, 'utf-8');
    return diff(existingContent, newContent, {
      contextLines: 3,
      expand: false,
    }) || 'No differences';
  }

  async applyResolution(
    file: string,
    content: string,
    resolution: ConflictResolution
  ): Promise<void> {
    switch (resolution.strategy) {
      case 'backup-replace':
        await this.createBackup(file);
        await writeFile(file, content, 'utf-8');
        break;

      case 'merge':
        const merged = await this.merge(file, content, 'sections');
        await writeFile(file, merged, 'utf-8');
        break;

      case 'skip':
        // Do nothing
        break;

      case 'view-diff':
        // Return diff for user review (handled in tool)
        break;
    }

    // Git commit changes
    if (resolution.strategy !== 'skip') {
      await this.git.add(file);
      await this.git.commit(`Contextualizer update: ${file}`);
    }
  }
}
```

### 4. Diagnostics Engine

**Purpose**: Validate project against Anthropic best practices

**Architecture**:
```typescript
// src/diagnostics/types.ts
export type CheckStatus = 'pass' | 'warn' | 'fail';
export type CheckCategory = 'setup' | 'hooks' | 'memory' | 'mcp' | 'testing' | 'workflow';

export interface DiagnosticCheck {
  id: string;
  category: CheckCategory;
  name: string;
  description: string;
  execute: () => Promise<CheckResult>;
  autofix?: () => Promise<void>;
}

export interface CheckResult {
  status: CheckStatus;
  message: string;
  details?: unknown;
  recommendation?: string;
  autofixAvailable: boolean;
}

export interface DiagnosticReport {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failures: number;
  };
  checks: Array<CheckResult & { id: string; category: CheckCategory; name: string }>;
}

// src/diagnostics/registry.ts
export class DiagnosticsEngine {
  private checks: Map<string, DiagnosticCheck> = new Map();

  registerCheck(check: DiagnosticCheck): void {
    this.checks.set(check.id, check);
  }

  async runAll(category?: CheckCategory): Promise<DiagnosticReport> {
    const checksToRun = category
      ? Array.from(this.checks.values()).filter(c => c.category === category)
      : Array.from(this.checks.values());

    const results = await Promise.all(
      checksToRun.map(async (check) => {
        const result = await check.execute();
        return {
          id: check.id,
          category: check.category,
          name: check.name,
          ...result,
        };
      })
    );

    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      warnings: results.filter(r => r.status === 'warn').length,
      failures: results.filter(r => r.status === 'fail').length,
    };

    return {
      timestamp: new Date().toISOString(),
      summary,
      checks: results,
    };
  }

  async applyFixes(checkIds: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const id of checkIds) {
      const check = this.checks.get(id);
      if (!check || !check.autofix) {
        results.set(id, false);
        continue;
      }

      try {
        await check.autofix();
        results.set(id, true);
      } catch (error) {
        logger.error({ id, error }, 'Autofix failed');
        results.set(id, false);
      }
    }

    return results;
  }
}
```

**Check Implementations**:
```typescript
// src/diagnostics/checks/hooks-configured.ts
export const hooksConfiguredCheck: DiagnosticCheck = {
  id: 'hooks-configured',
  category: 'hooks',
  name: 'Hooks Configured',
  description: 'Verify context monitoring hooks are installed',

  execute: async () => {
    const hookPath = '.claude/hooks/user-prompt-submit';
    const exists = await fileExists(hookPath);

    if (!exists) {
      return {
        status: 'fail',
        message: 'Context monitoring hook not found',
        recommendation: 'Run init_project to install hooks',
        autofixAvailable: true,
      };
    }

    // Check if executable
    const stats = await stat(hookPath);
    const isExecutable = (stats.mode & 0o111) !== 0;

    if (!isExecutable) {
      return {
        status: 'warn',
        message: 'Hook exists but is not executable',
        recommendation: 'Run: chmod +x .claude/hooks/user-prompt-submit',
        autofixAvailable: true,
      };
    }

    return {
      status: 'pass',
      message: 'Context monitoring hook installed and executable',
      autofixAvailable: false,
    };
  },

  autofix: async () => {
    const hookPath = '.claude/hooks/user-prompt-submit';
    if (!(await fileExists(hookPath))) {
      // Regenerate hook from template
      const engine = new TemplateEngine('./templates');
      const config = await loadConfig();
      const hook = await engine.render(
        `${config.preset}/user-prompt-submit.sh.hbs`,
        config
      );
      await writeFile(hookPath, hook, 'utf-8');
    }

    // Make executable
    await chmod(hookPath, 0o755);
  },
};

// src/diagnostics/checks/claude-md-exists.ts
export const claudeMdExistsCheck: DiagnosticCheck = {
  id: 'claude-md-exists',
  category: 'memory',
  name: 'CLAUDE.md Exists',
  description: 'Verify project memory file is present',

  execute: async () => {
    const claudeMdPath = '.claude/CLAUDE.md';
    const exists = await fileExists(claudeMdPath);

    if (!exists) {
      return {
        status: 'fail',
        message: 'CLAUDE.md not found',
        recommendation: 'Run init_project or manage_memory to create',
        autofixAvailable: true,
      };
    }

    // Check if empty or minimal
    const content = await readFile(claudeMdPath, 'utf-8');
    if (content.length < 100) {
      return {
        status: 'warn',
        message: 'CLAUDE.md exists but is very minimal',
        recommendation: 'Add project-specific patterns and conventions',
        autofixAvailable: false,
      };
    }

    return {
      status: 'pass',
      message: 'CLAUDE.md exists with content',
      autofixAvailable: false,
    };
  },

  autofix: async () => {
    const engine = new TemplateEngine('./templates');
    const config = await loadConfig();
    const content = await engine.render(
      `${config.preset}/CLAUDE.md.hbs`,
      config
    );
    await writeFile('.claude/CLAUDE.md', content, 'utf-8');
  },
};

// 15+ checks total covering:
// - setup: .contextualizer/config.yaml, .claude directory structure
// - hooks: user-prompt-submit, pre-commit (if enabled)
// - memory: CLAUDE.md, section completeness
// - mcp: claude_desktop_config.json entry
// - testing: test framework detection, coverage config
// - workflow: git initialization, package.json scripts
```

### 5. Hook Generator

**Purpose**: Generate performant bash hooks with < 100ms latency

**Architecture**:
```typescript
// src/core/hook-generator.ts
export interface HookConfiguration {
  type: 'user-prompt-submit' | 'pre-commit';
  strictness: 'strict' | 'balanced' | 'relaxed';
  thresholds?: {
    warning: number;
    critical: number;
  };
  checks?: Array<{
    name: string;
    command: string;
    failOn: 'errors' | 'warnings' | 'never';
    timeout: number;
  }>;
}

export class HookGenerator {
  constructor(private templateEngine: TemplateEngine) {}

  async generate(config: HookConfiguration): Promise<string> {
    const templateName = `${config.type}.sh.hbs`;

    const context = {
      version: '1.0.0',
      strictness: config.strictness,
      contextThresholds: config.thresholds || { warning: 80, critical: 95 },
      checks: config.checks || [],
      timestamp: new Date().toISOString(),
    };

    return await this.templateEngine.render(templateName, context);
  }

  async install(hookType: string, content: string): Promise<void> {
    const hookPath = `.claude/hooks/${hookType}`;

    // Ensure directory exists
    await ensureDir(dirname(hookPath));

    // Write hook
    await writeFile(hookPath, content, 'utf-8');

    // Make executable
    await chmod(hookPath, 0o755);

    logger.info({ hookType }, 'Hook installed');
  }

  async validate(content: string): Promise<{ valid: boolean; error?: string }> {
    // Basic bash syntax validation
    const tmpFile = `/tmp/contextualizer-hook-${Date.now()}.sh`;
    await writeFile(tmpFile, content, 'utf-8');

    try {
      await execAsync(`bash -n ${tmpFile}`);
      await unlink(tmpFile);
      return { valid: true };
    } catch (error) {
      await unlink(tmpFile);
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
```

**Performance Optimization**:
```bash
# Performance techniques in generated hooks:

# 1. Minimize external commands
# Instead of: grep -c "pattern" file | wc -l
# Use: builtin bash string operations

# 2. Avoid repeated file reads
# Cache file contents in variables

# 3. Use jq for JSON (faster than bash parsing)
# jq -r '.field' state.json

# 4. Early exit on thresholds
if [ $PERCENT -lt $WARNING_THRESHOLD ]; then
  exit 0  # Skip remaining checks
fi

# 5. Background non-critical tasks
# (state update happens after user sees result)

# 6. Rate limiting prevents spam
TIME_SINCE_WARNING=$((CURRENT_TIME - LAST_WARNING))
if [ $TIME_SINCE_WARNING -lt 300 ]; then
  exit 0  # Skip warning if < 5 min since last
fi
```

### 6. Memory Manager

**Purpose**: Manage CLAUDE.md hierarchical memory system

**Architecture**:
```typescript
// src/core/memory-manager.ts
export interface MemorySection {
  title: string;
  content: string;
  managed: boolean; // Contextualizer-managed vs user-created
}

export interface MemoryUpdate {
  section: string;
  content: string;
  mode: 'append' | 'replace' | 'merge';
}

export class MemoryManager {
  async read(path: string = '.claude/CLAUDE.md'): Promise<MemorySection[]> {
    const content = await readFile(path, 'utf-8');
    return this.parse(content);
  }

  private parse(content: string): MemorySection[] {
    const sections: MemorySection[] = [];
    const lines = content.split('\n');

    let currentSection: MemorySection | null = null;
    let isManaged = false;

    for (const line of lines) {
      // Detect section headers
      if (line.startsWith('# ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.slice(2),
          content: '',
          managed: false,
        };
      }

      // Detect managed markers
      if (line.includes('@contextualizer-managed')) {
        isManaged = true;
      } else if (line.includes('@contextualizer-end')) {
        isManaged = false;
      }

      if (currentSection) {
        currentSection.content += line + '\n';
        if (isManaged) {
          currentSection.managed = true;
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  async update(
    update: MemoryUpdate,
    path: string = '.claude/CLAUDE.md'
  ): Promise<void> {
    const sections = await this.read(path);

    const sectionIndex = sections.findIndex(s =>
      s.title.toLowerCase() === update.section.toLowerCase()
    );

    if (update.mode === 'replace') {
      if (sectionIndex >= 0) {
        sections[sectionIndex].content = update.content;
      } else {
        sections.push({
          title: update.section,
          content: update.content,
          managed: true,
        });
      }
    } else if (update.mode === 'append') {
      if (sectionIndex >= 0) {
        sections[sectionIndex].content += '\n' + update.content;
      } else {
        sections.push({
          title: update.section,
          content: update.content,
          managed: true,
        });
      }
    } else if (update.mode === 'merge') {
      // Intelligent merging for lists
      if (sectionIndex >= 0) {
        sections[sectionIndex].content = this.mergeLists(
          sections[sectionIndex].content,
          update.content
        );
      } else {
        sections.push({
          title: update.section,
          content: update.content,
          managed: true,
        });
      }
    }

    await this.write(sections, path);
  }

  private mergeLists(existing: string, incoming: string): string {
    // Parse lists and merge without duplicates
    const existingItems = existing.split('\n').filter(l => l.trim().startsWith('-'));
    const incomingItems = incoming.split('\n').filter(l => l.trim().startsWith('-'));

    const merged = new Set([...existingItems, ...incomingItems]);
    return Array.from(merged).join('\n');
  }

  private async write(sections: MemorySection[], path: string): Promise<void> {
    let content = '';

    for (const section of sections) {
      content += `# ${section.title}\n\n`;
      if (section.managed) {
        content += `<!-- @contextualizer-managed -->\n`;
      }
      content += section.content;
      if (section.managed) {
        content += `<!-- @contextualizer-end -->\n`;
      }
      content += '\n';
    }

    await writeFile(path, content, 'utf-8');
  }
}
```

---

## Data Models

### Configuration Schema

```typescript
// src/types/config.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  preset: z.enum(['minimal', 'web-fullstack', 'hackathon', 'custom']),

  contextMonitoring: z.object({
    enabled: z.boolean().default(true),
    warningThreshold: z.number().min(0).max(100).default(80),
    criticalThreshold: z.number().min(0).max(100).default(95),
    boundaryDetection: z.enum(['aggressive', 'balanced', 'conservative']).default('balanced'),
    rateLimit: z.number().default(300), // seconds between warnings
  }),

  hooks: z.object({
    preCommit: z.object({
      enabled: z.boolean().default(false),
      strictness: z.enum(['strict', 'balanced', 'relaxed']).default('balanced'),
      timeout: z.number().default(120), // seconds
      checks: z.array(z.object({
        name: z.string(),
        command: z.string(),
        failOn: z.enum(['errors', 'warnings', 'never']).default('errors'),
        timeout: z.number().optional(),
      })).default([]),
    }).optional(),
  }),

  memory: z.object({
    path: z.string().default('.claude/CLAUDE.md'),
    hierarchical: z.boolean().default(true),
    sections: z.array(z.object({
      title: z.string(),
      managed: z.boolean(),
    })).default([]),
  }),

  skills: z.array(z.string()).default([]),
  subagents: z.array(z.string()).default([]),

  framework: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
    autodetect: z.boolean().default(true),
  }).optional(),

  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    path: z.string().default('.contextualizer/mcp.log'),
  }),

  cache: z.object({
    enabled: z.boolean().default(true),
    path: z.string().default('.contextualizer/cache'),
    ttl: z.number().default(86400), // 24 hours
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

// Default configurations
export const DEFAULT_CONFIG: Config = {
  version: '1.0.0',
  preset: 'minimal',
  contextMonitoring: {
    enabled: true,
    warningThreshold: 80,
    criticalThreshold: 95,
    boundaryDetection: 'balanced',
    rateLimit: 300,
  },
  hooks: {
    preCommit: {
      enabled: false,
      strictness: 'balanced',
      timeout: 120,
      checks: [],
    },
  },
  memory: {
    path: '.claude/CLAUDE.md',
    hierarchical: true,
    sections: [],
  },
  skills: [],
  subagents: [],
  logging: {
    level: 'info',
    path: '.contextualizer/mcp.log',
  },
  cache: {
    enabled: true,
    path: '.contextualizer/cache',
    ttl: 86400,
  },
};
```

### State Schema

```typescript
// src/types/state.ts
export interface SessionState {
  pid: number;
  sessionStart: string;
  tokens: number;
  lastWarning: number; // unix timestamp
  warningCount: number;
  taskBoundaries: number[];
}

// State file: .contextualizer/state-{PID}.json
export const StateSchema = z.object({
  pid: z.number(),
  sessionStart: z.string(),
  tokens: z.number().default(0),
  lastWarning: z.number().default(0),
  warningCount: z.number().default(0),
  taskBoundaries: z.array(z.number()).default([]),
});

export type State = z.infer<typeof StateSchema>;
```

### Diagnostic Report Schema

```typescript
// src/types/diagnostics.ts
export const DiagnosticReportSchema = z.object({
  timestamp: z.string(),
  version: z.string(),

  summary: z.object({
    total: z.number(),
    passed: z.number(),
    warnings: z.number(),
    failures: z.number(),
  }),

  checks: z.array(z.object({
    id: z.string(),
    category: z.enum(['setup', 'hooks', 'memory', 'mcp', 'testing', 'workflow']),
    name: z.string(),
    status: z.enum(['pass', 'warn', 'fail']),
    message: z.string(),
    details: z.unknown().optional(),
    recommendation: z.string().optional(),
    autofixAvailable: z.boolean(),
  })),
});

export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;
```

### Preset Schema

```typescript
// src/types/preset.ts
export const PresetSchema = z.object({
  name: z.string(),
  description: z.string(),
  installationTime: z.string(),

  contextMonitoring: z.object({
    warningThreshold: z.number().min(0).max(100),
    criticalThreshold: z.number().min(0).max(100),
    boundaryDetection: z.enum(['aggressive', 'balanced', 'conservative']),
  }),

  hooks: z.object({
    preCommit: z.object({
      enabled: z.boolean(),
      strictness: z.enum(['strict', 'balanced', 'relaxed']),
      checks: z.array(z.object({
        name: z.string(),
        failOn: z.enum(['errors', 'warnings', 'never']),
        timeout: z.number().optional(),
      })),
    }).optional(),
  }),

  memory: z.object({
    sections: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    context7Libraries: z.array(z.string()).optional(),
  }),

  skills: z.array(z.string()).optional(),
  subagents: z.array(z.string()).optional(),
  codingStandards: z.array(z.string()).optional(),
});

export type Preset = z.infer<typeof PresetSchema>;
```

---

## Integration Layer

### 1. MCP SDK Integration

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

### 2. Git Operations Manager

```typescript
// src/integration/git-manager.ts
import simpleGit, { SimpleGit } from 'simple-git';

export class GitManager {
  private git: SimpleGit;

  constructor(private baseDir: string = process.cwd()) {
    this.git = simpleGit(baseDir);
  }

  async detectRepository(): Promise<{ isRepo: boolean; root?: string }> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) return { isRepo: false };

      const root = await this.git.revparse(['--show-toplevel']);
      return { isRepo: true, root: root.trim() };
    } catch {
      return { isRepo: false };
    }
  }

  async detectMonorepo(): Promise<{
    isMonorepo: boolean;
    type?: 'pnpm' | 'yarn' | 'lerna' | 'nx';
    packages?: string[];
  }> {
    // Check for workspace indicators
    const pnpmWorkspace = await fileExists('pnpm-workspace.yaml');
    const yarnWorkspace = await this.hasYarnWorkspace();
    const lernaConfig = await fileExists('lerna.json');
    const nxConfig = await fileExists('nx.json');

    if (pnpmWorkspace) {
      return { isMonorepo: true, type: 'pnpm', packages: await this.getPnpmPackages() };
    }
    if (yarnWorkspace) {
      return { isMonorepo: true, type: 'yarn', packages: await this.getYarnPackages() };
    }
    if (lernaConfig) {
      return { isMonorepo: true, type: 'lerna', packages: await this.getLernaPackages() };
    }
    if (nxConfig) {
      return { isMonorepo: true, type: 'nx', packages: await this.getNxPackages() };
    }

    return { isMonorepo: false };
  }

  async commit(message: string, files: string[]): Promise<void> {
    await this.git.add(files);
    await this.git.commit(message);
  }

  async createBackupCommit(files: string[], timestamp: string): Promise<void> {
    await this.commit(`Contextualizer backup - ${timestamp}`, files);
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0;
  }
}
```

### 3. File I/O Manager

```typescript
// src/integration/file-manager.ts
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { lock } from 'proper-lockfile';

export class FileManager {
  async atomicWrite(path: string, content: string): Promise<void> {
    const tmpPath = `${path}.tmp.${Date.now()}`;

    try {
      // Ensure directory exists
      await fs.mkdir(dirname(path), { recursive: true });

      // Write to temp file
      await fs.writeFile(tmpPath, content, 'utf-8');

      // Atomic rename
      await fs.rename(tmpPath, path);
    } catch (error) {
      // Cleanup on failure
      try {
        await fs.unlink(tmpPath);
      } catch {}
      throw error;
    }
  }

  async safeRead(path: string): Promise<string | null> {
    try {
      return await fs.readFile(path, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async ensureDirectory(path: string): Promise<void> {
    await fs.mkdir(path, { recursive: true });
  }

  async copyWithBackup(src: string, dest: string): Promise<void> {
    const destExists = await this.exists(dest);

    if (destExists) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${dest}.backup.${timestamp}`;
      await fs.copyFile(dest, backupPath);
    }

    await fs.copyFile(src, dest);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async makeExecutable(path: string): Promise<void> {
    await fs.chmod(path, 0o755);
  }
}
```

### 4. Package.json Parser

```typescript
// src/integration/package-parser.ts
export interface FrameworkDetection {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

export class PackageParser {
  async detect(path: string = 'package.json'): Promise<FrameworkDetection[]> {
    const content = await readFile(path, 'utf-8');
    const pkg = JSON.parse(content);

    const frameworks = new Map<string, FrameworkDetection>();

    // Check dependencies
    this.detectInDeps(pkg.dependencies || {}, 'dependency', frameworks);
    this.detectInDeps(pkg.devDependencies || {}, 'devDependency', frameworks);

    return Array.from(frameworks.values());
  }

  private detectInDeps(
    deps: Record<string, string>,
    type: 'dependency' | 'devDependency',
    frameworks: Map<string, FrameworkDetection>
  ): void {
    const frameworkPatterns = {
      'next': 'Next.js',
      'react': 'React',
      'vue': 'Vue',
      'angular': 'Angular',
      '@angular/core': 'Angular',
      'svelte': 'Svelte',
      'typescript': 'TypeScript',
      'tailwindcss': 'Tailwind CSS',
      'vitest': 'Vitest',
      'jest': 'Jest',
    };

    for (const [dep, version] of Object.entries(deps)) {
      for (const [pattern, name] of Object.entries(frameworkPatterns)) {
        if (dep === pattern || dep.startsWith(`${pattern}/`)) {
          frameworks.set(name, {
            name,
            version: version.replace(/^[\^~]/, ''),
            type,
          });
        }
      }
    }
  }

  async suggestPreset(frameworks: FrameworkDetection[]): Promise<string> {
    const hasNext = frameworks.some(f => f.name === 'Next.js');
    const hasReact = frameworks.some(f => f.name === 'React');
    const hasTypescript = frameworks.some(f => f.name === 'TypeScript');
    const hasTailwind = frameworks.some(f => f.name === 'Tailwind CSS');

    if (hasNext && hasReact && hasTypescript && hasTailwind) {
      return 'web-fullstack';
    }

    if (hasNext || hasReact || hasTypescript) {
      return 'web-fullstack';
    }

    return 'minimal';
  }
}
```

---

## Security & Performance

### Security Model

**Threat Landscape**:
```
┌─────────────────────────────────────────────────────────┐
│                    Threat Model                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Malicious User Input                                 │
│     - Path traversal attacks (../../etc/passwd)          │
│     - Command injection in hook parameters               │
│     - XSS in generated markdown/HTML                     │
│                                                           │
│  2. File System Risks                                    │
│     - Overwriting critical files                         │
│     - Permission escalation                              │
│     - Symlink attacks                                    │
│                                                           │
│  3. Template Injection                                   │
│     - User-controlled template content                   │
│     - Arbitrary code execution via templates             │
│                                                           │
│  4. Dependency Vulnerabilities                           │
│     - Compromised npm packages                           │
│     - Prototype pollution                                │
│                                                           │
│  5. Hook Execution Risks                                 │
│     - Malicious bash scripts                             │
│     - Infinite loops blocking workflow                   │
│     - Resource exhaustion                                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Mitigation Strategies**:

1. **Input Validation**:
```typescript
// src/security/validator.ts
import { z } from 'zod';
import { resolve, normalize } from 'path';

export class SecurityValidator {
  // Path traversal prevention
  validatePath(path: string, baseDir: string = process.cwd()): boolean {
    const normalizedPath = normalize(path);
    const resolvedPath = resolve(baseDir, normalizedPath);

    // Ensure resolved path is within baseDir
    return resolvedPath.startsWith(resolve(baseDir));
  }

  // Filename validation (no directory traversal)
  validateFilename(filename: string): boolean {
    return !filename.includes('..') &&
           !filename.includes('/') &&
           !filename.includes('\\') &&
           filename.length > 0 &&
           filename.length < 255;
  }

  // Hook script validation
  async validateHookScript(content: string): Promise<{
    safe: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check for dangerous commands
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,  // rm -rf /
      /:\(\)\{\s*:\|:&\s*\};:/,  // Fork bomb
      /curl.*\|\s*bash/,  // Download and execute
      /wget.*\|\s*bash/,
      /eval\s+\$/,  // eval with variable
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        issues.push(`Dangerous pattern detected: ${pattern}`);
      }
    }

    // Bash syntax validation
    const syntaxValid = await this.validateBashSyntax(content);
    if (!syntaxValid) {
      issues.push('Invalid bash syntax');
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  // Prevent command injection
  escapeShellArg(arg: string): string {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
}
```

2. **File Operations Safety**:
```typescript
// src/security/file-safety.ts
export class SecureFileOperations {
  constructor(private validator: SecurityValidator) {}

  async writeFile(path: string, content: string): Promise<void> {
    // Validate path
    if (!this.validator.validatePath(path)) {
      throw new SecurityError('Path traversal attempt detected');
    }

    // Ensure not overwriting critical files
    const criticalFiles = [
      '/etc/passwd',
      '/etc/shadow',
      '~/.ssh/authorized_keys',
      '.git/config',
    ];

    if (criticalFiles.some(f => path.includes(f))) {
      throw new SecurityError('Attempt to write to critical file');
    }

    // Atomic write with proper permissions
    await atomicWrite(path, content, { mode: 0o644 });
  }

  async createExecutable(path: string, content: string): Promise<void> {
    // Validate script content before making executable
    const validation = await this.validator.validateHookScript(content);
    if (!validation.safe) {
      throw new SecurityError(`Unsafe script: ${validation.issues.join(', ')}`);
    }

    await this.writeFile(path, content);
    await chmod(path, 0o755);
  }
}
```

3. **Template Safety**:
```typescript
// src/security/template-safety.ts
export class SecureTemplateEngine extends TemplateEngine {
  async render(templateName: string, context: TemplateContext): Promise<string> {
    // Sanitize context to prevent injection
    const sanitized = this.sanitizeContext(context);

    // Render with Handlebars (safe by default)
    return super.render(templateName, sanitized);
  }

  private sanitizeContext(context: TemplateContext): TemplateContext {
    // Deep clone and sanitize
    const sanitized = JSON.parse(JSON.stringify(context));

    // Remove potentially dangerous keys
    delete (sanitized as any).__proto__;
    delete (sanitized as any).constructor;

    return sanitized;
  }
}
```

4. **Hook Execution Limits**:
```bash
# In generated hooks: Timeout and resource limits

# Timeout wrapper
timeout 10s command || {
  echo "Hook timed out after 10 seconds" >&2
  exit 0  # Don't block workflow on timeout
}

# Memory limit (if ulimit available)
ulimit -v 524288  # 512MB virtual memory limit

# File descriptor limit
ulimit -n 256
```

### Performance Optimization

**Performance Targets** (from NFRs):
- Tool invocation: < 2s
- Hook execution: < 100ms
- Doctor diagnostics: < 5s
- Project setup: < 30s

**Optimization Strategies**:

1. **Tool Invocation Optimization**:
```typescript
// src/performance/tool-cache.ts
export class ToolCache {
  private configCache: Map<string, { value: Config; expires: number }> = new Map();

  async getCachedConfig(): Promise<Config | null> {
    const cached = this.configCache.get('config');
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.configCache.delete('config');
      return null;
    }

    return cached.value;
  }

  async setCachedConfig(config: Config, ttl: number = 60000): Promise<void> {
    this.configCache.set('config', {
      value: config,
      expires: Date.now() + ttl,
    });
  }
}
```

2. **Hook Performance** (< 100ms target):
```bash
#!/usr/bin/env bash
# Performance-optimized hook

# Use builtin commands (no external processes)
CHARS=${#PROMPT}  # Builtin string length
TOKENS=$((CHARS / 4))  # Builtin arithmetic

# Lazy load state only if needed
if [ $TOKENS -gt 10000 ]; then
  # Only read state file if context is large
  STATE=$(cat .contextualizer/state-$$.json 2>/dev/null || echo '{}')
fi

# Early exit (most common case: no warning needed)
PERCENT=$((TOKENS * 100 / 200000))
if [ $PERCENT -lt 75 ]; then
  exit 0  # No warning, exit immediately
fi

# Remaining logic only runs for large contexts (rare)
```

**Performance Benchmarks**:
```typescript
// tests/performance/benchmarks.ts
describe('Performance Benchmarks', () => {
  it('init_project completes in < 30s', async () => {
    const start = Date.now();
    await initProject({ preset: 'web-fullstack' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(30000);
  });

  it('run_doctor completes in < 5s', async () => {
    const start = Date.now();
    await runDoctor({ category: 'all' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  it('hook execution < 100ms', async () => {
    const prompt = 'Small test prompt';
    const start = Date.now();
    await executeHook('user-prompt-submit', prompt);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

3. **Caching Strategy**:
```typescript
// src/core/cache-manager.ts
export class CacheManager {
  private cacheDir: string = '.contextualizer/cache';

  async get<T>(key: string): Promise<T | null> {
    const cachePath = join(this.cacheDir, `${key}.json`);
    const content = await readFile(cachePath, 'utf-8').catch(() => null);

    if (!content) return null;

    const cached = JSON.parse(content);
    if (Date.now() > cached.expires) {
      await unlink(cachePath).catch(() => {});
      return null;
    }

    return cached.value as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await ensureDir(this.cacheDir);

    const cached = {
      value,
      expires: Date.now() + ttl,
    };

    const cachePath = join(this.cacheDir, `${key}.json`);
    await writeFile(cachePath, JSON.stringify(cached), 'utf-8');
  }

  async clear(): Promise<void> {
    await rm(this.cacheDir, { recursive: true, force: true });
  }
}

// Cache best practices document (large, rarely changes)
const bestPractices = await cache.get<BestPractices>('best-practices');
if (!bestPractices) {
  const fetched = await fetchBestPractices();
  await cache.set('best-practices', fetched, 86400000); // 24 hours
}
```

---

## Testing Architecture

### Test Pyramid

```
┌──────────────────────────────────────────────────┐
│                   E2E Tests                       │
│              (Integration with Claude)            │
│                  ~10 tests                        │
├──────────────────────────────────────────────────┤
│              Integration Tests                    │
│         (Multi-component workflows)               │
│                 ~50 tests                         │
├──────────────────────────────────────────────────┤
│                 Unit Tests                        │
│            (Individual functions)                 │
│               ~200 tests                          │
└──────────────────────────────────────────────────┘

Target: 80%+ coverage
```

### Unit Test Architecture

```typescript
// tests/unit/template-engine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from '../../src/templates/engine';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine('./src/templates');
  });

  it('renders minimal preset hook correctly', async () => {
    const context = {
      preset: 'minimal',
      strictness: 'balanced',
      contextThresholds: { warning: 80, critical: 95 },
      enabledChecks: [],
      customVars: {},
    };

    const result = await engine.render(
      'minimal/user-prompt-submit.sh.hbs',
      context
    );

    expect(result).toContain('#!/usr/bin/env bash');
    expect(result).toContain('WARNING_THRESHOLD=80');
    expect(result).toContain('CRITICAL_THRESHOLD=95');
  });

  it('handles conditionals in templates', async () => {
    const context = {
      preset: 'web-fullstack',
      strictness: 'strict',
      contextThresholds: { warning: 75, critical: 90 },
      enabledChecks: ['eslint', 'typescript'],
      customVars: {},
    };

    const result = await engine.render(
      'web-fullstack/pre-commit.sh.hbs',
      context
    );

    expect(result).toContain('npm run lint');
    expect(result).toContain('npm run type-check');
  });
});

// tests/unit/conflict-resolver.test.ts
describe('ConflictResolver', () => {
  it('detects Contextualizer-managed files', async () => {
    const content = `
      # CLAUDE.md
      <!-- @contextualizer-managed -->
      # Framework Versions
      ...
      <!-- @contextualizer-end -->
    `;

    const resolver = new ConflictResolver();
    expect(resolver['isContextualizerManaged'](content)).toBe(true);
  });

  it('creates backups before overwriting', async () => {
    const resolver = new ConflictResolver();
    const backupPath = await resolver.createBackup('.claude/CLAUDE.md');

    expect(backupPath).toMatch(/\.contextualizer\/backup-\d+/);
    expect(await fileExists(backupPath)).toBe(true);
  });
});
```

### Integration Test Architecture

```typescript
// tests/integration/init-project.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPServerWrapper } from '../../src/integration/mcp-client';
import { initProject } from '../../src/tools/init-project';
import { rm } from 'fs/promises';

describe('init_project integration', () => {
  let server: MCPServerWrapper;
  let testDir: string;

  beforeEach(async () => {
    testDir = `/tmp/contextualizer-test-${Date.now()}`;
    await mkdir(testDir, { recursive: true });
    process.chdir(testDir);

    server = new MCPServerWrapper();
    await server.start();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('creates complete minimal setup', async () => {
    const result = await initProject({ preset: 'minimal' });

    expect(result.content[0].text).toContain('Setup complete');

    // Verify files created
    expect(await fileExists('.claude/hooks/user-prompt-submit')).toBe(true);
    expect(await fileExists('.claude/CLAUDE.md')).toBe(true);
    expect(await fileExists('.contextualizer/config.yaml')).toBe(true);

    // Verify hook is executable
    const hookStats = await stat('.claude/hooks/user-prompt-submit');
    expect(hookStats.mode & 0o111).not.toBe(0);
  });

  it('handles existing configuration gracefully', async () => {
    // First initialization
    await initProject({ preset: 'minimal' });

    // Second initialization (should detect conflict)
    const result = await initProject({ preset: 'web-fullstack' });

    expect(result.content[0].text).toContain('existing configuration');
  });

  it('detects framework versions from package.json', async () => {
    await writeFile('package.json', JSON.stringify({
      dependencies: {
        'next': '^15.0.0',
        'react': '^19.0.0',
      },
    }), 'utf-8');

    const result = await initProject({ preset: 'web-fullstack' });
    const claudeMd = await readFile('.claude/CLAUDE.md', 'utf-8');

    expect(claudeMd).toContain('Next.js 15');
    expect(claudeMd).toContain('React 19');
  });
});

// tests/integration/doctor.test.ts
describe('run_doctor integration', () => {
  it('runs all checks and produces report', async () => {
    // Setup project
    await initProject({ preset: 'web-fullstack' });

    // Run doctor
    const result = await runDoctor({ category: 'all' });
    const report = JSON.parse(result.content[0].text!);

    expect(report.summary.total).toBeGreaterThan(10);
    expect(report.summary.passed).toBeGreaterThan(0);
    expect(report.checks).toBeInstanceOf(Array);
  });

  it('applies autofixes successfully', async () => {
    await initProject({ preset: 'minimal' });

    // Make hook non-executable
    await chmod('.claude/hooks/user-prompt-submit', 0o644);

    // Run doctor
    const result = await runDoctor({ category: 'hooks', autofix: true });

    // Verify fix applied
    const hookStats = await stat('.claude/hooks/user-prompt-submit');
    expect(hookStats.mode & 0o111).not.toBe(0);
  });
});
```

### E2E Test Architecture

```typescript
// tests/e2e/mcp-protocol.test.ts
import { spawn } from 'child_process';
import { describe, it, expect } from 'vitest';

describe('MCP Protocol E2E', () => {
  it('completes full MCP handshake', async () => {
    const server = spawn('node', ['dist/server.js']);

    // Send initialize request
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '1.0.0',
        capabilities: {},
      },
      id: 1,
    }) + '\n');

    // Wait for response
    const response = await new Promise<any>((resolve) => {
      server.stdout.once('data', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    expect(response.result.protocolVersion).toBe('1.0.0');
    expect(response.result.capabilities).toHaveProperty('tools');

    server.kill();
  });

  it('executes init_project via MCP', async () => {
    const server = spawn('node', ['dist/server.js']);

    // Initialize
    await sendMCPRequest(server, 'initialize', {});

    // Call tool
    const result = await sendMCPRequest(server, 'tools/call', {
      name: 'init_project',
      arguments: { preset: 'minimal' },
    });

    expect(result.content[0].text).toContain('Setup complete');

    server.kill();
  });
});

// Helper function
async function sendMCPRequest(
  server: ChildProcess,
  method: string,
  params: any
): Promise<any> {
  const id = Date.now();

  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method,
    params,
    id,
  }) + '\n');

  return new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      const response = JSON.parse(data.toString());
      if (response.id === id) {
        resolve(response.result);
      }
    });
  });
}
```

### Test Coverage Strategy

```bash
# vitest.config.ts
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
};
```

---

## Extensibility

### Phase 2-5 Extension Points

**1. Memory Management (Phase 2)**:
```typescript
// Extension point: Memory generation
export interface MemoryGenerator {
  analyze(codebase: string[]): Promise<MemorySection[]>;
}

// Future implementation
export class CodebaseMemoryGenerator implements MemoryGenerator {
  async analyze(files: string[]): Promise<MemorySection[]> {
    // Analyze codebase structure
    // Generate architecture documentation
    // Extract patterns and conventions
    // Return as memory sections
  }
}

// Registration in MCP server
server.registerTool({
  name: 'generate_memory',
  handler: async (params) => {
    const generator = new CodebaseMemoryGenerator();
    const sections = await generator.analyze(params.files);
    await memoryManager.bulkUpdate(sections);
  },
});
```

**2. Skill Generation (Phase 2)**:
```typescript
// Extension point: Skill templates
export interface SkillTemplate {
  name: string;
  generate(context: SkillContext): Promise<string>;
}

// Future implementation
export class TechStackSkillTemplate implements SkillTemplate {
  name = 'tech-stack-skill';

  async generate(context: SkillContext): Promise<string> {
    // Generate skill based on detected tech stack
    // Include library-specific patterns
    // Add best practices from documentation
  }
}
```

**3. Observability Tools (Phase 3)**:
```typescript
// Extension point: Observability integrations
export interface ObservabilityProvider {
  name: string;
  setup(): Promise<void>;
  collect(): Promise<ObservabilityData>;
}

// Future: Playwright integration
export class PlaywrightObservability implements ObservabilityProvider {
  name = 'playwright';

  async setup(): Promise<void> {
    // Configure Playwright MCP in claude_desktop_config.json
    // Generate screenshot capture workflows
  }

  async collect(): Promise<ObservabilityData> {
    // Capture screenshots, console logs, network requests
  }
}

// Future: Logging integration
export class StructuredLoggingObservability implements ObservabilityProvider {
  name = 'structured-logging';

  async setup(): Promise<void> {
    // Configure logging library (pino, winston)
    // Set up JSON formatting
  }

  async collect(): Promise<ObservabilityData> {
    // Parse and analyze logs
  }
}
```

**4. Workflow Orchestration (Phase 4)**:
```typescript
// Extension point: Workflow templates
export interface WorkflowTemplate {
  name: string;
  phases: WorkflowPhase[];
  execute(context: WorkflowContext): Promise<WorkflowResult>;
}

// Future: TDD workflow
export class TDDWorkflow implements WorkflowTemplate {
  name = 'tdd';
  phases = ['red', 'green', 'refactor'];

  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    // Phase 1: Write failing test
    // Phase 2: Implement to pass
    // Phase 3: Refactor and optimize
  }
}

// Future: Feature workflow
export class FeatureWorkflow implements WorkflowTemplate {
  name = 'feature-development';
  phases = ['analysis', 'design', 'implementation', 'testing', 'review'];

  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    // Systematic feature development
  }
}
```

### Plugin API Design

```typescript
// src/plugin/api.ts
export interface ContextualizerPlugin {
  name: string;
  version: string;

  // Lifecycle hooks
  onInit?(server: MCPServerWrapper): Promise<void>;
  onShutdown?(): Promise<void>;

  // Extension points
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
  diagnosticChecks?: DiagnosticCheck[];
  presets?: PresetDefinition[];
}

// Example plugin
export class CustomOrganizationPlugin implements ContextualizerPlugin {
  name = 'acme-corp-standards';
  version = '1.0.0';

  tools = [
    {
      name: 'apply_acme_standards',
      description: 'Apply ACME Corp coding standards',
      handler: async (params) => {
        // Custom tool implementation
      },
    },
  ];

  diagnosticChecks = [
    {
      id: 'acme-naming-convention',
      category: 'workflow',
      name: 'ACME Naming Convention',
      execute: async () => {
        // Custom check
      },
    },
  ];

  presets = [
    {
      name: 'acme-fullstack',
      // Custom preset definition
    },
  ];
}

// Plugin registration
export class PluginManager {
  private plugins: Map<string, ContextualizerPlugin> = new Map();

  async register(plugin: ContextualizerPlugin): Promise<void> {
    this.plugins.set(plugin.name, plugin);

    if (plugin.onInit) {
      await plugin.onInit(this.server);
    }
  }

  getPlugin(name: string): ContextualizerPlugin | undefined {
    return this.plugins.get(name);
  }
}
```

### Marketplace Integration (Phase 5)

```typescript
// Future: Plugin marketplace
export interface MarketplaceClient {
  search(query: string): Promise<PluginMetadata[]>;
  install(pluginName: string): Promise<void>;
  update(pluginName: string): Promise<void>;
  uninstall(pluginName: string): Promise<void>;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  verified: boolean;
  tags: string[];
}
```

---

## Appendix: Project Structure

```
@contextualizer/mcp/
├── src/
│   ├── server.ts                     # MCP server entry point
│   │
│   ├── tools/                        # MCP tool implementations
│   │   ├── init-project.ts           # Project initialization
│   │   ├── run-doctor.ts             # Diagnostics
│   │   ├── configure-hooks.ts        # Hook configuration
│   │   ├── manage-memory.ts          # Memory management
│   │   ├── get-config.ts             # Config reader
│   │   └── index.ts                  # Tool registry
│   │
│   ├── resources/                    # MCP resource providers
│   │   ├── config.ts                 # Configuration resource
│   │   ├── diagnostics.ts            # Diagnostics resource
│   │   ├── presets.ts                # Presets resource
│   │   └── index.ts                  # Resource registry
│   │
│   ├── prompts/                      # MCP prompt templates
│   │   ├── setup-wizard.ts           # Setup prompt
│   │   ├── health-check.ts           # Health check prompt
│   │   └── index.ts                  # Prompt registry
│   │
│   ├── templates/                    # File generation templates
│   │   ├── minimal/
│   │   │   ├── user-prompt-submit.sh.hbs
│   │   │   ├── CLAUDE.md.hbs
│   │   │   └── config.yaml.hbs
│   │   ├── web-fullstack/
│   │   │   ├── user-prompt-submit.sh.hbs
│   │   │   ├── pre-commit.sh.hbs
│   │   │   ├── CLAUDE.md.hbs
│   │   │   ├── config.yaml.hbs
│   │   │   ├── code-reviewer.md.hbs
│   │   │   ├── test-architect.md.hbs
│   │   │   ├── nextjs-expert.md.hbs
│   │   │   ├── react-expert.md.hbs
│   │   │   └── typescript-expert.md.hbs
│   │   ├── hackathon/
│   │   │   ├── user-prompt-submit.sh.hbs
│   │   │   ├── pre-commit.sh.hbs
│   │   │   ├── CLAUDE.md.hbs
│   │   │   └── config.yaml.hbs
│   │   └── engine.ts                 # Template engine
│   │
│   ├── presets/                      # Preset definitions
│   │   ├── minimal.json
│   │   ├── web-fullstack.json
│   │   ├── hackathon.json
│   │   ├── registry.ts
│   │   └── types.ts
│   │
│   ├── diagnostics/                  # Diagnostic checks
│   │   ├── checks/
│   │   │   ├── hooks-configured.ts
│   │   │   ├── claude-md-exists.ts
│   │   │   ├── config-valid.ts
│   │   │   ├── mcp-configured.ts
│   │   │   ├── git-initialized.ts
│   │   │   └── ... (15+ total)
│   │   ├── engine.ts
│   │   └── types.ts
│   │
│   ├── core/                         # Core engine components
│   │   ├── conflict-resolver.ts
│   │   ├── hook-generator.ts
│   │   ├── memory-manager.ts
│   │   ├── config-manager.ts
│   │   ├── cache-manager.ts
│   │   └── logger.ts
│   │
│   ├── integration/                  # External integrations
│   │   ├── mcp-client.ts
│   │   ├── git-manager.ts
│   │   ├── file-manager.ts
│   │   ├── package-parser.ts
│   │   └── index.ts
│   │
│   ├── security/                     # Security utilities
│   │   ├── validator.ts
│   │   ├── file-safety.ts
│   │   ├── template-safety.ts
│   │   └── errors.ts
│   │
│   ├── performance/                  # Performance utilities
│   │   ├── tool-cache.ts
│   │   ├── benchmarks.ts
│   │   └── profiler.ts
│   │
│   ├── types/                        # TypeScript definitions
│   │   ├── config.ts
│   │   ├── state.ts
│   │   ├── preset.ts
│   │   ├── diagnostics.ts
│   │   ├── mcp.ts
│   │   └── index.ts
│   │
│   └── utils/                        # Shared utilities
│       ├── logger.ts
│       ├── file-utils.ts
│       ├── string-utils.ts
│       └── validation.ts
│
├── tests/
│   ├── unit/                         # Unit tests (~200)
│   │   ├── template-engine.test.ts
│   │   ├── conflict-resolver.test.ts
│   │   ├── hook-generator.test.ts
│   │   ├── memory-manager.test.ts
│   │   └── ...
│   ├── integration/                  # Integration tests (~50)
│   │   ├── init-project.test.ts
│   │   ├── doctor.test.ts
│   │   ├── configure-hooks.test.ts
│   │   └── ...
│   ├── e2e/                          # E2E tests (~10)
│   │   ├── mcp-protocol.test.ts
│   │   ├── full-workflow.test.ts
│   │   └── ...
│   ├── fixtures/                     # Test data
│   │   ├── sample-project/
│   │   ├── package-jsons/
│   │   └── ...
│   └── helpers/                      # Test utilities
│       ├── mcp-mock.ts
│       ├── file-helpers.ts
│       └── ...
│
├── docs/                             # Documentation
│   ├── api/                          # API documentation
│   ├── guides/                       # User guides
│   └── examples/                     # Example projects
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── LICENSE
```

---

## Decision Log

### Key Architectural Decisions

| Decision | Rationale | Trade-offs | Alternatives Considered |
|----------|-----------|------------|------------------------|
| **TypeScript over JavaScript** | Type safety reduces runtime errors, better tooling, clearer contracts | Slightly more build complexity | JavaScript (faster iteration, simpler) |
| **stdio transport** | Standard for Claude integration, simple, reliable | No network capabilities | HTTP transport (more complex, unnecessary) |
| **Handlebars templates** | Safe by default, widely used, good error messages | Less flexible than template literals | Template literals (unsafe), Mustache (less powerful) |
| **Zod for validation** | Runtime type checking, excellent error messages, generates TS types | Small runtime overhead | Joi (different API), Yup (older), manual validation |
| **Bash hooks over Node.js** | Zero runtime dependencies, fast startup, portable | More complex scripting | Node.js scripts (require runtime), Python (not universal) |
| **fs-extra over native fs** | Atomic operations, better error handling, promisified | Additional dependency | Native fs/promises (less safe), graceful-fs (less features) |
| **simple-git** | Simple API, good TypeScript support | Wrapper overhead (minimal) | nodegit (native bindings, complex), exec git (unsafe) |
| **Vitest over Jest** | Faster, better TypeScript support, modern | Newer ecosystem | Jest (mature, more examples), Mocha (manual setup) |
| **Pino for logging** | Extremely fast, structured logging, low overhead | Less human-readable dev logs | Winston (slower), Bunyan (older), console (unstructured) |

### Security Decisions

| Decision | Rationale |
|----------|-----------|
| **No network from hooks** | Prevents phone-home behavior, reduces attack surface |
| **Path traversal validation** | Prevents writing outside project directory |
| **Bash script validation** | Prevents dangerous commands in generated hooks |
| **Atomic file operations** | Prevents partial writes and corruption |
| **Git-backed backups** | Provides rollback capability for all changes |
| **Sanitize template context** | Prevents prototype pollution and injection |
| **Limit hook execution time** | Prevents infinite loops and resource exhaustion |

### Performance Decisions

| Decision | Rationale |
|----------|-----------|
| **Lazy load templates** | Only compile templates when needed |
| **Cache configuration** | Avoid repeated YAML parsing (60s TTL) |
| **Early exit in hooks** | Skip processing when thresholds not met |
| **Builtin bash operations** | Avoid spawning external processes |
| **Parallel file operations** | Use Promise.all for independent operations |
| **Session-isolated state** | Prevent cross-session interference |

---

## Future Considerations

### Phase 2 Architecture Additions

- **Memory Generation Engine**: Codebase analysis → memory sections
- **Skill Template System**: Tech stack detection → skill generation
- **Subagent Factory**: Role-based configuration generation
- **Marketplace Client**: Plugin discovery and installation

### Phase 3 Architecture Additions

- **Observability Adapters**: Playwright, logging, metrics integration
- **Screenshot Analysis**: Image processing for web app state
- **Log Parser**: Structured log analysis and pattern detection
- **Architecture Mapper**: Code → diagrams and documentation

### Phase 4 Architecture Additions

- **Workflow Engine**: Multi-phase task orchestration
- **Evaluation Framework**: Code quality metrics and scoring
- **Checkpoint System**: Long-horizon task state management
- **Progress Tracker**: Task completion monitoring

### Phase 5 Architecture Additions

- **Marketplace API**: Plugin publishing and distribution
- **Enterprise Features**: Team standards, compliance, audit trails
- **Multi-language Support**: Python, Go, Rust presets
- **Cross-platform**: Windows native support, universal patterns

---

## Glossary

- **MCP**: Model Context Protocol - communication standard between Claude and external tools
- **Tool**: MCP function Claude can invoke with parameters
- **Resource**: MCP data source Claude can read
- **Prompt**: MCP workflow template Claude can execute
- **Preset**: Pre-configured template for project setup
- **Hook**: Script executed in response to events (prompt submit, pre-commit)
- **Memory**: Hierarchical instruction system (CLAUDE.md)
- **Idempotent**: Operation safe to re-run multiple times
- **Atomic Operation**: All-or-nothing file operation with rollback capability
- **Context Boundary**: Point where task changes, suggesting context clear

---

**END OF ARCHITECTURE DOCUMENT**

*This architecture provides a solid foundation for Phase 1 implementation while maintaining extensibility for Phases 2-5. All design decisions prioritize reliability, security, and performance within the constraints outlined in the PRD.*
