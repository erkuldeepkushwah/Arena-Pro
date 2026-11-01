#!/usr/bin/env python3
"""One-off patch: the whole match form (including the Result panel with the
joined-player list) was nested inside `esportsTab === "new"`, so it only ever
rendered on the New tab. Render it whenever the card is expanded instead."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")

OLD = '                      {esportsTab === "new" && expandedMatch === t.id && ('
NEW = "                      {expandedMatch === t.id && ("


def main() -> int:
    path = ROOT / "components" / "AdminDashboard.tsx"
    src = path.read_text(encoding="utf-8")

    found = src.count(OLD)
    if found != 1:
        print(f"ABORT: expected 1 occurrence, found {found}")
        return 1

    src = src.replace(OLD, NEW)
    path.write_text(src, encoding="utf-8")
    print("Patched: match form renders on every tab when expanded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
