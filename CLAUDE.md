# CLAUDE.md - NFC IPS Viewer Memory System Guide v1.0

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
  memory/: Claude-dementia memory system (to be created)

key_files:
  - index.html: Main application entry point (48 lines)
  - script.js: Core application logic (1,183 lines)
  - style.css: Complete styling system (468 lines)
  - package.json: Build and deployment configuration
  - payload-1.json: Demo payload data
  - payload-2.json: Second demo payload data
```

## 🎯 Current Project Status

### Completed Features
- ✅ **Core Architecture**: Modular JavaScript with codec pipeline, payload service, and rendering functions
- ✅ **UI Components**: Dynamic info boxes with color-coded stages (POI, CASEVAC, MEDEVAC, R1-R3)
- ✅ **Data Processing**: Multi-format support (FHIR, legacy indexed, CodeRef protobuf payloads)
- ✅ **Payload Parsing**: Base64 decoding, JSON parsing, protobuf decoding with compression
- ✅ **Interactive Controls**: Toggle switch for demo payloads, custom input parsing
- ✅ **Responsive Design**: CSS variables system with scalable UI components
- ✅ **Patient Display**: Formatted patient details with NHS numbers, identifiers
- ✅ **Stage Sections**: Medical data organized by care stages (vitals, conditions, events)
- ✅ **NFC Integration**: URL fragment parsing for NFC-encoded payloads
- ✅ **Build System**: npm scripts for development and GitHub Pages deployment

### Technical Architecture
- **Codec Pipeline**: Handles protobuf decoding with legacy and CodeRef schema support
- **Payload Service**: Builds view models from various data formats
- **Rendering Engine**: Dynamic DOM generation with color-coded medical stages
- **State Management**: Global app state with demo payloads and current view models
- **Utility Functions**: Base64 normalization, date formatting, gender mapping

### Deployment Status
- 📍 **GitHub Pages**: Live at https://ajdench.github.io/NFC-IPS/
- 📍 **Build Pipeline**: Automated gh-pages deployment
- 📍 **Dependencies**: protobuf.js and pako for compression/decompression

## 🛡️ Quality Gates

Before EVERY commit:
- [ ] Tests passing (npm test - currently no tests defined)
- [ ] No hardcoded secrets
- [ ] Memory updated
- [ ] Compression checked
- [ ] Questions documented
- [ ] Fixes recorded

## 🚀 Quick Commands

```bash
# Development
npm run dev          # Start live-server
npm run build        # Build for deployment
npm run deploy       # Deploy to GitHub Pages

# Git workflow
git add -p
git commit -m "type(scope): message"
git push origin main

# Search memory (when created)
grep -r "pattern" memory/
```

## 📝 Next Steps

### High Priority
1. **Memory System Setup**: Install claude-dementia memory system
2. **Testing Framework**: Add unit tests for payload processing
3. **Error Handling**: Improve error boundaries and user feedback
4. **Documentation**: Complete inline code documentation

### Enhancement Opportunities
- Performance optimization for large payloads
- Accessibility improvements (ARIA labels, keyboard navigation)
- Print stylesheet for medical records
- Export functionality (PDF, CSV)
- Validation for incoming payload data

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
4. Check script.js for current functionality
5. Ask user for clarification

### Build Failures
1. Check npm run build output
2. Verify all dependencies in package.json
3. Test locally with npm run dev
4. Document in memory/fixes/

## 🎓 Remember

- **You have no memory** between sessions
- **10,000 tokens** is your limit
- **Compression** maintains context
- **Documentation** is survival
- **Patterns** prevent repetition
- **Questions** prevent assumptions

---

**Load this file first in EVERY session. Your memory system depends on it.**

**Version**: 1.0.0
**Token Budget**: This file uses ~1,200 tokens