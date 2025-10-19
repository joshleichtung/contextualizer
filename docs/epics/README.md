# Contextualizer Epics

This directory contains the individual epic files sharded from the main PRD (v1.0.1).

## Epic Files

1. **[Epic 1: MCP Server Foundation](./epic-1-mcp-server-foundation.md)** (3 weeks)
   - MCP server setup with stdio transport
   - Tool, resource, and prompt infrastructure
   - Testing and documentation
   - CI/CD pipeline

2. **[Epic 2: Project Initialization](./epic-2-project-initialization.md)** (2 weeks)
   - Preset system (minimal, web-fullstack, hackathon)
   - Template engine
   - File generation with atomic operations

3. **[Epic 3: Conflict Management & Smart Installation](./epic-3-conflict-management.md)** (2 weeks)
   - Git detection and monorepo support
   - Conflict detection and resolution
   - Backup and rollback system
   - Idempotent operations

4. **[Epic 4: Context Management Hooks](./epic-4-context-management-hooks.md)** (2 weeks)
   - Hook generator and templates
   - Context estimation and monitoring
   - Task boundary detection
   - Pre-commit hook generation

5. **[Epic 5: Diagnostics & Best Practices Doctor](./epic-5-diagnostics-best-practices.md)** (2 weeks)
   - Check framework with 15+ checks
   - Best practices caching system
   - Report generation
   - Auto-fix system

6. **[Epic 6: Memory Management & Configuration](./epic-6-memory-configuration.md)** (1 week)
   - Memory management tool
   - Hierarchical configuration system
   - Get/set config tools
   - Memory templates for all presets
   - User documentation and marketplace content

## Total Phase 1 Estimate

**12 weeks** (8-12 weeks estimated in PRD)

## Epic Dependencies

```
Epic 1: MCP Server Foundation
   ↓
Epic 2: Project Initialization
   ↓
Epic 3: Conflict Management ←→ Epic 4: Context Management Hooks
   ↓                                ↓
Epic 5: Diagnostics & Best Practices
   ↓
Epic 6: Memory Management & Configuration
```

## Source

These epics were sharded from:
- **Source**: `docs/prd.md`
- **Version**: 1.0.1
- **Date**: 2025-10-19
- **Section**: Epic Breakdown (original section in PRD)

## Usage

Each epic file contains:
- Time estimate
- Goal statement
- Story breakdown with technical requirements
- Deliverables
- Cross-references to PRD functional requirements
- Cross-references to architecture sections
- Success criteria

Use these epic files as the foundation for story development in the next phase.
