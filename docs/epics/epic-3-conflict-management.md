# Epic 3: Conflict Management & Smart Installation

**Time Estimate**: 2 weeks

**Goal**: Safe installation in existing projects with conflict resolution

---

## Stories

### Story 3.1: Git Detection
Repository root detection, monorepo support, workspace identification

**Technical Requirements**:
- Implement git repository root detection (simple-git)
- Detect workspace structures (pnpm, yarn, lerna, nx)
- Identify monorepo configurations
- Prompt for installation location (git root vs. current directory)
- Handle nested .claude/ directories correctly

**Related Functional Requirements**:
- **FR9**: Monorepo and nested project support
  - Detects git repository root
  - Identifies workspace structures (pnpm, yarn, lerna, nx)
  - Prompts for installation location (git root vs. current directory)
  - Handles nested .claude/ directories correctly

**Related Non-Functional Requirements**:
- **NFR10**: Conversational interface - Claude invokes tools based on natural language

---

### Story 3.2: Conflict Detection
Existing file scanning, Contextualizer marker detection

**Technical Requirements**:
- Implement existing file scanner
- Detect Contextualizer-generated files via comment markers
- Distinguish custom user files from managed files
- Analyze CLAUDE.md structure for custom vs. managed sections
- Detect hook conflicts and custom hook chains

**Related Functional Requirements**:
- **FR8**: Smart conflict detection and resolution
  - Detects Contextualizer-generated files via comment markers
  - Distinguishes custom user files from managed files
  - Shows diff preview for conflicts
  - Options: Backup and replace, Merge, Skip, View diff

---

### Story 3.3: Backup System
Timestamped backups, git commits, rollback documentation

**Technical Requirements**:
- Create timestamped backup system (`.contextualizer/backup-{timestamp}/`)
- Implement git commit before/after changes
- Generate rollback documentation
- Create backup verification system
- Implement restore functionality

**Related Functional Requirements**:
- **FR2**: `init_project` tool - Backs up existing files to `.contextualizer/backup-{timestamp}/`
- **FR8**: Smart conflict detection - Git-tracked backups (commits before/after changes)

**Related Non-Functional Requirements**:
- **NFR6**: Atomic file operations with rollback on failure
- **NFR7**: Git-tracked changes for manual rollback capability
- **NFR24**: Backup before destructive operations

---

### Story 3.4: Merge Strategies
Intelligent merging for CLAUDE.md, hook chaining, diff previews

**Technical Requirements**:
- Implement CLAUDE.md intelligent merge logic
- Preserve user customizations outside Contextualizer markers
- Support hook chaining for existing pre-commit hooks
- Generate diff previews for conflicts
- Create merge conflict resolution UI (conversational)
- Handle memory import hierarchies

**Related Functional Requirements**:
- **FR5**: `manage_memory` tool - Merge logic
  - Intelligently merges content with existing CLAUDE.md
  - Preserves user customizations outside Contextualizer markers
  - Supports hierarchical memory (project + user)
  - Returns: Updated memory structure, merge conflicts (if any)

**Related Non-Functional Requirements**:
- **NFR11**: All generated files include comments explaining purpose and customization
- **NFR12**: Clear error messages with suggested fixes

---

### Story 3.5: Idempotent Operations
Version tracking, safe re-runs, update detection

**Technical Requirements**:
- Implement version tracking for Contextualizer installations
- Design idempotent tool operations
- Detect when re-running vs. updating
- Create state comparison for change detection
- Handle partial installation recovery

**Related Functional Requirements**:
- **FR2**: `init_project` tool - Idempotent operations
- **FR7**: Template engine - Idempotent operations (safe to re-run)

**Related Non-Functional Requirements**:
- **NFR5**: Idempotent operations (safe to re-run tools multiple times)
- **NFR6**: Atomic file operations with rollback on failure

---

## Epic Deliverables

- Conflict-aware installation that safely handles existing configurations
- Git repository detection with monorepo support
- Comprehensive backup and rollback system
- Intelligent merge strategies for CLAUDE.md and hooks
- Idempotent operations with version tracking

---

## Cross-References

### Architecture Sections
- Git Operations (commits, conflict detection)
- File System Operations (atomic writes, backups)
- State Management
- Security Model (input validation, path traversal prevention)

### Related Functional Requirements
- FR2: `init_project` tool
- FR5: `manage_memory` tool
- FR8: Smart conflict detection and resolution
- FR9: Monorepo and nested project support

### Related Epics
- Epic 1: MCP Server Foundation (dependency)
- Epic 2: Project Initialization (integrates with this)
- Epic 6: Memory Management (uses merge strategies from this)

---

## Success Criteria

- Safe installation in projects with existing .claude/ directories
- Monorepo installations work correctly
- No data loss during conflict resolution
- All conflicts detected before file writes
- Rollback functionality tested and documented
- User customizations preserved during merges
