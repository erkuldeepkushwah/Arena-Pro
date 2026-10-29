#!/usr/bin/env python3
"""One-off patch:
1. Player-facing theme: swap the purple palette for the admin panel's blue/grey.
2. Admin Match/Cricket: the Live button advances status (Live -> Result) and
   opens the panel.
3. Add Match opens the new match's create/edit panel straight away.
"""

import re
import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

HEX_MAP = {
    "#6d28d9": "#2563eb",
    "#5e35b1": "#1e40af",
    "#8b5cf6": "#3b82f6",
    "#8042f6": "#2563eb",
    "#a855f7": "#3b82f6",
    "#311a89": "#1e3a8a",
    "#14122c": "#1f2937",
    "#f8f9fe": "#f4f5f7",
    "#f5f3ff": "#eff6ff",
    "#f8f5ff": "#eff6ff",
    "#5b21b6": "#1e40af",
}

HEX_RE = re.compile("|".join(re.escape(k) for k in HEX_MAP), re.IGNORECASE)


def swap_theme() -> int:
    changed = 0
    for path in sorted(ROOT.rglob("*.tsx")):
        if path.name == "AdminDashboard.tsx":
            continue
        src = path.read_text(encoding="utf-8")
        out = HEX_RE.sub(lambda m: HEX_MAP[m.group(0).lower()], src)
        out = out.replace("purple-", "blue-")
        if out != src:
            path.write_text(out, encoding="utf-8")
            changed += 1
    return changed


CRICKET_BTN_OLD = """                        <button
                          onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                          className="shrink-0 text-[12px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-3 py-1.5 rounded-lg"
                        >
                          {expandedMatch === match.id ? "Close" : "Live"}
                        </button>"""

CRICKET_BTN_NEW = """                        <button
                          onClick={() => {
                            if (expandedMatch === match.id) {
                              setExpandedMatch(null);
                              return;
                            }
                            setExpandedMatch(match.id);
                            const next =
                              match.status === "upcoming"
                                ? "live"
                                : match.status === "live"
                                  ? "ended"
                                  : "upcoming";
                            setCricketMatches(patchAt(cricketMatches, index, { status: next }));
                            window.dispatchEvent(new Event("admin_config_updated"));
                          }}
                          className="shrink-0 text-[12px] font-bold text-white bg-[#2563eb] px-3 py-1.5 rounded-lg"
                        >
                          {expandedMatch === match.id
                            ? "Close"
                            : match.status === "upcoming"
                              ? "Live"
                              : match.status === "live"
                                ? "Result"
                                : "Open"}
                        </button>"""

ESPORTS_BTN_OLD = """                        <button
                          onClick={() => setExpandedMatch(expandedMatch === t.id ? null : t.id)}
                          className="shrink-0 text-[12px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-3 py-1.5 rounded-lg"
                        >
                          {expandedMatch === t.id ? "Close" : "Live"}
                        </button>"""

ESPORTS_BTN_NEW = """                        <button
                          onClick={() => {
                            if (expandedMatch === t.id) {
                              setExpandedMatch(null);
                              return;
                            }
                            setExpandedMatch(t.id);
                            const next =
                              t.status === "upcoming"
                                ? "live"
                                : t.status === "live"
                                  ? "ended"
                                  : "upcoming";
                            setTournaments(
                              patchAt(tournaments, index, {
                                status: next,
                                ...(next === "live" ? { liveAt: Date.now() } : {}),
                                ...(next === "ended" ? { endedAt: Date.now() } : {}),
                              }),
                            );
                            window.dispatchEvent(new Event("admin_config_updated"));
                          }}
                          className="shrink-0 text-[12px] font-bold text-white bg-[#2563eb] px-3 py-1.5 rounded-lg"
                        >
                          {expandedMatch === t.id
                            ? "Close"
                            : t.status === "upcoming"
                              ? "Live"
                              : t.status === "live"
                                ? "Result"
                                : "Open"}
                        </button>"""

EDITS = [
    (CRICKET_BTN_OLD, CRICKET_BTN_NEW, 1),
    (ESPORTS_BTN_OLD, ESPORTS_BTN_NEW, 1),
    # Add Match -> open the new panel
    (
        "                        const newM = [newMatch, ...cricketMatches];\n"
        "                        setCricketMatches(newM);\n"
        "                        saveCricketMatches(newM);",
        "                        const newM = [newMatch, ...cricketMatches];\n"
        "                        setCricketMatches(newM);\n"
        "                        saveCricketMatches(newM);\n"
        "                        setExpandedMatch(newMatch.id);",
        1,
    ),
    (
        "                        const n = [newTournament, ...tournaments];\n"
        "                        setTournaments(n);\n"
        "                        saveMatchRooms(n);",
        "                        const n = [newTournament, ...tournaments];\n"
        "                        setTournaments(n);\n"
        "                        saveMatchRooms(n);\n"
        "                        setExpandedMatch(newTournament.id);",
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
        print("PATCH ABORTED - no files written")
        for p in problems:
            print("  -", p)
        return 1

    path.write_text(src, encoding="utf-8")
    changed = swap_theme()
    print(f"Patched AdminDashboard lifecycle; re-themed {changed} player files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
