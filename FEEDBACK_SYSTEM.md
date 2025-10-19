# Feedback & Metrics System

**Purpose**: Maximize learning and improvement by combining automated metrics, inferred usage patterns, and explicit user feedback with minimal friction.

---

## Three-Tier Feedback System

### Tier 1: Automatic Metrics (Zero Effort)

**What We Capture Automatically**:

#### From MCP Server Logs
```
.contextualizer/mcp.log
- Tool invocation timestamps
- Tool execution duration
- Error rates by tool
- Parameter patterns
- Frequency of use by tool
```

#### From Hook Execution
```
.contextualizer/hook-errors.log
- Context warning frequency
- Warning → action latency (did user clear context?)
- Hook execution time
- False positive warnings
```

#### From Git History
```
git log analysis
- Commit frequency during Contextualizer usage
- Story completion velocity
- Rework frequency (re-commits to same files)
```

#### Inferred Metrics
- **Context management effectiveness**: Warning → clear latency
- **Tool usage patterns**: Which tools used most/least
- **Performance actuals**: vs NFR targets
- **Workflow friction**: Time between tool invocations
- **Feature adoption**: New tools used within 24h of release

**Implementation**: Epic 5, Story 5.6 (Metrics Collection)

---

### Tier 2: One-Click Feedback (Minimal Effort)

**Quick Feedback Commands via Claude**:

#### During Development
```
You: "Log feedback: context warning was helpful"
Claude: ✅ Logged positive feedback for context-monitoring

You: "Log bug: init_project failed on monorepo"
Claude: 🐛 Created issue #42 for init_project monorepo bug

You: "Log idea: add Python preset"
Claude: 💡 Added idea to backlog: Python preset support
```

#### Quick Reaction System
```
After any Contextualizer operation:

Claude: "Did that help? Reply: y/n/skip"
You: "y"
Claude: ✅ Logged positive feedback for [operation]

OR

You: "n - thresholds too sensitive"
Claude: 📝 Logged: context thresholds need adjustment
```

**MCP Tool**: `log_feedback`
```typescript
{
  type: 'bug' | 'friction' | 'idea' | 'positive' | 'negative';
  component: string; // auto-detected or specified
  message: string;
  context?: {
    story: string;
    tool: string;
    timestamp: string;
  };
}
```

**Implementation**: Epic 6, Story 6.6 (Feedback System)

---

### Tier 3: Structured Reflection (Weekly)

**Weekly Review Prompt**:

Every Sunday (or your preferred day), Claude prompts:

```
📊 Weekly Contextualizer Review

Based on your usage this week:
- 47 tool invocations (↑23% from last week)
- 12 context warnings (85% followed by clear action)
- 3.2s avg tool response time (target: 2s) ⚠️

Quick questions (optional - skip any):

1. Which feature helped most this week?
   [ Type answer or "skip" ]

2. Biggest friction point?
   [ Type answer or "skip" ]

3. One thing to improve?
   [ Type answer or "skip" ]

Your feedback is saved to docs/feedback/weekly-YYYY-MM-DD.md
```

**Auto-Generated Weekly Report**:
```markdown
# Week of 2025-10-20

## Metrics
- Tool invocations: 47 (↑23%)
- Top tools: init_project (15), run_doctor (12), configure_hooks (8)
- Avg response time: 3.2s (⚠️ above 2s target)
- Context warnings: 12 (85% action rate)

## Inferred Insights
- ✅ High action rate on warnings suggests they're helpful
- ⚠️ Performance degradation needs investigation
- 📈 Increased usage of init_project (new projects?)

## User Feedback
- [Your answers to weekly questions]

## Auto-Generated Action Items
- [ ] Investigate performance regression (3.2s vs 2s target)
- [ ] Consider adding [detected pattern] to presets
```

**Implementation**: Epic 6, Story 6.7 (Analytics & Insights)

---

## Easy Feedback Mechanisms

### 1. Natural Language Feedback (Easiest)

**Just talk to Claude**:
```
"The context warning interrupted my flow - can we make it less intrusive?"
→ Auto-logged as friction, categorized as UX issue

"init_project was perfect for my React project"
→ Auto-logged as positive feedback, tagged to init_project + React preset

"Bug: doctor missed that my hooks weren't executable"
→ Created issue, added to backlog, linked to diagnostics engine
```

