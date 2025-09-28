#!/bin/bash

# Update CLAUDE.md Quick Start timestamps
# Usage: ./memory/update-claude-md.sh ["optional message"]

CLAUDE_MD="CLAUDE.md"
NOW=$(date -u +"%Y-%m-%d %H:%M UTC")
TTL=$(date -u -v+1H +"%Y-%m-%d %H:%M UTC")

# Update timestamps in CLAUDE.md
sed -i '' "s/\*\*⏰ LAST UPDATED:.*\*\*/\*\*⏰ LAST UPDATED: $NOW\*\*/" "$CLAUDE_MD"
sed -i '' "s/\*\*🔄 TTL: Valid until.*\*\*/\*\*🔄 TTL: Valid until $TTL\*\*/" "$CLAUDE_MD"

echo "✅ Updated CLAUDE.md timestamps:"
echo "   LAST UPDATED: $NOW"
echo "   TTL: $TTL"

# Optional memory update
if [ ! -z "$1" ]; then
    ./memory/update.sh "CLAUDE.md timestamps updated: $1"
fi