#!/usr/bin/env python3
"""One-off patch: clicking the "New" tab (or Add Match) opens the create form
instead of jumping to Upcoming."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

EDITS = [
    (
        "                    // Jump straight to Upcoming so the new row is visible, and\n"
        "                    // open the accordion on it.\n"
        '                    setEsportsTab("upcoming");',
        "                    // Stay on the New tab so the create form is visible.\n"
        '                    setEsportsTab("new");',
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
    print("Patched: New tab opens the create form.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
