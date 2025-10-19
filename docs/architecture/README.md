# Architecture Component Specifications

**Source**: Sharded from `docs/architecture.md` v1.0.0
**Date**: 2025-10-19
**Phase**: MVP (8-12 weeks)

## Overview

This directory contains component-level architecture specifications for the Contextualizer MCP Server. Each file focuses on a specific architectural component or system.

## Component Specifications

1. **[mcp-server.md](./mcp-server.md)** - MCP Server Architecture
   MCP protocol interface, server lifecycle, tool/resource/prompt systems, error handling

2. **[tools.md](./tools.md)** - MCP Tools Implementation
   Tool definitions for init_project, run_doctor, configure_hooks, manage_memory, get_config

3. **[template-engine.md](./template-engine.md)** - Template Engine Component
   Handlebars-based file generation, template structure, rendering system

4. **[preset-system.md](./preset-system.md)** - Preset System Component
   Preset definitions (minimal, web-fullstack, hackathon), registry, detection logic

5. **[conflict-resolution.md](./conflict-resolution.md)** - Conflict Resolution System
   Conflict detection, merging strategies, backup systems, git integration

6. **[diagnostics-engine.md](./diagnostics-engine.md)** - Diagnostics Engine Component
   Check system, autofix capabilities, diagnostic reports, validation logic

7. **[hook-generator.md](./hook-generator.md)** - Hook Generator Component
   Hook generation, performance optimization, bash script validation

8. **[memory-manager.md](./memory-manager.md)** - Memory Manager Component
   CLAUDE.md management, section parsing, update strategies

9. **[integration-layer.md](./integration-layer.md)** - Integration Layer
   MCP SDK, Git operations, file I/O manager, package.json parser

10. **[data-models.md](./data-models.md)** - Data Models & Schemas
    Zod schemas for configuration, state, diagnostics, presets

11. **[security-performance.md](./security-performance.md)** - Security & Performance
    Threat model, security validations, performance optimization, benchmarks

12. **[testing-strategy.md](./testing-strategy.md)** - Testing Architecture
    Test pyramid, unit/integration/e2e tests, coverage strategy

13. **[extensibility.md](./extensibility.md)** - Extensibility & Future Phases
    Extension points, plugin API, marketplace integration, Phase 2-5 considerations

## Cross-References

- **Parent Document**: `docs/architecture.md` (full architecture)
- **Related**: `docs/prd.md` (product requirements)
- **Related**: `docs/frontend-spec.md` (UX specifications)
- **Implementation**: `docs/epics/*.md` (epic stories)

## Usage

These specifications are used by:
- **Dev agents** for implementation guidance
- **Architects** for design decisions and reviews
- **QA** for test coverage planning
- **Story Manager** for breaking down technical tasks
