# CLAUDE.md - NFC IPS Viewer Project Guide

## 🚀 **QUICK START FOR NEW CLAUDE CODE INSTANCES**

**⏰ LAST UPDATED: 2025-10-04 17:34 UTC** *(Power failure recovery)*
**🔄 TTL: Valid until 2025-10-04 18:34 UTC** *(Auto-refresh on any Auto-JJ commit)*
**💾 CRASH RECOVERY: If system restarted unexpectedly, check timestamps below**

### **Immediate Orientation**
**Load the files in Memory Loading Protocol section below for complete context.**

### **Project Status**
- **Type**: NFC IPS (International Patient Summary) web viewer for medical data
- **Stack**: JavaScript ES6+, Chart.js, HTML5, CSS3, protobuf compression
- **Status**: Active development with auto-JJ version control system
- **Last Major Work**: Dual title system fixes, auto-loading disabled, surgical logging implemented (2025-09-28)

### **Current State Summary**
✅ **MAJOR RECOVERY COMPLETED (2025-09-29)**:
- **Version Control Protection**: JJ protection configured to prevent destructive git overwrites
- **Feature Integration**: Chart/axis work merged with preset #0 and OPCP title improvements
- **Medical Terminology**: LEGEND_ABBREVIATIONS recovered with proper medical abbreviations (Hgb, pH)
- **CSS Grid Architecture**: Complete vitals layout with spacer columns and positioned legends
- **Preset System**: Preset #0 fully implemented with event handling and file mapping
- **OPCP Titles**: Enhanced with R2 DHC, R3 DHC, and dynamic R1 PHC/PHEC variations

✅ **Architecture**: Dual title display, Chart.js positioned legends, custom x-axis ticks, CSS Grid layout
✅ **Systems**: Auto-JJ commits, JJ protection settings, claude-dementia memory v3.0, comprehensive recovery
✅ **Version Control**: JJ provides irrefutable tracking with git integration protection

### **Quick Commands & Loading Order**
```bash
npm run dev:auto-jj            # Start development server with auto-JJ monitoring
npm run dev                    # Start development server only (no auto-commits)
./memory/update.sh "message"   # Update memory system
jj commit -m "message"         # Manual commit changes
```

### **Key Files**
- `script.js` (1,183 lines): Core application logic
- `config/constants.js`: Global constants including `CARE_STAGE_COUNT = 9`
- `nfc/ips/viewer.html`: Main UI with dual titles and vitals chart
- `memory/`: Claude-dementia memory system with active status

### **Dynamic Update Protocol**
**⚠️ ALWAYS UPDATE TIMESTAMPS WHEN:**
- Starting new session
- After any commit to JJ
- Completing major work
- System crash recovery

```bash
# Automated timestamp update
./memory/update-claude-md.sh "session started"

# Manual update example:
# LAST UPDATED: 2025-09-27 23:15 UTC → current time
# TTL: 2025-10-11 23:59 UTC → +2 weeks from now
```

### **On Start - Essential First Steps**
1. **Check for uncommitted changes**: `jj status` or `git status`
2. **Commit any pending work**: If changes exist, commit them immediately:
   ```bash
   jj commit -m "Session start: commit pending work from previous session"
   jj git push  # Push to remote
   ```
3. **Start auto-JJ development mode**:
   ```bash
   npm run dev:auto-jj  # Starts dev server AND auto-commit monitoring
   # NOT just: npm run dev (no auto-commits!)
   ```

### **When Taking Over (Expanded)**
1. **Check timestamps**: If LAST UPDATED > 1 hour old, verify system state
2. **Update timestamps**: LAST UPDATED = now, TTL = now + 2 weeks
3. **Crash recovery**: If unexpected restart, check `jj log -n 5` for last activity
4. **Memory sync**: Run `cat memory/active/status.md | tail -3` for latest state
5. **System status**: Check `jj status` for uncommitted changes → **commit immediately if found**
6. **Development**: Run `npm run dev:auto-jj` to start environment with auto-commits
7. **Update memory**: `./memory/update.sh "Session started - recovered from [timestamp]"`

