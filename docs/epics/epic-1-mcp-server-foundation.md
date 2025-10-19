# Epic 1: MCP Server Foundation

**Time Estimate**: 3 weeks

**Goal**: Working MCP server with basic tools and transport

---

## Stories

### Story 1.1: MCP Server Setup
Initialize TypeScript project, MCP SDK integration, stdio transport

**Technical Requirements**:
- Set up TypeScript 5.x project with Node.js 18+ compatibility
- Integrate `@modelcontextprotocol/sdk` (official Anthropic SDK)
- Implement stdio transport for Claude integration
- Configure tsup for fast TypeScript bundling
- Set up project structure following MCP server architecture

**Related Functional Requirements**:
- **FR1**: MCP Server with stdio transport
  - Implements Model Context Protocol specification
  - Provides tools, resources, and prompts to Claude
  - Handles concurrent requests safely
  - Logs operations to `.contextualizer/mcp.log`
  - Graceful error handling with user-friendly messages

**Related Non-Functional Requirements**:
- **NFR19**: Node.js 18+ required only for MCP server, not for hooks or configs
- **NFR21**: Comprehensive logging to `.contextualizer/mcp.log` and `.contextualizer/hook-errors.log`

---

### Story 1.2: Tool Infrastructure
Tool registry, parameter validation, error handling, logging

**Technical Requirements**:
- Create tool registry system for MCP tools
- Implement parameter validation framework
- Design error handling and user-friendly error messages
- Set up logging infrastructure
- Create tool execution framework

**Related Functional Requirements**:
- **FR1**: MCP Server - tool invocation system
- **FR2-FR5**: Core MCP tools (to be implemented in other epics)

**Related Non-Functional Requirements**:
- **NFR1**: MCP tool invocation completes in < 2 seconds for typical operations
- **NFR5**: Idempotent operations (safe to re-run tools multiple times)
- **NFR12**: Clear error messages with suggested fixes

---

### Story 1.3: Resource System
Resource providers for config, diagnostics, presets

**Technical Requirements**:
- Create resource provider architecture
- Implement config resource
- Implement diagnostics resource
- Implement presets resource
- Design resource caching strategy

**Related Functional Requirements**:
- MCP resource system for configuration, diagnostics, and preset data
- Support for `.contextualizer/cache/` directory

**Related Non-Functional Requirements**:
- **NFR8**: Graceful degradation when dependencies unavailable (offline mode)
- **NFR21**: Comprehensive logging

---

### Story 1.4: Prompt System
Prompt templates for common workflows

**Technical Requirements**:
- Create prompt template system
- Implement setup wizard prompt
- Implement health check prompt
- Design prompt composition patterns

**Related Functional Requirements**:
- MCP prompt system for conversational workflows
- Integration with tool invocations

**Related Non-Functional Requirements**:
- **NFR10**: Conversational interface - Claude invokes tools based on natural language

---

### Story 1.5: Testing Infrastructure
Unit tests, integration tests, MCP protocol mocking

**Technical Requirements**:
- Set up Vitest testing framework
- Create unit test structure
- Create integration test patterns
- Implement MCP protocol mocking
- Create test fixtures
- Set up cross-platform testing (macOS/Linux)

**Related Non-Functional Requirements**:
- **NFR15**: macOS and Linux primary support
- Test coverage target: > 80% (Success Metric)

---

### Story 1.6: Documentation
README, API docs, contribution guide

**Technical Requirements**:
- Create comprehensive README.md
- Document MCP tool APIs
- Write contribution guidelines
- Create developer documentation
- Document installation and configuration

**Related Non-Functional Requirements**:
- **NFR11**: All generated files include comments explaining purpose and customization
- Documentation completeness: 100% of features documented (Success Metric)

---

### Story 1.7: CI/CD Pipeline
GitHub Actions workflow for automated testing, npm publishing, marketplace deployment, documentation site (GitHub Pages)

**Technical Requirements**:
- Set up GitHub Actions workflows
- Configure automated testing on push/PR
- Set up npm publishing automation
- Configure marketplace deployment
- Set up GitHub Pages for documentation site
- Implement version management and release automation

**Related Non-Functional Requirements**:
- **NFR9**: MCP server auto-recovery on crash (restart mechanism)
- Infrastructure: CI/CD via GitHub Actions (Resource Requirements)

**Deliverables**:
- Automated test execution on all commits
- Automated npm package publishing on release
- Automated marketplace deployment
- Automated documentation site deployment
- Release workflow with version tagging

---

## Epic Deliverables

- MCP server that can be invoked by Claude
- Basic tool/resource/prompt infrastructure
- Automated build and deployment pipeline
- Comprehensive test coverage
- Complete documentation

---

## Cross-References

### Architecture Sections
- System Overview (diagram)
- MCP Server Architecture
- Technology Stack
- Server Structure

### Related Epics
- Epic 2: Project Initialization (depends on this)
- Epic 3: Conflict Management (depends on this)
- Epic 4: Context Management Hooks (depends on this)
- Epic 5: Diagnostics & Best Practices (depends on this)
- Epic 6: Memory Management (depends on this)

---

## Success Criteria

- MCP server successfully communicates with Claude via stdio
- Tool registry can register and invoke tools
- Resource providers can serve configuration data
- Prompt system can execute conversational workflows
- Test coverage > 80%
- All documentation complete
- CI/CD pipeline fully functional with automated deployments
