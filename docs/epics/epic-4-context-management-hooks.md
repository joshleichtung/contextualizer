# Epic 4: Context Management Hooks

**Time Estimate**: 2 weeks

**Goal**: Real-time context monitoring and task boundary detection

---

## Stories

### Story 4.1: Hook Generator
Bash script templates, configuration integration, validation

**Technical Requirements**:
- Create bash script template system
- Integrate with preset configurations
- Implement hook syntax validation
- Generate hooks with proper shebang (`#!/usr/bin/env bash`)
- Create hook installation system
- Support hook updates and versioning

**Related Functional Requirements**:
- **FR4**: `configure_hooks` tool - Quality gate management
  - Parameters: `hookType` (pre-commit | user-prompt-submit | all), `strictness` (strict | balanced | relaxed), `enabled` (boolean)
  - Updates hook configurations dynamically
  - Validates hook syntax before applying changes
  - Returns: Updated configuration, validation results

**Related Non-Functional Requirements**:
- **NFR14**: Bash 4.0+ required for hooks (documented, checked during init)
- **NFR16**: Uses `#!/usr/bin/env bash` for shell portability
- **NFR18**: Zero external runtime dependencies for generated artifacts (hooks are pure bash)

---

### Story 4.2: Context Estimation
Heuristic algorithm, state tracking, session isolation

**Technical Requirements**:
- Implement token estimation heuristic (characters ÷ 4)
- Create state tracking system (`.contextualizer/state-{PID}.json`)
- Session isolation mechanism (per-process state)
- Trend analysis (increasing/stable/decreasing context)
- Historical data collection for pattern detection

**Related Functional Requirements**:
- **FR10**: User prompt submit hook - Context monitoring
  - Heuristic token estimation (characters ÷ 4)
  - Configurable thresholds per preset
  - Rate-limited warnings (max 1 per 5 minutes per severity)
  - Trend analysis (increasing/stable/decreasing context)
  - Session-isolated state tracking (`.contextualizer/state-{PID}.json`)

**Related Non-Functional Requirements**:
- **NFR2**: Context monitoring hook adds < 100ms latency to prompt submission

**Known Limitations**:
- Context estimation is approximate - Uses heuristics, not exact API token counts

---

### Story 4.3: User Prompt Submit Hook
Token estimation, threshold warnings, rate limiting

**Technical Requirements**:
- Implement user-prompt-submit hook
- Read stdin (prompt from Claude)
- Calculate estimated tokens
- Check against thresholds (configurable per preset)
- Generate warnings at appropriate levels
- Rate limiting (max 1 per 5 minutes per severity)
- Never block prompt (always exit 0)

**Related Functional Requirements**:
- **FR10**: User prompt submit hook specifications
  - Minimal: 80%/95% thresholds
  - Web-Fullstack: 75%/90% thresholds
  - Hackathon: 90%/95% thresholds with auto-suggest clear

**Related Non-Functional Requirements**:
- **NFR2**: Context monitoring hook adds < 100ms latency
- Hook always returns exit code 0 (never blocks)

**Deliverables**:
- Working user-prompt-submit.sh template
- Configuration integration
- State management system
- Warning output formatting

---

### Story 4.4: Task Boundary Detection
Keyword analysis, suggestion system, configurable sensitivity

**Technical Requirements**:
- Implement keyword analysis for new task signals
- Detect task completion indicators
- Configurable sensitivity (aggressive | balanced | conservative)
- Suggest context clearing at appropriate times
- Respect rate limiting
- Integrate with state tracking

**Related Functional Requirements**:
- **FR11**: Task boundary detection
  - Keyword analysis for new task signals
  - Suggests context clearing at appropriate times
  - Configurable sensitivity (aggressive | balanced | conservative)
  - Respects rate limiting

**Deliverables**:
- Task boundary detection algorithm
- Keyword pattern library
- Sensitivity configuration system
- Integration with user-prompt-submit hook

---

### Story 4.5: Hook Configuration
`configure_hooks` tool, dynamic updates, validation

**Technical Requirements**:
- Implement `configure_hooks` MCP tool
- Support hookType parameter (pre-commit | user-prompt-submit | all)
- Support strictness parameter (strict | balanced | relaxed)
- Dynamic hook regeneration
- Validation before applying changes
- Conversational interface for configuration

**Related Functional Requirements**:
- **FR4**: `configure_hooks` tool specifications
- **FR12**: Pre-commit hook generation
  - Executes: lint → compile → test (fast-fail, in order)
  - Preset-specific strictness
  - Shows progress and clear error messages
  - Configurable timeout (default 2 minutes)
  - Skippable via `git commit --no-verify`

**Related Non-Functional Requirements**:
- **NFR10**: Conversational interface
- **NFR12**: Clear error messages with suggested fixes
- **NFR13**: Status updates during long-running operations

---

## Epic Deliverables

- Working hooks with < 100ms latency
- Configurable thresholds per preset
- Task boundary detection system
- `configure_hooks` MCP tool for dynamic updates
- Pre-commit hook generation with preset-specific strictness

---

## Cross-References

### Architecture Sections
- Hook Architecture (bash script structure)
- Hook Generator design
- State Management (session-isolated state)
- Configuration System

### Related Functional Requirements
- FR4: `configure_hooks` tool
- FR10: User prompt submit hook - Context monitoring
- FR11: Task boundary detection
- FR12: Pre-commit hook generation

### Related Epics
- Epic 1: MCP Server Foundation (dependency)
- Epic 2: Project Initialization (provides hook templates)
- Epic 6: Memory Management (hooks reference configuration)

---

## Success Criteria

- Context monitoring hook executes in < 100ms
- Warnings accurately detect high context usage
- Task boundary detection suggests clearing at appropriate times
- Pre-commit hooks execute quality gates in correct order
- Hooks are pure bash with zero runtime dependencies
- `configure_hooks` tool successfully updates hook behavior
- Rate limiting prevents warning spam
