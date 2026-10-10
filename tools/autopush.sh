#!/bin/sh
# Pushes new commits to GitHub automatically, so results Claude adds go live without you typing git push.
# Run it from Terminal on your Mac (which is signed in to GitHub):  sh tools/autopush.sh
# It checks every 30 seconds and keeps running until you press Ctrl+C or close the Terminal window.
cd "$(dirname "$0")/.." || exit 1
echo "Auto-push is on for $(pwd). Press Ctrl+C to stop."
while true; do
  if [ -n "$(git log origin/main..main --oneline 2>/dev/null)" ]; then
    if git push -q origin main; then
      echo "$(date +%H:%M) pushed: $(git log -1 --format=%s)"
    else
      echo "$(date +%H:%M) push failed, trying again in 30 seconds"
    fi
  fi
  sleep 30
done
