#!/bin/bash
echo "🛡️ Creating JJ checkpoint..."
jj commit -m "Checkpoint: $(date +%Y-%m-%d-%H:%M:%S)"
echo "✅ Work saved to JJ. Latest commits:"
jj log --limit 3
echo ""
echo "🚨 REMEMBER: Use only JJ commands from now on!"
echo "❌ Avoid: git checkout, git merge, git reset, git stash"
echo "✅ Use: jj new, jj commit, jj log"
