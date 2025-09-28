# Quick Start & CQ Logic Documentation for Codex CLI

> **Purpose**: Document the logic and implementation details of CLAUDE.md Quick Start system and Clarifying Questions protocol for recreation by Codex CLI.

## Quick Start System Logic

### Core Concept
**Problem**: New Claude Code instances lose context after system crashes/restarts
**Solution**: Time-based validation system with automatic refresh integration

### Architecture Components

#### 1. Time-Based TTL System
```bash
# Location: CLAUDE.md lines 5-6
**⏰ LAST UPDATED: 2025-09-28 13:26 UTC**
**🔄 TTL: Valid until 2025-09-28 14:26 UTC** *(Auto-refresh on any Auto-JJ commit)*
```

**Logic**:
- TTL = 1 hour rolling window from last update
- Provides immediate context validity check for new instances
- Clear expiration time prevents stale context usage

#### 2. Auto-JJ Integration Hook
```bash
# Location: scripts/auto-jj.js lines 239-242
// Update CLAUDE.md timestamps for 1-hour TTL crash recovery
const claudeUpdateScript = resolve(this.projectRoot, 'memory/update-claude-md.sh');
await execAsync(`"${claudeUpdateScript}" "Auto-JJ timestamp refresh"`, { cwd: this.projectRoot });
console.log('🔄 CLAUDE.md timestamps refreshed');
```

**Logic**:
- Every auto-commit triggers timestamp refresh
- Extends TTL automatically during active development
- Ensures Quick Start section remains current

#### 3. Timestamp Update Script
```bash
# Location: memory/update-claude-md.sh
NOW=$(date -u +"%Y-%m-%d %H:%M UTC")
TTL=$(date -u -v+1H +"%Y-%m-%d %H:%M UTC")

sed -i '' "s/\*\*⏰ LAST UPDATED:.*\*\*/\*\*⏰ LAST UPDATED: $NOW\*\*/" "$CLAUDE_MD"
sed -i '' "s/\*\*🔄 TTL: Valid until.*\*\*/\*\*🔄 TTL: Valid until $TTL\*\*/" "$CLAUDE_MD"
```

**Logic**:
- macOS-compatible date commands (`-v+1H` instead of `-d "+1 hour"`)
- Regex replacement maintains exact format
- UTC timestamps for consistency across timezones

#### 4. Context Loading Protocol
```bash
# Location: CLAUDE.md lines 88-92
# Essential context (load in this order) - max 4,000 tokens
cat CLAUDE.md                           # This guide
cat memory/active/status.md             # Latest activities
cat memory/active/context.md            # Current task state
cat memory/implementations/2025-09-27-chart-tick-system.md  # Recent major work
```

**Logic**:
- Single authoritative loading sequence
- Progressive context (guide → status → context → recent work)
- Token budget management (4k for essential files)

### Implementation Requirements for Codex

#### File Structure
```
project_root/
├── CLAUDE.md                           # Contains Quick Start section
├── memory/update-claude-md.sh          # Timestamp update script
├── scripts/auto-jj.js                  # Auto-commit system with hooks
└── memory/
    ├── active/status.md                # Current activities
    ├── active/context.md               # Task context
    └── implementations/                # Recent major work
```

#### Script Integration Points
1. **Auto-commit hook**: Insert timestamp refresh call in commit workflow
2. **Date handling**: Use platform-appropriate date commands
3. **Regex patterns**: Maintain exact format for reliable replacement
4. **Memory integration**: Call existing memory update scripts

---

## Clarifying Questions (CQ) Protocol Logic

### Core Concept
**Problem**: Ambiguous requirements lead to incorrect implementations
**Solution**: Structured questioning protocol with memory-backed learning

### CQ System Architecture

#### 1. Trigger Conditions
```bash
# Implementation logic:
if (requirements_unclear || user_says("Ask CQs") || multiple_approaches_exist) {
    initiate_cq_protocol();
}
```

**Triggers**:
- Ambiguous user requests ("improve UI", "fix this", "make better")
- Explicit "Ask CQs" command from user
- Multiple valid technical approaches available
- When assumptions would be required to proceed

