# Core Components

**Components**: Template Engine, Preset System, Conflict Resolution, Diagnostics, Hook Generator, Memory Manager
**Phase**: 1 - Foundation

---

## 1. Template Engine

**Purpose**: Generate files from Handlebars templates with variable substitution

**File**: `src/templates/engine.ts`

### Architecture
```typescript
export interface TemplateContext {
  preset: string;
  framework?: { name: string; version: string };
  strictness: 'strict' | 'balanced' | 'relaxed';
  contextThresholds: { warning: number; critical: number };
  enabledChecks: string[];
  customVars: Record<string, unknown>;
}

export class TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private templatesDir: string) {
    this.registerHelpers();
  }

  async render(templateName: string, context: TemplateContext): Promise<string>;
  async renderAll(preset: string, context: TemplateContext): Promise<Map<string, string>>;
}
```

### Template Structure
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
│   ├── nextjs-expert.md.hbs
│   ├── react-expert.md.hbs
│   └── typescript-expert.md.hbs
└── hackathon/
    ├── user-prompt-submit.sh.hbs
    ├── pre-commit.sh.hbs
    ├── CLAUDE.md.hbs
    └── config.yaml.hbs
```

**Epic Reference**: Epic 1, Story 3

---

## 2. Preset System

**Purpose**: Define and manage project presets

**File**: `src/presets/registry.ts`

### Preset Definitions

**Minimal Preset**:
- Context monitoring only
- No pre-commit hooks
- Basic CLAUDE.md template
- Installation time: < 10 seconds

**Web-Fullstack Preset**:
- Next.js 15 + React 19 + TypeScript 5 + Tailwind CSS 3
- Pre-commit hooks: eslint, typescript, vitest
- Skills: nextjs-expert, react-expert, typescript-expert, testing-expert
- Subagents: code-reviewer, test-architect, doc-writer
- Context7 libraries: Next.js, React, Tailwind
- Installation time: < 30 seconds

**Hackathon Preset**:
- Relaxed context thresholds (warning: 85%, critical: 98%)
- Relaxed pre-commit (warnings don't fail)
- Fast iteration optimized
- Installation time: < 15 seconds

### Architecture
```typescript
export interface PresetDefinition {
  name: string;
  description: string;
  installationTime: string;
  contextMonitoring: {
    warningThreshold: number;
    criticalThreshold: number;
    boundaryDetection: 'aggressive' | 'balanced' | 'conservative';
  };
  hooks: { preCommit?: { ... } };
  memory: { sections: Array<{ title: string; content: string }> };
  skills?: string[];
  subagents?: string[];
  codingStandards?: string[];
}

export const PRESETS: Map<string, PresetDefinition> = new Map([
  ['minimal', minimalPreset],
  ['web-fullstack', webFullstackPreset],
  ['hackathon', hackathonPreset],
]);
```

**Epic Reference**: Epic 2

---

## 3. Conflict Resolution System

**Purpose**: Safely merge Contextualizer configuration into existing projects

**File**: `src/core/conflict-resolver.ts`

### Conflict Detection
```typescript
export interface ConflictDetection {
  file: string;
  exists: boolean;
  isContextualizerManaged: boolean; // Has @contextualizer markers
  hasUserModifications: boolean;
  action: 'create' | 'update' | 'merge' | 'skip';
}
```

### Resolution Strategies

1. **Backup-Replace**: Create git backup, replace file
2. **Merge**: Intelligent section-based merging
   - Preserve user sections
   - Update Contextualizer-managed sections
3. **Skip**: Leave existing file unchanged
4. **View-Diff**: Show diff for user review

### Managed Sections
```markdown
<!-- @contextualizer-managed -->
# Framework Versions
This project uses Next.js 15, React 19
<!-- @contextualizer-end -->
```

**Epic Reference**: Epic 3

---

## 4. Diagnostics Engine

**Purpose**: Validate project against best practices

**File**: `src/diagnostics/engine.ts`

### Check Categories
- **setup**: .contextualizer/config.yaml, directory structure
- **hooks**: user-prompt-submit, pre-commit installation
- **memory**: CLAUDE.md exists, section completeness
- **mcp**: claude_desktop_config.json entry
- **testing**: test framework detection, coverage config
- **workflow**: git initialization, package.json scripts

### Check Interface
```typescript
export interface DiagnosticCheck {
  id: string;
  category: CheckCategory;
  name: string;
  description: string;
  execute: () => Promise<CheckResult>;
  autofix?: () => Promise<void>;
}

export interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: unknown;
  recommendation?: string;
  autofixAvailable: boolean;
}
```

### Example Checks
- ✅ `hooks-configured`: Verify context monitoring hook installed
- ✅ `claude-md-exists`: Verify CLAUDE.md present
- ✅ `config-valid`: Validate .contextualizer/config.yaml schema
- ✅ `mcp-configured`: Check claude_desktop_config.json entry
- ✅ `git-initialized`: Verify .git directory exists

**Epic Reference**: Epic 5

---

## 5. Hook Generator

**Purpose**: Generate performant bash hooks with < 100ms latency

**File**: `src/core/hook-generator.ts`

### Performance Optimization
```bash
# 1. Use builtin commands (no external processes)
CHARS=${#PROMPT}  # Builtin string length
TOKENS=$((CHARS / 4))  # Builtin arithmetic

# 2. Early exit (most common case)
PERCENT=$((TOKENS * 100 / 200000))
if [ $PERCENT -lt 75 ]; then
  exit 0  # No warning needed, exit immediately
fi

# 3. Lazy load state only if needed
if [ $TOKENS -gt 10000 ]; then
  STATE=$(cat .contextualizer/state-$$.json 2>/dev/null || echo '{}')
fi

# 4. Rate limiting prevents spam
TIME_SINCE_WARNING=$((CURRENT_TIME - LAST_WARNING))
if [ $TIME_SINCE_WARNING -lt 300 ]; then
  exit 0  # Skip warning if < 5 min since last
fi
```

### Hook Configuration
```typescript
export interface HookConfiguration {
  type: 'user-prompt-submit' | 'pre-commit';
  strictness: 'strict' | 'balanced' | 'relaxed';
  thresholds?: { warning: number; critical: number };
  checks?: Array<{
    name: string;
    command: string;
    failOn: 'errors' | 'warnings' | 'never';
    timeout: number;
  }>;
}
```

**Performance Target**: < 100ms execution (NFR2)

**Epic Reference**: Epic 4

---

## 6. Memory Manager

**Purpose**: Manage CLAUDE.md hierarchical memory system

**File**: `src/core/memory-manager.ts`

### Memory Sections
```typescript
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
```

### Operations
- **read()**: Parse and return all sections
- **update()**: Modify specific section
  - `replace`: Overwrite section content
  - `append`: Add to existing content
  - `merge`: Intelligently merge lists without duplicates
- **write()**: Save updated memory to file

### Managed vs User Sections
- **Managed**: Created by Contextualizer, marked with `@contextualizer-managed`
- **User**: Created manually, preserved during updates

**Epic Reference**: Epic 6

---

## Cross-Component Integration

### Component Dependencies
```
Template Engine
    ↓
Preset System → Hook Generator → Conflict Resolver
    ↓                              ↓
Memory Manager ← ← ← ← ← ← ← ← ← ← ←
    ↓
Diagnostics Engine
```

### Data Flow
1. **init_project** invokes Preset System
2. Preset System loads template via Template Engine
3. Template Engine renders files
4. Conflict Resolver checks for existing files
5. Hook Generator creates executable hooks
6. Memory Manager populates CLAUDE.md
7. Diagnostics Engine validates setup

## Testing Coverage

Each component requires:
- ✅ Unit tests (individual functions)
- ✅ Integration tests (multi-component workflows)
- ✅ Performance benchmarks (meet NFR targets)

## Cross-References

- **PRD**: FR5-FR16 for detailed requirements
- **Epic Files**: `docs/epics/*.md` for implementation stories
- **Data Models**: `data-models.md` for schemas
- **Security**: `security-performance.md` for validation patterns
