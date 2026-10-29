#!/usr/bin/env python3
"""One-off patch: give Cricket and Match a proper "Add Match" header card
(icon, title, subtitle, button) at the top of the list, and drop the small
duplicate button from the accordion header."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

CRICKET_HDR_OLD = """                {cricketExpanded && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        const newMatch = {
                          id: Date.now(),
                          team1: { name: "Team A", short: "TMA" },
                          team2: { name: "Team B", short: "TMB" },
                          title: "New Match",
                          time: "Apr 12, 7:00 PM",
                          entryFee: 10,
                          status: "upcoming",
                        };
                        const newM = [newMatch, ...cricketMatches];
                        setCricketMatches(newM);
                        saveCricketMatches(newM);
                        setExpandedMatch(newMatch.id);
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                      className="bg-[#8b5cf6] hover:bg-purple-600 text-white px-2 py-1 flex items-center gap-1 rounded text-xs transition-colors shadow-sm ml-4"
                      title="Add Match"
                    >
                      <Plus className="w-3 h-3" /> Add Match
                    </button>

                  </div>
                )}
"""

CRICKET_CARD = """                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[16px] text-[#111]">Add Match</p>
                      <p className="text-[12px] text-gray-500">Create and manage your matches</p>
                    </div>
                    <button
                      onClick={() => {
                        const newMatch = {
                          id: Date.now(),
                          team1: { name: "Team A", short: "TMA" },
                          team2: { name: "Team B", short: "TMB" },
                          title: "New Match",
                          time: "Apr 12, 7:00 PM",
                          entryFee: 10,
                          status: "upcoming",
                        };
                        const newM = [newMatch, ...cricketMatches];
                        setCricketMatches(newM);
                        saveCricketMatches(newM);
                        setExpandedMatch(newMatch.id);
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                      className="shrink-0 bg-[#2563eb] text-white font-bold text-[13px] px-4 py-2 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Match
                    </button>
                  </div>
"""

ESPORTS_HDR_OLD = """                {esportsExpanded && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        const newTournament = {
                          id: Date.now(),
                          game: "Free Fire Max",
                          title: "New Match",
                          date: "2024-06-01",
                          time: "08:00 PM",
                          entryFee: 10,
                          perKill: 5,
                          prizePool: 500,
                          matchType: "Squad",
                          map: "Bermuda",
                          status: "upcoming",
                          totalSlots: 40,
                          joinedPlayers: [],
                          roomDetails: { id: "", password: "" },
                          streamLink: "",
                          results: [],
                        };
                        const n = [newTournament, ...tournaments];
                        setTournaments(n);
                        saveMatchRooms(n);
                        setExpandedMatch(newTournament.id);
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                      className="bg-[#8b5cf6] hover:bg-purple-600 text-white px-2 py-1 flex items-center gap-1 rounded text-xs transition-colors shadow-sm ml-4"
                    >
                      <Plus className="w-3 h-3" /> Add Match
                    </button>

                  </div>
                )}
"""

ESPORTS_CARD = """                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[16px] text-[#111]">Add Match</p>
                      <p className="text-[12px] text-gray-500">Create and manage your matches</p>
                    </div>
                    <button
                      onClick={() => {
                        const newTournament = {
                          id: Date.now(),
                          game: "Free Fire Max",
                          title: "New Match",
                          date: "2024-06-01",
                          time: "08:00 PM",
                          entryFee: 10,
                          perKill: 5,
                          prizePool: 500,
                          matchType: "Squad",
                          map: "Bermuda",
                          status: "upcoming",
                          totalSlots: 40,
                          joinedPlayers: [],
                          roomDetails: { id: "", password: "" },
                          streamLink: "",
                          results: [],
                        };
                        const n = [newTournament, ...tournaments];
                        setTournaments(n);
                        saveMatchRooms(n);
                        setExpandedMatch(newTournament.id);
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                      className="shrink-0 bg-[#2563eb] text-white font-bold text-[13px] px-4 py-2 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Match
                    </button>
                  </div>
"""

EDITS = [
    (CRICKET_HDR_OLD, "", 1),
    (ESPORTS_HDR_OLD, "", 1),
    (
        "              {cricketExpanded && (\n"
        '                <div className="p-4 space-y-4">\n'
        "                  {cricketMatches.map((match: any, index: number) => (",
        "              {cricketExpanded && (\n"
        '                <div className="p-4 space-y-4">\n'
        + CRICKET_CARD
        + "                  {cricketMatches.map((match: any, index: number) => (",
        1,
    ),
    (
        "              {esportsExpanded && (\n"
        '                <div className="p-4 space-y-4">\n'
        '                  <div className="flex bg-gray-100 p-1 rounded-lg">',
        "              {esportsExpanded && (\n"
        '                <div className="p-4 space-y-4">\n'
        + ESPORTS_CARD
        + '                  <div className="flex bg-gray-100 p-1 rounded-lg">',
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
    print("Patched: Add Match header card for cricket and match.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
