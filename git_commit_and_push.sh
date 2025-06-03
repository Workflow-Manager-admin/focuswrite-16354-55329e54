#!/bin/bash
set -e
cd "$(dirname "$0")"

# Stage everything relevant, including binaries and new assets
git add -A

# Compose a descriptive commit message
git commit -m "Fix writing area input reversal, ensure contentEditable is controlled and synced, restore soundscape audio playback, update soundscape button styles/names, and restore Pomodoro/sidebar UI. General enhancements and bugfixes."

# Push to specified branch
git push origin cga-cg38e77e59

echo "All changes staged, committed, and pushed to 'cga-cg38e77e59'."
