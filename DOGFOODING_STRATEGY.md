# Dogfooding Strategy - Using Contextualizer to Build Contextualizer

**Purpose**: Define when and how to start using Contextualizer's own features during development to validate, test, and improve the product through real-world usage.

---

## Core Principle

**Build → Test → Use → Improve → Iterate**

We will progressively activate Contextualizer features as they become functional, using them immediately in our own development workflow. This creates a feedback loop where we experience the product as users while building it.

---

## Progressive Activation Timeline

### Phase 1: Milestone Triggers

#### 🎯 Milestone 1: MCP Server Foundation (After Story 1.4)

**When**: Server can register and invoke tools, resources, and prompts

**What to Activate**:
- Manual MCP server testing via stdio
- Test tool invocations from Claude directly
- Validate conversational UX design from Frontend Spec

**How to Use**:
1. Add `contextualizer` to `claude_desktop_config.json` manually
2. Test `init_project` tool (even though templates aren't complete)
3. Validate UX flow matches Frontend Spec expectations
4. Document friction points and UX issues

**Feedback Loop**:
- Create Story 1.4.1 if UX issues found
- Update Frontend Spec with learnings
- Adjust tool response format based on real usage

---

#### 🎯 Milestone 2: Minimal Preset Available (After Story 2.1)

**When**: `init_project` with `minimal` preset works end-to-end

**What to Activate**:
- Use Contextualizer to initialize a NEW test project
- Run `init_project` with `preset: minimal`
- Verify context monitoring hook works

**How to Use**:
1. Create test directory: `mkdir ../contextualizer-test-project`
2. Run `init_project` via Claude: "Set up this project with minimal preset"
3. Actually use the generated hooks in development
4. Monitor context warnings during our own work

**Feedback Loop**:
- Are context warnings helpful or annoying?
- Are thresholds appropriate (80% warning, 95% critical)?
- Is hook performance < 100ms as specified?
- Does CLAUDE.md template provide value?

**Action Items**:
- Log all friction in `docs/dogfooding-notes.md`
- Create stories for critical issues
- Update presets based on real usage

---

#### 🎯 Milestone 3: Web-Fullstack Preset (After Story 2.3)

**When**: Full web-fullstack preset with skills and subagents works

**What to Activate**:
- **CRITICAL**: Use Contextualizer to set up ITSELF for AI development
- Run `init_project` with `preset: web-fullstack` on Contextualizer repo
- Activate all generated skills and subagents

**How to Use**:
1. Backup current `.claude/` directory
2. Run `init_project` on Contextualizer itself
3. Use generated subagents (code-reviewer, test-architect) for our own development
4. Use generated skills (nextjs-expert, react-expert, typescript-expert)

**Dogfooding Actions**:
- Have code-reviewer subagent review our own PR for Story 2.3
- Use test-architect to design tests for Story 2.4
- Apply TypeScript skill during development

**Feedback Loop**:
- Do subagent configs actually help development?
- Are skills relevant and useful?
- What's missing from the templates?
- Performance of multi-agent workflows?

---

#### 🎯 Milestone 4: Conflict Resolution (After Story 3.5)

**When**: Conflict detection and resolution system works

**What to Activate**:
- Test re-running `init_project` on already-initialized repo
- Validate conflict detection logic
- Test backup and merge strategies

**How to Use**:
1. Make manual changes to `.claude/CLAUDE.md`
2. Re-run `init_project` to trigger conflict detection
3. Test merge strategies (backup-replace, merge, skip)

**Feedback Loop**:
- Does conflict detection catch all cases?
- Are merge strategies appropriate?
- Do backups work correctly?
- UX of conflict resolution?

---

#### 🎯 Milestone 5: Context Hooks Live (After Story 4.3)

**When**: Context monitoring hooks are production-ready

**What to Activate**:
- **USE HOOKS DAILY** during Contextualizer development
- Monitor context usage during long dev sessions
- Test boundary detection accuracy

**How to Use**:
1. Enable hooks for all Contextualizer development
2. Deliberately push context limits to test warnings
3. Validate rate limiting works (no spam)
4. Test different strictness levels

**Dogfooding Actions**:
- Run Epic 5 development with context monitoring active
- Log warning frequency and accuracy
- Test pre-commit hooks with our own code

**Feedback Loop**:
- Are warnings actionable?
- False positive rate?
- Performance impact on development flow?
- Threshold tuning needed?

---

#### 🎯 Milestone 6: Diagnostics System (After Story 5.5)

**When**: `run_doctor` tool with autofixes works

**What to Activate**:
- Run diagnostics on Contextualizer repo regularly
- Use autofixes for our own project
- Validate check accuracy and fix quality

**How to Use**:
1. Run `run_doctor` daily before committing
2. Test autofix on real issues in our repo
3. Add custom checks for our specific needs

**Dogfooding Actions**:
- Use doctor to validate our own setup
- Create custom checks for Contextualizer-specific requirements
- Test check performance (must be < 5s)

**Feedback Loop**:
- Which checks are most valuable?
- Are autofixes safe and correct?
- What checks are missing?
- Performance acceptable?

---

## Continuous Dogfooding

### Daily Usage (After Milestone 3)

**Every Development Session**:
1. Use context monitoring hooks
2. Invoke tools via Claude for project setup tasks
3. Use subagents for code review
4. Run diagnostics before commits

**Weekly Reviews**:
1. Review `docs/dogfooding-notes.md`
2. Create stories for critical friction points
3. Update presets/templates based on learnings
4. Measure actual vs target performance

### Documentation Updates

**After Each Milestone**:
1. Update Frontend Spec with UX learnings
2. Update Architecture with implementation realities
3. Update PRD with feature refinements
4. Update presets with better defaults

---

## Feedback Capture System

### Create: `docs/dogfooding-notes.md`

**Format**:
```markdown
# Dogfooding Notes

## [Date] - [Milestone] - [Story]

### What Worked
- Feature X was intuitive and helpful
- Performance met expectations

### Friction Points
- Tool Y response was confusing
- Hook Z fired too frequently

### Ideas
- Add feature A to improve workflow
- Adjust threshold B to reduce noise

### Action Items
- [ ] Create story for critical issue C
- [ ] Update preset D with new default
```

**Update Cadence**: Daily during active dogfooding

---

## Testing Integration

### Real-World Test Cases

**Use Contextualizer to**:
1. **Set up test projects** (different tech stacks)
2. **Manage our own memory** (CLAUDE.md updates)
3. **Configure hooks** for different workflow needs
4. **Run diagnostics** on various project states
5. **Handle conflicts** when updating config

**Benefits**:
- Tests are based on actual usage
- Edge cases discovered naturally
- UX validated by real interaction
- Performance measured in real workflows

---

## Metrics to Track

### Quantitative
- Hook execution time (target: < 100ms)
- Tool invocation time (target: < 2s)
- Doctor run time (target: < 5s)
- Setup time (target: < 30s)
- Context warning accuracy (target: > 90%)

### Qualitative
- Ease of tool invocation (conversational UX)
- Clarity of error messages
- Usefulness of diagnostics
- Value of subagents/skills
- Overall development flow improvement

---

## Critical Dogfooding Rules

### ✅ DO

1. **Use it immediately** when features become functional
2. **Log ALL friction** - even minor annoyances matter
3. **Create stories** for critical issues within 24 hours
4. **Measure performance** against NFR targets
5. **Update docs** based on real learnings
6. **Share feedback** - document everything

### ❌ DON'T

1. **Don't wait** for "perfect" - use early and often
2. **Don't ignore friction** - every annoyance is a bug
3. **Don't skip measurement** - validate NFR compliance
4. **Don't assume** - test real usage, not hypotheticals
5. **Don't silo feedback** - update docs immediately

---

## Success Criteria

**Dogfooding is Successful When**:
1. We rely on Contextualizer for our own development
2. Features are validated through real usage before release
3. UX friction is caught before external users see it
4. Performance targets are validated in real workflows
5. Presets/templates reflect actual best practices
6. We discover and fix issues organically

**Evidence of Success**:
- Contextualizer is in our own `claude_desktop_config.json`
- We use it daily without thinking about it
- Friction points are resolved quickly
- External users benefit from our learnings

---

## Next Steps

1. **After Story 1.4**: Activate Milestone 1 (manual MCP testing)
2. **Create**: `docs/dogfooding-notes.md` (start logging feedback)
3. **Commit to**: Using Contextualizer for Epic 2+ development
4. **Schedule**: Weekly dogfooding reviews

---

**Remember**: The best way to build a developer tool is to be a user of that tool. Every feature should be validated through our own usage before considering it complete.

---

**Last Updated**: 2025-10-19
**Next Review**: After Story 1.4 (MCP Server functional)
