# Integration Layer & Data Models

**Components**: MCP SDK, Git Operations, File I/O, Package Parser, Data Schemas
**Phase**: 1 - Foundation

---

## Integration Layer

### 1. MCP SDK Integration

**File**: `src/integration/mcp-client.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class MCPServerWrapper {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'contextualizer', version: '1.0.0' },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### 2. Git Operations Manager

**File**: `src/integration/git-manager.ts`

**Capabilities**:
- Repository detection
- Monorepo detection (pnpm, yarn, lerna, nx)
- Backup commits
- Uncommitted changes detection

```typescript
export class GitManager {
  async detectRepository(): Promise<{ isRepo: boolean; root?: string }>;
  async detectMonorepo(): Promise<{
    isMonorepo: boolean;
    type?: 'pnpm' | 'yarn' | 'lerna' | 'nx';
    packages?: string[];
  }>;
  async commit(message: string, files: string[]): Promise<void>;
  async createBackupCommit(files: string[], timestamp: string): Promise<void>;
  async hasUncommittedChanges(): Promise<boolean>;
}
```

### 3. File I/O Manager

**File**: `src/integration/file-manager.ts`

**Safety Features**:
- Atomic writes (temp file → rename)
- Directory creation with recursive option
- Backup before overwrite
- Permission management

```typescript
export class FileManager {
  async atomicWrite(path: string, content: string): Promise<void>;
  async safeRead(path: string): Promise<string | null>;
  async ensureDirectory(path: string): Promise<void>;
  async copyWithBackup(src: string, dest: string): Promise<void>;
  async exists(path: string): Promise<boolean>;
  async makeExecutable(path: string): Promise<void>;
}
```

**Atomic Write Pattern**:
```typescript
async atomicWrite(path: string, content: string): Promise<void> {
  const tmpPath = `${path}.tmp.${Date.now()}`;
  try {
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(tmpPath, content, 'utf-8');
    await fs.rename(tmpPath, path); // Atomic operation
  } catch (error) {
    await fs.unlink(tmpPath).catch(() => {}); // Cleanup
    throw error;
  }
}
```

### 4. Package.json Parser

**File**: `src/integration/package-parser.ts`

**Capabilities**:
- Framework detection (Next.js, React, Vue, Angular, etc.)
- Version extraction
- Preset suggestion based on dependencies

```typescript
export interface FrameworkDetection {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

export class PackageParser {
  async detect(path: string = 'package.json'): Promise<FrameworkDetection[]>;
  async suggestPreset(frameworks: FrameworkDetection[]): Promise<string>;
}
```

**Detection Patterns**:
- `next` → Next.js
- `react` → React
- `vue` → Vue
- `@angular/core` → Angular
- `typescript` → TypeScript
- `tailwindcss` → Tailwind CSS
- `vitest` → Vitest
- `jest` → Jest

**Preset Suggestion Logic**:
- Next.js + React + TypeScript + Tailwind → `web-fullstack`
- Next.js OR React OR TypeScript → `web-fullstack`
- Otherwise → `minimal`

---

## Data Models & Schemas

### 1. Configuration Schema

**File**: `src/types/config.ts`

```typescript
import { z } from 'zod';

export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  preset: z.enum(['minimal', 'web-fullstack', 'hackathon', 'custom']),

  contextMonitoring: z.object({
    enabled: z.boolean().default(true),
    warningThreshold: z.number().min(0).max(100).default(80),
    criticalThreshold: z.number().min(0).max(100).default(95),
    boundaryDetection: z.enum(['aggressive', 'balanced', 'conservative']).default('balanced'),
    rateLimit: z.number().default(300), // seconds
  }),

  hooks: z.object({
    preCommit: z.object({
      enabled: z.boolean().default(false),
      strictness: z.enum(['strict', 'balanced', 'relaxed']).default('balanced'),
      timeout: z.number().default(120),
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
```

### 2. State Schema

**File**: `src/types/state.ts`

```typescript
export interface SessionState {
  pid: number;
  sessionStart: string;
  tokens: number;
  lastWarning: number; // unix timestamp
  warningCount: number;
  taskBoundaries: number[];
}

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

**State File**: `.contextualizer/state-{PID}.json`

### 3. Diagnostic Report Schema

**File**: `src/types/diagnostics.ts`

```typescript
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

### 4. Preset Schema

**File**: `src/types/preset.ts`

```typescript
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

## Technology Decisions

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **MCP SDK** | @modelcontextprotocol/sdk | Official Anthropic SDK |
| **Git** | simple-git | Simple API, TypeScript support |
| **File Ops** | fs-extra | Atomic operations, safety |
| **Validation** | Zod | Runtime validation, type generation |
| **YAML** | js-yaml | Standard parser |

---

## File System Layout

### Generated Project Structure
```
project-root/
├── .claude/
│   ├── hooks/
│   │   ├── user-prompt-submit (executable)
│   │   └── pre-commit (executable, optional)
│   ├── agents/ (web-fullstack only)
│   │   ├── code-reviewer.md
│   │   ├── test-architect.md
│   │   └── doc-writer.md
│   ├── skills/ (web-fullstack only)
│   │   ├── nextjs-expert.md
│   │   ├── react-expert.md
│   │   └── typescript-expert.md
│   └── CLAUDE.md
├── .contextualizer/
│   ├── config.yaml
│   ├── state-{PID}.json
│   ├── mcp.log
│   ├── hook-errors.log
│   ├── cache/
│   │   └── best-practices.json
│   └── backup-{timestamp}/
└── package.json (existing)
```

---

## Validation Patterns

### Path Validation
```typescript
import { resolve, normalize } from 'path';

function validatePath(path: string, baseDir: string = process.cwd()): boolean {
  const normalizedPath = normalize(path);
  const resolvedPath = resolve(baseDir, normalizedPath);
  return resolvedPath.startsWith(resolve(baseDir));
}
```

### Schema Validation
```typescript
import { ConfigSchema } from './types/config';

function validateConfig(data: unknown): Config {
  return ConfigSchema.parse(data); // Throws if invalid
}
```

---

## Cross-References

- **PRD**: NFR6 (Atomic Operations), NFR7 (Git Integration)
- **Security**: `security-performance.md` for validation patterns
- **Tools**: `tools.md` for tool implementations using these components
- **Epic 1**: Story 2 (Git Integration), Story 6 (Package.json Detection)

