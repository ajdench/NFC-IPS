# Auto-JJ: Automatic Jujitsu Version Control

Automatically creates JJ commits for every code change phase with intelligent context detection and professional commit messages.

## Features

### 🤖 Automatic File Monitoring
- **Real-time detection**: Watches all critical code files
- **Smart debouncing**: Groups rapid changes into single commits
- **Context-aware**: Generates appropriate commit messages based on changed files

### 🔄 Build Integration
- **npm script hooks**: Automatic commits after successful builds/tests
- **Failure handling**: Different messages for success vs failure scenarios
- **Memory integration**: Updates project memory system automatically

### 📝 Professional Commit Messages
- **Conventional format**: Uses `type(scope): description` format
- **Auto-generated**: Includes Claude Code attribution and timestamps
- **Context-specific**: Different patterns for UI, logic, config, and docs

## Usage

### Start Auto-Monitoring
```bash
# Start file watcher with development server
npm run dev:auto-jj

# Or start file watcher separately
npm run jj:start
```

### Manual Commits via Hooks
```bash
# Automatic commit after successful build
npm run build

# Automatic commit after successful tests
npm run test

# Manual hook triggers
npm run jj:fix "Fixed authentication bug"
npm run jj:refactor "Simplified component structure"
```

### Build Without Auto-Commits
```bash
# Build without triggering JJ commit
npm run build:no-jj

# Test without triggering JJ commit
npm run test:no-jj
```

## How It Works

### File Monitoring (`scripts/auto-jj.js`)
- Watches: `script.js`, `style.css`, `index.html`, `package.json`, `scripts/`
- Ignores: `node_modules`, `.git`, `build`, `memory/active`, logs
- Debounce: 2-second delay to group related changes
- Smart categorization: UI, logic, config, or documentation changes

### Hook Integration (`scripts/jj-hooks.mjs`)
- **Build hooks**: Triggered by `npm run build`
- **Test hooks**: Triggered by `npm run test`
- **Manual hooks**: Available for fixes, refactoring, deployments
- **Memory updates**: Automatically updates `memory/active/status.md`

### Commit Message Format
```
type(scope): short description

Context: detailed description

🤖 Auto-generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
Timestamp: 2025-09-26
```

## Configuration

### File Watch Patterns
Edit `scripts/auto-jj.js` to modify:
- `watchPatterns`: Files to monitor
- `ignorePatterns`: Files to ignore
- `commitDelay`: Debounce delay (default: 2000ms)

### Hook Contexts
Available contexts in `scripts/jj-hooks.mjs`:
- `build`: Build process commits
- `test`: Test validation commits
- `dev`: Development changes
- `deploy`: Deployment commits
- `fix`: Bug fix commits
- `refactor`: Code refactoring commits

## Examples

### Automatic Commits
```bash
# Edit style.css → Auto-commit: "feat(ui): Update styling and layout"
# Edit script.js → Auto-commit: "feat(core): Update application logic"
# Edit package.json → Auto-commit: "build(config): Update configuration"
```

### Hook-Triggered Commits
```bash
npm run build
# → "build(process): Build completed successfully"

npm run test
# → "test(validation): All tests passing"

npm run jj:fix "Fixed date display bug in Events"
# → "fix(core): Fixed date display bug in Events"
```

## Integration with Memory System

Auto-JJ integrates with the project's memory system:
- Updates `memory/active/status.md` with commit summaries
- Maintains development history for context
- Preserves token budget through automatic compression

## Troubleshooting

### JJ Not Initialized
Auto-JJ automatically initializes JJ repositories:
- Imports existing Git repos with `jj git import`
- Creates colocated Git+JJ repos with `jj git init --colocate`

### File Watcher Issues
- Check file permissions on watch directories
- Verify Node.js has file system access
- Review ignore patterns for overly broad exclusions

### Hook Failures
- Ensure JJ is installed and accessible
- Check memory system scripts are executable
- Verify project structure matches expected paths

## Requirements

- **Jujitsu (JJ)**: Version 0.32.0 or later
- **Node.js**: ES6 modules support
- **File system access**: For file watching functionality

---

**Auto-JJ ensures every code change is properly versioned with professional commit messages, maintaining a complete development history without manual intervention.**