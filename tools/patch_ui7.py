#!/usr/bin/env python3
"""One-off patch: admin Match/Cricket cards become clean summary cards.
Each card shows status / teams / entry fee / joined count, with the full edit
form behind an Edit toggle (same idea as the player app card)."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

CRICKET_OPEN_OLD = """                    <div
                      key={match.id}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50 relative"
                    >"""

CRICKET_OPEN_NEW = """                    <div
                      key={match.id}
                      className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm relative mb-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {match.title || "Untitled match"}
                          </p>
                          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                            {match.team1?.short || "T1"} vs {match.team2?.short || "T2"}
                            {match.time ? ` - ${match.time}` : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${match.status === "live" ? "bg-red-50 text-red-600" : match.status === "ended" ? "bg-gray-100 text-gray-600" : "bg-purple-50 text-purple-600"}`}>
                              {(match.status || "upcoming").toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              Entry {match.entryFee || 0}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              {allUsers.filter((u) => u.joinedMatches && u.joinedMatches[match.id]).length} joined
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                          className="shrink-0 text-[12px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-3 py-1.5 rounded-lg"
                        >
                          {expandedMatch === match.id ? "Close" : "Edit"}
                        </button>
                      </div>

                      {expandedMatch === match.id && (
                        <>
                      <div className="mt-3 pt-3 border-t border-gray-100">"""

CRICKET_FOOT_OLD = """                      <div className="flex justify-end pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            const n = cricketMatches.filter("""

CRICKET_FOOT_NEW = """                      </div>
                        </>
                      )}

                      <div className="flex justify-end pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            const n = cricketMatches.filter("""

ESPORTS_OPEN_OLD = """                    <div
                      key={t.id}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50 relative mb-3"
                    >"""

ESPORTS_OPEN_NEW = """                    <div
                      key={t.id}
                      className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm relative mb-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {t.title || "Untitled match"}
                          </p>
                          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                            {t.game || "Game"}
                            {t.matchType ? ` - ${t.matchType}` : ""}
                            {t.map ? ` - ${t.map}` : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.status === "live" ? "bg-red-50 text-red-600" : t.status === "ended" ? "bg-gray-100 text-gray-600" : "bg-purple-50 text-purple-600"}`}>
                              {(t.status || "upcoming").toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              Entry {t.entryFee || 0}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              {allUsers.filter((u: any) => u.joinedTournaments?.includes(t.id)).length} / {t.totalSlots || 0} joined
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedMatch(expandedMatch === t.id ? null : t.id)}
                          className="shrink-0 text-[12px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-3 py-1.5 rounded-lg"
                        >
                          {expandedMatch === t.id ? "Close" : "Edit"}
                        </button>
                      </div>

                      {expandedMatch === t.id && (
                        <>
                      <div className="mt-3 pt-3 border-t border-gray-100">"""

ESPORTS_FOOT_OLD = """                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-3">
                        <span className="text-xs text-gray-500"></span>
                        <button
                          onClick={() => {
                            const n = tournaments.filter((_, i) => i !== index);"""

ESPORTS_FOOT_NEW = """                      </div>
                        </>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-3">
                        <span className="text-xs text-gray-500"></span>
                        <button
                          onClick={() => {
                            const n = tournaments.filter((_, i) => i !== index);"""

EDITS = [
    (
        '  const [createTab, setCreateTab] = useState<\n'
        '    "product" | "match" | "cricket" | "quiz"\n'
        '  >("product");',
        '  const [createTab, setCreateTab] = useState<\n'
        '    "product" | "match" | "cricket" | "quiz"\n'
        '  >("product");\n'
        "  const [expandedMatch, setExpandedMatch] = useState<any>(null);",
        1,
    ),
    (CRICKET_OPEN_OLD, CRICKET_OPEN_NEW, 1),
    (CRICKET_FOOT_OLD, CRICKET_FOOT_NEW, 1),
    (ESPORTS_OPEN_OLD, ESPORTS_OPEN_NEW, 1),
    (ESPORTS_FOOT_OLD, ESPORTS_FOOT_NEW, 1),
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
    print("Patched: admin match cards are now collapsible summary cards.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
