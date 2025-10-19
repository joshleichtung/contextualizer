# Epic 2: Project Initialization

**Time Estimate**: 2 weeks

**Goal**: `init_project` tool with preset system

---

## Stories

### Story 2.1: Preset System
YAML-based preset definitions, template engine integration

**Technical Requirements**:
- Design YAML schema for preset configurations
- Implement preset loader and validator
- Create preset registry system
- Integrate with template engine
- Support variable substitution in presets

**Related Functional Requirements**:
- **FR6**: Three core presets with distinct characteristics
  - Minimal Preset (< 10 seconds installation)
  - Web-Fullstack Preset (< 30 seconds installation)
  - Hackathon Preset (< 15 seconds installation)

**Related Non-Functional Requirements**:
- **NFR4**: Initial project setup completes in < 30 seconds for any preset

---

### Story 2.2: Minimal Preset
Basic context monitoring, generic CLAUDE.md

**Technical Requirements**:
- Implement Minimal preset configuration
- Basic context monitoring hook (80%/95% thresholds)
- Generic CLAUDE.md with no framework specifics
- No pre-commit hooks (user configures manually)

**Related Functional Requirements**:
- **FR6**: Minimal Preset specifications
  - Installation: < 10 seconds
  - Basic context monitoring only
  - No framework-specific configuration

**Deliverables**:
- Minimal preset YAML configuration
- Generic CLAUDE.md template
- Basic context monitoring hook template

---

### Story 2.3: Web-Fullstack Preset
Next.js + React + TypeScript + Tailwind complete setup (includes generating subagent config files as `.claude/agents/*.md` placeholder templates; full subagent orchestration via `delegate_work` tool is Phase 2 FR22-FR24)

**Technical Requirements**:
- Implement Web-Fullstack preset configuration
- Context monitoring (75%/90% thresholds)
- CLAUDE.md with Next.js 15, React 19, TypeScript 5, Tailwind 3 patterns
- Context7 MCP setup instructions with library IDs
- Pre-commit hooks: ESLint (error-blocking), TypeScript check, Vitest tests
- Generate placeholder subagent config files (`.claude/agents/*.md`)
  - code-reviewer.md template
  - test-architect.md template
  - doc-writer.md template
- Skills: nextjs-expert, react-expert, typescript-expert

**Note on Subagents**: This story generates the **configuration files** for subagents as placeholder templates. The full subagent orchestration system (including the `delegate_work` tool and smart delegation logic) is implemented in Phase 2 (FR22-FR24). The generated files serve as starting points that will be activated once the orchestration layer is complete.

**Related Functional Requirements**:
- **FR6**: Web-Fullstack Preset specifications
- Context7 library IDs:
  - `/vercel/next.js/v15.0.0`
  - `/facebook/react/v19.0.0`
  - `/tailwindlabs/tailwindcss/v3.4.0`

**Deliverables**:
- Web-Fullstack preset YAML configuration
- Next.js-specific CLAUDE.md template
- Pre-commit hook templates (ESLint, TypeScript, Vitest)
- Placeholder subagent configuration files (3 agents)
- Skill file templates (3 skills)

---

### Story 2.4: Hackathon Preset
Fast iteration mode with relaxed gates

**Technical Requirements**:
- Implement Hackathon preset configuration
- Aggressive context monitoring (90%/95% thresholds, auto-suggest clear)
- CLAUDE.md emphasizing speed over perfection
- Pre-commit hooks: ESLint warnings only (non-blocking)
- No test execution in hooks
- "Fail fast" patterns and rapid iteration guidance

**Related Functional Requirements**:
- **FR6**: Hackathon Preset specifications
  - Installation: < 15 seconds
  - Speed-focused configuration
  - Non-blocking quality gates

**Deliverables**:
- Hackathon preset YAML configuration
- Speed-focused CLAUDE.md template
- Non-blocking pre-commit hook template

---

### Story 2.5: Template Engine
Handlebars integration, variable substitution, validation

**Technical Requirements**:
- Integrate Handlebars or similar template engine
- Implement variable substitution system
- Support conditionals and loops in templates
- Framework version detection from `package.json`
- Template validation before rendering
- Idempotent operations (safe to re-run)

**Related Functional Requirements**:
- **FR7**: Template engine for file generation
  - Supports variable substitution, conditionals, loops
  - Templates in standardized format (Handlebars or similar)
  - Framework version detection from `package.json`
  - Idempotent operations (safe to re-run)

**Related Non-Functional Requirements**:
- **NFR5**: Idempotent operations (safe to re-run tools multiple times)

---

### Story 2.6: File Generation
Atomic file operations, directory structure creation, permissions

**Technical Requirements**:
- Implement atomic file write operations (fs-extra)
- Create directory structure generation
- File permission management
- Backup system integration
- Git commit integration for tracking changes
- Force LF line endings via .gitattributes

**Related Functional Requirements**:
- **FR2**: `init_project` tool file generation
  - Generates: `.claude/hooks/`, `CLAUDE.md`, `.contextualizer/config.yaml`
  - Backs up existing files to `.contextualizer/backup-{timestamp}/`
  - Returns: Success/failure status, list of files created/modified

**Related Non-Functional Requirements**:
- **NFR6**: Atomic file operations with rollback on failure
- **NFR7**: Git-tracked changes for manual rollback capability
- **NFR17**: Force LF line endings via .gitattributes (prevent Windows CRLF issues)
- **NFR23**: Validation of user inputs before file operations
- **NFR25**: File permission checks before writes

---

## Epic Deliverables

- Working `init_project` tool that generates complete project setup
- Three functional presets (minimal, web-fullstack, hackathon)
- Template engine with validation
- Atomic file generation system
- Placeholder subagent configuration files (activated in Phase 2)

---

## Cross-References

### Architecture Sections
- Preset System (configuration schema)
- Template Engine Architecture
- File Operations
- Plugin Architecture

### Related Functional Requirements
- FR2: `init_project` tool
- FR6: Three core presets
- FR7: Template engine
- FR22-FR24: Subagent orchestration (Phase 2 - activates generated configs)

### Related Epics
- Epic 1: MCP Server Foundation (dependency)
- Epic 3: Conflict Management (integrates with this)
- Epic 4: Context Management Hooks (uses templates from this)
- Epic 6: Memory Management (uses templates from this)

---

## Success Criteria

- All three presets install within time targets
- `init_project` tool successfully generates all required files
- Template engine handles framework version detection
- File operations are atomic and reversible
- Subagent configuration files are generated as valid templates
- Test coverage for all preset configurations
