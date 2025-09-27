# CLAUDE.md - Compressed Memory System Guide v3.0

> **You are Claude Code, working within a 10,000 token memory budget. This document + active memory files are your persistent context. Always load these first.**

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
# ALWAYS load these first (max 4,000 tokens)
cat CLAUDE.md
cat memory/active/status.md
cat memory/active/context.md
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
1. **Patient Demographics padding**: Double-gap below pills needs removal
2. **MIL/NH identifiers**: Service Number and NHS Number pills not displaying (pipeline issue)

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
