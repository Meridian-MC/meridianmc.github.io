#!/usr/bin/env python3
"""Decide whether a rebuilt data.json is worth committing.

Every refresh rewrites `generated` (and `server.checked` when RCON is on), so
a quiet server would otherwise produce a commit every cycle that says nothing.
Skip those, but still commit a heartbeat before the site would start calling
its own data stale (analytics.js warns past three hours), so silence always
means "the job stopped", never "nothing traded".

Only data.json is consulted. The scan state under scripts/state/ changes on
every run by construction (region mtimes, scanned-at stamps) and is committed
alongside data.json when this says yes, never on its own.

Exit 0 to commit, 1 to skip.
"""
import json, subprocess, sys, time, datetime

HEARTBEAT_HOURS = 2  # under analytics.js's 3-hour staleness warning
VOLATILE = ("generated", "server.checked")  # dotted paths, rewritten every run


def substantive(raw):
    d = json.loads(raw)
    for path in VOLATILE:
        *parents, leaf = path.split(".")
        node = d
        for k in parents:
            node = node.get(k) if isinstance(node, dict) else None
        if isinstance(node, dict):
            node.pop(leaf, None)
    return d


def git(*args):
    return subprocess.check_output(("git",) + args, text=True)


try:
    current = substantive(open("public/data.json").read())
except Exception:
    sys.exit(0)  # unreadable or brand new: let the caller commit it

try:
    previous = substantive(git("show", "HEAD:public/data.json"))
except Exception:
    sys.exit(0)  # not committed yet

if current != previous:
    sys.exit(0)  # the data itself moved

try:
    # Unix seconds, not %cI: git 2.50 writes its ISO stamps with a trailing Z,
    # which the Mac's Python 3.9 fromisoformat() rejects, and the except below
    # then turned every run into a commit.
    committed = int(git("log", "-1", "--format=%ct", "--", "public/data.json"))
    age = datetime.timedelta(seconds=time.time() - committed)
except Exception:
    sys.exit(0)

sys.exit(1 if age < datetime.timedelta(hours=HEARTBEAT_HOURS) else 0)