### **✅ RECENT COMPLETION - Preset #0 Button Implementation**
**Status**: COMPLETED 2025-09-28 01:07 UTC

**Accomplished**:
1. **HTML Structure**: Added preset #0 button between Clear and #1 buttons
2. **JavaScript Integration**: Configured complete event handling for fragment/FHIR modes
3. **Constants Management**: Added IPS_FHIR_JSON_0 to config/constants.js
4. **File Mappings**: #0→ips-fhir-json-0.json, #1→ips-fhir-json-1.json (shifted)
5. **Demo State Array**: Updated with proper index shifting (payload0→demos[0])
6. **Issue Resolution**: Fixed "Preset 0 not available" by using proper constants

**System Status**: All preset buttons (#0-#3) fully functional, ready for new tasks

---

# Compressed Memory System Guide v3.0

> **You are Claude Code, working within a 10,000 token memory budget. This document + active memory files are your persistent context.**

## 📦 Installation from GitHub

If this file doesn't exist in the project yet, install the memory system:
```bash
git clone https://github.com/banton/claude-dementia /tmp/cm
cp /tmp/cm/CLAUDE.md ./ && cp -r /tmp/cm/memory ./
chmod +x memory/*.sh && rm -rf /tmp/cm
./memory/update.sh "Memory system installed"
```

## 🧠 Memory Loading Protocol

### Start Every Session
```bash
# Essential context (load in this order) - max 4,000 tokens
cat CLAUDE.md                           # This guide
cat memory/active/status.md             # Latest activities
cat memory/active/context.md            # Current task state
cat memory/implementations/2025-09-27-chart-tick-system.md  # Recent major work
```

### Load As Needed
```bash
# Reference files when relevant (max 5,000 tokens)
cat memory/reference/[relevant-file].md
cat memory/patterns/[specific-pattern].md
```

## 📊 Token Budget System

| Memory Type | Budget | Purpose | Update Frequency |
|-------------|---------|---------|------------------|
| CLAUDE.md | 1,000 | Core guide (this file) | Rarely |
| Active | 3,000 | Current work | Every session |
| Reference | 5,000 | Stable patterns | Weekly |
| Buffer | 1,000 | Overflow space | As needed |
| **TOTAL** | **10,000** | **Hard limit** | - |

## 🔄 Development Workflow

### 1. Session Start
```bash
# Check status
cat memory/active/status.md
git status

# Load context
cat memory/active/context.md

# Ask: "What are we working on?"
```

### 2. During Development
```bash
# Ask clarifying questions when needed
# Use CQ protocol (see section below) when requirements unclear

# Quick updates (auto-compresses)
./memory/update.sh "Implemented feature X"

# Fix issues properly
# Document in: memory/fixes/YYYY-MM-DD-issue.md

# Track questions
# Create: memory/questions/YYYY-MM-DD-topic.md
```

### 3. Session End
```bash
# Update status
./memory/update.sh "Session summary: achieved X, Y pending"

# Update context for next session
echo "Next: implement Z" >> memory/active/context.md

# Check compression
./memory/compress.sh
```

## 🏗️ Project Structure

### NFC IPS Viewer Project
```yaml
project_name: NFC IPS Viewer
type: Single-page web application for displaying International Patient Summary data
stack: JavaScript ES6+, HTML5, CSS3, protobuf.js, pako
start_command: npm run dev (live-server)

structure:
  root/: Main application files
  resources/: External dependencies and proto schemas
  ips-screenshots/: Documentation screenshots
  memory/: Claude-dementia memory system
  download_logs/: Debug output directory

key_files:
  - index.html: Main application entry point (48 lines)
  - script.js: Core application logic (1,183 lines)
  - style.css: Complete styling system (468 lines)
  - package.json: Build and deployment configuration
  - payload-1.json: Demo payload data
  - payload-2.json: Second demo payload data
```

## 🚀 RECENT DEVELOPMENT SUMMARY

### Auto-JJ Version Control System ✅ IMPLEMENTED - 2025-09-26
- **Automatic Jujitsu commits**: Every code change phase gets professional commit messages
- **File monitoring**: Real-time detection with smart debouncing (2s delay)
- **Build integration**: Commits triggered after successful builds/tests
- **Memory integration**: Updates project memory system automatically
- **Usage**: `npm run dev:auto-jj` for monitoring + dev server

### Chart.js Legend Redesign ✅ COMPLETED - 2025-09-27
- **Native positioning**: Replaced custom DOM legend with Chart.js native `position: 'right'`, `align: 'middle'`
- **Y-value sorting**: Custom `generateLabels` sorts by last data point Y-value (highest to lowest)
- **Professional styling**: 10px font, 2px line indicators, 8px padding
- **Dynamic layout**: Chart automatically adjusts width for legend space

### Debug Logging System ✅ DISABLED - 2025-09-27
- **Global toggle**: `window.DEBUG_ENABLED = false` controls all debug output
- **Console-logger disabled**: No more automatic log file downloads on localhost
- **Manual control**: Can re-enable with `?consoleLogs=on` or `window.NfcIpsLogging.enable()`
- **Export functions**: Available for manual use (`window.exportMISTDebugLog()`)

### Outstanding Issues 🔄 IN PROGRESS
1. **Priority 2 Bug - Payload Visual Blip**: Instantaneous visual blip occurs during page initialization/reload in payload panes. Investigation shows all JavaScript operations complete successfully, suggesting browser-level rendering issue (CSS transitions, Chart.js canvas operations, or layout reflow).
2. **Priority 2 Bug - Body Padding Missing**: Main page/window top and bottom padding not being applied despite explicit `padding: 15px` in body CSS rule. CSS appears correct but padding not visible in browser.
3. **Patient Demographics padding**: Double-gap below pills needs removal
4. **MIL/NH identifiers**: Service Number and NHS Number pills not displaying (pipeline issue)

### ✅ Recently Resolved
- **Auto-JJ System**: Fixed - Was using `npm run dev` instead of `npm run dev:auto-jj`. Auto-commits now active.

## 🚨 RESOLVED BUG - Events Date Display Issue

**Status**: RESOLVED - 2025-09-22

- **Root Cause**: Presentation layer rewrote pill values via regex, ignoring `isFirstDisplayedInRow`
- **Fix**: Renderer now uses normalized pill data directly; removed regex/date-collapsing logic
- **Result**: First Events pill in each section shows full date/time; subsequent pills show time-only

## 🎯 Operating Principles

### 1. Compressed Intelligence
- **Information density** over verbosity
- **Tables/lists** over paragraphs (3:1 compression)
- **References** over copying code
- **One-line summaries** with bullet details

### 2. Progressive Context
- Start with minimal files
- Load specific references as needed
- Never exceed token budget
- Archive old information automatically

### 3. Fix Don't Skip
- Stop on errors
- Find root cause
- Document fix in memory/fixes/
- Add regression test

### 4. Ask Don't Assume
- Document questions in memory/questions/
- Include context and options
- Wait for clarification
- Record answers

## 🤔 Clarifying Questions Protocol

### When to Ask CQs
- When requirements are ambiguous or unclear
- When user says "Ask CQs" explicitly
- When multiple valid approaches exist
- When assumptions would be required to proceed

### CQ Format
**Structure**: Use numbered questions with lettered options
```
1. [Question with context]?

a. [Option A]
b. [Option B]
c. [Option C]
d. [Option D or open-ended]
```

### CQ Workflow
1. **One question at a time** - wait for answer before next CQ
2. **Dynamic ordering** - ask most foundational questions first
3. **Document decisions** - record final choices, not questioning process
4. **Build patterns** - create reusable CQ sets for common scenarios

### CQ Pattern System
- **Common scenarios**: `memory/patterns/cq-common-scenarios.md`
- **Decision trees**: Structured CQ flows for frequent situations
- **User preferences**: Learn and document in `memory/reference/user-preferences.md`
- **Keyword triggers**: Skip obvious scenarios when context is clear

### CQ Documentation
- Final decisions → `memory/questions/YYYY-MM-DD-topic.md`
- User preferences → `memory/reference/user-preferences.md`
- Common patterns → `memory/patterns/cq-[scenario].md`
- Skip process documentation, focus on outcomes

---

## 📁 Memory Directory Guide

```
memory/
├── active/               # Current work (3k tokens)
│   ├── status.md        # Dashboard + updates
│   └── context.md       # Task context
├── reference/           # Stable info (5k tokens)
│   ├── architecture.md  # System design
│   ├── patterns.md      # Code patterns
│   └── decisions.md     # Tech decisions
├── patterns/            # Reusable solutions
├── fixes/              # YYYY-MM-DD-issue.md
├── implementations/     # Feature tracking
├── questions/          # YYYY-MM-DD-topic.md
└── archive/            # Compressed old files
```

## ✅ Pre-Work Checklist

- [ ] Load CLAUDE.md + active memory
- [ ] Check git status
- [ ] Review recent updates
- [ ] Identify current task
- [ ] Load relevant patterns/references
- [ ] Verify services running
- [ ] Run tests for clean baseline

## 🚀 Quick Commands

```bash
# Memory management
./memory/update.sh "what changed"
./memory/compress.sh
./memory/weekly-maintenance.sh

# Git workflow
git add -p
git commit -m "type(scope): message"
git push origin branch

# Testing
[test command]
[lint command]

# Search memory
grep -r "pattern" memory/
```

## 📝 Documentation Templates

### Fix Documentation
```markdown
# YYYY-MM-DD-descriptive-name.md
## Problem: [One line]
## Cause: [Root cause]
## Fix: [Solution]
## Prevention: [Test added]
```

### Question Tracking
```markdown
# YYYY-MM-DD-topic.md
## Status: OPEN|ANSWERED
## Q: [Specific question]
## Context: [Why needed]
## Options: [Considered choices]
## Answer: [When received]
```

### Pattern Documentation
```markdown
# pattern-name.md
## Use When: [Scenario]
## Solution: [Approach]
## Example: path/to/implementation
## Trade-offs: [Considerations]
```

## 🛡️ Quality Gates

Before EVERY commit:
- [ ] Tests passing
- [ ] No hardcoded secrets
- [ ] Memory updated
- [ ] Compression checked
- [ ] Questions documented
- [ ] Fixes recorded

## 🚨 Emergency Procedures

### Over Token Budget
```bash
# Check usage
./memory/compress.sh

# Force compression
./memory/weekly-maintenance.sh

# Manual cleanup
# Move old content to archive
```

### Lost Context
1. Read CLAUDE.md
2. Check memory/active/status.md
3. Review git log
4. Check memory/reference/architecture.md
5. Ask user for clarification

### Tests Failing
1. STOP writing code
2. Read full error
3. Check memory/fixes/ for similar
4. Fix root cause
5. Document in memory/fixes/

## 🎓 Remember

- **You have no memory** between sessions
- **10,000 tokens** is your limit
- **Compression** maintains context
- **Documentation** is survival
- **Patterns** prevent repetition
- **Questions** prevent assumptions

---

**Load this file first in EVERY session. Your memory system depends on it.**

**Version**: 3.0.0  
**Token Budget**: This file uses ~1,000 tokens
# 📥 **Startup Loading Sequence (Claude & Codex parity)**
1. `cat CLAUDE.md`
2. `cat AGENTS.md`
3. `cat memory/active/status.md`
4. `cat memory/active/context.md`
5. `cat memory/implementations/2025-09-27-chart-tick-system.md`
