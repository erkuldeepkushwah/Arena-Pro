#!/usr/bin/env python3
"""One-off patch: swiping a match to Result also opens its panel, so the joined
player list + kill inputs are visible; and fall back to displayName for names."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

EDITS = [
    (
        '                        setEsportsTab(next === "ended" ? "result" : next === "live" ? "live" : "upcoming");\n'
        '                        window.dispatchEvent(new Event("admin_config_updated"));',
        '                        setEsportsTab(next === "ended" ? "result" : next === "live" ? "live" : "upcoming");\n'
        "                        setExpandedMatch(t.id);\n"
        '                        window.dispatchEvent(new Event("admin_config_updated"));',
        1,
    ),
    (
        '{u.tournamentDetails?.[t.id]?.inGameName || u.bankDetails?.mobileNumber || "Player"}',
        '{u.tournamentDetails?.[t.id]?.inGameName || u.displayName || u.bankDetails?.mobileNumber || "Player"}',
        1,
    ),
]


def main() -> int:
    path = ROOT / "components" / "AdminDashboard.tsx"
    src = path.read_text(encoding="utf-8")

    for old, new, expected in EDITS:
        found = src.count(old)
        if found != expected:
            problems.append(f"expected {expected}, found {found}: {old[:70]!r}")
        else:
            src = src.replace(old, new)

    if problems:
        print("PATCH ABORTED - no file written")
        for p in problems:
            print("  -", p)
        return 1

    path.write_text(src, encoding="utf-8")
    print("Patched: swipe to result opens the panel with player list.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