#### 2. CQ Format Structure
```markdown
# Format Template:
1. [Question with sufficient context]?

a. [Option A - specific and actionable]
b. [Option B - alternative approach]
c. [Option C - different scope/method]
d. [Option D - open-ended or "other"]
```

**Format Rules**:
- Numbered questions (1. 2. 3.) for easy reference
- Lettered options (a. b. c. d.) for quick answers
- One question at a time - wait for response
- Options on separate lines with proper markdown formatting

#### 3. Dynamic Ordering Logic
```javascript
// Pseudo-code for question prioritization:
function orderCQs(questions) {
    return questions.sort((a, b) => {
        if (a.type === 'foundational') return -1;  // Ask first
        if (a.type === 'scope') return b.type === 'foundational' ? 1 : -1;
        if (a.type === 'method') return b.type === 'detail' ? -1 : 1;
        return 0;  // Details last
    });
}
```

**Ordering Principles**:
- Foundational/architectural questions first
- Scope and boundary questions second
- Method and approach questions third
- Implementation details last
- Risk/blocker questions prioritized within each category

#### 4. Memory Integration System

##### Pattern Recognition
```bash
# File: memory/patterns/cq-common-scenarios.md
# Structure: Trigger → Standard CQ Set
UI_CHANGES: ["improve UI"] → [aspect_question, priority_question]
BUG_FIXES: ["fix this", "broken"] → [expected_behavior, testing_scope]
FEATURES: ["add feature"] → [use_case, constraints]
REFACTORING: ["refactor", "clean up"] → [goal, preservation_requirements]
```

##### User Preference Learning
```bash
# File: memory/reference/user-preferences.md
# Auto-updated based on CQ responses:
- Communication style preferences
- Technical approach patterns
- Decision-making tendencies
- Established preferences (skip future CQs)
```

##### CQ Documentation Strategy
```bash
# Document outcomes, not process:
memory/questions/YYYY-MM-DD-topic.md     # Final decisions only
memory/reference/user-preferences.md     # Learned patterns
memory/patterns/cq-[scenario].md         # Reusable CQ sets
```

### Implementation Requirements for Codex

#### Core CQ Engine
```javascript
class CQProtocol {
    constructor(memorySystem) {
        this.patterns = loadCommonScenarios();
        this.userPrefs = loadUserPreferences();
        this.currentSession = [];
    }

    shouldAskCQ(userInput, context) {
        return this.detectAmbiguity(userInput) ||
               userInput.includes("Ask CQs") ||
               this.hasMultipleApproaches(context);
    }

    generateCQ(context) {
        const scenario = this.identifyScenario(context);
        const template = this.patterns[scenario];
        return this.customizeCQ(template, context);
    }

    processResponse(answer) {
        this.updateUserPreferences(answer);
        this.documentDecision(answer);
        return this.generateNextCQ();
    }
}
```

#### Integration Points
1. **Workflow Integration**: Add CQ step to development workflow
2. **Memory System**: Connect to claude-dementia for persistence
3. **Pattern Library**: Build reusable CQ sets for common scenarios
4. **User Learning**: Track and apply user preference patterns

#### File Dependencies
```
memory/patterns/cq-common-scenarios.md   # Pre-defined CQ sets
memory/reference/user-preferences.md     # Learned user patterns
memory/questions/                        # CQ session outcomes
CLAUDE.md                               # CQ protocol documentation
```

### Cross-System Integration

#### Quick Start + CQ Synergy
- Quick Start provides immediate project context
- CQ system uses that context for better question generation
- Both systems share memory infrastructure
- Auto-JJ integration keeps both systems current

#### Memory Budget Management
- Quick Start files: 4k tokens (essential context)
- CQ patterns: 1k tokens (reusable scenarios)
- User preferences: 500 tokens (learned patterns)
- Total overhead: ~5.5k tokens (within 10k budget)

### Future Enhancement Opportunities
- Machine learning for CQ generation based on code analysis
- Integration with git history for context-aware questioning
- Automated CQ validation and feedback loops
- Cross-project CQ pattern sharing

---

**Implementation Priority for Codex CLI**:
1. Core CQ format and one-at-a-time logic
2. Basic pattern recognition for common scenarios
3. Memory integration for user preference learning
4. Quick Start TTL system with auto-refresh
5. Advanced features (ML, cross-project patterns)