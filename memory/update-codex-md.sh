#!/bin/bash
set -euo pipefail

TARGET="AGENTS.md"
if [ ! -f "$TARGET" ]; then
    echo "❌ Cannot find $TARGET in project root" >&2
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ python3 is required for Codex timestamp updates" >&2
    exit 1
fi

python3 <<'PY'
from datetime import datetime, timedelta, timezone
from pathlib import Path

TARGET = Path('AGENTS.md')
text = TARGET.read_text()

if not text:
    raise SystemExit('AGENTS.md is empty')

now = datetime.now(timezone.utc)
ttl = now + timedelta(hours=1)

lines = text.splitlines()
title = lines[0]
body_lines = [line for line in lines[1:] if not (line.startswith('**⏰ LAST UPDATED:') or line.startswith('**🔄 TTL:'))]
while body_lines and body_lines[0] == '':
    body_lines = body_lines[1:]

header = (
    f"**⏰ LAST UPDATED: {now.strftime('%Y-%m-%d %H:%M UTC')}**\n"
    f"**🔄 TTL: Valid until {ttl.strftime('%Y-%m-%d %H:%M UTC')}** *(Auto-refresh via Codex timestamp script)*\n"
)

body = '\n'.join(body_lines)
if body:
    new_text = f"{title}\n\n{header}\n{body}\n"
else:
    new_text = f"{title}\n\n{header}\n"

TARGET.write_text(new_text)
PY

echo "✅ Updated Codex TTL timestamps"

if [ $# -gt 0 ] && [ -x "memory/update.sh" ]; then
    "memory/update.sh" "AGENTS.md timestamps updated: $*"
elif [ -x "memory/update.sh" ]; then
    "memory/update.sh" "AGENTS.md timestamps updated"
fi
