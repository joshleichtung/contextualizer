# Security, Performance & Testing

**Components**: Security Model, Performance Optimization, Testing Strategy
**Phase**: 1 - Foundation

---

## Security Model

### Threat Landscape

**Primary Threats**:
1. **Malicious User Input** - Path traversal, command injection, XSS
2. **File System Risks** - Overwriting critical files, permission escalation, symlink attacks
3. **Template Injection** - User-controlled templates, arbitrary code execution
4. **Dependency Vulnerabilities** - Compromised npm packages, prototype pollution
5. **Hook Execution Risks** - Malicious bash scripts, infinite loops, resource exhaustion

### Mitigation Strategies

#### 1. Input Validation

**File**: `src/security/validator.ts`

```typescript
export class SecurityValidator {
  // Path traversal prevention
  validatePath(path: string, baseDir: string = process.cwd()): boolean {
    const normalizedPath = normalize(path);
    const resolvedPath = resolve(baseDir, normalizedPath);
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

    return { safe: issues.length === 0, issues };
  }

  // Prevent command injection
  escapeShellArg(arg: string): string {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
}
```

#### 2. File Operations Safety

**File**: `src/security/file-safety.ts`

```typescript
export class SecureFileOperations {
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

#### 3. Template Safety

```typescript
export class SecureTemplateEngine extends TemplateEngine {
  private sanitizeContext(context: TemplateContext): TemplateContext {
    const sanitized = JSON.parse(JSON.stringify(context));

    // Remove potentially dangerous keys
    delete (sanitized as any).__proto__;
    delete (sanitized as any).constructor;

    return sanitized;
  }
}
```

#### 4. Hook Execution Limits

```bash
# Timeout wrapper in generated hooks
timeout 10s command || {
  echo "Hook timed out after 10 seconds" >&2
  exit 0  # Don't block workflow on timeout
}

# Memory limit (if ulimit available)
ulimit -v 524288  # 512MB virtual memory limit

# File descriptor limit
ulimit -n 256
```

### Security Checklist

- ✅ All file paths validated (no directory traversal)
- ✅ Critical files protected from overwrite
- ✅ Hook scripts validated for dangerous patterns
- ✅ Bash syntax validation before execution
- ✅ Template contexts sanitized (no prototype pollution)
- ✅ Atomic file operations (all-or-nothing)
- ✅ Git-backed backups before destructive operations
- ✅ No network access from hooks
- ✅ Resource limits on hook execution
- ✅ Sensitive data sanitized from error messages

---

## Performance Optimization

### Performance Targets (from NFRs)

- **NFR1**: Tool invocation < 2s
- **NFR2**: Hook execution < 100ms
- **NFR3**: Doctor diagnostics < 5s
- **NFR4**: Project setup < 30s

### Optimization Strategies

#### 1. Tool Invocation Optimization

**Caching Strategy**:
```typescript
// src/performance/tool-cache.ts
export class ToolCache {
  private configCache: Map<string, { value: Config; expires: number }> = new Map();

  async getCachedConfig(): Promise<Config | null> {
    const cached = this.configCache.get('config');
    if (!cached || Date.now() > cached.expires) {
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

**Cache TTLs**:
- Configuration: 60 seconds
- Diagnostics: 5 minutes
- Best practices document: 24 hours
- Presets: Load once at startup (static)

#### 2. Hook Performance (< 100ms target)

**Performance Techniques**:
```bash
#!/usr/bin/env bash
# Performance-optimized hook

# Use builtin commands (no external processes)
CHARS=${#PROMPT}  # Builtin string length
TOKENS=$((CHARS / 4))  # Builtin arithmetic

# Early exit (most common case: no warning needed)
PERCENT=$((TOKENS * 100 / 200000))
if [ $PERCENT -lt 75 ]; then
  exit 0  # No warning, exit immediately (< 10ms)
fi

# Lazy load state only if needed
if [ $TOKENS -gt 10000 ]; then
  STATE=$(cat .contextualizer/state-$$.json 2>/dev/null || echo '{}')
fi

# Rate limiting prevents repeated warnings
TIME_SINCE_WARNING=$((CURRENT_TIME - LAST_WARNING))
if [ $TIME_SINCE_WARNING -lt 300 ]; then
  exit 0  # Skip warning if < 5 min since last
fi
```

**Hook Performance Breakdown**:
- Builtin operations: ~5ms
- Early exit path: ~10ms
- Full execution path: ~80ms
- Margin for system variance: ~20ms

#### 3. Parallel Operations

```typescript
// Run independent operations in parallel
await Promise.all([
  writeFile('.claude/CLAUDE.md', content),
  writeFile('.contextualizer/config.yaml', config),
  chmod('.claude/hooks/user-prompt-submit', 0o755),
  gitManager.createBackupCommit(files, timestamp),
]);
```

#### 4. Lazy Loading

- Templates: Compile only when needed
- Diagnostics: Load checks on-demand
- Best practices: Fetch and cache first access

### Performance Benchmarks

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

### Unit Test Strategy

**Coverage by Component**:
- Template Engine: 15+ tests
- Preset System: 10+ tests
- Conflict Resolver: 20+ tests
- Diagnostics Engine: 30+ tests (2+ per check)
- Hook Generator: 15+ tests
- Memory Manager: 20+ tests
- Integration Layer: 40+ tests
- Security Validators: 25+ tests
- Tools: 50+ tests (10+ per tool)

**Example Unit Test**:
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
});
```

### Integration Test Strategy

**Test Scenarios**:
1. Complete project initialization (minimal preset)
2. Complete project initialization (web-fullstack preset)
3. Existing configuration conflict handling
4. Framework detection from package.json
5. Doctor diagnostics with autofixes
6. Hook configuration updates
7. Memory section updates
8. Git integration (commits, backups)

**Example Integration Test**:
```typescript
// tests/integration/init-project.test.ts
describe('init_project integration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = `/tmp/contextualizer-test-${Date.now()}`;
    await mkdir(testDir, { recursive: true });
    process.chdir(testDir);
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
});
```

### E2E Test Strategy

**Test Scenarios**:
1. MCP protocol handshake
2. Complete project setup workflow
3. Diagnostics → autofix → re-diagnose
4. Configuration updates via MCP
5. Error recovery scenarios

**Example E2E Test**:
```typescript
// tests/e2e/mcp-protocol.test.ts
describe('MCP Protocol E2E', () => {
  it('completes full MCP handshake', async () => {
    const server = spawn('node', ['dist/server.js']);

    // Send initialize request
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: { protocolVersion: '1.0.0', capabilities: {} },
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
});
```

### Test Coverage Configuration

```typescript
// vitest.config.ts
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/**', 'dist/**', '**/*.test.ts', '**/*.config.ts'],
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

### Continuous Integration

**CI/CD Pipeline** (Epic 1, Story 7):
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
```

---

## Cross-References

- **PRD**: NFR1-NFR8 (Performance & Security requirements)
- **Epic 1**: Story 7 (CI/CD Pipeline)
- **Epic 5**: Story 4 (Security Audit & Penetration Testing)
- **Tools**: `tools.md` for tool-specific testing
- **Core Components**: `core-components.md` for component testing

