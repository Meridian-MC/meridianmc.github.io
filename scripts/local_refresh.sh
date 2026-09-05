#!/bin/bash
# Rebuild public/data.json from the live server and push it, from this Mac.
#
# The GitHub Action does the same job on a schedule, but Apex rejects FTP
# logins from GitHub's runners (530 on a credential that authenticates fine
# from here), so this is the path that actually works today. Both can run at
# once. If Apex ever allows the runners, unload this agent and nothing else
# has to change.
#
# The FTP password comes from ~/.netrc. It is never passed on a command line
# and never printed.
set -uo pipefail

REPO="/Users/james/Library/meridian"
HOST="6856.node.apexhosting.gdn"
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cd "$REPO" || exit 1
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

# Never sweep up half-finished work: bail if anything other than the two
# generated files has uncommitted edits.
if ! git diff --quiet -- . ':!public/data.json' ':!public/data-status.json'; then
  log "working tree has other uncommitted changes, skipping"
  exit 0
fi

# Pull BEFORE generating. A clean tree rebases without conflict, and it means
# the commit below is already on top of whatever is on the remote, so the two
# generated files never have to be merged against another version of themselves.
git checkout -q -- public/data.json public/data-status.json 2>/dev/null
if ! git pull --rebase -q; then
  git rebase --abort 2>/dev/null
  log "could not sync with the remote, skipping this cycle"
  exit 1
fi

PW="$(python3 -c "import netrc;print(netrc.netrc().authenticators('$HOST')[2])" 2>/dev/null)"
if [ -z "$PW" ]; then
  log "no ~/.netrc entry for $HOST"
  exit 1
fi

# RCON gives the site its TPS figure. Optional: if ~/.rcon is missing or the
# port is unreachable, data.server is left empty and the site just omits TPS.
RCONF="$HOME/Library/meridian-server/.rcon"
RC_HOST=""; RC_PORT=""; RC_PW=""
if [ -r "$RCONF" ]; then
  RC_HOST="$(sed -n 's/^host=//p'     "$RCONF" | head -1)"
  RC_PORT="$(sed -n 's/^port=//p'     "$RCONF" | head -1)"
  RC_PW="$(  sed -n 's/^password=//p' "$RCONF" | head -1)"
fi

if ! MC_FTP_PASSWORD="$PW" \
     MC_RCON_HOST="$RC_HOST" MC_RCON_PORT="$RC_PORT" MC_RCON_PASSWORD="$RC_PW" \
     python3 scripts/refresh_analytics.py; then
  log "refresh failed (reason recorded in public/data-status.json)"
fi
unset PW RC_PW

if git diff --quiet -- public/data.json public/data-status.json; then
  log "no change"
  exit 0
fi

# The data file always differs by its `generated` stamp; only commit when the
# figures actually moved, or when the last commit is old enough that the site
# would otherwise start reporting itself stale.
if ! python3 scripts/should_push.py; then
  git checkout -q -- public/data.json public/data-status.json
  log "only the timestamp moved, skipping"
  exit 0
fi

git add public/data.json public/data-status.json
git -c user.name="meridian-analytics" \
    -c user.email="actions@users.noreply.github.com" \
    commit -q -m "chore: refresh economy analytics [skip ci]" || exit 1

if git push -q 2>/dev/null; then
  log "pushed $(git rev-parse --short HEAD)"
  exit 0
fi

# Someone pushed between the pull and the push. The commit holds nothing but
# regenerated data, so drop it and let the next cycle rebuild from the newer
# base rather than trying to merge generated files.
log "push rejected (remote moved); dropping the local data commit, next run will redo it"
git reset --hard -q "@{u}"
exit 1
