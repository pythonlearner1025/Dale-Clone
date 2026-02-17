#!/usr/bin/env python3
"""
Claude Code Stop Hook: Check .blitz/metro.log for errors after edits.

Instead of tailing a fixed number of lines, this tracks the UTC timestamp
of the last hook trigger and only reads log lines generated since then.
If errors are found, it blocks Claude from stopping and feeds the relevant
logs back as context so Claude can fix the issues.
"""

from __future__ import annotations

import json
import sys
import os
import re
from datetime import datetime, timezone

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
METRO_LOG = os.path.join(PROJECT_DIR, ".blitz", "metro.log")
TIMESTAMP_STATE = os.path.join(PROJECT_DIR, ".claude", "hooks", ".last-stop-hook-ts")

# Matches [2026-01-28T09:01:19.217Z]
TS_RE = re.compile(r"\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\]")

# Real app errors — not metro bundler noise
APP_ERROR_RE = re.compile(
    r"level=error"
    r"|ReferenceError"
    r"|TypeError"
    r"|SyntaxError"
    r"|RangeError"
    r"|URIError"
    r"|EvalError"
    r"|Invariant Violation"
    r"|Fatal"
    r"|FATAL"
    r"|Unhandled promise rejection"
    r"|Cannot read propert"
    r"|undefined is not an object"
    r"|null is not an object"
    r"|is not a function"
    r"|Module not found"
    r"|Unable to resolve module"
)

# Lines to skip even if they contain the word "error"
NOISE_RE = re.compile(
    r"/symbolicate"
    r"|\"is not valid JSON\""
    r"|request (start|finish) (GET|POST|PUT|DELETE) /(?!table)"
)


def parse_ts(s: str) -> datetime | None:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def load_last_ts() -> datetime | None:
    try:
        with open(TIMESTAMP_STATE) as f:
            return parse_ts(f.read().strip())
    except FileNotFoundError:
        return None


def save_current_ts():
    os.makedirs(os.path.dirname(TIMESTAMP_STATE), exist_ok=True)
    with open(TIMESTAMP_STATE, "w") as f:
        f.write(datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ"))


def read_new_lines(since: datetime | None) -> list[str]:
    if not os.path.exists(METRO_LOG):
        return []

    with open(METRO_LOG, errors="replace") as f:
        lines = f.readlines()

    if since is None:
        # First run — fall back to last 100 lines
        return lines[-100:]

    result: list[str] = []
    capturing = False

    for line in lines:
        m = TS_RE.search(line)
        if m:
            line_ts = parse_ts(m.group(1))
            capturing = line_ts is not None and line_ts > since
        # Once capturing is on, include continuation lines (no timestamp)
        if capturing:
            result.append(line)

    return result


def contains_real_errors(lines: list[str]) -> bool:
    for line in lines:
        if NOISE_RE.search(line):
            continue
        if APP_ERROR_RE.search(line):
            return True
    return False


def main():
    input_data = json.load(sys.stdin)

    # Prevent infinite loops — if Claude is already continuing from
    # a previous stop-hook block, let it finish this time.
    if input_data.get("stop_hook_active", False):
        save_current_ts()
        sys.exit(0)

    since = load_last_ts()
    new_lines = read_new_lines(since)
    save_current_ts()

    if not new_lines or not contains_real_errors(new_lines):
        sys.exit(0)

    # Cap the dump so we don't blow up context
    if len(new_lines) > 150:
        new_lines = new_lines[-150:]
        new_lines.insert(0, "... (earlier lines truncated, see .blitz/metro.log)\n")

    log_dump = "".join(new_lines).strip()

    output = {
        "decision": "block",
        "reason": (
            "Errors detected in .blitz/metro.log since your last changes. "
            "Review the logs below and fix the issues before finishing.\n\n"
            f"--- metro.log (since last check) ---\n{log_dump}\n--- end ---"
        ),
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
