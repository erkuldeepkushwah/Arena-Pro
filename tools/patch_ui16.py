#!/usr/bin/env python3
"""One-off patch: the New tab renders the complete match form (all fields),
not just the game/status row."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")

OLD = 'esportsTab === "upcoming"'
NEW = '(esportsTab === "upcoming" || esportsTab === "new")'


def main() -> int:
    path = ROOT / "components" / "AdminDashboard.tsx"
    src = path.read_text(encoding="utf-8")

    found = src.count(OLD)
    if found != 4:
        print(f"PATCH ABORTED - expected 4 occurrences, found {found}")
        return 1

    src = src.replace(OLD, NEW)
    path.write_text(src, encoding="utf-8")
    print("Patched: New tab shows the full match form.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
