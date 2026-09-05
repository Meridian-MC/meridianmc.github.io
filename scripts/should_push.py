#!/usr/bin/env python3
"""Decide whether a rebuilt data.json is worth committing.

Every refresh rewrites `generated`, so a quiet server would otherwise produce a
commit every cycle that says nothing. Skip those, but still commit a heartbeat
before the site would start calling its own data stale (analytics.js warns past
three hours), so silence always means "the job stopped", never "nothing traded".

Exit 0 to commit, 1 to skip.
"""
import json, subprocess, sys, datetime

HEARTBEAT_HOURS = 2  # under analytics.js's 3-hour staleness warning
VOLATILE = ("generated",)


def substantive(raw):
    d = json.loads(raw)
    for k in VOLATILE:
        d.pop(k, None)
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
    stamp = git("log", "-1", "--format=%cI", "--", "public/data.json").strip()
    age = datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(stamp)
except Exception:
    sys.exit(0)

sys.exit(1 if age < datetime.timedelta(hours=HEARTBEAT_HOURS) else 0)
