#!/usr/bin/env python3
"""One-off patch:
1. New tab no longer filters out freshly created matches.
2. Joined-player lookups also read the match's joinedPlayers list.
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")

FILTER_OLD = "u.joinedTournaments?.includes(t.id)"
FILTER_NEW = "(u.joinedTournaments?.includes(t.id) || (t.joinedPlayers || []).includes(u.uid))"

NEWTAB_OLD = "if (esportsTab === 'new') return t.id === expandedMatch && !t.status; // only the match being edited"
NEWTAB_NEW = "if (esportsTab === 'new') return t.id === expandedMatch; // the match being created/edited"


def main() -> int:
    path = ROOT / "components" / "AdminDashboard.tsx"
    src = path.read_text(encoding="utf-8")

    found = src.count(FILTER_OLD)
    if found != 6:
        print(f"ABORT: expected 6 joined filters, found {found}")
        return 1
    src = src.replace(FILTER_OLD, FILTER_NEW)

    if src.count(NEWTAB_OLD) != 1:
        print("ABORT: new-tab filter not found")
        return 1
    src = src.replace(NEWTAB_OLD, NEWTAB_NEW)

    path.write_text(src, encoding="utf-8")
    print("Patched: new-tab filter + joined-player lookup.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
