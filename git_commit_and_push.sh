#!/bin/bash
set -e
cd "$(dirname "$0")"

# Stage everything relevant, including binaries and new assets
git add -A

# Compose a descriptive commit message
git commit -m "Update: Commit all recent changes for FocusWrite
- Updated or newly added soundscape MP3 assets under public/soundscapes
- Build/deployment scripts, post_process_status, and config updates
- Documentation updates (requirements, MP3 asset check report)
- Any other recent minor fixes
"

# Push to specified branch
git push origin cga-cgc7b2d135

echo "All changes staged, committed, and pushed to 'cga-cgc7b2d135'."
