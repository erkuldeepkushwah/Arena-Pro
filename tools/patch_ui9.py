#!/usr/bin/env python3
"""One-off patch: move Earn out of Task and into the Create dropdown."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

EDITS = [
    # createTab type
    (
        '  const [createTab, setCreateTab] = useState<\n'
        '    "product" | "match" | "cricket" | "quiz"\n'
        '  >("product");',
        '  const [createTab, setCreateTab] = useState<\n'
        '    "product" | "match" | "cricket" | "quiz" | "earn"\n'
        '  >("product");',
        1,
    ),
    # goToCreateTab signature
    (
        '  const goToCreateTab = (tab: "product" | "match" | "cricket" | "quiz") => {',
        '  const goToCreateTab = (tab: "product" | "match" | "cricket" | "quiz" | "earn") => {',
        1,
    ),
    # sidebar dropdown list
    (
        '                  {(["product", "match", "cricket", "quiz"] as const).map((tab) => (',
        '                  {(["product", "match", "cricket", "quiz", "earn"] as const).map((tab) => (',
        1,
    ),
    # Play shell should not show on the earn tab
    (
        '${activeSection === "create" && createTab !== "product" ? "" : "hidden"}',
        '${activeSection === "create" && createTab !== "product" && createTab !== "earn" ? "" : "hidden"}',
        1,
    ),
    # Earn section moves under Create
    (
        '<div id="admin-task" className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 ${activeSection === "task" ? "" : "hidden"}`}>',
        '<div id="admin-task" className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 ${activeSection === "create" && createTab === "earn" ? "" : "hidden"}`}>',
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
    print("Patched: Earn moved into the Create dropdown.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
