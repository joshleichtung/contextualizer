# Contextualizer Front-End Specification

**Version**: 1.0.0
**Date**: 2025-10-19
**Author**: Sally (UX Expert)
**Status**: Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Principles](#design-principles)
3. [Conversational UX Design](#conversational-ux-design)
4. [CLI Installation Experience](#cli-installation-experience)
5. [Marketplace Presence](#marketplace-presence)
6. [Terminal Output Design](#terminal-output-design)
7. [Future Phases: Web-Based UI](#future-phases-web-based-ui)
8. [Accessibility & Inclusive Design](#accessibility--inclusive-design)
9. [Voice & Tone Guidelines](#voice--tone-guidelines)
10. [Component Specifications](#component-specifications)

---

## Executive Summary

Contextualizer is a **conversation-first** development tool where the primary interface is natural language interaction between the user and Claude. This specification defines how Claude should present information, guide users through complex operations, and maintain cognitive clarity in text-based interfaces.

**Key UX Constraint**: Users interact primarily through **conversational natural language**, not traditional GUIs. This requires:
- **Scannability**: Dense information presented in digestible chunks
- **Progressive disclosure**: Complex details revealed only when needed
- **Clear mental models**: Consistent terminology and interaction patterns
- **Cognitive load reduction**: Minimize decisions, maximize clarity

---

## Design Principles

### Principle 1: Conversation Over Configuration

**Definition**: Users should express intent in natural language, not memorize syntax or navigate config files.

**Implementation**:
- Claude interprets user intent and invokes appropriate MCP tools
- Natural phrasing like "make it less strict" instead of flags like `--strictness=relaxed`
- Contextual suggestions based on project state

**Example**:
```
❌ Bad:
User must type: /contextualizer configure-hooks --strictness relaxed --pre-commit false

✅ Good:
User says: "Make the hooks less strict for now, we're prototyping"
Claude responds: "I've relaxed the quality gates - pre-commit now shows warnings
without blocking commits. ESLint and TypeScript checks still run but won't fail
your commits during rapid iteration."
```

### Principle 2: Progressive Disclosure

**Definition**: Show essential information first, reveal complexity only when users need it.

**Implementation**:
- Success/failure status first
- Summary of changes second
- Detailed breakdown available on request
- Warning/error details expandable

**Example**:
```
✅ Good (Progressive):
"Setup complete! Your project now has:
• Context monitoring (alerts at 75% and 90%)
• Pre-commit quality gates (ESLint, TypeScript, tests)
• 3 specialized skills (Next.js, React, TypeScript)
• 3 subagents (code reviewer, test architect, doc writer)

Would you like to see the detailed configuration?"

❌ Bad (Information Dump):
"Setup complete! I created the following files:
- .claude/hooks/user-prompt-submit.sh (context monitoring with 75% warning...)
- .claude/hooks/pre-commit.sh (runs eslint with --max-warnings 0...)
- .claude/CLAUDE.md with sections for frameworks, patterns, conventions...
[20 more lines of technical details]"
```

### Principle 3: Clear Mental Models

**Definition**: Use consistent terminology and interaction patterns throughout all conversations.

**Terminology Standards**:
- **Preset**: Pre-configured template (minimal, web-fullstack, hackathon)
- **Hook**: Script that runs on events (context monitoring, quality gates)
- **Skill**: Domain expertise that auto-loads when relevant
- **Subagent**: Specialized assistant for focused tasks
- **Memory**: Project knowledge stored in CLAUDE.md
- **Diagnostics**: Health check reports from "doctor"

**Avoid mixing metaphors** - don't call the same thing "template", "configuration", and "preset" interchangeably.

### Principle 4: Scannable Text Formatting

**Definition**: Dense information must be visually structured for rapid comprehension.

**Visual Hierarchy**:
1. **Status indicators** (✅ ❌ ⚠️) - Instant recognition
2. **Section headers** - Clear topic boundaries
3. **Bullet lists** - Related items grouped
4. **Code blocks** - Technical details isolated
5. **Spacing** - Breathing room between concepts

**Example**:
```
✅ Good (Scannable):
Doctor Report - 12/15 Checks Passed

✅ Passing (10):
• Context monitoring configured correctly
• Hooks have proper permissions
• CLAUDE.md structure valid
• Git repository detected

⚠️ Warnings (2):
• Context7 MCP not configured - Install for framework docs
• No test coverage data - Add test runner

❌ Failing (3):
• Pre-commit hook syntax error (line 42)
  Fix: Remove trailing semicolon
• CLAUDE.md missing memory section
  Fix: Run manage_memory to add section
• Hook execution timeout too high (5min)
  Fix: Reduce to 2min for faster feedback

Would you like me to auto-fix the 2 fixable issues?

❌ Bad (Wall of Text):
"Doctor report completed with the following results: context monitoring is
configured correctly and hooks have proper permissions and CLAUDE.md structure
is valid and git repository was detected successfully however there are some
warnings including Context7 MCP is not configured which you should install
for framework documentation and there's no test coverage data so you should
add a test runner and there are also failures including..."
```

### Principle 5: Actionable Feedback

**Definition**: Every diagnostic, warning, or error must include a clear next action.

**Pattern**:
1. **What happened** (status)
2. **Why it matters** (context)
3. **What to do** (action)

**Example**:
```
✅ Good (Actionable):
⚠️ Context usage at 82% (warning threshold: 75%)

Why this matters:
When context exceeds 100%, Claude may lose track of earlier conversation
history, leading to inconsistent responses or forgotten decisions.

Recommended actions:
1. Clear conversation history for this session
2. Move technical details from conversation to CLAUDE.md
3. Use memory imports to organize large documentation

Would you like me to optimize your memory structure?

❌ Bad (Vague):
"Context is getting high. You should probably do something about it."
```

### Principle 6: Respectful Intelligence

**Definition**: Assume users are competent developers; explain *why* not *how* unless asked.

**Implementation**:
- Explain tradeoffs and implications
- Avoid patronizing language ("simply", "just", "easy")
- Provide rationale for recommendations
- Support informed decision-making

**Example**:
```
✅ Good (Respectful):
"I recommend the 'strict' preset for this production codebase. It enforces
ESLint, TypeScript checks, and test runs before every commit - slower iteration
but catches issues early. If you're prototyping and prefer speed, 'relaxed'
mode runs the same checks but doesn't block commits."

❌ Bad (Patronizing):
"You should definitely use strict mode! It's super important and you'll
thank me later. Just trust me on this one - it's the right choice for
production code."
```

---

## Conversational UX Design

### MCP Tool Response Formatting

When Claude invokes Contextualizer MCP tools, responses should follow this structured format:

#### Success Response Template

```
[STATUS EMOJI] [ACTION COMPLETED] - [BRIEF SUMMARY]

[WHAT CHANGED]:
• [Key change 1]
• [Key change 2]
• [Key change 3]

[OPTIONAL: NEXT STEPS OR CONTEXT]

[OPTIONAL: OFFER DETAILED VIEW]
```

**Example - init_project Success**:
```
✅ Project initialized with Web-Fullstack preset

Configuration created:
• Context monitoring at 75%/90% thresholds
• Pre-commit hooks for ESLint, TypeScript, and tests
• 3 skills: Next.js 15, React 19, TypeScript 5
• 3 subagents: code-reviewer, test-architect, doc-writer
• Memory configured with App Router patterns

Installation time: 8 seconds

Your project is now optimized for AI-first development.
All generated files include comments explaining customization options.

Want to see what the pre-commit hook will check?
```

#### Warning Response Template

```
⚠️ [ACTION COMPLETED WITH WARNINGS] - [BRIEF SUMMARY]

[WHAT SUCCEEDED]:
• [Success item 1]
• [Success item 2]

[WARNINGS]:
• [Warning 1 - why it matters - how to resolve]
• [Warning 2 - why it matters - how to resolve]

[RECOMMENDED ACTIONS]
```

**Example - init_project with Conflicts**:
```
⚠️ Project initialized with conflicts detected

Successfully created:
• Context monitoring hooks
• Quality gate configuration
• Skill files for Next.js, React, TypeScript

Conflicts found:
• Existing .claude/CLAUDE.md detected
  Contains custom team conventions - should preserve

• Existing .claude/hooks/pre-commit found
  Custom linting rules - may conflict with Contextualizer's

Resolution options:
1. Merge (recommended) - Keep your custom content, add Contextualizer sections
2. Backup and replace - Save existing files to .contextualizer/backup-[timestamp]
3. View diff - See what would change before deciding

Which approach would you prefer?
```

#### Error Response Template

```
❌ [OPERATION FAILED] - [BRIEF REASON]

[WHAT WENT WRONG]:
[Clear explanation of the error]

[WHY IT HAPPENED]:
[Root cause if known]

[HOW TO FIX]:
1. [Step 1]
2. [Step 2]
3. [Step 3]

[OPTIONAL: OFFER TO HELP FIX]
```

**Example - init_project Failure**:
```
❌ Initialization failed - Permission denied

What went wrong:
Unable to create .claude/hooks/ directory

Why it happened:
The .claude/ directory exists but is read-only. This typically occurs when:
• Files were created by a different user
• Directory permissions were restricted by security policy

How to fix:
1. Check ownership: ls -la .claude/
2. Grant write permissions: chmod -R u+w .claude/
3. Or run as directory owner: sudo -u [owner] [command]

Would you like me to diagnose the permission issue in detail?
```

### Diagnostics Report Format (run_doctor)

Diagnostics should be presented in a **scannable, status-first** format:

```
Doctor Report - [PASSED]/[TOTAL] Checks Passed

[If all passing]
✅ All checks passed! Your project follows Anthropic best practices.

[If failures/warnings]
## ✅ Passing ([COUNT])
• [Check name 1]
• [Check name 2]
• [Check name 3]
[Collapse if > 5 passing checks]

## ⚠️ Warnings ([COUNT])
• [Warning 1 title]
  Impact: [Why this matters]
  Recommendation: [What to do]

• [Warning 2 title]
  Impact: [Why this matters]
  Recommendation: [What to do]

## ❌ Failing ([COUNT])
• [Failure 1 title]
  Problem: [Specific issue]
  Fix: [Concrete action] [AUTO-FIXABLE indicator if applicable]

• [Failure 2 title]
  Problem: [Specific issue]
  Fix: [Concrete action]

---
[COUNT] issues can be auto-fixed. Run with auto-fix?
```

**Example - Full Diagnostics Report**:
```
Doctor Report - 12/15 Checks Passed

## ✅ Passing (10)
• Context monitoring configured
• Hook execution permissions correct
• CLAUDE.md structure valid
• Git repository detected
• Framework versions documented
• Memory hierarchy correct
• Preset configuration valid
• Backup system functional
• State tracking isolated
• Config schema validated

## ⚠️ Warnings (2)
• Context7 MCP server not configured
  Impact: Claude won't have access to official Next.js/React documentation
  Recommendation: Add Context7 to claude_desktop_config.json
  Library IDs: /vercel/next.js/v15, /facebook/react/v19

• Test coverage metrics unavailable
  Impact: Can't track test quality trends or identify untested code
  Recommendation: Add Vitest coverage reporting to package.json

## ❌ Failing (3)
• Pre-commit hook has syntax error (line 42: unexpected semicolon)
  Problem: Hook will fail on every commit attempt
  Fix: Remove trailing semicolon from line 42 [AUTO-FIXABLE]

• CLAUDE.md missing required memory sections (architecture, conventions)
  Problem: Claude lacks context about project structure and coding standards
  Fix: Run manage_memory(sections=['architecture', 'conventions']) [AUTO-FIXABLE]

• Hook execution timeout set to 5 minutes (recommended: 2 minutes)
  Problem: Developers wait too long for slow test suites
  Recommendation: Reduce timeout or optimize tests to complete faster

---
2 issues can be auto-fixed. Apply fixes now?
```

### Conflict Resolution Prompts

When Contextualizer detects conflicts with existing files, present a **decision-focused** prompt:

```
⚠️ Conflict detected: [FILE PATH]

Current state:
[Brief description of existing file]

Proposed change:
[Brief description of what Contextualizer wants to do]

[DIFF PREVIEW - first 10 lines]
[If diff is long, offer "View full diff"]

Options:
1. Merge (recommended for most cases)
   Keeps: Your custom content
   Adds: Contextualizer sections with markers for updates
   Best for: Preserving team conventions while adding AI features

2. Backup and replace
   Keeps: Full backup in .contextualizer/backup-[timestamp]/
   Adds: Fresh Contextualizer configuration
   Best for: Starting fresh with recommended setup

3. Skip this file
   Keeps: Current file unchanged
   Adds: Nothing
   Best for: Manual configuration preferred

4. View full diff
   Shows: Complete before/after comparison

Which option would you prefer?
```

**Example - CLAUDE.md Conflict**:
```
⚠️ Conflict detected: .claude/CLAUDE.md

Current state:
Your CLAUDE.md (850 lines) contains:
• Custom team coding standards
• API documentation for internal services
• Deployment workflow instructions

Proposed change:
Add Contextualizer sections:
• Framework patterns (Next.js 15 App Router)
• MCP server configuration (Context7 setup)
• Subagent definitions
• Memory organization strategy

--- Diff Preview ---
+++ .claude/CLAUDE.md
@@ line 1
 # Project Memory

 [Your existing content preserved]

+<!-- CONTEXTUALIZER-MANAGED-START: framework-patterns -->
+## Framework Patterns
+
+### Next.js 15 App Router
+- Use Server Components by default
+- Add 'use client' only when needed for interactivity
+[... 8 more lines]

View full diff? (280 lines)

Options:
1. Merge - Keep your content + add Contextualizer sections
2. Backup and replace - Save to backup-2025-10-19-14-30/
3. Skip - Don't modify CLAUDE.md
4. View full diff

Recommendation: Option 1 (Merge) preserves your team's valuable knowledge
while adding AI-optimized sections that can be updated independently.

Your choice?
```

### Configuration Update Confirmations

When users request configuration changes conversationally, confirm with a **before/after summary**:

```
Configuration updated: [SETTING NAME]

Before:
[Previous value and behavior]

After:
[New value and behavior]

Impact:
[What changes in practice]

[OPTIONAL: Tradeoffs or considerations]

Changes applied to:
• [Affected file 1]
• [Affected file 2]

[OPTIONAL: Related recommendations]
```

**Example - Strictness Change**:
```
Configuration updated: Hook strictness

Before:
Strict mode - Pre-commit hooks block on any ESLint errors, TypeScript
errors, or test failures. Average commit time: 45 seconds.

After:
Relaxed mode - Pre-commit hooks show warnings but don't block commits.
Checks still run for visibility. Average commit time: 5 seconds.

Impact:
• Faster iteration during prototyping
• Risk of committing code with linting/type errors
• CI/CD pipeline will still catch issues before deployment

Tradeoff:
Speed vs. early error detection. Relaxed mode is ideal for rapid iteration
phases - switch back to strict before production releases.

Changes applied to:
• .contextualizer/config.yaml (strictness: relaxed)
• .claude/hooks/pre-commit (exit 0 on failures)

Related recommendation:
Consider setting up CI/CD hooks to enforce strict checks on pull requests
even with relaxed local commits.
```

### Context Monitoring Messages

Context monitoring hooks should display warnings with **actionable guidance**:

**75% Warning (First occurrence)**:
```
⚠️ Context at 75% of recommended limit

Current usage: ~45,000 tokens (out of 60,000 safe threshold)

Why this matters:
Context overflow can cause Claude to forget earlier decisions, leading to
inconsistent code patterns or redundant questions.

Recommended actions:
• Clear conversation history after completing current task
• Move technical details to CLAUDE.md or skill files
• Use memory imports for large documentation sections

I'll remind you again at 90% if context continues growing.
Continue working - no action required right now.
```

**90% Warning (Critical threshold)**:
```
🚨 Context at 90% - Clear soon to avoid overflow

Current usage: ~54,000 tokens (limit: 60,000)

Critical threshold reached. Within 5-10 exchanges, you may experience:
• Loss of earlier conversation context
• Repeated questions about project setup
• Inconsistent code patterns

Immediate actions:
1. Clear conversation history (recommended)
2. Save important decisions to CLAUDE.md
3. Checkpoint current work before clearing

Alternative:
If you're in the middle of complex work, I can help optimize your memory
structure to reduce token usage without losing critical context.

What would you like to do?
```

**Task Boundary Detection**:
```
✅ Task completed: User authentication feature

I noticed we've finished implementing authentication and all tests pass.

Context status: 68% (growing trend over last hour)

Suggestion:
This is a good checkpoint to clear conversation history. We can document the
authentication implementation in CLAUDE.md so context is preserved for future
sessions.

Would you like me to:
1. Clear history and checkpoint progress
2. Continue with current context
3. Optimize memory structure first, then clear
```

---

## CLI Installation Experience

### Installation Flow

The installation experience should guide users through three stages with clear progress indication:

#### Stage 1: Package Installation

```bash
$ npm install -g @contextualizer/mcp

Installing @contextualizer/mcp...

✅ Package installed successfully

Next steps:
1. Add Contextualizer to your Claude Code configuration
2. Restart Claude Code to activate

Run 'contextualizer setup' for guided configuration.
```

#### Stage 2: Configuration Wizard

```bash
$ contextualizer setup

Contextualizer Setup Wizard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This will add Contextualizer MCP server to your Claude Code configuration.

Location: ~/.config/claude/claude_desktop_config.json

Current MCP servers configured: 2
• context7 (documentation lookup)
• playwright (browser testing)

Add Contextualizer? (y/n): y

✅ Configuration updated

Added to claude_desktop_config.json:
{
  "mcpServers": {
    "contextualizer": {
      "command": "npx",
      "args": ["@contextualizer/mcp"]
    }
  }
}

⚠️ Important: Restart Claude Code to activate the MCP server

After restart, try:
• "Set up this project for AI development"
• "Run diagnostics on my configuration"
• "Make the pre-commit hooks less strict"

Restart Claude Code now? (y/n):
```

#### Stage 3: First-Run Experience

When user first invokes Contextualizer in Claude Code:

```
👋 Welcome to Contextualizer!

I can help optimize your project for AI-first development through:
• Intelligent project setup with preset templates
• Real-time context monitoring and management
• Quality gates and pre-commit hooks
• Comprehensive diagnostics and health checks
• Memory and skill management

What would you like to do?
1. Set up this project (new or existing)
2. Run diagnostics on current configuration
3. Learn about presets and options
4. View documentation

Just describe what you need in natural language, and I'll handle the details.
```

### Installation Error States

#### Missing Configuration File

```bash
$ contextualizer setup

❌ Configuration file not found

Expected location: ~/.config/claude/claude_desktop_config.json

This file should exist if Claude Code is installed. Possible causes:
• Claude Code not installed yet
• Non-standard installation location
• Permissions issue preventing file access

Troubleshooting steps:
1. Verify Claude Code installation:
   which claude-code

2. Check for config in alternate location:
   find ~ -name "claude_desktop_config.json" 2>/dev/null

3. Create minimal config manually:
   mkdir -p ~/.config/claude
   echo '{"mcpServers":{}}' > ~/.config/claude/claude_desktop_config.json

Need help? Visit: https://docs.contextualizer.dev/installation
```

#### Permission Denied

```bash
$ contextualizer setup

❌ Permission denied: ~/.config/claude/claude_desktop_config.json

Unable to write to configuration file.

Quick fix:
sudo chown $USER:$USER ~/.config/claude/claude_desktop_config.json

Or run with elevated permissions:
sudo contextualizer setup

After fixing permissions, run 'contextualizer setup' again.
```

#### MCP Server Conflict

```bash
$ contextualizer setup

⚠️ MCP server 'contextualizer' already configured

Current configuration:
{
  "command": "node",
  "args": ["/old/path/to/contextualizer"]
}

Options:
1. Update to latest version (recommended)
   Replaces: Old path with @contextualizer/mcp

2. Keep existing configuration
   No changes made

3. View difference
   Compare old vs new configuration

Which option? (1/2/3):
```

### Uninstallation Experience

```bash
$ contextualizer uninstall

Contextualizer Uninstallation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This will remove Contextualizer from your system.

What gets removed:
• Global npm package (@contextualizer/mcp)
• MCP server configuration (claude_desktop_config.json)

What gets preserved:
• Project configurations (.contextualizer/ directories)
• Generated hooks (.claude/hooks/)
• Memory files (CLAUDE.md)
• Skills and subagents

Preservation rationale:
Your project configurations will continue working without the MCP server.
You can reinstall Contextualizer later without losing customizations.

Proceed with uninstallation? (y/n): y

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ npm package removed
✅ MCP configuration removed

To complete removal, restart Claude Code.

Your project files remain intact. To remove them:
  rm -rf .contextualizer .claude/hooks/*contextualizer*

Uninstallation complete.
```

---

## Marketplace Presence

### Plugin Listing Design

**Plugin Marketplace Entry**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contextualizer - AI-First Development Framework
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transform your Claude Code projects into AI-optimized development
environments through conversational configuration and real-time diagnostics.

✨ Key Features:
• One-command project setup with intelligent presets
• Real-time context monitoring to prevent overflow
• Quality gates and pre-commit hooks (configurable strictness)
• Comprehensive health checks with auto-fix capabilities
• Smart conflict resolution for existing projects

🎯 Perfect For:
• Next.js, React, and TypeScript projects
• Teams standardizing on AI-assisted development
• Rapid prototyping with quality safeguards

📦 Included:
• 3 preset templates (Minimal, Web-Fullstack, Hackathon)
• 5+ specialized skills (Next.js, React, TypeScript experts)
• 3 pre-configured subagents (Code review, Testing, Documentation)
• MCP server with 5 core tools
• Comprehensive diagnostic framework

⚡ Installation: < 2 minutes
🔧 Setup: < 30 seconds per project

Installation:
/plugin install contextualizer

After installation, try:
"Set up this Next.js project for AI development"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version: 1.0.0  |  License: MIT  |  Author: Contextualizer Team
Downloads: 2.3k  |  Rating: 4.8/5.0  |  Reviews: 47
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Screenshots / ASCII Demos

**Screenshot 1: Setup Flow**
```
┌─────────────────────────────────────────────────────────────┐
│ User: Set up this Next.js project for AI development       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Claude: I'll set up your Next.js project with the         │
│ Web-Fullstack preset optimized for Next.js 15 + React 19.  │
│                                                              │
│ Analyzing project...                                        │
│ ✅ Detected: Next.js 15.0.0, React 19.0.0, TypeScript 5.3  │
│                                                              │
│ Creating configuration...                                   │
│ ✅ Context monitoring (75%/90% thresholds)                 │
│ ✅ Pre-commit hooks (ESLint, TypeScript, tests)            │
│ ✅ Skills: nextjs-expert, react-expert, typescript-expert  │
│ ✅ Subagents: code-reviewer, test-architect, doc-writer    │
│ ✅ Memory with App Router patterns                         │
│                                                              │
│ Setup complete! (8 seconds)                                 │
│                                                              │
│ Your project is now optimized for AI-first development.    │
└─────────────────────────────────────────────────────────────┘
```

**Screenshot 2: Diagnostics**
```
┌─────────────────────────────────────────────────────────────┐
│ User: Check if everything is configured correctly          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Claude: Running diagnostics...                              │
│                                                              │
│ Doctor Report - 12/15 Checks Passed                        │
│                                                              │
│ ✅ Passing (10)                                             │
│ • Context monitoring configured                             │
│ • Hooks have proper permissions                             │
│ • CLAUDE.md structure valid                                 │
│ • Git repository detected                                   │
│ [+ 6 more]                                                  │
│                                                              │
│ ⚠️ Warnings (2)                                             │
│ • Context7 MCP not configured                               │
│   Recommendation: Add for framework documentation           │
│                                                              │
│ ❌ Failing (3)                                              │
│ • Pre-commit hook syntax error (line 42)                   │
│   Fix: Remove trailing semicolon [AUTO-FIXABLE]            │
│                                                              │
│ 2 issues can be auto-fixed. Apply fixes?                   │
└─────────────────────────────────────────────────────────────┘
```

**Screenshot 3: Configuration Update**
```
┌─────────────────────────────────────────────────────────────┐
│ User: Make the hooks less strict, we're in rapid           │
│       prototyping mode                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Claude: Configuration updated: Hook strictness              │
│                                                              │
│ Before: Strict mode - blocks commits on errors             │
│ After: Relaxed mode - shows warnings, doesn't block        │
│                                                              │
│ Impact:                                                      │
│ • Faster commits (~5s instead of ~45s)                     │
│ • Risk of committing linting/type errors                   │
│ • CI/CD still enforces quality gates                       │
│                                                              │
│ Perfect for prototyping - switch back to strict before     │
│ production release.                                         │
│                                                              │
│ Changes applied to:                                         │
│ • .contextualizer/config.yaml                              │
│ • .claude/hooks/pre-commit                                 │
└─────────────────────────────────────────────────────────────┘
```

### Documentation Structure

**Marketplace Documentation Tabs**:

1. **Overview** (Landing page)
   - What is Contextualizer?
   - Key benefits and features
   - Quick start guide
   - Use cases

2. **Installation**
   - npm package installation
   - Configuration wizard
   - Verification steps
   - Troubleshooting

3. **Presets**
   - Minimal preset details
   - Web-Fullstack preset details
   - Hackathon preset details
   - Custom preset creation

4. **Tools & Features**
   - init_project
   - run_doctor
   - configure_hooks
   - manage_memory
   - get_config / set_config

5. **Examples**
   - New project setup
   - Existing project migration
   - Team onboarding
   - Configuration customization

6. **FAQ**
   - Common issues
   - Best practices
   - Performance optimization
   - Integration with other MCP servers

7. **API Reference**
   - MCP tool signatures
   - Configuration schema
   - Preset format
   - Hook API

---

## Terminal Output Design

### Color Scheme

**Status Colors** (ANSI escape codes):
```
✅ Success:   Green (32)     - \033[32m
❌ Error:     Red (31)       - \033[31m
⚠️ Warning:   Yellow (33)    - \033[33m
ℹ️ Info:      Cyan (36)      - \033[36m
🔄 Progress:  Blue (34)      - \033[34m
```

**Syntax Highlighting** (for code blocks in terminal):
```
Keywords:     Magenta (35)
Strings:      Green (32)
Numbers:      Yellow (33)
Comments:     Gray (90)
Operators:    Cyan (36)
```

**Semantic Colors**:
```
File paths:           Cyan (36) - .claude/hooks/pre-commit
Configuration keys:   Blue (34) - strictness:
Configuration values: Green (32) - relaxed
Headings:            Bold (1) + White (37)
Emphasis:            Bold (1)
Dimmed text:         Gray (90) - for less important details
```

### Hook Output Design

**Pre-commit Hook** (successful run):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pre-Commit Quality Gates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Running ESLint...
   ✅ 0 errors, 0 warnings (23 files)

🔍 Running TypeScript check...
   ✅ No type errors found

🔍 Running tests...
   ✅ 47 tests passed (3.2s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All checks passed (8.4s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Pre-commit Hook** (with errors - strict mode):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pre-Commit Quality Gates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Running ESLint...
   ❌ 3 errors, 2 warnings

   Errors:
   • src/auth.ts:45 - 'user' is assigned but never used
   • src/api.ts:12 - Missing return type annotation
   • src/utils.ts:8 - Unexpected console.log statement

   Warnings:
   • src/config.ts:3 - Prefer const for immutable values
   • src/types.ts:15 - Consider using interface instead of type

🔍 Running TypeScript check...
   ⏭️  Skipped (ESLint failed)

🔍 Running tests...
   ⏭️  Skipped (ESLint failed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Commit blocked - Fix 3 errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick fixes:
• Remove unused variables
• Add return type annotations
• Remove console.log (or disable rule if intentional)

To commit anyway (not recommended):
git commit --no-verify

To adjust strictness:
Ask Claude: "Make the pre-commit hooks less strict"
```

**Pre-commit Hook** (relaxed mode with warnings):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pre-Commit Quality Gates (Relaxed Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Running ESLint...
   ⚠️ 3 errors, 2 warnings (not blocking)

🔍 Running TypeScript check...
   ⚠️ 1 type error (not blocking)

🔍 Running tests...
   ✅ 47 tests passed (3.2s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Commit allowed with warnings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fix before production:
• 3 ESLint errors
• 1 TypeScript error

CI/CD will enforce strict checks on pull requests.
```

**Context Monitoring Hook** (user-prompt-submit):
```
[Appears at bottom of prompt submission, non-blocking]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Context at 76% - Consider clearing after this task
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
[Critical threshold]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 Context at 91% - Clear soon to avoid overflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Progress Indicators

**For Long-Running Operations** (> 2 seconds):

**Spinner Style** (for indeterminate operations):
```
Analyzing project structure... ⠋
Analyzing project structure... ⠙
Analyzing project structure... ⠹
Analyzing project structure... ⠸
Analyzing project structure... ⠼
Analyzing project structure... ✅ Complete
```

**Progress Bar** (for determinate operations):
```
Generating hooks: [████████░░] 80% (4/5 files)
Generating hooks: [██████████] 100% ✅ Complete (5/5 files)
```

**Multi-Step Progress** (for complex operations):
```
Setting up project...

[1/5] ✅ Analyzing dependencies (0.4s)
[2/5] 🔄 Generating configuration...
[3/5] ⏳ Creating hooks
[4/5] ⏳ Installing skills
[5/5] ⏳ Updating memory

Total progress: [████░░░░░░] 40%
```

**Completion Summary**:
```
Setting up project...

[1/5] ✅ Analyzing dependencies (0.4s)
[2/5] ✅ Generating configuration (0.8s)
[3/5] ✅ Creating hooks (1.2s)
[4/5] ✅ Installing skills (0.6s)
[5/5] ✅ Updating memory (0.3s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Setup complete in 3.3 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Statusline Design (Optional Future Enhancement)

If Contextualizer implements a custom statusline:

```
┌─────────────────────────────────────────────────────────────┐
│ Context: 76% ⚠️  | Preset: web-fullstack | Hooks: ✅ Active│
└─────────────────────────────────────────────────────────────┘
```

**States**:
- Context: `45% ✅` (green < 75%), `76% ⚠️` (yellow 75-90%), `92% 🚨` (red > 90%)
- Preset: `minimal`, `web-fullstack`, `hackathon`, `custom`
- Hooks: `✅ Active`, `⚠️ Errors`, `❌ Disabled`
- Quality: `✅ Passing`, `⚠️ Warnings`, `❌ Failing`

**Interactive Elements**:
- Click context percentage → Show detailed breakdown
- Click preset → View preset details
- Click hooks status → Run diagnostics

---

## Future Phases: Web-Based UI

### Phase 2+: Configuration Dashboard

**Purpose**: Visual configuration interface for teams and enterprise users who prefer GUI over conversational config.

**Dashboard Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ Contextualizer Configuration                    [v1.2.0]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Overview] [Presets] [Hooks] [Memory] [Skills] [Agents]   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Project Status                          Last Updated: 2m   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│  ✅ Project Health: Good (12/15 checks)                     │
│                                                              │
│  Context Usage         Quality Gates       Active Skills    │
│  ┌────────────┐       ┌────────────┐     ┌──────────────┐  │
│  │ 76%  ⚠️    │       │ ✅ Passing │     │ nextjs (3)   │  │
│  │ [████████] │       │ 0 errors   │     │ react (2)    │  │
│  │ Warning    │       │ 2 warnings │     │ typescript(1)│  │
│  └────────────┘       └────────────┘     └──────────────┘  │
│                                                              │
│  Recent Activity                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • 2 min ago - Pre-commit hook passed (8.4s)                │
│  • 15 min ago - Configuration updated (strictness: relaxed) │
│  • 1 hour ago - Doctor run completed (12/15 passing)        │
│                                                              │
│  ⚠️ Warnings (2)                                            │
│  • Context7 MCP not configured                              │
│  • Test coverage metrics unavailable                        │
│                                                              │
│  [View Full Report] [Run Diagnostics] [Optimize Config]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Preset Configuration Screen**:

```
┌─────────────────────────────────────────────────────────────┐
│ Configure Preset                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Active Preset: Web-Fullstack                    [Change]   │
│                                                              │
│  Context Monitoring                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Warning Threshold:  [75]% ────●────────── (0-100)      │ │
│  │ Critical Threshold: [90]% ────────────●── (0-100)      │ │
│  │                                                          │ │
│  │ Boundary Detection: ● Balanced  ○ Aggressive  ○ Off    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Quality Gates                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Pre-commit Hooks: [Enabled ✓]                          │ │
│  │                                                          │ │
│  │ Strictness:       ○ Strict  ● Balanced  ○ Relaxed      │ │
│  │                                                          │ │
│  │ Checks:                                                  │ │
│  │  ☑ ESLint          Fail on: [Errors ▼]                 │ │
│  │  ☑ TypeScript      Fail on: [Errors ▼]                 │ │
│  │  ☑ Tests           Fail on: [Failures ▼] (120s timeout)│ │
│  │  ☐ Prettier        Fail on: [Never ▼]                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Reset to Defaults] [Save Changes] [Preview Impact]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Diagnostics Visualization**:

```
┌─────────────────────────────────────────────────────────────┐
│ Project Diagnostics                          Run Doctor 🔄  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Health Score: 80% (12/15 checks passing)                   │
│                                                              │
│  [█████████████████████░░░░░] 80%                           │
│                                                              │
│  ✅ Passing (10)                        [Expand All]        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✓ Context monitoring configured                             │
│  ✓ Hook execution permissions correct                        │
│  ✓ CLAUDE.md structure valid                                 │
│  ✓ Git repository detected                                   │
│  [+ 6 more]                                                  │
│                                                              │
│  ⚠️ Warnings (2)                        [Expand]            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ⚠ Context7 MCP not configured                              │
│    Impact: No official framework documentation access        │
│    Fix: [Auto-Configure Context7]                           │
│                                                              │
│  ⚠ Test coverage metrics unavailable                        │
│    Impact: Can't track test quality trends                  │
│    Fix: [View Instructions]                                 │
│                                                              │
│  ❌ Failing (3)                         [Expand]            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✗ Pre-commit hook syntax error (line 42)                   │
│    Problem: Unexpected semicolon will cause hook failures   │
│    Fix: [Auto-Fix] [View Code] [Dismiss]                   │
│                                                              │
│  [... 2 more failures]                                       │
│                                                              │
│  [Auto-Fix All (2)] [Export Report] [Schedule Check]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Design Principles

1. **Glanceable Status**: Key metrics visible without scrolling
2. **Progressive Detail**: Expand sections for more information
3. **Actionable Insights**: Every issue has a clear fix button
4. **Visual Hierarchy**: Use color, size, spacing to guide attention
5. **Consistent Patterns**: Same interaction patterns throughout

**Color Palette** (Web UI):
```
Success:   #10B981 (Green)
Warning:   #F59E0B (Amber)
Error:     #EF4444 (Red)
Info:      #3B82F6 (Blue)
Neutral:   #6B7280 (Gray)

Background:     #FFFFFF (White) / #111827 (Dark)
Surface:        #F9FAFB (Light Gray) / #1F2937 (Dark Gray)
Border:         #E5E7EB (Gray) / #374151 (Dark Border)
Text Primary:   #111827 (Dark) / #F9FAFB (Light)
Text Secondary: #6B7280 (Gray) / #9CA3AF (Light Gray)
```

---

## Accessibility & Inclusive Design

### Screen Reader Support

**Terminal Output**:
- Use semantic ANSI codes that screen readers can interpret
- Provide text alternatives for emoji (e.g., "warning" not just "⚠️")
- Structure output with clear headings and sections

**Example - Screen Reader Friendly**:
```
✅ Success: Project initialized

[Instead of just emoji, include text]

Success: Project initialized
Status: OK
```

**Web UI** (Future):
- ARIA labels for all interactive elements
- Keyboard navigation for all actions
- Focus indicators for current element
- Screen reader announcements for dynamic updates

### Cognitive Load Reduction

**Chunking Information**:
- Maximum 7±2 items per list (Miller's Law)
- Group related items under clear headings
- Use progressive disclosure for complex details

**Reducing Decision Fatigue**:
- Provide recommended options (marked clearly)
- Explain tradeoffs for non-default choices
- Allow "undo" for reversible operations

**Example - Decision Support**:
```
Options:
1. Merge (recommended for most cases) ⭐
   Best for: Preserving existing customizations

2. Backup and replace
   Best for: Starting fresh with recommended setup

3. Skip
   Best for: Manual configuration preferred

Recommendation: Option 1 preserves your team's knowledge while adding
AI-optimized sections.
```

### Internationalization Readiness (Future)

**Text Externalization**:
- All user-facing strings in separate locale files
- No hardcoded messages in code
- Support for RTL languages

**Cultural Sensitivity**:
- Avoid idioms that don't translate well
- Use universal symbols (✅ ❌ ⚠️ are widely understood)
- Date/time formatting per locale

---

## Voice & Tone Guidelines

### Brand Voice

**Contextualizer's voice is**:
- **Professional but approachable** - Expert guidance without condescension
- **Confident but humble** - Clear recommendations with acknowledged tradeoffs
- **Efficient but thorough** - Concise communication with complete information
- **Helpful but respectful** - Supportive without assuming incompetence

**Contextualizer's voice is NOT**:
- Marketing hype ("blazingly fast!", "revolutionary!", "game-changing!")
- Overly casual ("Hey buddy!", "Awesome sauce!", "Let's crush it!")
- Condescending ("Simply do X", "It's easy, just...", "Obviously...")
- Uncertain ("Maybe try?", "Might work?", "Not sure but...")

### Tone by Context

**Success Messages** - Confident and Affirming:
```
✅ Good: "Setup complete! Your project is now optimized for AI-first development."
❌ Bad: "Woohoo! We totally nailed it! Your project is AWESOME now!"
```

**Error Messages** - Clear and Constructive:
```
✅ Good: "Initialization failed - Permission denied. Grant write access to .claude/
or run as directory owner."
❌ Bad: "Oops! Something went wrong. Try fixing permissions maybe?"
```

**Warning Messages** - Informative and Actionable:
```
✅ Good: "Context at 76%. Clear conversation history after this task to prevent
overflow and maintain response consistency."
❌ Bad: "Warning: Context is getting kinda high. You should probably do something."
```

**Recommendations** - Reasoned and Balanced:
```
✅ Good: "Strict mode catches errors before commits but slows iteration. Relaxed
mode prioritizes speed - ideal for prototyping, risky for production."
❌ Bad: "Strict mode is definitely the best choice! You should always use it!"
```

### Writing Guidelines

**Active Voice**:
```
✅ "Contextualizer detected conflicts"
❌ "Conflicts were detected by Contextualizer"
```

**Present Tense**:
```
✅ "ESLint finds 3 errors"
❌ "ESLint found 3 errors"
```

**Specific Over Vague**:
```
✅ "Pre-commit runs in 8.4 seconds"
❌ "Pre-commit is pretty fast"
```

**Explain Why**:
```
✅ "Reduce timeout to 2 minutes for faster feedback on slow test suites"
❌ "Reduce timeout to 2 minutes"
```

**No Jargon Without Definition**:
```
✅ "Idempotent operations (safe to re-run multiple times)"
❌ "Idempotent operations"
```

---

## Component Specifications

### Message Component Structure

**Base Message Template**:
```typescript
interface MessageComponent {
  status: 'success' | 'warning' | 'error' | 'info';
  icon: string;  // emoji or symbol
  title: string;  // Brief summary (< 60 chars)
  body: string[];  // Array of body paragraphs
  details?: DetailSection[];  // Optional expandable sections
  actions?: Action[];  // Optional action buttons/prompts
}

interface DetailSection {
  heading: string;
  content: string | string[];  // text or bullet list
  expandable?: boolean;  // Can be collapsed
}

interface Action {
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  description?: string;  // Explain what action does
}
```

**Example - Conflict Resolution Message**:
```typescript
{
  status: 'warning',
  icon: '⚠️',
  title: 'Conflict detected: .claude/CLAUDE.md',
  body: [
    'Your CLAUDE.md (850 lines) contains custom team coding standards.',
    'Contextualizer wants to add framework patterns and MCP configuration.'
  ],
  details: [
    {
      heading: 'Diff Preview',
      content: ['+++ Framework Patterns section', '+++ MCP configuration', '...'],
      expandable: true
    }
  ],
  actions: [
    {
      label: 'Merge (recommended)',
      type: 'primary',
      description: 'Keep your content + add Contextualizer sections'
    },
    {
      label: 'Backup and replace',
      type: 'secondary',
      description: 'Save existing to backup-[timestamp]/'
    },
    {
      label: 'Skip',
      type: 'secondary',
      description: 'Don\'t modify CLAUDE.md'
    }
  ]
}
```

### Diagnostic Report Component

**Structure**:
```typescript
interface DiagnosticReport {
  summary: {
    total: number;
    passing: number;
    warnings: number;
    failing: number;
    score: number;  // 0-100 percentage
  };
  checks: {
    passing: Check[];
    warnings: Check[];
    failing: Check[];
  };
  autoFixable: number;  // Count of auto-fixable issues
}

interface Check {
  name: string;
  category: 'setup' | 'hooks' | 'memory' | 'workflow' | 'mcp' | 'testing';
  status: 'pass' | 'warn' | 'fail';
  message: string;
  impact?: string;  // Why it matters (for warnings/failures)
  recommendation?: string;  // What to do
  autoFixable?: boolean;
  details?: string;  // Expanded technical details
}
```

**Rendering Logic**:
1. Show summary first (total score, counts)
2. Group by status (passing, warnings, failing)
3. Collapse passing checks if > 5
4. Expand warnings and failures by default
5. Highlight auto-fixable items
6. Offer bulk auto-fix action

### Progress Indicator Component

**Structure**:
```typescript
interface ProgressIndicator {
  type: 'spinner' | 'bar' | 'steps';
  message: string;
  current?: number;  // For bar and steps
  total?: number;  // For bar and steps
  steps?: ProgressStep[];  // For multi-step progress
}

interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  duration?: number;  // Seconds (if complete)
}
```

**Rendering**:
- Spinner: For indeterminate operations (< 5s)
- Bar: For determinate operations with unknown steps
- Steps: For multi-step operations with known phases

### Configuration Comparison Component

**Structure**:
```typescript
interface ConfigComparison {
  setting: string;
  before: {
    value: any;
    description: string;
  };
  after: {
    value: any;
    description: string;
  };
  impact: string[];  // List of practical changes
  tradeoffs?: string;  // Optional tradeoff explanation
  affectedFiles: string[];  // Files modified
}
```

**Example**:
```typescript
{
  setting: 'Hook Strictness',
  before: {
    value: 'strict',
    description: 'Pre-commit hooks block on any errors'
  },
  after: {
    value: 'relaxed',
    description: 'Pre-commit hooks show warnings but don\'t block'
  },
  impact: [
    'Faster commits (~5s instead of ~45s)',
    'Risk of committing linting/type errors',
    'CI/CD still enforces quality gates'
  ],
  tradeoffs: 'Speed vs. early error detection',
  affectedFiles: [
    '.contextualizer/config.yaml',
    '.claude/hooks/pre-commit'
  ]
}
```

---

## Implementation Notes

### Rendering Guidelines

**For Claude's Conversational Responses**:
1. Parse MCP tool responses into structured message components
2. Apply formatting templates consistently
3. Adapt verbosity based on user preference signals
4. Maintain conversation flow (reference earlier context)

**For Terminal Hook Output**:
1. Use ANSI color codes consistently
2. Test output in light and dark terminal themes
3. Ensure screen reader compatibility
4. Keep output under 50 lines for typical cases

**For Web UI** (Future):
1. Use semantic HTML5 elements
2. Implement ARIA attributes for accessibility
3. Support keyboard navigation
4. Provide high-contrast mode

### Testing Checklist

**Conversational UX**:
- [ ] Success messages are clear and actionable
- [ ] Error messages explain what, why, and how to fix
- [ ] Warnings provide context and recommendations
- [ ] Progress is communicated during long operations
- [ ] Conflict resolution offers clear options with tradeoffs

**Terminal Output**:
- [ ] Colors are visible in both light and dark themes
- [ ] Output is scannable with clear visual hierarchy
- [ ] Long operations show progress indication
- [ ] Errors are distinguishable from warnings
- [ ] Success states are clearly communicated

**Accessibility**:
- [ ] Screen readers can interpret all status indicators
- [ ] Keyboard navigation works for all interactions
- [ ] Color is not the only indicator of status
- [ ] Text alternatives exist for all visual elements
- [ ] Focus indicators are visible

**Voice & Tone**:
- [ ] Messages are professional but approachable
- [ ] No marketing hype or excessive enthusiasm
- [ ] Recommendations include rationale
- [ ] Errors are constructive, not blaming
- [ ] Tradeoffs are explained transparently

---

## Appendix: Example Conversation Flows

### Flow 1: First-Time Setup

```
User: "Set up this project for AI development"

Claude: "I'll help set up your project! First, let me analyze your codebase...

✅ Detected: Next.js 15.0.0, React 19.0.0, TypeScript 5.3

Based on your stack, I recommend the Web-Fullstack preset. It includes:
• Context monitoring (alerts at 75% and 90%)
• Pre-commit quality gates (ESLint, TypeScript, tests)
• Skills for Next.js, React, and TypeScript
• Subagents for code review, testing, and documentation

This setup takes ~30 seconds. Proceed with Web-Fullstack preset?"

User: "Yes"

Claude: "Setting up Web-Fullstack preset...

[1/5] ✅ Analyzing dependencies (0.4s)
[2/5] ✅ Generating configuration (0.8s)
[3/5] ✅ Creating hooks (1.2s)
[4/5] ✅ Installing skills (0.6s)
[5/5] ✅ Updating memory (0.3s)

✅ Setup complete in 3.3 seconds!

Your project now has:
• Context monitoring - I'll warn you at 75% and 90% usage
• Pre-commit hooks - ESLint, TypeScript, and tests run before commits
• 3 skills - Next.js, React, TypeScript expertise auto-loads
• 3 subagents - I can delegate code review, testing, and documentation
• Memory - App Router patterns and conventions documented

All configuration files include comments explaining customization options.

Want to run diagnostics to verify everything is correct?"

User: "Sure"

Claude: [Invokes run_doctor...]

"Doctor Report - 15/15 Checks Passed

✅ Perfect! All Anthropic best practices are followed.

Your project is fully optimized for AI-first development.
Ready to start building!"
```

### Flow 2: Configuration Adjustment

```
User: "The pre-commit hooks are too slow for prototyping"

Claude: "I can adjust that. The current strict mode runs all quality checks
and blocks commits on errors - great for production but slows iteration.

Options:
1. Relaxed mode - Run checks but don't block commits (~5s instead of ~45s)
2. Disable pre-commit - Skip all checks for maximum speed (not recommended)
3. Custom configuration - Pick which checks to run

For prototyping, I recommend relaxed mode. You'll still see warnings but
won't be blocked. Switch back to strict before production release.

Which option?"

User: "Relaxed mode"

Claude: "Configuration updated: Hook strictness

Before: Strict - blocks commits on errors (avg 45s)
After: Relaxed - shows warnings, doesn't block (avg 5s)

Impact:
• Faster iteration during prototyping
• Risk of committing linting/type errors (CI/CD still catches them)
• Same checks run, just non-blocking

Changes applied to:
• .contextualizer/config.yaml
• .claude/hooks/pre-commit

Your next commit will use relaxed mode. Want to test it with a dummy commit?"
```

### Flow 3: Troubleshooting

```
User: "Why did my commit fail?"

Claude: "Let me check the pre-commit hook output...

[Reads hook logs]

Your commit was blocked by ESLint errors:

❌ 3 errors found:
• src/auth.ts:45 - 'user' is assigned but never used
• src/api.ts:12 - Missing return type annotation
• src/utils.ts:8 - Unexpected console.log statement

These failed because you're in strict mode - commits are blocked on any errors.

Quick fixes:
1. Remove unused variables (auth.ts:45)
2. Add return types (api.ts:12)
3. Remove console.log or add eslint-disable comment (utils.ts:8)

Or, if you're prototyping and need speed:
Ask me: 'Make hooks less strict for now'

Want me to help fix these errors?"

User: "Help fix them"

Claude: "I'll fix these ESLint errors:

1. Removing unused 'user' variable in auth.ts
2. Adding return type annotation to api.ts
3. Removing console.log in utils.ts

[Makes edits]

✅ Fixed all 3 errors

Run 'git commit' again - it should pass now. I've also run ESLint to verify:

✅ 0 errors, 0 warnings (23 files)

Ready to commit!"
```

---

**END OF FRONT-END SPECIFICATION**

This specification provides comprehensive guidance for implementing Contextualizer's conversational UX, terminal output design, marketplace presence, and future web-based interfaces. All designs prioritize clarity, scannability, and cognitive load reduction appropriate for a conversation-first development tool.

For questions or clarifications, contact: Sally (UX Expert)
