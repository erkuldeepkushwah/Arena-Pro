#!/usr/bin/env python3
"""One-off patch: remove the duplicated "Match" accordion header inside the
Match panel (the panel title already says Match), and keep the body open."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

HDR_OLD = """              <div
                className={`flex justify-between items-center w-full p-4 ${esportsExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                <button
                  onClick={() => setEsportsExpanded(!esportsExpanded)}
                  className="flex-1 flex justify-between items-center font-bold text-[#374151] text-[15px]"
                >
                  Match
                  {esportsExpanded ? (
                    <ChevronUp className="text-gray-500 w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="text-gray-500 w-5 h-5 ml-2" />
                  )}
                </button>
              </div>

"""

EDITS = [
    (HDR_OLD, "", 1),
    (
        "  const [esportsExpanded, setEsportsExpanded] = useState(false);",
        "  const [esportsExpanded, setEsportsExpanded] = useState(true);",
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
    print("Patched: duplicate Match header removed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
