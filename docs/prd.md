# Contextualizer Product Requirements Document (PRD)

**Version**: 1.0.0
**Date**: 2025-10-19
**Status**: Draft
**Authors**: PM Agent (John), Claude Code

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Goals and Background Context](#goals-and-background-context)
3. [Strategic Positioning](#strategic-positioning)
4. [Requirements](#requirements)
5. [Technical Architecture](#technical-architecture)
6. [Progressive Evolution Roadmap](#progressive-evolution-roadmap)
7. [AI-First Design Principles](#ai-first-design-principles)
8. [Epic Breakdown](#epic-breakdown)
9. [Success Metrics](#success-metrics)
10. [Resource Requirements](#resource-requirements)
11. [References & Research](#references--research)

---

## Executive Summary

**Contextualizer** is an MCP server and plugin ecosystem that transforms Claude Code projects into AI-first development environments through conversational configuration, real-time diagnostics, and intelligent workflow orchestration.

**Core Innovation**: Unlike traditional "run once" setup tools, Contextualizer operates as an **active development partner** through Model Context Protocol (MCP) integration—Claude can invoke Contextualizer tools during any conversation to configure, diagnose, optimize, and manage project infrastructure.

**Vision**: *If an agent needs to rearchitecture an entire system, it should have the observability, memory, skills, and workflows to handle it autonomously with only top-level guidance.*

**Phased Approach**:
- **Phase 1** (8-12 weeks): MCP Server Foundation - Setup, diagnostics, quality gates
- **Phase 2** (4-8 weeks): Intelligence Layer - Memory, skills, subagent orchestration
- **Phase 3** (6-10 weeks): Observability - Web/server/mobile introspection systems
- **Phase 4** (8-12 weeks): Workflow Orchestration - Systematic AI-assisted development
- **Phase 5** (Ongoing): Ecosystem & Distribution - Marketplace, enterprise, cross-platform

---

## Goals and Background Context

### Goals

**Immediate (Phase 1)**:
- **Accelerate ecosystem maturation** by providing reference implementations of Anthropic's best practices as conversational MCP tools
- **Reduce cognitive load** so developers focus on problems, not infrastructure configuration
- **Enable real-time project management** through always-available MCP tools (< 2 min setup, ongoing diagnostics)
- **Establish portable standards** via MCP server that works consistently across projects and teams
- **Provide intelligent, conversational configuration** through Claude's natural language interface to Contextualizer tools

**Long-term (Phases 2-5)**:
- **Create ultra-observable systems** where AI agents can introspect running applications (logs, screenshots, performance)
- **Build comprehensive skill libraries** for domain-specific and tech stack expertise
- **Enable systematic workflows** for complex operations (rearchitecture, major features, technical debt)
- **Establish ecosystem infrastructure** through marketplace distribution and community contributions

### Background Context

Developers using Claude Code for AI-assisted development face a deeper challenge than mere setup time: they're working in an **emerging ecosystem where best practices haven't converged**. Each project requires manual configuration (hooks, MCP servers, CLAUDE.md, quality gates), but more critically, this setup forces premature infrastructure decisions that disrupt creative problem-solving flow.

**The root causes are systemic**:
- **Immature tooling ecosystem** - Claude Code launched in 2024; infrastructure layer is still forming
- **Token economics constraints** - Models can't preemptively load all context, requiring explicit version documentation
- **Rapid AI evolution** - Model improvements every few months outpace workflow standardization
- **Cognitive switching costs** - Setup busywork forces developers out of feature-focused flow state
- **Lack of observability** - AI agents can't "see" running systems, only static code

**The MCP Opportunity**: Model Context Protocol (announced 2024) enables persistent, tool-based interaction between Claude and external systems. Unlike one-time CLI tools, MCP servers remain active throughout development, allowing Claude to invoke capabilities conversationally ("make hooks stricter", "run diagnostics", "generate a skill for this API").

Contextualizer exploits this architecture to provide **infrastructure as conversation** rather than infrastructure as installation.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-19 | 1.0.0 | Initial MCP-first PRD with progressive roadmap | PM Agent (John) |
| 2025-10-19 | 1.0.1 | Added CI/CD story (Epic 1.7), clarified subagent scope (Epic 2.3), added user documentation story (Epic 6.5) per PO validation recommendations | PM Agent (John) |

---

## Strategic Positioning

### Problem Space Analysis

**Traditional Approach (Manual Setup)**:
- 15-30 minutes per project
- Inconsistent across projects
- One-time configuration (stale over time)
- No ongoing guidance or diagnostics

**Existing Solutions**:
- **GitHub Templates**: Static, no updates, greenfield only
- **VS Code Extensions**: IDE-locked, limited capabilities
- **Superpowers**: TDD-focused skills, no MCP integration
- **SuperClaude**: Comprehensive but not MCP-based
- **BMAD Method**: Workflow-oriented, no real-time tools
- **AgentOS**: Spec-driven but manual configuration

**Contextualizer Differentiation**:

| Feature | Traditional | Existing Tools | Contextualizer |
|---------|-------------|----------------|----------------|
| **Interactive Configuration** | ❌ | ⚠️ Limited | ✅ Conversational via MCP |
| **Real-time Diagnostics** | ❌ | ❌ | ✅ Always available |
| **Ongoing Management** | ❌ One-time | ⚠️ Manual updates | ✅ Tool-based updates |
| **Observability** | ❌ | ❌ | ✅ (Phase 3) |
| **Workflow Orchestration** | ❌ | ⚠️ Limited | ✅ (Phase 4) |
| **Existing Projects** | ⚠️ Manual | ⚠️ Risky | ✅ Smart merging |

### Unique Value Propositions

1. **First MCP-native development framework** - Not just setup, but active partner
2. **Conversational infrastructure** - "Make it stricter" > editing config files
3. **Progressive enhancement** - Start simple, grow with project needs
4. **AI-first by design** - Built for agent comprehension from day one
5. **Ecosystem infrastructure** - Not just a tool, but a platform

### Target Market

**Primary (Phase 1)**:
- Individual developers using Claude Code for JavaScript/TypeScript web projects
- Early adopters of AI-assisted development
- Developers frustrated with repetitive project setup

**Secondary (Phase 2-3)**:
- Development teams standardizing on Claude Code
- Organizations building AI-first codebases
- Open source projects optimizing for AI contributors

**Tertiary (Phase 4-5)**:
- Enterprise teams requiring compliance and observability
- Multi-language, multi-platform development teams
- Marketplace contributors and skill developers

---

## Requirements

### Functional Requirements - Phase 1: Foundation (MVP)

#### Core MCP Server (Priority 1)

**FR1**: MCP Server with stdio transport
- Implements Model Context Protocol specification
- Provides tools, resources, and prompts to Claude
- Handles concurrent requests safely
- Logs operations to `.contextualizer/mcp.log`
- Graceful error handling with user-friendly messages

**FR2**: `init_project` tool - Interactive project initialization
- Parameters: `preset` (minimal | web-fullstack | hackathon | custom), `options` (object)
- Detects existing configuration and prompts for conflict resolution
- Generates: `.claude/hooks/`, `CLAUDE.md`, `.contextualizer/config.yaml`
- Backs up existing files to `.contextualizer/backup-{timestamp}/`
- Returns: Success/failure status, list of files created/modified, conflicts resolved

**FR3**: `run_doctor` tool - Comprehensive diagnostics
- Parameters: `category` (all | hooks | memory | skills | observability)
- Validates against Anthropic best practices checklist (15+ checks)
- Checks: Hook configuration, CLAUDE.md structure, MCP server availability, file permissions
- Returns: Report with pass/warn/fail status, actionable recommendations, fix suggestions
- Caches best practices document for offline operation (`.contextualizer/cache/`)

**FR4**: `configure_hooks` tool - Quality gate management
- Parameters: `hookType` (pre-commit | user-prompt-submit | all), `strictness` (strict | balanced | relaxed), `enabled` (boolean)
- Updates hook configurations dynamically
- Validates hook syntax before applying changes
- Returns: Updated configuration, validation results

**FR5**: `manage_memory` tool - CLAUDE.md management
- Parameters: `section` (string), `content` (string), `mode` (append | replace | merge)
- Intelligently merges content with existing CLAUDE.md
- Preserves user customizations outside Contextualizer markers
- Supports hierarchical memory (project + user)
- Returns: Updated memory structure, merge conflicts (if any)

#### Preset System (Priority 1)

**FR6**: Three core presets with distinct characteristics

**Minimal Preset**:
- Basic context monitoring hook (80%/95% thresholds)
- Generic CLAUDE.md with no framework specifics
- No pre-commit hooks (user configures manually)
- Installation: < 10 seconds

**Web-Fullstack Preset**:
- Context monitoring (75%/90% thresholds)
- CLAUDE.md with Next.js 15, React 19, TypeScript 5, Tailwind 3 patterns
- Context7 MCP setup instructions with library IDs
- Pre-commit hooks: ESLint (error-blocking), TypeScript check, Vitest tests
- Subagents: code-reviewer, test-architect, doc-writer
- Skills: nextjs-expert, react-expert, typescript-expert
- Installation: < 30 seconds

**Hackathon Preset**:
- Aggressive context monitoring (90%/95% thresholds, auto-suggest clear)
- CLAUDE.md emphasizing speed over perfection
- Pre-commit hooks: ESLint warnings only (non-blocking)
- No test execution in hooks
- "Fail fast" patterns and rapid iteration guidance
- Installation: < 15 seconds

**FR7**: Template engine for file generation
- Supports variable substitution, conditionals, loops
- Templates in standardized format (Handlebars or similar)
- Framework version detection from `package.json`
- Idempotent operations (safe to re-run)

#### Conflict Management (Priority 1)

**FR8**: Smart conflict detection and resolution
- Detects Contextualizer-generated files via comment markers
- Distinguishes custom user files from managed files
- Shows diff preview for conflicts
- Options: Backup and replace, Merge, Skip, View diff
- Git-tracked backups (commits before/after changes)

**FR9**: Monorepo and nested project support
- Detects git repository root
- Identifies workspace structures (pnpm, yarn, lerna, nx)
- Prompts for installation location (git root vs. current directory)
- Handles nested .claude/ directories correctly

#### Context Management Hooks (Priority 2)

**FR10**: User prompt submit hook - Context monitoring
- Heuristic token estimation (characters ÷ 4)
- Configurable thresholds per preset
- Rate-limited warnings (max 1 per 5 minutes per severity)
- Trend analysis (increasing/stable/decreasing context)
- Session-isolated state tracking (`.contextualizer/state-{PID}.json`)
- Performance: < 100ms latency (NFR2)

**FR11**: Task boundary detection
- Keyword analysis for new task signals
- Suggests context clearing at appropriate times
- Configurable sensitivity (aggressive | balanced | conservative)
- Respects rate limiting

**FR12**: Pre-commit hook generation
- Executes: lint → compile → test (fast-fail, in order)
- Preset-specific strictness
- Shows progress and clear error messages
- Configurable timeout (default 2 minutes)
- Skippable via `git commit --no-verify`

#### Diagnostics & Best Practices (Priority 2)

**FR13**: Best practices checklist engine
- Minimum 15 checks across categories: setup, hooks, workflow, MCP, testing
- Each check returns: status (pass | warn | fail), message, recommendation
- Checks execute in < 5 seconds (NFR3)
- Extensible architecture for custom checks

**FR14**: Automated fix application
- Auto-fixable issues applied via `run_doctor` tool with fix parameter
- Shows preview before applying
- Git commits before/after fixes
- Not all checks auto-fixable (some require human judgment)

#### Configuration System (Priority 3)

**FR15**: Hierarchical configuration
- `.contextualizer/config.yaml` - Main project configuration
- `.contextualizer/overrides/` - User customizations with precedence
- Validation before applying changes
- Schema-based validation to prevent invalid configs

**FR16**: `get_config` and `set_config` tools
- Read and update configuration values conversationally
- Validates against schema
- Returns current effective config (with overrides applied)

### Non-Functional Requirements - Phase 1

#### Performance

**NFR1**: MCP tool invocation completes in < 2 seconds for typical operations
**NFR2**: Context monitoring hook adds < 100ms latency to prompt submission
**NFR3**: Doctor diagnostics complete in < 5 seconds for typical projects
**NFR4**: Initial project setup completes in < 30 seconds for any preset

#### Reliability

**NFR5**: Idempotent operations (safe to re-run tools multiple times)
**NFR6**: Atomic file operations with rollback on failure
**NFR7**: Git-tracked changes for manual rollback capability
**NFR8**: Graceful degradation when dependencies unavailable (offline mode, missing tools)
**NFR9**: MCP server auto-recovery on crash (restart mechanism)

#### Usability

**NFR10**: Conversational interface - Claude invokes tools based on natural language
**NFR11**: All generated files include comments explaining purpose and customization
**NFR12**: Clear error messages with suggested fixes
**NFR13**: Status updates during long-running operations

#### Portability

**NFR14**: Bash 4.0+ required for hooks (documented, checked during init)
**NFR15**: macOS and Linux primary support (Windows WSL documented for Phase 2)
**NFR16**: Uses `#!/usr/bin/env bash` for shell portability
**NFR17**: Force LF line endings via .gitattributes (prevent Windows CRLF issues)

#### Maintainability

**NFR18**: Zero external runtime dependencies for generated artifacts (hooks are pure bash)
**NFR19**: Node.js 18+ required only for MCP server, not for hooks or configs
**NFR20**: Plugin API for custom tools/resources (extensible architecture)
**NFR21**: Comprehensive logging to `.contextualizer/mcp.log` and `.contextualizer/hook-errors.log`

#### Security

**NFR22**: No automatic network requests from hooks (all network operations user-initiated via MCP tools)
**NFR23**: Validation of user inputs before file operations
**NFR24**: Backup before destructive operations
**NFR25**: File permission checks before writes

### Functional Requirements - Phase 2: Intelligence Layer

#### Memory Management (4-8 weeks after Phase 1)

**FR17**: `generate_memory` tool - Auto-generate CLAUDE.md content
- Analyzes codebase structure and dependencies
- Generates memory sections: architecture, patterns, conventions
- Supports hierarchical memory (project + user)
- Memory import system for modular organization

**FR18**: Domain-specific memory templates
- Templates for common domains: e-commerce, SaaS, fintech, etc.
- Tech stack-specific patterns
- Organizational best practices

#### Skill Generation & Management

**FR19**: `generate_skill` tool - Create custom skills
- Parameters: `domain` (string), `libraries` (array), `expertise_level` (string)
- Auto-generates SKILL.md with proper frontmatter
- Three-level loading: metadata, instructions, resources
- Validates skill structure before creation

**FR20**: Pre-built skill library
- nextjs-expert, react-expert, typescript-expert (web-fullstack preset)
- testing-architect, debugging-specialist, performance-optimizer
- domain-specific: auth-patterns, api-design, database-modeling

**FR21**: Skill marketplace integration
- Discover and install community skills
- Version management and updates
- Security validation for third-party skills

#### Subagent Orchestration

**FR22**: `create_subagent` tool - Generate subagent configurations
- Parameters: `role` (string), `tools` (array), `systemPrompt` (string)
- Creates `.claude/agents/{role}.md` with proper configuration
- Tool restriction patterns
- Model selection options

**FR23**: Pre-configured subagents (web-fullstack preset)
- **code-reviewer**: Quality assurance, best practices enforcement
- **test-architect**: Test strategy, coverage analysis
- **doc-writer**: Documentation generation and maintenance
- **debugger**: Issue investigation and root cause analysis

**FR24**: `delegate_work` tool - Smart delegation
- Analyzes task complexity and suggests appropriate subagent
- Parameters: `task_description`, `preferred_agent` (optional)
- Parallel execution coordination
- Result aggregation and conflict resolution

#### Plugin Distribution

**FR25**: Claude Code plugin wrapper
- Slash commands invoking MCP prompts
- Bundled skills and agents
- Marketplace listing and discovery
- Installation: `/plugin install contextualizer`

### Functional Requirements - Phase 3: Observability (6-10 weeks after Phase 2)

#### Web Application Observability

**FR26**: `analyze_web_observability` tool
- Assesses current observability setup
- Recommendations for improvements
- Playwright MCP auto-configuration

**FR27**: Playwright MCP integration
- Auto-configure Playwright MCP server in claude_desktop_config.json
- Screenshot capture workflows
- Browser console log monitoring
- Visual regression testing setup

**FR28**: Frontend instrumentation
- Error boundary patterns
- Console logging strategies optimized for AI review
- Performance monitoring setup

#### Server/Service Observability

**FR29**: `configure_logging` tool
- Structured logging for AI consumption (JSON format)
- Log aggregation patterns
- Retention and rotation strategies

**FR30**: Log analysis tools
- Real-time log tailing for agents
- Error pattern detection
- Performance bottleneck identification

**FR31**: Service health monitoring
- Health check endpoint generation
- Metrics collection setup
- Status dashboard configuration

#### Mobile Observability (Future)

**FR32**: Mobile app instrumentation strategies (documented for Phase 3)
**FR33**: App usage → code mapping (future research)
**FR34**: Mobile testing frameworks integration (future)

#### Codebase Understanding

**FR35**: Gitingest integration
- Codebase-to-AI-digest conversion
- Architecture diagram generation from code
- Dependency mapping and visualization

**FR36**: `analyze_architecture` tool
- Generates system architecture documentation
- Identifies technical debt hotspots
- Suggests refactoring opportunities

### Functional Requirements - Phase 4: Workflow Orchestration (8-12 weeks after Phase 3)

#### Systematic Workflows

**FR37**: `start_workflow` tool - Initiate structured workflows
- Workflows: feature-development, bug-investigation, refactoring, testing
- Phase-based execution (Analysis → Planning → Implementation → Verification)
- Scale-adaptive complexity (simple features vs. major rearchitecture)

**FR38**: Workflow templates
- TDD workflow (inspired by Superpowers)
- Spec-driven development (inspired by AgentOS)
- BMAD-style phased approach
- Custom workflow creation

**FR39**: Progress tracking and checkpointing
- Automatic checkpoints at workflow phases
- Recovery from interruptions
- Long-horizon task management

#### Custom Agent Builder

**FR40**: Visual agent configuration (web UI or conversational)
- Agent skill composition
- Tool access configuration
- System prompt templating

**FR41**: Team agent libraries
- Share agent configurations across team
- Version control for agent definitions
- Agent marketplace for community contributions

#### Evaluation Framework

**FR42**: `run_evaluation` tool - Quality metrics for AI-generated code
- Test coverage analysis
- Code quality metrics (complexity, maintainability)
- Performance benchmarking
- Security scanning

**FR43**: Automated eval suite
- Regression detection for AI outputs
- A/B testing for workflow variations
- Continuous improvement feedback loops

### Out of Scope for Phase 1

- **Windows native support** (WSL only, native in Phase 2)
- **GUI configuration interface** (conversational only for Phase 1)
- **IDE-specific extensions** (Claude Code only for Phase 1)
- **Community preset marketplace** (Phase 2 feature)
- **Exact token counting** (heuristic estimation only for Phase 1)
- **Real-time collaboration features** (individual developer focus)
- **Automatic best practices updates** (manual via doctor tool)
- **Multi-language support beyond JS/TS** (Python, Go, Rust in Phase 2+)
- **Mobile observability** (Phase 3 research)
- **Beads integration** (when stable, Phase 4)

### Known Limitations - Phase 1

- **Context estimation is approximate** - Uses heuristics, not exact API token counts
- **Framework versions need periodic updates** - Presets pin tested versions, may lag latest releases
- **Hooks are bash-only** - No PowerShell or Fish shell support
- **MCP server requires manual configuration** - Must add to claude_desktop_config.json
- **Best practices cache can be stale** - Requires manual update via doctor tool
- **Monorepo support is basic** - Works but may need manual path adjustments for complex setups

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude Code                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Claude (AI Model)                          │ │
│  │                                                              │ │
│  │  "Set up this project for AI development"                   │ │
│  │  "Run diagnostics"                                           │ │
│  │  "Make pre-commit hooks less strict"                        │ │
│  └──────────────────────┬───────────────────────────────────────┘ │
│                         │ MCP Protocol                            │
│                         ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Contextualizer MCP Server                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │    Tools     │  │  Resources   │  │    Prompts      │  │ │
│  │  │              │  │              │  │                 │  │ │
│  │  │ init_project │  │ config       │  │ setup_wizard    │  │ │
│  │  │ run_doctor   │  │ diagnostics  │  │ health_check    │  │ │
│  │  │ configure_   │  │ presets      │  │ optimize_for_ai │  │ │
│  │  │   hooks      │  │ best-        │  │                 │  │ │
│  │  │ manage_      │  │   practices  │  │                 │  │ │
│  │  │   memory     │  │              │  │                 │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │                                                              │ │
│  │  Template Engine │ Preset System │ Conflict Resolution     │ │
│  │  Diagnostics Engine │ Hook Generator │ Memory Manager       │ │
│  └──────────────────────┬───────────────────────────────────────┘ │
│                         │                                         │
│                         ▼ File Operations                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Project Files                             │ │
│  │  .claude/                  .contextualizer/                 │ │
│  │  ├─ hooks/                 ├─ config.yaml                   │ │
│  │  │  ├─ user-prompt-submit  ├─ state-{PID}.json            │ │
│  │  │  └─ pre-commit          ├─ cache/best-practices.json    │ │
│  │  ├─ agents/                ├─ backup-{timestamp}/           │ │
│  │  │  ├─ code-reviewer.md    └─ mcp.log                      │ │
│  │  │  └─ test-architect.md                                   │ │
│  │  ├─ skills/                                                 │ │
│  │  │  ├─ nextjs-expert.md                                    │ │
│  │  │  └─ react-expert.md                                     │ │
│  │  └─ CLAUDE.md                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### MCP Server Architecture

**Technology Stack**:
- **Language**: TypeScript 5.x (compiled to Node.js 18+ compatible JS)
- **MCP SDK**: `@modelcontextprotocol/sdk` (official Anthropic SDK)
- **Transport**: stdio (standard input/output for Claude integration)
- **Build Tool**: tsup (fast TypeScript bundling)
- **Testing**: Vitest (unit + integration tests)
- **File Operations**: fs-extra (atomic writes, safe operations)
- **Git Operations**: simple-git (repository detection, commits)
- **Template Engine**: Handlebars or template literals
- **YAML Parsing**: js-yaml (config file handling)

**Server Structure**:
```
@contextualizer/mcp/
├── src/
│   ├── server.ts              # MCP server initialization
│   ├── tools/
│   │   ├── init-project.ts    # Project initialization tool
│   │   ├── run-doctor.ts      # Diagnostics tool
│   │   ├── configure-hooks.ts # Hook configuration tool
│   │   ├── manage-memory.ts   # Memory management tool
│   │   └── index.ts           # Tool registry
│   ├── resources/
│   │   ├── config.ts          # Configuration resource
│   │   ├── diagnostics.ts     # Diagnostics resource
│   │   └── index.ts           # Resource registry
│   ├── prompts/
│   │   ├── setup-wizard.ts    # Setup prompt
│   │   └── index.ts           # Prompt registry
│   ├── templates/             # File generation templates
│   │   ├── minimal/
│   │   ├── web-fullstack/
│   │   └── hackathon/
│   ├── presets/               # Preset configurations
│   ├── diagnostics/           # Doctor check implementations
│   ├── utils/                 # Shared utilities
│   └── types/                 # TypeScript definitions
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
└── README.md
```

### Hook Architecture

**Generated Hooks** (Pure bash, no runtime dependencies):

```bash
#!/usr/bin/env bash
# .claude/hooks/user-prompt-submit.sh
# Generated by Contextualizer v1.0.0
# Purpose: Context monitoring and task boundary detection

# Read configuration
CONFIG_FILE=".contextualizer/config.yaml"
STATE_FILE=".contextualizer/state-$$.json"

# Read stdin (prompt from Claude)
PROMPT=$(cat)

# Estimate tokens (character count ÷ 4)
CHARS=$(echo "$PROMPT" | wc -c)
ESTIMATED_TOKENS=$((CHARS / 4))

# Load state, calculate threshold
# ... (bash logic for monitoring)

# Output warnings if needed
if [ $PERCENT -ge 90 ]; then
  echo "🚨 Context usage at ${PERCENT}%. Clear soon to avoid overflow."
fi

# Always exit 0 (never block prompt)
exit 0
```

### Plugin Architecture

**Plugin Structure**:
```
contextualizer-plugin/
├── .claude-plugin/
│   └── plugin.json           # Metadata
├── commands/
│   ├── setup.md              # /contextualizer setup
│   ├── doctor.md             # /contextualizer doctor
│   └── config.md             # /contextualizer config
├── skills/                   # Bundled skills
│   ├── nextjs-expert.md
│   ├── react-expert.md
│   └── typescript-expert.md
├── agents/                   # Bundled subagents
│   ├── code-reviewer.md
│   ├── test-architect.md
│   └── doc-writer.md
└── README.md
```

**plugin.json**:
```json
{
  "name": "contextualizer",
  "version": "1.0.0",
  "description": "AI-first development framework for Claude Code",
  "author": "Contextualizer Team",
  "commands": {
    "setup": {
      "description": "Interactive project setup wizard",
      "file": "commands/setup.md"
    },
    "doctor": {
      "description": "Run project diagnostics",
      "file": "commands/doctor.md"
    },
    "config": {
      "description": "Manage configuration",
      "file": "commands/config.md"
    }
  },
  "skills": ["skills/nextjs-expert.md", "skills/react-expert.md"],
  "agents": ["agents/code-reviewer.md", "agents/test-architect.md"],
  "mcp_servers": {
    "contextualizer": {
      "command": "npx",
      "args": ["@contextualizer/mcp"]
    }
  }
}
```

### Data Flow

**Setup Flow**:
```
User: "Set up this Next.js project for AI development"
  │
  ├─> Claude interprets intent
  │
  ├─> Claude sees available MCP tools from Contextualizer
  │
  ├─> Claude invokes: init_project(preset="web-fullstack")
  │     │
  │     ├─> MCP server analyzes project
  │     ├─> Detects package.json (Next.js 15 installed)
  │     ├─> Generates files from templates
  │     ├─> Creates hooks, CLAUDE.md, skills, agents
  │     └─> Returns: success, file list
  │
  └─> Claude responds: "✅ Setup complete! Configured hooks, skills, subagents..."
```

**Diagnostics Flow**:
```
User: "Check if my setup follows best practices"
  │
  ├─> Claude invokes: run_doctor(category="all")
  │     │
  │     ├─> MCP server runs 15+ checks
  │     ├─> Validates hooks, memory, MCP config
  │     ├─> Compares against cached best practices
  │     └─> Returns: report with pass/warn/fail
  │
  └─> Claude responds: "10/15 checks passed. Issues: ..."
```

**Configuration Update Flow**:
```
User: "Make the pre-commit checks less strict, we're prototyping"
  │
  ├─> Claude invokes: configure_hooks(strictness="relaxed")
  │     │
  │     ├─> MCP server updates .contextualizer/config.yaml
  │     ├─> Regenerates hooks with new settings
  │     ├─> Validates configuration
  │     └─> Returns: success, updated config
  │
  └─> Claude responds: "✅ Updated to relaxed mode: warnings only, no blocking"
```

### Preset System

**Preset Configuration Schema**:
```yaml
# web-fullstack preset
name: "Web Fullstack"
description: "Next.js + React + TypeScript + Tailwind full-stack development"
installation_time: "< 30 seconds"

context_monitoring:
  warning_threshold: 75
  critical_threshold: 90
  boundary_detection: balanced

hooks:
  pre_commit:
    enabled: true
    strictness: strict
    checks:
      - eslint: { fail_on: errors }
      - typescript: { fail_on: errors }
      - vitest: { fail_on: failures, timeout: 120 }

memory:
  sections:
    - frameworks: ["Next.js 15", "React 19", "TypeScript 5"]
    - patterns: ["App Router", "React Server Components", "Server Actions"]
    - mcp_servers: ["context7"]

  context7_libraries:
    - "/vercel/next.js/v15.0.0"
    - "/facebook/react/v19.0.0"
    - "/tailwindlabs/tailwindcss/v3.4.0"

skills:
  - nextjs-expert
  - react-expert
  - typescript-expert
  - testing-expert

subagents:
  - code-reviewer
  - test-architect
  - doc-writer

coding_standards:
  - "Use App Router for routing"
  - "Prefer Server Components by default"
  - "Use 'use client' directive only when needed"
  - "TypeScript strict mode enabled"
  - "Prettier for formatting"
```

### Security Model

**Threat Model**:
- MCP server has file system access (by design)
- Hooks execute arbitrary bash scripts (by design)
- User inputs from Claude (trusted, but validate)
- Template content from packages (validate at install)

**Mitigations**:
- Input validation on all MCP tool parameters
- Path traversal prevention (validate file paths)
- Atomic file operations (prevent partial writes)
- Backups before destructive operations
- Git commits for rollback capability
- No network requests from hooks (NFR22)
- Clear permission model for generated files

---

## Progressive Evolution Roadmap

### Phase 1: Foundation (8-12 weeks) - **MVP**

**Goal**: MCP server providing conversational project setup and diagnostics

**Deliverables**:
- MCP server with 5 core tools (init, doctor, configure_hooks, manage_memory, get_config)
- 3 presets (minimal, web-fullstack, hackathon)
- Context monitoring hooks
- Best practices doctor with 15+ checks
- Conflict management for existing projects
- Plugin wrapper with slash commands

**Success Criteria**:
- Project setup in < 30 seconds via conversation
- Diagnostics identify 90%+ of common issues
- Hooks execute with < 100ms latency
- 80%+ test coverage
- Documentation complete

**Epic Breakdown**: See [Epic Breakdown](#epic-breakdown) section

---

### Phase 2: Intelligence Layer (4-8 weeks after Phase 1)

**Goal**: Add AI-native capabilities (memory, skills, subagents)

**New Tools**:
- `generate_memory` - Auto-generate CLAUDE.md from codebase
- `generate_skill` - Create custom skills for tech stacks
- `create_subagent` - Generate specialized subagent configs
- `delegate_work` - Smart task delegation

**New Features**:
- Hierarchical memory management
- Skill library (10+ pre-built skills)
- Pre-configured subagents (5+ roles)
- Skill marketplace integration

**Success Criteria**:
- Skills auto-load based on project context
- Subagents successfully handle delegated tasks
- Memory reduces redundant context by 30%+
- Plugin marketplace listing live

---

### Phase 3: Observability (6-10 weeks after Phase 2)

**Goal**: Ultra-observable systems for AI agent comprehension

**New Tools**:
- `analyze_web_observability` - Web app inspection setup
- `configure_logging` - Structured logging for AI
- `analyze_logs` - Log pattern detection
- `analyze_architecture` - Codebase structure understanding

**New Integrations**:
- Playwright MCP (screenshots, console logs)
- Gitingest (codebase digests)
- Structured logging systems
- Performance monitoring

**Success Criteria**:
- Agents can "see" running applications (screenshots, logs)
- Log analysis identifies patterns automatically
- Architecture diagrams generated from code
- Mobile observability patterns documented

---

### Phase 4: Workflow Orchestration (8-12 weeks after Phase 3)

**Goal**: Systematic, repeatable AI-assisted workflows

**New Tools**:
- `start_workflow` - Initiate structured workflows
- `run_evaluation` - Quality metrics for AI code
- `track_progress` - Long-horizon task management

**New Features**:
- Workflow templates (TDD, spec-driven, BMAD-style)
- Custom agent builder (visual/conversational)
- Evaluation framework
- Beads integration (when stable)

**Success Criteria**:
- Complex workflows (rearchitecture, major features) succeed with top-level guidance
- Agents self-evaluate and improve code quality
- Long-horizon tasks tracked across sessions
- Team agent libraries shared successfully

---

### Phase 5: Ecosystem & Distribution (Ongoing after Phase 4)

**Goal**: Community-driven extension and adoption

**Marketplace Features**:
- Skill marketplace (browse, install, share)
- Preset template exchange
- Community plugin contributions

**Enterprise Features**:
- Team-wide standards enforcement
- Organization memory management
- Compliance and audit trails
- Multi-language support (Python, Go, Rust)

**Cross-Platform**:
- Windows native support
- Universal observability patterns
- Platform-agnostic workflows

---

## AI-First Design Principles

Based on research into Claude Code, MCP, Skills, and inspiration projects, these principles guide all Contextualizer design decisions:

### Principle 1: Conversational by Default

**Definition**: All capabilities accessible through natural language, not just CLI flags or config files.

**Implementation**:
- MCP tools invocable via Claude's interpretation of user intent
- No need to remember exact command syntax
- Context-aware suggestions based on project state

**Example**:
```
Instead of: /contextualizer config set hooks.strictness relaxed
User says: "Make the hooks less strict for now"
Claude invokes: configure_hooks(strictness="relaxed")
```

### Principle 2: Progressive Enhancement

**Definition**: Start simple, grow with project complexity. No upfront decisions.

**Implementation**:
- Minimal preset for quick starts
- Add capabilities (skills, subagents, observability) as needed
- No penalty for starting simple

**Example**:
- Day 1: Minimal preset (just context monitoring)
- Week 2: Add skills when framework complexity increases
- Month 3: Add observability when debugging production issues

### Principle 3: Observable & Introspectable

**Definition**: AI agents must be able to "see" and understand running systems, not just static code.

**Implementation**:
- Structured logging optimized for AI comprehension
- Screenshot/console log capture for web apps
- Architecture diagrams generated from code
- Performance metrics accessible to agents

**Example**:
- Agent sees error in browser console log via Playwright MCP
- Agent correlates error to source code location
- Agent proposes fix based on full context (UI + code + error)

### Principle 4: Memory Over Repetition

**Definition**: Capture patterns, conventions, and decisions in hierarchical memory to avoid repetitive instructions.

**Implementation**:
- Project memory (CLAUDE.md) for team-shared patterns
- User memory (~/.claude/CLAUDE.md) for personal preferences
- Auto-generated memory from codebase analysis
- Memory import system for modular organization

**Example**:
- Project memory documents: "We use React Server Components by default"
- User memory documents: "I prefer functional components with hooks"
- Claude combines both without user repeating preferences

### Principle 5: Skills Over Ad-hoc Knowledge

**Definition**: Package domain expertise as reusable skills that automatically activate when relevant.

**Implementation**:
- Tech stack skills (nextjs-expert, react-expert)
- Domain skills (auth-patterns, api-design)
- Three-level loading (metadata, instructions, resources)
- Skill marketplace for community contributions

**Example**:
- User works on Next.js route
- nextjs-expert skill auto-loads
- Claude has App Router patterns without user explanation

### Principle 6: Delegation Over Monoliths

**Definition**: Complex tasks delegated to specialized subagents with focused contexts, not handled by monolithic agent.

**Implementation**:
- Pre-configured subagents (code-reviewer, test-architect, debugger)
- Separate context windows preserve main conversation focus
- Smart delegation based on task complexity
- Parallel execution for independent work

**Example**:
- Main agent identifies: "This needs code review and test coverage analysis"
- Delegates to: code-reviewer (quality) + test-architect (coverage)
- Both run in parallel, results aggregated
- Main agent presents synthesis to user

### Principle 7: Idempotent & Reversible

**Definition**: All operations safe to re-run, easy to rollback. No fear of breaking things.

**Implementation**:
- Idempotent MCP tools (running twice produces same result)
- Git commits before/after changes
- Backup system for destructive operations
- Conflict detection and resolution
- Checkpointing for session recovery

**Example**:
- User runs init_project twice (forgot they ran it)
- Tool detects existing config, shows diff
- Offers: Update, Skip, View changes
- No accidental data loss

### Principle 8: Ecosystem Over Islands

**Definition**: Integrate with existing tools (MCP servers, Skills, plugins) rather than replacing them.

**Implementation**:
- Works with Context7 MCP for framework docs
- Works with Playwright MCP for browser testing
- Generates Skills that work across projects
- Plugin system for community extensions

**Example**:
- Contextualizer configures Context7 MCP with library IDs
- Claude uses both: Contextualizer for setup, Context7 for API docs
- User gets best of both without conflicts

---

## Epic Breakdown

### Epic 1: MCP Server Foundation (3 weeks)

**Goal**: Working MCP server with basic tools and transport

**Stories**:
1. **MCP Server Setup** - Initialize TypeScript project, MCP SDK integration, stdio transport
2. **Tool Infrastructure** - Tool registry, parameter validation, error handling, logging
3. **Resource System** - Resource providers for config, diagnostics, presets
4. **Prompt System** - Prompt templates for common workflows
5. **Testing Infrastructure** - Unit tests, integration tests, MCP protocol mocking
6. **Documentation** - README, API docs, contribution guide
7. **CI/CD Pipeline** - GitHub Actions workflow for automated testing, npm publishing, marketplace deployment, documentation site (GitHub Pages)

**Deliverables**: MCP server that can be invoked by Claude, basic tool/resource/prompt infrastructure, automated build and deployment pipeline

---

### Epic 2: Project Initialization (2 weeks)

**Goal**: `init_project` tool with preset system

**Stories**:
1. **Preset System** - YAML-based preset definitions, template engine integration
2. **Minimal Preset** - Basic context monitoring, generic CLAUDE.md
3. **Web-Fullstack Preset** - Next.js + React + TypeScript + Tailwind complete setup (includes generating subagent config files as `.claude/agents/*.md` placeholder templates; full subagent orchestration via `delegate_work` tool is Phase 2 FR22-FR24)
4. **Hackathon Preset** - Fast iteration mode with relaxed gates
5. **Template Engine** - Handlebars integration, variable substitution, validation
6. **File Generation** - Atomic file operations, directory structure creation, permissions

**Deliverables**: Working `init_project` tool that generates complete project setup

---

### Epic 3: Conflict Management & Smart Installation (2 weeks)

**Goal**: Safe installation in existing projects with conflict resolution

**Stories**:
1. **Git Detection** - Repository root detection, monorepo support, workspace identification
2. **Conflict Detection** - Existing file scanning, Contextualizer marker detection
3. **Backup System** - Timestamped backups, git commits, rollback documentation
4. **Merge Strategies** - Intelligent merging for CLAUDE.md, hook chaining, diff previews
5. **Idempotent Operations** - Version tracking, safe re-runs, update detection

**Deliverables**: Conflict-aware installation that safely handles existing configurations

---

### Epic 4: Context Management Hooks (2 weeks)

**Goal**: Real-time context monitoring and task boundary detection

**Stories**:
1. **Hook Generator** - Bash script templates, configuration integration, validation
2. **Context Estimation** - Heuristic algorithm, state tracking, session isolation
3. **User Prompt Submit Hook** - Token estimation, threshold warnings, rate limiting
4. **Task Boundary Detection** - Keyword analysis, suggestion system, configurable sensitivity
5. **Hook Configuration** - `configure_hooks` tool, dynamic updates, validation

**Deliverables**: Working hooks with < 100ms latency, configurable thresholds

---

### Epic 5: Diagnostics & Best Practices Doctor (2 weeks)

**Goal**: `run_doctor` tool with comprehensive project health checks

**Stories**:
1. **Check Framework** - Check registry, execution engine, result aggregation
2. **Best Practices Checklist** - 15+ checks across setup, hooks, workflow, MCP, testing
3. **Caching System** - Best practices document caching, offline mode, version tracking
4. **Report Generation** - Formatted output, severity levels, actionable recommendations
5. **Auto-fix System** - Fix implementations for common issues, preview before apply

**Deliverables**: Working doctor tool completing in < 5 seconds, auto-fixes for common issues

---

### Epic 6: Memory Management & Configuration (1 week)

**Goal**: CLAUDE.md generation and hierarchical configuration system

**Stories**:
1. **Memory Management Tool** - `manage_memory` tool, section editing, merge logic
2. **Configuration System** - YAML schema, validation, override precedence
3. **Get/Set Config Tools** - Read/update configuration conversationally
4. **Memory Templates** - Framework-specific memory content, best practices documentation
5. **User Documentation & Marketplace Content** - README for GitHub, marketplace listing content (descriptions, examples, screenshots), quick start guide, FAQ

**Deliverables**: Working memory management, conversational configuration updates, complete user-facing documentation

---

## Success Metrics

### Phase 1 Success Metrics

**Adoption**:
- 100+ GitHub stars in first month
- 500+ npm downloads/week
- 50+ marketplace plugin installs
- 10+ community contributions (issues, PRs)

**Performance**:
- Setup time: < 30 seconds (measured for web-fullstack preset)
- Context overflow incidents: 50% reduction (self-reported)
- Hook latency: < 100ms (instrumented)
- Doctor execution: < 5 seconds (instrumented)

**Quality**:
- Test coverage: > 80%
- Zero critical bugs in production for 30 days
- Documentation completeness: 100% of features documented
- User satisfaction: > 4.0/5.0 rating

**Engagement**:
- Doctor tool usage: > 70% of installs run doctor within first week
- Preset usage: 60% web-fullstack, 30% minimal, 10% hackathon
- Hook adoption: > 90% keep generated hooks (don't disable)

### Long-term Success Metrics (Phases 2-5)

**Ecosystem Growth**:
- 50+ community skills in marketplace
- 100+ custom presets shared
- 10,000+ active projects using Contextualizer

**Developer Productivity**:
- Major refactorings: Agents successfully complete with top-level guidance only
- Bug resolution time: 40% faster with observability features
- Code quality: 30% fewer issues in AI-assisted projects

**Platform Adoption**:
- Enterprise teams: 10+ organizations using team features
- Cross-platform: Python, Go, Rust projects supported
- IDE support: Works in 3+ IDEs beyond Claude Code

---

## Resource Requirements

### Phase 1 Development Team

**Core Team** (can be solo developer with appropriate time):
- **MCP Server Developer**: TypeScript, Node.js, MCP SDK expertise
- **DevOps/Tooling**: Bash scripting, git workflows, CLI tool experience
- **Documentation**: Technical writing, examples, tutorials

**Part-time/Advisory**:
- **UX Designer**: Conversational interface design
- **Security Reviewer**: MCP security model, hook safety
- **Community Manager**: GitHub, marketplace, support

**Estimated Time**: 8-12 weeks full-time equivalent

### Infrastructure

**Development**:
- GitHub repository (open source)
- npm account for package publishing
- CI/CD via GitHub Actions
- Test environment (macOS + Linux runners)

**Distribution**:
- Claude Code plugin marketplace listing
- npm registry for MCP server
- Documentation site (GitHub Pages or similar)

**Budget Estimate** (excluding salaries):
- Infrastructure: $0 (free tier sufficient for Phase 1)
- Domain/hosting: $50/year (optional)
- Testing services: $100/month (optional, GitHub Actions free tier usually sufficient)

### Dependencies

**Critical**:
- `@modelcontextprotocol/sdk` - Official MCP SDK from Anthropic
- `typescript` - Language and compiler
- `vitest` - Testing framework
- `fs-extra` - Safe file operations
- `simple-git` - Git integration
- `js-yaml` - YAML parsing

**Development**:
- `tsup` - Build tool
- `eslint` - Linting
- `prettier` - Formatting

**No Runtime Dependencies** for generated artifacts (hooks, configs are pure bash/markdown)

---

## References & Research

### Primary Research Sources

**Anthropic Documentation**:
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Agent Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Agent Skills Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Claude Code Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Claude Code Plugins](https://docs.claude.com/en/docs/claude-code/plugins)
- [Claude Code Plugin Reference](https://docs.claude.com/en/docs/claude-code/plugins-reference)
- [Claude Code Plugin Marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [Claude Code Memory](https://docs.claude.com/en/docs/claude-code/memory)
- [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)
- [Claude Code Statusline](https://docs.claude.com/en/docs/claude-code/statusline)
- [Claude Code Checkpointing](https://docs.claude.com/en/docs/claude-code/checkpointing)

**Anthropic Cookbooks**:
- [Agent Patterns](https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents)
- [Using Subagents](https://github.com/anthropics/claude-cookbooks/blob/main/multimodal/using_sub_agents.ipynb)
- [Building Evals](https://github.com/anthropics/claude-cookbooks/blob/main/misc/building_evals.ipynb)
- [Claude Quickstarts](https://github.com/anthropics/claude-quickstarts)

**External Resources**:
- [Mastering Context Management in Claude Code CLI](https://lalatenduswain.medium.com/mastering-context-management-in-claude-code-cli-your-guide-to-efficient-ai-assisted-coding-83753129b28e)

### Inspiration Projects

**Superpowers for Claude**:
- Repository: https://github.com/obra/superpowers
- Key learnings: TDD-focused skills, systematic workflows, evidence-based development
- Analysis: 4,000+ stars, strong community, skill-based architecture

**SuperClaude Framework**:
- Repository: https://github.com/SuperClaude-Org/SuperClaude_Framework
- Key learnings: 16 specialized agents, 7 behavioral modes, 30-50% token reduction
- Analysis: Meta-programming configuration framework, comprehensive but not MCP-native

**BMAD Method v6 Alpha**:
- Repository: https://github.com/bmad-code-org/BMAD-METHOD/tree/v6-alpha
- Key learnings: C.O.R.E. framework, scale-adaptive workflows, "coach not replacement"
- Analysis: Forward-looking agent collaboration, modular architecture

**AgentOS**:
- Repository: https://github.com/buildermethods/agent-os
- Key learnings: Spec-driven workflows, organizational standards capture
- Analysis: 2,100+ stars, transforms "confused interns into productive developers"

**Beads**:
- Repository: https://github.com/steveyegge/beads
- Key learnings: AI-native issue tracking, git-based memory system
- Analysis: Alpha status (data loss risks), innovative long-horizon task management

**Gitingest**:
- Repository: https://github.com/coderamp-labs/gitingest
- Key learnings: Codebase-to-AI-digest conversion, token-optimized extraction
- Analysis: Practical tool for agent comprehension of codebases

### Additional Resources for Future Research

- Model Context Protocol specification and examples
- Claude Code plugin development guides
- MCP server implementation patterns
- AI-assisted development case studies
- Anthropic Model Context Protocol GitHub organization
- Community discussions on Reddit, Hacker News about AI coding tools

---

## Appendix A: Glossary

**MCP (Model Context Protocol)**: Protocol enabling Claude to communicate with external tools and services via structured interfaces (tools, resources, prompts).

**Tool**: MCP concept - function Claude can invoke with parameters, receives results.

**Resource**: MCP concept - data Claude can read (files, API responses, configurations).

**Prompt**: MCP concept - pre-defined workflow or template Claude can execute.

**Skill**: Claude Code concept - modular capability that extends Claude's knowledge for specific domains, auto-loads when relevant.

**Subagent**: Claude Code concept - specialized AI assistant with separate context window, configured with custom system prompt and tools.

**Hook**: Claude Code concept - script that executes in response to events (pre-tool, post-tool, prompt submit, session start/end).

**Memory**: Claude Code concept - hierarchical instruction system (Enterprise → Project → User), stored in CLAUDE.md files.

**Plugin**: Claude Code concept - package that extends Claude Code with commands, agents, skills, and hooks, distributed via marketplace.

**Preset**: Contextualizer concept - pre-configured template for project setup (minimal, web-fullstack, hackathon).

**Idempotent**: Operation that produces same result regardless of how many times executed.

**Contextualizer**: This project - MCP server and plugin ecosystem for AI-first development.

---

## Appendix B: User Journey Examples

### Journey 1: New Next.js Project

```
Developer: Fresh Next.js 15 project, wants AI-first setup

Step 1: Installation
$ npm install -g @contextualizer/mcp
# Add to claude_desktop_config.json
# Restart Claude Code

Step 2: Natural Language Setup
User: "Set up this Next.js project for AI development with strict quality gates"

Claude: [Invokes init_project(preset="web-fullstack", options={strictness: "strict"})]
"✅ Setup complete! I've configured:
- Context monitoring (75%/90% thresholds)
- Pre-commit hooks (ESLint, TypeScript, Vitest)
- Skills: nextjs-expert, react-expert, typescript-expert
- Subagents: code-reviewer, test-architect, doc-writer
- Memory with Next.js 15 App Router patterns
- Context7 MCP configured for Next.js docs

Your project is now optimized for AI-first development!"

Step 3: Development
User: "Let's build a user authentication feature"

Claude: [Uses nextjs-expert skill automatically]
[Delegates test architecture to test-architect subagent]
"I'll handle the implementation, and I've asked the test-architect
to design the test strategy in parallel..."

Step 4: Quality Check
User: "Is everything set up correctly?"

Claude: [Invokes run_doctor()]
"✅ 15/15 checks passed! Your project follows all Anthropic best practices."
```

### Journey 2: Existing Monorepo

```
Developer: Large monorepo, wants to add Contextualizer to one package

Step 1: Conversational Setup
User: "Set up Contextualizer in the apps/web package, minimal config"

Claude: [Invokes init_project(preset="minimal")]
"I detected this is a monorepo. Should I install in:
1. Git root (/Users/dev/monorepo)
2. Current directory (/Users/dev/monorepo/apps/web)

User: "Current directory"

Claude: [Continues with installation]
"Found existing .claude/CLAUDE.md. Options:
1. Merge (keep your content, add Contextualizer sections)
2. Backup and replace
3. View diff first

User: "Merge"

Claude: [Invokes merge logic]
"✅ Successfully merged! Your custom sections preserved,
Contextualizer sections added with markers for future updates."

Step 2: Adjustment
User: "Actually, make it less strict, we're in rapid prototyping mode"

Claude: [Invokes configure_hooks(strictness="relaxed")]
"✅ Updated to relaxed mode. Pre-commit now shows warnings but doesn't block."

Step 3: Ongoing Use
# Two weeks later...
User: "Why is context getting so large?"

Claude: [Checks context status]
[Invokes run_doctor(category="memory")]
"Context at 82%. Your CLAUDE.md is 15KB. Recommendations:
1. Move some content to skill files
2. Use memory imports for modular organization
3. Consider clearing older conversation history

Would you like me to optimize the memory structure?"
```

### Journey 3: Team Onboarding

```
Tech Lead: Wants to standardize team's Claude Code setup

Step 1: Custom Preset Creation
Tech Lead: "Create a custom preset for our team with our coding standards"

Claude: [Guides through preset creation]
[Generates team-preset.yaml with organizational patterns]

Step 2: Team Distribution
Tech Lead: "How do team members install this?"

Claude: "I've created a team plugin repository. Team members can:
1. Add your team marketplace to Claude Code
2. Run: /plugin install your-company/contextualizer-preset
3. Run: /contextualizer setup --preset team

All team members will get consistent setup with your standards."

Step 3: Updates
# One month later, new best practice discovered
Tech Lead: "Update the team preset to include our new API error handling pattern"

Claude: [Invokes update preset logic]
"✅ Updated team preset v1.1.0. Team members will be notified
of the update next time they run doctor or use Contextualizer."
```

---

---

## Next Steps

### For UX Expert (Sally)

Hi Sally! 👋 I've completed the PRD for Contextualizer, an MCP-first AI development framework for Claude Code. Since this project has limited UI/UX requirements (it's primarily a conversational MCP server with CLI interactions), here's what I need from you:

**Context**:
- This is an MCP server that Claude interacts with conversationally
- Primary interface is natural language (no traditional GUI)
- Secondary interface is CLI for installation and marketplace distribution
- Plugin provides slash commands as convenience layer

**Your Task**:
Review the PRD (particularly the "User Journey Examples" in Appendix B) and create a **Front-End Specification** that covers:

1. **Conversational UX Design**:
   - How should Claude present MCP tool results to users?
   - What's the optimal format for diagnostics reports, conflict resolution prompts, and configuration updates?
   - Design the "voice" and tone for error messages, warnings, and success confirmations

2. **CLI Installation Experience**:
   - Installation flow (npm install → add to config → restart)
   - First-run experience and onboarding
   - Error states and troubleshooting guidance

3. **Marketplace Presence**:
   - Plugin marketplace listing design (description, screenshots, examples)
   - Documentation structure for discoverability

4. **Terminal Output Design**:
   - Color schemes for hooks and CLI output
   - Progress indicators for long-running operations
   - Status line design (if we implement custom statusline)

5. **Future Phases** (Optional):
   - If we build a web-based configuration UI in Phase 2+, what should it look like?
   - Visual representation of project diagnostics (dashboard concept)

**Key Constraint**: This project emphasizes **conversational** over **visual** UX, so focus on:
- Message clarity and scannability
- Cognitive load reduction in text-based interfaces
- Consistent terminology and mental models

**Deliverable**: Run `*create-front-end-spec` to create the specification document.

---

### For Architect (Winston)

Hi Winston! 🏗️ I've completed the PRD for Contextualizer. This is a complex system with multiple architectural layers, so I need your comprehensive system design expertise.

**Context**:
- **Primary Component**: MCP server (TypeScript/Node.js) using stdio transport
- **Secondary Components**: Bash hooks, YAML configs, markdown memory files
- **Distribution**: npm package + Claude Code plugin + marketplace
- **Complexity**: Conversational interface, file generation, conflict resolution, diagnostics, multi-preset system

**Your Task**:
Create a **comprehensive architecture document** that covers:

1. **System Architecture**:
   - MCP server architecture (tool/resource/prompt system)
   - Communication flow: Claude ↔ MCP Server ↔ File System
   - State management (session state, configuration, cache)
   - Error handling and graceful degradation strategies

2. **Component Design**:
   - Tool implementations (init_project, run_doctor, configure_hooks, etc.)
   - Template engine architecture
   - Preset system design
   - Conflict detection and resolution logic
   - Hook generation and validation

3. **Data Architecture**:
   - Configuration schema (.contextualizer/config.yaml)
   - State file format (.contextualizer/state-{PID}.json)
   - Memory structure (CLAUDE.md hierarchy)
   - Preset definition format
   - Cache strategy (best practices, framework versions)

4. **Integration Points**:
   - MCP SDK integration patterns
   - Git operations (commits, conflict detection)
   - File system operations (atomic writes, backups)
   - Package.json detection and parsing
   - Context7 MCP coordination

5. **Plugin Architecture**:
   - Plugin wrapper structure
   - Skill bundling and distribution
   - Subagent configuration format
   - Marketplace integration

6. **Security Model**:
   - Input validation strategies
   - Path traversal prevention
   - Hook execution safety
   - Backup and rollback mechanisms

7. **Performance Considerations**:
   - Tool invocation latency targets (< 2s)
   - Hook execution performance (< 100ms)
   - File operation optimization
   - Caching strategies

8. **Testing Strategy**:
   - Unit test architecture
   - Integration test patterns (MCP protocol mocking)
   - E2E test scenarios
   - Cross-platform testing (macOS/Linux)

9. **Phase 2-5 Considerations**:
   - How to extend for memory management, skill generation, observability tools
   - Plugin API for community extensions
   - Marketplace architecture

**Key Considerations**:
- This is **Phase 1 (Foundation)** focused, but design should support progressive enhancement through Phase 5
- Emphasize **idempotent operations** and **safe failures**
- **Conversational interface** is primary, so architecture must support dynamic, natural language-driven configuration
- **Zero runtime dependencies** for generated artifacts (hooks are pure bash)

**Deliverable**: Run `*create-full-stack-architecture` to create the comprehensive architecture document. This project spans frontend (conversational UX), backend (MCP server), infrastructure (file operations, git), and distribution (npm + marketplace), so use the full-stack template.

**Reference Materials in PRD**:
- Technical Architecture section (page ~40)
- MCP Server Architecture diagram
- All functional requirements (FR1-FR43)
- Non-functional requirements (NFR1-NFR25)
- Epic breakdown (6 epics with stories)

---

**END OF PRD**

---

*This PRD represents Phase 1 (Foundation) in detail, with clear roadmap for Phases 2-5. As we progress through phases, this document will be updated with detailed requirements for each subsequent phase.*