**Behind the Scenes**:
- Claude detects feedback intent
- Categorizes automatically (bug/friction/idea/positive)
- Links to relevant component
- Creates actionable items

---

### 2. Reaction Emojis (One Character)

**After any Contextualizer operation**:
```
Claude: "Project initialized with web-fullstack preset ✅
         React as? 👍 👎 💡 🐛 (or skip)"

You: "👍"
→ Positive feedback logged

You: "💡 add Vue preset"
→ Idea logged to backlog
```

**Emoji Meanings**:
- 👍 = Positive feedback
- 👎 = Negative feedback / friction
- 💡 = Idea / feature request
- 🐛 = Bug report
- ⏭️ = Skip

---

### 3. Inline Feedback (During Usage)

**Contextual Prompts**:
```
After context warning:
"Was this warning helpful? (y/n or feedback)"

After tool execution:
"init_project completed in 2.8s. Performance okay? (y/n)"

After doctor autofix:
"Fixed 3 issues. All correct? (y/n or details)"
```

---

### 4. Screenshot/Recording Feedback

**For Complex Issues**:
```
You: "Log visual bug" [attach screenshot]
Claude: 📸 Logged visual issue with screenshot
        Created: docs/feedback/bugs/2025-10-20-visual-001.md

OR

You: "Record workflow issue"
Claude: 🎥 Start screen recording, then say "stop recording"
        [you demonstrate issue]
You: "Stop recording"
Claude: Saved recording + created issue #43
```

---

## Feedback Categories & Routing

### Auto-Categorization

**Bug Reports** → Create GitHub issue
```yaml
priority: based on frequency/severity
assignee: relevant component owner
labels: [bug, component-name, auto-detected]
linked_to: story/epic if detected
```

**Friction Points** → Add to improvement backlog
```yaml
type: UX | Performance | Workflow
impact: high | medium | low (based on frequency)
effort: estimate based on component
priority_score: impact × frequency / effort
```

**Ideas** → Add to feature backlog
```yaml
phase: 1-5 (based on roadmap alignment)
value: inferred from context
effort: rough estimate
roi_score: value / effort
```

**Positive Feedback** → Validate decisions
```yaml
component: what worked well
pattern: why it worked
preserve: don't break this in future
```

---

## Metrics Dashboard

### Real-Time View (In Claude)

**Quick Status**:
```
You: "Show Contextualizer stats"

Claude: "📊 Contextualizer Metrics (Last 7 Days)

Usage:
├─ 47 tool invocations (↑23%)
├─ init_project: 15 (most used)
├─ run_doctor: 12
└─ configure_hooks: 8

Performance:
├─ Avg response: 3.2s (⚠️ target: 2s)
├─ Hook execution: 78ms (✅ target: 100ms)
└─ Doctor run: 4.1s (✅ target: 5s)

Quality:
├─ Context warnings: 12 (85% action rate ✅)
├─ Doctor accuracy: 94% (✅)
└─ Error rate: 2% (✅)

Feedback:
├─ 8 positive
├─ 3 friction points
└─ 5 ideas logged"
```

### Weekly Summary (Auto-Generated)

**Delivered Every Sunday**:
```markdown
# Contextualizer Weekly Insights - Week 42

## 🎯 Highlights
- You're using Contextualizer 47 times/week (healthy adoption!)
- Context warnings have 85% action rate (they're working!)
- Performance needs attention (3.2s vs 2s target)

## 📊 Key Metrics
[Charts and graphs would go here in visual version]

## 💡 Recommendations
Based on your usage patterns:
1. Consider creating a custom preset for your workflow
2. Adjust context thresholds (you clear at 75% avg)
3. Performance investigation needed for init_project

## 🎯 Action Items Created
- #45: Investigate init_project performance
- #46: Add custom preset support
- #47: Adjust default thresholds based on usage

## 🙏 Quick Feedback
[3 optional questions here]
```

---

## Feedback Storage & Analysis

