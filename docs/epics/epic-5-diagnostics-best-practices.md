# Epic 5: Diagnostics & Best Practices Doctor

**Time Estimate**: 2 weeks

**Goal**: `run_doctor` tool with comprehensive project health checks

---

## Stories

### Story 5.1: Check Framework
Check registry, execution engine, result aggregation

**Technical Requirements**:
- Create check registry system
- Implement check execution engine
- Design result aggregation
- Support check categories (setup | hooks | workflow | MCP | testing)
- Parallel check execution where possible
- Check dependency management (some checks depend on others)

**Related Functional Requirements**:
- **FR3**: `run_doctor` tool - Comprehensive diagnostics
  - Parameters: `category` (all | hooks | memory | skills | observability)
  - Validates against Anthropic best practices checklist (15+ checks)
  - Checks: Hook configuration, CLAUDE.md structure, MCP server availability, file permissions
  - Returns: Report with pass/warn/fail status, actionable recommendations, fix suggestions
  - Caches best practices document for offline operation (`.contextualizer/cache/`)

**Related Non-Functional Requirements**:
- **NFR3**: Doctor diagnostics complete in < 5 seconds for typical projects
- **NFR8**: Graceful degradation when dependencies unavailable (offline mode)

---

### Story 5.2: Best Practices Checklist
15+ checks across setup, hooks, workflow, MCP, testing

**Technical Requirements**:
- Implement minimum 15 checks across categories:
  - **Setup**: .contextualizer/ directory exists, config.yaml valid, Node.js version
  - **Hooks**: user-prompt-submit configured, pre-commit configured, hook syntax valid, file permissions
  - **Memory**: CLAUDE.md exists, structure valid, size reasonable
  - **MCP**: claude_desktop_config.json configured, MCP server reachable
  - **Testing**: Test framework detected, hooks execute tests correctly
  - **Workflow**: Git repository detected, .gitignore configured correctly
  - **Best Practices**: Follows Anthropic recommendations, no common anti-patterns

**Related Functional Requirements**:
- **FR13**: Best practices checklist engine
  - Minimum 15 checks across categories: setup, hooks, workflow, MCP, testing
  - Each check returns: status (pass | warn | fail), message, recommendation
  - Checks execute in < 5 seconds (NFR3)
  - Extensible architecture for custom checks

**Deliverables**:
- 15+ check implementations
- Check categorization system
- Status reporting (pass | warn | fail)
- Actionable recommendations for each check

---

### Story 5.3: Caching System
Best practices document caching, offline mode, version tracking

**Technical Requirements**:
- Implement best practices document caching (`.contextualizer/cache/`)
- Cache Anthropic's best practices documentation
- Version tracking for cached content
- Offline mode support (use cached data when network unavailable)
- Cache invalidation strategy (time-based + version-based)
- Manual cache update mechanism

**Related Functional Requirements**:
- **FR3**: Caches best practices document for offline operation

**Related Non-Functional Requirements**:
- **NFR8**: Graceful degradation when dependencies unavailable (offline mode)
- **NFR22**: No automatic network requests from hooks

**Known Limitations**:
- Best practices cache can be stale - Requires manual update via doctor tool

---

### Story 5.4: Report Generation
Formatted output, severity levels, actionable recommendations

**Technical Requirements**:
- Design report output format (clear, scannable, actionable)
- Implement severity levels (pass | warn | fail)
- Generate actionable recommendations
- Create summary statistics (X/Y checks passed)
- Support verbose mode for detailed output
- Color-coded output for terminal (optional)
- Conversational presentation via Claude

**Related Functional Requirements**:
- **FR3**: Returns report with pass/warn/fail status, actionable recommendations, fix suggestions

**Related Non-Functional Requirements**:
- **NFR10**: Conversational interface - Claude invokes tools based on natural language
- **NFR12**: Clear error messages with suggested fixes
- **NFR13**: Status updates during long-running operations

**Deliverables**:
- Formatted report structure
- Severity-based formatting
- Recommendation system
- Summary generation

---

### Story 5.5: Auto-fix System
Fix implementations for common issues, preview before apply

**Technical Requirements**:
- Implement auto-fix capability for fixable issues
- Preview system (show what will be fixed before applying)
- Safe fix application (backup before changes)
- Fix verification (run checks again after fix)
- Not all checks are auto-fixable (document which are manual)
- Git commit before/after fixes

**Related Functional Requirements**:
- **FR14**: Automated fix application
  - Auto-fixable issues applied via `run_doctor` tool with fix parameter
  - Shows preview before applying
  - Git commits before/after fixes
  - Not all checks auto-fixable (some require human judgment)

**Related Non-Functional Requirements**:
- **NFR6**: Atomic file operations with rollback on failure
- **NFR7**: Git-tracked changes for manual rollback capability
- **NFR24**: Backup before destructive operations

**Deliverables**:
- Auto-fix implementations for common issues:
  - Invalid config.yaml → fix syntax
  - Missing .contextualizer/ directory → create
  - Invalid hook permissions → fix (chmod +x)
  - Outdated configuration format → migrate
- Preview system
- Fix verification workflow

---

## Epic Deliverables

- Working doctor tool completing in < 5 seconds
- 15+ comprehensive checks across categories
- Best practices caching system with offline support
- Auto-fixes for common issues
- Clear, actionable reporting

---

## Cross-References

### Architecture Sections
- Diagnostics Engine design
- Check Framework architecture
- Caching System
- Configuration Schema (for validation checks)

### Related Functional Requirements
- FR3: `run_doctor` tool specifications
- FR13: Best practices checklist engine
- FR14: Automated fix application

### Related Research
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Agent Skills Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)

### Related Epics
- Epic 1: MCP Server Foundation (dependency)
- Epic 2: Project Initialization (doctor validates initialization)
- Epic 3: Conflict Management (doctor checks for conflicts)
- Epic 4: Context Management Hooks (doctor validates hooks)
- Epic 6: Memory Management (doctor validates memory structure)

---

## Success Criteria

- Doctor tool completes in < 5 seconds for typical projects
- 15+ checks implemented and tested
- 90%+ of common issues detected
- Auto-fixes work without requiring manual intervention
- Offline mode works with cached best practices
- Clear, actionable reports generated
- Test coverage for all checks