### File Structure
```
docs/feedback/
├── metrics/
│   ├── 2025-W42.json          # Weekly metrics
│   ├── tool-usage.json         # Aggregate tool usage
│   └── performance.json        # Performance tracking
├── user-feedback/
│   ├── 2025-10-20-positive.md  # Positive feedback log
│   ├── 2025-10-20-friction.md  # Friction points log
│   └── 2025-10-20-ideas.md     # Ideas and requests
├── bugs/
│   ├── 2025-10-20-001.md       # Bug reports
│   └── 2025-10-20-002.md
├── weekly-reviews/
│   └── 2025-W42.md             # Weekly summary
└── insights/
    └── patterns.md              # Detected patterns
```

### Automatic Analysis

**Pattern Detection**:
- Repeated friction points → Priority bugs
- High usage tools → Preserve and enhance
- Low usage tools → Investigate why or deprecate
- Performance trends → Proactive optimization
- Feature requests clustering → Roadmap validation

**Smart Prioritization**:
```
Priority Score = (Impact × Frequency × User Feedback) / Effort

High Priority:
- Frequent friction with high impact
- Performance regressions
- Bugs affecting core workflows

Medium Priority:
- Nice-to-have improvements
- Low-frequency issues
- Feature requests

Low Priority:
- Edge cases
- Low usage features
- Future phase ideas
```

---

## Implementation Timeline

### Epic 5: Diagnostics & Best Practices
**Story 5.6**: Basic metrics collection
- Tool invocation logging
- Performance measurement
- Error tracking

### Epic 6: Memory & Configuration
**Story 6.6**: Feedback system
- `log_feedback` MCP tool
- Natural language feedback parsing
- Quick reaction system

**Story 6.7**: Analytics & insights
- Weekly summary generation
- Pattern detection
- Priority scoring

---

## Usage Guide

### For You (Josh)

**Daily**:
- Just use Contextualizer naturally
- When something feels good/bad, say it: "Log feedback: X was great/annoying"
- React to quick prompts (y/n/skip)

**Weekly** (5 minutes):
- Review auto-generated summary
- Answer 3 optional questions
- That's it!

**Monthly** (optional):
- Review feedback trends
- Validate roadmap priorities

### What Gets Automated

**Zero Effort From You**:
- All metrics collection
- Performance tracking
- Usage pattern detection
- Issue creation for bugs
- Backlog management
- Priority scoring
- Weekly summary generation

**Minimal Effort From You**:
- Natural language feedback (just talk)
- Quick reactions (one character)
- Weekly questions (optional, 3 quick questions)

---

## Success Metrics

**System is Working When**:
1. You naturally share feedback without thinking about it
2. Bugs are caught and logged before you forget them
3. Ideas are captured in the moment
4. Metrics inform roadmap decisions
5. Friction points are identified and resolved quickly
6. Positive patterns are preserved and enhanced

**Evidence**:
- Regular feedback submissions (weekly+)
- High action rate on collected feedback
- Roadmap alignment with actual usage
- Decreasing friction over time
- Increasing satisfaction scores

---

## Example Workflow

### Scenario: Using init_project

```
You: "Set up this project for Next.js development"

Claude: [invokes init_project]
        ✅ Project initialized with web-fullstack preset
        Created: .claude/hooks/, CLAUDE.md, config.yaml
        Setup time: 2.8s

        [Auto-logged: init_project, 2.8s, web-fullstack]

        Quick feedback: Helpful? (y/n/skip)

You: "y but setup time felt slow"

Claude: ✅ Logged positive feedback
        📝 Noted: Performance concern (2.8s)

        [Auto-created investigation task if pattern detected]
```

### Scenario: Context Warning

```
Claude: "⚠️ Context at 82%. Consider clearing if starting new task."
        [Auto-logged: warning triggered at 82%]

You: [clears context]

        [Auto-logged: warning → action in 30s, effective=true]

        // Later, if you ignore multiple warnings:
        [Auto-logged: warning → ignored, ineffective=true]
        [System learns: maybe thresholds need adjustment]
```

---

**Remember**: The best feedback system is one you don't notice. It should capture insights effortlessly while you focus on development.

---

**Last Updated**: 2025-10-19
**Implementation**: Epic 5-6
**Status**: Planning complete, ready for implementation
